<script lang="ts">
    import {tick } from 'svelte';
    import Papa from "papaparse";
    import {
        parse,
        format,
        startOfDay,
        addDays,
        subDays,
        addMonths,
        subMonths,
        startOfMonth,
        endOfMonth,
        getDay,
        isSameDay,
        parseISO,
        isWithinInterval,
    } from "date-fns";
    import { nb } from "date-fns/locale";
    import {
        Calendar,
        LineChart,
        ChevronLeft,
        ChevronRight,
        Clock,
        Zap,
        Dumbbell,
        BookOpen,
        Timer,
        Heart,
        BatteryCharging,
        User,
        Lock,
        ChevronDown,
        ChevronUp,
        Users,
    } from "lucide-svelte";

    // Brukerdefinisjoner for innlogging og filnavn
    const USER_CREDENTIALS: Record<string, { hash: string; file: string }> = {
        "73c16a202d2b86fcfdc37dd70ff565719156493d9e2c4ef6ea752a4ebea3fb3c": {
            hash: "c9d3b957642e236fd916483d1481ec5522b8b9acd44f6455da891d6721806ee3",
            file: "Eple.csv",
        },
        a6fc525d7fa299d869b8ab2c88f23a7628a6e8a788b9152066b7b6429049e951: {
            hash: "92f7bd60b336dfe3a254266037f31c6cc146e94140ac462614331e970c3135bc",
            file: "Pære.csv",
        },
        "9d486bcfeef9ef6ef45ae8f1d67f63fcb0fec64581a67edbc59b4160b28f52a4": {
            hash: "d909e383f245da1570025ce692d2f50eabc0c316d4a932a3fa5d013b54a0612c",
            file: "Appelsin.csv",
        },
        "52f5d96fa7defd7bcc670a4e94584bdcf799aadda0b5fe0fb399d2942290f8cb": {
            hash: "52c3c48ddb9239c32e2863295ae2a346df21062f23edb6a23adbea4742026730",
            file: "Banan.csv",
        },
        bdb31133df3ef9606d5cd15be403c7d2a3b93ee37954fae4f0c73d8bb390402e: {
            hash: "19f66012993b9e164bfe692ece9b6d38b50b06c173ae3cea2645b65590e38ccb",
            file: "Plomme.csv",
        },
        "3521ecc80114799253f9c11590417a44fe12e4f7664beea74665fd1d6be1dfbc": {
            hash: "78cb4ae6333525a2da653d975e352243a051a1fcfd21b7b97aeb8582eaa11605",
            file: "Kirseær.csv",
        },
        "8fbb21f6c4271e9ebd5f59095b576e30d1859278d2b0b4688c2b89060ee788df": {
            hash: "5a2e47eec0de18abbb9b705a39eaaf2177047db41297a09202ea31889e3c545c",
            file: "Jordbær.csv",
        },
        "8bbae86e930057698e451b4e7c50411077d0eba4f60d72c6ac93ad4ece44e183": {
            hash: "f4b73b7da041a26825d9d5566b468b1cf2333e55fa0051ab76e05777962cfe33",
            file: "Blåbær.csv",
        },
        "99d9d8db45cd4afad1a4995074e31ee38c79b4becc138315d0a4c0777c389978": {
            hash: "bef3523a54f1204786583e293d63b0d2ad8eccf8333ea0b8a87463c07702ec85",
            file: "Bringebær.csv",
        },
        "7f118f9cc2961f740bdd1922031a59a9b9c981aff5a676c85d1a1be7c4ff7ff5": {
            hash: "2ca56d9ee5e758a4c77eaf7884f277a362e3084a331dbee87b8dd1abf8e3ec17",
            file: "Solbær.csv",
        },
        "66942cd1be80acc6f083e3bc63022d7267b9ae4c2e34e3a667774297a3f21d1d": {
            hash: "6c093fed42ee8dc35b15547694c5b18c2eb578f39a660ff2ce04189889952aa4",
            file: "Rips.csv",
        },
        "412437af1223b40770c9cb7a14f23c7ad8bad1fa9541518ccc830e958e9e6de4": {
            hash: "d4b3ab3fa2f4c9dcb45a3a5ce6586ceae6b33b667843678c5b81ebd834c4225f",
            file: "Fersken.csv",
        },
        fbe0c7642bb213eb87a4ef86f38541bda95179173d0290af8b2ec615f11faae4: {
            hash: "072ed2a333645f10eca78200ab476b5d62bee0a82cb82f2a5abae701828598c3",
            file: "Aprikos.csv",
        },
        "44a777ead2a1f80d572dddcc84dbea75cd7c4e4ba08afab53c324a325ca6c17b": {
            hash: "2c9aadacad017c35b9c5395b7e9cf8bcce8d726f2c1cc37f1540f997a72f79f4",
            file: "Druer.csv",
        },
    };

    // Admin bruker
    const ADMIN_USER = {
        usernameHash: "986193bec6464a05ece11907bbd5197d9644e65303fccf1f4b44a26b721ea84b",
        passwordHash: "5b44c7e51a1ced96857901979f29bb492dce4c20d06343e5e6be3f5779660c15",
    };

    // Login State
    let username = "";
    let password = "";
    let loggedIn = false;
    let loginError = "";
    let isLoading = false;
    let isAdmin = false;
    let currentUtoverNavn = "";
    
    const USER_KEY_STORAGE = "userKey";
    const USERNAME_STORAGE = "savedUsername";
    const ADMIN_FLAG_STORAGE = "isAdmin";
    const SELECTED_USER_STORAGE = "selectedAdminUser";
    
    // Felles økter data
    let fellesOkter: Array<{dato: string, okt: string, utovere: string[]}> = [];
    let expandedDates = new Set<string>();

    // Initial State Check og Auto-Login
    if (typeof window !== "undefined") {
        const persistedKey = localStorage.getItem(USER_KEY_STORAGE);
        const savedUsername = localStorage.getItem(USERNAME_STORAGE);
        const persistedAdmin = localStorage.getItem(ADMIN_FLAG_STORAGE) === "true";
        const persistedSelectedUser = localStorage.getItem(SELECTED_USER_STORAGE);
        
        if (persistedAdmin && persistedSelectedUser) {
            // Admin med valgt bruker
            isAdmin = true;
            loggedIn = true;
            currentUtoverNavn = persistedSelectedUser;
            
            if (savedUsername) {
                username = savedUsername;
            }

            const nameHash = sha256Sync(persistedSelectedUser.toLowerCase());
            const user = USER_CREDENTIALS[nameHash];
            
            if (user) {
                isLoading = true;
                Promise.all([
                    loadWorkoutPlan(user.file),
                    loadFellesOkter()
                ])
                .then(async () => {
                    isLoading = false;
                    const finalView = view; 
                    const tempView = (finalView === VIEWS.OVERVIEW) 
                        ? VIEWS.CALENDAR 
                        : VIEWS.OVERVIEW;
                    view = tempView; 
                    await tick();
                    view = finalView; 
                    await tick();
                    goToToday(); 
                })
                .catch(() => {
                    isLoading = false;
                    loginError = "Kunne ikke laste treningsdata.";
                });
            }
        } else if (persistedKey && USER_CREDENTIALS[persistedKey]) {
            // Vanlig bruker
            const user = USER_CREDENTIALS[persistedKey];
            loggedIn = true;
            
            if (savedUsername) {
                username = savedUsername;
            }

            isLoading = true;
            Promise.all([
                loadWorkoutPlan(user.file),
                loadFellesOkter()
            ])
            .then(async () => {
                isLoading = false;
                const finalView = view; 
                const tempView = (finalView === VIEWS.OVERVIEW) 
                    ? VIEWS.CALENDAR 
                    : VIEWS.OVERVIEW;
                view = tempView; 
                await tick();
                view = finalView; 
                await tick();
                goToToday(); 
            })
            .catch(() => {
                isLoading = false;
                loginError = "Kunne ikke laste treningsdata.";
            });
        }
    }

    // SHA-256 IMPLEMENTASJON
    function sha256Sync(s: string): string {
        const K = [
            0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b,
            0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01,
            0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7,
            0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
            0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152,
            0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
            0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc,
            0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
            0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819,
            0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08,
            0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f,
            0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
            0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
        ];
        let H = [
            0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f,
            0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
        ];

        const utf8 = new TextEncoder().encode(s);
        let m: number[] = [];
        for (let i = 0; i < utf8.length; i++) {
            m[i >>> 2] |= utf8[i] << (24 - (i % 4) * 8);
        }

        const mLen = utf8.length * 8;
        m[mLen >>> 5] |= 0x80 << (24 - (mLen % 32));
        m[(((mLen + 64) >>> 9) << 4) + 15] = mLen;

        for (let i = 0; i < m.length; i += 16) {
            const w = new Array(64);
            let a = H[0],
                b = H[1],
                c = H[2],
                d = H[3],
                e = H[4],
                f = H[5],
                g = H[6],
                h = H[7];

            for (let t = 0; t < 64; t++) {
                if (t < 16) {
                    w[t] = m[i + t];
                } else {
                    const s0 =
                        ((w[t - 15] >>> 7) | (w[t - 15] << 25)) ^
                        ((w[t - 15] >>> 18) | (w[t - 15] << 14)) ^
                        (w[t - 15] >>> 3);
                    const s1 =
                        ((w[t - 2] >>> 17) | (w[t - 2] << 15)) ^
                        ((w[t - 2] >>> 19) | (w[t - 2] << 13)) ^
                        (w[t - 2] >>> 10);
                    w[t] = (w[t - 16] + s0 + w[t - 7] + s1) >>> 0;
                }

                const sum1 =
                    ((e >>> 6) | (e << 26)) ^
                    ((e >>> 11) | (e << 21)) ^
                    ((e >>> 25) | (e << 7));
                const ch = (e & f) ^ (~e & g);
                const temp1 = (h + sum1 + ch + K[t] + w[t]) >>> 0;

                const sum0 =
                    ((a >>> 2) | (a << 30)) ^
                    ((a >>> 13) | (a << 19)) ^
                    ((a >>> 22) | (a << 10));
                const maj = (a & b) ^ (a & c) ^ (b & c);
                const temp2 = (sum0 + maj) >>> 0;

                h = g;
                g = f;
                f = e;
                e = (d + temp1) >>> 0;
                d = c;
                c = b;
                b = a;
                a = (temp1 + temp2) >>> 0;
            }

            H[0] = (H[0] + a) >>> 0;
            H[1] = (H[1] + b) >>> 0;
            H[2] = (H[2] + c) >>> 0;
            H[3] = (H[3] + d) >>> 0;
            H[4] = (H[4] + e) >>> 0;
            H[5] = (H[5] + f) >>> 0;
            H[6] = (H[6] + g) >>> 0;
            H[7] = (H[7] + h) >>> 0;
        }

        let result = "";
        for (let i = 0; i < H.length; i++) {
            result += (H[i] >>> 0).toString(16).padStart(8, "0");
        }
        return result;
    }

    // Hovedfunksjon for innlogging
    async function handleLogin() {
        loginError = "";
        isLoading = true;

        const plainUser = username.trim().toLowerCase();
        const userKeyHash = sha256Sync(plainUser);
        const hashedPassword = sha256Sync(password);
        
        // Sjekk om det er admin
        if (userKeyHash === ADMIN_USER.usernameHash) {
            if (hashedPassword === ADMIN_USER.passwordHash) {
                isAdmin = true;
                loggedIn = true;
                isLoading = false;
                
                if (typeof window !== "undefined") {
                    localStorage.setItem(ADMIN_FLAG_STORAGE, "true");
                    localStorage.setItem(USERNAME_STORAGE, plainUser);
                }
                return;
            } else {
                loginError = "Feil passord.";
                isLoading = false;
                return;
            }
        }
        
        // Vanlig bruker
        const user = USER_CREDENTIALS[userKeyHash];

        if (!user) {
            loginError = "Ugyldig brukernavn.";
            isLoading = false;
            return;
        }

        if (hashedPassword.length !== 64) {
            loginError = "Kryptograferingsfeil: Klarte ikke å generere gyldig passord-hash (Feil lengde på output).";
            isLoading = false;
            return;
        }

        if (hashedPassword === user.hash) {
            if (typeof window !== "undefined") {
                localStorage.setItem(USER_KEY_STORAGE, userKeyHash);
                localStorage.setItem(USERNAME_STORAGE, plainUser);
            }

            await Promise.all([
                loadWorkoutPlan(user.file),
                loadFellesOkter()
            ]);
            loggedIn = true;
            isLoading = false;
        } else {
            loginError = "Feil passord.";
            isLoading = false;
        }
    }

    // Søk etter utøver basert på navn (admin)
    async function searchUtoverByName() {
        const searchName = currentUtoverNavn.trim();
        if (!searchName) {
            loginError = "Skriv inn et navn";
            return;
        }

        loginError = "";
        isLoading = true;

        const nameHash = sha256Sync(searchName.toLowerCase());
        const user = USER_CREDENTIALS[nameHash];

        if (!user) {
            loginError = `Finner ingen utøver med navn: ${searchName}`;
            isLoading = false;
            return;
        }

        if (typeof window !== "undefined") {
            localStorage.setItem(SELECTED_USER_STORAGE, searchName);
        }

        await Promise.all([
            loadWorkoutPlan(user.file),
            loadFellesOkter()
        ]);

        isLoading = false;
        selectedDate = null;
        view = VIEWS.OVERVIEW;
    }

    // Håndterer utlogging
    function handleLogout() {
        if (typeof window !== "undefined") {
            localStorage.removeItem(USER_KEY_STORAGE);
            localStorage.removeItem(USERNAME_STORAGE);
            localStorage.removeItem(ADMIN_FLAG_STORAGE);
            localStorage.removeItem(SELECTED_USER_STORAGE);
        }

        loggedIn = false;
        username = "";
        password = "";
        loginError = "";
        isLoading = false;
        isAdmin = false;
        currentUtoverNavn = "";
        workouts = [];
        fellesOkter = [];
        expandedDates.clear();
        selectedDate = null;
        calendarCursor = startOfMonth(new Date());
        view = VIEWS.OVERVIEW;
    }

    // CSV-lasting
    async function loadWorkoutPlan(fileToLoad: string) {
        try {
            const path = `/csv/${fileToLoad}`;
            const response = await fetch(path);
            if (!response.ok) {
                loginError = `Kunne ikke laste fil: ${fileToLoad}. Sjekk at filen finnes i /static/csv/.`;
                return;
            }

            const csvText = await response.text();

            Papa.parse(csvText, {
                header: false,
                skipEmptyLines: true,
                complete: (result) => {
                    const rows = result.data as string[][];
                    if (rows.length < 2) return;

                    const header = rows[0].map((h) => h.trim().toLowerCase());
                    const parsed: Workout[] = [];

                    const idxDato = header.findIndex((h) => h.includes("dato"));
                    const idxHva1 = header.findIndex((h) => h.includes("hva økt 1"));
                    const idxTid1 = header.findIndex((h) => h === "tid");
                    const idxHva2 = header.findIndex((h) => h.includes("hva økt 2"));
                    const idxTid2 = header.findIndex((h, i) => h === "tid" && i > idxTid1);
                    const idxKommentar = header.findIndex((h) => h.includes("kommentar"));

                    for (let i = 1; i < rows.length; i++) {
                        const row = rows[i];
                        const dato = parseDate(row[idxDato]);
                        const kommentar = idxKommentar >= 0 ? (row[idxKommentar]?.trim() ?? "") : "";
                        
                        if (row[idxHva1]) {
                            parsed.push({
                                date: dato,
                                title: row[idxHva1].trim(),
                                durationMin: toMin(row[idxTid1]),
                                description: kommentar,
                            });
                        }

                        if (idxHva2 >= 0 && row[idxHva2]) {
                            const tid2 = idxTid2 >= 0 ? row[idxTid2] : "";
                            parsed.push({
                                date: dato,
                                title: row[idxHva2].trim(),
                                durationMin: toMin(tid2),
                                description: kommentar,
                            });
                        }
                    }

                    workouts = parsed.filter((w) => w.date);
                },
            });
        } catch (e) {
            console.error("Feil ved lasting av plan:", e);
            loginError = "En uventet feil oppstod under lasting av treningsplanen.";
        }
    }

    // Last inn felles økter CSV
    async function loadFellesOkter() {
        try {
            const response = await fetch('/csv/felles_økter.csv');
            if (!response.ok) {
                console.warn('Kunne ikke laste felles_økter.csv');
                return;
            }

            const csvText = await response.text();
            
            Papa.parse(csvText, {
                header: true,
                skipEmptyLines: true,
                complete: (result) => {
                    const rows = result.data as any[];
                    const parsed: Array<{dato: string, okt: string, utovere: string[]}> = [];

                    rows.forEach((row) => {
                        const dato = row.Dato || row.dato || row.DATO;
                        const okt = row.Økt || row.økt || row.ØKT || row.Okt;
                        const utovere = row.Utøvere || row.utøvere || row.UTØVERE || row.Utovere;
                        
                        if (dato && okt && utovere) {
                            const parsedDato = parseDate(dato);
                            const utovereList = utovere
                                .split(',')
                                .map((n: string) => n.trim())
                                .filter((n: string) => n.length > 0);
                            
                            if (parsedDato && utovereList.length > 0) {
                                parsed.push({ dato: parsedDato, okt: okt.trim(), utovere: utovereList });
                            }
                        }
                    });

                    fellesOkter = parsed;
                }
            });
        } catch (e) {
            console.error('Feil ved lasting av felles økter:', e);
        }
    }

    // Hjelpefunksjon for å finne felles utøvere for en spesifikk økt
    function getFellesUtovere(date: string, sessionTitle: string): string[] {
        const currentUser = isAdmin ? currentUtoverNavn.trim() : username.trim();

        if (!currentUser || !sessionTitle) {
            return [];
        }

        const matching = fellesOkter.filter(fo => 
            fo.dato === date && 
            fo.okt.toLowerCase() === sessionTitle.toLowerCase()
        );
        
        const allUtovere = new Set<string>();
        matching.forEach((fo) => {
            const hasUser = fo.utovere.some(u => 
                u.toLowerCase() === currentUser.toLowerCase()
            );
            
            if (hasUser) {
                fo.utovere.forEach(u => {
                    if (u.toLowerCase() !== currentUser.toLowerCase()) {
                        allUtovere.add(u);
                    }
                });
            }
        });

        return Array.from(allUtovere).sort();
    }

    // Toggle funksjon for dropdown
    function toggleExpanded(date: string) {
        if (expandedDates.has(date)) {
            expandedDates.delete(date);
        } else {
            expandedDates.add(date);
        }
        expandedDates = expandedDates;
    }

    // Typer og visninger
    type Workout = {
        date: string;
        title: string;
        durationMin?: number;
        description?: string;
    };

    const VIEWS = {
        OVERVIEW: "overview",
        CALENDAR: "calendar",
    } as const;
    type View = (typeof VIEWS)[keyof typeof VIEWS];
    let view: View = VIEWS.OVERVIEW;

    let workouts: Workout[] = [];
    let today = startOfDay(new Date());
    let selectedDate: Date | null = null;
    let calendarCursor = startOfMonth(new Date());
    let windowMode: "next" | "prev" = "next";

    // Hjelpefunksjoner
    function toMin(t: string): number {
        if (!t) return 0;
        const [h, m] = t.split(":").map((x) => parseInt(x) || 0);
        return h * 60 + m;
    }

    function formatTime(mins: number): string {
        if (!mins) return "";
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        if (h > 0 && m > 0) return `${h}t ${m}min`;
        if (h > 0) return `${h}t`;
        if (m > 0) return `${m}min`;
        return "";
    }

    function getWorkoutInfo(title: string) {
        const lower = title.toLowerCase();
        if (lower.includes("intervall"))
            return {
                icon: Timer,
                color: "bg-red-100 text-red-700",
                iconBg: "bg-red-100",
                iconColor: "text-red-700",
                label: "Intervall",
                italic: false,
            };
        const isHardKeyword =
            lower.includes("motbakkeløp") ||
            lower.includes("sprintøkt") ||
            lower.includes("distanseøkt");
        const isRace = /(rennet|renn(?!forbered))/u.test(lower);
        if (isHardKeyword || isRace) {
            return {
                icon: Timer,
                color: "bg-red-100 text-red-700",
                iconBg: "bg-red-100",
                iconColor: "text-red-700",
                label: "Hardt",
                italic: false,
            };
        }

        if (lower.includes("hvile"))
            return {
                icon: BatteryCharging,
                color: "bg-green-100 text-green-800",
                iconBg: "bg-green-100",
                iconColor: "text-green-800",
                label: "Hvile",
                italic: false,
            };
        if (lower.includes("langtur"))
            return {
                icon: Heart,
                color: "bg-cyan-100 text-cyan-800",
                iconBg: "bg-cyan-100",
                iconColor: "text-cyan-800",
                label: "Langtur i1",
                italic: false,
            };
        if (lower.includes("hurtighet"))
            return {
                icon: Zap,
                color: "bg-slate-100 text-violet-600 border border-slate-200",
                label: "Hurtighet",
                italic: false,
            };
        if (lower.includes("teknikk"))
            return {
                icon: BookOpen,
                color: "bg-slate-100 text-violet-600 border border-slate-200",
                label: "Teknikk",
                italic: false,
            };
        if (lower.includes("styrke"))
            return {
                icon: Dumbbell,
                color: "bg-yellow-100 text-yellow-800",
                iconBg: "bg-yellow-100",
                iconColor: "text-yellow-800",
                label: "Styrke",
                italic: false,
            };
        if (lower.includes("rennforberedende"))
            return {
                icon: Heart,
                color: "bg-slate-100 text-violet-600 border border-slate-200",
                label: "Forberedelser",
                italic: false,
            };
        return {
            icon: Heart,
            color: "bg-slate-100 text-violet-600 border border-slate-200",
            label: "Rolig i1",
            italic: false,
        };
    }

    function parseDate(str: string) {
        if (!str) return "";
        const clean = str
            .trim()
            .replace(/(\d+)\.(\p{L}+)/u, "$1. $2")
            .toLowerCase();
        const currentYear = new Date().getFullYear();
        let parsed = parse(
            `${clean} ${currentYear}`,
            "d. MMMM yyyy",
            new Date(),
            { locale: nb },
        );
        if (isNaN(parsed.getTime())) {
            const parts = clean.split(".");
            if (parts.length >= 2) {
                const day = parts[0].padStart(2, "0");
                const month = parts[1].padStart(2, "0");
                parsed = parse(
                    `${day}.${month}.${currentYear}`,
                    "dd.MM.yyyy",
                    new Date(),
                    { locale: nb },
                );
            }
        }

        if (isNaN(parsed.getTime())) return "";
        return format(startOfDay(parsed), "yyyy-MM-dd");
    }

    function endOfDayIncl(d: Date) {
        return addDays(startOfDay(d), 1);
    }

    // Dato-logikk
    $: activeDate = selectedDate ? selectedDate : today;
    $: activeIso = format(activeDate, "yyyy-MM-dd");
    $: activeWorkouts = workouts.filter((w) => w.date === activeIso);
    $: windowDates =
        windowMode === "next"
            ? { start: addDays(activeDate, 1), end: addDays(activeDate, 7) }
            : { start: subDays(activeDate, 7), end: subDays(activeDate, 1) };

    $: windowWorkouts = workouts
        .filter((w) => {
            const d = parseISO(w.date);
            return (
                !isSameDay(d, activeDate) &&
                isWithinInterval(d, {
                    start: startOfDay(windowDates.start),
                    end: endOfDayIncl(windowDates.end),
                })
            );
        })
        .sort((a, b) => {
            return windowMode === ("prev" as typeof windowMode)
                ? b.date.localeCompare(a.date)
                : a.date.localeCompare(b.date);
        });

    // Reaktiv blokk for å sikre at felles utøvere oppdateres
    $: {
        if (username.trim() && fellesOkter.length > 0 && loggedIn) {
            expandedDates = expandedDates;
        }
    }

    // Kalender
    function changeMonth(dir: "next" | "prev") {
        calendarCursor =
            dir === "next"
                ? addMonths(calendarCursor, 1)
                : subMonths(calendarCursor, 1);
    }

    $: {
        const monthStart = startOfMonth(calendarCursor);
        const monthEnd = endOfMonth(calendarCursor);
        const startWeekday = (getDay(monthStart) + 6) % 7;
        const totalDays = monthEnd.getDate();

        days = [];
        for (let i = 0; i < startWeekday; i++) days.push(null);
        for (let d = 0; d < totalDays; d++) days.push(addDays(monthStart, d));
    }

    let days: (Date | null)[] = [];
    
    function selectDay(d: Date) {
        selectedDate = startOfDay(d);
        view = VIEWS.OVERVIEW;
    }

    function goToToday() {
        selectedDate = null;
        calendarCursor = startOfMonth(new Date());
        view = VIEWS.OVERVIEW;
    }

    function groupByDate(list: Workout[]) {
        const map = new Map<string, Workout[]>();
        list.forEach((w) => {
            if (!map.has(w.date)) map.set(w.date, []);
            map.get(w.date)!.push(w);
        });
        return Array.from(map.entries()).map(([date, sessions]) => ({
            date,
            sessions,
        }));
    }

    $: viewTransform =
        view === VIEWS.CALENDAR ? "translateX(100%)" : "translateX(0)";
    $: isCalendarView = view === VIEWS.CALENDAR;
