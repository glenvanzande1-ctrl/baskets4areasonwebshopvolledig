import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireManager } from "@/lib/admin";
import { toSlug } from "@/lib/slug";
import { getStorageAdmin, PRODUCT_IMAGE_BUCKET } from "@/lib/supabase-storage";

const variant = z.object({ id:z.string().optional(), sku:z.string().min(1), barcode:z.string().optional(), color:z.string().optional(), size:z.string().optional(), weightGrams:z.union([z.string(),z.number()]).optional(), price:z.union([z.string(),z.number()]), taxRateId:z.string().min(1), active:z.boolean() });
const schema = z.object({ name:z.string().min(2), description:z.string().optional(), categoryId:z.string().nullable().optional(), active:z.boolean(), variants:z.array(variant).min(1) });

export async function PUT(req: Request, { params }: { params: Promise<{ id:string }> }) {
  const session = await requireManager(); if (!session) return NextResponse.json({ error:"Geen toegang." }, { status:403 });
  const { id } = await params; const parsed = schema.safeParse(await req.json()); if (!parsed.success) return NextResponse.json({ error:"Controleer de productgegevens." }, { status:400 });
  const d = parsed.data;
  try {
    await prisma.$transaction(async tx => {
      const current = await tx.product.findUnique({ where:{ id }, include:{ variants:true } }); if (!current) throw new Error("NOT_FOUND");
      let slug = current.name === d.name.trim() ? current.slug : toSlug(d.name); const existing = await tx.product.findFirst({ where:{ slug, NOT:{ id } } }); if (existing) slug += `-${Date.now().toString().slice(-5)}`;
      await tx.product.update({ where:{ id }, data:{ name:d.name.trim(), slug, description:d.description?.trim() || null, categoryId:d.categoryId || null, active:d.active } });
      const incomingIds = d.variants.map(v => v.id).filter(Boolean) as string[];
      await tx.productVariant.deleteMany({ where:{ productId:id, id:{ notIn:incomingIds } } });
      for (const v of d.variants) {
        const data = { sku:v.sku.trim(), barcode:v.barcode?.trim() || null, color:v.color?.trim() || null, size:v.size?.trim() || null, weightGrams:v.weightGrams ? Number(v.weightGrams) : null, price:String(v.price), taxRateId:v.taxRateId, active:v.active };
        if (v.id) await tx.productVariant.update({ where:{ id:v.id }, data }); else await tx.productVariant.create({ data:{ ...data, productId:id } });
      }
      await tx.auditLog.create({ data:{ userId:session.userId, action:"PRODUCT_UPDATED", entityType:"Product", entityId:id, metadata:{ name:d.name } } });
    });
    revalidatePath("/admin/products");
    revalidatePath("/admin");
    revalidatePath("/producten");
    revalidatePath("/");
    return NextResponse.json({ ok:true });
  } catch (e:any) { return NextResponse.json({ error:e?.code === "P2002" ? "SKU of barcode bestaat al." : "Wijzigen mislukt." }, { status:400 }); }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id:string }> }) {
  const session = await requireManager(); if (!session) return NextResponse.json({ error:"Geen toegang." }, { status:403 });
  const { id } = await params;
  try {
    const images = await prisma.productImage.findMany({ where:{ productId:id }, select:{ storagePath:true } });
    const paths = images.map(i=>i.storagePath).filter(Boolean) as string[];
    if (paths.length) { try { const supabase=getStorageAdmin(); await supabase.storage.from(PRODUCT_IMAGE_BUCKET).remove(paths); } catch {} }
    const p = await prisma.product.delete({ where:{ id } });
    await prisma.auditLog.create({ data:{ userId:session.userId, action:"PRODUCT_DELETED", entityType:"Product", entityId:id, metadata:{ name:p.name } } });
    revalidatePath("/admin/products");
    revalidatePath("/admin");
    revalidatePath("/producten");
    revalidatePath("/");
    return NextResponse.json({ ok:true });
  } catch { return NextResponse.json({ error:"Verwijderen mislukt." }, { status:400 }); }
}
