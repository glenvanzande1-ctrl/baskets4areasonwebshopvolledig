import { prisma } from "@/lib/db";
import { requireManager } from "@/lib/admin";
import { redirect } from "next/navigation";

export default async function AuditPage() {
  const session = await requireManager();
  if (!session) redirect("/login");
  const logs = await prisma.auditLog.findMany({ take: 200, orderBy: { createdAt: "desc" }, include: { user: { select: { email: true, firstName: true, lastName: true } } } });
  return <main className="shell report-page"><section className="card wide"><div className="topbar"><div><div className="brand">Baskets4areason</div><h1>Activiteitenlog</h1></div><a className="btn secondary" href="/admin">← Beheer</a></div><p className="muted">De 200 meest recente beheer- en beveiligingsacties.</p><div className="report-box compact"><table><thead><tr><th>Datum</th><th>Gebruiker</th><th>Actie</th><th>Onderdeel</th></tr></thead><tbody>{logs.map(log => <tr key={log.id}><td>{log.createdAt.toLocaleString("nl-BE")}</td><td>{log.user ? ([log.user.firstName, log.user.lastName].filter(Boolean).join(" ") || log.user.email) : "Systeem"}</td><td><code>{log.action}</code></td><td>{log.entityType || "—"}{log.entityId ? ` · ${log.entityId.slice(0, 10)}…` : ""}</td></tr>)}</tbody></table></div></section></main>;
}
