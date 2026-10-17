# Fase 13 — responsive desktop + mobiel

Deze fase maakt de volledige applicatie responsief, met extra aandacht voor het beheer en de fysieke kassa.

## Belangrijkste wijzigingen

- Beheerpagina's passen zich aan desktop, tablet en smartphone aan.
- Brede beheertabellen worden op smartphone automatisch leesbare kaarten met labels; horizontaal swipen is niet meer nodig.
- Producten, voorraad, bestellingen, kassaverkopen, kortingscodes, auditlog, BTW-rapportering en kassahistoriek hebben een mobiele kaartweergave.
- Dashboardtegels, formulieren, productvarianten, personeelsbeheer en systeemcontrole stapelen logisch op kleinere schermen.
- Knoppen en velden zijn groter en beter bedienbaar met touch.
- Kassascherm werkt als één kolom op smartphone/tablet; winkelmand en betaalvak blijven volledig zichtbaar.
- Webshopnavigatie wrapt op mobiel in plaats van horizontaal te scrollen.
- Product-, winkelmand-, checkout-, account- en footer-layouts zijn verder geoptimaliseerd voor kleine schermen.
- Productfoto- en galerijweergave schaalt zonder horizontale overflow.
- Rapportgrafieken worden compacter op smartphone zodat de pagina zelf niet horizontaal hoeft te scrollen.

## Installeren

Deze versie is een volledige projectversie en bevat de eerdere patches tot en met fase 12.4.

1. Maak eerst een commit/backup van je huidige werkende project.
2. Vervang de projectbestanden door deze versie.
3. Behoud je eigen `.env`.
4. Voer uit:

```bash
npm install
npx prisma generate
npm run build
npm run dev
```

Er is geen nieuwe database-migratie nodig.

## Testen

Controleer zeker deze schermen op desktop én telefoon:

- `/admin`
- `/admin/products`
- `/admin/inventory`
- `/admin/orders`
- `/admin/pos-sales`
- `/admin/discounts`
- `/admin/reports`
- `/admin/users`
- `/admin/system`
- `/pos`
- `/pos/historiek`
- `/producten`
- `/winkelmand`
- `/afrekenen`

Op mobiel mogen de beheertabellen niet meer vereisen dat je naar rechts swipet om acties of waarden te zien.
