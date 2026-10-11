"use client";
import { useState } from "react";

export default function CartLine({ itemId, quantity, max }: { itemId:string; quantity:number; max:number }) {
  const [busy,setBusy]=useState(false);
  async function update(q:number){ setBusy(true); await fetch(`/api/shop/cart/${itemId}`,{method:q<=0?"DELETE":"PATCH",headers:{"Content-Type":"application/json"},body:q<=0?undefined:JSON.stringify({quantity:q})}); window.location.reload(); }
  return <div className="cart-actions"><button disabled={busy || quantity<=1} onClick={()=>update(quantity-1)}>−</button><span>{quantity}</span><button disabled={busy || quantity>=max} onClick={()=>update(quantity+1)}>+</button><button className="remove" disabled={busy} onClick={()=>update(0)}>Verwijder</button></div>;
}
