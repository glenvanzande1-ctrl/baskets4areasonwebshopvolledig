import { Prisma, FulfillmentMethod } from "@prisma/client";
import { prisma } from "@/lib/db";
import { variantLabel } from "@/lib/cart";
import type { MolliePayment } from "@/lib/mollie";
import { validateDiscount } from "@/lib/discounts";
import { getStoreSettings, postalCodes } from "@/lib/store-settings";
import { sendOrderPaidEmail } from "@/lib/email";
import { syncOrderToBillit } from "@/lib/billit";

function money(cents: number) { return new Prisma.Decimal((cents / 100).toFixed(2)); }
function cents(value: unknown) { return Math.round(Number(value) * 100); }
function makeOrderNumber() {
  const d = new Date();
  const date = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}`;
  return `B4A-${date}-${crypto.randomUUID().slice(0,8).toUpperCase()}`;
}

export type CheckoutOptions = {
  fulfillmentMethod: FulfillmentMethod;
  discountCode?: string;
  shipping?: { street:string; houseNumber:string; box?:string; postalCode:string; city:string; country?:string };
};

export async function createPendingOrder(customerId: string, cartId: string, options: CheckoutOptions) {
  const settings = await getStoreSettings();
  return prisma.$transaction(async (tx) => {
    const customer = await tx.customer.findUniqueOrThrow({ where: { id: customerId } });
    const cart = await tx.cart.findUniqueOrThrow({
      where: { id: cartId },
      include: { items: { include: { variant: { include: { product: true, taxRate: true } } } } },
    });
    if (!cart.items.length) throw new Error("Je winkelmand is leeg.");
    if(options.fulfillmentMethod === "PICKUP" && !settings.pickupEnabled) throw new Error("Afhalen is momenteel niet beschikbaar.");
    if(options.fulfillmentMethod === "DELIVERY") {
      if(!settings.deliveryEnabled) throw new Error("Levering is momenteel niet beschikbaar.");
      if(!options.shipping?.street || !options.shipping.houseNumber || !options.shipping.postalCode || !options.shipping.city) throw new Error("Vul je leveradres volledig in.");
      const allowed = postalCodes(settings.deliveryPostalCodes);
      if(allowed.length && !allowed.includes(options.shipping.postalCode.trim())) throw new Error("We leveren momenteel niet op deze postcode.");
    }

    const location = await tx.inventoryLocation.findFirst({ where: { active: true }, orderBy: [{ isDefault: "desc" }, { name: "asc" }] });
    if (!location) throw new Error("Geen actieve voorraadlocatie gevonden.");

    const rawLines = [] as Array<{
      variantId: string; productName: string; variantLabel: string; sku: string; barcode: string | null;
      quantity: number; unitPriceCents: number; taxPercentage: number; grossCents: number; trackInventory: boolean;
    }>;
    let subtotalCents = 0;
    for (const item of cart.items) {
      if (!item.variant.active || !item.variant.product.active) throw new Error(`${item.variant.product.name} is niet meer beschikbaar.`);
      if (item.variant.trackInventory) {
        const stock = await tx.inventoryStock.upsert({
          where: { variantId_locationId: { variantId: item.variantId, locationId: location.id } },
          update: {}, create: { variantId: item.variantId, locationId: location.id },
        });
        if (stock.onHand - stock.reserved < item.quantity) throw new Error(`Onvoldoende voorraad voor ${item.variant.product.name}.`);
      }
      const unitPriceCents = cents(item.variant.price);
      const grossCents = unitPriceCents * item.quantity;
      rawLines.push({variantId:item.variantId,productName:item.variant.product.name,variantLabel:variantLabel(item.variant),sku:item.variant.sku,barcode:item.variant.barcode,quantity:item.quantity,unitPriceCents,taxPercentage:Number(item.variant.taxRate.percentage),grossCents,trackInventory:item.variant.trackInventory});
      subtotalCents += grossCents;
    }
    if(settings.minimumOrderAmount && subtotalCents < cents(settings.minimumOrderAmount)) throw new Error(`Minimum bestelbedrag is € ${Number(settings.minimumOrderAmount).toFixed(2).replace(".",",")}.`);
    const discount = await validateDiscount(options.discountCode, subtotalCents, tx);
    const discountCents = discount?.amountCents ?? 0;

    let shippingCents = 0;
    if(options.fulfillmentMethod === "DELIVERY") {
      const freeFrom = settings.freeDeliveryFrom ? cents(settings.freeDeliveryFrom) : null;
      shippingCents = freeFrom != null && subtotalCents - discountCents >= freeFrom ? 0 : cents(settings.deliveryFee);
    }

    // Verdeel korting proportioneel over lijnen zodat btw per artikel correct blijft.
    let remainingDiscount = discountCents;
    const lines = rawLines.map((l, index) => {
      const share = index === rawLines.length - 1 ? remainingDiscount : Math.round(discountCents * l.grossCents / Math.max(1, subtotalCents));
      remainingDiscount -= share;
      const discountedGross = Math.max(0, l.grossCents - share);
      const taxCents = Math.round(discountedGross * l.taxPercentage / (100 + l.taxPercentage));
      return {...l,lineTotalCents:discountedGross,netCents:discountedGross-taxCents,taxCents};
    });
    const productTaxCents = lines.reduce((n,l)=>n+l.taxCents,0);
    const shippingTaxRate = Number(settings.deliveryTaxPercentage);
    const shippingTaxCents = shippingCents ? Math.round(shippingCents * shippingTaxRate / (100 + shippingTaxRate)) : 0;
    const totalCents = subtotalCents - discountCents + shippingCents;
    const taxCents = productTaxCents + shippingTaxCents;

    const order = await tx.order.create({
      data: {
        orderNumber: makeOrderNumber(), customerId, cartId, status: "PENDING_PAYMENT", fulfillmentMethod: options.fulfillmentMethod,
        currency: "EUR", subtotal: money(subtotalCents), discountTotal: money(discountCents), shippingTotal: money(shippingCents),
        netTotal: money(totalCents - taxCents), taxTotal: money(taxCents), total: money(totalCents), discountCode: discount?.code ?? null,
        customerEmail: customer.email, customerFirstName: customer.firstName, customerLastName: customer.lastName,
        shippingStreet: options.fulfillmentMethod==="DELIVERY"?options.shipping?.street:null,
        shippingHouseNumber: options.fulfillmentMethod==="DELIVERY"?options.shipping?.houseNumber:null,
        shippingBox: options.fulfillmentMethod==="DELIVERY"?(options.shipping?.box||null):null,
        shippingPostalCode: options.fulfillmentMethod==="DELIVERY"?options.shipping?.postalCode:null,
        shippingCity: options.fulfillmentMethod==="DELIVERY"?options.shipping?.city:null,
        shippingCountry: options.fulfillmentMethod==="DELIVERY"?(options.shipping?.country||"BE"):null,
        items: { create: lines.map(l => ({
          variantId: l.variantId, productName: l.productName, variantLabel: l.variantLabel, sku: l.sku, barcode: l.barcode,
          quantity: l.quantity, unitPrice: money(l.unitPriceCents), taxPercentage: new Prisma.Decimal(l.taxPercentage.toFixed(2)),
          netAmount: money(l.netCents), taxAmount: money(l.taxCents), lineTotal: money(l.lineTotalCents),
        })) },
      }, include: { items: true },
    });
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    for (const l of lines) {
      if (!l.trackInventory) continue;
      await tx.inventoryStock.update({where:{variantId_locationId:{variantId:l.variantId,locationId:location.id}},data:{reserved:{increment:l.quantity}}});
      await tx.inventoryReservation.create({data:{variantId:l.variantId,locationId:location.id,quantity:l.quantity,referenceType:"ORDER",referenceId:order.id,expiresAt}});
    }
    return order;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function releaseOrderReservations(orderId: string) {
  return prisma.$transaction(async (tx) => {
    const reservations = await tx.inventoryReservation.findMany({ where: { referenceType: "ORDER", referenceId: orderId, status: "ACTIVE" } });
    for (const r of reservations) {
      await tx.inventoryStock.update({ where: { variantId_locationId: { variantId: r.variantId, locationId: r.locationId } }, data: { reserved: { decrement: r.quantity } } });
      await tx.inventoryReservation.update({ where: { id: r.id }, data: { status: "RELEASED" } });
    }
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

async function consumeOrderReservations(orderId: string, tx: Prisma.TransactionClient) {
  const reservations = await tx.inventoryReservation.findMany({ where: { referenceType: "ORDER", referenceId: orderId, status: "ACTIVE" } });
  for (const r of reservations) {
    const stock = await tx.inventoryStock.findUniqueOrThrow({ where: { variantId_locationId: { variantId: r.variantId, locationId: r.locationId } } });
    if (stock.onHand < r.quantity || stock.reserved < r.quantity) throw new Error("Voorraad is niet consistent met de orderreservering.");
    const next = stock.onHand - r.quantity;
    await tx.inventoryStock.update({ where: { id: stock.id }, data: { onHand: next, reserved: { decrement: r.quantity } } });
    await tx.inventoryMovement.create({ data: { variantId: r.variantId, locationId: r.locationId, type: "RESERVATION_CONSUMED", quantity: -r.quantity, stockAfter: next, referenceType: "ORDER", referenceId: orderId, note: "Webshopbestelling betaald" } });
    await tx.inventoryReservation.update({ where: { id: r.id }, data: { status: "CONSUMED" } });
  }
}

function mapPaymentStatus(status: MolliePayment["status"]) {
  return ({ open: "OPEN", pending: "PENDING", authorized: "AUTHORIZED", paid: "PAID", failed: "FAILED", canceled: "CANCELED", expired: "EXPIRED" } as const)[status];
}

export async function applyMollieStatus(payment: MolliePayment) {
  let becamePaid = false;
  const order = await prisma.$transaction(async (tx) => {
    const local = await tx.payment.findUnique({ where: { providerPaymentId: payment.id }, include: { order: true } });
    if (!local) throw new Error("Onbekende Mollie-betaling.");
    const mapped = mapPaymentStatus(payment.status);
    await tx.payment.update({ where: { id: local.id }, data: { status: mapped, method: payment.method ?? null, raw: payment as unknown as Prisma.InputJsonValue } });
    if (payment.status === "paid" && local.order.status === "PENDING_PAYMENT") {
      await consumeOrderReservations(local.orderId, tx); becamePaid=true;
      await tx.order.update({ where: { id: local.orderId }, data: { status: "PAID", paidAt: new Date() } });
      if(local.order.discountCode) await tx.discountCode.updateMany({where:{code:local.order.discountCode},data:{usedCount:{increment:1}}});
      if (local.order.cartId) await tx.cartItem.deleteMany({ where: { cartId: local.order.cartId } });
    } else if (["failed", "canceled", "expired"].includes(payment.status) && local.order.status === "PENDING_PAYMENT") {
      const reservations = await tx.inventoryReservation.findMany({ where: { referenceType: "ORDER", referenceId: local.orderId, status: "ACTIVE" } });
      for (const r of reservations) {
        await tx.inventoryStock.update({ where: { variantId_locationId: { variantId: r.variantId, locationId: r.locationId } }, data: { reserved: { decrement: r.quantity } } });
        await tx.inventoryReservation.update({ where: { id: r.id }, data: { status: payment.status === "expired" ? "EXPIRED" : "RELEASED" } });
      }
      await tx.order.update({ where: { id: local.orderId }, data: { status: payment.status === "expired" ? "PAYMENT_EXPIRED" : "PAYMENT_FAILED" } });
    }
    return tx.order.findUnique({ where: { id: local.orderId } });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  if (becamePaid && order) {
    await Promise.allSettled([
      sendOrderPaidEmail(order.id),
      syncOrderToBillit(order.id),
    ]).then((results) => results.forEach((result) => { if (result.status === "rejected") console.error(result.reason); }));
  }
  return order;
}
