# Fase 15 — Moderne fysieke winkel / kassa

Deze patch maakt de kassapagina visueel vergelijkbaar met een moderne POS:

- barcode scanner en handmatige zoekfunctie blijven volledig behouden;
- producttegels met foto, prijs en beschikbare voorraad;
- horizontale categorieknoppen;
- product aantikken = direct in winkelmand;
- rechts een vaste huidige-verkoopkolom;
- aantallen met +/- wijzigen;
- kaart/cash betaling;
- numeriek keypad bij cash;
- BTW-overzicht en totaal;
- responsive voor desktop, tablet en telefoon.

## Installatie

1. Kopieer `components/PosRegister.tsx` over je bestaande bestand.
2. Kopieer `app/api/pos/catalog/route.ts` naar dezelfde locatie in je project.
3. Voeg de volledige inhoud van `POS15.css` onderaan `app/globals.css` toe.
4. Draai:

```bash
npm run build
npm run dev
```

Er is geen database-migratie nodig.

## Scanner
De scanner blijft werken zoals voordien. Zorg dat hij USB HID/keyboard mode gebruikt en een Enter-suffix stuurt. Een scan in het zoekveld zoekt de exacte barcode en voegt de variant automatisch toe.
