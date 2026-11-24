# TAKT Design Workbench: Bauplan Basis v1 (Chef-Architekt)

> **Herkunft:** Synthese aus 7 Ideen-Perspektiven (Produkt, Prozess, Launcher, Finanzen, Körper, Alltag, Technik) und 2 Kritiken
> (pragmatisch, Vollständigkeit) vom 24.11.2026. Rohdaten: `docs/brainstorm/*.json`, Arbeitspakete: `docs/BAUPLAN_PAKETE.json`.
> **Umsetzungsstand je Paket:** siehe `docs/BAUPLAN_STATUS.md` (wird bei jeder Übergabe aktualisiert).
> **Abweichung vom Bauplan (bewusst):** Entscheidungsrunden mit Zeitbox und Rundenlimit wurden schlank umgesetzt (Abschnitt 12 hielt sie
> für Overhead) – sie sind das Hauptmittel gegen endlose Designrunden und kosten in der Bedienung nur einen Klick.



Stand: 24.11.2026. Grundlage: verifizierter Code-Stand (Commit d0ed375 „Workbench V2“), sieben Ideen-Perspektiven und zwei Kritiken. Alles hier ist lokal ohne Backend baubar (Node 22, Chromium/Playwright, kein Flutter-SDK).

## 0. Verifizierter Ist-Stand und Korrekturen gegenüber den Ideen

Die Aufgabenbeschreibung nennt 12 Module und 60 Features. Der Code ist weiter. Das gilt als Ausgangslage:

- Seed: 16 Module, 60 Features, 57 Varianten. Neue Module habits, savings, nutrition, system sind leere Platzhalter (je 2 Zeilen). Richtungen: kompakt 22, fokus 13, visuell 8, ohne Richtung 14. Navigationsregeln mit `to`: 0. `homeFeatureId`: bei keinem Modul gesetzt. Nur 3 von 60 Features sind freigegeben-gesperrt (z. B. calendar.month, tasks.detail, weather.current).
- Schon vorhanden (nicht neu bauen, sondern erweitern): Schema v2 mit Migration, `core/directions.js` (Richtungen, LEVELS, listVersions, resolveVariant, versionCoverage, moduleHome), `launcher.html` mit `launcher.js` (Versionskarten, Rahmen, gekoppelte Navigation, Bewertung, QR, PWA-Grundgerüst), AppPlayer in `preview/runtime.js` (Stapel, Zurück, Skizzen-Screens, Weltzustand), `buildAppPayload`, Welt-Dateien persona/organisation/finance, `finmath.js` mit 18 Referenztests, `legal-notice`, `money()/percent()` mit Privatsphäre-Modus, Spezifikation (`spec.js`) und Dart-Tokens (`flutter.js`), Server mit `/api/network` und `/api/feedback`, `docs/WORKER_BRIEF.md`.
- Echte Lücken: keine History/Deep-Links, kein Stapel je Modul, kein `carry` für Parameter, kein Safe-Area, `slice(0,12)` und 4 Slots in der Navigation, Suche und Glocke sind Attrappen, UI_STATES nur 4, keine Szenarien, Welt wird in den Zustand kopiert (Größe, veraltet nach Seed-Änderungen), kein Seed-Patch für Bestehendes, Library in Node nicht ladbar (preact), keine Unit-Tests, QA-Probe ohne A11y/Format/Legal, Entscheidungsmodell flach, Feedback-Schema flach ohne PIN/Rate-Limit.
- Korrekturen: SCHEMA_VERSION ist bereits 2, der nächste Schritt ist 3. Die Richtungen heißen kompakt/visuell/fokus (kein „Produktiv“). „Ebene“ bleibt die Entscheidungsebene (LEVELS: App, Modul, Feature, Komponente), die Roadmap heißt „Ausbaustufe“ (Modulfeld `stage` 1 bis 4) und die Ausführung „Phase“. Sparpläne sind ein eigenes Modul (Plan-Tracker, keine Ausführung beim Broker). Die Einkaufsliste gehört dem Modul „Einkauf & Haushalt“, nicht der Ernährung.

## 1. Zielbild

Der Nutzer will: mehrere App-Versionen auf Laptop und Handy ansehen, eine entscheiden, dann Modul für Modul, Ebene für Ebene vertiefen, bis zur bestmöglichen Qualität, inklusive Finanzen, Trading, Sparpläne, Wetter, Ernährung, Fitness. „Basis v1“ ist erreicht, wenn (Abnahme in Abschnitt 11):
1. alle 19 Module im Launcher erreichbar und bedienbar sind (Startseite, Navigation, Skizzen statt Sackgassen),
2. drei Versionen strukturell unterscheidbar sind und eine ehrliche Abdeckung zeigen,
3. alle Module aus einer Datenwelt sprechen (Konsistenz-Invarianten grün),
4. sechs Fachmodule je einen polierten Kernschnitt haben,
5. Entscheidung, Protokoll, Rückkanal und Sperre end-to-end funktionieren,
6. `npm run verify` grün ist und ein Gerätetest-Protokoll existiert.

## 2. Leitprinzipien

1. Erweitern statt ersetzen: deklarative Varianten, Registry, Store-Actions, Seed-Manifeste, Preview-Iframe, Sperrlogik bleiben.
2. Eine Wahrheit je Ding: eine Welt (`seed/world/`), eine Formatierung (`lib/format.js`), eine Auflösung der Variante (`resolveDesign`), eine Navigationsquelle (`interaction.to/carry`), ein Rückkanal (`/api/feedback`).
3. Nichts Sichtbares ohne Funktion oder Kennzeichnung: Suche, Glocke, Mehr sind funktionsfähig oder sichtbar als „noch nicht entworfen“ gesperrt. Skizzen sind gekennzeichnet und zählen in der Abdeckung nicht als eigene Variante.
4. Ehrliche Vergleiche: Eine Richtung ist erst entscheidbar, wenn die Tier-1-Abdeckung mindestens 60 % eigene Varianten erreicht.
5. Ownership: jedes Datenobjekt hat genau ein Eigentümer-Modul (Abschnitt 5.13). Andere verlinken oder zeigen es an.
6. Leitplanken vor Design (Gesundheit, Finanzen, Texte), weil sie jede Variante prägen.
7. Prüfbar: jede neue Fähigkeit bekommt Test, Check-Regel oder Probe-Prüfung. Reiner Browser-Test nur, wo nötig.
8. Rückfall: neue Runtime-Pfade laufen hinter denselben Payload-Optionen, alter Pfad bleibt per URL-Parameter `legacy=1` bis zur Abnahme erreichbar.

