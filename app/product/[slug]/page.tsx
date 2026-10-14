import { notFound } from "next/navigation";
import StoreHeader from "@/components/StoreHeader";
import StoreFooter from "@/components/StoreFooter";
import AddToCart from "@/components/AddToCart";
import ProductGallery from "@/components/ProductGallery";
import { prisma } from "@/lib/db";
import { variantLabel } from "@/lib/cart";

export default async function ProductPage({params}:{params:Promise<{slug:string}>}) {
  const {slug}=await params;
  const product=await prisma.product.findUnique({where:{slug},include:{category:true,images:{orderBy:{sortOrder:"asc"}},variants:{where:{active:true},include:{inventoryStocks:{include:{location:true}}},orderBy:{price:"asc"}}}});
  if(!product||!product.active) notFound();
  const variants=product.variants.map(v=>{ const stock=v.inventoryStocks.reduce((n,s)=>n+Math.max(0,s.onHand-s.reserved),0); return {id:v.id,label:variantLabel(v),price:v.price.toFixed(2).replace('.',','),available:stock}; });
  return <><StoreHeader/><main className="store-main product-page"><a className="back gold-link" href="/producten">← Terug naar shop</a><div className="product-detail premium-detail"><ProductGallery productName={product.name} images={product.images.map(i=>({id:i.id,url:i.url,altText:i.altText}))}/><div className="product-copy">{product.category&&<span className="eyebrow">{product.category.name}</span>}<h1>{product.name}</h1>{product.description&&<p className="product-description">{product.description}</p>}<div className="detail-divider"/><AddToCart variants={variants}/><div className="detail-benefits"><span>✓ Centrale realtime voorraad</span><span>✓ Veilig betalen via Mollie</span><span>✓ Afhalen in Zele</span></div></div></div></main><StoreFooter/></>;
}
