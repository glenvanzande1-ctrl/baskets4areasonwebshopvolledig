export const dynamic = "force-dynamic";
export const revalidate = 0;

import { prisma } from "@/lib/db";
import { availableStock } from "@/lib/inventory";

export default async function InventoryPage() {
  const location = await prisma.inventoryLocation.findFirst({ where: { active: true }, orderBy: [{ isDefault: "desc" }, { name: "asc" }] });
  if (!location) return <main className="admin-shell"><section className="admin-card"><a className="back" href="/admin">← Beheer</a><h1>Voorraad</h1><p>Geen voorraadlocatie gevonden. Voer eerst <code>npm run db:seed</code> uit.</p></section></main>;

  const variants = await prisma.productVariant.findMany({
    where: {},
    include: { product: true, inventoryStocks: { where: { locationId: location.id } } },
    orderBy: [{ product: { name: "asc" } }, { sku: "asc" }],
  });

  const rows = variants.map(v => {
    const stock = v.inventoryStocks[0];
    const onHand = stock?.onHand ?? 0, reserved = stock?.reserved ?? 0, minStock = stock?.minStock ?? 0;
    return { v, onHand, reserved, minStock, available: availableStock(onHand, reserved) };
  });
  const lowCount = rows.filter(r => r.v.active && r.v.product.active && r.available <= r.minStock).length;

  return <main className="admin-shell"><section className="admin-card">
    <div className="topbar"><div><a className="back" href="/admin">← Beheer</a><h1>Voorraad</h1><p className="muted">Locatie: <strong>{location.name}</strong>. Fysiek, gereserveerd en beschikbaar per variant.</p></div><div className="inventory-summary"><strong>{lowCount}</strong><span>lage voorraad</span></div></div>
    <div className="table-wrap responsive-table"><table><thead><tr><th>Product / variant</th><th>SKU</th><th>Fysiek</th><th>Gereserveerd</th><th>Beschikbaar</th><th>Minimum</th><th>Status</th><th></th></tr></thead><tbody>
      {rows.length === 0 ? <tr><td colSpan={8} className="muted">Nog geen productvarianten.</td></tr> : rows.map(({v,onHand,reserved,available,minStock}) => {
        const variant = [v.color, v.size, v.weightGrams ? `${v.weightGrams} g` : null].filter(Boolean).join(" · ") || "Standaard";
        const low = available <= minStock;
        const inactive = !v.active || !v.product.active;
        return <tr key={v.id}><td data-label="Product / variant"><strong>{v.product.name}</strong><div className="small muted">{variant}</div></td><td data-label="SKU">{v.sku}</td><td data-label="Fysiek">{onHand}</td><td data-label="Gereserveerd">{reserved}</td><td data-label="Beschikbaar"><strong>{available}</strong></td><td data-label="Minimum">{minStock}</td><td data-label="Status">{inactive ? <span className="badge warn">Inactief</span> : <span className={`badge ${low ? "warn" : "ok"}`}>{low ? "Laag" : "OK"}</span>}</td><td data-label="Actie"><a className="link" href={`/admin/inventory/${v.id}`}>Beheren →</a></td></tr>;
      })}
    </tbody></table></div>
  </section></main>;
}
