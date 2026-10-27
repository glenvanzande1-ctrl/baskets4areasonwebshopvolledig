import StoreHeader from "@/components/StoreHeader";
import StoreFooter from "@/components/StoreFooter";
import StoreProductCard from "@/components/StoreProductCard";
import { prisma } from "@/lib/db";

function price(value: { toString(): string } | undefined) {
  if (!value) return null;
  return Number(value.toString()).toFixed(2).replace(".", ",");
}

export default async function StoreHome() {
  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: { active: true, variants: { some: { active: true } } },
      include: {
        category: true,
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
        variants: { where: { active: true }, orderBy: { price: "asc" }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.category.findMany({
      where: { active: true },
      include: {
        products: {
          where: { active: true, variants: { some: { active: true } } },
          include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
          take: 1,
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      take: 8,
    }),
  ]);
  const bestsellers = products.slice(0, 4);
  const newest = products.slice(4, 8).length ? products.slice(4, 8) : products.slice(0, 4);

  return (
    <>
      <StoreHeader />
      <main className="new-storefront">
        <section className="shop-hero-wrap">
          <div className="shop-hero">
            <div className="shop-hero-copy">
              <span className="shop-kicker">Bijzondere momenten, met smaak</span>
              <h1>Cadeaus die<br />mensen raken <em>♡</em></h1>
              <p>Ontbijtmanden, tapas, chocolade, bloemen, decoratie en meer. Voor elke gelegenheid een bijzonder cadeau dat met zorg is samengesteld.</p>
              <a className="shop-primary-cta" href="/producten">Ontdek onze cadeaus <span>→</span></a>
              <div className="shop-hero-trust">
                <span>🎁 Met liefde samengesteld</span>
                <span>◇ Voor iedere gelegenheid</span>
                <span>♡ Persoonlijk en uniek</span>
              </div>
            </div>
            <div className="shop-hero-visual">
              <img src="/storefront-hero.png" alt="Sfeervolle cadeaus en geschenken van Baskets4areason" />
              <div className="shop-hero-circle">Meer dan<br />een cadeau<br /><strong>Een gevoel</strong><br />♡</div>
            </div>
          </div>
        </section>

        <section className="shop-category-scroll" aria-label="Categorieën">
          {categories.map((c, i) => {
            const image = c.products[0]?.images[0]?.url;
            return (
              <a href={`/producten?categorie=${c.slug}`} className="shop-category-circle" key={c.id}>
                <span className="shop-category-image">
                  {image ? <img src={image} alt="" loading="lazy" /> : <span>{["🎁", "🥐", "🍫", "🌸", "🕯️", "🎀", "☕", "💝"][i % 8]}</span>}
                </span>
                <b>{c.name}</b>
                <small>→</small>
              </a>
            );
          })}
          <a href="/producten" className="shop-category-circle shop-category-all">
            <span className="shop-category-image"><span>＋</span></span><b>Alle cadeaus</b><small>→</small>
          </a>
        </section>

        <section className="shop-home-products">
          <div className="shop-home-block">
            <div className="shop-section-title"><h2>Bestsellers</h2><a href="/producten">Bekijk alles →</a></div>
            <div className="shop-card-grid">
              {bestsellers.map((p, index) => (
                <StoreProductCard
                  key={p.id}
                  slug={p.slug}
                  name={p.name}
                  category={p.category?.name}
                  image={p.images[0]?.url}
                  imageAlt={p.images[0]?.altText}
                  price={price(p.variants[0]?.price)}
                  badge={index === 0 ? "Populair" : null}
                />
              ))}
            </div>
          </div>

          <div className="shop-home-block">
            <div className="shop-section-title"><h2>Nieuw binnen</h2><a href="/producten">Bekijk alles →</a></div>
            <div className="shop-card-grid">
              {newest.map((p, index) => (
                <StoreProductCard
                  key={p.id}
                  slug={p.slug}
                  name={p.name}
                  category={p.category?.name}
                  image={p.images[0]?.url}
                  imageAlt={p.images[0]?.altText}
                  price={price(p.variants[0]?.price)}
                  badge={index === 0 ? "Nieuw" : null}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="shop-bottom-grid">
          <div className="shop-newsletter-card">
            <span className="shop-news-icon">✉</span>
            <div><h3>Ontdek meer cadeau-inspiratie</h3><p>Maak een account aan voor een vlotte checkout en een overzicht van je bestellingen.</p></div>
            <a href="/account/registreren">Account maken →</a>
          </div>
          <div className="shop-service-card">
            <span>🚚<small>Afhalen<br />in Zele</small></span>
            <span>🎁<small>Met zorg<br />samengesteld</small></span>
            <span>♡<small>Persoonlijke<br />service</small></span>
            <span>🔒<small>Veilig betalen<br />via Mollie</small></span>
          </div>
          <div className="shop-personal-card">
            <div><h3>Maak het extra persoonlijk</h3><p>Kies een cadeau voor een verjaardag, bedankje, geboorte of zomaar.</p><a href="/producten">Ontdek de collectie →</a></div>
          </div>
        </section>
      </main>
      <StoreFooter />
    </>
  );
}
