import { NextRequest } from "next/server";
import { requireManager } from "@/lib/admin";
import { getReport, normalizePeriod } from "@/lib/reporting";

function csvCell(v: unknown) { const s = String(v ?? ""); return `"${s.replaceAll('"','""')}"`; }
function row(...cells: unknown[]) { return cells.map(csvCell).join(";"); }

export async function GET(req: NextRequest) {
  const session = await requireManager();
  if (!session) return new Response("Niet toegelaten", { status: 403 });
  const period = normalizePeriod(req.nextUrl.searchParams.get("period"));
  const r = await getReport(period);
  const lines = [
    row("Baskets4areason rapport", period),
    row("Van", r.start.toISOString()), row("Tot", r.end.toISOString()), "",
    row("Kerncijfers"), row("Totale omzet incl. btw", r.summary.totalGross.toFixed(2)), row("Webshop", r.summary.onlineGross.toFixed(2)), row("Fysieke winkel", r.summary.posGross.toFixed(2)), row("BTW totaal", r.summary.totalTax.toFixed(2)), row("Gemiddelde verkoop", r.summary.average.toFixed(2)), row("Kortingen", r.summary.discountsTotal.toFixed(2)), row("Leveringskosten", r.summary.shipping.toFixed(2)), row("POS-retouren", r.summary.returns.toFixed(2)), "",
    row("BTW-overzicht"), row("Tarief", "Excl. btw", "BTW", "Incl. btw"), ...r.taxes.map(t=>row(`${t.percentage}%`,t.net.toFixed(2),t.tax.toFixed(2),t.gross.toFixed(2))), "",
    row("Dagomzet"), row("Datum","Webshop","Fysieke winkel","Totaal"), ...r.daily.map(d=>row(d.date,d.online.toFixed(2),d.pos.toFixed(2),d.total.toFixed(2))), "",
    row("Topproducten"), row("Product/variant","Aantal","Omzet"), ...r.products.map(p=>row(p.name,p.quantity,p.revenue.toFixed(2))), "",
    row("Lage voorraad"), row("Product","SKU","Locatie","Fysiek","Gereserveerd","Beschikbaar","Minimum"), ...r.lowStock.map(s=>row(s.product,s.sku,s.location,s.onHand,s.reserved,s.available,s.minStock)), "",
    row("Voorraad"), row("Fysieke stuks",r.summary.onHandUnits), row("Gereserveerde stuks",r.summary.reservedUnits), row("Verkoopwaarde voorraad",r.summary.retailInventoryValue.toFixed(2)),
  ];
  const body = "\uFEFF" + lines.join("\r\n");
  return new Response(body, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="baskets4areason-rapport-${period}.csv"`, "Cache-Control": "no-store" } });
}
