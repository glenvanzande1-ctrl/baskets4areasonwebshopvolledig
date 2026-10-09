import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function AdminPage() {
  const session = await getSession();
  const [users, taxRates] = await Promise.all([prisma.user.count(), prisma.taxRate.findMany({ orderBy: { percentage: "asc" } })]);

  return (
    <main className="shell">
      <section className="card">
        <div className="topbar"><div><div className="brand">Baskets4areason</div><h1>Beheer</h1></div><a className="btn" href="/pos">Fysieke winkel / Kassa</a></div>
        <p className="muted">Ingelogd als {session?.email} ({session?.role}).</p>
        <div className="grid">
          <div className="tile"><strong>Gebruikers</strong>{users} personeelsaccount(s)</div>
          <div className="tile"><strong>BTW-tarieven</strong>{taxRates.map(t => `${t.percentage}%`).join(" · ") || "Seed uitvoeren"}</div>
          <div className="tile"><strong>Producten</strong>Komt in fase 2</div>
          <div className="tile"><strong>Voorraad</strong>Komt in fase 3</div>
        </div>
      </section>
    </main>
  );
}
