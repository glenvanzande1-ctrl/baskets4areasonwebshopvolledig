import { NextResponse } from "next/server";
import { z } from "zod";
import { getCustomerSession } from "@/lib/customer-auth";
import { readCart } from "@/lib/cart";
import { createPendingOrder, releaseOrderReservations } from "@/lib/orders";
import { createMolliePayment } from "@/lib/mollie";
import { prisma } from "@/lib/db";
const schema=z.object({fulfillmentMethod:z.enum(["PICKUP","DELIVERY"]).default("PICKUP"),discountCode:z.string().optional(),shipping:z.object({street:z.string(),houseNumber:z.string(),box:z.string().optional(),postalCode:z.string(),city:z.string(),country:z.string().optional()}).optional()});
export async function POST(req:Request){
  const session=await getCustomerSession(); if(!session)return NextResponse.json({error:"Log eerst in."},{status:401});
  const cart=await readCart(); if(!cart||!cart.items.length)return NextResponse.json({error:"Je winkelmand is leeg."},{status:400});
  const parsed=schema.safeParse(await req.json().catch(()=>({}))); if(!parsed.success)return NextResponse.json({error:"Controleer de levergegevens."},{status:400});
  let order:null|Awaited<ReturnType<typeof createPendingOrder>>=null;
  try{
    order=await createPendingOrder(session.customerId,cart.id,parsed.data as any);
    const mp=await createMolliePayment({orderId:order.id,orderNumber:order.orderNumber,amount:Number(order.total).toFixed(2)});
    const checkoutUrl=mp._links?.checkout?.href; if(!checkoutUrl)throw new Error("Mollie gaf geen checkout-URL terug.");
    await prisma.payment.create({data:{orderId:order.id,providerPaymentId:mp.id,status:mp.status.toUpperCase() as any,amount:order.total,currency:"EUR",method:mp.method??null,checkoutUrl,raw:mp as any}});
    return NextResponse.json({checkoutUrl,orderNumber:order.orderNumber});
  }catch(e){
    if(order){await releaseOrderReservations(order.id).catch(()=>{});await prisma.order.update({where:{id:order.id},data:{status:"PAYMENT_FAILED"}}).catch(()=>{})}
    return NextResponse.json({error:e instanceof Error?e.message:"Betaling kon niet gestart worden."},{status:400});
  }
}
