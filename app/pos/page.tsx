import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import PosRegister from "@/components/PosRegister";

function euro(value: unknown) {
  return new Intl.NumberFormat("nl-BE", { style: "currency", currency: "EUR" }).format(Number(value));
}

export default async function PosPage() {
  const session = await getSession();
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const [today, salesCount] = await Promise.all([
    prisma.posSale.aggregate({ where: { createdAt: { gte: start }, status: { not: "VOIDED" } }, _sum: { total: true } }),
    prisma.posSale.count({ where: { createdAt: { gte: start }, status: { not: "VOIDED" } } }),
  ]);
  return (
    <main className="pos">
      <section className="pos-panel">
        <div className="topbar pos-topbar">
          <div><div className="brand">Baskets4areason</div><h1>Fysieke winkel / Kassa</h1><p className="muted">{session?.email} · vandaag {salesCount} verkoop/verkoop(en) · {euro(today._sum.total ?? 0)}</p></div>
          <div className="actions">
            <a className="btn secondary" href="/pos/retour">Retour</a>
            <a className="btn secondary" href="/pos/historiek">Historiek</a>
            {session?.role !== "CASHIER" && <a className="btn secondary" href="/admin">Beheer</a>}
          </div>
        </div>
        <PosRegister />
      </section>
    </main>
  );
}
