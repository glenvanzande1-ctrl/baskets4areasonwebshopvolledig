"use client";

import { useMemo, useRef, useState } from "react";

type SearchResult = {
  id: string;
  productName: string;
  label: string;
  sku: string;
  barcode: string | null;
  price: number;
  tax: number;
  available: number;
};

type CartLine = SearchResult & { quantity: number };

function euro(value: number) {
  return new Intl.NumberFormat("nl-BE", { style: "currency", currency: "EUR" }).format(value);
}

export default function PosRegister() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD">("CARD");
  const [cashReceived, setCashReceived] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const total = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);
  const taxRows = useMemo(() => {
    const map = new Map<number, number>();
    for (const item of cart) {
      const gross = item.price * item.quantity;
      const tax = gross * item.tax / (100 + item.tax);
      map.set(item.tax, (map.get(item.tax) ?? 0) + tax);
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0]);
  }, [cart]);
  const changeDue = paymentMethod === "CASH" ? Math.max(0, (Number(cashReceived.replace(",", ".")) || 0) - total) : 0;

  function focusScanner() {
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function addItem(item: SearchResult) {
    setError("");
    setCart((current) => {
      const existing = current.find((line) => line.id === item.id);
      const nextQty = (existing?.quantity ?? 0) + 1;
      if (nextQty > item.available) {
        setError(`Niet genoeg beschikbare voorraad voor ${item.productName}.`);
        return current;
      }
      if (existing) return current.map((line) => line.id === item.id ? { ...line, quantity: nextQty } : line);
      return [...current, { ...item, quantity: 1 }];
    });
    setQuery("");
    setResults([]);
    focusScanner();
  }

  async function search(autoAddExact = false) {
    const q = query.trim();
    if (!q) return;
    setError("");
    const response = await fetch(`/api/pos/search?q=${encodeURIComponent(q)}`);
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || "Zoeken mislukt.");
      return;
    }
    setResults(data.results || []);
    if (autoAddExact && data.exact) {
      const exact = (data.results as SearchResult[]).find((r) => r.id === data.exact);
      if (exact) addItem(exact);
    }
  }

  function changeQty(id: string, delta: number) {
    setCart((current) => current.flatMap((line) => {
      if (line.id !== id) return [line];
      const next = line.quantity + delta;
      if (next <= 0) return [];
      if (next > line.available) {
        setError(`Maximaal ${line.available} beschikbaar voor ${line.productName}.`);
        return [line];
      }
      return [{ ...line, quantity: next }];
    }));
    focusScanner();
  }

  async function completeSale() {
    if (!cart.length) return;
    setBusy(true);
    setError("");
    try {
      const cashValue = Number(cashReceived.replace(",", "."));
      const response = await fetch("/api/pos/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((line) => ({ variantId: line.id, quantity: line.quantity })),
          paymentMethod,
          cashReceived: paymentMethod === "CASH" ? cashValue : null,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Verkoop opslaan mislukt.");
      setCart([]);
      setCashReceived("");
      window.location.href = `/pos/receipt/${data.saleNumber}`;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Verkoop opslaan mislukt.");
      setBusy(false);
      focusScanner();
    }
  }

  return (
    <div className="pos-register">
      <section className="pos-left">
        <form className="pos-searchbar" onSubmit={(e) => { e.preventDefault(); search(true); }}>
          <input
            ref={inputRef}
            className="scan"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Scan barcode of zoek product…"
            autoFocus
            autoComplete="off"
          />
          <button className="btn" type="button" onClick={() => search(false)}>Zoeken</button>
        </form>
        {results.length > 0 && (
          <div className="pos-results">
            {results.map((item) => (
              <button key={item.id} className="pos-result" type="button" onClick={() => addItem(item)} disabled={item.available <= 0}>
                <span><strong>{item.productName}</strong><small>{item.label} · {item.sku}{item.barcode ? ` · ${item.barcode}` : ""}</small></span>
                <span><strong>{euro(item.price)}</strong><small>{item.available} beschikbaar</small></span>
              </button>
            ))}
          </div>
        )}

        <div className="pos-cart">
          <div className="pos-section-head"><h2>Winkelmand</h2><span>{cart.reduce((s, i) => s + i.quantity, 0)} artikel(en)</span></div>
          {!cart.length ? <div className="empty-state">Scan een barcode of zoek een product.</div> : cart.map((line) => (
            <div className="pos-line" key={line.id}>
              <div><strong>{line.productName}</strong><small>{line.label} · BTW {line.tax}%</small></div>
              <div className="pos-qty">
                <button type="button" onClick={() => changeQty(line.id, -1)}>−</button>
                <strong>{line.quantity}</strong>
                <button type="button" onClick={() => changeQty(line.id, 1)}>+</button>
              </div>
              <strong>{euro(line.price * line.quantity)}</strong>
              <button className="text-btn danger" type="button" onClick={() => setCart((c) => c.filter((x) => x.id !== line.id))}>Verwijder</button>
            </div>
          ))}
        </div>
      </section>

      <aside className="pos-checkout">
        <h2>Afrekenen</h2>
        <div className="pos-total"><span>Totaal</span><strong>{euro(total)}</strong></div>
        {taxRows.map(([rate, amount]) => <div className="pos-tax" key={rate}><span>BTW {rate}%</span><span>{euro(amount)}</span></div>)}

        <div className="pos-payments">
          <button type="button" className={`pay-choice ${paymentMethod === "CARD" ? "active" : ""}`} onClick={() => setPaymentMethod("CARD")}>Kaart</button>
          <button type="button" className={`pay-choice ${paymentMethod === "CASH" ? "active" : ""}`} onClick={() => setPaymentMethod("CASH")}>Cash</button>
        </div>

        {paymentMethod === "CASH" && (
          <div className="cash-box">
            <label>Ontvangen bedrag
              <input className="input" inputMode="decimal" value={cashReceived} onChange={(e) => setCashReceived(e.target.value)} placeholder="0,00" />
            </label>
            <div className="change-row"><span>Terug te geven</span><strong>{euro(changeDue)}</strong></div>
          </div>
        )}

        {error && <p className="error">{error}</p>}
        <button className="btn pos-complete" type="button" disabled={busy || !cart.length || (paymentMethod === "CASH" && (Number(cashReceived.replace(",", ".")) || 0) < total)} onClick={completeSale}>
          {busy ? "Bezig…" : `Verkoop afronden · ${euro(total)}`}
        </button>
        <button className="btn secondary pos-clear" type="button" disabled={!cart.length || busy} onClick={() => { setCart([]); setError(""); setCashReceived(""); focusScanner(); }}>Winkelmand wissen</button>
      </aside>
    </div>
  );
}
