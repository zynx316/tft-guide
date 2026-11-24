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
