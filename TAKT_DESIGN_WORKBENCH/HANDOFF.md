# Übergabe – TAKT Design Workbench (Stand 24.11.2026, Nacht-Session)

## Kurzfassung
Die Workbench ist **lauffähig, getestet und dokumentiert**. Sie bildet 12 Module, 60 Features und 57 interaktive Designvarianten
ab, setzt Varianten deklarativ aus 45 Bibliothekskomponenten zusammen und rendert sie in echten Gerätebreiten. Dazu kommen
Themes über zentrale Tokens, Versionierung mit Freigabe und Sperre, ein Entscheidungslog und automatisierte QA in der
Oberfläche und per CLI. Gespeichert wird in eine Datei mit Backups, Export und Import.

**Nicht erledigt, weil technisch unmöglich:** Die Bestandsaufnahme des echten TAKT-Projekts (Phase 1). Die Cloud-Umgebung hatte
keinen Zugriff auf `G:\`. Die Module und Features stammen deshalb aus dem Auftrag und sind als „zu verifizieren“ markiert.
Das ist die erste Aufgabe zuhause (`/takt-phase1`).

## 1. Auf den eigenen Rechner holen (Windows, PowerShell)
Die Dateien liegen im GitHub-Repo **`zynx316/tft-guide`**, Branch **`ccr-95570849-lkvyto`**, Ordner **`TAKT_DESIGN_WORKBENCH/`**.
Das Repo dient nur als Transportweg; die Workbench gehört dort fachlich nicht hin.

**Variante A – per Git:**
```powershell
cd G:\Projekte\97_Uebernahme
git clone --depth 1 --branch ccr-95570849-lkvyto https://github.com/zynx316/tft-guide.git _wb_transfer
robocopy _wb_transfer\TAKT_DESIGN_WORKBENCH TAKT_DESIGN_WORKBENCH /E
Remove-Item -Recurse -Force _wb_transfer
```
**Variante B – ohne Git:** GitHub öffnen, Branch `ccr-95570849-lkvyto` wählen, dann „Code › Download ZIP“. Den Ordner
`TAKT_DESIGN_WORKBENCH` nach `G:\Projekte\97_Uebernahme\` entpacken.

> Den Ordner **neben** `TAKT-Merge-Git` ablegen, **nicht hinein**. Das TAKT-Repo bleibt unberührt.

## 2. Einrichten & starten
```powershell
cd G:\Projekte\97_Uebernahme\TAKT_DESIGN_WORKBENCH
git init; git add .; git commit -m "TAKT Design Workbench – Übernahme"   # optional, empfohlen: eigenes Repo
npm install                         # playwright, pixelmatch, pngjs (nur für die CLI-QA)
npx playwright install chromium     # Browser für die CLI-QA
npm start                           # Workbench öffnet sich unter http://127.0.0.1:4317
```
Danach **Claude Code im selben Ordner starten** (`claude`). Es lädt `CLAUDE.md` automatisch, außerdem die Slash-Commands
(`.claude/commands/`) und die Agenten (`.claude/agents/`). Als Erstes **`/takt-start`** aufrufen, dann **`/takt-phase1`**.

Erster QA-Lauf auf dem neuen Rechner: `npm run qa`. Er erzeugt die Referenzbilder (Baselines) für diesen Rechner. Baselines
sind wegen der Schriftdarstellung maschinenspezifisch und deshalb nicht im Transport enthalten.

## 3. Abdeckung des Auftrags (docs/MISSION.md)
| Auftrag | Stand | Wo / Nachweis |
|---|---|---|
| §3 Bestand untersuchen, Git-Sicherheit | **Offen** (kein Zugriff auf G:\) | `docs/PHASE1_BESTANDSAUFNAHME.md`, `/takt-phase1`, Git-Sperren in `.claude/settings.json` |
| §4 Worker/Sub-Agents (Sonnet) | Umgesetzt mit 4 Sub-Agenten (A/B/C: Module & Komponenten, G: Architekturprüfung), Sonnet, normaler Effort | WORK_LOG.md; für zuhause `.claude/agents/*` mit `model: sonnet`, `effort: high` |
| §5 Navigation A–G | Umgesetzt (Übersicht, Module/Cockpit, Features, Design Studio, Komponenten, Versionen & Entscheidungen, Quality Center, plus Daten & Backup) | E2E „Navigation“ |
| §6 Module/Features flexibel | Anlegen, Umbenennen, Sortieren (Drag & Drop), Archivieren, Löschen, Duplizieren, Verschieben, Gruppieren, Status, Verknüpfen, Aufteilen, Zusammenführen | E2E-Tests für Modul, Feature, Löschen/Undo |
| §7 Feature-Workspace (11 Punkte) | 9 Tabs decken alle 11 Punkte ab (Viewports und Preview liegen in „Design“ und „Übersicht“) | README |
| §8 Varianten & Vergleich | Bis zu 3 bedienbare Varianten nebeneinander, gemeinsamer Viewport, Theme und Zustand, Strukturunterschiede, Bevorzugen mit Begründung | E2E „Vergleich“, calendar.week A/B/C |
| §9 Designsystem | Tokens (eine Quelle), 3 Themes mit Kontrast-Audit, 45 Komponenten, App-Shell | DESIGN_SYSTEM.md, Komponenten-Bereich |
| §10 Freigabe & Einfrieren | 7 Status, Checkliste, Snapshot (inkl. QA, Entscheidungen, Komponentenversionen), Sperre, neue Arbeitsversion, Historie, Diff, Wiederherstellen | E2E „Freigabe“, „Sperrregeln“ |
| §11 Flexibilität ohne Chaos | Regeln technisch durchgesetzt (Sperre, zentrale Komponenten, selektive Tests, Drift-Erkennung) | ARCHITECTURE.md §8–9 |
| §12 QA | Sonde mit 7 Prüfungen, Viewports 1440/1280/1024/768/390 plus 360, E2E, Screenshots, Pixel-Regression, selektiv (`--changed`, Abhängigkeitsanalyse), Gerätetest-Meilensteine | QA_REPORT.md |
| §13 Persistenz, Backup, Export | Datei plus Browser-Speicher, Revisionen und Konflikterkennung, automatische Backups, Export/Import, Seed-Abgleich | E2E „Persistenz“, „Export/Import“ |
| §14 Architektur | Modular und schlank, geprüft und nachgebessert | ARCHITECTURE.md §11 |
| §18 Dateien A–H | Alle vorhanden | Ordnerübersicht unten |

## 4. Ehrliche Einschränkungen
- **Phase 1 fehlt.** Module und Features sind Annahmen aus dem Auftrag. Theme-Farben sind ein eigener Entwurf und nicht
  mit Flutter abgeglichen. Fitness und Finanzen sind nur als Referenz-Platzhalter angelegt; die echten Konzepte liegen auf G:\.
- **Effort der Sub-Agenten:** Sonnet mit normalem Effort. Getrennte Worker-Sessions mit Effort „High“ wurden in dieser Umgebung
  nicht gestartet (siehe WORK_LOG).
- **Neue Komponenten entstehen im Code**, nicht in der Oberfläche. Varianten, Layouts, Props, Daten, Anforderungen und alles
  übrige lassen sich in der Oberfläche bearbeiten.
- **Grenzen des deklarativen Modells:** keine verschachtelten Container, keine Props je Breakpoint, Interaktionen nur beschreibend
  (siehe TASKS.md §3).
- **Skalierung:** Der gesamte Zustand liegt in einer JSON-Datei (Seed ca. 0,9 MB). Bei sehr vielen Versionen sollten Snapshots
  ausgelagert werden (TASKS.md §3).
- **Flutter-Export:** bisher nur ein Roh-Token-JSON. Komponenten-Mapping und Feature-Spezifikation sind offen (TASKS.md §4).
- **Echte Smartphones:** nicht getestet (kein Gerät). Vorgesehen sind Meilenstein-Tests über `npm run lan`.

## 5. Nächste konkrete Schritte
1. Übernahme und Start nach §1 und §2, dann `npm run qa` auf dem eigenen Rechner.
2. **`/takt-phase1`**: das TAKT-Projekt nur lesend analysieren, Seed und Theme-Farben angleichen, „Neue Seed-Inhalte übernehmen“.
3. Erstes Modul (Vorschlag: Kalender) durchziehen: Varianten der Wochenansicht vergleichen und entscheiden, QA, Freigabe,
   danach der Gerätetest-Meilenstein.
4. Danach die P2-Aufgaben aus TASKS.md (Skalierung, Library-Vereinheitlichung, Flutter-Mapping) nach Bedarf.

## 6. Ordnerübersicht
```
TAKT_DESIGN_WORKBENCH/
  CLAUDE.md  HANDOFF.md  TASKS.md  WORK_LOG.md  README.md  ARCHITECTURE.md  DESIGN_SYSTEM.md  QA_REPORT.md
  package.json  server.mjs  .gitignore
  app/ (index.html, preview.html, vendor/, src/)      qa/ (run-qa.mjs, baselines/, results/)      tools/check.mjs
  data/ (workbench.json entsteht beim Start)          docs/ (MISSION.md, PHASE1_BESTANDSAUFNAHME.md, examples/)
  .claude/ (settings.json, commands/, agents/)
```
