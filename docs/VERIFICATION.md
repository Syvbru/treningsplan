# Verifikasjon

## Faktisk kjørt

- `npm test`: 36 tester passerer. Sikkerhetstestene bruker faktisk SQL via PGlite/PostgreSQL i minne, den additive migreringen og en syntetisk `teknikk_logger`-tabell. De kobler aldri til Neon.
- `npm run check`: 0 TypeScript/Svelte-feil og 0 advarsler.
- `npm run lint`: passerer.
- `npm run build`: passerer med eksisterende SvelteKit 2, Svelte 5, Vite 7 og adapter-auto. Lokalt registrerer adapteren ingen hostingplattform; dette er et lokalt produksjonsbygg, ingen deploy.
- `npm run format:check` og `git diff --check`: passerer. Uautentiserte forespørsler mot det lokale produksjonsbygget gir riktige 303-redirects og 401-svar, uten database-/eksterne kall.
- `npm audit`: fire lavt klassifiserte funn i cookie/SvelteKit/adapter-kjeden; ingen moderate, høye eller kritiske. Npms foreslåtte direkte oppgraderinger er større SvelteKit-/adapterversjoner og er ikke gjennomført i denne refaktoreringen. Cookie-navn/path/domain i egen kode er faste serververdier. Dette erstatter ikke en separat vurdering av rammeverkets avhengigheter.
- Vite-konfigurasjonen er sammenlignet byte for byte med det lokale utgangspunktet og er uendret. Ingen allerede eksisterende, fortsatt brukte pakker har fått endret versjon fra brukerens lokale låsfil. Nye kontrollverktøy er lagt til; ubrukt JWT, statisk adapter og gh-pages er fjernet.
- Etter fjerning av de fire admin-/kompatibilitetsrutene er `npm run quality` kjørt på nytt: alle 36 tester og kontrollene passerer. Direkte forespørsler til SvelteKit-serveren fra det ferdige bygget, med tom miljøkonfigurasjon, gir 404 for GET/POST på de fire gamle adressene. `/api/utovere` og `/api/felles-okter` gir fortsatt 401 uten innlogging. Ingen database eller ekstern tjeneste brukes i denne rutekontrollen.

## Automatisk testdekning

| Område        | Kontroll                                                                                                                   |
| ------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Autentisering | Tilfeldig saltet scrypt, feil passord, ukjent bruker med samme feilsvar, SHA-256-oppgradering, rollenavigasjon             |
| Sesjoner      | Serveridentitet i locals, tokenhash i DB, tilbakekalling, utløp, konfigurasjonsendring, mislykket/vellykket utlogging      |
| Rollegrenser  | Ingen uautentisert API-tilgang, utøver kan ikke lese andre, trener kan lese og kan ikke opprette/redigere/slette           |
| Teknikklogger | Ekte INSERT/UPDATE/DELETE-SQL, oppdatert rad, eierfilter, 404 ved null berørte rader, felter/URL-er valideres              |
| Videoeierskap | Nye URL-er må være bekreftet og eid; SQL markerer kjente frakoblede videoer uten å slette ressurser                        |
| Faner         | Parallelle API-lesinger for to eksplisitte utøver-ID-er forstyrrer ikke hverandre                                          |
| Sheets        | Sitert CSV, dobbeltøkt, blank varighet, manglende kolonner, ugyldig dato/tid, HTML og skjemavalidering                     |
| Dato/år       | Mai–april, årsskifte, skuddår, Oslo-dato og periodegrenser                                                                 |
| Statistikk    | Økter vs. hvile, summering, månedens hele uker og sesongens tolv måneder                                                   |
| Eksterne feil | HTTP-feil, timeout, ugyldig CSV, separat statusadvarsel, leser-/målavgrenset cache og refresh                              |
| Opplasting    | Signerte parametre, trener avvises, atomisk kvote ved samtidige reservasjoner, faktisk format/størrelse og Cloudinary-feil |
| Klient-API    | Responsformat, trygg feilvisning, tidsgrense og avbrudd av gamle forespørsler                                              |
| HTTP          | Origin-sjekk, JSON-format, innholdsformat og maks forespørselsstørrelse, no-store og trygge feilsvar                       |

## Nettleser og visuell kontroll

Playwright-suiten inneholder seks scenarier kjørt for både desktop (1440×1000) og mobil (390×844): lys/mørk-modus og dialogfokus, loggoppretting/redigering/sletting, feil/retry/utlogging, utøverbytte med forsinket gammelt svar og uavhengige faner, videofremdrift/gjenbruk/avbrudd og innlogging med Enter. Den bruker appens faktiske komponenter i en isolert Vite-testvisning med syntetiske API-svar. Innloggingsserveren dekkes separat av SQL-testene; browser-fixtures erstatter den.

`npm run test:browser` ble forsøkt, men Chromium kunne ikke starte på grunn av macOS-sandboxens avvisning av MachPortRendezvous. **Ingen av de tolv Playwright-testene regnes som bestått.** Suite og testvisning er typekontrollert, men hele den automatiserte browser-suiten må kjøres i et egnet utviklings-/CI-miljø før produksjonssetting.

Som alternativ er de samme komponentene kontrollert interaktivt i Codex sin innebygde nettleser med helt syntetiske data. Mobil-/desktopoppsett, lys/mørk-modus, kalenderdialog, Escape/fokusretur, skjemaer og teknikkloggens oppretting/redigering/sletting er gjennomgått. Utøverbytte og to uavhengige faner, trenerens skrivefrie detaljvisning, regnearkfeil, mislykket utlogging samt filvis/samlet videofremdrift og avbrudd er også kontrollert med lokale fixtures. Den konkrete redigeringsfeilen er kontrollert: detaljvisningen viser den oppdaterte raden etter lagring. Dette er ikke en pikselbasert regresjonstest mot gammel app eller en fysisk iOS-/Android-test.

## Krever eksterne tjenester og separate tiltak

Neon-transport/produksjonsskjema, Google Sheets-deling/reelle CSV-eksporter/Apps Script-faner, Cloudinary-preset, Admin API-kvoter og eksisterende videolevering er ikke verifisert mot produksjon. Servermodulene er testet med syntetisk SQL og mockede eksterne svar. Ingen produksjonsdata, passordkonfigurasjon, presets eller ressurser er endret.

Før utrulling: følg `ROLLOUT.md` og `EXTERNAL_SERVICES.md`, test på separat Neon-gren og eget Cloudinary-/Google-testoppsett, kjør browser-suiten og prøv på fysisk mobil/skjermleser. Teksting av videoer med tale krever separate transkripter. Den opprinnelige graden av offentlig tilgjengelighet til Sheets-/Cloudinary-lenker beholdes inntil eksterne rettigheter endres bevisst.
