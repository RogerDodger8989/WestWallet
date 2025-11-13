
# WestWallet

WestWallet är ett komplett ekonomihanteringssystem med backend (NestJS, MongoDB) och frontend (React, Vite).

## Backend

### Globalt ID-system
WestWallet backend använder ett globalt ID-system för alla poster (t.ex. A000001, A000002 ...). Detta hanteras av en MongoDB counter och en ID-generator:
- `src/utils/id-generator.ts`: Funktion `getNextGlobalId()` genererar nästa ID.
- `src/models/counter.schema.ts`: Counter-schema för sekvensnummer.

### Användarhantering & Autentisering
User-modell med:
- preferences (notiser, UI, papperskorg, etc.)
- trial (trial_start, trial_days_left, is_paid, payment_method, payment_history)
- roller (admin/user/moderator)
- JWT-login, refresh-token, e-postverifiering
- Read-only-läge efter trial-period
- Banner vid slut på trial
- Adminpanel: se användare, trial-status, betalhistorik
- E-postverifiering vid registrering
- Token-refresh för längre sessioner
- Kryptering av känslig data (AES med crypto-js)
- Lösenord hashas med bcrypt

### Rollhantering & Behörigheter
Endpoints skyddas med @Roles('admin'), @Roles('user'), etc. via RolesGuard och Roles-decorator.
Behörighetskontroll sker automatiskt för alla endpoints med rollkrav.
Rate limiting för mail/reset-password.

### Undo-funktion & Papperskorg
Användare kan mjukt raderas (isDeleted, deletedAt) och återställas (undo) via API:
- Soft delete: flyttar användare till papperskorg
- Restore: återställer användare från papperskorg
- Trash: lista borttagna användare
Undo-tiden kan styras via preferences. Hard delete via cron-jobb kan läggas till.

### Bild-/filhantering
Bilder och filer lagras i `/uploads/{ID}/` på backend.
API:
- POST `/uploads/:id` (multipart/form-data, fält: file) – ladda upp fil
- DELETE `/uploads/:id/:filename` – radera fil
Mapp skapas automatiskt per ID. Komprimering kan läggas till.

### Trial/prenumeration
Efter 30 dagar får användaren read-only-läge om isPaid är false:
- Kan ej skapa/ändra/radera poster, ladda upp filer, exportera, synca kalender
- Banner visas när trial är slut
Adminpanel visar trial_start, trial_days_left, is_paid, payment_method

### Köhantering (BullMQ/Nest Bull)
Tunga processer hanteras via BullMQ/Nest Bull:
- Importera bankfiler
- Generera PDF
- Skicka mail/notiser
- Cronjobs
- Bildkomprimering
Kömodul (`QueueModule`) är installerad och konfigurerad. Lägg till workers för respektive process.

### Automatiska taggar / smart kategorisering (AI optional)
Backend har endpoint POST /ai/categorize för att föreslå kategori baserat på text, leverantör och belopp.

### Webhooks (framtidssäkert)
System för webhooks: /webhooks/subscribe och /webhooks/events. Händelser kan kopplas till externa appar (Discord, Slack, Home Assistant, notifieringssystem).

### Cache-lager (Redis eller Memory cache)
Dashboard-data, statistik, kategorier, leverantörer, användarinställningar och bildmetadata cacheas för snabbare svar.
Alla centrala modeller (användare, kategorier, utgifter, leverantörer, budget, wallets) har nu stöd för organizationId och cache.

### Multi-tenant / Multi-user-stöd
Stöd för organizationId: hushåll, familjer, föreningar, företag med flera användare per organisation.
Alla relevanta modeller och endpoints kan nu hantera organizationId för isolerad data per organisation.

### API Rate-Limiting per användare
200 requests/min per användare, 20 writes/min. Stoppar abuse och skyddar API.
RateLimitGuard är aktiverad globalt med Redis-cache.

## Frontend
Se `web/README.md` för frontend-specifik information.

## Roadmap
Se ROADMAP_BACKEND.txt nedan.
