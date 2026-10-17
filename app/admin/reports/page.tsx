import { getReport, normalizePeriod } from "@/lib/reporting";

export const dynamic = "force-dynamic";

function euro(v: number) { return new Intl.NumberFormat("nl-BE", { style: "currency", currency: "EUR" }).format(v); }
function n(v: number) { return new Intl.NumberFormat("nl-BE").format(v); }
function shortDate(v: string) { return new Intl.DateTimeFormat("nl-BE", { day: "2-digit", month: "2-digit" }).format(new Date(`${v}T12:00:00Z`)); }

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const sp = await searchParams;
  const period = normalizePeriod(sp.period);
  const r = await getReport(period);
  const maxDay = Math.max(1, ...r.daily.map((d) => d.total));
  const labels: Record<string, string> = { today: "Vandaag", week: "Deze week", month: "Deze maand", "30d": "Laatste 30 dagen", year: "Dit jaar" };

  return <main className="admin-shell"><section className="admin-card report-page">
    <div className="topbar"><div><a className="back" href="/admin">← Beheer</a><h1>Rapportering</h1><p className="muted">Omzet, BTW, voorraad en verkoopkanalen in één overzicht.</p></div><a className="btn secondary" href={`/api/admin/reports/export?period=${period}`}>Exporteer CSV</a></div>
    <div className="report-periods">{(["today","week","month","30d","year"] as const).map((p)=><a key={p} className={p===period?"active":""} href={`/admin/reports?period=${p}`}>{labels[p]}</a>)}</div>

    <div className="report-kpis">
      <div><span>Totale omzet</span><strong>{euro(r.summary.totalGross)}</strong><small>incl. btw, na POS-retouren</small></div>
      <div><span>Webshop</span><strong>{euro(r.summary.onlineGross)}</strong><small>{n(r.summary.onlineOrderCount)} betaalde orders</small></div>
      <div><span>Fysieke winkel</span><strong>{euro(r.summary.posGross)}</strong><small>{n(r.summary.posSaleCount)} kassaverkopen</small></div>
      <div><span>BTW totaal</span><strong>{euro(r.summary.totalTax)}</strong><small>op verkopen in periode</small></div>
      <div><span>Gem. verkoop</span><strong>{euro(r.summary.average)}</strong><small>webshop + kassa</small></div>
      <div><span>Kortingen</span><strong>{euro(r.summary.discountsTotal)}</strong><small>webshopkortingen</small></div>
    </div>

    <div className="report-grid two">
      <section className="report-box"><div className="report-box-head"><div><span className="eyebrow">Omzettrend</span><h2>Per dag</h2></div><div className="legend"><span>● Webshop</span><span>● Winkel</span></div></div>
        {r.daily.length ? <div className="bar-chart">{r.daily.map((d)=><div className="bar-day" key={d.date}><div className="bar-stack" title={`${d.date}: ${euro(d.total)}`}><i className="bar-online" style={{height:`${Math.max(2,d.online/maxDay*100)}%`}}/><i className="bar-pos" style={{height:`${Math.max(2,d.pos/maxDay*100)}%`}}/></div><small>{shortDate(d.date)}</small><b>{euro(d.total)}</b></div>)}</div> : <p className="muted">Nog geen verkopen in deze periode.</p>}
      </section>
      <section className="report-box"><span className="eyebrow">Verkoopkanalen</span><h2>Webshop vs winkel</h2>
        <div className="channel-row"><span>Webshop</span><strong>{euro(r.summary.onlineGross)}</strong></div><div className="channel-meter"><i style={{width:`${r.summary.totalGross? r.summary.onlineGross/r.summary.totalGross*100:0}%`}}/></div>
        <div className="channel-row"><span>Fysieke winkel</span><strong>{euro(r.summary.posGross)}</strong></div><div className="channel-meter"><i style={{width:`${r.summary.totalGross? r.summary.posGross/r.summary.totalGross*100:0}%`}}/></div>
        <hr/><div className="channel-row"><span>Cash</span><strong>{euro(r.summary.cash)}</strong></div><div className="channel-row"><span>Kaart</span><strong>{euro(r.summary.card)}</strong></div><div className="channel-row"><span>POS-retouren</span><strong>- {euro(r.summary.returns)}</strong></div>
      </section>
    </div>

    <div className="report-grid two">
      <section className="report-box"><span className="eyebrow">BTW</span><h2>BTW-overzicht</h2><div className="table-wrap compact responsive-table"><table><thead><tr><th>Tarief</th><th>Excl.</th><th>BTW</th><th>Incl.</th></tr></thead><tbody>{r.taxes.map(t=><tr key={t.percentage}><td data-label="Tarief"><strong>{t.percentage}%</strong></td><td data-label="Excl.">{euro(t.net)}</td><td data-label="BTW">{euro(t.tax)}</td><td data-label="Incl.">{euro(t.gross)}</td></tr>)}</tbody><tfoot><tr><td data-label="Totaal"><strong>Totaal</strong></td><td data-label="Excl."><strong>{euro(r.summary.totalNet)}</strong></td><td data-label="BTW"><strong>{euro(r.summary.totalTax)}</strong></td><td data-label="Incl."><strong>{euro(r.summary.totalGross)}</strong></td></tr></tfoot></table></div><p className="report-note">Gebruik dit als operationeel overzicht; de boekhouding blijft de officiële bron voor aangiftes.</p></section>
      <section className="report-box"><span className="eyebrow">Voorraad</span><h2>Actuele positie</h2><div className="mini-kpis"><div><span>Fysiek</span><strong>{n(r.summary.onHandUnits)}</strong></div><div><span>Gereserveerd</span><strong>{n(r.summary.reservedUnits)}</strong></div><div><span>Lage voorraad</span><strong>{n(r.summary.lowStockCount)}</strong></div></div><div className="inventory-value"><span>Verkoopwaarde huidige voorraad</span><strong>{euro(r.summary.retailInventoryValue)}</strong><small>Berekend aan actuele verkoopprijs, niet aan aankoopwaarde.</small></div></section>
    </div>

    <div className="report-grid two">
      <section className="report-box"><span className="eyebrow">Bestsellers</span><h2>Topproducten</h2>{r.products.length?<div className="ranking">{r.products.map((p,i)=><div key={`${p.name}-${i}`}><span>{i+1}</span><p><strong>{p.name}</strong><small>{n(p.quantity)} stuks</small></p><b>{euro(p.revenue)}</b></div>)}</div>:<p className="muted">Nog geen verkoopdata.</p>}</section>
      <section className="report-box"><span className="eyebrow">Voorraadwaarschuwing</span><h2>Lage voorraad</h2>{r.lowStock.length?<div className="ranking low-stock-list">{r.lowStock.map((s)=><a href={`/admin/inventory/${s.variantId}`} key={`${s.variantId}-${s.location}`}><span className="warn-dot">!</span><p><strong>{s.product}</strong><small>{s.sku} · {s.location}</small></p><b>{s.available} beschikbaar</b></a>)}</div>:<p className="positive">Geen varianten onder minimumvoorraad.</p>}</section>
    </div>

    <div className="report-grid two">
      <section className="report-box"><span className="eyebrow">Webshop</span><h2>Operationele bedragen</h2><div className="channel-row"><span>Leveringskosten</span><strong>{euro(r.summary.shipping)}</strong></div><div className="channel-row"><span>Toegekende korting</span><strong>{euro(r.summary.discountsTotal)}</strong></div></section>
      <section className="report-box"><span className="eyebrow">Promoties</span><h2>Kortingsgebruik</h2>{r.discountUsage.length?<div className="ranking">{r.discountUsage.map((d,i)=><div key={d.code}><span>{i+1}</span><p><strong>{d.code}</strong><small>{d.active?"Actief":"Inactief"}</small></p><b>{d.usedCount}×</b></div>)}</div>:<p className="muted">Nog geen kortingscodes gebruikt.</p>}</section>
    </div>
  </section></main>;
}
