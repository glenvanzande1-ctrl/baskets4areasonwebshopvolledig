import { prisma } from "@/lib/db";
import ProductForm from "@/components/ProductForm";

export default async function NewProductPage() {
  const [taxRates, categories] = await Promise.all([
    prisma.taxRate.findMany({ where: { active: true }, orderBy: { percentage: "asc" } }),
    prisma.category.findMany({ where: { active: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
  ]);
  return <main className="admin-shell"><section className="admin-card"><a className="back" href="/admin/products">← Producten</a><h1>Nieuw product</h1><ProductForm categories={categories} taxRates={taxRates.map(t => ({ id:t.id, name:t.name, percentage:t.percentage.toString() }))} /></section></main>;
}
