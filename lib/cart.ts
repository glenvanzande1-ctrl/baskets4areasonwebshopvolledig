import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import { getCustomerSession } from "@/lib/customer-auth";

export const CART_COOKIE = "b4a_cart";

export async function getOrCreateCart() {
  const store = await cookies();
  let token = store.get(CART_COOKIE)?.value;
  let cart = token ? await prisma.cart.findUnique({ where: { token } }) : null;
  const customer = await getCustomerSession();

  if (!cart) {
    token = randomUUID();
    cart = await prisma.cart.create({ data: { token, customerId: customer?.customerId } });
    store.set(CART_COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 30 });
  } else if (customer && cart.customerId !== customer.customerId) {
    cart = await prisma.cart.update({ where: { id: cart.id }, data: { customerId: customer.customerId } });
  }
  return cart;
}

export async function readCart() {
  const store = await cookies();
  const token = store.get(CART_COOKIE)?.value;
  if (!token) return null;
  return prisma.cart.findUnique({
    where: { token },
    include: {
      items: {
        orderBy: { createdAt: "asc" },
        include: {
          variant: {
            include: {
              product: { include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } } },
              taxRate: true,
              inventoryStocks: { include: { location: true } },
            },
          },
        },
      },
    },
  });
}

export function variantLabel(v: { color: string | null; size: string | null; weightGrams: number | null }) {
  return [v.color, v.size, v.weightGrams ? `${v.weightGrams} g` : null].filter(Boolean).join(" · ") || "Standaard";
}
