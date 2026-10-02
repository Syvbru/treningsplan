# Utrulling og tilbakeføring

Ingen av tiltakene her er kjørt mot produksjon under refaktoreringen. SQL kjøres manuelt. Apps Script, Google-regneark og Cloudinary-preset ligger utenfor repositoryet.

## Før utrulling

1. Opprett en separat Neon-gren/testdatabase. Kontroller at dagens `teknikk_logger` har `id`, `user_key_hash`, `dato`, `stilart`, `tilbakemelding`, `video_urls text[]` og `created_at`. Ta sikkerhetskopi. Bruk samme utøver-ID-er som før: SHA-256 av brukernavn med små bokstaver. Flytt ingen eksisterende logger.
2. Kjør `migrations/001_auth_and_uploads.sql` først på testgrenen. Den oppretter bare nye tabeller og indekser. Den endrer eller sletter ingen eksisterende trenings-/teknikkdata. Test så med egne syntetiske brukere. Det følger ingen automatisk migrering ved oppstart eller bygging.
3. Legg inn `AUTH_RATE_LIMIT_SECRET` som en tilfeldig verdi med minst 32 bytes entropi, og de private Cloudinary-variablene i `.env.example`. Flytt cloud name og preset fra `PUBLIC_CLOUDINARY_*` til `CLOUDINARY_*`. Ingen hemmeligheter skal ha `PUBLIC_`-prefiks. `POSTGRES_URL` må være satt. Appen trenger serverkjøring, som før; den kan ikke publiseres som et statisk nettsted.
4. Kontroller Google Sheets-eksporter og Apps Script på testdata. Se formatet i README. Sørg for at identitet/navn, eksportadresse og redigeringsadresse fortsatt er korrekte. Apps Script må fortsatt oppdatere kilde- og fellesøktark. Ingen scriptendring er automatisk utført. De gamle admin-/kompatibilitetsrutene er fjernet; eventuelle eksterne klienter må bruke `/api/utovere`, `/api/plan` og `/api/felles-okter`, samt det nye responsformatet. Utøvervalg gjøres via `/trener/utovere/[utoverId]`.
5. Konfigurer signert Cloudinary-preset og test opplasting, metadatahenting og eksisterende videolenker i staging. Se `EXTERNAL_SERVICES.md`.
6. Kjør alle kvalitetskontroller, inkludert nettlesertester, i et miljø som kan starte Chromium. Gjør en gjennomgang på fysisk mobil og med skjermleser. Kontroller spesielt egne/andres logger og trenerens direkte API-kall.
7. Kjør den additive SQL-migreringen mot produksjon **før** en separat, godkjent deploy. Ikke deploy denne versjonen før migrering og miljøvariabler er klare. Denne oppgaven omfatter ingen deploy.

## Passordmigrering uten tap av tilgang

`USER_CREDENTIALS` og adminvariablene beholdes som identitetsregister. De eksisterende SHA-256-passordhashene fungerer ved første innlogging. Etter korrekt passord lagres en tilfeldig saltet scrypt-hash i `auth_passwords` (`N=32768`, `r=8`, `p=1`, 64-byte nøkkel). På senere innlogging brukes denne hashen. Ukjente brukere og feil passord får samme melding og begge utfører kostbar passordavledning. Ingen klartekstpassord lagres eller logges.

`credential_source` er et fingeravtrykk av den konfigurerte passordhashen. Ved endring i passordkonfigurasjonen blir gamle oppgraderinger ignorert og gamle sesjoner ugyldige. Dette gir også en måte å tilbakestille passord på for den ene gruppen. Scrypt-strenger kan brukes direkte i `USER_CREDENTIALS.hash` og `ADMIN_PASSWORD_HASH`; da trengs ingen SHA-256-mellomstasjon.

