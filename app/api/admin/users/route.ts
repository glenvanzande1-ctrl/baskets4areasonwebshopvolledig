import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";

const schema = z.object({
  email: z.string().email().max(200),
  firstName: z.string().max(80).optional().default(""),
  lastName: z.string().max(80).optional().default(""),
  role: z.enum(["ADMIN", "MANAGER", "CASHIER"]),
  password: z.string().min(12).max(72),
});

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Geen toegang." }, { status: 403 });
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Controleer e-mailadres, rol en wachtwoord (minimaal 12 tekens)." }, { status: 400 });
  const email = parsed.data.email.toLowerCase().trim();
  if (await prisma.user.findUnique({ where: { email } })) return NextResponse.json({ error: "Er bestaat al een gebruiker met dit e-mailadres." }, { status: 409 });
  const user = await prisma.user.create({ data: { email, firstName: parsed.data.firstName.trim() || null, lastName: parsed.data.lastName.trim() || null, role: parsed.data.role, passwordHash: await bcrypt.hash(parsed.data.password, 12) } });
  await prisma.auditLog.create({ data: { userId: session.userId, action: "STAFF_CREATED", entityType: "User", entityId: user.id, metadata: { email, role: user.role } } });
  return NextResponse.json({ ok: true, id: user.id });
}
