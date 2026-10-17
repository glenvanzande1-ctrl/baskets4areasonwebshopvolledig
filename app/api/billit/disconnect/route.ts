import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { disconnectBillit } from "@/lib/billit";
export async function POST() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "Geen toegang." }, { status: 403 });
  await disconnectBillit();
  return NextResponse.redirect(new URL("/admin/billit?disconnected=1", process.env.APP_URL || "http://localhost:3000"), 303);
}
