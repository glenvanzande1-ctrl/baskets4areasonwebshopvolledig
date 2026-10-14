import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { createPosSale } from "@/lib/pos";

const schema = z.object({
  items: z.array(z.object({ variantId: z.string().min(1), quantity: z.number().int().positive() })).min(1),
  paymentMethod: z.enum(["CASH", "CARD"]),
  cashReceived: z.number().nonnegative().optional().nullable(),
  note: z.string().max(300).optional().nullable(),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });
  try {
    const body = schema.parse(await request.json());
    const sale = await createPosSale({ userId: session.userId, ...body });
    return NextResponse.json({ ok: true, saleNumber: sale.saleNumber, saleId: sale.id });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Verkoop opslaan mislukt." }, { status: 400 });
  }
}
