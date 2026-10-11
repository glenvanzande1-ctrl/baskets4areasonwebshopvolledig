import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function AdminPage() {
  const session = await getSession();
  const location = await prisma.inventoryLocation.findFirst({ where: { active: true }, orderBy: [{ isDefault: "desc" }, { name: "asc" }] });
  const [users, taxRates, products, categories, variants] = await Promise.all([
    prisma.user.count(),
    prisma.taxRate.findMany({ orderBy: { percentage: "asc" } }),
    prisma.product.count(),
    prisma.category.count(),
    prisma.productVariant.findMany({ where: { active: true, product: { active: true } }, include: { inventoryStocks: location ? { where: { locationId: location.id } } : false } }),
  ]);
  const lowStock = variants.filter(v => { const s = location ? v.inventoryStocks[0] : undefined; return (s?.onHand ?? 0) - (s?.reserved ?? 0) <= (s?.minStock ?? 0); }).length;

  return (
    <main className="shell">
      <section className="card wide">
        <div className="topbar"><div><div className="brand">Baskets4areason</div><h1>Beheer</h1></div><div className="actions"><a className="btn secondary" href="/">Webshop bekijken</a><a className="btn" href="/pos">Fysieke winkel / Kassa</a></div></div>
        <p className="muted">Ingelogd als {session?.email} ({session?.role}).</p>
        <div className="grid">
          <div className="tile"><strong>Gebruikers</strong>{users} personeelsaccount(s)</div>
          <div className="tile"><strong>BTW-tarieven</strong>{taxRates.map(t => `${t.percentage}%`).join(" · ") || "Seed uitvoeren"}</div>
          <a className="tile" href="/admin/products"><strong>Producten</strong>{products} product(en) · beheren →</a>
          <a className="tile" href="/admin/categories"><strong>Categorieën</strong>{categories} categorie(ën) · beheren →</a>
          <a className="tile" href="/admin/inventory"><strong>Voorraad</strong>{lowStock} variant(en) laag · beheren →</a>
        </div>
      </section>
    </main>
  );
}
