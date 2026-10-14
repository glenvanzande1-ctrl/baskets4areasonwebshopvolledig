"use client";

import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError("");

    const form = new FormData(event.currentTarget);

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        email: form.get("email"),
        password: form.get("password"),
      }),
    });

    const data = await response
      .json()
      .catch(() => ({ error: "De server gaf geen geldig antwoord." }));

    if (!response.ok) {
      setError(data.error ?? "Aanmelden mislukt.");
      setLoading(false);
      return;
    }

    router.push(
      params.get("next") ||
        (data.role === "CASHIER" ? "/pos" : "/admin")
    );

    router.refresh();
  }

  return (
    <main className="shell">
      <form className="card" onSubmit={submit}>
        <div className="brand">Baskets4areason</div>

        <h1>Personeelslogin</h1>

        <label>
          E-mailadres
          <input
            className="input"
            type="email"
            name="email"
            required
            autoComplete="username"
          />
        </label>

        <div style={{ height: 14 }} />

        <label>
          Wachtwoord
          <input
            className="input"
            type="password"
            name="password"
            required
            minLength={8}
            maxLength={72}
            autoComplete="current-password"
          />
        </label>

        {error && <div className="error">{error}</div>}

        <div style={{ height: 18 }} />

        <button className="btn" disabled={loading}>
          {loading ? "Bezig…" : "Aanmelden"}
        </button>
      </form>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="shell">
          <div className="card">
            <div className="brand">Baskets4areason</div>
            <p>Login laden…</p>
          </div>
        </main>
      }
    >
      <LoginForma />
    </Suspense>
  );
}