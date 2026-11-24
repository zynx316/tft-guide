# TAKT Design Workbench

Der dauerhafte Designarbeitsplatz für **TAKT V2.0** – und die Basis, um die App **Ebene für Ebene, Modul für Modul** zu
entscheiden: Die ganze App läuft als bedienbare Demo in **mehreren Versionen** (Kompakt, Visuell, Fokus), auf dem Laptop
nebeneinander oder auf dem Handy. Bewerten, vergleichen, in einer **Entscheidungsrunde** festlegen, danach Feature für Feature
verfeinern, prüfen, **freigeben und einfrieren** – mit automatischer QA statt Dauertests am Smartphone.

## Starten
Voraussetzung: **Node.js 22 LTS oder neuer** (Windows, macOS, Linux; `node -v`). Ältere Versionen scheitern an Playwright und am Test-Loader.
```powershell
cd G:\Projekte\97_Uebernahme\TAKT_DESIGN_WORKBENCH
npm start                  # Workbench → http://127.0.0.1:4317
#   Demo-Launcher:           http://127.0.0.1:4317/launcher.html
npm run lan                # zusätzlich im WLAN erreichbar (Handy per QR-Code im Launcher, „Aufs Handy“; der Link enthält eine WLAN-PIN)
```
- Stand in `data/workbench.json` (+ Backups). Beim ersten Start lädt der Seed (Module, Features, Varianten: `docs/FEATURE_IDS.md`).
- Für Tests einmalig: `npm install` und `npx playwright install chromium`.

## Der Weg zur Entscheidung (empfohlen)
1. **Demo-Launcher öffnen** (`launcher.html`): Kompakt, Visuell und Fokus nebeneinander. Jede Version hat eigene Screens **und**
   einen eigenen App-Rahmen (Tab-Leiste · Launchpad mit Live-Kennzahlen · „Heute“ mit Erfassen-Knopf). Klicken ist gekoppelt.
   Werkzeugleiste: Gerät, Theme, Rahmen, **Szenario** (Alltag · Erster Start · Stress-Tag), Offline, Schrift 100–200 %,
   Beträge ausblenden, **Demo zurücksetzen**, Präsentation (P). Tasten: 1–3 Kompakt/Visuell/Fokus und 4 „Meine Auswahl“ ein-/ausblenden
   (Handy: Version wählen), T Theme durchschalten, R Hoch-/Querformat, B Beträge aus-/einblenden.
2. **Bewerten** je Version und Ebene (App · Modul · Feature): Sterne, Favorit, **fünf Kriterien** (Zeit bis zur Aktion, Einhand,
   Übersicht, Ruhe, trägt 20+ Module), Kommentar, „Übernehmen“. Vom Handy landen Bewertungen in der Workbench (Feedback).
3. **Workbench › App-Ebene:** Leitbild (Vision, Prinzipien, Gewichte, Favoriten, Rahmen), **Grundsatzfragen** (Persona,
   Datenhaltung, Modulumfang, Quellen …) und **Muster** (Navigation, Löschen, Formate …) – jede Frage mit begründeter Empfehlung.
4. **Entscheidungsrunde** (Workbench › Entscheidungsrunden): 5–7 Fragen nach Blockierwirkung, Zeitbox, Optionen mit
   Live-Vorschau, „Empfehlung übernehmen“, Parken mit Wiedervorlage. **Höchstens 2 Runden je Frage** – danach nur noch
   entscheiden oder parken. Ergebnis: **Arbeitsauftrag** für Claude Code (`/takt-work-order`).
5. **Modul für Modul:** Modul-Richtung (erbt die App-Richtung), Startseite, dann Features: Vergleich mit **Scorecard**,
   Anmerkungen, Akzeptanzkriterien, **Gates** (bereit/fertig), QA, Freigabe. Die Version **„Meine Auswahl“** zeigt jederzeit die
   App nach allen bisherigen Entscheidungen. Fahrplan in der Übersicht: **Ausbaustufen 1–4**.

