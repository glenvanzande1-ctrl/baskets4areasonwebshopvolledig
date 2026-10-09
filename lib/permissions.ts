import type { UserRole } from "@prisma/client";

export function canAccessAdmin(role: UserRole) {
  return role === "ADMIN" || role === "MANAGER";
}

export function canAccessPos(role: UserRole) {
  return role === "ADMIN" || role === "MANAGER" || role === "CASHIER";
}
