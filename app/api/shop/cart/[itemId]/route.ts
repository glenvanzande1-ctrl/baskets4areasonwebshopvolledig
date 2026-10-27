import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { readCart } from "@/lib/cart";
const schema=z.object({quantity:z.number().int().min(1).max(99)});
export async function PATCH(req:Request,{params}:{params:Promise<{itemId:string}>}){ const {itemId}=await params; const parsed=schema.safeParse(await req.json().catch(()=>null)); if(!parsed.success)return NextResponse.json({error:"Ongeldig aantal."},{status:400}); const cart=await readCart(); const item=cart?.items.find(i=>i.id===itemId); if(!item)return NextResponse.json({error:"Niet gevonden."},{status:404}); const available=item.variant.trackInventory?item.variant.inventoryStocks.reduce((n,s)=>n+Math.max(0,s.onHand-s.reserved),0):Number.MAX_SAFE_INTEGER; if(item.variant.trackInventory && parsed.data.quantity>available)return NextResponse.json({error:`Nog slechts ${available} beschikbaar.`},{status:409}); await prisma.cartItem.update({where:{id:itemId},data:{quantity:parsed.data.quantity}}); return NextResponse.json({ok:true}); }
export async function DELETE(_req:Request,{params}:{params:Promise<{itemId:string}>}){ const {itemId}=await params; const cart=await readCart(); if(!cart?.items.some(i=>i.id===itemId))return NextResponse.json({error:"Niet gevonden."},{status:404}); await prisma.cartItem.delete({where:{id:itemId}}); return NextResponse.json({ok:true}); }
