import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { createCustomerSessionToken, CUSTOMER_SESSION_COOKIE } from "@/lib/customer-auth";
const schema=z.object({email:z.string().email(),password:z.string().min(1)});
export async function POST(req:Request){const p=schema.safeParse(await req.json().catch(()=>null));if(!p.success)return NextResponse.json({error:"Ongeldige gegevens."},{status:400});const customer=await prisma.customer.findUnique({where:{email:p.data.email.toLowerCase().trim()}});if(!customer||!customer.active||!(await bcrypt.compare(p.data.password,customer.passwordHash)))return NextResponse.json({error:"E-mailadres of wachtwoord is onjuist."},{status:401});const token=await createCustomerSessionToken({sub:customer.id,email:customer.email});const res=NextResponse.json({ok:true});res.cookies.set(CUSTOMER_SESSION_COOKIE,token,{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',path:'/',maxAge:60*60*24*30});return res;}
