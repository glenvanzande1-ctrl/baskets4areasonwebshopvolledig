import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";

const schema = z.object({ role: z.enum(["ADMIN", "MANAGER", "CASHIER"]).optional(), active: z.boolean().optional(), password: z.string().min(12).max(72).optional() }).refine(v => Object.keys(v).length > 0);

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Geen toegang." }, { status: 403 });
  const { id } = await context.params;
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return NextResponse.json({ error: "Gebruiker niet gevonden." }, { status: 404 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ongeldige wijziging. Wachtwoorden moeten minimaal 12 tekens bevatten." }, { status: 400 });
  if (id === session.userId && (parsed.data.active === false || (parsed.data.role && parsed.data.role !== "ADMIN"))) return NextResponse.json({ error: "Je kunt je eigen administratorstoegang hier niet intrekken." }, { status: 400 });
  if (target.role === "ADMIN" && (parsed.data.active === false || (parsed.data.role && parsed.data.role !== "ADMIN"))) {
    const admins = await prisma.user.count({ where: { role: "ADMIN", active: true } });
    if (admins <= 1) return NextResponse.json({ error: "Er moet minstens één actieve administrator overblijven." }, { status: 400 });
  }
  const data: { role?: "ADMIN" | "MANAGER" | "CASHIER"; active?: boolean; passwordHash?: string } = {};
  if (parsed.data.role) data.role = parsed.data.role;
  if (typeof parsed.data.active === "boolean") data.active = parsed.data.active;
  if (parsed.data.password) data.passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const updated = await prisma.user.update({ where: { id }, data });
  await prisma.auditLog.create({ data: { userId: session.userId, action: parsed.data.password ? "STAFF_PASSWORD_RESET" : "STAFF_UPDATED", entityType: "User", entityId: id, metadata: { email: updated.email, role: updated.role, active: updated.active } } });
  return NextResponse.json({ ok: true });
}
