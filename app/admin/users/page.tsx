import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import UserAdmin from "@/components/UserAdmin";

export default async function UsersPage() {
  const session = await requireAdmin();
  if (!session) redirect("/admin");
  const users = await prisma.user.findMany({ orderBy: [{ active: "desc" }, { email: "asc" }], select: { id: true, email: true, firstName: true, lastName: true, role: true, active: true } });
  return <main className="shell report-page"><section className="card wide"><div className="topbar"><div><div className="brand">Baskets4areason</div><h1>Personeel & rechten</h1></div><a className="btn secondary" href="/admin">← Beheer</a></div><p className="muted">Accounts voor administrators, managers en kassamedewerkers. Een gedeactiveerd account verliest bij de volgende request meteen toegang.</p><UserAdmin users={users} currentUserId={session.userId} /></section></main>;
}
