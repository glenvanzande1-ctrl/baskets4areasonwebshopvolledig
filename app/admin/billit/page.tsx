import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { billitStatus } from "@/lib/billit";
import BillitRetryButton from "@/components/BillitRetryButton";

function fmt(d: Date | null | undefined) {
  return d ? new Intl.DateTimeFormat("nl-BE", { dateStyle: "short", timeStyle: "short" }).format(d) : "—";
}

export default async function BillitPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireAdmin();
  if (!session) redirect("/admin");

  const q = await searchParams;
  const status = await billitStatus();
  const syncs = await prisma.billitInvoiceSync.findMany({ orderBy: { updatedAt: "desc" }, take: 100 });
  const counts = await prisma.billitInvoiceSync.groupBy({ by: ["status"], _count: true });
  const c = (name: string) => counts.find((x) => x.status === name)?._count || 0;

  return (
    <main className="admin-shell">
      <section className="admin-card">
        <div className="topbar">
          <div>
            <a className="back" href="/admin">← Beheer</a>
            <h1>Billit facturatie</h1>
            <p className="muted">Automatische facturen voor betaalde webshoporders en kassaverkopen.</p>
          </div>
        </div>

        {q.error && <div className="error">{String(q.error)}</div>}

        <div className="stock-cards">
          <div><span>Omgeving</span><strong>{status.environment}</strong></div>
          <div><span>Authenticatie</span><strong>API key</strong></div>
          <div><span>Geslaagd</span><strong>{c("SENT")}</strong></div>
          <div><span>Mislukt</span><strong>{c("FAILED")}</strong></div>
        </div>

        <div className="checkout-step">
          <h2>Configuratie</h2>
          <p className="muted">PartyID: {status.partyId || "niet ingesteld"}</p>
          {!status.configured ? (
            <div className="error">
              Vul BILLIT_API_KEY en BILLIT_PARTY_ID in. Voor deze persoonlijke integratie is geen OAuth-login meer nodig.
            </div>
          ) : (
            <div className="success-message">✓ Billit API-key authenticatie is geconfigureerd.</div>
          )}
          <p className="muted">
            Sandbox en productie hebben elk hun eigen PartyID/API-key. Start altijd in sandbox en schakel pas na succesvolle tests over naar productie.
          </p>
        </div>

        <div className="checkout-step">
          <h2>Laatste synchronisaties</h2>
          <div className="table-wrap responsive-table">
            <table>
              <thead><tr><th>Bron</th><th>Nummer</th><th>Status</th><th>Billit ID</th><th>Pogingen</th><th>Laatste poging</th><th>Actie</th></tr></thead>
              <tbody>
                {syncs.map((s) => (
                  <tr key={s.id}>
                    <td data-label="Bron">{s.sourceType === "ORDER" ? "Webshop" : "Kassa"}</td>
                    <td data-label="Nummer">{s.sourceNumber}</td>
                    <td data-label="Status"><span className={s.status === "SENT" ? "badge ok" : "badge"}>{s.status}</span>{s.lastError && <small className="muted">{s.lastError}</small>}</td>
                    <td data-label="Billit ID">{s.billitOrderId || "—"}</td>
                    <td data-label="Pogingen">{s.attempts}</td>
                    <td data-label="Laatste poging">{fmt(s.lastAttemptAt)}</td>
                    <td data-label="Actie">{s.status !== "SENT" ? <BillitRetryButton syncId={s.id} /> : "✓"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!syncs.length && <p className="muted">Nog geen verkopen naar Billit gesynchroniseerd.</p>}
        </div>

        <div className="checkout-step">
          <h2>Belangrijk</h2>
          <ul className="check-list">
            <li>Gebruik BILLIT_ENV=&quot;sandbox&quot; zolang je test. Productie maakt echte facturen.</li>
            <li>De API-key hoort uitsluitend server-side in .env/Vercel Environment Variables en nooit in browsercode.</li>
            <li>De factuurnummers gebruiken momenteel de unieke webshop- en kassanummers als OrderNumber in Billit.</li>
            <li>Kassaverkopen worden standaard aan “{process.env.BILLIT_POS_CUSTOMER_NAME || "Particuliere klant"}” gekoppeld.</li>
            <li>Controleer de nummerreeks en B2C-facturatie vóór livegang met de boekhouder.</li>
          </ul>
        </div>
      </section>
    </main>
  );
}