## 3. Ebenenmodell, Ausbaustufen, Tier

Entscheidungsebenen (vererben nach unten, Ausnahmen mit Grund):
- Ebene 0 App: Richtung, Shell, Favoriten, Querschnittsmuster.
- Ebene 1 Modul: Startseite, Informationsarchitektur, Modulrichtung, Datenquelle, Offline.
- Ebene 2 Feature: Variante je Screen.
- Ebene 3 Komponente: Bausteine abnehmen (nur Notizen/Version, keine eigene Abnahmeseite in Basis v1).
- Querschnittsmuster (level `pattern`): Navigation, Löschen mit Rückgängig, Leerzustand-Ton, Anrede, Offline, Gesten. Sie werden einmal entschieden und als Checkliste an Features gehängt.

Rangfolge `resolveDesign`: Feature-Pin mit Pflichtgrund (`variantPolicy: pinned`) vor Modul-Richtung (`module.directionId`) vor App-Richtung (`app.directionId`) vor Arbeitsstand (`selectedVariantId`). „Meine Auswahl“ (`mix`) ist genau diese Auflösung als Version. Freigabe-Snapshots werden nie verändert, Richtungswechsel markiert betroffene freigegebene Features nur als „Vererbung geändert“.

Ausbaustufen (Roadmap, Modulfeld `stage`): 1 Fundament und Querschnitt (system, settings, home), 2 Kern-Alltag (calendar, tasks, notes, weather, habits, goals), 3 Lebensbereiche (fitness, nutrition, finance, savings, shopping), 4 Business und Wissen (sales, trading, documents, knowledge, picture-to-text). Eine Stufe gilt als fertig, wenn alle Tier-1-Features freigegeben sind. Die nächste darf starten, die Abhängigkeit bleibt sichtbar.

Tier je Feature (`tier` 1 bis 3, `usage` täglich/wöchentlich/selten): Tier 1 braucht bis zu drei Richtungsvarianten, Szenario-Prüfung und Gerätetest. Tier 2 braucht eine bis zwei Varianten. Tier 3 darf Skizze oder Standardmuster der Richtung bleiben. Damit werden aus rund 110 Features etwa 30 echte Entscheidungen.

## 4. Launcher-Konzept (zentrales Element)

Technik (ADR-001): HTML/PWA auf der vorhandenen Preview-Runtime. Gründe: kein Flutter-SDK, (damals 45+, heute 296) Komponenten und Tokens wiederverwendbar, mit Playwright prüfbar, auf Handy und Laptop identisch. Verworfen: Flutter Web (alle Komponenten doppelt, Varianten-Mechanik verloren), Electron/Tauri (löst nur den Laptop), Capacitor/TWA (später als APK-Hülle um dieselbe Seite, Hausaufgabe). Bekannte Schwächen (Scroll-Physik, Ripple, Haptik, Schrift) werden in der Spezifikation je Komponente vermerkt. Über http im LAN gibt es keinen Secure Context und damit keinen Service Worker. Der Launcher erklärt das offen (Weg: `adb reverse tcp:4317 tcp:4317` und `http://localhost:4317`, später statischer HTTPS-Export).

Versionen (Zwei-Achsen-Modell):
- Richtung = Variantentag plus Dichte/Radius-Tokens (`DIRECTION_TOKENS` in tokens.js, Klasse `tk-dir-<id>` auf html) plus `componentPresets` für Fallbacks. Themes bleiben reine Farbe.
- Shell = `tabs` (Bottom-Navigation mit 4 Favoriten und „Mehr“, Standard von Kompakt), `launchpad` (Startbildschirm ist ein Raster der Module mit Live-Kennzahlen aus der Welt, Standard von Visuell), `fokus` (Tab „Heute“, zentraler Erfassen-Knopf, Module per Sheet, Standard von Fokus). Ein Versions-URL-Parameter `shell=` überschreibt.
- Versionsliste: Arbeitsstand, Kompakt, Visuell, Fokus, Meine Auswahl (`mix`), Freigegeben, Pseudoversion `pin:<feature>:<variante>` („In App ansehen“ aus dem Studio).

Bedienung Laptop: Werkzeugleiste (Version, Gerät, Hoch/Quer, Theme, Zustand, Szenario, Tageszeit-Station 07:30/12:30/18:30, Offline, Privatmodus, Schrift 100/130/200 %, Synchron-Schalter, Vollbild F, Touch-Anzeige), Bühne mit 1 bis 3 Rahmen (gleiche Version in zwei Geräten möglich), rechts das Entscheidungspanel. Taste 1/2/3 wechselt die Version, T Theme, R drehen.
Bedienung Handy: Startseite mit Versionskarten (Name, Claim, Tier-1-Abdeckung, Stand), nach „Öffnen“ bildschirmfüllende App ohne Rahmen. Ein halbtransparenter Demo-Griff am Rand öffnet das Umschaltblatt (Version, Szenario, Theme, Reset). Versionswechsel behält die Route, wenn der Screen in der Zielversion existiert, sonst Modul-Startseite. Browser-Zurück läuft über die App-History.
Entscheidungspanel: Favorit, 1 bis 5 Sterne, fünf Kriterien (Zeit bis zur Aktion, Einhandbedienung, Übersicht, Ruhe/Dichte, Eignung für 20+ Module, ohne Gewichtung), Kommentar, „Diese Version nehmen“ mit Pflichtbegründung und akzeptierten Nachteilen. Auf dem Laptop (Workbench-Kontext) erzeugt es direkt die Entscheidung über `actions.applyDirection`. Auf dem Handy entsteht nur ein Feedback-Eintrag, der in der Workbench unter „Eingang“ übernommen, verworfen oder vertagt wird.
Abdeckung: Matrix Modul mal Richtung (eigen, Ersatz, Skizze), Ersatz-Marker im Frame (nur im Entscheidungsmodus), Warnung unter 60 % Tier-1-Abdeckung vor „Richtung wählen“, Link ins Design Studio zum Anlegen der fehlenden Variante.
Teilen: QR-Dialog mit Netzwerkdiagnose (an 127.0.0.1 gebunden? Firewall privates Netz, gleiches WLAN, VPN), PIN im Link, Erreichbarkeits-Probe `/api/ping`, Stand-Stempel (Revision, Seed-Version, Build) in jedem Feedback.

