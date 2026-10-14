"use client";
import { useState } from "react";

type Item={id:string;productName:string;variantLabel:string;quantity:number;returned:number;unitPrice:number;};
export default function PosReturnForm({saleId,saleNumber,items}:{saleId:string;saleNumber:string;items:Item[]}){
  const [qty,setQty]=useState<Record<string,number>>({});
  const [restock,setRestock]=useState<Record<string,boolean>>(Object.fromEntries(items.map(i=>[i.id,true])));
  const [note,setNote]=useState(""); const [busy,setBusy]=useState(false); const [error,setError]=useState(""); const [done,setDone]=useState("");
  async function submit(){
    const selected=items.flatMap(i=>{const q=qty[i.id]||0;return q>0?[{saleItemId:i.id,quantity:q,restock:restock[i.id]!==false}]:[]});
    if(!selected.length){setError("Selecteer minstens één retourartikel.");return;}
    setBusy(true);setError("");
    const r=await fetch("/api/pos/returns",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({saleId,items:selected,note})});
    const d=await r.json();setBusy(false);if(!r.ok){setError(d.error||"Retour mislukt.");return;}setDone(d.returnNumber);setTimeout(()=>window.location.reload(),900);
  }
  return <div className="return-form"><h2>Retour voor {saleNumber}</h2>{items.map(i=>{const max=i.quantity-i.returned;return <div className="return-line" key={i.id}><div><strong>{i.productName}</strong><small>{i.variantLabel} · verkocht {i.quantity} · reeds retour {i.returned}</small></div><label>Aantal<input className="input" type="number" min="0" max={max} value={qty[i.id]||0} onChange={e=>setQty({...qty,[i.id]:Math.min(max,Math.max(0,Number(e.target.value)))})}/></label><label className="check"><input type="checkbox" checked={restock[i.id]!==false} onChange={e=>setRestock({...restock,[i.id]:e.target.checked})}/>Terug in voorraad</label></div>})}
    <label>Opmerking<input className="input" value={note} onChange={e=>setNote(e.target.value)} placeholder="Optioneel"/></label>{error&&<p className="error">{error}</p>}{done&&<p className="success-box">Retour verwerkt: {done}</p>}<button className="btn" type="button" disabled={busy} onClick={submit}>{busy?"Bezig…":"Retour verwerken"}</button></div>;
}
