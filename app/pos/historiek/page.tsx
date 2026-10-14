import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
function euro(v: unknown){return new Intl.NumberFormat("nl-BE",{style:"currency",currency:"EUR"}).format(Number(v));}
function dt(v:Date){return new Intl.DateTimeFormat("nl-BE",{dateStyle:"short",timeStyle:"short"}).format(v);}
export default async function PosHistoryPage(){
  const session=await getSession(); if(!session)return null;
  const sales=await prisma.posSale.findMany({include:{user:true,items:true},orderBy:{createdAt:"desc"},take:100});
  return <main className="pos"><section className="pos-panel"><div className="topbar"><div><div className="brand">Baskets4areason</div><h1>Kassahistoriek</h1></div><a className="btn secondary" href="/pos">Terug naar kassa</a></div>
    <div className="table-wrap"><table><thead><tr><th>Bon</th><th>Datum</th><th>Kassier</th><th>Artikelen</th><th>Betaling</th><th>Status</th><th>Totaal</th><th></th></tr></thead><tbody>{sales.map(s=><tr key={s.id}><td><strong>{s.saleNumber}</strong></td><td>{dt(s.createdAt)}</td><td>{s.user.firstName||s.user.email}</td><td>{s.items.reduce((a,i)=>a+i.quantity,0)}</td><td>{s.paymentMethod==="CASH"?"Cash":"Kaart"}</td><td>{s.status}</td><td><strong>{euro(s.total)}</strong></td><td><a className="link" href={`/pos/receipt/${s.saleNumber}`}>Bon</a></td></tr>)}</tbody></table></div>
  </section></main>;
}
