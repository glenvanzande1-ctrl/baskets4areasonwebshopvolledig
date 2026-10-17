# Fase 12.4 – mobiele productfoto upload

Deze patch maakt productfoto-uploads robuuster op smartphones.

## Wat is aangepast?

- Mobiele foto’s worden voortaan adaptief gecomprimeerd vóór upload.
- De foto blijft visueel 1400 × 1400 voor een uniforme webshopweergave.
- WebP-kwaliteit wordt automatisch verlaagd wanneer een mobiele browser een te groot bestand genereert.
- Doelgrootte vóór upload: maximaal ongeveer 2,4 MB.
- De server accepteert tot 4 MB als extra veiligheidsmarge.
- Geldt zowel voor foto’s bij een nieuw product als voor foto’s bij een bestaand product.
- Duidelijkere foutmelding wanneer een browser een bepaald afbeeldingsformaat niet kan verwerken.

## Installatie

Kopieer deze mappen over je huidige project:

- `components/`
- `app/api/admin/products/[id]/images/`

Geen database-migratie nodig.

Daarna:

```bash
npm run build
npm run dev
```

Test daarna dezelfde smartphonefoto opnieuw.

## Opmerking over HEIC/HEIF

Sommige telefoons bewaren foto’s als HEIC/HEIF. Niet elke browser kan dat formaat direct in een canvas verwerken. De picker laat het formaat toe, maar wanneer de browser het niet kan decoderen krijg je een duidelijke melding. JPG/PNG/WebP/AVIF blijven het betrouwbaarst.

## Fase 13 — responsive beheer en mobiel
Zie `PHASE13.md`. Deze versie bevat de responsive desktop/mobile overhaul, met mobiele kaartweergave voor brede beheertabellen en touchvriendelijke formulieren/kassa.
