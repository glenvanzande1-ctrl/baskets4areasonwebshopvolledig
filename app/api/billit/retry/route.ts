import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { retryBillitSync } from "@/lib/billit";
const schema = z.object({ syncId: z.string().min(1) });
export async function POST(request: Request) {
  const session = await getSession();
  if (!session || !["ADMIN","MANAGER"].includes(String(session.role))) return NextResponse.json({ error: "Geen toegang." }, { status: 403 });
  try {
    const { syncId } = schema.parse(await request.json());
    await retryBillitSync(syncId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Opnieuw synchroniseren mislukt." }, { status: 400 });
  }
}
