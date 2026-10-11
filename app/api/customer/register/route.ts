import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { createCustomerSessionToken, CUSTOMER_SESSION_COOKIE } from "@/lib/customer-auth";
const schema=z.object({firstName:z.string().trim().min(1),lastName:z.string().trim().min(1),email:z.string().email(),phone:z.string().optional(),password:z.string().min(8)});
export async function POST(req:Request){const p=schema.safeParse(await req.json().catch(()=>null));if(!p.success)return NextResponse.json({error:"Controleer de ingevulde gegevens."},{status:400});const email=p.data.email.toLowerCase().trim();if(await prisma.customer.findUnique({where:{email}}))return NextResponse.json({error:"Er bestaat al een account met dit e-mailadres."},{status:409});const customer=await prisma.customer.create({data:{email,passwordHash:await bcrypt.hash(p.data.password,12),firstName:p.data.firstName,lastName:p.data.lastName,phone:p.data.phone||null}});const token=await createCustomerSessionToken({sub:customer.id,email:customer.email});const res=NextResponse.json({ok:true});res.cookies.set(CUSTOMER_SESSION_COOKIE,token,{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',path:'/',maxAge:60*60*24*30});return res;}
