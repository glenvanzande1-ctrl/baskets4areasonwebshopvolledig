# Fase 9 — e-mails, kortingscodes en levering

Toegevoegd:
- automatische welkomstmail na registratie
- orderbevestiging na geslaagde Mollie-betaling
- e-mail bij klaar voor afhaling / verzending
- optionele Resend-integratie via `RESEND_API_KEY` en `EMAIL_FROM`
- kortingscodes: percentage of vast bedrag, geldigheid en minimum bestelbedrag
- afhaal- en leveringsinstellingen in beheer
- regionale postcodes, leveringskost, gratis levering vanaf bedrag
- minimum bestelbedrag
- leveradres als snapshot op de order
- ordertotalen met subtotaal, korting, levering en btw

## Installatie
```bash
npm install
npx prisma generate
npx prisma migrate dev --name phase9_operations
npm run db:seed
npm run dev
```

## E-mail
Voeg optioneel toe aan `.env`:
```env
RESEND_API_KEY="re_..."
EMAIL_FROM="Baskets4areason <webshop@jouwdomein.be>"
```
Zonder deze waarden blijft de webshop werken; e-mails worden dan alleen als 'skipped' gelogd.
