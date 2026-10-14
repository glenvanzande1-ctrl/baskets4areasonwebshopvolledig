"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import ProductImageManager from "@/components/ProductImageManager";

type TaxRate = { id: string; name: string; percentage: string };
type Category = { id: string; name: string };
type Variant = { id?: string; sku: string; barcode: string; color: string; size: string; weightGrams: string; price: string; taxRateId: string; active: boolean };

type ProductImage = { id: string; url: string; altText: string | null; sortOrder: number };
type ProductInitial = { id: string; name: string; description: string | null; categoryId: string | null; active: boolean; images: ProductImage[]; variants: Variant[] };

export default function ProductForm({ taxRates, categories, initial }: { taxRates: TaxRate[]; categories: Category[]; initial?: ProductInitial }) {
  const router = useRouter();
  const emptyVariant = (): Variant => ({ sku: "", barcode: "", color: "", size: "", weightGrams: "", price: "", taxRateId: taxRates[0]?.id ?? "", active: true });
  const [variants, setVariants] = useState<Variant[]>(initial?.variants?.length ? initial.variants : [emptyVariant()]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function updateVariant(index: number, key: keyof Variant, value: string | boolean) {
    setVariants(v => v.map((item, i) => i === index ? { ...item, [key]: value } : item));
  }
  function removeVariant(index: number) {
    setVariants(v => v.length === 1 ? v : v.filter((_, i) => i !== index));
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const payload = {
      name: form.get("name"),
      description: form.get("description"),
      categoryId: form.get("categoryId") || null,
      active: form.get("active") === "on",
      variants,
    };

    const url = initial ? `/api/admin/products/${initial.id}` : "/api/admin/products";
    const response = await fetch(url, {
      method: initial ? "PUT" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(data.error ?? "Opslaan mislukt.");
      setLoading(false);
      return;
    }

    // Na zowel aanmaken als wijzigen terug naar het productoverzicht.
    // De queryparameter zorgt daar voor duidelijke bevestiging.
    router.replace(initial ? "/admin/products?saved=1" : "/admin/products?created=1");
    router.refresh();
  }

  async function removeProduct() {
    if (!initial || !confirm("Product definitief verwijderen?")) return;
    const r = await fetch(`/api/admin/products/${initial.id}`, { method: "DELETE" });
    if (r.ok) {
      router.replace("/admin/products?deleted=1");
      router.refresh();
    } else {
      setError("Verwijderen mislukt.");
    }
  }

  return <form onSubmit={submit} className="form-stack">
    <div className="form-grid"><label>Productnaam<input className="input" name="name" required defaultValue={initial?.name ?? ""} /></label><label>Categorie<select className="input" name="categoryId" defaultValue={initial?.categoryId ?? ""}><option value="">Geen categorie</option>{categories.map(c => <option value={c.id} key={c.id}>{c.name}</option>)}</select></label></div>
    <label>Beschrijving<textarea className="input textarea" name="description" rows={4} defaultValue={initial?.description ?? ""} /></label>
    <label className="check"><input type="checkbox" name="active" defaultChecked={initial?.active ?? true} /> Product zichtbaar/actief</label>
    {initial ? <ProductImageManager productId={initial.id} initialImages={initial.images} /> : <div className="upload-after-save"><strong>Productfoto&apos;s</strong><p className="muted">Sla het product eerst op. Je keert daarna terug naar het productoverzicht. Klik op “Wijzigen” om productfoto&apos;s toe te voegen.</p></div>}
    <div className="section-title"><div><h2>Varianten</h2><p className="muted">Elke verkoopbare variant heeft een eigen SKU, barcode, prijs en BTW-tarief.</p></div><button className="btn secondary" type="button" onClick={() => setVariants(v => [...v, emptyVariant()])}>+ Variant</button></div>
    <div className="variants">{variants.map((v, i) => <div className="variant-card" key={i}>
      <div className="variant-head"><strong>Variant {i + 1}</strong><button type="button" className="text-btn danger" onClick={() => removeVariant(i)}>Verwijderen</button></div>
      <div className="form-grid three"><label>SKU<input className="input" value={v.sku} required onChange={e => updateVariant(i,"sku",e.target.value)} placeholder="B4A-001" /></label><label>Barcode<input className="input" value={v.barcode} onChange={e => updateVariant(i,"barcode",e.target.value)} placeholder="541..." /></label><label>Prijs incl. BTW (€)<input className="input" type="number" step="0.01" min="0" value={v.price} required onChange={e => updateVariant(i,"price",e.target.value)} /></label></div>
      <div className="form-grid four"><label>Kleur<input className="input" value={v.color} onChange={e => updateVariant(i,"color",e.target.value)} /></label><label>Maat<input className="input" value={v.size} onChange={e => updateVariant(i,"size",e.target.value)} /></label><label>Gewicht (g)<input className="input" type="number" min="0" value={v.weightGrams} onChange={e => updateVariant(i,"weightGrams",e.target.value)} /></label><label>BTW<select className="input" value={v.taxRateId} required onChange={e => updateVariant(i,"taxRateId",e.target.value)}>{taxRates.map(t => <option value={t.id} key={t.id}>{t.name} ({t.percentage}%)</option>)}</select></label></div>
      <label className="check"><input type="checkbox" checked={v.active} onChange={e => updateVariant(i,"active",e.target.checked)} /> Variant actief</label>
    </div>)}</div>
    {error && <p className="error">{error}</p>}
    <div className="actions"><button className="btn" disabled={loading}>{loading ? "Opslaan..." : "Product opslaan"}</button>{initial && <button type="button" className="btn danger-bg" onClick={removeProduct}>Product verwijderen</button>}</div>
  </form>;
}
