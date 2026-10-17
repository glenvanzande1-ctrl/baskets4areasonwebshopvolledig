# Fase 14.1 — Billit via PartyID + API key

Deze patch vervangt de OAuth-koppeling uit fase 14 door Billits eenvoudigere PartyID + API-key authenticatie voor een persoonlijke/non-commerciële integratie.

## Environment variables

```env
BILLIT_ENV="sandbox"
BILLIT_PARTY_ID="..."
BILLIT_API_KEY="..."
BILLIT_POS_CUSTOMER_NAME="Particuliere klant"
```

Niet meer nodig:

```text
BILLIT_CLIENT_ID
BILLIT_CLIENT_SECRET
BILLIT_REDIRECT_URI
BILLIT_TOKEN_ENCRYPTION_KEY
```

## Geen database-migratie

De bestaande `BillitInvoiceSync` tabel blijft gebruikt worden. De oudere `BillitConnection` tabel mag in de database blijven staan maar wordt niet meer gebruikt. Daardoor is geen nieuwe Prisma-migratie nodig.

## Flow

- betaalde webshoporder → automatische Billit-factuur
- afgeronde kassaverkoop → automatische Billit-factuur
- fout bij Billit → verkoop blijft geldig, sync krijgt `FAILED`
- via Beheer → Billit kan je een mislukte sync opnieuw proberen

## Installatie

1. Kopieer deze versie over fase 14/13.1.
2. Behoud je eigen `.env` en voeg de vier Billit-waarden hierboven toe.
3. Verwijder de oude OAuth-variabelen uit `.env`/Vercel wanneer je ze niet meer gebruikt.
4. Voer uit:

```bash
npm install
npx prisma generate
npm run build
npm run dev
```

## Veiligheid

`BILLIT_API_KEY` is geheim en mag alleen server-side in `.env` of Vercel Environment Variables staan. Zet hem nooit in `NEXT_PUBLIC_*` en nooit in GitHub.