## 5. Verbindliche Verträge (Infrastruktur, vor den Modul-Paketen)

### 5.1 Version und Auflösung (INF-3)
`listVersions(state)` liefert arbeitsstand, `dir:<id>` je Richtung, `mix`, freigabe und akzeptiert `pin:<fid>:<vid>`. `resolveDesign(state, feature, versionId)` gibt `{variant, demoData, source, reason}` zurück mit source in `feature-pin | modul | app | direction | selected | freigabe | fallback | none`. `resolveVariant` bleibt als Wrapper. `versionCoverage(state, versionId, {moduleId})` liefert zusätzlich `tier1: {total, own, ratio}`. `decisionReady(state, directionId)` ist wahr bei Tier-1-Quote ab 0,6.

### 5.2 Schema v3 und Migration (INF-3)
Neue Felder, alle mit Defaults, keine Pflege nötig:
- Modul: `stage` (1 bis 4), `dataSource`, `offline`, `legal` (Liste aus `simulation | keine-beratung | modellrechnung | steuer | kursdaten | krypto | gesundheit`), `assumption` (bool).
- Feature: `tier`, `usage`, `variantPolicy`, `pinReason`, `seedRev`, `seedHash`, `scenarios` (Datenüberlagerung je Feature, optional), `compareRounds` (Zähler).
- Interaktion: `to` (Feature-ID oder `module:<id>`), `carry` (Objekt `{ui-Schlüssel: detail-Schlüssel}`, z. B. `{selectedId:'id'}`).
- Entscheidung v2: `level` (`app | module | feature | component | pattern`), `question`, `options[]` (`{id,label,variantId?,directionId?,note?}`), `chosen`, `recommendation {optionId,reasons[],by}`, `reversibility` (`leicht | aufwendig | unumkehrbar`), `evidence[]`, `revisitAt`, `revisitIf`, `supersedes`, `decidedBy`, Status zusätzlich `parked`. `selectVariant` und `applyDirection` erzeugen immer einen Eintrag.
- App: `shell`, `directionId`, `favorites` (Reihenfolge, Navigation nutzt die ersten 4), `startFeatureId`.
- Einstellungen: `scenario`, `launcherDevice`, `qaEnv`.
- `UI_STATES` zusätzlich `firstrun`, `denied`, `stress`. Offline, Veraltet, Privatmodus, Schrift, Theme sind Umgebungsschalter (`env`), keine Zustände.
- Die Welt wird nicht mehr im Zustand persistiert. `getWorld(state, scenarioId)` liefert `applyScenario(WORLD, id)` plus `state.worldOverrides` (standardmäßig leer). Das spart Größe und verhindert veraltete Welten nach Seed-Änderungen.
- `migrations.js`: Kette `{from,to,up}` ab 2 nach 3, migriert auch Snapshots in `versions[]` additiv (nur fehlende Felder), Backup vor Migration (Client ruft `POST /api/backups` mit Label `pre-migration-v3`). `validateState(state)` prüft IDs, Referenzen (Feature/Modul/Version/Entscheidung), Varianten-IDs, Bindungen, `to`-Ziele, unbekannte Richtungen. Es wird von `inspectImport`, beim Laden (Heilungsbericht) und von check genutzt. Freigabe-Snapshots werden nie inhaltlich geändert.

### 5.3 Navigation (INF-1 mit INF-3)
Routen: Feature-ID, `module:<id>` (generische Hub-Startseite aus Welt-Kennzahlen und Feature-Kacheln, wenn kein `homeFeatureId` oder Modul ohne Varianten), `shell:launchpad`. Hash `#/<fid>?k=v` mit `history.pushState`. Stapel je Modul: Tab-Wechsel behält den Stapel, erneutes Tippen auf den aktiven Tab geht zur Modul-Startseite, Ping-Pong A→B→A poppt statt zu wachsen. Zurück-Reihenfolge: offenes Sheet oder Dialog, dann Stapel, dann Browser-History. Rand-Wischgeste ab ≤ 20 px (dx > 70). Screen-Cache-Schlüssel enthält `versionId`. Parameter: `carry` setzt `ctx.ui[schlüssel]` am Ziel, Altverhalten (`detail.id`) bleibt. Startbefehle: `window.__taktPreview.{render, navigate(fid, params), back(), resetWorld(), setEnv(env), getRoute()}`.
URL-Parameter von `preview.html` im App-Modus: `app=1, version, route, params, theme, state, scenario, env=offline,stale,privacy, scale=1|1.3|1.5|2, safe=top,right,bottom,left, shell, today, legacy`.

### 5.4 Nachrichten (INF-1 und INF-4)
Runtime an Host: `ready`, `route {featureId, moduleId, params, depth, title, sketch, canBack}`, `interaction {event, detail, featureId}`, `select-block`, `world-changed {key}`. Host an Runtime (`target:'takt-preview'`): `render {payload}`, `navigate {featureId, params}`, `back`, `env {offline,stale,privacy,scale}`, `reset-world`. Der Launcher koppelt Frames ausschließlich über diese Nachrichten.

### 5.5 Welt (INF-3, Befüllung durch die Module)
- Ein Verzeichnis `seed/world/`. Jede Datei exportiert benannte Welt-Schlüssel (Daten), optional `export const scenarios = {erststart:{key:wert}, stress:{key:wert}}` (wird aus WORLD ausgenommen und von `applyScenario` genutzt). Alle Zeiten relativ zum Referenztag Di 24.11.2026 09:30 (`DEFAULT_TODAY`) über Helfer, abgeleitete Summen werden in der Welt berechnet.
- Bindung: `demoData: { items: '@world:tasks' }`. Schreibzugriff nur über `setData` (bestehend) oder `ctx.world`.
- Summary-Vertrag je Modul (camelCase des Modul-Ids, z. B. `pictureToText`): `<m>Summary = {kpis:[{label,value,unit?,tone?,icon?,delta?,to?}]}`, `<m>Hints = [{id,text,source,module,tone,to,carry?}]`, `<m>Search = [{id,type,title,subtitle?,module,to,params?}]`, `<m>Notifications = [{id,title,text,module,tone,priority:'wichtig|normal|leise',time,to,actions?}]`. `world/index.js` aggregiert automatisch zu `allKpis` (je Modul), `allHints`, `searchIndex`, `allNotifications`. Start, Hub, Suche, Mitteilungen lesen nur diese Aggregate und hängen damit nicht von einzelnen Modul-Paketen ab.
- `prefs` (Eigentümer: settings-Welt): `{favorites, units, privacy, quietHours, textScale}`. Die Runtime nutzt `prefs.favorites` für die Navigation, falls gesetzt.
- Eigentümer-Tabelle in `docs/DATENWELT.md` (Abschnitt 5.13).

