import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import ProductForm from "@/components/ProductForm";

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const { id } = await params;
  const { created } = await searchParams;

  const [product, taxRates, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: {
        variants: { orderBy: { createdAt: "asc" } },
        images: { orderBy: { sortOrder: "asc" } },
      },
    }),
    prisma.taxRate.findMany({
      where: { active: true },
      orderBy: { percentage: "asc" },
    }),
    prisma.category.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
  ]);

  if (!product) notFound();

  const initial = {
    id: product.id,
    name: product.name,
    description: product.description,
    categoryId: product.categoryId,
    active: product.active,
    images: product.images.map((i) => ({
      id: i.id,
      url: i.url,
      altText: i.altText,
      sortOrder: i.sortOrder,
    })),
    variants: product.variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      barcode: v.barcode ?? "",
      color: v.color ?? "",
      size: v.size ?? "",
      weightGrams: v.weightGrams?.toString() ?? "",
      price: v.price.toString(),
      taxRateId: v.taxRateId,
      active: v.active,
    })),
  };

  return (
    <main className="admin-shell">
      <section className="admin-card">
        <a className="back" href="/admin/products">← Producten</a>
        <h1>Product wijzigen</h1>
        {created === "1" && (
          <p className="success-box">
            ✓ Product succesvol aangemaakt. Je kunt nu productfoto&apos;s toevoegen of het product verder aanpassen.
          </p>
        )}
        <ProductForm
          initial={initial}
          categories={categories}
          taxRates={taxRates.map((t) => ({
            id: t.id,
            name: t.name,
            percentage: t.percentage.toString(),
          }))}
        />
      </section>
    </main>
  );
}
