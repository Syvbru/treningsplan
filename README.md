# Treningsplan for langrenn

Én SvelteKit-applikasjon for én trener og én gruppe. Google Sheets er kilde for treningsplaner, Neon/PostgreSQL lagrer teknikklogger og sesjoner, og Cloudinary lagrer videoer. Apps Script oppdaterer de eksterne arkene omtrent hvert 30. minutt og matcher fellesøkter med dato og lik økttekst. Scriptet og arkene ligger utenfor repositoryet.

Utøvere ser egne planer, fellesøkter, kalender, statistikk og ressurser, og kan opprette, redigere og slette egne teknikklogger. Treneren har en oversikt over utøvere/planstatus, velger utøver og **leser** planer, logger og videoer. Treneren har ingen skriverettighet til teknikklogger eller videoopplastinger. Google Sheets beholder sine egne delings- og redigeringsrettigheter.

## Lokal oppstart

Bruk Node.js 22.12 eller nyere som støttes av verktøyene (verifisert her med Node 26). Behold `package-lock.json` og bruk `npm ci` for en reproduserbar installasjon.

```sh
npm ci
cp .env.example .env
# Fyll inn lokale/staging-verdier, og kjør SQL-migreringen manuelt i testdatabasen.
npm run dev
```

Åpne `http://localhost:5173`. Vite beholder egen cache for dev og build samt fast port 5173. Kjør aldri lokale integrasjonstester mot produksjonsdatabase. Det utføres ingen databaseendringer ved `npm run build`, oppstart eller installasjon.

Testene trenger ingen hemmeligheter, Google-ark, Neon-konto eller Cloudinary-konto:

```sh
npm run check          # TypeScript og Svelte, inklusive testkode
npm run lint           # ESLint / typescript-eslint / Svelte
npm run format:check   # Prettier
npm test               # Vitest, syntetiske data og lokal PostgreSQL via PGlite
npm run build          # Produksjonsbygg med eksisterende adapter-auto
npm run quality        # Samler kontrollene over
npx playwright install chromium
npm run test:browser   # Separate mobil-/desktoptester mot komponentene og API-fixtures
```

`npm run format` formaterer kildekoden. Låsfilen og den eksisterende lokale Vite-konfigurasjonen er unntatt. En miljøvariabel som `PLAYWRIGHT_BROWSERS_PATH=/tmp/treningsplan-browsers` kan brukes ved begrenset skrivetilgang til normal nettlesercache. Nettleseren må også kunne starte i operativsystemets sandbox.

For manuell UI-kontroll med helt syntetiske data:

```sh
SYNTHETIC_PREVIEW=1 npx vite --config tests/preview/vite.config.ts
```

Åpne `http://localhost:5189/utover`, `/trener` eller `/login`. Dette er en **isolert testvisning** av de samme komponentene, uten produksjonshooks, ekte innlogging eller eksterne lagringskall. `?scenario=errors` simulerer regneark-/utloggingsfeil. Denne testkonfigurasjonen er aldri importert av appens produksjonsbygg. Den er ikke en ekstra produksjonsapp og implementerer ingen testbakdør i appens serverkode.

## Struktur og ansvarsgrenser

```text
src/
  hooks.server.ts             Sesjonsoppslag, locals, Origin-sjekk, private cache-headere
  app.d.ts                    Typet serveridentitet
  app.css                     Felles designverdier, tema og fokusmarkering
  routes/
    login/                    Felles innlogging og rollenavigasjon
    utover/                   Egen treningsvisning
    trener/                   Treneroversikt
      utovere/[utoverId]/     Eksplisitt målutøver, egen URL per fane
    api/                      Tynne HTTP-handlere med egne tilgangskontroller
  lib/
    domain/                   Rene typer, dato/varighet, CSV, øktklassifisering, statistikk
    config/                   Sesongperioder, styrkeprogrammer og teknikkvideoer
    server/                   Brukerregister, passord, sesjoner, policy, SQL, Sheets, Cloudinary
    client/                   API-feil, tidsgrenser, videofremdrift/avbrudd og temapreferanse
    components/
      training/               Kalender, dagsplan og faner; felles TrainingView
      calendar/               Gjenbrukt datovelger
      statistics/             Diagrammer og periodenavigasjon
      technique/              Loggliste/-detalj og ett felles opprett/rediger-skjema
      coach/                  Utøvervelger og oversikt
      resources/              Profilmeny, styrkeressurser og videokarusell
      ui/                     Dialog, skjemafelt, knapp, lasting/feil/tomt og sidehode
migrations/                   Additiv SQL, kjøres separat
tests/                        Domenetester, server/SQL-tester og nettlesertester
docs/                         Utrulling, eksterne tiltak og verifikasjon
```