### 5.6 Zustände und Umgebung (INF-1, INF-9)
Zustände je Feature: default, empty, loading, error, firstrun (Einladung mit erster Aktion), denied (Berechtigung verweigert mit Weg zur Alternative), stress (Texte +40 %, Listen ×3 mit eindeutigen IDs, Extremwerte). Generische Darstellung durch die Runtime, Komponenten dürfen überschreiben. Umgebung: `offline` (Banner „Offline, Stand 09:15“, Schreibaktionen in Warteschlange mit Hinweis), `stale` (Stand-Badge), `privacy` (Beträge maskiert), `scale` (CSS-Variable `--tk-text-scale`), `reducedMotion`. Konflikt-Zustand bleibt Backlog.

### 5.7 Zeit, IDs, Kontext (INF-1)
`ctx.now()` (Date: in QA fest 24.11.2026 09:30, im Launcher live fortlaufend, nur wenn `ctx.live`), `ctx.today` bleibt, `ctx.newId(prefix)` (zählerbasiert, deterministisch), `ctx.world {get,set,add,reset}`, `ctx.env`, `ctx.fmt` (Format-Funktionen). Verboten in der Library: `Date.now()`, `new Date()` für „jetzt“, `Math.random()` für IDs (check meldet).

### 5.8 Formatstandard (INF-2)
`lib/format.js`: `fmtMoney(v,{cents,sign})`, `fmtPercent`, `fmtPP` („PP“ für Prozentpunkte), `fmtNumber(v,{unit,digits})`, `fmtDate`, `fmtTime`, `fmtRelativeDay`, `fmtDuration`, `fmtWeight`. de-DE, Tausenderpunkt, Dezimalkomma, geschütztes Leerzeichen vor Einheit, echtes Minus (U+2212), `tabular-nums`. Vorzeichen und Pfeilsymbol kodieren Gewinn/Verlust zusätzlich zur Farbe. `money()/percent()` in helpers.js delegieren hierher und respektieren `ctx.privacy` (gleiche Breite „••••“). `Intl.NumberFormat` und `toLocale*` nur noch in format.js (check). Primitive in ui.js: `RowButton` (Rolle, Tastatur, `aria-pressed`), `NumberStepper` (44 px, Komma-Eingabe, Dauerdruck, min/max, Einheit), `Money`. `lib/date.js` (dayStart, dayDiff, relativeTo, parseLocal). `core/recurrence.js`: `nextOccurrences(rule, from, n, {holidays})` und `describeRule(rule)` (deutscher Klartext), mindestens 15 Tests (Monatsende, Schaltjahr, Sommerzeit, nach Erledigung). `library/health/calc.js`: Grundumsatz (Mifflin-St-Jeor), Gesamtumsatz, Makros, geschätztes 1RM (Epley), exponentiell geglätteter Trend, Serie mit Joker, EAN-Prüfziffer, Atwater-Plausibilität.

### 5.9 Komponentenvertrag-Zusatz (INF-2, check durch INF-5)
Neue Komponenten tragen zusätzlich `flutter: {widget, propMap, events}` (Pflicht für neue, Hinweis für Bestand; Bestandsliste in `docs/component-baseline.json`), optional `a11y: {role, nameFrom}`, `perf: {maxItems}`, `testIds`. Datei höchstens 250 Zeilen, Hilfen in `_<bereich>.js`. Jede Aktion ruft `ctx.emit`. Tokens-only, Umlaute, Datum relativ zu `ctx.today`.

### 5.10 Seed-Patch (INF-3, Oberfläche INF-8)
Manifeste dürfen je Feature `seedRev` (Zahl) tragen. `diffSeed(state)` listet neue Features und aktualisierbare Features (Seed-Rev höher als gespeicherter Wert, Feature nicht gesperrt, `seedHash` des Live-Stands entspricht noch dem zuletzt eingespielten Seed, also vom Nutzer unverändert). `applySeedPatch(state, ids)` ersetzt Varianten, Demo-Daten, Interaktionen, Anforderungen, Akzeptanzkriterien dieser Features, schreibt Backup und Verlauf. Gesperrte Features bekommen stattdessen eine Entscheidung „Seed-Vorschlag“. Modul-Metadaten (`homeFeatureId`, `stage`, `legal`, `area`) werden ergänzt, nie überschrieben, wenn der Nutzer sie geändert hat. Im Seed selbst dürfen auch freigegebene Seed-Features angepasst werden (Snapshots entstehen beim Seed-Aufbau neu), Live-Stände schützt der Patch.

### 5.11 Feedback-Schema v2 und Server (INF-4)
Eintrag: `{id (idempotent), ts, rater, device, version, versionName, scenario, route, theme, level, target, targetName, rating (1 bis 5), criteria {zeit,einhand,uebersicht,ruhe,module20}, favorite, choose, comment, stateRev, buildId, roundId?}`. Server: PIN im Link (`?k=`, Header `X-Takt-Pin`, zufällig bei `npm run lan`), Rate-Limit 60 pro Minute je IP, Datei höchstens 5 MB mit Rotation, Deduplizierung nach `id`, `GET /api/feedback?since=`, `GET /api/ping`, MIME für `.webmanifest`. `/api/state` bleibt im LAN schreibgeschützt. Workbench: `actions.importFeedback` (idempotent), „Eingang“ mit Übernehmen/Verwerfen/Später, Übernehmen läuft über die bestehende Sperrlogik.

