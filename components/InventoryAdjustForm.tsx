"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function InventoryAdjustForm({ variantId, locationId }: { variantId: string; locationId: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true); setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/admin/inventory/${variantId}/adjust`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        locationId,
        operation: form.get("operation"),
        quantity: Number(form.get("quantity")),
        note: form.get("note"),
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) { setError(data.error ?? "Voorraad aanpassen mislukt."); setLoading(false); return; }
    event.currentTarget.reset();
    router.refresh();
    setLoading(false);
  }

  return <form className="form-stack inventory-form" onSubmit={submit}>
    <div className="form-grid three">
      <label>Type
        <select className="input" name="operation" defaultValue="RECEIPT">
          <option value="RECEIPT">Levering / ontvangst (+)</option>
          <option value="RETURN">Retour verkoopbaar (+)</option>
          <option value="ADJUSTMENT_IN">Correctie omhoog (+)</option>
          <option value="ADJUSTMENT_OUT">Correctie omlaag (-)</option>
          <option value="DAMAGE">Beschadigd / verloren (-)</option>
        </select>
      </label>
      <label>Aantal<input className="input" name="quantity" type="number" min="1" step="1" required /></label>
      <label>Notitie<input className="input" name="note" placeholder="bv. levering leverancier" /></label>
    </div>
    {error && <div className="error">{error}</div>}
    <div><button className="btn" disabled={loading}>{loading ? "Opslaan…" : "Voorraadmutatie opslaan"}</button></div>
  </form>;
}
