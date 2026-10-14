import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { createPosReturn } from "@/lib/pos";

const schema = z.object({
  saleId: z.string().min(1),
  items: z.array(z.object({ saleItemId: z.string().min(1), quantity: z.number().int().positive(), restock: z.boolean() })).min(1),
  note: z.string().max(300).optional().nullable(),
});
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });
  try {
    const body = schema.parse(await request.json());
    const posReturn = await createPosReturn({ userId: session.userId, ...body });
    return NextResponse.json({ ok: true, returnNumber: posReturn.returnNumber });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Retour verwerken mislukt." }, { status: 400 });
  }
}
