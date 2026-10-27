import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireManager } from "@/lib/admin";
import { prisma } from "@/lib/db";

const bodySchema = z.object({ locationId: z.string().min(1), minStock: z.number().int().min(0).max(1000000) });

export async function POST(request: NextRequest, { params }: { params: Promise<{ variantId: string }> }) {
  const session = await requireManager();
  if (!session) return NextResponse.json({ error: "Geen toegang." }, { status: 403 });
  try {
    const { variantId } = await params;
    const body = bodySchema.parse(await request.json());
    const variant = await prisma.productVariant.findUnique({ where: { id: variantId }, select: { trackInventory: true } });
    if (!variant) return NextResponse.json({ error: "Variant niet gevonden." }, { status: 404 });
    if (!variant.trackInventory) return NextResponse.json({ error: "Deze variant heeft onbeperkte voorraad." }, { status: 400 });
    const stock = await prisma.inventoryStock.upsert({
      where: { variantId_locationId: { variantId, locationId: body.locationId } },
      update: { minStock: body.minStock },
      create: { variantId, locationId: body.locationId, minStock: body.minStock },
    });
    await prisma.auditLog.create({ data: { userId: session.userId, action: "INVENTORY_MINIMUM_CHANGED", entityType: "ProductVariant", entityId: variantId, metadata: { locationId: body.locationId, minStock: body.minStock } } });
    return NextResponse.json({ ok: true, stock });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Minimumvoorraad opslaan mislukt.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
