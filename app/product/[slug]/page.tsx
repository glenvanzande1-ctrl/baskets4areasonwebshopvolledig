import { notFound } from "next/navigation";
import StoreHeader from "@/components/StoreHeader";
import AddToCart from "@/components/AddToCart";
import { prisma } from "@/lib/db";
import { variantLabel } from "@/lib/cart";

export default async function ProductPage({params}:{params:Promise<{slug:string}>}) {
  const {slug}=await params;
  const product=await prisma.product.findUnique({where:{slug},include:{category:true,images:{orderBy:{sortOrder:"asc"}},variants:{where:{active:true},include:{inventoryStocks:{include:{location:true}}},orderBy:{price:"asc"}}}});
  if(!product||!product.active) notFound();
  const variants=product.variants.map(v=>{ const stock=v.inventoryStocks.reduce((n,s)=>n+Math.max(0,s.onHand-s.reserved),0); return {id:v.id,label:variantLabel(v),price:v.price.toFixed(2).replace('.',','),available:stock}; });
  return <><StoreHeader/><main className="store-main"><a className="back" href="/producten">← Terug naar shop</a><div className="product-detail"><div className="detail-image">{product.images[0]?.url?<img src={product.images[0].url} alt={product.images[0].altText??product.name}/>:<span>Productfoto volgt</span>}</div><div>{product.category&&<span className="eyebrow">{product.category.name}</span>}<h1>{product.name}</h1>{product.description&&<p className="product-description">{product.description}</p>}<AddToCart variants={variants}/><p className="muted small">Voorraad wordt centraal beheerd voor webshop en fysieke winkel.</p></div></div></main></>;
}
