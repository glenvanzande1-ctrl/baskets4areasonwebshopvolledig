import { prisma } from "@/lib/db";
import PosReturnForm from "@/components/PosReturnForm";

export default async function ReturnPage({searchParams}:{searchParams:Promise<{sale?:string}>}){
  const {sale:query}=await searchParams;
  const sale=query?await prisma.posSale.findUnique({where:{saleNumber:query.trim()},include:{items:{include:{returnItems:true}}}}):null;
  return <main className="pos"><section className="pos-panel"><div className="topbar"><div><div className="brand">Baskets4areason</div><h1>Retour fysieke winkel</h1></div><a className="btn secondary" href="/pos">Terug naar kassa</a></div>
    <form className="inline-form" method="get"><label style={{flex:1}}>Bonnummer<input className="input" name="sale" defaultValue={query||""} placeholder="POS-20261012-ABC123" autoFocus/></label><button className="btn" type="submit">Zoeken</button></form>
    {query&&!sale&&<p className="error">Geen kassabon gevonden met nummer {query}.</p>}
    {sale&&<PosReturnForm saleId={sale.id} saleNumber={sale.saleNumber} items={sale.items.map(i=>({id:i.id,productName:i.productName,variantLabel:i.variantLabel,quantity:i.quantity,returned:i.returnItems.reduce((s,r)=>s+r.quantity,0),unitPrice:Number(i.unitPrice)}))}/>} 
  </section></main>;
}
