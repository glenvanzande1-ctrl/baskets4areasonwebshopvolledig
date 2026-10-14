import StoreHeader from "@/components/StoreHeader";
import StoreFooter from "@/components/StoreFooter";
import { prisma } from "@/lib/db";

export default async function StoreHome() {
  const [products,categories] = await Promise.all([
    prisma.product.findMany({
      where:{active:true,variants:{some:{active:true}}},
      include:{category:true,images:{orderBy:{sortOrder:"asc"},take:1},variants:{where:{active:true},orderBy:{price:"asc"},take:1}},
      orderBy:{createdAt:"desc"},
      take:8
    }),
    prisma.category.findMany({where:{active:true},orderBy:[{sortOrder:"asc"},{name:"asc"}],take:6})
  ]);

  return <>
    <StoreHeader/>
    <main>
      <section className="bright-hero">
        <div className="bright-hero-inner">
          <div className="hero-copy">
            <span className="eyebrow gold">Baskets4areason · Zele</span>
            <h1>Geef iets moois.<br/><em>Met een reden.</em></h1>
            <p>Ontbijtmanden, tapas, pralines, decoratie en originele geschenken — met zorg samengesteld voor elk bijzonder moment.</p>
            <div className="hero-actions">
              <a className="btn gold-btn" href="/producten">Ontdek de collectie</a>
              <a className="text-link-light" href="#categorieen">Bekijk categorieën →</a>
            </div>
            <div className="hero-badges"><span>Ontbijt & tapas</span><span>Cadeaus</span><span>Afhalen in Zele</span></div>
          </div>
          <div className="hero-mark" aria-hidden="true">
            <div className="hero-logo-frame"><img src="/baskets4areason-logo.png" alt=""/></div>
          </div>
        </div>
      </section>

      <section className="store-main trust-strip-wrap">
        <div className="trust-strip">
          <div><span>01</span><strong>Met zorg samengesteld</strong><small>Voor elk moment een passend geschenk.</small></div>
          <div><span>02</span><strong>Afhalen in Zele</strong><small>Bestel online en haal gemakkelijk af.</small></div>
          <div><span>03</span><strong>Veilig betalen</strong><small>Betalen via de beveiligde omgeving van Mollie.</small></div>
        </div>
      </section>

      <section className="store-main" id="categorieen">
        <div className="section-head elegant-head"><div><span className="eyebrow">Shop per categorie</span><h2>Voor ieder moment</h2></div><a className="gold-link" href="/producten">Alles bekijken →</a></div>
        <div className="category-feature-grid">
          {categories.map((c,i)=><a className={`category-feature category-${(i%3)+1}`} href={`/producten?categorie=${c.slug}`} key={c.id}><span>{String(i+1).padStart(2,"0")}</span><h3>{c.name}</h3><small>Ontdek de collectie →</small></a>)}
        </div>
      </section>

      <section className="store-main product-section">
        <div className="section-head elegant-head"><div><span className="eyebrow">Geselecteerd voor jou</span><h2>Nieuw in de shop</h2></div><a className="gold-link" href="/producten">Volledige shop →</a></div>
        <div className="product-grid premium-grid">{products.map(p=><a className="product-card premium-card" href={`/product/${p.slug}`} key={p.id}><div className="product-image">{p.images[0]?.url ? <img src={p.images[0].url} alt={p.images[0].altText ?? p.name}/> : <span className="image-placeholder">Foto volgt</span>}</div><div className="product-info">{p.category && <span className="eyebrow">{p.category.name}</span>}<h3>{p.name}</h3><div className="product-price">vanaf € {p.variants[0]?.price.toString().replace('.', ',')}</div></div></a>)}</div>
      </section>

      <section className="story-band">
        <div className="story-inner">
          <div><span className="eyebrow gold">Sinds 2017</span><h2>Geschenken die blijven hangen.</h2></div>
          <p>Baskets4areason staat voor ontbijt- en geschenkmanden met smaak. Van een klein gebaar tot een uitgebreide mand: zorgvuldig gekozen, mooi gepresenteerd en klaar om iemand blij te maken.</p>
        </div>
      </section>
    </main>
    <StoreFooter/>
  </>;
}
