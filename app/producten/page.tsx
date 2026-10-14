import StoreHeader from "@/components/StoreHeader";
import StoreFooter from "@/components/StoreFooter";
import { prisma } from "@/lib/db";

export default async function ProductsPage({searchParams}:{searchParams:Promise<{categorie?:string}>}) {
  const {categorie}=await searchParams;
  const [categories,products]=await Promise.all([
    prisma.category.findMany({where:{active:true},orderBy:[{sortOrder:"asc"},{name:"asc"}]}),
    prisma.product.findMany({where:{active:true, ...(categorie?{category:{slug:categorie}}:{}), variants:{some:{active:true}}},include:{category:true,images:{orderBy:{sortOrder:"asc"},take:1},variants:{where:{active:true},orderBy:{price:"asc"},take:1}},orderBy:{name:"asc"}})
  ]);
  const current=categories.find(c=>c.slug===categorie);
  return <><StoreHeader/><main className="store-main shop-page"><div className="shop-heading"><span className="eyebrow">Webshop</span><h1>{current?.name ?? "Onze collectie"}</h1><p>{current ? `Bekijk alle producten binnen ${current.name}.` : "Ontdek ontbijtmanden, tapas, cadeaus en originele geschenken."}</p></div><div className="category-chips elegant-chips"><a className={!categorie?"active":""} href="/producten">Alles</a>{categories.map(c=><a className={categorie===c.slug?"active":""} href={`/producten?categorie=${c.slug}`} key={c.id}>{c.name}</a>)}</div><div className="product-grid premium-grid">{products.map(p=><a className="product-card premium-card" href={`/product/${p.slug}`} key={p.id}><div className="product-image">{p.images[0]?.url?<img src={p.images[0].url} alt={p.name}/>:<span className="image-placeholder">Foto volgt</span>}</div><div className="product-info">{p.category&&<span className="eyebrow">{p.category.name}</span>}<h3>{p.name}</h3><div className="product-price">vanaf € {p.variants[0]?.price.toString().replace('.', ',')}</div></div></a>)}</div>{products.length===0&&<div className="empty-state">Geen producten gevonden in deze categorie.</div>}</main><StoreFooter/></>;
}
