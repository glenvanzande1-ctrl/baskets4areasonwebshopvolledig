import { InventoryMovementType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export function availableStock(onHand: number, reserved: number) {
  return Math.max(0, onHand - reserved);
}

export async function ensureStockRow(variantId: string, locationId: string) {
  return prisma.inventoryStock.upsert({
    where: { variantId_locationId: { variantId, locationId } },
    update: {},
    create: { variantId, locationId },
  });
}

export async function applyInventoryMovement(input: {
  variantId: string;
  locationId: string;
  quantityDelta: number;
  type: InventoryMovementType;
  userId?: string | null;
  note?: string | null;
  referenceType?: string | null;
  referenceId?: string | null;
}) {
  if (!Number.isInteger(input.quantityDelta) || input.quantityDelta === 0) {
    throw new Error("Voorraadmutatie moet een geheel getal zijn en mag niet 0 zijn.");
  }

  return prisma.$transaction(async (tx) => {
    const current = await tx.inventoryStock.upsert({
      where: { variantId_locationId: { variantId: input.variantId, locationId: input.locationId } },
      update: {},
      create: { variantId: input.variantId, locationId: input.locationId },
    });

    const nextOnHand = current.onHand + input.quantityDelta;
    if (nextOnHand < 0) throw new Error("De fysieke voorraad kan niet negatief worden.");
    if (nextOnHand < current.reserved) {
      throw new Error("Deze wijziging zou de fysieke voorraad onder de gereserveerde voorraad brengen.");
    }

    const stock = await tx.inventoryStock.update({
      where: { id: current.id },
      data: { onHand: nextOnHand },
    });

    const movement = await tx.inventoryMovement.create({
      data: {
        variantId: input.variantId,
        locationId: input.locationId,
        userId: input.userId ?? null,
        type: input.type,
        quantity: input.quantityDelta,
        stockAfter: nextOnHand,
        note: input.note ?? null,
        referenceType: input.referenceType ?? null,
        referenceId: input.referenceId ?? null,
      },
    });

    return { stock, movement };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function reserveInventory(input: {
  variantId: string;
  locationId: string;
  quantity: number;
  referenceType?: string | null;
  referenceId?: string | null;
  expiresAt?: Date | null;
}) {
  if (!Number.isInteger(input.quantity) || input.quantity <= 0) throw new Error("Ongeldige reserveringshoeveelheid.");

  return prisma.$transaction(async (tx) => {
    const stock = await tx.inventoryStock.upsert({
      where: { variantId_locationId: { variantId: input.variantId, locationId: input.locationId } },
      update: {},
      create: { variantId: input.variantId, locationId: input.locationId },
    });
    if (stock.onHand - stock.reserved < input.quantity) throw new Error("Onvoldoende beschikbare voorraad.");

    await tx.inventoryStock.update({ where: { id: stock.id }, data: { reserved: { increment: input.quantity } } });
    return tx.inventoryReservation.create({
      data: {
        variantId: input.variantId,
        locationId: input.locationId,
        quantity: input.quantity,
        referenceType: input.referenceType ?? null,
        referenceId: input.referenceId ?? null,
        expiresAt: input.expiresAt ?? null,
      },
    });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function releaseInventoryReservation(reservationId: string) {
  return prisma.$transaction(async (tx) => {
    const reservation = await tx.inventoryReservation.findUnique({ where: { id: reservationId } });
    if (!reservation || reservation.status !== "ACTIVE") return reservation;
    await tx.inventoryStock.update({
      where: { variantId_locationId: { variantId: reservation.variantId, locationId: reservation.locationId } },
      data: { reserved: { decrement: reservation.quantity } },
    });
    return tx.inventoryReservation.update({ where: { id: reservationId }, data: { status: "RELEASED" } });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function consumeInventoryReservation(reservationId: string, userId?: string | null) {
  return prisma.$transaction(async (tx) => {
    const reservation = await tx.inventoryReservation.findUnique({ where: { id: reservationId } });
    if (!reservation || reservation.status !== "ACTIVE") throw new Error("Reservering is niet actief.");
    const stock = await tx.inventoryStock.findUniqueOrThrow({
      where: { variantId_locationId: { variantId: reservation.variantId, locationId: reservation.locationId } },
    });
    if (stock.onHand < reservation.quantity || stock.reserved < reservation.quantity) throw new Error("Voorraad is niet consistent met de reservering.");
    const next = stock.onHand - reservation.quantity;
    await tx.inventoryStock.update({
      where: { id: stock.id },
      data: { onHand: next, reserved: { decrement: reservation.quantity } },
    });
    await tx.inventoryMovement.create({
      data: {
        variantId: reservation.variantId,
        locationId: reservation.locationId,
        userId: userId ?? null,
        type: "RESERVATION_CONSUMED",
        quantity: -reservation.quantity,
        stockAfter: next,
        referenceType: reservation.referenceType,
        referenceId: reservation.referenceId,
      },
    });
    return tx.inventoryReservation.update({ where: { id: reservation.id }, data: { status: "CONSUMED" } });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}
