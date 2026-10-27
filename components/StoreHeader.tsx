import { readCart } from "@/lib/cart";
import { getCustomerSession } from "@/lib/customer-auth";
import { prisma } from "@/lib/db";

function Icon({ name }: { name: "search" | "user" | "heart" | "cart" | "menu" }) {
  const common = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (name === "search") return <svg {...common}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/></svg>;
  if (name === "user") return <svg {...common}><circle cx="12" cy="8" r="4"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/></svg>;
  if (name === "heart") return <svg {...common}><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"/></svg>;
  if (name === "cart") return <svg {...common}><path d="M3 4h2l2.2 10.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L20.5 8H6.2"/><circle cx="10" cy="20" r="1"/><circle cx="18" cy="20" r="1"/></svg>;
  return <svg {...common}><path d="M4 7h16M4 12h16M4 17h16"/></svg>;
}

export default async function StoreHeader() {
  const [cart, customer, categories] = await Promise.all([
    readCart(),
    getCustomerSession(),
    prisma.category.findMany({ where: { active: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }], take: 7 }),
  ]);
  const count = cart?.items.reduce((n, item) => n + item.quantity, 0) ?? 0;

  return (
    <>
      <div className="shop-benefit-bar">
        <span>🚚 <b>Afhalen in Zele</b></span>
        <span>🎁 <b>Met zorg samengesteld</b></span>
        <span>♡ <b>Persoonlijke cadeaus</b></span>
        <span>★ <b>Ontbijt & geschenkmanden met smaak</b></span>
      </div>
      <header className="shop-header">
        <div className="shop-header-main">
          <details className="shop-mobile-menu">
            <summary aria-label="Menu openen"><Icon name="menu" /></summary>
            <nav>
              <a href="/producten">Alle cadeaus</a>
              {categories.map((c) => <a href={`/producten?categorie=${c.slug}`} key={c.id}>{c.name}</a>)}
              <a href={customer ? "/account" : "/account/login"}>{customer ? "Mijn account" : "Inloggen"}</a>
            </nav>
          </details>

          <a className="shop-brand" href="/" aria-label="Baskets4areason home">
            <img src="/baskets4areason-logo.png" alt="Baskets4areason" />
          </a>

          <form className="shop-search" action="/producten" method="get">
            <input name="q" type="search" placeholder="Zoek naar cadeaus, geschenkmanden, chocolade..." aria-label="Zoeken" />
            <button type="submit" aria-label="Zoeken"><Icon name="search" /></button>
          </form>

          <div className="shop-header-actions">
            <a href={customer ? "/account" : "/account/login"} aria-label="Mijn account"><Icon name="user" /><small>{customer ? "Mijn account" : "Inloggen"}</small></a>
            <a className="shop-desktop-favorite" href="/producten" aria-label="Favorieten"><Icon name="heart" /><small>Favorieten</small></a>
            <a className="shop-cart-action" href="/winkelmand" aria-label={`Winkelmand, ${count} items`}><Icon name="cart" /><small>Winkelmand</small><span>{count}</span></a>
          </div>
        </div>

        <div className="shop-search-mobile">
          <form className="shop-search" action="/producten" method="get">
            <input name="q" type="search" placeholder="Zoek naar cadeaus, chocolade, bloemen..." aria-label="Zoeken" />
            <button type="submit" aria-label="Zoeken"><Icon name="search" /></button>
          </form>
        </div>

        <nav className="shop-category-nav" aria-label="Categorieën">
          <a href="/producten">Alle cadeaus</a>
          {categories.map((c) => <a href={`/producten?categorie=${c.slug}`} key={c.id}>{c.name}</a>)}
        </nav>
      </header>
    </>
  );
}
