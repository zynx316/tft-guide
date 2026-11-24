# Arbeitsprotokoll – TAKT Design Workbench

Zeiten in UTC. Neue Einträge unten anhängen (Datum, Phase, Entscheidung/Änderung, Testlauf, Ergebnis).

## 24.11.2026 – Nacht-Session (Cloud-Umgebung)

### 00:33 – Phase 1: Umgebung & Bestand
- Umgebung: Cloud-Container mit Repo `tft-guide` (fremdes Projekt), Node 22, Chromium + Playwright vorinstalliert, npm-Registry erreichbar.
- **Einschränkung:** Kein Zugriff auf `G:\Projekte\97_Uebernahme\TAKT-Merge-Git\` (kein verbundener Rechner – geprüft über die Liste
  verfügbarer Rechner/Ordner: leer). Git-Sicherheitsprüfung, Modulregister, Theme-Werte, frühere Prototypen und Fitness/Finanzen-Konzepte
  konnten **nicht** gelesen werden → Phase 1 als lokale Aufgabe vorbereitet (`docs/PHASE1_BESTANDSAUFNAHME.md`, `/takt-phase1`).
- **Entscheidung:** Workbench als eigenständiges Projekt `TAKT_DESIGN_WORKBENCH/` bauen; Module/Features aus dem Auftrag als
  Seed, jeweils mit `source: „… in Phase 1 verifizieren“`. Zusätzlich als Annahme: „Start“ (Tagesübersicht), „Einstellungen“.

### 00:40 – Phase 2: Architektur
- Technologieentscheidung: Preact 10.29 + htm 3 lokal vendored (kein Build), Node-Server ohne Abhängigkeiten, Playwright nur für CLI-QA.
  Verworfen: React+Vite (Build/Deps), Vanilla-DOM (Wartbarkeit), Electron (Gewicht). Begründung in ARCHITECTURE.md §1.
- Kernentscheidung: **deklarative Varianten** (Layout + Blöcke aus Komponenten-Registry), **echte Iframes** in Gerätebreite,
  **eine QA-Sonde** für Workbench und CLI, **Store als einziger Schreibweg**, Snapshot-Versionierung mit Sperre.
- Icons: Lucide (ISC) – 216 Icons als Inline-SVG-Map vendored.

### 00:45–01:00 – Phase 3/4: Designsystem & Kern
- Tokens (Basis + 3 Themes, Kontrast-Audit), `takt-base.css` (Primitive, App-Shell, 5 Layouts), UI-Primitive, Registry + Komponentenvertrag.
- 15 generische Komponenten (Seitenkopf, Umschalter, Suche/Filter, Aktionsleiste, Hinweis, Kennzahlen, Liste, Kartenraster, Detail,
  Tabelle, Verlauf, Fortschritt, Diagramm, Formular, Schnelleingabe).
- Preview-Runtime (App-Rahmen, geteilte Daten/UI-Zustände, Dialog/Toast, Error-Boundary, Zustände), QA-Sonde (7 Prüfungen).
- **Erster Test:** Start-Modul in 4 Viewports – QA-Sonde fand sofort echte Schwäche: Checkboxen auf Mobile 24 px → Trefferfläche 40 px.
- Umlaut-Bereinigung: anfangs ae/oe/ue geschrieben → mit kuratierter Wortliste auf echte Umlaute umgestellt (Code-Bezeichner unberührt).

### 00:55 – Parallelisierung (Sub-Agenten, Modell Sonnet)
- Worker A (Kalender + Aufgaben), Worker B (Notizen, Wissensdatenbank, Picture to Text, Wetter), Worker C (Sales, Trading,
  Referenzmodule Fitness/Finanzen): je Komponenten + Seed-Manifeste in getrennten Dateibereichen, Selbsttest per Playwright.
- **Einschränkung dokumentiert:** Die Sub-Agenten liefen mit Modell Sonnet und normalem Effort. Separate „Worker-Sessions“ mit Effort
  „High“ wurden nicht gestartet (Agent-Werkzeug der Session; Effort nur explizit setzbar). Für zuhause sind Agent-Definitionen mit
  `model: sonnet`, `effort: high` in `.claude/agents/` hinterlegt.

### 01:00–01:12 – Workbench-Oberfläche
- Store (Persistenz, Undo/Redo, Historie, Sperrlogik, Aktionen), UI-Kit (Dialoge, Menüs, Toasts, Sortierung), Preview-Frame,
  QA-Runner, Shell (Navigation, Breadcrumbs, Befehlspalette, Speicherstatus, Hell/Dunkel).
- Views: Übersicht, Module + Cockpit, Feature-Browser, Feature-Workspace (9 Tabs), Design Studio, Komponenten (+ Tokens),
  Versionen & Entscheidungen, Quality Center, Daten & Backup.
- **Smoke-Test 01:11:** 23 Routen ohne JavaScript-Fehler; Screenshots geprüft.

### 01:05–01:20 – Ergebnisse der Worker integriert
- A: 11 Komponenten, 18 Features (22 Varianten; Wochenansicht A Kompakt / B Visuell / C Produktiv; Monatsansicht freigegeben).
- B: 10 Komponenten, 20 Features (17 Varianten; Aktuelles Wetter freigegeben).
- C: 9 Komponenten, 20 Features (15 Varianten; Sales-Übersicht 3 Varianten; Fitness/Finanzen als Referenz).
- Kern-Wünsche umgesetzt: Diagramm misst echte Breite (keine verzerrten Achsen), Donut-Mittelwert skaliert, Kennzahlen ohne
  Leerhöhe, `asideFirstOnMobile` nur Mobile, Switch mobil 48×30, **Horizon-Kontraste** (Akzent/Status auf Soft-Flächen) angehoben –
  Token-Audit jetzt in allen Themes 16/16.

### 01:13–01:19 – CLI-QA & E2E
- `qa/run-qa.mjs`: Vertrag, 24 E2E-Tests (frischer Seed, temporäre Daten), Screenshot-Matrix, Pixel-Regression, `--changed`.
- 1. Lauf E2E 18/23: Ursache überwiegend Test-Timing (entprelltes Speichern) → Polling; echter Fehler: Escape schloss Dialog direkt
  nach dem Öffnen nicht zuverlässig → globaler Escape-Handler. **2. Lauf: 24/24 bestanden.**

### 01:14 – Architekturprüfung (Worker G, unabhängig, nur Code)
- 8 Muss-Punkte, alle umgesetzt: Status-Freigabe nur über Freigabe-Aktion · Sperr-Umgehungen geschlossen (Feld-Whitelist,
  Merge, Löschen nur mit Bestätigung, Interaktions-Zeitstempel ausgelagert) · Komponentenversionen im Freigabe-Snapshot +
  Drift-Anzeige + Checkliste im Store erzwungen · Undo ohne Einstellungen/QA · Revisionen + 409-Konflikt bei mehreren Tabs ·
  `mergeSeed` mit Entscheidungen · fehlende Skripte ergänzt · Server-Härtung (Pfad, Origin/Host, JSON, LAN schreibgeschützt).
  Zusätzlich: Zeitzonen-Bug (`isoDay`), Auto-Snapshot vor Wiederherstellung. Mittelfristige Punkte → TASKS.md §3.

### 01:20 – Visuelle QA
- Lauf 1: 39 Features (bevorzugte Varianten) × 5 Pflicht-Viewports, Graphite → **195/195 bestanden**, Vertrag 0 Fehler/0 Hinweise.
- Lauf 2 (01:22–01:30): alle 57 Varianten × 3 Themes × 4 Viewports (1440, 768, 390, 360) → **684/684 bestanden**.
- Lauf 3 (01:30–01:33): alle Varianten × Zustände Leer/Lädt/Fehler × Mobile/Desktop → **342/342 bestanden**.
- `tools/check.mjs` (statisch): 0 Fehler, 0 Hinweise.

### 01:25 – Dokumentation & Übergabe
- CLAUDE.md, HANDOFF.md, TASKS.md, README.md, ARCHITECTURE.md, DESIGN_SYSTEM.md, QA_REPORT.md, docs/MISSION.md,
  docs/PHASE1_BESTANDSAUFNAHME.md, docs/examples/, `.claude/settings.json`, 5 Slash-Commands, 5 Agent-Definitionen.

### 01:30–01:40 – Feinschliff & Abschlussprüfung
- Kalender: kurze aufeinanderfolgende Termine überlappten optisch → Spaltenaufteilung mit Mindestdauer, `calendar-week` v1.1
  (Komponentenversion erhöht → Drift-Erkennung).
- Workbench-UI: Tabs im Feature-Workspace passen bei 1440 px vollständig (Icons erst ab breiteren Fenstern), Card-Untertitel umbrechen.
- Seed-Freigaben erhalten beim Start Komponentenversionen (Drift-Erkennung auch für Demo-Freigaben).
- **Finaler Gesamtlauf (01:34):** Vertrag 0/0 · E2E 24/24 · Visuell 185 ✓, 10 erwartete Änderungen (genau die Features mit
  `calendar-week`, Arbeitsstände), 0 Fehler. `--changed` danach: „nichts zu tun“. E2E nach letzter Store-Änderung erneut 24/24.
- QA_REPORT.md geschrieben. Übergabe über Branch `ccr-95570849-lkvyto` im Repo `zynx316/tft-guide` (Ordner `TAKT_DESIGN_WORKBENCH/`).

---

## Session 2 – 24.11.2026, 01:40–07:30: V2 „Beste Basis“ (Auftrag: alles Notwendige ergänzen, Demo-Launcher, Ebene für Ebene)

### 01:40–02:05 – Workbench V2 (Commit d0ed375)
- Ebenenmodell (App · Modul · Feature · Komponente), drei Richtungen (Kompakt, Visuell, Fokus) als durchgängige Versionen,
  App-Player in der Vorschau (Module, Navigation `interaction.to`, Zurück, Skizzen), **Demo-Launcher** (Versionen nebeneinander,
  gekoppelte Navigation, Bewertung, Übernehmen, Handy-Vollbild, QR, PWA), gemeinsame Datenwelt (Persona Jonas Keller),
  Finanzmathematik mit Referenztests, Flutter-Brücke (Dart-Tokens, Spezifikation).

### 02:05–02:50 – Brainstorming-Workflow + Prozess (Commits 408ddb4, e882da9)
- Workflow: 7 Perspektiven (Produkt, Prozess, Launcher, Finanzen, Körper, Alltag, Technik) → 2 Kritiker → Synthese
  `docs/BAUPLAN.md` (27 Arbeitspakete, Verträge, Abnahme „Basis v1“, 14 Nutzer-Entscheidungen).
- Entscheidungsrunden (Zeitbox, Agenda nach Blockierwirkung, Rundenlimit 2), App-Ebene (Leitbild, Grundsatzfragen, Muster,
  Gates, Annahmen), Scorecard, Anmerkungen, Akzeptanzkriterien, Arbeitsauftrag (`/takt-work-order`).
- Szenarien (Alltag, Erster Start, Stress-Tag), Umgebung (Offline, Schrift bis 200 %), „Meine Auswahl“, „In App ansehen“,
  Seed-Patch, Grundsatzfragen aus dem Bauplan in die Inbox. Store: Tab-Synchronisation übernimmt Server-Revision.

### 02:30–03:15 – Fundament-Workflow (3 Pakete, je Bau → Prüfung; Commits 29ab637, 533f470)
- `lib/format.js`, `lib/date.js`, `core/recurrence.js`, `core/health.js`, Node-Testinfrastruktur (`tools/register.mjs`, `npm test`).
- Leitlinien: Gesundheit, Finanzen, Datenwelt, Textstil, Persona, ADR Launcher/Datenhaltung, Gerätetest.
- Querschnitt-Komponenten: offline-banner, sync-status, permission-card, recurrence-picker, undo-toast, link-chips, firstrun-card.
- App-Rahmen je Version (Tab-Leiste · Launchpad mit Live-Kennzahlen · Fokus mit Erfassen-Knopf), Konflikt-Rebase im Store
  (Workbench + Launcher gleichzeitig), Feedback-Schema v2 (Kriterien, Dubletten, Ratenbegrenzung).

### 01:50–06:05 – Modul-Wellen (2 Workflows, 10 Pakete, je Bau → unabhängige Prüfung)
- Welle 1: Ernährung (erstklassig), Fitness (erstklassig), Sparpläne (gut), Finanzen (gut), Trading (gut).
- Welle 2: Wetter (gut), Start/Gewohnheiten (gut), Kalender/Aufgaben (gut), Inhalte/Sales (gut), Kern/Einstellungen (gut).
- Laufend in der Hauptsession umgesetzte Kern-Wünsche der Worker: `ctx.fmt/now/live/world/newId/mode/blockWidth`, Navigation
  über `detail.to`/`module:<id>` und je Variante (`variant.nav`), Demo-Einstellungen wirken auf die App (Favoriten, aktive
  Module, Theme, Schrift, Beträge), Primitive NumberStepper/Ring, Switch mit 44-px-Trefferfläche, Layout-Optionen
  `stretch`/`asideSticky`, große Schrift (Buttons/Eingaben umbrechen), Prüfregeln (Navigationsgraph, Begriffslisten,
  CSS-Kollisionen), QA-Sonde (Namen von Bedienelementen, Privatsphäre-Lecks, Nachmessen unter Last).
- Fehler in der Hauptsession (ehrlich): Die Nachmess-Änderung an der QA-Sonde rief `runProbe` ohne `await` auf –
  `__taktQA.run()` lieferte ~20 Min. kein Ergebnis (gefunden vom Trading-Prüfer, behoben in ca2a1d4).

### 06:05–07:05 – Integrations-Workflow (3 Pakete, je „gut“; Commit 903d412)
- Datenwelt für alle 16 Module (knowledge, scans, sales, habits, trading, savings, settings, system, home), Aggregate
  `allKpis`, `allHints`, `searchIndex`, `allNotifications`; Befunde B2/B3/B8/B10/B11/B12 behoben (u. a. Trainingstage
  Mo/Mi/Fr 18:30 FitX überall, Privatentnahme als Umbuchung → Sparquote 33 %); 31 Invarianten-Tests.
- Einheitliche Formatierung (money/percent → lib/format.js), Registry bereinigt; Finanzmathematik: Konvention effektiv/nominal
  wählbar (Referenz 150.436,50 € nominal), Börsenfeiertage, Beleg → Buchung vorbelegt.
- Danach: kaufmännische Rundung, Privatsphäre in Kern-Tabellen, Vertragsprüfung erkennt konfigurierbare Events (123 → 7).

### ab 07:10 – Abschluss-QA-Workflow (4 Modulgruppen: Sichtprüfung → Korrektur → Nachprüfung, dann Vollständigkeitsprüfung)
