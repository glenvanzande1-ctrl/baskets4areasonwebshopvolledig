import { getSession } from "@/lib/auth";

export default async function PosPage() {
  const session = await getSession();
  return (
    <main className="pos">
      <section className="pos-panel">
        <div className="topbar"><div><div className="brand">Baskets4areason</div><h1>Fysieke winkel / Kassa</h1></div>{session?.role !== "CASHIER" && <a className="btn secondary" href="/admin">Terug naar beheer</a>}</div>
        <p className="muted">Aparte kassamodus. Barcode-invoer wordt in fase 7 gekoppeld aan Zebra en voorraad.</p>
        <input className="scan" placeholder="Scan barcode of zoek product…" autoFocus />
        <div className="grid">
          <div className="tile"><strong>Winkelmand</strong>Nog geen artikelen.</div>
          <div className="tile"><strong>Totaal</strong>€ 0,00</div>
        </div>
      </section>
    </main>
  );
}
