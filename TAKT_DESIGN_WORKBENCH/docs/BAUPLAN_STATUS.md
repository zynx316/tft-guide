# Bauplan – Umsetzungsstand je Paket

> Stand: 24.11.2026, Ende Session 2. Bezug: `docs/BAUPLAN.md` (Verträge) und `docs/BAUPLAN_PAKETE.json` (Pakete mit Abnahmekriterien).
> Legende: **fertig** = Abnahmekriterien im Kern erfüllt und geprüft · **teilweise** = nutzbar, einzelne Punkte offen (stehen in
> `TASKS.md`) · **anders gelöst** = Ziel erreicht, aber bewusst mit anderem Mittel · **offen** = nicht begonnen.
> Seed-Zahlen: 16 Module, 173 Features (Tier 1: 44, Tier 2: 60, Tier 3: 54), 295 Varianten (kompakt 120 · visuell 96 · fokus 79),
> 389 Navigationswege (`to`), 122 Entscheidungen (11 App, 20 Muster, 91 Feature). Genaue Listen: `docs/FEATURE_IDS.md`, `docs/KOMPONENTEN.md`.

## Fundament (Phase 0)
| Paket | Stand | Umgesetzt | Offen / Abweichung |
|---|---|---|---|
| DOC-0 Leitplanken, Verträge, Welt-Katalog | fertig | `HEALTH_GUIDELINES`, `FINANCE_GUIDELINES`, `TEXT_STIL`, `DATENWELT`, `PERSONA`, `FEATURE_IDS`; Begriffsprüfung in `npm run check` | Fachliche Prüfung der Texte (Grundsatzfrage „Rechtsprüfung“) |
| INF-1 Preview-Runtime | fertig | App-Player mit drei Rahmen (Tab-Leiste, Launchpad, Fokus), Stapel/Zurück, `module:<id>`-Ziele, `variant.nav`, Erfassen-Blatt, Umgebung (offline, veraltet, Privatsphäre, Schrift bis 200 %), `ctx.now/live/fmt/world/newId/mode/blockWidth`, Szenarien | Kein `safe=`-Parameter; kein `legacy=1`-Rückfall (nicht nötig geworden); Zustände `firstrun/denied/stress` laufen über Szenarien und Querschnitts-Bausteine statt über `UI_STATES` |
| INF-2 Primitive, Format, Wiederholung, Health | fertig | `lib/format.js` (de-DE, echtes Minus, kaufmännisches Runden), `money()/percent()` mit Privatsphäre, `NumberStepper`, `Ring`, `Switch`-Trefferfläche, `core/recurrence.js`, `core/health.js`, `lib/date.js` | – |
| INF-3 Datenmodell, Auflösung, Seed-Patch, Welt | anders gelöst | Felder additiv in Schema v2 (Ebenen, Richtungen, Versionen inkl. `mix` und `pin:`, Entscheidungen v2, Runden, Pins, Scores, `worldOverrides`); Welt nicht mehr im Zustand (`getWorld` + Szenarien); Seed-Patch mit `seedHash`; Store mit Konflikt-Rebase | `validateState` (`core/validate.js`) prüft alle Verweise – im Import-Dialog (Fehler blockieren), in „Daten & Backup › Integrität“ und in `npm run check`. Offen: Migrationskette (Schema blieb 2, Migration additiv in `migrate`), Backup-vor-Migration; `resolveDesign` heißt weiterhin `resolveVariant` |
| INF-4 Server und Demo-Launcher | teilweise | Versionen nebeneinander, gekoppelte Navigation, Handy-Vollbild mit Zurück, Szenario/Offline/Schrift/Theme, Bewertung mit 5 Kriterien, Übernehmen, QR, Feedback v2 (Dedupe, 60/min, Rotation 5 MB, `?since=`), `/api/ping`, LAN schreibgeschützt außer Feedback, **WLAN-PIN** im QR-Link (`lib/api.js`, Test `server-pin`) | Tageszeit-Stationen; Tastenkürzel 1/2/3/T/R |
| INF-5 Tests, Check, verify | fertig | `npm test` (~275 Tests, Node-Loader für Preact), `npm run check` (Syntax mit Cache, Seed, Vertrag, Navigationsgraph, Begriffe, CSS-Kollisionen, Hinweise zu `Intl`/`Math.random`), `npm run verify` | Seed-Größen-Gate (1,6 MB) nicht als harte Prüfung |
| INF-6 QA-Probe, CLI, E2E | teilweise | Sonde mit 9 Prüfungen (neu: Barrierefreiheits-Namen, Privatsphäre), Wiederholung bei fehlenden Blöcken, CLI mit `--scenario/--env/--scale`, 32 E2E-Tests inkl. Launcher, Runden, Gates, Vertragsprüfung der Events | Prüfungen `legal-present`, `money-format`, DOM-Knotenbudget; E2E nicht modular in `qa/e2e/` aufgeteilt |
| INF-7 Workbench-Prozess | fertig | App-Ebene (Leitbild, Inbox, Muster, Gates, Annahmen), Entscheidungsrunden mit Zeitbox und Limit 2, Parken mit Wiedervorlage, Gates je Feature/Modul/App, Scorecard, Pins, Abnahmekriterien, Gerätetest-Tab, Ausbaustufen, Eingang vom Handy | Vererbungsbaum als Grafik |
| INF-8 Flutter-Brücke light | fertig | Spezifikation als JSON `takt-feature-spec/1` mit `specHash` (`core/spec-json.js`), Routentabelle, Export-CLI `npm run spec` mit deterministischem Manifest und `spec:check`, Markdown-Spezifikation, Dart-Tokens, `flutter`-Feld, Arbeitsauftrag-Export | Entitäten-Dart, ARB, Widgetbook (bewusst nach Phase 1) |
| INF-9 Querschnitt-Bausteine | fertig | Hinweis-, Offline-, Berechtigungs-, Erststart-, Rückgängig-, Wiederholungs- und Verknüpfungs-Bausteine (Tests `inf9-crosscut`) | – |

