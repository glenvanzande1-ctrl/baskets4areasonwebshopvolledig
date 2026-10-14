# Baskets4areason Platform — Fase 12

Deze versie bouwt voort op fase 11 en maakt het project klaar voor GitHub + Vercel productie.

## Upgrade vanuit fase 11

1. Maak eerst een commit van je werkende fase 11.
2. Kopieer fase 12 over je project en behoud je eigen `.env`.
3. Voer lokaal uit:

```bash
npm install
npx prisma generate
npm run preflight
npm run dev
```

Er is **geen nieuwe database-migratie** voor fase 12.

> `npm run preflight` kan lokaal waarschuwen dat `APP_URL` nog localhost is en Mollie nog testmodus gebruikt. Dat is vóór livegang normaal.

## Productie

Zie `PHASE12.md` voor de volledige Vercel-, Supabase-, Prisma-, Mollie-, Resend- en domeinchecklist.

## Belangrijk

- `.env` nooit naar GitHub pushen.
- Voor Vercel runtime: Supabase Transaction pooler (`6543`) + `pgbouncer=true` en bij voorkeur `connection_limit=1` als startpunt.
- Voor migrations: `DIRECT_URL` via Session pooler (`5432`) of directe verbinding.
- Productiemigrations: `npm run db:migrate:deploy`.
- Mollie pas naar `live_` na een succesvolle publieke testorder.
