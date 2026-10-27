# Fase 16 — nieuwe klantgerichte webshoplayout

Deze fase bouwt de publieke webshop om naar de goedgekeurde boutique-layout voor Baskets4areason.

## Nieuw

- warme zwart/wit/goud + crème storefront
- brede desktopheader met logo, zoekbalk, account en winkelmand
- mobiele header met hamburger, zoekbalk en winkelmand
- dynamische categorie-navigatie uit Supabase
- grote hero op basis van een echte productfoto uit het beheer
- ronde categorie-shortcuts met echte productfoto's
- compacte productkaarten voor Bestsellers en Nieuw binnen
- responsive 2-koloms productkaarten op smartphone
- vernieuwde collectiepagina
- zoeken op productnaam of omschrijving via `/producten?q=...`
- vernieuwde footer en serviceblokken

## Behouden

- beheeromgeving
- voorraadbeheer
- productvarianten
- Mollie
- Billit
- klantenaccounts
- winkelmand / checkout
- fysieke kassa

## Installatie

1. Maak een backup/commit van de huidige werkende versie.
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

## Opmerking hero

De homepage gebruikt automatisch de eerste beschikbare productfoto als hero-afbeelding. Daardoor kan de uitstraling later eenvoudig worden aangepast door een mooie sfeer/productfoto als eerste foto bij een product te plaatsen.
