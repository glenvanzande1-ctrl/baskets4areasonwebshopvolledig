"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function MinimumStockForm({ variantId, locationId, minStock }: { variantId: string; locationId: string; minStock: number }) {
  const router = useRouter();
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/admin/inventory/${variantId}/minimum`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ locationId, minStock: Number(form.get("minStock")) }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) { setError(data.error ?? "Opslaan mislukt."); return; }
    router.refresh();
  }
  return <form className="inline-form" onSubmit={submit}>
    <label>Minimumvoorraad<input className="input" type="number" min="0" name="minStock" defaultValue={minStock} required /></label>
    <button className="btn secondary">Opslaan</button>
    {error && <span className="error">{error}</span>}
  </form>;
}
