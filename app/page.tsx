export default function Home() {
  return (
    <main className="shell">
      <section className="card">
        <div className="brand">Baskets4areason</div>
        <h1>Platform fundament</h1>
        <p className="muted">Fase 1 is opgezet: Next.js, TypeScript, PostgreSQL/Prisma, personeelsauthenticatie, rollen en startschermen.</p>
        <div className="grid">
          <a className="tile" href="/admin"><strong>Beheer</strong>Producten, voorraad en bestellingen komen hier.</a>
          <a className="tile" href="/pos"><strong>Fysieke winkel / Kassa</strong>Aparte kassamodus voor barcodeverkoop.</a>
        </div>
      </section>
    </main>
  );
}
