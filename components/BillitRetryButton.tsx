"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export default function BillitRetryButton({ syncId }: { syncId: string }) {
  const [loading,setLoading]=useState(false); const [error,setError]=useState(""); const router=useRouter();
  async function retry(){setLoading(true);setError("");const r=await fetch("/api/billit/retry",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({syncId})});const d=await r.json().catch(()=>({}));if(!r.ok){setError(d.error||"Mislukt");setLoading(false);return;}router.refresh();setLoading(false);}
  return <div><button className="btn secondary" type="button" onClick={retry} disabled={loading}>{loading?"Bezig…":"Opnieuw proberen"}</button>{error&&<div className="error small">{error}</div>}</div>;
}
