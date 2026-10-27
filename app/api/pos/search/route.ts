import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { availableStock } from "@/lib/inventory";
import { variantLabel } from "@/lib/cart";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });
  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q) return NextResponse.json({ results: [] });
  const location = await prisma.inventoryLocation.findFirst({ where: { active: true }, orderBy: [{ isDefault: "desc" }, { name: "asc" }] });
  if (!location) return NextResponse.json({ error: "Geen voorraadlocatie." }, { status: 400 });

  const variants = await prisma.productVariant.findMany({
    where: {
      active: true, product: { active: true },
      OR: [
        { barcode: q }, { sku: { equals: q, mode: "insensitive" } },
        { product: { name: { contains: q, mode: "insensitive" } } },
        { barcode: { contains: q } }, { sku: { contains: q, mode: "insensitive" } },
      ],
    },
    include: { product: true, taxRate: true, inventoryStocks: { where: { locationId: location.id } } },
    take: 12,
    orderBy: { product: { name: "asc" } },
  });

  const exact = variants.find((v) => v.barcode === q || v.sku.toLowerCase() === q.toLowerCase());
  const ordered = exact ? [exact, ...variants.filter((v) => v.id !== exact.id)] : variants;
  return NextResponse.json({
    exact: exact?.id ?? null,
    results: ordered.map((v) => {
      const s = v.inventoryStocks[0];
      return { id: v.id, productName: v.product.name, label: variantLabel(v), sku: v.sku, barcode: v.barcode, price: Number(v.price), tax: Number(v.taxRate.percentage), available: v.trackInventory ? availableStock(s?.onHand ?? 0, s?.reserved ?? 0) : 999999, unlimited: !v.trackInventory };
    }),
  });
}
