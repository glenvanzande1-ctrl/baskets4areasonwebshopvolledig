import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { availableStock } from "@/lib/inventory";
import { variantLabel } from "@/lib/cart";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });

  const location = await prisma.inventoryLocation.findFirst({
    where: { active: true },
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
  });
  if (!location) return NextResponse.json({ error: "Geen voorraadlocatie." }, { status: 400 });

  const categories = await prisma.category.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true },
  });

  const variants = await prisma.productVariant.findMany({
    where: { active: true, product: { active: true } },
    include: {
      product: {
        include: {
          images: { orderBy: { sortOrder: "asc" }, take: 1 },
          category: { select: { id: true, name: true } },
        },
      },
      taxRate: true,
      inventoryStocks: { where: { locationId: location.id } },
    },
    orderBy: [{ product: { name: "asc" } }, { price: "asc" }],
    take: 300,
  });

  return NextResponse.json({
    categories,
    products: variants.map((v) => {
      const s = v.inventoryStocks[0];
      return {
        id: v.id,
        productName: v.product.name,
        label: variantLabel(v),
        sku: v.sku,
        barcode: v.barcode,
        price: Number(v.price),
        tax: Number(v.taxRate.percentage),
        available: availableStock(s?.onHand ?? 0, s?.reserved ?? 0),
        categoryId: v.product.category?.id ?? null,
        categoryName: v.product.category?.name ?? "Overige",
        imageUrl: v.product.images[0]?.url ?? null,
      };
    }),
  });
}
