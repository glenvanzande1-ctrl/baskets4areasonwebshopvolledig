import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";

function State({ ok, text }: { ok: boolean; text: string }) {
  return <span className={ok ? "status-ok" : "status-warn"}>{ok ? "✓" : "!"} {text}</span>;
}

export default async function SystemPage() {
  const session = await requireAdmin();
  if (!session) redirect("/admin");

  let dbOk = false;
  try { await prisma.$queryRaw`SELECT 1`; dbOk = true; } catch {}

  const appUrl = process.env.APP_URL || "";
  const productionUrl = /^https:\/\//i.test(appUrl) && !/localhost|127\.0\.0\.1/i.test(appUrl);
  const dbUrl = process.env.DATABASE_URL || "";
  const serverlessPool = /:6543\//.test(dbUrl) && /pgbouncer=true/i.test(dbUrl);
  const mollieKey = process.env.MOLLIE_API_KEY || "";

  const checks = [
    ["Database", dbOk, dbOk ? "verbonden" : "niet bereikbaar"],
    ["AUTH_SECRET", Boolean(process.env.AUTH_SECRET && process.env.AUTH_SECRET.length >= 32), "sessiebeveiliging"],
    ["Mollie", Boolean(mollieKey), mollieKey.startsWith("live_") ? "LIVE key ingesteld" : mollieKey ? "test key ingesteld" : "niet ingesteld"],
    ["Resend", Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM), process.env.RESEND_API_KEY && process.env.EMAIL_FROM ? "e-mail geconfigureerd" : "niet volledig ingesteld"],
    ["Supabase Storage", Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_STORAGE_BUCKET), "productfoto-opslag"],
    ["APP_URL", Boolean(appUrl), appUrl || "niet ingesteld"],
    ["Productie-URL", productionUrl, productionUrl ? "HTTPS en niet lokaal" : "nog lokaal of niet-HTTPS"],
    ["DB serverless pool", serverlessPool, serverlessPool ? "transaction pooler + pgbouncer" : "controleer 6543 + pgbouncer=true voor Vercel"],
    ["DIRECT_URL", Boolean(process.env.DIRECT_URL), process.env.DIRECT_URL ? "migratieverbinding ingesteld" : "niet ingesteld"],
  ] as const;

  return <main className="shell report-page">
    <section className="card wide">
      <div className="topbar">
        <div><div className="brand">Baskets4areason</div><h1>Systeemcontrole</h1></div>
        <a className="btn secondary" href="/admin">← Beheer</a>
      </div>
      <p className="muted">Veilige controle van development- en productie-instellingen. Geheimen worden nooit weergegeven.</p>
      <div className="system-grid">
        {checks.map(([name, ok, description]) => <div className="report-box" key={name}><strong>{name}</strong><State ok={ok} text={description} /></div>)}
      </div>
      <div className="report-box">
        <h2>Voor livegang</h2>
        <ul className="check-list">
          <li>Publiceer eerst met Mollie <code>test_</code> en voer een volledige testorder uit op de publieke URL.</li>
          <li>Zet <code>APP_URL</code> op het echte HTTPS-domein en redeploy.</li>
          <li>Gebruik voor Vercel de Supabase Transaction pooler op <code>6543</code> met <code>pgbouncer=true</code>.</li>
          <li>Gebruik <code>prisma migrate deploy</code>, nooit <code>migrate dev</code>, voor toekomstige productiemigrations.</li>
          <li>Verifieer het Resend-domein en test alle transactionele mails.</li>
          <li>Controleer Supabase backups/retentie en voorzie minstens twee administratoraccounts.</li>
          <li>Schakel Mollie pas na de publieke end-to-end test om naar een <code>live_</code> key.</li>
          <li>Zebra-scanner en Epson-printer kunnen nadien fysiek op de kassapc getest worden.</li>
        </ul>
      </div>
    </section>
  </main>;
}
