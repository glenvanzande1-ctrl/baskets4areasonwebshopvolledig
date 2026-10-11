"use client";
import { useState } from "react";

export default function AddToCart({ variants }: { variants: { id:string; label:string; price:string; available:number }[] }) {
  const [variantId, setVariantId] = useState(variants.find(v => v.available > 0)?.id ?? variants[0]?.id ?? "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const selected = variants.find(v => v.id === variantId);
  async function add() {
    if (!variantId || !selected || selected.available <= 0) return;
    setLoading(true); setMessage("");
    const res = await fetch("/api/shop/cart", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ variantId, quantity:1 }) });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) return setMessage(data.error ?? "Toevoegen mislukt.");
    setMessage("Toegevoegd aan winkelmand.");
    window.dispatchEvent(new Event("cart-updated"));
    setTimeout(() => window.location.reload(), 350);
  }
  return <div className="buy-box"><label>Variant<select className="input" value={variantId} onChange={e=>setVariantId(e.target.value)}>{variants.map(v=><option key={v.id} value={v.id}>{v.label} — € {v.price} {v.available <= 0 ? "(uitverkocht)" : `(${v.available} beschikbaar)`}</option>)}</select></label><button className="btn" onClick={add} disabled={loading || !selected || selected.available <= 0}>{loading ? "Toevoegen..." : selected?.available ? "In winkelmand" : "Uitverkocht"}</button>{message && <p className="small">{message}</p>}</div>;
}
