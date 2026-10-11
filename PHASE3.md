# Fase 3 – Voorraadbeheer

Deze upgrade voegt centrale voorraad toe per productvariant en locatie.

## Nieuw
- Voorraadlocatie `Fysieke winkel Zele`
- Fysieke voorraad (`onHand`)
- Gereserveerde voorraad (`reserved`)
- Beschikbare voorraad = fysiek - gereserveerd
- Minimumvoorraad en waarschuwingen
- Voorraadmutaties: ontvangst, retour, correctie, beschadigd/verloren
- Volledige mutatiehistoriek met gebruiker
- Auditlog
- Interne functies voor reserveren, vrijgeven en consumeren van voorraad, klaar voor webshop/Mollie

## Installatie bovenop fase 2
Behoud je bestaande `.env`.

```bash
npm install
npx prisma generate
npx prisma migrate dev --name phase3_inventory
npm run db:seed
npm run dev
```

Open daarna `/admin/inventory`.

## Belangrijk
`reserved` wordt vanaf toekomstige webshoporders transactioneel bijgewerkt. Fase 3 legt hiervoor de database en serverfuncties al klaar; handmatige reservaties zijn bewust niet als beheerknop toegevoegd.
