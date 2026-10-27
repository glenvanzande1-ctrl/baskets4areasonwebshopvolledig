# Baskets4areason platform — fase 16

Volledige webshop + beheer + centrale voorraad + fysieke kassa + Mollie + Billit, met vernieuwde responsive klantgerichte storefront.

Zie `PHASE16.md` voor de wijzigingen en installatie.


## Fase 16.1 — logo + voorraadmodus

Nieuwe productvarianten zijn standaard **onbeperkt beschikbaar**. In productbeheer kan per variant `Voorraad opvolgen` worden aangezet voor artikelen die echt geteld moeten worden. Na de migratie worden ook bestaande varianten onbeperkt; zet tracking opnieuw aan waar nodig. Het storefront-logo staat op een donker contrastvlak voor betere leesbaarheid. Zie `PHASE16.1.md`.


## Fase 16.2
De homepage-hero gebruikt nu een vaste sfeervolle afbeelding (`public/storefront-hero.png`) en niet langer automatisch een productfoto uit de database.


## Fase 16.3 — Security
Supabase RLS + database grants zijn nu vastgelegd in `prisma/migrations/20261027213000_phase16_3_security_rls/migration.sql`. Zie `PHASE16.3.md`.
