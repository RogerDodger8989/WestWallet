# WestWallet – Roadmap & Specifikation

## Projektöversikt
- Monorepo: backend (NestJS), web (React+Vite), scripts, docs
- Globalt ID-system: A000001, A000002 ...
- Backend lagrar bilder/filer under /uploads/{ID}/
- Trial/prenumeration: read-only efter 30 dagar, banner, adminpanel visar status
- Undo-funktion: soft delete 10s, undo-bar, papperskorg med historik
- Bankimport: regler, dubblettkontroll, redigerbara matchningar
- Kalender-synk: utvalda flikar, envägssynk till Google Calendar
- Export/import: ZIP med data.json + filer, remapping vid import
- Notifieringar: dagliga, per typ, inställningar per användare
- Inställningar: users.preferences i databasen
- Logging/audit, rate limiting, systemhälsa

## Tech-stack
- Backend: NestJS, MongoDB, AES-kryptering, SendGrid, Stripe
- Frontend: Vite, React, TypeScript, Zustand, React Router, Tailwind, shadcn/ui, Recharts, Framer Motion, react-hook-form, zod, axios

## Mappstruktur
- src/components/ui, forms, modals, tables, icons, charts
- src/features/auth, economy, contracts, cars, warranties, insurances, maintenance, reporting, suppliers, photos, admin
- src/store: useAuthStore, useThemeStore, useEconomyStore, ...
- src/pages: auth, dashboard, economy, contracts, cars, warranties, insurances, maintenance, reporting, bankReport, suppliers, photos, settings, admin, about
- src/app: AppShell, routes
- src/api: axios.ts, economyApi.ts, ...
- src/hooks, src/lib, src/styles

## Routing
- /login, /register, /verify-email, /reset-password
- /dashboard, /economy, /contracts, /cars, /warranties, /insurances, /maintenance, /reporting, /bank-report, /suppliers, /photos, /settings, /admin/users, /admin/system, /about
- ProtectedRoute, AdminRoute

## UI & Funktioner
- Topbar: logga + namn, horisontell meny (ikoner, tooltips, hover-effekt, sticky)
- Tema: dark/light, toggle längst ner till vänster, animation
- Toasts, undo-bar, confirm-dialog, loading skeletons
- Permissions: admin/user, döljer adminmeny, redirect vid otillåten access
- Filuppladdning: IndexedDB + backend, validering, preview, progressbar
- Sök/filter: debounce, tag/date filter, global search (Ctrl+K)
- Print/export: rapporter, PDF, Excel, bilder
- Widget-dashboard: valbara widgets
- Page transitions: framer-motion
- Error handling: ErrorBoundary, fallback, retry, skeletons
- Keyboard shortcuts: Ctrl+K, N, Ctrl+F, H

## Sidor
- Ekonomihantering: utgift/inkomst, filter, bildhantering, export, undo, toast
- Avtal & abonnemang: intervall, synk, dashboard, filter, statistik
- Bilkostnader: bilhantering, händelser, statistik, filter
- Garantier, inventarier, försäkringar, hushållsunderhåll: samma datamodell, bildhantering, filter, statistik
- Rapportering & analys: grafer, export, PDF, rapporter
- Leverantörer & kategorier: CRUD, PDF-export
- Inställningar: profil, bildplats, backup, påminnelseprofiler, export/import
- Adminpanel: användarhantering, prenumerationer, betalhistorik, systeminställningar
- Om & kontakt: beskrivning, kontaktuppgifter

## Backend
- Auth: JWT, refresh-token, roller, e-postverifiering
- Data: AES-kryptering, globalt ID, relationslogik
- Mail: SendGrid, automatiska utskick
- Betalning: Stripe/Paddle/LemonSqueezy
- Backup: daglig/veckovis, versionshistorik
- API: REST, endpoints per domän

## DevOps
- HTTPS via Nginx, .env, backup-skript, daglig cronjob

---

## Nästa steg
- Implementera state stores per domän
- Bygg ut UI-komponenter enligt roadmap
- Koppla frontend till backend-API
- Lägg till global error handling, toasts, undo, loading skeletons
- Utveckla adminpanel och permissions
- Finslipa dashboard, widgets, rapporter
- Testa flows och UI/UX