Etter at brukerne er migrert, kan drift lese de oppgraderte hashene fra `auth_passwords` med begrenset administratortilgang og erstatte SHA-256-verdiene i hemmelig konfigurasjon. Ikke legg hashene i Git eller del dem i logger. Endring av kildeverdien ugyldiggjør aktive sesjoner; informer brukerne om ny innlogging. Ikke fjern identitetsregisteret. Brukere som ikke har logget inn, beholder SHA-256-fallback inntil de migrerer eller får passord tilbakestilt. Dermed blir ikke alle eksisterende hasher umiddelbart beskyttet mot et eventuelt lekket miljø; sluttfør denne eksterne oppryddingen etter innloggingsperioden.

## Sesjoner og innloggingsforsøk

- Tilfeldig 256-bit sesjonstoken i `training_session`, `HttpOnly`, `SameSite=Strict`, `Secure` i produksjon. Databasen lagrer bare SHA-256 av tokenet.
- Absolutt utløp etter **7 dager**, uten automatisk forlengelse. Rolle og registrert bruker avgjøres på serveren for hver forespørsel, ikke fra et gammelt JWT-krav.
- `auth_token`, `last_search_hash` og `last_search_name` fjernes. Eksisterende 365-dagers JWT-er godtas ikke; brukerne må logge inn på nytt, men beholder passord og logger.
- Utlogging tilbakekaller den aktuelle sesjonen i databasen før cookie slettes. Ved databasefeil vises feil; UI hevder ikke at utlogging lyktes. Andre enheter beholder sine egne sesjoner.
- Drift kan tilbakekalle alle sesjoner for en bruker ved å sette `revoked_at` i `auth_sessions` for riktig `user_id`. Ved fjerning av bruker fra registeret slutter sesjonene straks å virke.
- Atomiske, delte innloggingsbøtter i databasen: maks 10 forsøk per brukernavn og 30 per IP innen et fast vindu på 15 minutter. Både riktige og gale forsøk telles. HMAC hindrer lagring av rå IP-er/brukernavn. Vinduet begynner ved første forsøk. Ikke stol på klientstyrte proxy-headere; kontroller at hostingens `getClientAddress()` er korrekt. Edge-begrensning før appen anbefales ved eksponering for mer trafikk.
- API-endringer krever samme `Origin` som appen. Klienter uten Origin må oppdateres; ikke slå av sjekken for å gjøre en ekstern klient kompatibel.
- Avtal vedlikehold av sesjons-/forsøkstabellene utenfor denne appen. Utgåtte/tilbakekalte sesjoner kan fjernes etter valgt revisjonsperiode, og gamle innloggingsbøtter etter f.eks. ett døgn. Sletting kjøres ikke automatisk her.

## Tilbakeføring

Behold forrige kodeversjon og gammel miljøkonfigurasjon før utrulling. Ved feil: gå tilbake til den versjonen og behold de nye tabellene til hendelsen er avklart. De er additive og forstyrrer ikke gammel kode. Ikke slett `teknikk_logger` eller Cloudinary-ressurser. Nye teknikklogger ligger i samme tabell og er fortsatt lesbare fra gammel app.

Den gamle versjonen bruker svakere SHA-256/JWT-tilgang. En tilbakeføring gjeninnfører disse svakhetene; begrens derfor varigheten. Brukere må logge inn igjen med den sesjonsmodellen som kjører. Hvis gamle SHA-256-hasher er erstattet med scrypt i konfigurasjonen, kan gammel kode ikke bruke dem: gjenopprett den beskyttede tidligere konfigurasjonen som del av en vurdert tilbakeføring, eller rett fremover. Ikke konverter scrypt tilbake til SHA-256.

SQL-tabellene skal ikke droppes som rutinemessig tilbakeføring. De inneholder sesjonsrevisjon, passordoppgraderinger og oversikt over opplastinger. Ta sikkerhetskopi før en eventuell senere, separat opprydding. Ingen automatisk `down`-migrering er levert med destruktiv sletting.
