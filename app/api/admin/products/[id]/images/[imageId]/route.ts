import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireManager } from "@/lib/admin";
import { getStorageAdmin, PRODUCT_IMAGE_BUCKET } from "@/lib/supabase-storage";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string; imageId: string }> }) {
  const session = await requireManager();
  if (!session) return NextResponse.json({ error: "Geen toegang." }, { status: 403 });
  const { id, imageId } = await params;
  const image = await prisma.productImage.findFirst({ where: { id: imageId, productId: id } });
  if (!image) return NextResponse.json({ error: "Foto niet gevonden." }, { status: 404 });
  try {
    if (image.storagePath) {
      const supabase = getStorageAdmin();
      await supabase.storage.from(PRODUCT_IMAGE_BUCKET).remove([image.storagePath]);
    }
    await prisma.$transaction(async tx => {
      await tx.productImage.delete({ where: { id: imageId } });
      const remaining = await tx.productImage.findMany({ where: { productId: id }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
      for (let i = 0; i < remaining.length; i++) await tx.productImage.update({ where: { id: remaining[i].id }, data: { sortOrder: i } });
      await tx.auditLog.create({ data: { userId: session.userId, action: "PRODUCT_IMAGE_DELETED", entityType: "Product", entityId: id, metadata: { imageId } } });
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Foto verwijderen is mislukt." }, { status: 500 });
  }
}
