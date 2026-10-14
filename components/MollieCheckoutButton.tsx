"use client";
import { useState } from "react";
export default function MollieCheckoutButton(){
  const [busy,setBusy]=useState(false); const [error,setError]=useState("");
  async function pay(){
    setBusy(true);setError("");
    try{
      const r=await fetch("/api/shop/checkout",{method:"POST"});
      const data=await r.json().catch(()=>({}));
      if(!r.ok) throw new Error(data.error||"Betaling kon niet gestart worden.");
      window.location.href=data.checkoutUrl;
    }catch(e){setError(e instanceof Error?e.message:"Er ging iets mis.");setBusy(false)}
  }
  return <div><button className="btn" onClick={pay} disabled={busy}>{busy?"Betaling voorbereiden…":"Betalen via Mollie"}</button>{error&&<p className="error">{error}</p>}</div>
}
