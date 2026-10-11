# Baskets4areason — fase 1

Fundament voor webshop, beheer en kassasysteem.

## Wat zit er nu in?

- Next.js + TypeScript
- PostgreSQL via Docker Compose
- Prisma datalaag
- Personeelslogin met gehashte wachtwoorden
- HTTP-only sessiecookie met ondertekende JWT
- Rollen: `ADMIN`, `MANAGER`, `CASHIER`
- Routebescherming voor `/admin` en `/pos`
- Auditlog voor login
- BTW-tarieven 6% en 21% als seeddata
- Apart startscherm **Fysieke winkel / Kassa**

## Lokaal starten

1. Kopieer `.env.example` naar `.env`.
2. Vervang `AUTH_SECRET` door een lange willekeurige waarde.
3. Stel een veilig `SEED_ADMIN_PASSWORD` in.
4. Start PostgreSQL:

```bash
docker compose up -d
```

5. Installeer dependencies:

```bash
npm install
```

6. Genereer Prisma Client en maak de eerste migratie:

```bash
npx prisma generate
npx prisma migrate dev --name init
```

7. Seed 6%/21% BTW en het eerste admin-account:

```bash
npm run db:seed
```

8. Start de applicatie:

```bash
npm run dev
```

Open daarna `http://localhost:3000`.

## Belangrijk voor productie

- Gebruik een beheerde PostgreSQL-database met automatische backups.
- Gebruik HTTPS.
- Bewaar secrets alleen in de hostingomgeving.
- Voeg rate limiting toe vóór publieke livegang.
- Klantenaccounts zijn bewust nog niet geïmplementeerd; die komen samen met webshop/checkout.
- Producten, varianten en voorraad komen in fase 2 en 3.

## Volgende stap — fase 2

Datamodel en beheer voor:
- producten
- varianten (maat, kleur, gramgewicht)
- SKU en barcode per variant
- prijs incl. BTW
- BTW 6% / 21% per variant
- categorieën
- productafbeeldingen

## Fase 4
De publieke webshop, klantenaccounts, winkelmand en checkoutfundament zijn toegevoegd. Zie `PHASE4.md`.
