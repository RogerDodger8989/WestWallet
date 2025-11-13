
## Backend-funktioner

✔ Globalt ID-system (A000001, robust generator)
✔ User-modell med trial, roller, preferences
✔ JWT-login, refresh-token, e-postverifiering
✔ Read-only-läge efter trial-period
✔ Adminpanel: se användare, trial-status, betalhistorik
✔ Kryptering av känslig data (AES)
✔ Lösenord hashas med bcrypt
✔ Rollhantering & behörigheter (@Roles, rate limiting)
✔ Undo-funktion & papperskorg (mjukt radera, restore, trash)
✔ Bild-/filhantering (uploads, API för uppladdning/radering)
✔ Trial/prenumeration (read-only efter 30 dagar, adminfält)
✔ Import/export (ZIP, remapping, rapporter)
✔ Notifieringar (cron-jobb, inställningar, massutskick)
✔ Logging & audit trail (auditlog-schema, service, endpoint, admin-log viewer API)
✔ Statistik & rapporter (aggregation pipelines, /expenses/stats/:year)
✔ Systemhälsa & adminpanel (mailstatus, cronstatus, uptime, disk, version)
✔ Modul-specifika endpoints (transaktioner, kategorier, leverantörer, avtal, bilkostnader, garantier)
✔ Inställningar (users.preferences, adminpanel)
✔ Export/rapportering (PDF/Excel/CSV, automatiska rapporter)
✔ Säkerhet & drift (HTTPS, .env, backup, cronjob)
✔ Bonus/AI (kostnadsprognos, anomalidetektering, automatisk kategorisering)
✔ Köhantering (BullMQ/Nest Bull, workers för tunga processer)
✔ Automatiska taggar / smart kategorisering (POST /ai/categorize)
✔ Webhooks (subscribe/events, koppling till externa appar)
✔ Cache-lager (Redis/Memory, dashboard-data, statistik, metadata)
✔ Multi-tenant / Multi-user-stöd (organizationId, flera användare per org)
✔ API Rate-Limiting per användare (200 req/min, 20 writes/min)
✔ Avancerad felhantering (errorCode i alla services/controllers)
✔ Mail-teman & MJML-mallar (välkomstmail, faktura, rapport, PDF)
✔ Offline sync-stöd (GET /expenses/sync?since=timestamp)
✔ WebSockets för live-uppdateringar (NestJS Gateway, dashboard, bild uppladdad)
✔ Full subscription-hantering (trial, grace-period, Stripe-webhooks, invoice-historik)
✔ Device management (sessions, IP, device-namn, logga ut andra sessioner)



## Backend Roadmap

- Export-jobb som körs i bakgrunden
- Event Sourcing (spara events, analyssystem)
- Skapa mellanberäkningar (cacheade stats)
- Admin “impersonate user” (se användarens vy, felsök utan lösenord)
- What-if-simulering (API för scenario-beräkning)
- Ekonomi-hälsopoäng (score, tips, spargrad, fasta kostnader vs inkomst, skuldnivåer, volatilitet)
- Centralt konfig-API (trial days, priser, max filstorlek, notiser, max användare/org)
- Billing/licenser & betalning (utökad hantering)
