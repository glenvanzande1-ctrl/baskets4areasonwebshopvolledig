# Fase 16.3 — Supabase security / RLS

Deze fase zet de beveiligingswaarschuwingen van Supabase structureel in Git via een Prisma migration.

## Wat de migration doet

- Activeert Row Level Security (`ENABLE ROW LEVEL SECURITY`) op alle bestaande tabellen in schema `public`.
- Maakt bewust **geen** publieke RLS policies.
- Trekt op Supabase alle rechten op het `public` schema, tabellen, sequences en functies in voor de rollen `anon` en `authenticated`.
- Trekt dezelfde rechten ook in via `ALTER DEFAULT PRIVILEGES` voor toekomstige database-objecten.
- Gebruikt **niet** `FORCE ROW LEVEL SECURITY`, zodat de server-side Prisma databaseverbinding blijft werken.
- Werkt ook met lokale PostgreSQL waar de Supabase-rollen `anon` en `authenticated` niet bestaan.

## Belangrijk over de Supabase Data API

Deze webshop gebruikt Prisma server-side voor databaseverkeer. Laat daarom in Supabase **Data API uitgeschakeld** als je die niet nodig hebt. RLS + revokes vormen daarnaast defense-in-depth.

## Installatie lokaal

```bash
npm install
npx prisma generate
npx prisma migrate dev
npm run build
```

Als de migration al in Git staat en je enkel naar productie deployt:

```bash
npm run db:migrate:deploy
```

## Daarna testen

Controleer minimaal:

1. webshop toont producten;
2. personeelslogin werkt;
3. klantenlogin/registratie werkt;
4. productbeheer werkt;
5. voorraadbeheer werkt;
6. Mollie checkout werkt;
7. fysieke kassa werkt;
8. Billit-pagina werkt.

Daarna in Supabase: **Security Advisor** opnieuw uitvoeren. Meldingen zoals `rls_disabled_in_public` en `sensitive_columns_exposed` horen te verdwijnen.

## Nieuwe tabellen in latere fases

`ALTER DEFAULT PRIVILEGES` voorkomt directe grants aan `anon/authenticated`, maar PostgreSQL schakelt RLS niet automatisch in op nieuw aangemaakte tabellen. Voeg daarom bij elke toekomstige Prisma migration voor een nieuwe tabel ook toe:

```sql
ALTER TABLE public."NieuweTabel" ENABLE ROW LEVEL SECURITY;
```

of voer opnieuw een vergelijkbare hardening migration uit.
