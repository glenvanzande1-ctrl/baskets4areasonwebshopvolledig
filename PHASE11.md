# Fase 11 — Live-klaar & professionalisering

Deze fase verstevigt het bestaande platform zonder het verkoopmodel te wijzigen.

## Nieuw
- Personeelsbeheer voor administrators: ADMIN / MANAGER / CASHIER.
- Accounts activeren/deactiveren en wachtwoorden resetten.
- Bescherming tegen het uitschakelen van de laatste actieve administrator.
- Rollen en actieve status worden bij iedere server-side sessie opnieuw uit de database gelezen.
- Activiteitenlog in het beheer.
- Systeemcontrole voor database, Mollie, Resend, Supabase Storage, APP_URL en sessiebeveiliging.
- Publieke `/api/health` endpoint voor eenvoudige uptimecontrole.
- Security headers en uitschakelen van `X-Powered-By`.
- Betere fout- en 404-pagina's.
- Robuustere login wanneer een serverfout geen JSON teruggeeft.

## Database
Geen nieuwe migration nodig. Fase 11 gebruikt bestaande `User` en `AuditLog` tabellen.

## Installatie
```bash
npm install
npx prisma generate
npm run dev
```

## Controle
- `/admin/users` (alleen ADMIN)
- `/admin/audit` (ADMIN/MANAGER)
- `/admin/system` (alleen ADMIN)
- `/api/health`

Voor productie blijft het aanbevolen om hosting- en databasebackups bij de betreffende providers te configureren en daarna Mollie, Resend, scanner en printer op de echte productieomgeving te testen.
