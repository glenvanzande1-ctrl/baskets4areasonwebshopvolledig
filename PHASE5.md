# Fase 5 — Orders + Mollie + voorraadreservering

Toegevoegd:
- Order- en orderregelmodellen met prijs- en BTW-snapshots.
- Mollie Payments API checkout.
- Voorraad wordt bij het starten van de betaling 1 uur gereserveerd.
- Betaalde Mollie-betalingen verbruiken de reservering en verminderen fysieke voorraad.
- Mislukte/geannuleerde/verlopen betalingen geven de reservering vrij.
- Mollie webhook voor live/Vercel.
- Terugkeerpagina die Mollie ook controleert; hierdoor kun je testbetalingen lokaal testen zonder publieke webhook.
- Klant: bestelgeschiedenis.
- Beheer: orderlijst, detail en statussen In verwerking / Klaar voor afhaling / Voltooid.

## Environment variables
Voeg toe aan `.env` en later aan Vercel:

```env
MOLLIE_API_KEY="test_..."
APP_URL="http://localhost:3000"
```

Voor live zet je `APP_URL` op je publieke HTTPS-domein en gebruik je pas na volledig testen een `live_...` key.

## Installatie

```bash
npm install
npx prisma generate
npx prisma migrate dev --name phase5_orders_mollie
npm run dev
```

## Mollie testen
Gebruik eerst een Mollie **test API key**. Na `Betalen via Mollie` ga je naar Mollie's hosted checkout. De webshop gebruikt alle betaalmethodes die voor het Mollie-profiel beschikbaar zijn.

Lokaal wordt geen webhookUrl meegestuurd omdat Mollie `localhost` niet kan bereiken; de retourpagina haalt daarom de actuele betaalstatus op bij Mollie. Op Vercel/live wordt automatisch `/api/mollie/webhook` gebruikt.
