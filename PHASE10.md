# Fase 10 — Rapportering & dashboard

Fase 10 voegt een operationeel rapporteringsdashboard toe onder `/admin/reports`.

## Inbegrepen
- omzet per gekozen periode
- webshop vs fysieke winkel
- cash vs kaart
- BTW-overzicht per tarief (o.a. 6% en 21%)
- gemiddelde verkoopwaarde
- best verkochte producten/varianten
- dagelijkse omzetgrafiek
- actuele lage voorraad
- actuele fysieke en gereserveerde voorraad
- verkoopwaarde van de huidige voorraad
- kortingsgebruik
- leveringskosten en POS-retouren
- CSV-export voor verdere analyse

## Periodes
Vandaag, deze week, deze maand, laatste 30 dagen en dit jaar.

## Database
Er is voor fase 10 geen nieuwe Prisma-migratie nodig. Alle rapporten worden opgebouwd uit de bestaande order-, kassa-, BTW- en voorraadgegevens.

## Belangrijk
Het BTW-overzicht is bedoeld als operationeel overzicht. Voor officiële BTW-aangiftes blijft de boekhouding de formele bron.
