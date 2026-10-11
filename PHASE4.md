# Fase 4 — Webshop

Toegevoegd:
- publieke webshop op `/`
- productoverzicht en categoriefilter
- productdetail met varianten en realtime beschikbare voorraad
- winkelmand op basis van server-side cart cookie
- klantenregistratie en klantlogin
- account verplicht bij checkout; registratie kan rechtstreeks vanuit checkout
- checkoutfundament met afhalen in Zele
- productfoto URL in productbeheer
- database: Customer, CustomerAddress, Cart, CartItem, ProductImage

Mollie en definitieve ordercreatie volgen in fase 5. Tot dan is de betaalactie in checkout bewust uitgeschakeld.

## Upgrade

```bash
npm install
npx prisma generate
npx prisma migrate dev --name phase4_webshop
npm run dev
```
