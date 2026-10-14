import { prisma } from "@/lib/db";

const TZ = "Europe/Brussels";
const REVENUE_ORDER_STATUSES = ["PAID", "PROCESSING", "READY_FOR_PICKUP", "SHIPPED", "COMPLETED"] as const;

export type ReportPeriod = "today" | "week" | "month" | "30d" | "year";

function partsInZone(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return { year: get("year"), month: get("month"), day: get("day"), hour: get("hour"), minute: get("minute"), second: get("second") };
}

function localMidnightToUtc(year: number, month: number, day: number) {
  const guess = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
  const zoned = partsInZone(guess);
  const represented = Date.UTC(zoned.year, zoned.month - 1, zoned.day, zoned.hour, zoned.minute, zoned.second);
  const offset = represented - guess.getTime();
  return new Date(guess.getTime() - offset);
}

function shiftLocalDate(year: number, month: number, day: number, days: number) {
  const d = new Date(Date.UTC(year, month - 1, day + days));
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

export function normalizePeriod(value?: string | null): ReportPeriod {
  return (["today", "week", "month", "30d", "year"] as const).includes(value as ReportPeriod) ? (value as ReportPeriod) : "month";
}

export function reportRange(period: ReportPeriod, now = new Date()) {
  const p = partsInZone(now);
  let startParts = { year: p.year, month: p.month, day: p.day };
  if (period === "week") {
    const weekday = new Date(Date.UTC(p.year, p.month - 1, p.day)).getUTCDay();
    const backToMonday = weekday === 0 ? 6 : weekday - 1;
    startParts = shiftLocalDate(p.year, p.month, p.day, -backToMonday);
  } else if (period === "month") {
    startParts = { year: p.year, month: p.month, day: 1 };
  } else if (period === "30d") {
    startParts = shiftLocalDate(p.year, p.month, p.day, -29);
  } else if (period === "year") {
    startParts = { year: p.year, month: 1, day: 1 };
  }
  return { start: localMidnightToUtc(startParts.year, startParts.month, startParts.day), end: now };
}

function dayKey(date: Date) {
  const p = partsInZone(date);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

function money(n: number) { return Math.round((n + Number.EPSILON) * 100) / 100; }

export async function getReport(period: ReportPeriod) {
  const { start, end } = reportRange(period);
  const [orders, posSales, inventory, discounts] = await Promise.all([
    prisma.order.findMany({
      where: { paidAt: { gte: start, lte: end }, status: { in: [...REVENUE_ORDER_STATUSES] } },
      include: { items: true }, orderBy: { paidAt: "asc" },
    }),
    prisma.posSale.findMany({
      where: { createdAt: { gte: start, lte: end }, status: { not: "VOIDED" } },
      include: { items: true, returns: { include: { items: { include: { saleItem: true } } } } }, orderBy: { createdAt: "asc" },
    }),
    prisma.inventoryStock.findMany({
      include: { variant: { include: { product: true } }, location: true },
      orderBy: [{ location: { name: "asc" } }, { variant: { product: { name: "asc" } } }],
    }),
    prisma.discountCode.findMany({ orderBy: [{ usedCount: "desc" }, { code: "asc" }] }),
  ]);

  const onlineGross = orders.reduce((s, o) => s + Number(o.total), 0);
  const onlineNet = orders.reduce((s, o) => s + Number(o.netTotal), 0);
  const onlineTax = orders.reduce((s, o) => s + Number(o.taxTotal), 0);
  const shipping = orders.reduce((s, o) => s + Number(o.shippingTotal), 0);
  const discountsTotal = orders.reduce((s, o) => s + Number(o.discountTotal), 0);

  let posGross = 0, posNet = 0, posTax = 0, returnGross = 0, cash = 0, card = 0;
  const productMap = new Map<string, { name: string; quantity: number; revenue: number }>();
  const taxMap = new Map<string, { percentage: number; gross: number; net: number; tax: number }>();
  const dailyMap = new Map<string, { online: number; pos: number }>();

  const addTax = (percentage: number, gross: number, net: number, tax: number) => {
    const key = percentage.toFixed(2);
    const row = taxMap.get(key) ?? { percentage, gross: 0, net: 0, tax: 0 };
    row.gross += gross; row.net += net; row.tax += tax; taxMap.set(key, row);
  };
  const addProduct = (key: string, name: string, quantity: number, revenue: number) => {
    const row = productMap.get(key) ?? { name, quantity: 0, revenue: 0 };
    row.quantity += quantity; row.revenue += revenue; productMap.set(key, row);
  };
  const addDaily = (date: Date, channel: "online" | "pos", value: number) => {
    const key = dayKey(date); const row = dailyMap.get(key) ?? { online: 0, pos: 0 }; row[channel] += value; dailyMap.set(key, row);
  };

  for (const order of orders) {
    addDaily(order.paidAt ?? order.createdAt, "online", Number(order.total));
    for (const item of order.items) {
      addProduct(item.variantId ?? item.sku, `${item.productName}${item.variantLabel ? ` · ${item.variantLabel}` : ""}`, item.quantity, Number(item.lineTotal));
      addTax(Number(item.taxPercentage), Number(item.lineTotal), Number(item.netAmount), Number(item.taxAmount));
    }
    // Shipping tax is part of order.taxTotal but not represented as an OrderItem.
    const itemTax = order.items.reduce((s, i) => s + Number(i.taxAmount), 0);
    const shippingTax = Math.max(0, Number(order.taxTotal) - itemTax);
    if (Number(order.shippingTotal) > 0 && shippingTax > 0) {
      const gross = Number(order.shippingTotal);
      const net = gross - shippingTax;
      const inferredRate = net > 0 ? Math.round((shippingTax / net) * 10000) / 100 : 0;
      addTax(inferredRate, gross, net, shippingTax);
    }
  }

  for (const sale of posSales) {
    const returnedBySaleItem = new Map<string, number>();
    for (const ret of sale.returns) for (const item of ret.items) returnedBySaleItem.set(item.saleItemId, (returnedBySaleItem.get(item.saleItemId) ?? 0) + item.quantity);
    let saleGrossAfterReturns = 0;
    for (const item of sale.items) {
      const returned = Math.min(item.quantity, returnedBySaleItem.get(item.id) ?? 0);
      const soldQty = item.quantity - returned;
      const grossPerUnit = Number(item.unitPrice);
      const gross = money(grossPerUnit * soldQty);
      const taxRate = Number(item.taxPercentage);
      const tax = money(gross * taxRate / (100 + taxRate));
      const net = money(gross - tax);
      const returnedValue = money(grossPerUnit * returned);
      returnGross += returnedValue;
      saleGrossAfterReturns += gross;
      posGross += gross; posTax += tax; posNet += net;
      if (soldQty > 0) {
        addProduct(item.variantId ?? item.sku, `${item.productName}${item.variantLabel ? ` · ${item.variantLabel}` : ""}`, soldQty, gross);
        addTax(taxRate, gross, net, tax);
      }
    }
    addDaily(sale.createdAt, "pos", saleGrossAfterReturns);
    if (sale.paymentMethod === "CASH") cash += saleGrossAfterReturns; else card += saleGrossAfterReturns;
  }

  const totalGross = onlineGross + posGross;
  const totalNet = onlineNet + posNet;
  const totalTax = onlineTax + posTax;
  const orderCount = orders.length + posSales.length;
  const average = orderCount ? totalGross / orderCount : 0;
  const onHandUnits = inventory.reduce((s, i) => s + Math.max(0, i.onHand), 0);
  const reservedUnits = inventory.reduce((s, i) => s + Math.max(0, i.reserved), 0);
  const lowStock = inventory.filter((i) => i.onHand - i.reserved <= i.minStock);
  const retailInventoryValue = inventory.reduce((s, i) => s + Math.max(0, i.onHand) * Number(i.variant.price), 0);
  const products = [...productMap.values()].sort((a, b) => b.quantity - a.quantity || b.revenue - a.revenue).slice(0, 10);
  const taxes = [...taxMap.values()].sort((a, b) => a.percentage - b.percentage).map((r) => ({ ...r, gross: money(r.gross), net: money(r.net), tax: money(r.tax) }));
  const daily = [...dailyMap.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, v]) => ({ date, online: money(v.online), pos: money(v.pos), total: money(v.online + v.pos) }));
  const discountUsage = discounts.filter((d) => d.usedCount > 0).slice(0, 10).map((d) => ({ code: d.code, usedCount: d.usedCount, active: d.active }));

  return {
    period, start, end,
    summary: {
      totalGross: money(totalGross), totalNet: money(totalNet), totalTax: money(totalTax), onlineGross: money(onlineGross), posGross: money(posGross),
      cash: money(cash), card: money(card), shipping: money(shipping), discountsTotal: money(discountsTotal), returns: money(returnGross),
      orderCount, onlineOrderCount: orders.length, posSaleCount: posSales.length, average: money(average),
      onHandUnits, reservedUnits, lowStockCount: lowStock.length, retailInventoryValue: money(retailInventoryValue),
    },
    taxes, daily, products, discountUsage,
    lowStock: lowStock.slice(0, 20).map((i) => ({
      variantId: i.variantId, product: i.variant.product.name, sku: i.variant.sku, location: i.location.name,
      available: i.onHand - i.reserved, onHand: i.onHand, reserved: i.reserved, minStock: i.minStock,
    })),
  };
}
