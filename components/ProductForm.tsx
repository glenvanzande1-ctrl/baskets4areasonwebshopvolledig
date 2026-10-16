"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ProductImageManager from "@/components/ProductImageManager";

type TaxRate = { id: string; name: string; percentage: string };
type Category = { id: string; name: string };
type Variant = { id?: string; sku: string; barcode: string; color: string; size: string; weightGrams: string; price: string; taxRateId: string; active: boolean };
type ProductImage = { id: string; url: string; altText: string | null; sortOrder: number };
type ProductInitial = { id: string; name: string; description: string | null; categoryId: string | null; active: boolean; images: ProductImage[]; variants: Variant[] };
type DraftImage = { id: string; file: File; previewUrl: string };

async function canvasToWebp(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      value => value ? resolve(value) : reject(new Error("Afbeelding optimaliseren mislukt.")),
      "image/webp",
      quality,
    );
  });
}

async function normalizeForUpload(file: File): Promise<File> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("Deze foto kan op dit toestel niet worden verwerkt. Kies bij voorkeur een JPG, PNG, WebP of AVIF-afbeelding.");
  }

  const size = 1400;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error("Afbeelding optimaliseren is niet beschikbaar in deze browser.");
  }

  ctx.fillStyle = "#f6f3ee";
  ctx.fillRect(0, 0, size, size);
  const scale = Math.min(size / bitmap.width, size / bitmap.height);
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const x = Math.round((size - width) / 2);
  const y = Math.round((size - height) / 2);
  ctx.drawImage(bitmap, x, y, width, height);
  bitmap.close();

  // Mobiele browsers kunnen bij dezelfde foto een veel groter WebP-bestand maken
  // dan desktopbrowsers. Verlaag de kwaliteit automatisch tot de upload veilig
  // onder de serverless requestlimiet blijft.
  const maxBytes = 2.4 * 1024 * 1024;
  const qualities = [0.82, 0.76, 0.70, 0.64, 0.58, 0.52];
  let blob: Blob | null = null;

  for (const quality of qualities) {
    blob = await canvasToWebp(canvas, quality);
    if (blob.size <= maxBytes) break;
  }

  if (!blob || blob.size > maxBytes) {
    throw new Error("De foto blijft te groot na optimalisatie. Kies een andere foto of maak een nieuwe foto met een lagere resolutie.");
  }

  return new File(
    [blob],
    `${file.name.replace(/\.[^.]+$/, "") || "product"}.webp`,
    { type: "image/webp" },
  );
}

