# TAKT Design Workbench – Projektkontext für Claude Code

> Diese Datei lädt Claude Code automatisch. **Beim Sessionstart zuerst lesen:** `HANDOFF.md` (aktueller Stand),
> `TASKS.md` (offene Aufgaben, priorisiert) und das Ende von `WORK_LOG.md`. Der vollständige Original-Auftrag
> steht in `docs/MISSION.md`. Slash-Commands: `/takt-start`, `/takt-phase1`, `/takt-feature <id>`, `/takt-qa`, `/takt-review`.

## Was ist das?
Eine **eigenständige, lokal laufende Design-, Konzeptions-, Vorschau- und QA-Umgebung**, mit der die App **TAKT V2.0**
(Flutter, Projekt unter `G:\Projekte\97_Uebernahme\TAKT-Merge-Git\`) **Modul für Modul und Feature für Feature**
gestaltet wird – ohne Wegwerf-HTML-Prototypen, ohne endlose Designrunden, mit Freigaben, Historie und automatisierter QA.

- Workbench-UI: `app/index.html` · TAKT-Vorschau (Iframe): `app/preview.html`
- Start: `npm start` (öffnet http://127.0.0.1:4317) · ohne npm: `node server.mjs --open`
- Daten (Live-Stand): `data/workbench.json` (+ automatische Backups `data/backups/`)

## Harte Regeln (nicht verhandelbar)
1. **TAKT-Projekt (`TAKT-Merge-Git`) nur lesen.** Dort nichts überschreiben, zurücksetzen, stagen, stashen, committen, pushen.
   Keine produktiven Flutter-/Dart-Dateien ändern. Vor jeder Analyse: `git -C <pfad> status`, Branch, Commit dokumentieren.
   Bekannte lokale Änderungen dort (Stand früherer Prüfungen): `android/version_code.state`, `_bau_apk_2026-09-27.ps1` – nicht anfassen.
2. **Die Workbench ist ein isolierter Arbeitsbereich** (eigener Ordner, empfohlen eigenes Git-Repo daneben – nicht im TAKT-Repo).
3. **Freigegebene Features sind gesperrt.** Nie den Freigabe-Snapshot ändern; Änderungen nur über „Neue Arbeitsversion“.
   Nicht per Datei-Edit an `data/workbench.json` vorbei an der Sperrlogik arbeiten.
4. **Design-Tokens nur in `app/src/design-system/tokens.js`.** Komponenten nutzen ausschließlich `var(--tk-…)`. Themes ändern nur Farben.
5. **Neue/änderte Komponenten erfüllen `app/src/library/CONTRACT.md`.** Komponenten-IDs nie umbenennen. Bei sichtbarer
   Änderung `version` der Komponente erhöhen (Drift-Erkennung für freigegebene Features).
6. **Deutsche UI-Texte mit echten Umlauten (ä ö ü ß).** `npm run check` meldet ae/oe/ue-Umschreibungen.
7. **Nach jeder Code-Änderung:** `npm run check` (statisch, < 1 s). Nach Komponenten-/Layout-Änderungen zusätzlich
   `npm run qa:changed` (nur betroffene Features). Vor Übergaben/Meilensteinen: `npm run qa`.
8. **Keine neuen Abhängigkeiten/Build-Schritte ohne triftigen Grund.** (Preact+htm sind vendored, kein Bundler, Server ohne Deps.)

## Architektur in 60 Sekunden (Details: `ARCHITECTURE.md`)
```
app/src/
  design-system/  tokens.js (EINZIGE Token-Quelle, 3 Themes, Kontrast-Audit) · takt-base.css (Primitive, App-Shell, Layouts)
  library/        registry.js · CONTRACT.md · ui.js (Primitive) · helpers.js · components/{core,calendar,tasks,content,insights}/
  preview/        runtime.js (Iframe-Renderer) · layouts.js (stack|split|sidebar|grid|tabs) · qa-probe.js (QA-Sonde, auch CLI)
  core/           schema.js (Datenmodell, Migration) · versioning.js (Snapshots, Freigabe-Checkliste, Diff) · impact.js (Komponente→Features)
                  devices.js (Viewports) · preview-payload.js
  workbench/      store.js (EINZIGER Ort für Zustandsänderungen: actions.*) · app.js (Shell/Routing) · views/* · ui/kit.js
  seed/           index.js + modules/*.js (Startinhalt je Modul, Format: SEED_FORMAT.md)
server.mjs        Statischer Server + /api/state (Datei, Revision/Konflikt 409) + Backups – keine Abhängigkeiten
qa/run-qa.mjs     CLI-QA: Vertrag · E2E (24 Tests) · Screenshot-Matrix · Pixel-Regression (Baselines in qa/baselines/)
tools/check.mjs   Statische Schnellprüfung
```
**Kernidee:** Eine Designvariante ist **deklarativ**: `layout` + `blocks[]` (Komponente, Region, Props, Datenbindung, hideOn).
Komponenten sind interaktiv (Dialoge, Filter, Drag & Drop) und teilen Vorschau-Daten/-UI-Zustand. Verbessert man eine
Komponente, profitieren alle Varianten – und `impact.js` weiß, welche Features neu geprüft werden müssen.

## Typische Aufgaben – wie vorgehen
- **Neues Modul/Feature aus dem echten TAKT übernehmen:** in `app/src/seed/modules/<id>.js` (Format `SEED_FORMAT.md`), Manifest in
  `seed/index.js` eintragen, `SEED_VERSION` erhöhen → in der Workbench „Daten & Backup › Neue Seed-Inhalte übernehmen“
  (verändert bestehende Arbeit nicht). Alternativ direkt in der Workbench-UI anlegen.
- **Neue Komponente:** Datei in `library/components/<bereich>/`, im `index.js` des Bereichs exportieren, Vertrag einhalten,
  `example` pflegen, in der Library-Galerie prüfen (`#/library/<id>`), `npm run check` + `npm run qa -- --component <id>`.
- **Design eines Features ändern:** in der Workbench (Design Studio) – nicht im Seed, sobald der Nutzer damit arbeitet
  (Live-Daten liegen in `data/workbench.json`). Seed ist nur Startinhalt.
- **Token/Theme ändern:** `tokens.js` → `npm run qa` (globale Änderung = alle Features), Theme-Audit im Quality Center.
- **Flutter-Bezug:** Tokens-Export (`Daten & Backup › Design-Tokens exportieren`) ist Basis für ThemeData-Mapping (siehe TASKS.md).

## Umgebung & Befehle (Windows/PowerShell oder Git Bash)
```
npm install                      # einmalig: playwright, pixelmatch, pngjs (nur für CLI-QA)
npx playwright install chromium  # einmalig
npm start                        # Workbench + Datei-Persistenz, öffnet Browser
npm run lan                      # Vorschau im WLAN (Handy-Test), Schreiben nur lokal
npm run check                    # statisch
npm run qa                       # alles (Vertrag, E2E, Screenshots, Regression) → qa/results/latest.md
npm run qa:changed               # nur seit letztem Lauf geänderte Komponenten
npm run qa -- --feature calendar.week --all-variants --themes graphite,horizon,intensiv
npm run qa:baseline              # Referenzbilder bewusst neu setzen (z. B. nach gewollter Änderung)
```

## Agenten (siehe `.claude/agents/`)
Für unabhängige Recherche/Prüfung Sub-Agenten nutzen (Modell Sonnet): `takt-analyst` (Phase 1, TAKT-Projekt lesen),
`takt-ux`, `takt-qa`, `takt-designsystem`, `takt-architect` (kritische Prüfung). Architekturentscheidungen, Integration
und Qualitätskontrolle bleiben in der Hauptsession. Agenten bekommen eigene Dateibereiche (keine parallelen Edits derselben Datei).
