# Fase 2 — Productbeheer

Deze versie voegt toe:
- Categoriebeheer
- Productoverzicht
- Product toevoegen/wijzigen/verwijderen
- Varianten per product
- SKU en barcode per variant
- Kleur, maat en gewicht in gram
- Prijs incl. BTW per variant
- BTW 6% of 21% per variant
- Actief/verborgen op product- en variantniveau
- Auditlog voor product- en categorieacties

## Upgraden vanaf jouw werkende fase 1

1. Maak eerst een commit/backup van je huidige werkende code.
2. Vervang de projectbestanden door deze fase-2-versie, maar behoud je eigen `.env`.
3. Controleer dat `package.json` Prisma 6.19.0 gebruikt.
4. Voer uit:

```bash
npm install
npx prisma generate
npx prisma migrate dev --name phase2_products
npm run dev
```

5. Open `/admin`. Je ziet nu Producten en Categorieën.

## Opmerking
Voorraadhoeveelheden zijn bewust nog niet toegevoegd; dat wordt fase 3 zodat voorraadmutaties, reserveringen en de fysieke winkel correct op één voorraadmodel kunnen werken.
