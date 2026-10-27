# Fase 16.1 — logo + onbeperkte voorraad

- Headerlogo staat voortaan op een donker vlak zodat het witte/gouden logo altijd leesbaar is.
- Productvarianten krijgen `trackInventory`. Dit staat standaard UIT.
- UIT = onbeperkte voorraad; product blijft altijd verkoopbaar.
- AAN = klassieke voorraadopvolging met fysiek, gereserveerd, minimum en mutaties.
- Bestaande varianten worden na de migratie ook onbeperkt; zet voorraadopvolging handmatig aan voor artikelen die je exact wilt tellen.

## Installatie

```bash
npm install
npx prisma generate
npx prisma migrate dev --name phase16_1_unlimited_stock
npm run build
npm run dev
```

Op productie/Vercel voer je de bestaande migration uit met `npm run db:migrate:deploy`.
