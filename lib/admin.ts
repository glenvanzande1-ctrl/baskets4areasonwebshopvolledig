import { getSession } from "@/lib/auth";

export async function requireManager() {
  const session = await getSession();
  if (!session || !["ADMIN", "MANAGER"].includes(session.role)) return null;
  return session;
}

export async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return null;
  return session;
}
