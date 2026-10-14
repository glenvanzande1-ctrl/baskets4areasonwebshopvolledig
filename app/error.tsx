"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="shell"><section className="card"><div className="brand">Baskets4areason</div><h1>Er ging iets mis</h1><p className="muted">De actie kon niet worden afgerond. Je gegevens zijn niet bewust verwijderd of aangepast.</p><div className="actions"><button className="btn" onClick={() => reset()}>Opnieuw proberen</button><a className="btn secondary" href="/">Naar de webshop</a></div></section></main>;
}