### 5.12 Modul-Pflichtprogramm (für jedes Modul-Paket)
Startseite (`homeFeatureId`, bestehende Übersicht oder neues `<m>.home`) mit je einer Variante pro Richtung, strukturell verschieden (Layout-Typ, Hierarchie, Komponenten, Bedienkonzept). Pro Feature `tier` und `usage`. Kernfeatures (Tier 1) mindestens zwei, ideal drei Richtungen. Navigation: Startseite zu Kernfeatures zu Detail über `interaction.to` (+`carry`), Events müssen von einer Komponente der Variante wirklich ausgelöst werden. Akzeptanzkriterien (3 bis 6) für Startseite und Tier-1-Features, 1 bis 3 Abläufe (`flows`). `<m>Summary/Hints/Search/Notifications` in der Welt-Datei, `scenarios` (erststart, stress) für Tier-1-Daten. Modulfelder `stage`, `dataSource`, `offline`, `legal`. Mindestens 2 Entscheidungen, davon 1 offen, Dubletten bereinigen. Hinweise (`legal-notice`) in jeder Variante von Modulen mit `legal`. Skelett-Features (Zweck, Muss/Soll/Kann, Verknüpfungen) für alles, was nicht in diesem Lauf entworfen wird.

### 5.13 Ownership-Katalog (Datenobjekt zu Eigentümer)
- Einkaufsliste, Vorräte, Haushaltswartung: shopping. Ernährung liefert Zutaten per Verknüpfung (`carry`).
- Abos und Verträge: Fristen und Dokumente gehören documents, die laufenden Kosten und Summen finance (`subscriptions`). documents verlinkt.
- Schlaf und Check-in: fitness.recovery. Kein Journal-Modul in Basis v1.
- Wasser: nutrition.water (Start zeigt Kachel). Gewohnheiten verknüpfen nur.
- Fokuszeit: tasks.focus (Start und Kalender lesen `focusMinutes` aus der Aufgaben-Welt).
- Steuer: Sicht in trading.tax, Selbstständigen-Rücklagen in finance.business (Skelett), Belege-Ordner in documents.
- Sparpläne und Sparziele: savings (Eigentümer von `savingsPlans`, `savingsGoals`). Ziele-Modul zeigt Sparziele nur als Quelle.
- Depot, Positionen, Watchlist, Dividenden: trading. Das Depot-Konto in finance rechnet `depotValue` aus trading.
- Termine, Aufgaben: organisation-Welt (calendar/tasks). Training und Mahlzeiten erzeugen Termine/Aufgaben nur über Welt-Einträge mit gleichen IDs.
- Persona: home (persona.js).
Welt-Dateien: persona, organisation (CAL), finance (FIN), savings (SAV), trading (TRD), fitness (FIT), nutrition (NUT), weather (WET), knowledge (KB), scans (PTT), sales (SAL), habits (HAB), goals (HAB), documents (REG), shopping (REG), system (SYS), settings (SET), home (HOME).

### 5.14 Standard-DoD (gilt für jedes Paket)
`npm run check` ohne Fehler und Hinweise in eigenen Dateien. Tests des Pakets in `tests/<paket>-*.test.mjs` (eigener Namensraum, `node --test`). Neue Varianten und Komponenten per Probe (`window.__taktQA.run()`) ohne fail/warn in 1440, 768, 390, 360 und Theme graphite/horizon/intensiv, Zustände empty/loading/error auf Mobile und Desktop. App-Modus: alle `to`-Wege klickbar (`preview.html?app=1&version=dir:<r>` bei 390×844). Keine Hex-Farben, Umlaute, kein `Date.now()`. Dateien außerhalb der eigenen Liste bleiben unverändert. Wünsche an andere Pakete stehen im Abschlussbericht.

## 6. Modulkatalog

Legende: ID(Tier) – Varianten. R = Richtungen K/V/F. Neue Feature-IDs sind für alle Pakete verbindlich (docs/FEATURE_IDS.md), Querverweise mit `to` dürfen sie ab Start benutzen.

**home Start** (stage 1, Quelle: Welt, Offline: voll) – home.today(1) 3R (Startseite, Kennzahlen aus `allKpis`, Hinweise aus `allHints`, Erste-Schritte im Zustand firstrun), home.briefing(2) Morgenbriefing 07:00, home.review(2) Abendrückblick, home.hints(2) Smart-Hinweise regelbasiert mit Quelle und Aktion, home.customize(3) Kacheln konfigurieren (Skizze). Neu: hint-card, briefing-card, day-timeline, firstrun-checklist.

**calendar Kalender** (stage 2, Quelle: lokal plus ICS später, Offline: voll) – calendar.home(1) 3R, week(1) 3R, day(1) 2R, month(2), create(1) 2R mit recurrence-picker, edit(2), detail(2) Erinnerungen, Konflikt, Verknüpfungen, recurrence(2) Serien-Dialog (nur dieser/dieser und folgende/alle), categories, filter, tasks, conflicts(3), sources(3) Skelett, settings(3) Skelett.

**tasks Aufgaben** (stage 2) – tasks.overview(1) als Startseite 3R, list(1) 2R, detail(1) frei, kanban, priority, due, repeat (recurrence-picker), categories, projects, inbox(2) Eingang mit Triage, plan(2) Tagesplanung gegen freie Zeit, focus(2) Fokus-Timer mit `ctx.now`, review(3) Skelett.

**habits Gewohnheiten** (stage 2) – habits.home(1) 3R Tagesliste mit Serie und Pausenjoker, create(2), stats(2) Heatmap (Zahl zusätzlich zur Farbe), routines(3) Skelett, settings(3). Neu: habit-row, habit-heatmap, streak-badge.

**goals Ziele** (stage 2) – goals.home(2) Zielübersicht nach Lebensbereich mit Wochenfokus (max. 3), detail(2), review(3) Skelett. Fortschritt bezieht Daten per Verknüpfung (Gewicht aus fitness, Sparstand aus savings, Umsatz aus sales).

**notes Notizen** (stage 2) – notes.overview(1) als Startseite 3R, editor(1), search, checklists, pin-archive, attachments/notebooks/templates/history(3) Skelett. **knowledge Wissen** (stage 4) – knowledge.browse(2) als Startseite, article, search, links (link-chips), inbox/cards(3) Skelett. **picture-to-text** (stage 4) – picture-to-text.capture(2) Startseite, result, history, export, scan(2) Dokumenten-Scanner, receipt(1) Beleg erkennt Händler/Datum/Betrag und führt per `carry` in `finance.capture`, card(3) Visitenkarte, settings(3) lokal oder Cloud (Entscheidung).

