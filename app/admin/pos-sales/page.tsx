import { prisma } from "@/lib/db";
function euro(v:unknown){return new Intl.NumberFormat("nl-BE",{style:"currency",currency:"EUR"}).format(Number(v));}
function dt(v:Date){return new Intl.DateTimeFormat("nl-BE",{dateStyle:"short",timeStyle:"short"}).format(v);}
export default async function AdminPosSales(){
 const start=new Date();start.setHours(0,0,0,0);
 const [sales,day,cash,card]=await Promise.all([
  prisma.posSale.findMany({include:{user:true,items:true,returns:true},orderBy:{createdAt:"desc"},take:200}),
  prisma.posSale.aggregate({where:{createdAt:{gte:start},status:{not:"VOIDED"}},_sum:{total:true},_count:true}),
  prisma.posSale.aggregate({where:{createdAt:{gte:start},paymentMethod:"CASH",status:{not:"VOIDED"}},_sum:{total:true}}),
  prisma.posSale.aggregate({where:{createdAt:{gte:start},paymentMethod:"CARD",status:{not:"VOIDED"}},_sum:{total:true}}),
 ]);
 return <main className="admin-shell"><section className="admin-card"><div className="topbar"><div><a className="back" href="/admin">← Beheer</a><h1>Kassaverkopen</h1></div><a className="btn" href="/pos">Open kassa</a></div>
  <div className="stock-cards"><div><span>Omzet vandaag</span><strong>{euro(day._sum.total??0)}</strong></div><div><span>Verkopen vandaag</span><strong>{day._count}</strong></div><div><span>Cash</span><strong>{euro(cash._sum.total??0)}</strong></div><div><span>Kaart</span><strong>{euro(card._sum.total??0)}</strong></div></div>
  <div className="table-wrap responsive-table"><table><thead><tr><th>Bon</th><th>Datum</th><th>Kassier</th><th>Betaling</th><th>Status</th><th>Retouren</th><th>Totaal</th></tr></thead><tbody>{sales.map(s=><tr key={s.id}><td data-label="Bon"><a className="link" href={`/pos/receipt/${s.saleNumber}`}>{s.saleNumber}</a></td><td data-label="Datum">{dt(s.createdAt)}</td><td data-label="Kassier">{s.user.firstName||s.user.email}</td><td data-label="Betaling">{s.paymentMethod==="CASH"?"Cash":"Kaart"}</td><td data-label="Status">{s.status}</td><td data-label="Retouren">{s.returns.length}</td><td data-label="Totaal"><strong>{euro(s.total)}</strong></td></tr>)}</tbody></table></div>
 </section></main>;
}
