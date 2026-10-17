import "server-only";
import { prisma } from "@/lib/db";

const ENV = process.env.BILLIT_ENV === "production" ? "production" : "sandbox";
const API_BASE = ENV === "production" ? "https://api.billit.be" : "https://api.sandbox.billit.be";

function config() {
  const apiKey = process.env.BILLIT_API_KEY?.trim();
  const partyId = process.env.BILLIT_PARTY_ID?.trim();
  if (!apiKey || !partyId) {
    throw new Error("Billit is nog niet volledig geconfigureerd. Vul BILLIT_API_KEY en BILLIT_PARTY_ID in.");
  }
  return { apiKey, partyId };
}

async function billitFetch(path: string, init: RequestInit = {}, idempotentKey?: string) {
  const { apiKey, partyId } = config();
  const headers = new Headers(init.headers);
  headers.set("accept", "application/json");
  headers.set("content-type", "application/json");
  headers.set("ApiKey", apiKey);
  headers.set("PartyID", partyId);
  if (idempotentKey) headers.set("Idempotent-Key", idempotentKey);

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  const text = await response.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    throw new Error(
      `Billit API fout (${response.status}): ${typeof data === "string" ? data : JSON.stringify(data)}`,
    );
  }

  return data;
}

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function unitNet(netAmount: unknown, quantity: number) {
  return Number((Number(netAmount) / Math.max(1, quantity)).toFixed(5));
}

async function createInvoice(
  syncId: string,
  sourceType: "ORDER" | "POS_SALE",
  sourceId: string,
  sourceNumber: string,
  payload: Record<string, unknown>,
) {
  await prisma.billitInvoiceSync.upsert({
    where: { sourceType_sourceId: { sourceType, sourceId } },
    update: {
      status: "PENDING",
      attempts: { increment: 1 },
      lastAttemptAt: new Date(),
      lastError: null,
    },
    create: {
      sourceType,
      sourceId,
      sourceNumber,
      status: "PENDING",
      attempts: 1,
      lastAttemptAt: new Date(),
    },
  });

  try {
    const result = await billitFetch(
      "/v1/orders",
      { method: "POST", body: JSON.stringify(payload) },
      `b4a-${syncId}`,
    );

    const billitOrderId = typeof result === "number" ? result : Number(result);
    if (!Number.isFinite(billitOrderId)) {
      throw new Error(`Onverwacht antwoord van Billit: ${JSON.stringify(result)}`);
    }

    await prisma.billitInvoiceSync.update({
      where: { sourceType_sourceId: { sourceType, sourceId } },
      data: {
        status: "SENT",
        billitOrderId,
        billitOrderNumber: sourceNumber,
        lastError: null,
      },
    });

    return billitOrderId;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Billit factuur aanmaken mislukt.";
    await prisma.billitInvoiceSync
      .update({
        where: { sourceType_sourceId: { sourceType, sourceId } },
        data: { status: "FAILED", lastError: message.slice(0, 3000) },
      })
      .catch(() => undefined);
    throw error;
  }
}

export async function syncOrderToBillit(orderId: string) {
  const existing = await prisma.billitInvoiceSync.findUnique({
    where: { sourceType_sourceId: { sourceType: "ORDER", sourceId: orderId } },
  });
  if (existing?.status === "SENT") return existing;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      customer: {
        include: {
          addresses: {
            orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
            take: 1,
          },
        },
      },
    },
  });

  if (
    !order ||
    !order.paidAt ||
    !["PAID", "PROCESSING", "READY_FOR_PICKUP", "SHIPPED", "COMPLETED"].includes(order.status)
  ) {
    throw new Error("Alleen betaalde webshopbestellingen kunnen naar Billit.");
  }

  const address =
    order.fulfillmentMethod === "DELIVERY" && order.shippingStreet
      ? {
          street: order.shippingStreet,
          houseNumber: order.shippingHouseNumber,
          box: order.shippingBox,
          postalCode: order.shippingPostalCode,
          city: order.shippingCity,
          country: order.shippingCountry || "BE",
        }
      : order.customer.addresses[0]
        ? {
            street: order.customer.addresses[0].street,
            houseNumber: order.customer.addresses[0].houseNumber,
            box: order.customer.addresses[0].box,
            postalCode: order.customer.addresses[0].postalCode,
            city: order.customer.addresses[0].city,
            country: order.customer.addresses[0].country,
          }
        : null;

  const customer: Record<string, unknown> = {
    Name: `${order.customerFirstName} ${order.customerLastName}`.trim(),
    PartyType: "Customer",
    Email: order.customerEmail,
    Language: "NL",
    Nr: order.customerId,
  };

  if (address?.street && address.postalCode && address.city) {
    customer.Addresses = [
      {
        AddressType: "InvoiceAddress",
        Name: customer.Name,
        Street: address.street,
        StreetNumber: address.houseNumber || "",
        Box: address.box || undefined,
        Zipcode: address.postalCode,
        City: address.city,
        CountryCode: address.country || "BE",
      },
    ];
  }

  const lines: Array<Record<string, unknown>> = order.items.map((item) => ({
    Quantity: item.quantity,
    UnitPriceExcl: unitNet(item.netAmount, item.quantity),
    Description: item.productName,
    DescriptionExtended: item.variantLabel || undefined,
    Reference: item.sku,
    VATPercentage: Number(item.taxPercentage),
  }));

  if (Number(order.shippingTotal) > 0) {
    const itemTax = order.items.reduce((n, item) => n + Number(item.taxAmount), 0);
    const shippingTax = Math.max(0, Number(order.taxTotal) - itemTax);
    const shippingNet = Math.max(0, Number(order.shippingTotal) - shippingTax);
    const rate = shippingNet > 0 ? Number(((shippingTax / shippingNet) * 100).toFixed(2)) : 21;
    lines.push({
      Quantity: 1,
      UnitPriceExcl: Number(shippingNet.toFixed(5)),
      Description: "Leveringskost",
      VATPercentage: rate,
    });
  }

  const date = order.paidAt;
  const payload = {
    OrderType: "Invoice",
    OrderDirection: "Income",
    OrderNumber: order.orderNumber,
    OrderDate: isoDate(date),
    DeliveryDate: isoDate(date),
    ExpiryDate: isoDate(date),
    Currency: order.currency,
    Reference: order.orderNumber,
    PaymentReference: order.orderNumber,
    Paid: true,
    PaidDate: date.toISOString(),
    ExternalProvider: "Baskets4areason Platform",
    ExternalProviderID: order.id,
    Comments: `Automatisch aangemaakt na webshopverkoop ${order.orderNumber}`,
    Customer: customer,
    OrderLines: lines,
  };

  await createInvoice(`order-${order.id}`, "ORDER", order.id, order.orderNumber, payload);
  return prisma.billitInvoiceSync.findUnique({
    where: { sourceType_sourceId: { sourceType: "ORDER", sourceId: order.id } },
  });
}