**weather Wetter** (stage 2; Quelle: Entscheidung DWD oder Open-Meteo offen, in der Demo fiktiv, Offline: Cache mit „Stand 09:10“) – weather.home(1) 3R (Jetzt, Radar-Kachel, Warnung, Kleidungstipp), current(1, freigegeben, nur Richtungs-Tag und `to`), hourly, daily, radar(2) 3R (Karte mit Zeitleiste, Nowcast-Text „Regen in 12 Min.“, Streifen), health(2) Pollen/UV/Luftqualität (Farbe nie allein), advice(2) Kleidung und Aktivitäten, commute(3) Pendelfenster, alerts(1) Stufen mit Text, Quelle, betroffene Termine, locations(2) Orte, Reise-Ort, Suche, settings(3) Einheiten, Quelle, Offline-Cache. Neu: precip-radar, nowcast-bar, pollen-bars, uv-gauge, air-quality, clothing-tip.

**fitness Fitness** (stage 3; legal: gesundheit; Offline: voll) – fitness.overview(1) Startseite „Heute“ 3R, session(1) 3R (A dichte Tabelle, B Karte je Übung, C ein Satz im Fokus), plan(2) 2R, exercises(2) 2R mit „Alternative finden“, progress(2) Rekorde, Volumen, body(2) 3R Gewichtstrend statt Tageszahl, mit Ausblenden, history(3), activity(3), recovery(3) Faktoren statt Pseudo-Score, goals(3) Wochenziele mit Serie und Pausenjoker. Status wechselt von „Referenz“ auf „Konzept“. Neu: set-logger, rest-timer, session-header, exercise-card, weight-trend. `activity-rings` bekommt `centerMode` (INF-2).

**nutrition Ernährung** (stage 3; legal: gesundheit; Quelle: eigene Demo-Datenbank, produktiv Open Food Facts offen, Offline: lokale Datenbank) – nutrition.today(1) Startseite 3R (Kalorien übrig, Makros, Mahlzeiten, Wasser), log(1) 3R (Suche zuerst, Schnellwahl-Kacheln, Scan zuerst; höchstens 3 Taps), water(2) 2R mit +250 ml, goals(2) Wizard mit Sicherheits-Stopps und „Warum diese Zahl?“, foods(2), recipes(3), plan(3), reports(3) Skelett mit je einer Variante. Überschreitung nie rot. Neu: calorie-budget, macro-bar, meal-timeline, food-search, portion-picker, scan-sim, water-tracker.

**finance Finanzen** (stage 3; legal: keine-beratung; Quelle: manuell plus CSV später, Offline: voll; Privatmodus Pflicht) – finance.home(1) 3R („Frei verfügbar bis Monatsende“ mit „Wie berechnet?“, Anstehendes, Vermögens-Teaser), accounts(1) 2R, capture(1) 3R (Numpad-Sheet, Eine Zeile mit Erkennung, Vollformular; Umbuchung neutral; Rückgängig), transactions(2) 2R, budgets(2) 3R (Balken, Hüllen, Zero-Based), subscriptions(2) 2R, reports(2) Cashflow 2R, networth(3), accounts-manage(3), import(3), business(3) Skelett. Neu: safe-to-spend, transaction-capture, budget-envelopes, subscription-overview, net-worth-chart. `kind: transfer` zählt nicht in Budget, Cashflow, Sparquote.

**savings Sparen** (stage 3; legal: modellrechnung, keine-beratung; Offline: voll) – savings.home(1) 3R, calculator(1) 3R (Regler-Cockpit, Fragen-Schritte als Layout `steps`, Zielrechner rückwärts; Szenario-Spanne 3/5/7 % als Annahme), plans(1) 3R, plan-detail(2), create(2) Assistent 3 Varianten, goals(1) 3R mit Projektion, calendar(2) Ausführung mit Handelstag-Verschiebung und Deckungs-Check, withdrawal(3) Skelett. Referenzwerte (10.000 € Start, 300 €/Monat, 5 %, 20 Jahre = 150.436,50 €) sind Tests. Plan-Tracker: planen, erinnern, Ausführung manuell bestätigen. Neu: growth-chart, savings-calculator, savings-plan-list, goal-progress, execution-calendar, summary-card.

**trading Trading** (stage 4; legal: simulation, keine-beratung, kursdaten; Quelle: Entscheidung offen, Demo fiktiv, Offline: veraltete Kurse mit Stand) – trading.home(1) Übersicht 3R, portfolio(1) 2R, watchlist(2), detail(2), order(1) Ticket 2.0 (Markt, Limit, Stop, Kostenvorschau, Plausibilitätsschutz; 3 Varianten inkl. Schritte und Schnell-Sheet), alerts(2), history(3), tax(2) Freistellungsauftrag und Steuer-Orientierung aus `TAX_PARAMS` mit Stand-Datum, dividends(2) Kalender, performance(3) Skelett. Neu: tax-allowance, dividend-calendar, allocation-target (nur Skelett), `order-ticket` Version 2.0.

**sales Sales Channels** (stage 4; Quelle: Shop-APIs, Rate-Limits, Offline: Warteschlange) – sales.overview(1) Startseite 3R, orders, listings, connect, revenue, returns, sync-log(1) Fehlerzustand „Etsy-Token abgelaufen“ mit Neu-Verbinden, shipping/inventory/customers/margin(3) Skelett. Rechnungen: zurückgestellt, nur Export.

**documents Dokumente & Verträge** (stage 4; Offline: lokal; Modulsperre empfohlen) – documents.home(2) 3R mit Fristen-Streifen, list(3), contracts(2) Kündigungsfristen 30/14/3 Tage, warranties(3), tax-folder(3) Export für Steuerberater, scan-in(3). Skelette mit Startseite.

**shopping Einkauf & Haushalt** (stage 3; Offline: Pflicht, Laden ohne Netz) – shopping.lists(2) Startseite 2R inkl. Laden-Modus (große Touchflächen, nach Gang, offline), pantry(3), household(3) Wartungsrhythmen, plan-import(3) Zutaten aus Ernährung dedupliziert.

**system TAKT Kern** (stage 1, nicht in der Bottom-Navigation) – system.capture(1) 3R (Erkennung: „morgen 14 Uhr Zahnarzt“ = Termin, „!Angebot Müller“ = Aufgabe hoch, „-12,50 Rewe“ = Ausgabe, „Milch“ = Einkauf; Eingang für Unerkanntes; Rückgängig), search(1) 3R über alle Module aus `searchIndex` plus Befehle, notifications(2) 2R (nach Dringlichkeit, Schlummern, Ruhezeiten), trash(3), lock(3) Sperrbildschirm, onboarding(3) Skelett mit Erststart-Szenario, help(3), links(3) Verknüpfungen, widgets(3), share(3) Android-Mockup-Spezifikation. Neu: capture-sheet, global-search, notification-list, pin-pad (Skelett).