</script>

{#if !loggedIn}
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-95 p-4">
        <div class="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl transition-all duration-500 ease-in-out transform scale-100">
            <h2 class="mb-6 text-center text-3xl font-bold text-violet-700">
                Treningsplan
            </h2>

            <div class="mb-4">
                <label for="username" class="mb-2 flex items-center text-sm font-medium text-gray-700">
                    <User class="mr-2 h-4 w-4" /> Brukernavn
                </label>
                <input
                    id="username"
                    type="text"
                    bind:value={username}
                    disabled={isLoading}
                    class="w-full rounded-xl border border-gray-300 px-4 py-3 text-lg focus:border-violet-500 focus:ring-violet-500 disabled:bg-gray-100"
                />
            </div>

            <div class="mb-6">
                <label for="password" class="mb-2 flex items-center text-sm font-medium text-gray-700">
                    <Lock class="mr-2 h-4 w-4" /> Passord
                </label>
                <input
                    id="password"
                    type="password"
                    bind:value={password}
                    disabled={isLoading}
                    on:keydown={(e) => {
                        if (e.key === "Enter") handleLogin();
                    }}
                    class="w-full rounded-xl border border-gray-300 px-4 py-3 text-lg focus:border-violet-500 focus:ring-violet-500 disabled:bg-gray-100"
                />
            </div>

            {#if loginError}
                <div class="mb-4 rounded-lg bg-red-100 p-3 text-sm font-medium text-red-700">
                    {loginError}
                </div>
            {/if}

            <button
                on:click={handleLogin}
                disabled={isLoading || !username || !password}
                class="flex w-full items-center justify-center rounded-xl bg-violet-600 px-4 py-3 text-lg font-semibold text-white shadow-md transition-colors hover:bg-violet-700 disabled:bg-violet-300"
            >
                {#if isLoading}
                    <svg class="mr-3 h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Logger inn...
                {:else}
                    Vis min plan
                {/if}
            </button>

            <p class="mt-6 text-center text-xs text-gray-500">
                Treningsdata lastes inn fra en anonymisert fil.
            </p>
        </div>
    </div>
{/if}

{#if loggedIn}
    <div class="min-h-screen bg-slate-50">
        <div class="bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white">
            <div class="mx-auto max-w-5xl px-4 py-8 flex flex-col sm:flex-row gap-4 sm:gap-0 justify-between items-start sm:items-center">
                <h1 class="text-3xl sm:text-5xl font-bold">TRENINGSPLAN</h1>

                <button
                    on:click={handleLogout}
                    class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium transition-colors flex items-center gap-1"
                >
                    <Lock class="h-4 w-4" /> Logg ut
                </button>
            </div>

            <div class="mx-auto max-w-5xl px-4 pb-6">
                {#if isAdmin}
                    <div class="mb-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center w-full">
                        <div class="flex-1 flex gap-2 w-full">
                            <input
                                type="text"
                                bind:value={currentUtoverNavn}
                                on:keydown={(e) => {
                                    if (e.key === "Enter") searchUtoverByName();
                                }}
                                placeholder="Søk etter utøvernavn..."
                                class="flex-1 rounded-xl border-0 bg-white/20 px-4 py-2 text-white placeholder-white/60 font-medium focus:bg-white/30 focus:ring-2 focus:ring-white/50"
                            />
                            <button
                                on:click={searchUtoverByName}
                                disabled={isLoading || !currentUtoverNavn.trim()}
                                class="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {#if isLoading}
                                    <svg class="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                {:else}
                                    <User class="h-4 w-4" />
                                {/if}
                                Søk
                            </button>
                        </div>
                    </div>

                    {#if loginError}
                        <div class="mb-3 rounded-lg bg-red-500/90 p-3 text-sm font-medium text-white">
                            {loginError}
                        </div>
                    {/if}
                {/if}

                <div class="flex justify-end">
                    <div class="relative flex bg-white/15 p-1 rounded-full w-[230px]">
                        <div
                            class="absolute top-1 left-1 h-[calc(100%-0.5rem)] w-[calc(50%-0.5rem)] bg-white rounded-full shadow-md transition-all duration-[700ms]"
                            style={`transform: ${viewTransform};`}
                        ></div>

                        <button
                            on:click={() => (view = VIEWS.OVERVIEW)}
                            class={`relative z-10 w-1/2 py-2 text-sm font-medium flex items-center justify-center transition-colors ${
                                view === VIEWS.OVERVIEW ? "text-violet-600" : "text-white/80 hover:text-white"
                            }`}
                        >
                            <LineChart class="h-4 w-4 mr-1" /> Oversikt
                        </button>
                        <button
                            on:click={() => (view = VIEWS.CALENDAR)}
                            class={`relative z-10 w-1/2 py-2 text-sm font-medium flex items-center justify-center transition-colors ${
                                isCalendarView ? "text-violet-600" : "text-white/80 hover:text-white"
                            }`}
                        >
                            <Calendar class="h-4 w-4 mr-1" /> Kalender
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <div class="mx-auto max-w-5xl px-4 py-6 sm:py-8">
            {#if view === VIEWS.OVERVIEW}
                <h2 class="mb-3 text-2xl font-semibold">
                    {#if selectedDate}
                        {format(selectedDate, "EEEE d. MMMM", { locale: nb })}
                    {:else}
                        I dag
                    {/if}
                </h2>
            {/if}

            {#if view === VIEWS.OVERVIEW && activeWorkouts.length > 0}
                {#each groupByDate(activeWorkouts) as g}
                    {@const isDoubleSession = g.sessions.length >= 2}
                    {@const s1Title = g.sessions[0]?.title || "Økt 1"}
                    {@const s2Title = g.sessions[1]?.title || "Økt 2"}
                    {@const fellesUtovere1 = getFellesUtovere(g.date, s1Title)}
                    {@const fellesUtovere2 = isDoubleSession ? getFellesUtovere(g.date, s2Title) : []}
                    {@const uniqueFellesUtovere = Array.from(new Set([...fellesUtovere1, ...fellesUtovere2]))}
                    {@const totalCount = uniqueFellesUtovere.length}
                    {@const isRestDay = g.sessions.some(s => s.title.toLowerCase().includes('hvile'))}
                    
                    <div class="rounded-2xl border border-violet-500 bg-white p-4 shadow-sm mb-3">
                        <div class="mb-1 grid gap-y-1">
                            {#each g.sessions as s}
                                {#key s}
                                    {#await Promise.resolve(getWorkoutInfo(s.title)) then info}
                                        <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0 w-full">
                                            <div class="flex items-stretch gap-3 w-full">
                                                <div class={`flex items-center justify-center w-12 h-12 sm:w-13 sm:h-13 rounded-xl shrink-0 ${info.iconBg ?? "bg-slate-100"}`}>
                                                    <svelte:component this={info.icon} class={`h-8 w-8 sm:h-6 sm:w-6 ${info.iconColor ?? "text-violet-600"}`} />
                                                </div>

                                                <div class="flex flex-col justify-between w-full min-w-0 h-12 sm:h-13">
                                                    <div class="text-[15px] sm:text-lg font-semibold leading-tight">
                                                        {s.title}
                                                    </div>

                                                    <div class="flex items-center flex-wrap gap-x-1 leading-none mt-[1px]">
                                                        <div class={`flex items-center px-2 py-[2px] rounded-full text-[13px] sm:text-[14px] font-medium gap-1 ${info.color} ${info.italic ? "italic" : ""}`}>
                                                            <svelte:component this={info.icon} class="h-[15px] w-[15px]" />
                                                            {info.label}
                                                        </div>

                                                        {#if s.durationMin}
                                                            <div class="flex items-center text-[13px] sm:text-[14px] text-slate-600 mt-[1px]">
                                                                <Clock class="inline h-[15px] w-[15px] mr-0.5 text-slate-500" />
                                                                {formatTime(s.durationMin)}
                                                            </div>
                                                        {/if}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    {/await}
                                {/key}
                            {/each}
                        </div>

                        <p class="text-slate-700 font-semibold text-base sm:text-lg mt-1 mb-1">
                            {format(parseISO(g.date), "EEEE d.MMMM", { locale: nb })}
                        </p>

                        {#if g.sessions[0].description}
                            <p class="mt-2 text-slate-700">
                                {g.sessions[0].description}
                            </p>
                        {/if}

                        {#if !isRestDay}
                            <button
                                on:click={() => toggleExpanded(g.date)}
                                class="mt-3 flex items-center gap-2 text-violet-600 hover:text-violet-700 font-medium text-sm transition-colors w-full"
                            >
                                <Users class="h-4 w-4" />
                                {#if totalCount > 0}
                                    {totalCount} {totalCount === 1 ? 'person har' : 'personer har'} samme økt{isDoubleSession ? 'er' : ''}
                                {:else}
                                    Finner ingen med lik økt
                                {/if}
                                {#if expandedDates.has(g.date)}
                                    <ChevronUp class="h-4 w-4 ml-auto" />
                                {:else}
                                    <ChevronDown class="h-4 w-4 ml-auto" />
                                {/if}
                            </button>
                            
                            {#if expandedDates.has(g.date)}
                                <div class="mt-2 bg-violet-50 rounded-lg p-3">
                                    {#if isDoubleSession}
                                        {#if fellesUtovere1.length > 0}
                                            <p class="text-sm font-semibold mb-2 text-slate-700">Økt 1:</p>
                                            <div class="flex flex-wrap gap-2 mb-3 pb-3 border-b border-violet-200">
                                                {#each fellesUtovere1 as utover}
                                                    <div class="bg-white px-3 py-1 rounded-full text-sm font-medium text-violet-700 border border-violet-200">
                                                        {utover}
                                                    </div>
                                                {/each}
                                            </div>
                                        {:else}
                                            <p class="text-sm font-semibold mb-2 text-slate-700">Økt 1:</p>
                                            <p class="text-sm text-slate-600 italic mb-3 pb-3 border-b border-violet-200">
                                                Ingen andre har denne økten.
                                            </p>
                                        {/if}
                                        
                                        {#if fellesUtovere2.length > 0}
                                            <p class="text-sm font-semibold mb-2 text-slate-700">Økt 2:</p>
                                            <div class="flex flex-wrap gap-2">
                                                {#each fellesUtovere2 as utover}
                                                    <div class="bg-white px-3 py-1 rounded-full text-sm font-medium text-violet-700 border border-violet-200">
                                                        {utover}
                                                    </div>
                                                {/each}
                                            </div>
                                        {:else}
                                            <p class="text-sm font-semibold mb-2 text-slate-700">Økt 2:</p>
                                            <p class="text-sm text-slate-600 italic">
                                                Ingen andre har denne økten.
                                            </p>
                                        {/if}
                                    {:else if fellesUtovere1.length > 0}
                                        <div class="flex flex-wrap gap-2">
                                            {#each fellesUtovere1 as utover}
                                                <div class="bg-white px-3 py-1 rounded-full text-sm font-medium text-violet-700 border border-violet-200">
                                                    {utover}
                                                </div>
                                            {/each}
                                        </div>
                                    {:else}
                                        <p class="text-sm text-slate-600 italic">
                                            Ingen andre har planlagt økt denne dagen.
                                        </p>
                                    {/if}
                                </div>
                            {/if}
                        {/if}
                    </div>
                {/each}
            {:else if view === VIEWS.OVERVIEW}
                <div class="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-slate-600">
                    Ingen planlagt økt for denne dagen.
                </div>
            {/if}

            {#if view === VIEWS.OVERVIEW}
                <div class="relative mt-6 flex bg-slate-200 p-1 rounded-full w-[270px]">
                    <div
                        class="absolute top-1 left-1 h-[calc(100%-0.5rem)] w-[calc(50%-0.5rem)] bg-violet-600 rounded-full shadow-sm transition-all duration-[700ms] ease-in-out"
                        style={`transform: translateX(${windowMode === "next" ? "100%" : "0"});`}
                    ></div>

                    <button
                        on:click={() => (windowMode = "prev")}
                        class={`relative z-10 w-1/2 text-sm font-medium py-2 transition-all duration-500 ${
                            windowMode === "prev" ? "text-white" : "text-slate-700 hover:text-violet-700"
                        }`}
                    >
                        7 forrige dager
                    </button>

                    <button
                        on:click={() => (windowMode = "next")}
                        class={`relative z-10 w-1/2 text-sm font-medium py-2 transition-all duration-500 ${
                            windowMode === "next" ? "text-white" : "text-slate-700 hover:text-violet-700"
                        }`}
                    >
                        7 neste dager
                    </button>
                </div>
            {/if}

            {#if view === VIEWS.OVERVIEW}
                <h3 class="mt-6 mb-2 text-xl font-semibold">
                    {windowMode === "next" ? "Kommende økter" : "Tidligere økter"}
                </h3>

                {#if windowWorkouts.length === 0}
                    <div class="border border-dashed border-slate-300 rounded-xl p-6 text-slate-600">
                        Ingen økter i valgt periode.
                    </div>
                {:else}
                    {#each groupByDate(windowWorkouts) as g}
                        {@const isDoubleSession = g.sessions.length >= 2}
                        {@const s1Title = g.sessions[0]?.title || "Økt 1"}
                        {@const s2Title = g.sessions[1]?.title || "Økt 2"}
                        {@const fellesUtovere1 = getFellesUtovere(g.date, s1Title)}
                        {@const fellesUtovere2 = isDoubleSession ? getFellesUtovere(g.date, s2Title) : []}
                        {@const uniqueFellesUtovere = Array.from(new Set([...fellesUtovere1, ...fellesUtovere2]))}
                        {@const totalCount = uniqueFellesUtovere.length}
                        {@const isRestDay = g.sessions.some(s => s.title.toLowerCase().includes('hvile'))}
                        
                        <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm mb-3">
                            <div class="mb-2 grid gap-y-3">
                                {#each g.sessions as s}
                                    {#key s}
                                        {#await Promise.resolve(getWorkoutInfo(s.title)) then info}
                                            <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0 w-full">
                                                <div class="flex items-stretch gap-3 w-full">
                                                    <div class={`flex items-center justify-center w-13 h-13 sm:w-12 sm:h-12 rounded-xl shrink-0 ${info.iconBg ?? "bg-slate-100"}`}>
                                                        <svelte:component this={info.icon} class={`h-8 w-8 sm:h-6 sm:w-6 ${info.iconColor ?? "text-violet-600"}`} />
                                                    </div>

                                                    <div class="flex flex-col justify-between w-full min-w-0 h-13 sm:h-12">
                                                        <div class="text-[15px] sm:text-lg font-semibold leading-tight">
                                                            {s.title}
                                                        </div>

                                                        <div class="flex items-center flex-wrap gap-x-1 leading-none mt-[1px]">
                                                            <div class={`flex items-center px-2 py-[2px] rounded-full text-[13px] sm:text-[14px] font-medium gap-1 ${info.color} ${info.italic ? "italic" : ""}`}>
                                                                <svelte:component this={info.icon} class="h-[15px] w-[15px]" />
                                                                {info.label}
                                                            </div>

                                                            {#if s.durationMin}
                                                                <div class="flex items-center text-[13px] sm:text-[14px] text-slate-600 mt-[1px]">
                                                                    <Clock class="inline h-[15px] w-[15px] mr-0.5 text-slate-500" />
                                                                    {formatTime(s.durationMin)}
                                                                </div>
                                                            {/if}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        {/await}
                                    {/key}
                                {/each}
                            </div>

                            <p class="text-slate-700 font-semibold text-base sm:text-lg mt-3 mb-1">
                                {format(parseISO(g.date), "EEEE d.MMMM", { locale: nb })}
                            </p>

                            {#if g.sessions[0].description}
                                <p class="mt-2 text-slate-700">
                                    {g.sessions[0].description}
                                </p>
                            {/if}

                            {#if !isRestDay}
                                <button
                                    on:click={() => toggleExpanded(g.date)}
                                    class="mt-3 flex items-center gap-2 text-violet-600 hover:text-violet-700 font-medium text-sm transition-colors w-full"
                                >
                                    <Users class="h-4 w-4" />
                                    {#if totalCount > 0}
                                        {totalCount} {totalCount === 1 ? 'person har' : 'personer har'} samme økt{isDoubleSession ? 'er' : ''}
                                    {:else}
                                        Finner ingen med lik økt
                                    {/if}
                                    {#if expandedDates.has(g.date)}
                                        <ChevronUp class="h-4 w-4 ml-auto" />
                                    {:else}
                                        <ChevronDown class="h-4 w-4 ml-auto" />
                                    {/if}
                                </button>
                                
                                {#if expandedDates.has(g.date)}
                                    <div class="mt-2 bg-violet-50 rounded-lg p-3">
                                        {#if isDoubleSession}
                                            {#if fellesUtovere1.length > 0}
                                                <p class="text-sm font-semibold mb-2 text-slate-700">Økt 1:</p>
                                                <div class="flex flex-wrap gap-2 mb-3 pb-3 border-b border-violet-200">
                                                    {#each fellesUtovere1 as utover}
                                                        <div class="bg-white px-3 py-1 rounded-full text-sm font-medium text-violet-700 border border-violet-200">
                                                            {utover}
                                                        </div>
                                                    {/each}
                                                </div>
                                            {:else}
                                                <p class="text-sm font-semibold mb-2 text-slate-700">Økt 1:</p>
                                                <p class="text-sm text-slate-600 italic mb-3 pb-3 border-b border-violet-200">
                                                    Ingen andre har denne økten.
                                                </p>
                                            {/if}
                                            
                                            {#if fellesUtovere2.length > 0}
                                                <p class="text-sm font-semibold mb-2 text-slate-700">Økt 2:</p>
                                                <div class="flex flex-wrap gap-2">
                                                    {#each fellesUtovere2 as utover}
                                                        <div class="bg-white px-3 py-1 rounded-full text-sm font-medium text-violet-700 border border-violet-200">
                                                            {utover}
                                                        </div>
                                                    {/each}
                                                </div>
                                            {:else}
                                                <p class="text-sm font-semibold mb-2 text-slate-700">Økt 2:</p>
                                                <p class="text-sm text-slate-600 italic">
                                                    Ingen andre har denne økten.
                                                </p>
                                            {/if}
                                        {:else if fellesUtovere1.length > 0}
                                            <div class="flex flex-wrap gap-2">
                                                {#each fellesUtovere1 as utover}
                                                    <div class="bg-white px-3 py-1 rounded-full text-sm font-medium text-violet-700 border border-violet-200">
                                                        {utover}
                                                    </div>
                                                {/each}
                                            </div>
                                        {:else}
                                            <p class="text-sm text-slate-600 italic">
                                                Ingen andre har planlagt økt denne dagen.
                                            </p>
                                        {/if}
                                    </div>
                                {/if}
                            {/if}
                        </div>
                    {/each}
                {/if}
            {/if}
        </div>

        {#if view === VIEWS.CALENDAR}
            <div class="mt-8 mb-12 mx-auto max-w-6xl">
                <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3 sm:gap-0">
                    <h3 class="text-2xl font-bold text-center sm:text-left">
                        {format(calendarCursor, "LLLL yyyy", { locale: nb })}
                    </h3>

                    <div class="flex justify-center sm:justify-end gap-2">
                        <button on:click={goToToday} class="border rounded-xl px-3 py-2 text-sm hover:bg-violet-50">
                            I dag
                        </button>
                        <button on:click={() => changeMonth("prev")} class="border rounded-xl p-2">
                            <ChevronLeft class="h-4 w-4" />
                        </button>
                        <button on:click={() => changeMonth("next")} class="border rounded-xl p-2">
                            <ChevronRight class="h-4 w-4" />
                        </button>
                    </div>
                </div>

                <div class="grid grid-cols-7 gap-2 text-center text-sm text-slate-600">
                    {#each ["man", "tir", "ons", "tor", "fre", "lør", "søn"] as d}
                        <div>{d}</div>
                    {/each}
                </div>

                <div class="mt-2 grid grid-cols-7 gap-2">
                    {#each days as d}
                        {#if d}
                            <button
                                class={`relative rounded-xl border p-2 pt-8 text-left bg-white hover:bg-violet-50 transition-colors ${
                                    isSameDay(d, activeDate) ? "border-violet-500" : "border-slate-200"
                                }`}
                                on:click={() => selectDay(d)}
                            >
                                <div class="absolute top-1 left-1 flex items-start justify-start">
                                    <div class="hidden sm:flex w-7 h-7 rounded-full bg-violet-600 text-white text-xs font-semibold items-center justify-center shadow-sm">
                                        {format(d, "d")}
                                    </div>

                                    <div class="text-sm font-medium text-center sm:hidden">
                                        {format(d, "d")}
                                    </div>
                                </div>

                                {#await Promise.all(workouts.filter((w) => w.date === format(d, "yyyy-MM-dd")).map((w) => getWorkoutInfo(w.title))) then infos}
                                    {#if infos.length > 0}
                                        <div class="flex sm:hidden mt-1 flex-wrap gap-1">
                                            {#each infos.slice(0, 3) as info, idx (idx)}
                                                <div
                                                    class="w-3 h-3 rounded-full shadow-sm"
                                                    style={`background-color: ${
                                                        info.color.includes("bg-red-100") ? '#ff0000' :
                                                        info.color.includes("bg-yellow-100") ? '#ffff00' :
                                                        info.color.includes("bg-green-100") ? '#00ff00' :
                                                        info.color.includes("bg-cyan-100") ? '#00ffff' :
                                                        '#f9eeff'
                                                    };`}
                                                ></div>
                                            {/each}
                                            {#if infos.length > 3}
                                                <div class="w-3 h-3 rounded-full bg-slate-400 shadow-sm"></div>
                                            {/if}
                                        </div>
                                    {/if}
                                {/await}
                                
                                <div class="hidden sm:block mt-1">
                                    {#each workouts.filter((w) => w.date === format(d, "yyyy-MM-dd")).slice(0, 2) as w}
                                        {#await Promise.resolve(getWorkoutInfo(w.title)) then info}
                                            <div class={`text-xs ${info.color} px-2 py-0.5 rounded-lg mb-0.5 break-words whitespace-normal font-medium`}>
                                                {w.title}
                                            </div>
                                        {/await}
                                    {/each}
                                </div>
                            </button>
                        {:else}
                            <div></div>
                        {/if}
                    {/each}
                </div>
            </div>
        {/if}
    </div>
{/if}
