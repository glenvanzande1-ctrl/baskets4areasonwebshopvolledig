import { prisma } from "@/lib/db";

// Dit overzicht mag niet als statische/cached pagina blijven hangen.
// Zo worden nieuw aangemaakte producten altijd meteen uit Supabase opgehaald.
export const dynamic = "force-dynamic";
export const revalidate = 0;

type ProductsPageProps = {
  searchParams?: Promise<{ created?: string; saved?: string; deleted?: string }>;
};

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const query = searchParams ? await searchParams : {};
  const products = await prisma.product.findMany({
    include: { category: true, variants: { include: { taxRate: true }, orderBy: { createdAt: "asc" } } },
    orderBy: { name: "asc" },
  });

  const message = query.created === "1"
    ? "Product succesvol aangemaakt."
    : query.saved === "1"
      ? "Product succesvol opgeslagen."
      : query.deleted === "1"
        ? "Product succesvol verwijderd."
        : null;

  return <main className="admin-shell"><section className="admin-card">
    <div className="topbar"><div><a className="back" href="/admin">← Beheer</a><h1>Producten</h1><p className="muted">Producten, varianten, barcode, prijs en BTW beheren.</p></div><a className="btn" href="/admin/products/new">+ Nieuw product</a></div>
    {message && <p className="success-box">✓ {message}</p>}
    <div className="table-wrap"><table><thead><tr><th>Product</th><th>Categorie</th><th>Varianten</th><th>Prijs</th><th>Status</th><th></th></tr></thead><tbody>
      {products.length === 0 ? <tr><td colSpan={6} className="muted">Nog geen producten.</td></tr> : products.map(p => {
        const prices = p.variants.map(v => Number(v.price));
        const priceText = prices.length ? (Math.min(...prices) === Math.max(...prices) ? `€ ${Math.min(...prices).toFixed(2)}` : `€ ${Math.min(...prices).toFixed(2)} – € ${Math.max(...prices).toFixed(2)}`) : "—";
        return <tr key={p.id}><td><strong>{p.name}</strong><div className="small muted">{p.slug}</div></td><td>{p.category?.name ?? "—"}</td><td>{p.variants.length}</td><td>{priceText}</td><td><span className={`badge ${p.active ? "ok" : "off"}`}>{p.active ? "Actief" : "Verborgen"}</span></td><td><a className="link" href={`/admin/products/${p.id}`}>Wijzigen →</a></td></tr>
      })}
    </tbody></table></div>
  </section></main>;
}