Rutene setter sammen visninger og styrer navigasjon. `TrainingView` koordinerer datalasting, dato og fanene Plan, Logg, Statistikk og Film. Plan åpnes i ukevisning; kalenderoverskriften går til måned og videre til år med direkte årsvalg. Kommentarer samles én gang under dagens økter, etterfulgt av navn på utøvere med samme økt. Mobil har en flytende, delvis gjennomsiktig bunnmeny med markering av valgt fane og plass til telefonens safe area. Sveip over øktene for å bytte dag, eller over ukedatoene for å bytte uke. Hvileøkter viser ikke utøvere med samme økt. Domenelogikken kjenner ingen ikoner eller CSS; øktens visuelle stil ligger i `training/presentation.ts`.

## Ruter og rollemodell

`/` sender til `/login`, `/utover` eller `/trener`. Etter innlogging velges område fra serverbestemt rolle. Serverhooks slår opp cookie-token i `auth_sessions` og setter `locals.user`; rolleinformasjon kommer fra dagens brukerregister. Beskyttede page-loadere kontrollerer rollen. **Hver API-handler** kontrollerer dessuten rolle og eierskap før SQL eller eksterne kall. Utøver kan ikke lese andre utøveres data ved å bytte ID. SQL for oppdatering/sletting inkluderer alltid eier-ID og kontrollerer `RETURNING`; manglende rad gir 404. Trenerens POST/PUT/DELETE gir 403.

Trenerens `/trener/utovere/[utoverId]` inneholder valgt utøver. Plan-/loggkall sender ID eksplisitt. Ingen cookie eller global klienttilstand husker valgt utøver. Faner er uavhengige, og gamle lesesvar avbrytes/ignoreres ved bytte. Temapreferansen `dk` beholdes lokalt.

## API-kontrakt

Alle svar bruker én innpakning: suksess `{ "success": true, "data": ... }`, feil `{ "success": false, "error": "trygg melding", "code": "MASKINLESBAR_KODE" }`. Interne databasefeil, SQL-detaljer og hemmeligheter sendes ikke til klienten eller skrives i standardlogger. 400 gjelder ugyldige felt/ID-er, 401 manglende/utløpt innlogging, 403 rolle/eierskap/Origin, 404 manglende eller fremmed logg, 413 for stor forespørsel, 415 feil innholdsformat, 429 begrensning av forsøk/opplastinger, 502 eksterne tjenestefeil og 503 utilgjengelig/feilkonfigurert tjeneste. Endringer krever JSON og samme Origin som appen.

| Endepunkt                      | Tilgang og innhold                                                |
| ------------------------------ | ----------------------------------------------------------------- |
| POST `/api/login`              | Generisk innloggingsfeil, begrensede forsøk, ny sesjon og målrute |
| POST `/api/logout`             | Tilbakekaller aktuell sesjon før cookie slettes                   |
| GET `/api/verify`              | Serveravgjort identitet, ingen regnearkadresser eller passorddata |
| GET `/api/plan?utoverId=…`     | Egen utøver eller trener; normaliserte økter, status og advarsler |
| GET `/api/felles-okter`        | Innlogget gruppe; normaliserte fellesøkter                        |
| GET `/api/utovere`             | Kun trener, oversikt og individuell planstatus/feil               |
| GET `/api/teknikk?utoverId=…`  | Eier eller trener                                                 |
| POST/PUT/DELETE `/api/teknikk` | Kun utøver, kun egne rader, validerte felt og videoeierskap       |
| POST/PUT/DELETE `/api/uploads` | Kun utøver; reserver, bekreft eller marker ubrukt opplasting      |

