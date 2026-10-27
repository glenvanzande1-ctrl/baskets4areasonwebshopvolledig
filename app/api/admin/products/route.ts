import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireManager } from "@/lib/admin";
import { toSlug } from "@/lib/slug";

const variant = z.object({ sku:z.string().min(1), barcode:z.string().optional(), color:z.string().optional(), size:z.string().optional(), weightGrams:z.union([z.string(),z.number()]).optional(), price:z.union([z.string(),z.number()]), taxRateId:z.string().min(1), active:z.boolean().default(true), trackInventory:z.boolean().default(false) });
const schema = z.object({ name:z.string().min(2), description:z.string().optional(), categoryId:z.string().nullable().optional(), active:z.boolean().default(true), variants:z.array(variant).min(1) });

export async function POST(req: Request) {
  const session = await requireManager(); if (!session) return NextResponse.json({ error:"Geen toegang." }, { status:403 });
  const parsed = schema.safeParse(await req.json()); if (!parsed.success) return NextResponse.json({ error:"Controleer de productgegevens." }, { status:400 });
  const d = parsed.data;
  let slug = toSlug(d.name); if (!slug) slug = `product-${Date.now()}`;
  if (await prisma.product.findUnique({ where:{ slug } })) slug += `-${Date.now().toString().slice(-5)}`;
  try {
    const product = await prisma.product.create({ data:{ name:d.name.trim(), slug, description:d.description?.trim() || null, categoryId:d.categoryId || null, active:d.active, variants:{ create:d.variants.map(v => ({ sku:v.sku.trim(), barcode:v.barcode?.trim() || null, color:v.color?.trim() || null, size:v.size?.trim() || null, weightGrams:v.weightGrams ? Number(v.weightGrams) : null, price:String(v.price), taxRateId:v.taxRateId, active:v.active, trackInventory:v.trackInventory })) } } });
    await prisma.auditLog.create({ data:{ userId:session.userId, action:"PRODUCT_CREATED", entityType:"Product", entityId:product.id, metadata:{ name:product.name } } });
    revalidatePath("/admin/products");
    revalidatePath("/admin/inventory");
    revalidatePath("/admin");
    revalidatePath("/producten");
    revalidatePath("/");
    return NextResponse.json({ id:product.id });
  } catch (e:any) { return NextResponse.json({ error: e?.code === "P2002" ? "SKU of barcode bestaat al." : "Product kon niet worden opgeslagen." }, { status:400 }); }
}
