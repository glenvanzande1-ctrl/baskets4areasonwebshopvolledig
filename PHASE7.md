# Fase 7 — productfoto's via Supabase Storage

Deze fase voegt meerdere productfoto's, automatische beeldnormalisatie en Supabase Storage toe.

## Wat gebeurt bij upload?

1. De browser leest de gekozen foto (JPG/PNG/WebP/AVIF).
2. De foto wordt lokaal verkleind naar een vierkant canvas van 1400 × 1400.
3. De volledige foto blijft zichtbaar; vrije ruimte krijgt een neutrale achtergrond.
4. Het bestand wordt als geoptimaliseerde WebP verstuurd.
5. De server normaliseert nogmaals naar 1400 × 1400 en uploadt naar Supabase Storage.
6. Alleen de publieke URL en storage-path worden in PostgreSQL opgeslagen.

Daardoor hebben productkaarten altijd dezelfde 1:1-verhouding, ongeacht de originele afmetingen.

## Supabase instellen

Ga naar **Project Settings → API** (of de huidige API Keys-pagina) en kopieer:

- Project URL → `SUPABASE_URL`
- Service role key → `SUPABASE_SERVICE_ROLE_KEY`

De service-role key is geheim en mag nooit in browsercode of GitHub terechtkomen.

Voeg toe aan `.env`:

```env
SUPABASE_URL="https://PROJECTREF.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="..."
SUPABASE_STORAGE_BUCKET="product-images"
```

Je hoeft de bucket niet vooraf te maken: bij de eerste upload probeert het systeem `product-images` automatisch als publieke bucket aan te maken.

## Upgrade vanaf fase 6

```bash
npm install
npx prisma generate
npx prisma migrate dev --name phase7_product_images
npm run dev
```

Open daarna een bestaand product via **Beheer → Producten → Wijzigen**. Daar verschijnt de sectie **Productfoto's**.

De eerste foto is de hoofdfoto. Je kunt meerdere foto's uploaden, een andere hoofdfoto kiezen, de volgorde wijzigen en foto's verwijderen.