export async function syncPosSaleToBillit(saleId: string) {
  const existing = await prisma.billitInvoiceSync.findUnique({
    where: { sourceType_sourceId: { sourceType: "POS_SALE", sourceId: saleId } },
  });
  if (existing?.status === "SENT") return existing;

  const sale = await prisma.posSale.findUnique({
    where: { id: saleId },
    include: { items: true },
  });
  if (!sale || sale.status === "VOIDED") {
    throw new Error("Kassaverkoop niet gevonden of geannuleerd.");
  }

  const customerName = process.env.BILLIT_POS_CUSTOMER_NAME?.trim() || "Particuliere klant";
  const payload = {
    OrderType: "Invoice",
    OrderDirection: "Income",
    OrderNumber: sale.saleNumber,
    OrderDate: isoDate(sale.createdAt),
    DeliveryDate: isoDate(sale.createdAt),
    ExpiryDate: isoDate(sale.createdAt),
    Currency: sale.currency,
    Reference: sale.saleNumber,
    PaymentReference: sale.saleNumber,
    Paid: true,
    PaidDate: sale.createdAt.toISOString(),
    ExternalProvider: "Baskets4areason Platform",
    ExternalProviderID: sale.id,
    Comments: `Automatisch aangemaakt na kassaverkoop ${sale.saleNumber}. Betaalwijze: ${sale.paymentMethod === "CASH" ? "cash" : "kaart"}.`,
    Customer: {
      Name: customerName,
      PartyType: "Customer",
      Nr: "POS-PARTICULIER",
      Language: "NL",
    },
    OrderLines: sale.items.map((item) => ({
      Quantity: item.quantity,
      UnitPriceExcl: unitNet(item.netAmount, item.quantity),
      Description: item.productName,
      DescriptionExtended: item.variantLabel || undefined,
      Reference: item.sku,
      VATPercentage: Number(item.taxPercentage),
    })),
  };

  await createInvoice(`pos-${sale.id}`, "POS_SALE", sale.id, sale.saleNumber, payload);
  return prisma.billitInvoiceSync.findUnique({
    where: { sourceType_sourceId: { sourceType: "POS_SALE", sourceId: sale.id } },
  });
}

export async function retryBillitSync(syncId: string) {
  const sync = await prisma.billitInvoiceSync.findUnique({ where: { id: syncId } });
  if (!sync) throw new Error("Billit synchronisatie niet gevonden.");
  return sync.sourceType === "ORDER"
    ? syncOrderToBillit(sync.sourceId)
    : syncPosSaleToBillit(sync.sourceId);
}

export async function testBillitConnection() {
  // Een lichte GET om credentials/PartyID te valideren zonder factuur aan te maken.
  return billitFetch("/v1/account/accountInformation", { method: "GET" });
}

export async function billitStatus() {
  const apiKey = process.env.BILLIT_API_KEY?.trim();
  const partyId = process.env.BILLIT_PARTY_ID?.trim();
  return {
    configured: Boolean(apiKey && partyId),
    connected: Boolean(apiKey && partyId),
    environment: ENV,
    partyId: partyId || null,
    authMode: "API key" as const,
    lastError: null,
  };
}
