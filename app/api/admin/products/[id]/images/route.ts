import { NextResponse } from "next/server";
import sharp from "sharp";
import { prisma } from "@/lib/db";
import { requireManager } from "@/lib/admin";
import { ensureProductImageBucket, PRODUCT_IMAGE_BUCKET } from "@/lib/supabase-storage";

const MAX_UPLOAD = 4 * 1024 * 1024;

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireManager();
  if (!session) return NextResponse.json({ error: "Geen toegang." }, { status: 403 });
  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id }, select: { id: true, name: true } });
  if (!product) return NextResponse.json({ error: "Product niet gevonden." }, { status: 404 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Geen afbeelding ontvangen." }, { status: 400 });
  if (file.size > MAX_UPLOAD) return NextResponse.json({ error: "Afbeelding is te groot na optimalisatie. Probeer opnieuw; mobiele foto’s worden automatisch extra gecomprimeerd." }, { status: 400 });
  if (!file.type.startsWith("image/")) return NextResponse.json({ error: "Ongeldig afbeeldingsbestand." }, { status: 400 });

  try {
    const raw = Buffer.from(await file.arrayBuffer());
    // Tweede server-side normalisatie: altijd exact 1400 × 1400 WebP.
    // 'contain' bewaart de volledige foto en vult lege ruimte neutraal op.
    const optimized = await sharp(raw, { failOn: "none" })
      .rotate()
      .resize(1400, 1400, { fit: "contain", background: { r: 246, g: 243, b: 238, alpha: 1 }, withoutEnlargement: false })
      .webp({ quality: 88, effort: 4 })
      .toBuffer();

    const supabase = await ensureProductImageBucket();
    const path = `${id}/${crypto.randomUUID()}.webp`;
    const upload = await supabase.storage.from(PRODUCT_IMAGE_BUCKET).upload(path, optimized, { contentType: "image/webp", upsert: false, cacheControl: "31536000" });
    if (upload.error) throw upload.error;
    const { data: publicData } = supabase.storage.from(PRODUCT_IMAGE_BUCKET).getPublicUrl(path);
    const last = await prisma.productImage.aggregate({ where: { productId: id }, _max: { sortOrder: true } });
    const image = await prisma.productImage.create({ data: { productId: id, url: publicData.publicUrl, storagePath: path, altText: product.name, width: 1400, height: 1400, sortOrder: (last._max.sortOrder ?? -1) + 1 } });
    await prisma.auditLog.create({ data: { userId: session.userId, action: "PRODUCT_IMAGE_UPLOADED", entityType: "Product", entityId: id, metadata: { imageId: image.id } } });
    return NextResponse.json({ image });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Afbeelding uploaden is mislukt. Controleer de Supabase Storage-instellingen." }, { status: 500 });
  }
}
