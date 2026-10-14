import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireManager } from "@/lib/admin";

const schema = z.object({ orderedIds: z.array(z.string()).min(1) });

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireManager();
  if (!session) return NextResponse.json({ error: "Geen toegang." }, { status: 403 });
  const { id } = await params;
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Ongeldige volgorde." }, { status: 400 });
  const existing = await prisma.productImage.findMany({ where: { productId: id }, select: { id: true } });
  const allowed = new Set(existing.map(x => x.id));
  if (parsed.data.orderedIds.some(x => !allowed.has(x)) || parsed.data.orderedIds.length !== existing.length) return NextResponse.json({ error: "Foto-overzicht is gewijzigd. Vernieuw de pagina." }, { status: 409 });
  await prisma.$transaction(parsed.data.orderedIds.map((imageId, i) => prisma.productImage.update({ where: { id: imageId }, data: { sortOrder: i } })));
  await prisma.auditLog.create({ data: { userId: session.userId, action: "PRODUCT_IMAGES_REORDERED", entityType: "Product", entityId: id } });
  return NextResponse.json({ ok: true });
}