**settings Einstellungen** (stage 1) – settings.home(1) gruppierte Liste 2R, appearance(2), modules(1) Module aktivieren und Favoriten (wirkt über `prefs`), notifications(2) Regeln und Ruhezeiten, region(3) Einheiten, privacy(1) Privatmodus, Sperre, Datenschutz-Transparenz, data(2) Export, Backup, Papierkorb, about(3). Neu: setting-row, settings-group, module-toggle-list.

## 7. Querschnitt (Basis v1)

Erfassen (system.capture, FAB bzw. Strg+N), Suche mit Befehlen (Strg+K), Mitteilungszentrale (Glocke) mit Katalog und Ruhezeiten, Rückgängig-Toast (`undo-toast`), Offline-Banner und Sync-Status, Berechtigungskarte, Wiederholungsregel (eine Logik, ein Picker), Verknüpfungs-Chips, Privatmodus (`ctx.privacy`), Formatstandard, Erststart-Szenario. Als Skelett geführt (Anforderungen, keine Entwürfe): Papierkorb 30 Tage, App-Sperre, Onboarding-Wizard, Datenexport-Assistent, Widgets, Share-Target, Lebensbereiche-Filter, Verknüpfungs-Picker mit Rückverweisen.

## 8. Workbench-Erweiterungen

- Entscheidungs-Fahrplan `#/decide`: vier Stufen mit Zählern, Vererbungsbaum mit Ausnahmen, „Nächste Entscheidung“ nach Blockierwirkung (App-Richtung blockiert alles), Eingang vom Handy, Richtungsmatrix, Scorecard-Kriterien ohne Gewichte, Rundenzähler (ab der dritten Vergleichsrunde nur noch Entscheiden, Standardempfehlung oder Parken).
- Übersicht: Fortschritt je Ausbaustufe und Ebene, Entscheidungsstau, fällige Wiedervorlagen, Tier-Zähler.
- Module: Felder stage, Datenquelle, Offline, legal; Verknüpfungsmatrix; Modul-Cockpit mit Startseiten-Status.
- Feature-Browser: Filter nach Tier, Richtung, Abdeckung. Feature-Workspace: Tab „Gerätetest“ (Gerät, Android-Version, Checkliste: Daumenzone, Tastatur, Scroll, Timer im Hintergrund, Safe-Area, Schrift 200 %, Ergebnis je Feature, Pflicht für Tier 1).
- Studio: Richtung beim Anlegen einer Variante, Knopf „In App ansehen“ (Pseudoversion `pin:`), Revisions-Ping aktualisiert offene Launcher-Frames.
- Daten und Backup: „Neue Seed-Inhalte übernehmen“ mit Vorschau (neu, aktualisierbar, gesperrt/Vorschlag), Heilungsbericht der Validierung, Export-Bundle.
- Versionen und Entscheidungen: Protokoll-Export nach Ebene mit Optionen, Evidenz, Reversibilität; Wiedervorlage, Parken.

## 9. Flutter-Übergang (bewusst schlank)

Jetzt: Feature-Spezifikation als JSON (`takt-feature-spec/1`) mit `specHash` (kanonischer Hash aus Snapshot, Komponentenversionen, Token-Version) und daraus Markdown, `flutter`-Feld im Komponentenvertrag, Dart-Token-Export mit TextStyles, Schatten und Zustandswerten, Routentabelle aus den Navigationsregeln, Export-CLI mit deterministischem Manifest. Später (nach Richtungswahl und Phase 1): Entitäten-Dart, ARB, Widgetbook, integration_test, `impl`-Parität, Techprofil. Alle Flutter-Annahmen sind als Annahme gekennzeichnet, solange Phase 1 fehlt.

## 10. Qualitätssystem

- Ebene 1 `npm run check` (unter 2 s): Syntax, Seed-Integrität, Vertrag, Hex-Farben, Umlaute, `Date.now()`/`Intl`-Lint, Navigationsgraph (kein totes Ziel, jedes Feature mit Variante vom Start in höchstens 3 Taps erreichbar), jedes Modul mit mehr als 2 Features hat Startseite mit drei Richtungen, `legal`-Module enthalten `legal-notice` in jeder Variante (statisch), Verbotsbegriffe in Gesundheitsbereichen („Sünde“, „abtrainieren“, „versagt“, „verbrennen“ als Guthaben), kein `--tk-c-danger` in Kalorien-/Gewichtskontext, Seed-Größe unter 1,6 MB, Flutter-Feld für neue Komponenten.
- Ebene 2 `npm test` (Node, unter 10 s): Core (migrate, validateState, resolveDesign, versioning, Theme-Audit), finmath, recurrence, health-calc, Format-Tabelle (14 Werte), Welt-Invarianten (Depotkonto gleich Positionssumme plus Verrechnung, Umbuchung neutral, Giro-Saldo, Sparraten gleich Planraten, kcal aus Makros ±12 %, Mahlzeitensummen, gleiche Termine in Kalender und Start).
- Ebene 3 Probe und CLI-QA: neue Prüfungen `legal-present`, `money-format`, `privacy-clean`, `a11y-names/roles/forms`, Überlauf bei Schrift 200 %, DOM-Knotenbudget. Matrix mit Zuständen und Umgebung. E2E-Suite modular (`qa/e2e/`) inklusive Launcher: Versionswechsel mit Routenerhalt, Sync von zwei Frames, Szenario, Privatmodus, Zurück per History, Feedback zu Eingang zu Entscheidung, Sperre bleibt unberührt, Seed-Patch überspringt Gesperrtes.
- `npm run verify` fasst check, test, qa:changed zusammen (fest definierte Reihenfolge, Bericht in `qa/results/latest.md`), Pre-Commit-Hook optional.
- Inhalts-Hash je Feature für `qa:changed`, damit reine Variantenarbeit erkannt wird.
- Gerätetest-Protokoll als Pflicht für Tier-1-Freigaben (Abschnitt 8).
- Schrift Inter und JetBrains Mono lokal (nur wenn Download in der Umgebung möglich ist, sonst als Hausaufgabe dokumentiert) und feste Chromium-Flags für Baselines.

