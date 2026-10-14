"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type StaffUser = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: "ADMIN" | "MANAGER" | "CASHIER";
  active: boolean;
};

async function readJson(response: Response) {
  return response.json().catch(() => ({}));
}

export default function UserAdmin({ users, currentUserId }: { users: StaffUser[]; currentUserId: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function createUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(Object.fromEntries(form.entries())),
    });
    const data = await readJson(response);
    setBusy(false);
    if (!response.ok) return setError(data.error || "Gebruiker kon niet worden aangemaakt.");
    event.currentTarget.reset();
    router.refresh();
  }

  async function updateUser(userId: string, values: Record<string, unknown>) {
    setBusy(true); setError("");
    const response = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await readJson(response);
    setBusy(false);
    if (!response.ok) return setError(data.error || "Wijziging mislukt.");
    router.refresh();
  }

  return <div className="staff-admin">
    {error && <div className="error">{error}</div>}
    <section className="report-box">
      <h2>Nieuw personeelsaccount</h2>
      <form className="staff-form" onSubmit={createUser}>
        <label>Voornaam<input className="input" name="firstName" maxLength={80} /></label>
        <label>Achternaam<input className="input" name="lastName" maxLength={80} /></label>
        <label>E-mailadres<input className="input" name="email" type="email" required /></label>
        <label>Rol<select className="input" name="role" defaultValue="CASHIER"><option value="CASHIER">Kassamedewerker</option><option value="MANAGER">Manager</option><option value="ADMIN">Administrator</option></select></label>
        <label>Initieel wachtwoord<input className="input" name="password" type="password" minLength={12} maxLength={72} required /></label>
        <button className="btn" disabled={busy}>{busy ? "Bezig…" : "Account aanmaken"}</button>
      </form>
    </section>

    <section className="report-box">
      <h2>Personeel</h2>
      <div className="staff-list">
        {users.map(user => <div className="staff-row" key={user.id}>
          <div><strong>{[user.firstName, user.lastName].filter(Boolean).join(" ") || user.email}</strong><small>{user.email}{user.id === currentUserId ? " · jij" : ""}</small></div>
          <select className="input compact-input" value={user.role} disabled={busy || user.id === currentUserId} onChange={e => updateUser(user.id, { role: e.target.value })}>
            <option value="CASHIER">Kassa</option><option value="MANAGER">Manager</option><option value="ADMIN">Admin</option>
          </select>
          <button className={`btn ${user.active ? "secondary" : ""}`} disabled={busy || user.id === currentUserId} onClick={() => updateUser(user.id, { active: !user.active })}>{user.active ? "Deactiveren" : "Activeren"}</button>
          <button className="btn secondary" disabled={busy} onClick={() => {
            const password = window.prompt(`Nieuw wachtwoord voor ${user.email} (min. 12 tekens):`);
            if (password) updateUser(user.id, { password });
          }}>Wachtwoord</button>
        </div>)}
      </div>
    </section>
  </div>;
}
