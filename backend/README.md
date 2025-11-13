## Undo-funktion & Papperskorg
## Bild-/filhantering
## Trial/prenumeration
## Köhantering (BullMQ/Nest Bull)
## Automatiska taggar / smart kategorisering (AI optional)

Backend har endpoint POST /ai/categorize för att föreslå kategori baserat på text, leverantör och belopp.

## Webhooks (framtidssäkert)

System för webhooks: /webhooks/subscribe och /webhooks/events. Händelser kan kopplas till externa appar (Discord, Slack, Home Assistant, notifieringssystem).

## Cache-lager (Redis eller Memory cache)

Dashboard-data, statistik, kategorier, leverantörer, användarinställningar och bildmetadata cacheas för snabbare svar.

## Multi-tenant / Multi-user-stöd

Stöd för organizationId: hushåll, familjer, föreningar, företag med flera användare per organisation.

## API Rate-Limiting per användare

200 requests/min per användare, 20 writes/min. Stoppar abuse och skyddar API.

Tunga processer hanteras via BullMQ/Nest Bull:
- Importera bankfiler
- Generera PDF
- Skicka mail/notiser
- Cronjobs
- Bildkomprimering
Kömodul (`QueueModule`) är installerad och konfigurerad. Lägg till workers för respektive process.

Efter 30 dagar får användaren read-only-läge om isPaid är false:
- Kan ej skapa/ändra/radera poster, ladda upp filer, exportera, synca kalender
- Banner visas när trial är slut
Adminpanel visar trial_start, trial_days_left, is_paid, payment_method

Bilder och filer lagras i `/uploads/{ID}/` på backend.
API:
- POST `/uploads/:id` (multipart/form-data, fält: file) – ladda upp fil
- DELETE `/uploads/:id/:filename` – radera fil
Mapp skapas automatiskt per ID. Komprimering kan läggas till.

Användare kan mjukt raderas (isDeleted, deletedAt) och återställas (undo) via API:
- Soft delete: flyttar användare till papperskorg
- Restore: återställer användare från papperskorg
- Trash: lista borttagna användare
Undo-tiden kan styras via preferences. Hard delete via cron-jobb kan läggas till.
<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

### Globalt ID-system

Genererar sekventiella globala ID:n med prefix, t.ex. `A000001`. Använder MongoDB Counter för atomär sekvens.

**Schema-regler:**
- ID måste matcha regex `/A\d{6}/`.
- Fel returneras med `errorCode` vid sekvens- eller formatfel.

- `src/utils/id-generator.ts`: Funktion `getNextGlobalId()` genererar nästa ID.
- `src/models/counter.schema.ts`: Counter-schema för sekvensnummer.

Alla nya poster kan tilldelas ett unikt globalt ID via denna funktion.

## Användarhantering & Autentisering

WestWallet backend har en avancerad användarhantering:

  - preferences (notiser, UI, papperskorg, etc.)
  - trial (trial_start, trial_days_left, is_paid, payment_method, payment_history)
  - paymentHistory (alla betalningar och status)
  - roller (admin/user/moderator) och roles: string[]
  - Exempel på preferences:
    - notifications: { ... }
    - ui: { theme: 'dark' }
    - trash: { undoTimeout: 10 }

## Rollhantering & Behörigheter

Endpoints skyddas med @Roles('admin'), @Roles('user'), etc. via RolesGuard och Roles-decorator.
Behörighetskontroll sker automatiskt för alla endpoints med rollkrav.
- Read-only-läge efter trial-period (kan ej skapa/ändra/radera poster, ladda upp filer, exportera, synca kalender)
- Banner visas när trial är slut
- Adminpanel: se användare, trial-status, betalhistorik
- E-postverifiering vid registrering
- Token-refresh för längre sessioner
- Kryptering av känslig data (AES med crypto-js)
- Lösenord hashas med bcrypt

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