## 11. Roadmap und Abnahme

Phase 0 (Fundament, parallel mit disjunkten Dateien): DOC-0, INF-1, INF-2, INF-3, INF-5. Dann INF-4, INF-6, INF-9.
Phase 1 (Module parallel): FIN, SAV, TRD, FIT, NUT, WET, CAL, HAB, REG, SET, KB, PTT, SAL sowie Workbench-Pakete INF-7, INF-8.
Phase 2 (Aggregation, braucht die Welt-Exporte): HOME, SYS.
Phase 3: INT-1 (Integration, Baselines, Gerätetest-Vorlage), DOC-1.

Basis-v1-Abnahme (Gate, nicht verhandelbar): `npm run verify` grün; 19 Module im Launcher bedienbar, kein Modul landet bei „Noch kein Design“ ohne Skizze; Navigationsgraph vollständig; drei Versionen mit Tier-1-Abdeckung je mindestens 60 % (sonst Warnung sichtbar und dokumentiert); Welt-Invarianten grün; sechs Fachschnitte (finance.home/capture, savings.calculator/plans/goals, trading.order/tax, nutrition.today/log, fitness.session, weather.home/radar) mit allen Zuständen in allen Themes; Launcher-E2E grün; Seed-Patch-Test; Baselines bewusst neu gesetzt (`qa:baseline`); Doku aktualisiert. Wenn Zeit knapp ist, rutschen Phase 1 P2-Pakete (KB, PTT, SAL, HAB-Tiefe, INF-8), nie Phase 0 oder die Gates.

Roadmap danach: P1 (Welle nach der Richtungswahl): Skelett-Features in Entwürfe, Verknüpfungs-Picker, Papierkorb, Sperre, Onboarding, Lebensbereiche-Filter, Sparen-Zusatz (Entnahmeplan), Trading-Zusatz (Performance, Allokation), Finanzen-Zusatz (Import CSV/CAMT, Kredite, Selbstständigen-Rücklagen). P2: Flutter-Entitäten, ARB, Widgetbook, `impl`-Parität, Schrift-Skalierung als Pflichtdimension, Patch-Undo und Delta-Persistenz nach Messung. P3: PWA-Offline über HTTPS-Export, APK-Hülle, Blind- und Duellmodus, Scorecard mit Gewichten.

## 12. Bewusst verschoben oder verworfen (mit Grund)

- Service Worker und Offline-Precache über LAN-HTTP: nicht testbar ohne Secure Context. Nur ehrliche Erklärung und `adb reverse`-Weg.
- Delta-Persistenz und Patch-Undo: erst nach Benchmark mit 150 synthetischen Features (`tools/bench-store.mjs` liefert die Zahl). Die Entfernung der Welt aus dem Zustand löst den größten Teil schon jetzt.
- Rundenassistent mit Zeitbox, Pins an Blöcken, Blind-/Duellmodus, Aufgaben-Trial, Hybridvarianten, Dossier/PDF, gewichtete Scorecards, Claude-Empfehlungs-Pipeline: für einen Einzelnutzer Overhead. Ersatz: Pflichtbegründung, Rundenzähler, Wiedervorlage, Kriterienraster.
- Flows/Journeys als eigene Entität mit Editor: erst nach dem Navigationsgraphen. Jetzt drei E2E-Klickpfade und das vorhandene `feature.flows`-Feld.
- Entitätsmodell mit ER und Dart/SQL, Widgetbook, ARB, Routen-Dart, `impl`-Parität, Techprofil: wären geratene Annahmen ohne Phase 1.
- Module Kontakte, Reisen, Zeiterfassung, Journal, Wunschliste, Fahrzeug: nur Entscheidungs-Einträge (Reisen als Vorlage, Rechnungen als Export, Steuer/EÜR nur Beleg-Export). Verzicht: Passwörter, News-Feed, Smart-Home, Social.
- Wetter-Ausbau über radar/health/advice/alerts hinaus, Trading-Performance/Allokation, Finanzen-Import/Kredite/Rücklagen, Sparen-Entnahme: Skelett mit Anforderungen.
- Zeitregler mit freier Uhrzeit, Wake-Lock, Orientierungssperre: nur drei Tageszeit-Stationen und Vollbild.
- Android-Dynamic-Color, Predictive Back, Wear OS, Telemetrie: Entscheidungen (ADR), kein Entwurf.

## 13. Risiken und Rückfall

- Runtime-Umbau kippt Pixel-Baselines: Umschalter `legacy=1`, bewusstes `qa:baseline` nach Abnahme, vorher Probe statt Pixelvergleich.
- Parallelität: harte Dateibesitz-Liste je Paket, Welt-Dateien einzeln vergeben, Tests im Namensraum je Paket, Registry-Verzeichnisse vorab von INF-3 angelegt.
- Persona wirkt widersprüchlich, bis der Nutzer sie bestätigt: Platzhalter bleiben als solche gekennzeichnet.
- Rechts-/Gesundheitstexte sind Annahmen und brauchen vor einer Veröffentlichung eine fachliche Prüfung (Entscheidung).
- Seed-Größe und Ladezeit: Gate 1,6 MB und Start unter 3 s bei CPU-Drosselung 4x.
- Echtes Handy bleibt ungeprüft: Gerätetest-Protokoll als eigener Meilenstein, Aussagen zu Timer im Hintergrund, Kamera, Health Connect bleiben Annahmen.

## 14. Paketübersicht

DOC-0 Leitplanken und Verträge (Doku) · INF-1 Runtime, Shell, App-Player · INF-2 Primitive, Format, Recurrence, Health-Rechner · INF-3 Datenmodell, Store, Seed-Mechanik, Welt-Stubs · INF-4 Server und Launcher · INF-5 Test-Infrastruktur und Check · INF-6 Probe und CLI-QA · INF-7 Workbench-Entscheidungsansichten · INF-8 Spezifikation, Export, Daten-Ansicht · INF-9 Querschnitt-Bausteine · MOD-FIN · MOD-SAV · MOD-TRD · MOD-FIT · MOD-NUT · MOD-WET · MOD-CAL · MOD-HOME · MOD-KB · MOD-PTT · MOD-SAL · MOD-HAB · MOD-REG · MOD-SET · MOD-SYS · INT-1 Integration · DOC-1 Abschlussdoku.