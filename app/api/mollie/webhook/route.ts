import { NextResponse } from "next/server";
import { getMolliePayment } from "@/lib/mollie";
import { applyMollieStatus } from "@/lib/orders";
export async function POST(request:Request){
 try{
  const type=request.headers.get("content-type")||""; let id="";
  if(type.includes("application/json")){const body=await request.json();id=body?.id||body?.entity?.id||""}else{const form=await request.formData();id=String(form.get("id")||"")}
  if(!id)return new NextResponse("missing id",{status:400});
  const payment=await getMolliePayment(id); await applyMollieStatus(payment); return new NextResponse("OK",{status:200});
 }catch(e){console.error("Mollie webhook",e);return new NextResponse("error",{status:500})}
}
