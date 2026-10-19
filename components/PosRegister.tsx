"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type SearchResult = {
  id: string;
  productName: string;
  label: string;
  sku: string;
  barcode: string | null;
  price: number;
  tax: number;
  available: number;
  categoryId?: string | null;
  categoryName?: string;
  imageUrl?: string | null;
};

type Category = { id: string; name: string };
type CartLine = SearchResult & { quantity: number };

function euro(value: number) {
  return new Intl.NumberFormat("nl-BE", { style: "currency", currency: "EUR" }).format(value);
}

export default function PosRegister() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [catalog, setCatalog] = useState<SearchResult[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [busy, setBusy] = useState(false);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [error, setError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD">("CARD");
  const [cashReceived, setCashReceived] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/pos/catalog", { cache: "no-store" });
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "Catalogus laden mislukt.");
        setCatalog(d.products || []);
        setCategories(d.categories || []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Catalogus laden mislukt.");
      } finally {
        setLoadingCatalog(false);
        setTimeout(() => inputRef.current?.focus(), 80);
      }
    })();
  }, []);

  const total = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);
  const subtotal = total;
  const taxRows = useMemo(() => {
    const map = new Map<number, number>();
    for (const item of cart) {
      const gross = item.price * item.quantity;
      const tax = gross * item.tax / (100 + item.tax);
      map.set(item.tax, (map.get(item.tax) ?? 0) + tax);
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0]);
  }, [cart]);
  const taxTotal = taxRows.reduce((sum, [, amount]) => sum + amount, 0);
  const changeDue = paymentMethod === "CASH" ? Math.max(0, (Number(cashReceived.replace(",", ".")) || 0) - total) : 0;

  const filteredCatalog = useMemo(() => {
    if (activeCategory === "ALL") return catalog;
    return catalog.filter((p) => p.categoryId === activeCategory);
  }, [catalog, activeCategory]);

  function focusScanner() {
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function addItem(item: SearchResult) {
    setError("");
    if (item.available <= 0) {
      setError(`${item.productName} is niet op voorraad.`);
      return;
    }
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
    const response = await fetch(`/api/pos/search?q=${encodeURIComponent(q)}`, { cache: "no-store" });
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

  function keypad(key: string) {
    if (key === "C") return setCashReceived("");
    if (key === "⌫") return setCashReceived((v) => v.slice(0, -1));
    setCashReceived((v) => `${v}${key === "." ? "," : key}`);
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
    <div className="pos-modern">
      <section className="pos-product-area">
        <form className="pos-modern-search" onSubmit={(e) => { e.preventDefault(); search(true); }}>
          <div className="pos-scan-input-wrap">
            <span className="pos-scan-icon">▣</span>
            <input
              ref={inputRef}
              className="pos-modern-scan"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Scan barcode of zoek product…"
              autoFocus
              autoComplete="off"
            />
          </div>
          <button className="pos-search-btn" type="button" onClick={() => search(false)}>Zoeken</button>
        </form>

        {results.length > 0 && (
          <div className="pos-modern-results">
            {results.map((item) => (
              <button key={item.id} className="pos-modern-result" type="button" onClick={() => addItem(item)} disabled={item.available <= 0}>
                <span><strong>{item.productName}</strong><small>{item.label} · {item.sku}</small></span>
                <span><strong>{euro(item.price)}</strong><small>{item.available} beschikbaar</small></span>
              </button>
            ))}
          </div>
        )}

        <div className="pos-category-strip">
          <button type="button" className={activeCategory === "ALL" ? "active" : ""} onClick={() => setActiveCategory("ALL")}>Alle</button>
          {categories.map((cat) => (
            <button key={cat.id} type="button" className={activeCategory === cat.id ? "active" : ""} onClick={() => setActiveCategory(cat.id)}>{cat.name}</button>
          ))}
        </div>

        <div className="pos-product-grid">
          {loadingCatalog ? <div className="pos-grid-message">Producten laden…</div> : filteredCatalog.map((item) => (
            <button key={item.id} type="button" className="pos-product-tile" onClick={() => addItem(item)} disabled={item.available <= 0}>
              <div className="pos-product-thumb">
                {item.imageUrl ? <img src={item.imageUrl} alt="" /> : <span>{item.productName.slice(0, 1).toUpperCase()}</span>}
              </div>
              <div className="pos-product-tile-info">
                <strong>{item.productName}</strong>
                <small>{item.label}</small>
                <div><b>{euro(item.price)}</b><em className={item.available <= 3 ? "low" : ""}>{item.available} st.</em></div>
              </div>
            </button>
          ))}
          {!loadingCatalog && !filteredCatalog.length && <div className="pos-grid-message">Geen producten in deze categorie.</div>}
        </div>
      </section>

      <aside className="pos-order-panel">
        <div className="pos-order-head">
          <div><span>Huidige verkoop</span><strong>{cart.reduce((s, i) => s + i.quantity, 0)} artikel(en)</strong></div>
          <button type="button" onClick={() => { setCart([]); setError(""); setCashReceived(""); focusScanner(); }} disabled={!cart.length || busy}>Wissen</button>
        </div>

        <div className="pos-order-lines">
          {!cart.length ? <div className="pos-empty-order">Scan een barcode of tik een product aan.</div> : cart.map((line) => (
            <div className="pos-order-line" key={line.id}>
              <div className="pos-order-title"><strong>{line.productName}</strong><small>{line.label} · BTW {line.tax}%</small></div>
              <div className="pos-order-line-price"><strong>{euro(line.price * line.quantity)}</strong><small>{euro(line.price)} / stuk</small></div>
              <div className="pos-order-controls">
                <button type="button" onClick={() => changeQty(line.id, -1)}>−</button>
                <span>{line.quantity}</span>
                <button type="button" onClick={() => changeQty(line.id, 1)}>+</button>
                <button className="delete" type="button" onClick={() => setCart((c) => c.filter((x) => x.id !== line.id))}>×</button>
              </div>
            </div>
          ))}
        </div>

        <div className="pos-order-summary">
          <div><span>Subtotaal</span><strong>{euro(subtotal - taxTotal)}</strong></div>
          {taxRows.map(([rate, amount]) => <div key={rate}><span>BTW {rate}%</span><span>{euro(amount)}</span></div>)}
          <div className="total"><span>Totaal</span><strong>{euro(total)}</strong></div>
        </div>

        <div className="pos-payment-toggle">
          <button type="button" className={paymentMethod === "CARD" ? "active" : ""} onClick={() => setPaymentMethod("CARD")}>Kaart</button>
          <button type="button" className={paymentMethod === "CASH" ? "active" : ""} onClick={() => setPaymentMethod("CASH")}>Cash</button>
        </div>

        {paymentMethod === "CASH" && (
          <div className="pos-keypad-area">
            <div className="pos-cash-display"><span>Ontvangen</span><strong>{cashReceived || "0,00"}</strong></div>
            <div className="pos-keypad">
              {["1","2","3","4","5","6","7","8","9","C","0","⌫"].map((k) => <button key={k} type="button" onClick={() => keypad(k)}>{k}</button>)}
            </div>
            <div className="pos-change"><span>Terug</span><strong>{euro(changeDue)}</strong></div>
          </div>
        )}

        {error && <p className="error pos-order-error">{error}</p>}
        <button className="pos-pay-button" type="button" disabled={busy || !cart.length || (paymentMethod === "CASH" && (Number(cashReceived.replace(",", ".")) || 0) < total)} onClick={completeSale}>
          {busy ? "Bezig…" : `Afrekenen · ${euro(total)}`}
        </button>
      </aside>
    </div>
  );
}
