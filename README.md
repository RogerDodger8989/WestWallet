# WestWallet

## Vad vi har gjort

- Migrerat kategori- och leverantörs-ID till MongoDB ObjectId (string) i både frontend och backend.
- Fixat frontend så att leverantörsskapande skickar `{ name, category }` till backend.
- Uppdaterat filtrering och listning av leverantörer så att de visas direkt efter skapande.
- Skapat batchfil (`start-all.bat`) för att starta backend, MongoDB och frontend automatiskt.
- Löst valideringsproblem och synkroniserat datamodeller mellan frontend och backend.
- Skapat och förbättrat Wallets-modul i backend.

## Vad som komma skall

- Färdigställa och testa Wallets-funktionalitet (skapa, lista, uppdatera, ta bort wallets).
- Implementera och testa fler funktioner för budget, kategorier och leverantörer.
- Förbättra användargränssnittet och UX i frontend.
- Lägga till mer robust felhantering och feedback till användaren.
- Dokumentera API-endpoints och datamodeller tydligare.
- Eventuellt lägga till automatiska tester och CI/CD-flöde.

---

**För att starta projektet:**
1. Dubbelklicka på `start-all.bat` för att starta alla nödvändiga processer.
2. Backend körs på http://localhost:3000
3. Frontend körs på http://localhost:5173
4. Swagger-dokumentation finns på http://localhost:3000/api

---

Vid frågor eller problem, kontakta projektägaren eller titta i denna README för senaste status och instruktioner.
