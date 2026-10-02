# Eksterne tjenester

## Google Sheets og Apps Script

Appen henter og validerer CSV på serveren fra `docs.google.com/spreadsheets/d/...`, med åtte sekunders tidsgrense, HTTP-statuskontroll og inntil 60 sekunders prosesslokal cache. Cache-nøkkelen inneholder både leser og målutøver. API-er og beskyttede sider svarer `private, no-store`; logger/sesjoner caches ikke. «Prøv igjen» kan gå utenom regnearkcachen. Ulik serverinstans kan ha ulik cache; Apps Scriptets 30-minutters intervall er fortsatt det som bestemmer når kilden blir oppdatert.

`/api/plan` og `/api/felles-okter` returnerer normaliserte økter, ikke eksportadresser. Den tidligere `/api/felles-okter-url` er fjernet; bruk `/api/felles-okter`. UI trenger ikke hente CSV direkte. Den eksplisitte utøver-ID-en følger hver plan-/loggforespørsel. Ruteendring monterer en ny visning, avbryter gamle lesinger og bruker en forespørselsgenerasjon for å ignorere gamle svar.

**En serverproxy gjør ikke et offentlig regneark privat.** En publisert CSV eller deling med «alle med lenken» kan fortsatt åpnes uten appens innlogging. Redigeringslenken i ressursmenyen har også Googles egne rettigheter. Trenerens lesebegrensning for teknikklogger endrer ikke Google-rettigheter.

Drift må gjennomgå publisering og deling av hvert regneark og fellesøktark. Vil dere ha faktisk private ark, må Google-rettighetene begrenses og serveren få autorisert Sheets API-tilgang (f.eks. en tjenestekonto med eksplisitt deling). Denne refaktoreringen implementerer ikke tjenestekonto/OAuth. Dagens CSV-eksporter beholdes. Ikke gjør ark private før henting med den valgte integrasjonen er testet.

Apps Script og regneark ligger utenfor repositoryet. Kontroller at scriptet fortsatt bruker riktig regneark, korrekte navn og sesongfaner, eksportkolonner og feltet for planstatus. Matching av fellesøkter beholdes som dato + lik økttekst, innen én trener og én gruppe. Det er ikke lagt inn flergruppe-/flertrenerstøtte.

## Cloudinary

Tidligere klientkode sendte usignert `upload_preset` direkte fra `PUBLIC_CLOUDINARY_*`. Den kontrollerte bare størrelse og antall i nettleseren, og `accept="video/*"` begrenset ikke tjenesten. Repositoryet inneholder **ingen presetdefinisjon eller administrasjonsnøkler**, så dagens faktiske Cloudinary-innstillinger er ikke verifisert. Ingen produksjonsressurser eller presets er endret.

Nye opplastinger krever `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_UPLOAD_PRESET`, `CLOUDINARY_API_KEY` og `CLOUDINARY_API_SECRET`. Serveren reserverer en eid opplasting og signerer kun bestemte parametre med SHA-256. `public_id` er et tilfeldig UUID under utøverens mappe; `overwrite=false`. Trener kan verken reservere eller bekrefte opplastinger. En atomisk databasebøtte begrenser hver utøver til 30 signaturreservasjoner per time. Nettleseren får signaturen og API-key som identifikator, aldri API-secret. Cloudinary-signaturens tjenestelevetid gjelder; den reserverte ID-en brukes ikke til overskriving.

Drift må i Cloudinary Console:

1. Opprette/kontrollere et **signert** preset, begrense `allowed_formats` til `mp4,mov,webm`, og kontrollere videoressurstype, mappe-/public-ID-håndtering og at ingen navnepolicy tilsidesetter den signerte ID-en.
2. Kontrollere kontogrense og kvoter for video. Cloudinarys [presetdokumentasjon](https://cloudinary.com/documentation/upload_presets) angir at det ikke finnes en filstørrelsesgrense per preset. Klientgrensen alene er utilstrekkelig. Appen sjekker deklarert størrelse før signering og **faktisk format og byteantall fra Admin API** før URL kan knyttes til logg. En manipulert klient kan likevel overføre en større fil til Cloudinary; den avvises ved bekreftelse og står til opprydding. Absolutt grense før overføring krever kontogrense eller en egen kontrollert overføringsproxy. Denne appen proxyer ikke 100 MB videofiler gjennom SvelteKit.
3. Gi servernøkkelen nødvendig tilgang til signering og lesing av videometadata. Test Admin API-feil/kvoter. Appen gir ingen slettetilgang til klienten og kaller ingen destroy-endepunkter.
4. Etter vellykket stagingtest, deaktivere det gamle usignerte presetet når ingen andre legitime klienter trenger det. Ellers er det fortsatt mulig å laste opp uten appinnlogging. Deaktivering endrer ikke eksisterende videolenker.
5. Gjennomgå tilgangen til eksisterende video-URL-er. Vanlige `video/upload`-URL-er kan leses av alle med lenken. Eierskapskontroll i appen gjør ikke selve ressurs-URL-en privat. Privat levering krever Cloudinary-tilgangstype/signerte leveringslenker og en separat migrering. Dagens produksjonsvideoer er ikke flyttet eller slettet.

Klient og server tillater maks seks URL-er per logg, MP4/MOV/WebM og 100 MB per fil. Serveren validerer dato, stilart, tekst, ID, Cloudinary-host/konto og eierskap til nye bekreftede opplastinger. Eksisterende video-URL-er kan beholdes på egen logg. Filnavn/oppgitt MIME-type regnes ikke som verifisering; Cloudinary-metadata avgjør faktisk format/størrelse.

Se også [signerte opplastinger](https://cloudinary.com/documentation/client_side_uploading) og [signaturformat](https://cloudinary.com/documentation/signatures).

## Videoer uten lagret logg

`video_uploads` opprettes **før** overføring. `pending` betyr reservert/lastet opp uten koblet logg, `attached` betyr knyttet til logg, og `abandoned` betyr avbrutt eller frakoblet. Bekreftelse sjekker faktisk ressurs i Cloudinary. Etter delvis feil beholdes bekreftede URL-er i skjemaet, og et nytt lagringsforsøk bruker dem igjen. Avbryt og fjerning av video markerer data for avstemming. UI har filvis og samlet fremdrift, avbrudd og tidsgrenser.

Hvis fanen lukkes, nettverket feiler eller klienten forsvinner før bekreftelse/lagring, blir reservasjonen stående. En usikker lagringsrespons kan bety at serveren allerede har lagret loggen; sjekk logglisten før nytt forsøk. Rå opplastinger slettes aldri automatisk her. Det gjelder også ved sletting av teknikklogg. Nye SQL-operasjoner markerer kjente tilhørende opplastinger som `abandoned`; gamle ressurser uten upload-record må avstemmes via loggenes URL-er.

Avtal en ekstern oppryddingsjobb: vurder bare `pending`/`abandoned` eldre enn f.eks. 24 timer, slå opp den reserverte `public_id`-en i Cloudinary og kontroller **alle** `teknikk_logger.video_urls` før eventuell sletting. Ikke baser sletting bare på state/log_id; samtidige eller avbrutte forespørsler kan gi avvik. Begynn med rapport uten sletting, og godkjenn selve oppryddingen separat. Behold rapport/revisjon. Ingen slik jobb er kjørt i denne oppgaven.