## Aufbau der Oberfläche
| Bereich | Wofür |
|---|---|
| **Übersicht** | Fahrplan nach Ausbaustufen, nächste Schritte, **Entscheidungs-Inbox**, Qualität, Änderungen |
| **Demo & Entscheidung** | Versionen mit Abdeckung, Ebenen-Leiter (App-Richtung, Modul-Richtungen, Startseiten), Feedback-Eingang, Richtungen pflegen |
| **Entscheidungsrunden** | Runden starten, durchführen, abschließen, Arbeitsauftrag exportieren |
| **App-Ebene** | Leitbild · Inbox · Grundsätze & Muster · Gates & Fortschritt · Annahmen (Phase 1) |
| **Module / Features** | Cockpit je Modul; Feature-Browser mit Filtern nach Status, Tier und Richtung (Lücken) |
| **Feature-Workspace** | Übersicht (mit Gates, Tier, Anmerkungen) · Anforderungen (+ Akzeptanzkriterien) · Design · Vergleich (+ Scorecard) · Interaktionen (Navigation „führt zu“) · Demo-Daten · Qualität · Entscheidungen · Historie |
| **Design Studio** | Varianten gestalten (Layout, Blöcke, Props, Datenbindung), Vorschau mit Theme, Zustand, **Datenszenario**, „**In App** ansehen“ |
| **Komponenten** | Designsystem (Tokens, Themes, Kontrast-Audit), Galerie jeder Komponente, Verwendung, „Betroffene prüfen“ |
| **Versionen & Entscheidungen** | Freigaben, Versionen, Entscheidungslog, Änderungsprotokoll |
| **Quality Center** | Matrix, selektive Tests, CLI-Screenshots & Regression, Gerätetests |
| **Daten & Backup** | Speicherstatus, Export/Import, Backups, **Seed abgleichen** (sicher, mit Vorschau), Design-Tokens (JSON, Dart) |

Tastatur: **Strg+K** Suche · **Strg+Z / Strg+Umschalt+Z** · **Esc** · im Studio **Alt+Klick** wählt einen Block · im Launcher **P**.

## Qualitätssicherung
```powershell
npm run check          # statisch: Syntax, Seed, Navigationsgraph, Leitlinien-Begriffe, Umlaute (< 1 s)
npm test               # 400 Node-Tests (~5 s): Kern, Welt/Szenarien, Seed-Patch, Format, Wiederholung, Gesundheit, Finanzmathe, Ziele, Einkauf, Dokumente
npm run qa             # Vertrag + 32 E2E-Bedientests + Screenshot-Matrix + Pixel-Regression → qa/results/latest.md
npm run qa:changed     # nur betroffene Features
npm run qa -- --only visual --scenario erststart --env privacy,offline --scale 2   # Datenwelt/Umgebung in der Matrix
npm run verify         # check → test (→ qa:changed mit --full)
```
Die QA-Sonde prüft je Viewport/Theme/Zustand: Render-Fehler, fehlende Blöcke, Überlauf, Abschneiden, Touch-Ziele, Kontrast,
Bilder, **Namen von Bedienelementen**, **Beträge im Privatsphäre-Modus**, **Pflichthinweis des Moduls** (Feld `legal`) und
**Geldformat** (Beträge nur über `money()`). `npm run check` prüft das Feld `legal` zusätzlich statisch. Echte Smartphones nur an Meilensteinen
(`docs/GERAETETEST.md`, Pflicht für Tier-1-Freigaben).

## Mit Claude Code arbeiten
`CLAUDE.md` lädt automatisch. Befehle: `/takt-start` (Lage), `/takt-phase1` (echtes TAKT-Projekt nur lesend abgleichen),
`/takt-round-prep` (Runde mit Belegen vorbereiten), `/takt-work-order` (Arbeitsauftrag umsetzen), `/takt-spec` (Umsetzungsvorlagen), `/takt-feature <id>`,
`/takt-qa`, `/takt-review`. Leitlinien für Inhalte: `docs/HEALTH_GUIDELINES.md`, `docs/FINANCE_GUIDELINES.md`,
`docs/TEXT_STIL.md`, `docs/DATENWELT.md`. Neue Module: `docs/WORKER_BRIEF.md`, `app/src/seed/SEED_FORMAT.md`.

## Export, Backup, Übertragung
Export/Import (JSON, mit Prüfung und Sicherung), automatische Backups (`data/backups/`), **Seed abgleichen** übernimmt neue
Seed-Stände ohne eigene Arbeit zu überschreiben, Design-Tokens als JSON und als Dart (`ThemeExtension`) für Flutter,
Feature-Spezifikation als Markdown (je Feature/Modul) und **für Flutter maschinenlesbar**: `npm run spec [-- --released]`
schreibt `export/spec/` (JSON `takt-feature-spec/1` je Feature mit `specHash`, Routentabelle, deterministisches Manifest);
`npm run spec:check` zeigt, welche Features sich seit dem letzten Export geändert haben.

## Weiterführend
`HANDOFF.md` (Stand & Übergabe) · `TASKS.md` · `ARCHITECTURE.md` · `DESIGN_SYSTEM.md` · `QA_REPORT.md` · `WORK_LOG.md` ·
`docs/BAUPLAN.md` (Bauplan Basis v1) · `docs/FEATURE_IDS.md` · `docs/MISSION.md`.
