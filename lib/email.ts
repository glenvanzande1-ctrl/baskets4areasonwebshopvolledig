import { prisma } from "@/lib/db";
function euro(v:unknown){return `€ ${Number(v).toFixed(2).replace(".",",")}`}
async function send(to:string,subject:string,html:string){
 const key=process.env.RESEND_API_KEY; const from=process.env.EMAIL_FROM; if(!key||!from){console.info(`[email skipped] ${subject} -> ${to}`);return false}
 const r=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:`Bearer ${key}`,"Content-Type":"application/json"},body:JSON.stringify({from,to:[to],subject,html})});
 if(!r.ok){console.error("Email failed",await r.text());return false} return true;
}
function shell(title:string,body:string){return `<div style="font-family:Arial,sans-serif;background:#f7f4ef;padding:28px"><div style="max-width:620px;margin:auto;background:white;border-radius:16px;padding:30px;border-top:5px solid #c8a06a"><h1 style="margin-top:0">${title}</h1>${body}<p style="color:#756b60;margin-top:28px">Baskets4areason · Zele</p></div></div>`}
export async function sendWelcomeEmail(customer:{email:string;firstName:string}){return send(customer.email,"Welkom bij Baskets4areason",shell(`Welkom, ${customer.firstName}!`,`<p>Je klantenaccount is aangemaakt. Je kunt voortaan je bestellingen en status opvolgen via Mijn account.</p>`))}
export async function sendOrderPaidEmail(orderId:string){
 const o=await prisma.order.findUnique({where:{id:orderId},include:{items:true}}); if(!o||o.confirmationEmailSentAt)return;
 const items=o.items.map(i=>`<li>${i.quantity}× ${i.productName} ${i.variantLabel?`<small>(${i.variantLabel})</small>`:""} — ${euro(i.lineTotal)}</li>`).join("");
 const ok=await send(o.customerEmail,`Bestelling ${o.orderNumber} bevestigd`,shell("Bedankt voor je bestelling",`<p>We hebben je betaling ontvangen.</p><p><strong>${o.orderNumber}</strong></p><ul>${items}</ul><p>Subtotaal: ${euro(o.subtotal)}<br/>Korting: ${euro(o.discountTotal)}<br/>Levering: ${euro(o.shippingTotal)}<br/><strong>Totaal: ${euro(o.total)}</strong></p><p>${o.fulfillmentMethod==="PICKUP"?"Je ontvangt nog een bericht zodra je bestelling klaarstaat voor afhaling.":"We houden je op de hoogte zodra je bestelling verzonden wordt."}</p>`));
 if(ok)await prisma.order.update({where:{id:orderId},data:{confirmationEmailSentAt:new Date()}});
}
export async function sendOrderReadyEmail(orderId:string){const o=await prisma.order.findUnique({where:{id:orderId}});if(!o||o.readyEmailSentAt)return;const subject=o.fulfillmentMethod==="PICKUP"?`Bestelling ${o.orderNumber} staat klaar`:`Bestelling ${o.orderNumber} is verzonden`;const body=o.fulfillmentMethod==="PICKUP"?"Je bestelling staat klaar voor afhaling in Zele.":"Je bestelling is verzonden.";const ok=await send(o.customerEmail,subject,shell(subject,`<p>${body}</p><p><strong>${o.orderNumber}</strong></p>`));if(ok)await prisma.order.update({where:{id:orderId},data:{readyEmailSentAt:new Date()}})}
