"use client";

import { useRef, useState } from "react";

type ProductImage = { id: string; url: string; altText: string | null; sortOrder: number };

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

export default function ProductImageManager({ productId, initialImages }: { productId: string; initialImages: ProductImage[] }) {
  const [images, setImages] = useState([...initialImages].sort((a,b)=>a.sortOrder-b.sortOrder));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true); setError("");
    try {
      for (const original of Array.from(files)) {
        if (!original.type.startsWith("image/")) throw new Error(`${original.name} is geen afbeelding.`);
        const optimized = await normalizeForUpload(original);
        const form = new FormData(); form.append("file", optimized);
        const res = await fetch(`/api/admin/products/${productId}/images`, { method: "POST", body: form });
        const data = await res.json().catch(()=>({}));
        if (!res.ok) throw new Error(data.error || "Upload mislukt.");
        setImages(prev => [...prev, data.image]);
      }
      if (inputRef.current) inputRef.current.value = "";
    } catch (e:any) { setError(e.message || "Upload mislukt."); }
    finally { setBusy(false); }
  }

  async function saveOrder(next: ProductImage[]) {
    setImages(next.map((img,i)=>({ ...img, sortOrder:i })));
    const res = await fetch(`/api/admin/products/${productId}/images/reorder`, { method:"PATCH", headers:{"content-type":"application/json"}, body:JSON.stringify({ orderedIds: next.map(x=>x.id) }) });
    if (!res.ok) { setError("Volgorde opslaan mislukt. Vernieuw de pagina."); return false; }
    return true;
  }

  async function makePrimary(index:number) {
    if (index===0) return;
    setBusy(true); setError("");
    const next=[images[index], ...images.filter((_,i)=>i!==index)];
    await saveOrder(next); setBusy(false);
  }

  async function move(index:number, direction:-1|1) {
    const target=index+direction; if(target<0||target>=images.length) return;
    setBusy(true); setError("");
    const next=[...images]; [next[index],next[target]]=[next[target],next[index]];
    await saveOrder(next); setBusy(false);
  }

  async function remove(imageId:string) {
    if(!confirm("Deze productfoto verwijderen?")) return;
    setBusy(true); setError("");
    const res=await fetch(`/api/admin/products/${productId}/images/${imageId}`,{method:"DELETE"});
    const data=await res.json().catch(()=>({}));
    if(!res.ok) setError(data.error||"Verwijderen mislukt.");
    else setImages(prev=>prev.filter(x=>x.id!==imageId).map((x,i)=>({...x,sortOrder:i})));
    setBusy(false);
  }

  return <section className="image-manager">
    <div className="section-title">
      <div><h2>Productfoto&apos;s</h2><p className="muted">Upload eender welke beeldverhouding. Elke foto wordt automatisch genormaliseerd naar 1400 × 1400 en verschijnt overal in dezelfde vierkante verhouding.</p></div>
      <label className={`btn ${busy?"disabled":""}`}>+ Foto uploaden<input ref={inputRef} className="visually-hidden" type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif" multiple disabled={busy} onChange={e=>upload(e.target.files)}/></label>
    </div>
    <p className="muted small">JPG, PNG, WebP of AVIF. Foto’s van een smartphone worden vóór de upload automatisch extra gecomprimeerd. Grote foto&apos;s worden vóór de upload automatisch verkleind en geoptimaliseerd.</p>
    {error&&<p className="error">{error}</p>}
    {images.length===0 ? <div className="empty-state">Nog geen foto&apos;s. De eerste upload wordt automatisch de hoofdfoto.</div> : <div className="image-admin-grid">{images.map((img,index)=><article className="image-admin-card" key={img.id}>
      <div className="image-square"><img src={img.url} alt={img.altText||"Productfoto"}/>{index===0&&<span className="primary-label">★ Hoofdfoto</span>}</div>
      <div className="image-admin-actions">
        {index!==0&&<button type="button" className="text-btn" disabled={busy} onClick={()=>makePrimary(index)}>Hoofdfoto maken</button>}
        <div><button type="button" className="mini-btn" disabled={busy||index===0} onClick={()=>move(index,-1)}>←</button><button type="button" className="mini-btn" disabled={busy||index===images.length-1} onClick={()=>move(index,1)}>→</button></div>
        <button type="button" className="text-btn danger" disabled={busy} onClick={()=>remove(img.id)}>Verwijderen</button>
      </div>
    </article>)}</div>}
  </section>;
}
