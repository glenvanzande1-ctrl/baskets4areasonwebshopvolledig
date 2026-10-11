import { NextResponse } from "next/server";
import { CUSTOMER_SESSION_COOKIE } from "@/lib/customer-auth";
export async function POST(req:Request){const res=NextResponse.redirect(new URL('/',req.url),303);res.cookies.set(CUSTOMER_SESSION_COOKIE,'',{httpOnly:true,path:'/',maxAge:0});return res;}
