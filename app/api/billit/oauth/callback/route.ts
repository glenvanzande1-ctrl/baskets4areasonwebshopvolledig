import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  return NextResponse.redirect(new URL("/admin/billit?info=API-key-authenticatie-actief", url.origin));
}
