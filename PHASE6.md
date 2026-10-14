# Fase 6 — fysieke winkel / kassa

Deze fase voegt een werkende kassamodule toe bovenop dezelfde centrale voorraad als de webshop.

## Nieuw

- barcode- en SKU-scanning via toetsenbordinvoer (geschikt voor Zebra USB HID scanners)
- zoeken op productnaam, SKU of barcode
- kassamand met aantallen
- realtime controle van beschikbare voorraad
- betaling registreren als cash of kaart
- cash ontvangen bedrag en wisselgeld
- kassaverkoop met prijs- en BTW-snapshot per lijn
- voorraad onmiddellijk afboeken na verkoop
- voorraadmutatie `POS_SALE`
- 80 mm printbare kassabon
- kassahistoriek
- retouren op basis van kassabonnummer
- retour al dan niet terug in verkoopbare voorraad
- dagomzet, cash/kaart en aantal verkopen in beheer

## Installeren

Maak eerst een commit van fase 5 en behoud je bestaande `.env`.

```bash
npm install
npx prisma generate
npx prisma migrate dev --name phase6_pos
npm run dev
```

Open daarna:

- Kassa: `http://localhost:3000/pos`
- Kassahistoriek: `http://localhost:3000/pos/historiek`
- Retour: `http://localhost:3000/pos/retour`
- Beheer kassaverkopen: `http://localhost:3000/admin/pos-sales`

## Zebra scanner

Een Zebra DS2208 kan als USB HID keyboard worden ingesteld. Stel een Enter-suffix in. De scanner typt dan de barcode in het scanveld en drukt automatisch Enter. Een exacte barcode wordt direct aan de kassamand toegevoegd.

## Epson bonprinter

De bonpagina is geoptimaliseerd voor 80 mm thermisch papier en gebruikt voorlopig de browser-printdialoog. Selecteer in Windows de Epson TM-printer als printer en stel 80 mm papier in. Rechtstreekse/stille printeraansturing zonder dialoog kan later via een lokale print bridge of een geschikte netwerk/cloud-integratie worden toegevoegd.

## Kaartbetalingen in de winkel

`CARD` in deze fase registreert dat de betaling op een externe betaalterminal is geslaagd. Er is nog geen rechtstreekse terminalkoppeling. Dat kan later apart geïntegreerd worden afhankelijk van het gekozen terminalmodel/provider.
