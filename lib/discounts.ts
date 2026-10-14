import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
type Db = Pick<Prisma.TransactionClient,"discountCode"> | typeof prisma;
export async function validateDiscount(code:string|undefined, subtotalCents:number, db:Db=prisma){
 if(!code)return null; const normalized=code.trim().toUpperCase(); if(!normalized)return null;
 const d=await db.discountCode.findUnique({where:{code:normalized}}); if(!d||!d.active)throw new Error("Kortingscode is ongeldig.");
 const now=new Date(); if(d.startsAt&&d.startsAt>now)throw new Error("Deze kortingscode is nog niet geldig."); if(d.endsAt&&d.endsAt<now)throw new Error("Deze kortingscode is verlopen.");
 if(d.maxUses!=null&&d.usedCount>=d.maxUses)throw new Error("Deze kortingscode is niet meer beschikbaar.");
 if(d.minOrderAmount!=null&&subtotalCents<Math.round(Number(d.minOrderAmount)*100))throw new Error(`Minimum bestelbedrag voor deze code is € ${Number(d.minOrderAmount).toFixed(2).replace(".",",")}.`);
 let amount=0; if(d.type==="PERCENT") amount=Math.round(subtotalCents*Math.min(Number(d.value),100)/100); else amount=Math.round(Number(d.value)*100); amount=Math.max(0,Math.min(amount,subtotalCents));
 return {id:d.id,code:d.code,amountCents:amount};
}
