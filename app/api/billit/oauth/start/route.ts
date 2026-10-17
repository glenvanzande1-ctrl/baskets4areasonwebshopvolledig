import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { billitAuthorizeUrl } from "@/lib/billit";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return NextResponse.redirect(new URL("/admin", process.env.APP_URL || "http://localhost:3000"));
  const state = crypto.randomBytes(24).toString("hex");
  const response = NextResponse.redirect(billitAuthorizeUrl(state));
  response.cookies.set("b4a_billit_oauth_state", state, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 600, path: "/" });
  return response;
}
