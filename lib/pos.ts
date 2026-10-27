import { Prisma, PosPaymentMethod } from "@prisma/client";
import { prisma } from "@/lib/db";
import { variantLabel } from "@/lib/cart";
import { syncPosSaleToBillit } from "@/lib/billit";

function money(cents: number) {
  return new Prisma.Decimal((cents / 100).toFixed(2));
}
function cents(value: unknown) {
  return Math.round(Number(value) * 100);
}
function makeSaleNumber() {
  const d = new Date();
  const date = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `POS-${date}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
}
function makeReturnNumber() {
  const d = new Date();
  const date = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `RET-${date}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
}

export async function createPosSale(input: {
  userId: string;
  items: Array<{ variantId: string; quantity: number }>;
  paymentMethod: PosPaymentMethod;
  cashReceived?: number | null;
  note?: string | null;
}) {
  if (!input.items.length) throw new Error("De kassamand is leeg.");

  const grouped = new Map<string, number>();
  for (const item of input.items) {
    if (!item.variantId || !Number.isInteger(item.quantity) || item.quantity <= 0) throw new Error("Ongeldig artikel in de kassamand.");
    grouped.set(item.variantId, (grouped.get(item.variantId) ?? 0) + item.quantity);
  }

  const sale = await prisma.$transaction(async (tx) => {
    const location = await tx.inventoryLocation.findFirst({ where: { active: true }, orderBy: [{ isDefault: "desc" }, { name: "asc" }] });
    if (!location) throw new Error("Geen actieve voorraadlocatie gevonden.");

    const lines: Array<{
      variantId: string; productName: string; variantLabel: string; sku: string; barcode: string | null;
      quantity: number; unitPriceCents: number; taxPercentage: number; lineTotalCents: number; netCents: number; taxCents: number;
      stockId: string | null; stockAfter: number | null; trackInventory: boolean;
    }> = [];
    let totalCents = 0;
    let taxTotalCents = 0;

    for (const [variantId, quantity] of grouped) {
      const variant = await tx.productVariant.findUnique({
        where: { id: variantId },
        include: { product: true, taxRate: true },
      });
      if (!variant || !variant.active || !variant.product.active) throw new Error("Een artikel is niet meer beschikbaar.");

      const stock = variant.trackInventory ? await tx.inventoryStock.upsert({
        where: { variantId_locationId: { variantId, locationId: location.id } },
        update: {}, create: { variantId, locationId: location.id },
      }) : null;
      if (variant.trackInventory && stock && stock.onHand - stock.reserved < quantity) throw new Error(`Onvoldoende beschikbare voorraad voor ${variant.product.name}.`);

      const unitPriceCents = cents(variant.price);
      const lineTotalCents = unitPriceCents * quantity;
      const taxPercentage = Number(variant.taxRate.percentage);
      const taxCents = Math.round(lineTotalCents * taxPercentage / (100 + taxPercentage));
      const stockAfter = stock ? stock.onHand - quantity : null;

      lines.push({
        variantId, productName: variant.product.name, variantLabel: variantLabel(variant), sku: variant.sku,
        barcode: variant.barcode, quantity, unitPriceCents, taxPercentage, lineTotalCents,
        netCents: lineTotalCents - taxCents, taxCents, stockId: stock?.id ?? null, stockAfter, trackInventory: variant.trackInventory,
      });
      totalCents += lineTotalCents;
      taxTotalCents += taxCents;
    }

    const cashReceivedCents = input.paymentMethod === "CASH" ? Math.round((input.cashReceived ?? 0) * 100) : null;
    if (input.paymentMethod === "CASH" && (cashReceivedCents ?? 0) < totalCents) throw new Error("Het ontvangen cashbedrag is lager dan het totaal.");
    const changeDueCents = input.paymentMethod === "CASH" ? (cashReceivedCents! - totalCents) : null;

    const sale = await tx.posSale.create({
      data: {
        saleNumber: makeSaleNumber(), userId: input.userId, locationId: location.id, paymentMethod: input.paymentMethod,
        netTotal: money(totalCents - taxTotalCents), taxTotal: money(taxTotalCents), total: money(totalCents),
        cashReceived: cashReceivedCents == null ? null : money(cashReceivedCents),
        changeDue: changeDueCents == null ? null : money(changeDueCents), note: input.note?.trim() || null,
        items: { create: lines.map((l) => ({
          variantId: l.variantId, productName: l.productName, variantLabel: l.variantLabel, sku: l.sku, barcode: l.barcode,
          quantity: l.quantity, unitPrice: money(l.unitPriceCents), taxPercentage: new Prisma.Decimal(l.taxPercentage.toFixed(2)),
          netAmount: money(l.netCents), taxAmount: money(l.taxCents), lineTotal: money(l.lineTotalCents),
        })) },
      },
      include: { items: true },
    });

    for (const l of lines) {
      if (!l.trackInventory || !l.stockId || l.stockAfter == null) continue;
      await tx.inventoryStock.update({ where: { id: l.stockId }, data: { onHand: l.stockAfter } });
      await tx.inventoryMovement.create({
        data: {
          variantId: l.variantId, locationId: location.id, userId: input.userId, type: "POS_SALE", quantity: -l.quantity,
          stockAfter: l.stockAfter, referenceType: "POS_SALE", referenceId: sale.id, note: `Kassaverkoop ${sale.saleNumber}`,
        },
      });
    }

    await tx.auditLog.create({
      data: { userId: input.userId, action: "POS_SALE_CREATED", entityType: "PosSale", entityId: sale.id, metadata: { saleNumber: sale.saleNumber, total: (totalCents / 100).toFixed(2), paymentMethod: input.paymentMethod } },
    });
    return sale;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

  await syncPosSaleToBillit(sale.id).catch((error) => console.error("Billit POS sync mislukt:", error));
  return sale;
}

export async function createPosReturn(input: {
  userId: string;
  saleId: string;
  items: Array<{ saleItemId: string; quantity: number; restock: boolean }>;
  note?: string | null;
}) {
  if (!input.items.length) throw new Error("Selecteer minstens één artikel voor retour.");

  return prisma.$transaction(async (tx) => {
    const sale = await tx.posSale.findUnique({
      where: { id: input.saleId },
      include: { items: { include: { returnItems: true } }, returns: true },
    });
    if (!sale || sale.status === "VOIDED") throw new Error("Kassaverkoop niet gevonden.");

    let totalCents = 0;
    const returnLines: Array<{ saleItemId: string; variantId: string | null; quantity: number; unitCents: number; lineCents: number; restock: boolean }> = [];
    for (const requested of input.items) {
      if (!Number.isInteger(requested.quantity) || requested.quantity <= 0) throw new Error("Ongeldige retourhoeveelheid.");
      const item = sale.items.find((x) => x.id === requested.saleItemId);
      if (!item) throw new Error("Retourartikel hoort niet bij deze verkoop.");
      const alreadyReturned = item.returnItems.reduce((sum, r) => sum + r.quantity, 0);
      if (alreadyReturned + requested.quantity > item.quantity) throw new Error(`Te veel retour voor ${item.productName}.`);
      const unitCents = cents(item.unitPrice);
      const lineCents = unitCents * requested.quantity;
      totalCents += lineCents;
      returnLines.push({ saleItemId: item.id, variantId: item.variantId, quantity: requested.quantity, unitCents, lineCents, restock: requested.restock });
    }

    const posReturn = await tx.posReturn.create({
      data: {
        returnNumber: makeReturnNumber(), saleId: sale.id, userId: input.userId, total: money(totalCents), note: input.note?.trim() || null,
        items: { create: returnLines.map((r) => ({ saleItemId: r.saleItemId, variantId: r.variantId, quantity: r.quantity, unitPrice: money(r.unitCents), lineTotal: money(r.lineCents), restocked: r.restock })) },
      },
      include: { items: true },
    });

    for (const r of returnLines) {
      if (!r.restock || !r.variantId) continue;
      const restockVariant = await tx.productVariant.findUnique({ where: { id: r.variantId }, select: { trackInventory: true } });
      if (!restockVariant?.trackInventory) continue;
      const stock = await tx.inventoryStock.upsert({
        where: { variantId_locationId: { variantId: r.variantId, locationId: sale.locationId } }, update: {}, create: { variantId: r.variantId, locationId: sale.locationId },
      });
      const next = stock.onHand + r.quantity;
      await tx.inventoryStock.update({ where: { id: stock.id }, data: { onHand: next } });
      await tx.inventoryMovement.create({
        data: { variantId: r.variantId, locationId: sale.locationId, userId: input.userId, type: "RETURN", quantity: r.quantity, stockAfter: next, referenceType: "POS_RETURN", referenceId: posReturn.id, note: `Retour ${posReturn.returnNumber}` },
      });
    }

    const allItems = await tx.posSaleItem.findMany({ where: { saleId: sale.id }, include: { returnItems: true } });
    const fullyReturned = allItems.every((item) => item.returnItems.reduce((sum, r) => sum + r.quantity, 0) >= item.quantity);
    await tx.posSale.update({ where: { id: sale.id }, data: { status: fullyReturned ? "REFUNDED" : "PARTIALLY_REFUNDED" } });
    await tx.auditLog.create({ data: { userId: input.userId, action: "POS_RETURN_CREATED", entityType: "PosReturn", entityId: posReturn.id, metadata: { returnNumber: posReturn.returnNumber, saleNumber: sale.saleNumber, total: (totalCents / 100).toFixed(2) } } });
    return posReturn;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}
