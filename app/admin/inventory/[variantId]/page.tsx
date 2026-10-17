import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { availableStock } from "@/lib/inventory";
import InventoryAdjustForm from "@/components/InventoryAdjustForm";
import MinimumStockForm from "@/components/MinimumStockForm";

const labels: Record<string,string> = { RECEIPT:"Ontvangst", ADJUSTMENT_IN:"Correctie +", ADJUSTMENT_OUT:"Correctie -", DAMAGE:"Beschadigd/verloren", RETURN:"Retour", POS_SALE:"Kassaverkoop", ONLINE_SALE:"Online verkoop", RESERVATION_CONSUMED:"Reservering verkocht" };

export default async function InventoryDetail({ params }: { params: Promise<{ variantId: string }> }) {
  const { variantId } = await params;
  const [variant, location] = await Promise.all([
    prisma.productVariant.findUnique({ where: { id: variantId }, include: { product: true, taxRate: true } }),
    prisma.inventoryLocation.findFirst({ where: { active: true }, orderBy: [{ isDefault: "desc" }, { name: "asc" }] }),
  ]);
  if (!variant || !location) notFound();
  const stock = await prisma.inventoryStock.upsert({ where: { variantId_locationId: { variantId, locationId: location.id } }, update: {}, create: { variantId, locationId: location.id } });
  const movements = await prisma.inventoryMovement.findMany({ where: { variantId, locationId: location.id }, include: { user: true }, orderBy: { createdAt: "desc" }, take: 50 });
  const available = availableStock(stock.onHand, stock.reserved);
  const details = [variant.color, variant.size, variant.weightGrams ? `${variant.weightGrams} g` : null].filter(Boolean).join(" · ") || "Standaardvariant";

  return <main className="admin-shell"><section className="admin-card">
    <a className="back" href="/admin/inventory">← Voorraad</a>
    <div className="topbar"><div><h1>{variant.product.name}</h1><p className="muted">{details} · SKU {variant.sku}{variant.barcode ? ` · barcode ${variant.barcode}` : ""}</p></div><span className="badge ok">BTW {variant.taxRate.percentage.toString()}%</span></div>
    <div className="stock-cards"><div><span>Fysiek</span><strong>{stock.onHand}</strong></div><div><span>Gereserveerd</span><strong>{stock.reserved}</strong></div><div><span>Beschikbaar</span><strong>{available}</strong></div><div><span>Minimum</span><strong>{stock.minStock}</strong></div></div>

    <div className="section-title"><div><h2>Voorraad aanpassen</h2><p className="muted">Elke wijziging wordt als aparte mutatie bewaard.</p></div></div>
    <InventoryAdjustForm variantId={variant.id} locationId={location.id} />

    <div className="section-title"><div><h2>Voorraadwaarschuwing</h2><p className="muted">Een variant staat als laag wanneer beschikbaar ≤ minimum.</p></div></div>
    <MinimumStockForm variantId={variant.id} locationId={location.id} minStock={stock.minStock} />

    <div className="section-title"><div><h2>Mutatiehistoriek</h2><p className="muted">Laatste 50 wijzigingen voor {location.name}.</p></div></div>
    <div className="table-wrap responsive-table"><table><thead><tr><th>Datum</th><th>Type</th><th>Wijziging</th><th>Voorraad na</th><th>Notitie</th><th>Gebruiker</th></tr></thead><tbody>
      {movements.length === 0 ? <tr><td colSpan={6} className="muted">Nog geen voorraadmutaties.</td></tr> : movements.map(m => <tr key={m.id}><td data-label="Datum">{new Intl.DateTimeFormat("nl-BE", { dateStyle:"short", timeStyle:"short" }).format(m.createdAt)}</td><td data-label="Type">{labels[m.type] ?? m.type}</td><td data-label="Wijziging" className={m.quantity > 0 ? "positive" : "negative"}>{m.quantity > 0 ? `+${m.quantity}` : m.quantity}</td><td data-label="Voorraad na">{m.stockAfter}</td><td data-label="Notitie">{m.note ?? "—"}</td><td data-label="Gebruiker">{m.user?.email ?? "Systeem"}</td></tr>)}
    </tbody></table></div>
  </section></main>;
}
