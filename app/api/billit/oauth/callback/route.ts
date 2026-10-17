import { NextRequest, NextResponse } from "next/server";
import { exchangeBillitCode } from "@/lib/billit";

export async function GET(request: NextRequest) {
  const base = process.env.APP_URL || request.nextUrl.origin;
  const state = request.nextUrl.searchParams.get("state");
  const expected = request.cookies.get("b4a_billit_oauth_state")?.value;
  const error = request.nextUrl.searchParams.get("error");
  const code = request.nextUrl.searchParams.get("code");
  if (error) return NextResponse.redirect(new URL(`/admin/billit?error=${encodeURIComponent(error)}`, base));
  if (!state || !expected || state !== expected) return NextResponse.redirect(new URL("/admin/billit?error=Ongeldige+OAuth+state", base));
  if (!code) return NextResponse.redirect(new URL("/admin/billit?error=Geen+autorisatiecode+ontvangen", base));
  try {
    await exchangeBillitCode(code);
    const response = NextResponse.redirect(new URL("/admin/billit?connected=1", base));
    response.cookies.delete("b4a_billit_oauth_state");
    return response;
  } catch (e) {
    return NextResponse.redirect(new URL(`/admin/billit?error=${encodeURIComponent(e instanceof Error ? e.message : "Billit koppelen mislukt")}`, base));
  }
}
