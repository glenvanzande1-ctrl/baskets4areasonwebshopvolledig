"use client";
import { useState } from "react";
export default function OrderStatusForm({orderId,status,fulfillmentMethod}:{orderId:string;status:string;fulfillmentMethod:string}){
 const [busy,setBusy]=useState(false); const [message,setMessage]=useState("");
 async function update(next:string){setBusy(true);setMessage("");const r=await fetch(`/api/admin/orders/${orderId}/status`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status:next})});const d=await r.json().catch(()=>({}));setBusy(false);if(!r.ok){setMessage(d.error||"Kon status niet wijzigen");return}window.location.reload()}
 const delivery=fulfillmentMethod==="DELIVERY";
 return <div className="actions"><button className="btn secondary" disabled={busy||status==="PROCESSING"} onClick={()=>update("PROCESSING")}>In verwerking</button>{delivery?<button className="btn secondary" disabled={busy||status==="SHIPPED"} onClick={()=>update("SHIPPED")}>Verzonden</button>:<button className="btn secondary" disabled={busy||status==="READY_FOR_PICKUP"} onClick={()=>update("READY_FOR_PICKUP")}>Klaar voor afhaling</button>}<button className="btn" disabled={busy||status==="COMPLETED"} onClick={()=>update("COMPLETED")}>Voltooid</button>{message&&<span className="error">{message}</span>}</div>
}
