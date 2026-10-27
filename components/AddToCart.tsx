"use client";
import { useState } from "react";

export default function AddToCart({ variants }: { variants: { id:string; label:string; price:string; available:number; unlimited?:boolean }[] }) {
  const [variantId, setVariantId] = useState(variants.find(v => v.unlimited || v.available > 0)?.id ?? variants[0]?.id ?? "");
  const [loading,setLoading]=useState(false); const [message,setMessage]=useState("");
  const selected=variants.find(v=>v.id===variantId);
  async function add(){
    if (!variantId || !selected || (!selected.unlimited && selected.available <= 0)) return;
    setLoading(true);setMessage("");
    const r=await fetch("/api/shop/cart",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({variantId,quantity:1})});
    const d=await r.json().catch(()=>({}));
    setLoading(false);
    if(!r.ok){setMessage(d.error??"Toevoegen mislukt.");return;}
    window.location.href="/winkelmand";
  }
  return <div className="buy-box"><label>Variant<select className="input" value={variantId} onChange={e=>setVariantId(e.target.value)}>{variants.map(v=><option key={v.id} value={v.id}>{v.label} — € {v.price} {v.unlimited ? "(onbeperkt beschikbaar)" : v.available <= 0 ? "(uitverkocht)" : `(${v.available} beschikbaar)`}</option>)}</select></label><button className="btn" onClick={add} disabled={loading || !selected || (!selected.unlimited && selected.available <= 0)}>{loading ? "Toevoegen..." : selected?.unlimited || (selected?.available ?? 0) > 0 ? "In winkelmand" : "Uitverkocht"}</button>{message && <p className="small">{message}</p>}</div>;
}