De tidligere rutene `/api/admin-list-users`, `/api/admin-search`, `/api/admin-user-sheets` og `/api/felles-okter-url` er fjernet. Treneroversikten bruker `/api/utovere`, utøvervalg skjer via `/trener/utovere/[utoverId]`, og fellesøkter hentes fra `/api/felles-okter`. Det er ingen generell CRUD-abstraksjon, gruppemodell eller ny plattform.

## Regnearkformat og sesonger

Trenings-CSV har første rad som overskrifter: `Dato`, `Hva økt 1`, `Tid`, eventuelt `Hva økt 2` med en **andre** `Tid`, og valgfri `Kommentar`. Dato aksepteres som `yyyy-MM-dd`, `d.M.yyyy`, `d.M` eller norsk månedsnavn som `1. januar`. Datoer uten år tolkes innen sesongen **1. mai–30. april** for referansedatoen. Bruk eksplisitte år i historiske/fremtidige ark for å unngå tvetydighet. Varighet er `timer:minutter`, eventuelt med `:00` sekunder, og kan være blank (0). Ugyldig dato eller varighet avvises med radnummer, i stedet for å vises som feil eller forsvinne.

Fellesøkt-CSV krever `Dato`, `Økt` og `Utøvere`, med kommaseparerte navn i et korrekt sitert CSV-felt. Planstatus hentes fra gjeldende periodefane: `MIN PLAN ER KLAR FOR Å FERDIGSTILLES`, etterfulgt av `JA` eller `NEI`. Feil i statusfeltet vises separat fra en gyldig plan.

Periodene for 2026/27 er flyttet uendret til `src/lib/config/seasons.ts`; de åtte varslingsvinduene og arkfanenavnene er beholdt. Neste sesong legges til ved å legge nye datointervaller og **eksakte** arkfanenavn i `PERIODER`, opprette tilsvarende Google-faner og oppdatere Apps Script separat. Pass på inkluderende fra/til-datoer og unngå overlapp. Planstatus bruker kalenderdato i `Europe/Oslo`. Legg til grensetester ved nye sesonger. Statistikk har fortsatt uke (mandag), måned og mai–april-sesong; månedslinjen viser hele uker, også dagene utenfor måneden, som før.

## Sikkerhet, integrasjoner og utrulling

Les [utrullings-/tilbakeføringsplan](docs/ROLLOUT.md), [eksterne tjenester og opplasting](docs/EXTERNAL_SERVICES.md) og [verifikasjonsrapport](docs/VERIFICATION.md).

Eksisterende SHA-256-passord oppgraderes til scrypt ved riktig innlogging. Sesjoner er tilbakekallbare og varer syv dager. Ingen produksjonsmigrering eller deploy er utført. Før produksjonssetting kreves additive databasetabeller, nye hemmelige konfigurasjonsverdier, kontroll av signert Cloudinary-preset og stagingtest. Offentlige Google Sheets og vanlige Cloudinary-URL-er blir ikke private gjennom en serverproxy.

Mørkmodus bruker svart bakgrunn og mørkegrå flater. Begge temaer bruker den samme rosa aksenten. Intervall/hardøkter vises med rød strek, og styrke med gul strek. Økttypene vises kun som fargede streker i planen; statistikkens klassifisering er beholdt. Logg, statistikk, ressurser og videokarusell beholder sine funksjoner. Dialogene bruker native `<dialog>` for modalitet/fokus/tastatur, Escape og fokusretur, med mobilark og profilpanel. Skjemaer har semantisk submit, tydelige etiketter, filgrenser og egne laste-/feil-/tomme tilstander. Videoer med tale trenger teksting/transkript som et eget innholdstiltak; eksisterende opptak har ingen tekstespor i dette repositoryet.