## Module (Phase 1 und 2)
| Paket | Stand | Umgesetzt | Offen |
|---|---|---|---|
| MOD-FIN Finanzen | fertig | Startseite 3 Richtungen („Frei verfügbar“ mit Rechenweg), Erfassen, Budgets, Abos, Auswertung, Umbuchungen neutral, Privatsphäre | Import (`finance.import`), Selbstständige (`finance.business`) nur als Anforderungen; Kredite fehlen |
| MOD-SAV Sparpläne | fertig | Rechner (Referenzwert 150.436,50 € getestet), Pläne, Ziele mit Projektion, Ausführungskalender mit Handelstagen | Entnahmeplan (`savings.withdrawal`) und Annahmen-Seite nur als Anforderungen |
| MOD-TRD Trading | fertig | Übersicht, Depot, Order-Ticket mit Kostenvorschau und Plausibilitätsschutz (Simulation), Steuer-Orientierung, Dividenden | Allokation fehlt; echte Kursquelle (Grundsatzfrage) |
| MOD-FIT Fitness | fertig (Prüfurteil „erstklassig“) | Heute, Session mit Satz-Logger und Pausen-Timer, Plan, Körper mit Trend, Fortschritt | – |
| MOD-NUT Ernährung | fertig (Prüfurteil „erstklassig“) | Heute, Erfassen in höchstens 3 Taps, Wasser, Ziele-Assistent mit Sicherheits-Stopps, Überschreitung nie rot | Open-Food-Facts-Anbindung (Grundsatzfrage) |
| MOD-WET Wetter | fertig | Startseite, Radar mit Nowcast (simuliert), Pollen/UV/Luft, Kleidungstipp, Warnungen mit betroffenen Terminen, Orte | Datenquelle DWD/Open-Meteo (Grundsatzfrage) |
| MOD-CAL Kalender & Aufgaben | fertig | Startseiten, Woche/Tag/Monat, Termin-Detail, Serien, Planung, Fokus-Timer | ICS-Quellen (Skelett) |
| MOD-HOME Start | fertig | Tagesübersicht aus allen Modul-Kennzahlen, Briefing, Hinweise, Erste Schritte | Kacheln konfigurieren (Skelett) |
| MOD-SYS TAKT Kern | fertig | Erfassen mit Erkennung (Termin/Aufgabe/Ausgabe/Notiz), Suche über alle Module, Mitteilungen | Widgets und Teilen (`system.widgets`, `system.share`) nur als Anforderungen |
| MOD-SET Einstellungen | fertig | Gruppen, Module/Favoriten (wirken live im Launcher), Darstellung, Datenschutz, Daten | – |
| MOD-HAB Gewohnheiten | fertig | Tagesliste mit Serie und Pausenjoker, Detail mit Verlauf, Wochenrückblick, Pause, Vorlagen | **Ziele-Modul** (`goals`) nicht angelegt |
| MOD-REG Skelett-Module | **offen** | – | **Dokumente & Verträge** und **Einkauf & Haushalt** fehlen als Module (Einkaufsliste existiert als Welt-Daten). Bauplan sprach von 19 Modulen, gebaut sind 16 |
| MOD-KB Notizen & Wissen | fertig | Startseiten, Editor, Suche, Verknüpfungen | – |
| MOD-PTT Picture to Text | fertig | Scanner (simuliert), Beleg → Buchung in Finanzen | Verarbeitung lokal oder Cloud (`picture-to-text.settings`, Grundsatzfrage) |
| MOD-SAL Sales Channels | fertig | Startseite, Bestellungen, Angebote, Sync-Protokoll mit Fehlerzustand | Retouren, Versand, Bestand, Kunden, Marge nur als Anforderungen; Rechnungen bewusst zurückgestellt |

## Abschluss (Phase 3)
| Paket | Stand | Umgesetzt | Offen |
|---|---|---|---|
| INT-1 Integration und Abnahme | teilweise | Eine Datenwelt für alle 16 Module mit 31 Invarianten-Tests, Formatvereinheitlichung, Querverweise, Abschluss-QA-Workflow je Modulgruppe | **Gerätetest auf echtem Handy** (nur zuhause möglich); Baselines bewusst neu setzen (`npm run qa:baseline` auf dem eigenen Rechner); 19-Module-Ziel siehe MOD-REG |
| DOC-1 Abschlussdokumentation | fertig | CLAUDE.md, HANDOFF.md, TASKS.md, WORK_LOG.md, README, ARCHITECTURE, DESIGN_SYSTEM, QA_REPORT, Slash-Commands | – |

## Bewusste Abweichungen vom Bauplan
- **Entscheidungsrunden mit Zeitbox und Rundenlimit** wurden gebaut, obwohl Abschnitt 12 sie als Overhead einstufte: Sie sind das
  Hauptmittel gegen endlose Designrunden und kosten in der Bedienung einen Klick.
- **Scorecard** in der Workbench hat fünf Kriterien (`SCORE_CRITERIA`) mit optionalen Gewichten (Standard: alle gleich); der
  Launcher bewertet mit fünf eigenen Kriterien ungewichtet.
- **Schema-Version** bleibt 2: alle neuen Felder sind additiv mit Defaults, eine Migrationskette hätte nur Risiko gebracht.
