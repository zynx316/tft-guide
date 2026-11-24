# TAKT Design Workbench – Projektkontext für Claude Code

> Diese Datei lädt Claude Code automatisch. **Beim Sessionstart zuerst:** `/takt-start` (oder `HANDOFF.md`, `TASKS.md` und das
> Ende von `WORK_LOG.md` lesen). Original-Auftrag: `docs/MISSION.md`. Bauplan mit allen Verträgen: `docs/BAUPLAN.md`.
> Slash-Commands: `/takt-start`, `/takt-phase1`, `/takt-round-prep`, `/takt-work-order`, `/takt-feature <id>`, `/takt-qa`, `/takt-review`.

## Was ist das?
Eine **eigenständige, lokal laufende Design-, Entscheidungs-, Vorschau- und QA-Umgebung**, mit der die App **TAKT V2.0**
(Flutter, Projekt unter `G:\Projekte\97_Uebernahme\TAKT-Merge-Git\`) **Ebene für Ebene, Modul für Modul, Feature für Feature**
gestaltet und entschieden wird. Kern ist der **Demo-Launcher**: die ganze App bedienbar in mehreren Versionen
(Kompakt · Visuell · Fokus · Meine Auswahl), auf dem Laptop nebeneinander oder auf dem Handy.

- Workbench: `app/index.html` · Demo-Launcher: `app/launcher.html` · Vorschau (Iframe/Direktlink): `app/preview.html`
- Start: `npm start` (http://127.0.0.1:4317) · Handy im WLAN: `npm run lan` (QR-Code im Launcher, Link enthält die WLAN-PIN)
- Live-Stand: `data/workbench.json` (+ Backups `data/backups/`, Feedback vom Handy `data/feedback.jsonl`)

## Harte Regeln (nicht verhandelbar)
1. **TAKT-Projekt (`TAKT-Merge-Git`) nur lesen.** Dort nichts überschreiben, zurücksetzen, stagen, stashen, committen, pushen.
   Keine produktiven Flutter-/Dart-Dateien ändern. Vor jeder Analyse: `git -C <pfad> status`, Branch, Commit dokumentieren.
   Bekannte lokale Änderungen dort: `android/version_code.state`, `_bau_apk_2026-09-27.ps1` – nicht anfassen.
2. **Die Workbench ist ein isolierter Arbeitsbereich** (eigener Ordner neben dem TAKT-Repo, empfohlen eigenes Git-Repo).
3. **Freigegebene Features sind gesperrt.** Freigabe-Snapshots nie ändern; Änderungen nur über „Neue Arbeitsversion“.
   Nicht per Datei-Edit an `data/workbench.json` vorbei an der Sperrlogik arbeiten.
4. **Entscheidungen trifft der Nutzer.** Claude bereitet vor (Empfehlung mit Begründung, `/takt-round-prep`), entscheidet aber
   nicht selbst über Richtung, Varianten, Grundsatzfragen oder Freigaben. Rundenlimit 2 respektieren.
5. **Design-Tokens nur in `app/src/design-system/tokens.js`.** Komponenten nutzen ausschließlich `var(--tk-…)`. Themes ändern nur Farben.
6. **Komponenten erfüllen `app/src/library/CONTRACT.md`** (inkl. Ergänzungen: `ctx.fmt/now/live/world/newId/mode/blockWidth`,
   `flutter`-Feld, CSS-Präfix je Bereich). IDs nie umbenennen. Sichtbare Änderung → `version` erhöhen (Drift-Erkennung).
7. **Eine Datenwelt:** geteilte Daten (Aufgaben, Termine, Buchungen, Notizen, Gewohnheiten …) liegen in `app/src/seed/world/`
   und werden per `'@world:<schlüssel>'` gebunden – nie kopieren. Eigentümer je Objekt: `docs/DATENWELT.md`.
   Konsistenz prüft `tests/world-invariants.test.mjs`.
8. **Leitlinien für Inhalte:** `docs/HEALTH_GUIDELINES.md` (Gesundheit), `docs/FINANCE_GUIDELINES.md` (Finanzen),
   `docs/TEXT_STIL.md` (Anrede „du“, Tonalität, echte Umlaute). `npm run check` prüft Begriffslisten und Umlaute.
9. **Nach jeder Code-Änderung:** `npm run check` (< 1 s) und `npm test` (~5 s). Nach Komponenten-/Layout-Änderungen zusätzlich
   `npm run qa:changed`. Vor Übergaben: `npm run qa` (inkl. 32 E2E-Tests).
10. **Keine neuen Abhängigkeiten/Build-Schritte ohne triftigen Grund** (Preact+htm vendored, kein Bundler, Server ohne Deps).

## Architektur in 60 Sekunden (Details: `ARCHITECTURE.md`)
```
app/src/
  design-system/  tokens.js (einzige Token-Quelle, 3 Themes, Schriftskalierung) · takt-base.css
  library/        registry.js · CONTRACT.md · ui.js (Primitive) · helpers.js (money/percent → lib/format.js) · components/<bereich>/
  preview/        runtime.js (Renderer + App-Player) · launchpad.js (App-Rahmen tabs/launchpad/fokus) · layouts.js · qa-probe.js
  core/           schema · directions (Versionen, Meine Auswahl, Rahmen) · process (Inbox, Gates, Tiers) · world (Szenarien)
                  seedpatch · workorder · spec · flutter · finmath · recurrence · health · preview-payload · versioning · impact
  seed/           index.js · catalog.js (Grundsatzfragen + Muster) · modules/*.js · world/*.js (Datenwelt)
  launcher/       Demo-Launcher (Versionen nebeneinander, Handy-Vollbild, Bewertung, Feedback)
  workbench/      store.js (EINZIGER Ort für Zustandsänderungen: actions.*; Konflikt-Rebase) · app.js · views/*
server.mjs        Statischer Server + /api/state (Revision/409) + Backups + /api/feedback (v2) + /api/network
tests/            Node-Tests (npm test)      qa/run-qa.mjs  Vertrag · E2E · Matrix · Regression      tools/  check, verify, Generatoren
```
**Kernideen:** Varianten sind **deklarativ** (`layout` + `blocks[]`) und tragen eine **Richtung** (= Version im Launcher).
Entscheidungen haben **Ebenen** (App/Muster/Modul/Feature) und laufen über **Runden** mit Zeitbox und Limit. Alles, was der
Nutzer in der Demo tut, wirkt über die **gemeinsame Welt** modulübergreifend.

## Typische Aufgaben – wie vorgehen
- **Arbeitsauftrag aus einer Entscheidungsrunde umsetzen:** `/takt-work-order <datei|latest>`.
- **Runde vorbereiten:** `/takt-round-prep [app|module:<id>]` – Belege (Launcher-Feedback, Scorecards, Abdeckung) + Empfehlung.
- **Phase 1 (echtes TAKT abgleichen):** `/takt-phase1` – nur lesen; Seed/Annahmen anpassen; Nutzer führt „Seed abgleichen …“ aus.
- **Neues Modul/Feature:** `docs/WORKER_BRIEF.md` (Pflichtprogramm: Startseite in 3 Richtungen, Navigation `to`, Welt-Datei mit
  `<modul>Summary/Search/Notifications`, Szenarien, Akzeptanzkriterien, Tier), Format `app/src/seed/SEED_FORMAT.md`,
  Feature-IDs in `docs/FEATURE_IDS.md` (neu erzeugen: `node tools/feature-ids.mjs`), `SEED_VERSION` erhöhen.
- **Neue Komponente:** `library/components/<bereich>/`, Vertrag + `example` + `flutter`, Galerie `#/library/<id>`,
  Katalog neu: `node --import ./tools/register.mjs tools/component-catalog.mjs`.
- **Design eines Features ändern:** in der Workbench (Design Studio) – der Seed ist nur Startinhalt.

## Befehle
```
npm start | npm run lan            npm run check | npm test | npm run verify
npm run qa                         Vertrag + E2E + Screenshot-Matrix + Regression → qa/results/latest.md
npm run qa:changed | qa:e2e | qa:scale | qa:scenarios | qa:baseline
npm run qa -- --feature <id> --all-variants --themes graphite,horizon,intensiv --scenario stress --env privacy --scale 2
node tools/work-order.mjs [--round latest|--feature a,b]      node tools/feature-ids.mjs
```

## Agenten (siehe `.claude/agents/`)
Für unabhängige Recherche/Prüfung Sub-Agenten (Modell Sonnet): `takt-analyst` (Phase 1), `takt-ux`, `takt-qa`, `takt-designsystem`,
`takt-architect`. Größere Ausbauten liefen als Workflows „Bau → unabhängige Prüfung“ mit getrennten Dateibereichen
(siehe `WORK_LOG.md`). Integration, Architekturentscheidungen und Qualitätskontrolle bleiben in der Hauptsession.