export default function ProductForm({ taxRates, categories, initial }: { taxRates: TaxRate[]; categories: Category[]; initial?: ProductInitial }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emptyVariant = (): Variant => ({ sku: "", barcode: "", color: "", size: "", weightGrams: "", price: "", taxRateId: taxRates[0]?.id ?? "", active: true });
  const [variants, setVariants] = useState<Variant[]>(initial?.variants?.length ? initial.variants : [emptyVariant()]);
  const [draftImages, setDraftImages] = useState<DraftImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      draftImages.forEach(image => URL.revokeObjectURL(image.previewUrl));
    };
  }, [draftImages]);

  function updateVariant(index: number, key: keyof Variant, value: string | boolean) {
    setVariants(v => v.map((item, i) => i === index ? { ...item, [key]: value } : item));
  }

  function removeVariant(index: number) {
    setVariants(v => v.length === 1 ? v : v.filter((_, i) => i !== index));
  }

  function addDraftImages(files: FileList | null) {
    if (!files?.length) return;
    setError("");

    const next: DraftImage[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) {
        setError(`${file.name} is geen geldig afbeeldingsbestand.`);
        continue;
      }
      next.push({ id: crypto.randomUUID(), file, previewUrl: URL.createObjectURL(file) });
    }
    if (next.length) setDraftImages(current => [...current, ...next]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeDraftImage(id: string) {
    setDraftImages(current => {
      const image = current.find(item => item.id === id);
      if (image) URL.revokeObjectURL(image.previewUrl);
      return current.filter(item => item.id !== id);
    });
  }

  function moveDraftImage(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= draftImages.length) return;
    setDraftImages(current => {
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function makeDraftPrimary(index: number) {
    if (index === 0) return;
    setDraftImages(current => [current[index], ...current.filter((_, i) => i !== index)]);
  }

  async function uploadDraftImages(productId: string) {
    for (let i = 0; i < draftImages.length; i++) {
      setProgress(`Foto ${i + 1} van ${draftImages.length} voorbereiden en uploaden...`);
      const optimized = await normalizeForUpload(draftImages[i].file);
      const body = new FormData();
      body.append("file", optimized);
      const response = await fetch(`/api/admin/products/${productId}/images`, { method: "POST", body });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error ?? `Foto ${i + 1} kon niet worden geüpload.`);
    }
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setProgress(initial ? "Product opslaan..." : "Product aanmaken...");

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
      setProgress("");
      return;
    }

    if (!initial && draftImages.length) {
      try {
        await uploadDraftImages(data.id);
      } catch (uploadError: any) {
        // Het product bestaat al. Stuur daarom naar de bewerkpagina in plaats van
        // opnieuw aanmaken mogelijk te maken, zodat er geen duplicaat ontstaat.
        router.replace(`/admin/products/${data.id}?imageUploadError=1`);
        router.refresh();
        return;
      }
    }

    setProgress("Klaar. Productoverzicht openen...");
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
    <div className="form-grid">
      <label>Productnaam<input className="input" name="name" required defaultValue={initial?.name ?? ""} /></label>
      <label>Categorie<select className="input" name="categoryId" defaultValue={initial?.categoryId ?? ""}><option value="">Geen categorie</option>{categories.map(c => <option value={c.id} key={c.id}>{c.name}</option>)}</select></label>
    </div>

    <label>Beschrijving<textarea className="input textarea" name="description" rows={4} defaultValue={initial?.description ?? ""} /></label>
    <label className="check"><input type="checkbox" name="active" defaultChecked={initial?.active ?? true} /> Product zichtbaar/actief</label>

    {initial ? (
      <ProductImageManager productId={initial.id} initialImages={initial.images} />
    ) : (
      <section className="image-manager">
        <div className="section-title">
          <div>
            <h2>Productfoto&apos;s</h2>
            <p className="muted">Voeg de foto&apos;s nu al toe. Ze worden pas samen met het product geüpload wanneer je op <strong>Product opslaan</strong> klikt.</p>
          </div>
          <label className={`btn ${loading ? "disabled" : ""}`}>
            + Foto toevoegen
            <input
              ref={fileInputRef}
              className="visually-hidden"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif"
              multiple
              disabled={loading}
              onChange={e => addDraftImages(e.target.files)}
            />
          </label>
        </div>
        <p className="muted small">JPG, PNG, WebP of AVIF. Foto’s van een smartphone worden vóór de upload automatisch extra gecomprimeerd. Grootte en beeldverhouding mogen verschillen; elke foto wordt automatisch naar dezelfde 1400 × 1400 webshopweergave genormaliseerd.</p>

        {draftImages.length === 0 ? (
          <div className="empty-state">Nog geen foto&apos;s geselecteerd. Je kunt het product ook zonder foto opslaan.</div>
        ) : (
          <div className="image-admin-grid">
            {draftImages.map((image, index) => <article className="image-admin-card" key={image.id}>
              <div className="image-square">
                <img src={image.previewUrl} alt={`Nieuwe productfoto ${index + 1}`} />
                {index === 0 && <span className="primary-label">★ Hoofdfoto</span>}
              </div>
              <div className="image-admin-actions">
                {index !== 0 && <button type="button" className="text-btn" disabled={loading} onClick={() => makeDraftPrimary(index)}>Hoofdfoto maken</button>}
                <div>
                  <button type="button" className="mini-btn" disabled={loading || index === 0} onClick={() => moveDraftImage(index, -1)}>←</button>
                  <button type="button" className="mini-btn" disabled={loading || index === draftImages.length - 1} onClick={() => moveDraftImage(index, 1)}>→</button>
                </div>
                <button type="button" className="text-btn danger" disabled={loading} onClick={() => removeDraftImage(image.id)}>Verwijderen</button>
              </div>
            </article>)}
          </div>
        )}
      </section>
    )}

    <div className="section-title">
      <div><h2>Varianten</h2><p className="muted">Elke verkoopbare variant heeft een eigen SKU, barcode, prijs en BTW-tarief.</p></div>
      <button className="btn secondary" type="button" disabled={loading} onClick={() => setVariants(v => [...v, emptyVariant()])}>+ Variant</button>
    </div>

    <div className="variants">{variants.map((v, i) => <div className="variant-card" key={i}>
      <div className="variant-head"><strong>Variant {i + 1}</strong><button type="button" className="text-btn danger" disabled={loading} onClick={() => removeVariant(i)}>Verwijderen</button></div>
      <div className="form-grid three">
        <label>SKU<input className="input" value={v.sku} required disabled={loading} onChange={e => updateVariant(i,"sku",e.target.value)} placeholder="B4A-001" /></label>
        <label>Barcode<input className="input" value={v.barcode} disabled={loading} onChange={e => updateVariant(i,"barcode",e.target.value)} placeholder="541..." /></label>
        <label>Prijs incl. BTW (€)<input className="input" type="number" step="0.01" min="0" value={v.price} required disabled={loading} onChange={e => updateVariant(i,"price",e.target.value)} /></label>
      </div>
      <div className="form-grid four">
        <label>Kleur<input className="input" value={v.color} disabled={loading} onChange={e => updateVariant(i,"color",e.target.value)} /></label>
        <label>Maat<input className="input" value={v.size} disabled={loading} onChange={e => updateVariant(i,"size",e.target.value)} /></label>
        <label>Gewicht (g)<input className="input" type="number" min="0" value={v.weightGrams} disabled={loading} onChange={e => updateVariant(i,"weightGrams",e.target.value)} /></label>
        <label>BTW<select className="input" value={v.taxRateId} required disabled={loading} onChange={e => updateVariant(i,"taxRateId",e.target.value)}>{taxRates.map(t => <option value={t.id} key={t.id}>{t.name} ({t.percentage}%)</option>)}</select></label>
      </div>
      <label className="check"><input type="checkbox" checked={v.active} disabled={loading} onChange={e => updateVariant(i,"active",e.target.checked)} /> Variant actief</label>
    </div>)}</div>

    {error && <p className="error">{error}</p>}
    {progress && <p className="muted small">{progress}</p>}

    <div className="actions">
      <button className="btn" disabled={loading}>{loading ? (draftImages.length && !initial ? "Product + foto's opslaan..." : "Opslaan...") : "Product opslaan"}</button>
      {initial && <button type="button" className="btn danger-bg" disabled={loading} onClick={removeProduct}>Product verwijderen</button>}
    </div>
  </form>;
}
