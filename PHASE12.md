# Fase 12 — Vercel productie & livegang

Fase 12 maakt de bestaande applicatie deployment-klaar. Er is geen nieuwe databasemigratie nodig.

## Nieuw in deze fase

- `npm run preflight`: controleert essentiële productievariabelen zonder secrets te tonen.
- `npm run db:migrate:deploy`: juiste Prisma-opdracht voor productie.
- `npm run db:status`: controleert de migration-status.
- `postinstall: prisma generate`: Vercel genereert Prisma Client automatisch na installatie.
- uitgebreidere systeemcontrole in `/admin/system` voor productie-URL, Mollie LIVE en Supabase serverless pooler.
- productiegerichte `.env.example` voor Supabase + Vercel.

## Belangrijk: lokaal blijft alles werken

Voor lokaal ontwikkelen blijft:

```bash
npm run dev
```

De productie-instellingen worden pas in Vercel gezet. Je lokale `.env` blijft lokaal en gaat nooit naar GitHub.

## Aanbevolen productieflow

1. Commit/push de code naar GitHub.
2. Importeer de repository in Vercel.
3. Voeg de environment variables in Vercel toe.
4. Laat de eerste Vercel build uitvoeren.
5. Controleer `/api/health` en `/admin/system`.
6. Pas migrations in productie toe met `prisma migrate deploy` wanneer er later nieuwe migrations bijkomen.
7. Koppel pas daarna het definitieve domein.
8. Zet Mollie pas op `live_` nadat checkout, e-mail en voorraad nog één keer op de productie-URL zijn getest.

## Vercel environment variables

Minimaal:

```text
DATABASE_URL
DIRECT_URL
AUTH_SECRET
APP_URL
MOLLIE_API_KEY
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_STORAGE_BUCKET
RESEND_API_KEY
EMAIL_FROM
```

`SEED_ADMIN_*` is na de eerste setup niet nodig op Vercel en kan beter niet permanent in productie blijven staan.

## Supabase verbinding

Voor runtime/serverless hoort `DATABASE_URL` naar de Transaction pooler op poort `6543` te wijzen, bijvoorbeeld met:

```text
?pgbouncer=true&connection_limit=1
```

`DIRECT_URL` gebruikt de Session pooler op poort `5432` (of een directe verbinding als je netwerk/configuratie dat ondersteunt) en is bedoeld voor Prisma migrations.

## Prisma in productie

Gebruik nooit `prisma migrate dev` in productie.

Gebruik:

```bash
npm run db:migrate:deploy
```

`migrate deploy` past alleen bestaande, nog niet uitgevoerde migrations toe en maakt geen nieuwe development migration.

## Eerste live-check

Controleer na deployment:

```text
/api/health
/admin/system
/
/producten
/account/login
/pos
```

Doe vervolgens één volledige testorder met Mollie **test mode** op de publieke Vercel-URL. Controleer:

- account/login;
- winkelmand;
- voorraadreservering;
- Mollie redirect;
- webhook/statusverwerking;
- order in beheer;
- ordermail via Resend;
- productfoto's via Supabase Storage.

Pas als dit slaagt, zet je de Mollie live-key aan.

## Domein

Na koppelen van het echte domein:

1. zet `APP_URL=https://jouwdomein.be`;
2. redeploy Vercel;
3. controleer Mollie callbacks/webhooks;
4. zorg dat `EMAIL_FROM` een geverifieerd Resend-domein gebruikt;
5. voer opnieuw een testbetaling uit voordat Mollie LIVE wordt geactiveerd.

## Backups en veiligheid

Voor livegang:

- controleer Supabase backup/retentie passend bij het gekozen plan;
- exporteer of documenteer kritieke instellingen;
- voorzie minstens twee actieve ADMIN-accounts;
- bewaar recovery/API-secrets in een wachtwoordmanager;
- voeg `.env` nooit toe aan Git;
- gebruik verschillende secrets voor development en production.

## Hardware

Zebra en Epson hoeven de webdeployment niet te blokkeren. De kassa kan live staan terwijl de hardware later fysiek op de kassapc wordt getest.
