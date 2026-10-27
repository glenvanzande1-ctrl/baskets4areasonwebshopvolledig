import StoreHeader from "@/components/StoreHeader";
import StoreFooter from "@/components/StoreFooter";
import StoreProductCard from "@/components/StoreProductCard";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ categorie?: string; q?: string }> }) {
  const { categorie, q } = await searchParams;
  const query = q?.trim();
  const [categories, products] = await Promise.all([
    prisma.category.findMany({ where: { active: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
    prisma.product.findMany({
      where: {
        active: true,
        ...(categorie ? { category: { slug: categorie } } : {}),
        ...(query ? { OR: [{ name: { contains: query, mode: "insensitive" } }, { description: { contains: query, mode: "insensitive" } }] } : {}),
        variants: { some: { active: true } },
      },
      include: {
        category: true,
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
        variants: { where: { active: true }, orderBy: { price: "asc" }, take: 1 },
      },
      orderBy: { name: "asc" },
    }),
  ]);
  const current = categories.find((c) => c.slug === categorie);

  return (
    <>
      <StoreHeader />
      <main className="store-main shop-page new-shop-page">
        <div className="new-shop-heading">
          <span>Webshop</span>
          <h1>{query ? `Zoeken naar “${query}”` : current?.name ?? "Onze collectie"}</h1>
          <p>{query ? `${products.length} product${products.length === 1 ? "" : "en"} gevonden.` : current ? `Bekijk alle producten binnen ${current.name}.` : "Ontdek ontbijtmanden, tapas, chocolade, cadeaus en originele geschenken."}</p>
        </div>
        <div className="new-category-chips">
          <a className={!categorie ? "active" : ""} href={query ? `/producten?q=${encodeURIComponent(query)}` : "/producten"}>Alles</a>
          {categories.map((c) => <a className={categorie === c.slug ? "active" : ""} href={`/producten?categorie=${c.slug}${query ? `&q=${encodeURIComponent(query)}` : ""}`} key={c.id}>{c.name}</a>)}
        </div>
        <div className="shop-card-grid shop-all-grid">
          {products.map((p) => (
            <StoreProductCard
              key={p.id}
              slug={p.slug}
              name={p.name}
              category={p.category?.name}
              image={p.images[0]?.url}
              imageAlt={p.images[0]?.altText}
              price={p.variants[0] ? Number(p.variants[0].price).toFixed(2).replace(".", ",") : null}
            />
          ))}
        </div>
        {products.length === 0 && <div className="empty-state">Geen producten gevonden.</div>}
      </main>
      <StoreFooter />
    </>
  );
}
