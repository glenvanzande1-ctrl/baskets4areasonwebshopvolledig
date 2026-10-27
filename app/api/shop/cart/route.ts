import { NextResponse } from "next/server";
import { z } from "zod";
import { getOrCreateCart } from "@/lib/cart";
import { prisma } from "@/lib/db";

const schema=z.object({variantId:z.string().min(1),quantity:z.number().int().min(1).max(99)});
export async function POST(req:Request){
  const parsed=schema.safeParse(await req.json().catch(()=>null)); if(!parsed.success)return NextResponse.json({error:"Ongeldige invoer."},{status:400});
  const variant=await prisma.productVariant.findUnique({where:{id:parsed.data.variantId},include:{product:true,inventoryStocks:true}});
  if(!variant||!variant.active||!variant.product.active)return NextResponse.json({error:"Product niet beschikbaar."},{status:404});
  const available=variant.trackInventory ? variant.inventoryStocks.reduce((n,s)=>n+Math.max(0,s.onHand-s.reserved),0) : Number.MAX_SAFE_INTEGER;
  const cart=await getOrCreateCart(); const existing=await prisma.cartItem.findUnique({where:{cartId_variantId:{cartId:cart.id,variantId:variant.id}}}); const wanted=(existing?.quantity??0)+parsed.data.quantity;
  if(variant.trackInventory && wanted>available)return NextResponse.json({error:`Nog slechts ${available} beschikbaar.`},{status:409});
  await prisma.cartItem.upsert({where:{cartId_variantId:{cartId:cart.id,variantId:variant.id}},create:{cartId:cart.id,variantId:variant.id,quantity:parsed.data.quantity},update:{quantity:wanted}});
  return NextResponse.json({ok:true});
}
