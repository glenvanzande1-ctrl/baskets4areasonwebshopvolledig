import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireManager } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { applyInventoryMovement } from "@/lib/inventory";

const bodySchema = z.object({
  locationId: z.string().min(1),
  operation: z.enum(["RECEIPT", "RETURN", "ADJUSTMENT_IN", "ADJUSTMENT_OUT", "DAMAGE"]),
  quantity: z.number().int().positive(),
  note: z.string().max(300).optional().nullable(),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ variantId: string }> }) {
  const session = await requireManager();
  if (!session) return NextResponse.json({ error: "Geen toegang." }, { status: 403 });

  try {
    const { variantId } = await params;
    const body = bodySchema.parse(await request.json());

    const exists = await prisma.productVariant.findUnique({
      where: { id: variantId },
      select: { id: true },
    });

    if (!exists) return NextResponse.json({ error: "Variant niet gevonden." }, { status: 404 });

    const delta = ["ADJUSTMENT_OUT", "DAMAGE"].includes(body.operation)
      ? -body.quantity
      : body.quantity;

    const result = await applyInventoryMovement({
      variantId,
      locationId: body.locationId,
      quantityDelta: delta,
      type: body.operation,
      userId: session.userId,
      note: body.note?.trim() || null,
    });

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: "INVENTORY_ADJUSTED",
        entityType: "ProductVariant",
        entityId: variantId,
        metadata: {
          locationId: body.locationId,
          operation: body.operation,
          quantity: delta,
          stockAfter: result.stock.onHand,
        },
      },
    });

    revalidatePath("/admin/inventory");
    revalidatePath(`/admin/inventory/${variantId}`);
    revalidatePath("/producten");
    revalidatePath("/");

    return NextResponse.json({ ok: true, stock: result.stock });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Voorraad aanpassen mislukt.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
