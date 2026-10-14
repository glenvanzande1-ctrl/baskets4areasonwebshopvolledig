import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import PrintReceiptButton from "@/components/PrintReceiptButton";

function euro(value: unknown) { return new Intl.NumberFormat("nl-BE", { style: "currency", currency: "EUR" }).format(Number(value)); }
function date(value: Date) { return new Intl.DateTimeFormat("nl-BE", { dateStyle: "short", timeStyle: "short" }).format(value); }

export default async function ReceiptPage({ params }: { params: Promise<{ saleNumber: string }> }) {
  const session = await getSession();
  if (!session) return null;
  const { saleNumber } = await params;
  const sale = await prisma.posSale.findUnique({ where: { saleNumber }, include: { items: true, user: true } });
  if (!sale) notFound();
  const taxes = new Map<number, number>();
  for (const item of sale.items) taxes.set(Number(item.taxPercentage), (taxes.get(Number(item.taxPercentage)) ?? 0) + Number(item.taxAmount));
  return (
    <main className="receipt-page">
      <div className="receipt-actions no-print"><a className="btn secondary" href="/pos">Nieuwe verkoop</a><PrintReceiptButton /></div>
      <article className="receipt">
        <div className="receipt-center"><strong className="receipt-brand">BASKETS4AREASON</strong><div>Zandberg 10 · 9240 Zele</div></div>
        <div className="receipt-rule" />
        <div>Bon: {sale.saleNumber}</div><div>{date(sale.createdAt)}</div><div>Kassier: {sale.user.firstName || sale.user.email}</div>
        <div className="receipt-rule" />
        {sale.items.map((item) => <div className="receipt-item" key={item.id}><div><strong>{item.productName}</strong><small>{item.variantLabel}</small><small>{item.quantity} × {euro(item.unitPrice)} · BTW {Number(item.taxPercentage)}%</small></div><strong>{euro(item.lineTotal)}</strong></div>)}
        <div className="receipt-rule" />
        <div className="receipt-total"><span>TOTAAL</span><strong>{euro(sale.total)}</strong></div>
        {[...taxes.entries()].sort((a,b)=>a[0]-b[0]).map(([rate, amount]) => <div className="receipt-meta" key={rate}><span>BTW {rate}%</span><span>{euro(amount)}</span></div>)}
        <div className="receipt-meta"><span>Betaald</span><span>{sale.paymentMethod === "CASH" ? "Cash" : "Kaart"}</span></div>
        {sale.paymentMethod === "CASH" && <><div className="receipt-meta"><span>Ontvangen</span><span>{euro(sale.cashReceived ?? 0)}</span></div><div className="receipt-meta"><span>Terug</span><span>{euro(sale.changeDue ?? 0)}</span></div></>}
        <div className="receipt-rule" /><div className="receipt-center">Bedankt voor je aankoop!</div>
      </article>
    </main>
  );
}
