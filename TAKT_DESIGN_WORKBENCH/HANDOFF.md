# Übergabe – TAKT Design Workbench (Stand 24.11.2026, nach Session 2 „V2 – beste Basis“)

## Kurzfassung
Die Workbench ist eine **vollständige Entscheidungs- und Designumgebung** für TAKT V2.0:
- **Demo-Launcher:** die ganze App bedienbar in **drei Versionen** (Kompakt mit Tab-Leiste · Visuell mit Launchpad · Fokus mit
  Erfassen-Knopf) plus „Meine Auswahl“, auf dem Laptop nebeneinander (gekoppelte Navigation) oder auf dem Handy im Vollbild.
  Szenarien (Alltag, Erster Start, Stress-Tag), Offline, Schrift bis 200 %, Beträge ausblenden, Bewertung mit fünf Kriterien.
- **16 Module** mit Startseite in drei Richtungen und echten Navigationswegen, gemeinsame **Datenwelt** (eine Persona, ein Tag,
  alle Zahlen konsistent und getestet): Start, Kalender, Aufgaben, Gewohnheiten, Notizen, Wissensdatenbank, Picture to Text,
  Sales, **Finanzen, Sparpläne, Trading, Fitness, Ernährung, Wetter**, TAKT Kern (Suche, Mitteilungen, Erfassen), Einstellungen.
  Zahlen: `docs/FEATURE_IDS.md` und `docs/KOMPONENTEN.md` (automatisch erzeugt).
- **Entscheiden ohne Endlosschleifen:** App-Ebene (Leitbild, 11 Grundsatzfragen, 20 Muster – jeweils mit begründeter
  Empfehlung), Entscheidungs-Inbox nach Blockierwirkung, **Entscheidungsrunden** mit Zeitbox und Rundenlimit 2, Gates
  (bereit/fertig), Scorecard, Arbeitsauftrag für Claude Code.
- **Qualität:** `npm run check` (< 1 s), `npm test` (~275 Node-Tests), `npm run qa` (Vertrag, 32 E2E-Tests, Screenshot-Matrix,
  Regression), QA-Sonde mit 9 Prüfungen inkl. Barrierefreiheit und Privatsphäre. Leitlinien für Gesundheit, Finanzen und Text.

**Nicht erledigt, weil technisch unmöglich:** Phase 1 (Abgleich mit dem echten TAKT-Projekt auf `G:\`) – die Cloud-Umgebung hat
keinen Zugriff. Module/Features sind Annahmen (Annahmen-Register in der Workbench). Erste Aufgabe zuhause: `/takt-phase1`.

## 1. Auf den eigenen Rechner holen (Windows, PowerShell)
Repo **`zynx316/tft-guide`**, Branch **`ccr-95570849-lkvyto`**, Ordner **`TAKT_DESIGN_WORKBENCH/`** (das Repo ist nur Transportweg).
```powershell
cd G:\Projekte\97_Uebernahme
git clone --depth 1 --branch ccr-95570849-lkvyto https://github.com/zynx316/tft-guide.git _wb_transfer
robocopy _wb_transfer\TAKT_DESIGN_WORKBENCH TAKT_DESIGN_WORKBENCH /E
Remove-Item -Recurse -Force _wb_transfer
```
Ohne Git: GitHub › Branch wählen › „Code › Download ZIP“, Ordner `TAKT_DESIGN_WORKBENCH` entpacken.
> Den Ordner **neben** `TAKT-Merge-Git` ablegen, **nicht hinein**. Das TAKT-Repo bleibt unberührt.

**Hattest du die Workbench (Session 1) schon in Gebrauch?** Dann nach dem Kopieren in der Workbench **Daten & Backup ›
„Seed abgleichen …“** ausführen: Neues kommt hinzu, von dir unveränderte Features werden aktualisiert (vorher gesichert),
Freigegebenes bleibt unberührt (erscheint als „Seed-Vorschlag“). Ohne eigene Arbeit: einfach „Zurücksetzen“ (Backup entsteht).

## 2. Einrichten & starten
```powershell
cd G:\Projekte\97_Uebernahme\TAKT_DESIGN_WORKBENCH
git init; git add .; git commit -m "TAKT Design Workbench – Übernahme"   # optional, empfohlen
npm install; npx playwright install chromium                            # nur für Tests
npm start                       # Workbench → http://127.0.0.1:4317 · Launcher → /launcher.html
npm run check; npm test; npm run qa                                     # erzeugt Baselines für diesen Rechner
```
Danach **Claude Code im Workbench-Ordner starten** (`claude`). Nach der Bestätigung „Ordner vertrauen“ gibt ein SessionStart-Hook
automatisch die Kurzlage aus (Live-Stand, offene Entscheidungen, nächste Aufgaben); **`/takt-start`** liefert die ausführliche Lage.
Handy: `npm run lan`, im Launcher „Aufs Handy“ → QR-Code (gleiches WLAN, Windows-Firewall für Node erlauben). Der QR-Link enthält
eine WLAN-PIN (neu bei jedem Start, in der Konsole angezeigt); andere Geräte im Netz kommen ohne sie nicht an die Daten.

## 3. Empfohlener Ablauf zuhause
1. **`/takt-phase1`** – echtes TAKT-Projekt nur lesend abgleichen, Seed/Persona/Theme-Farben angleichen, Annahmen-Register
   pflegen, „Seed abgleichen …“.
2. **Demo-Launcher** öffnen, die drei Versionen am Laptop und am Handy bedienen und bewerten (Sterne + Kriterien).
3. **`/takt-round-prep app`** – Claude bereitet die erste Runde mit Belegen vor. Dann **Workbench › Entscheidungsrunden ›
   Neue Runde (App-Ebene)**: App-Richtung, Grundsatzfragen, wichtigste Muster in ~20 Minuten.
4. **Arbeitsauftrag** der Runde exportieren → **`/takt-work-order`**.
5. Modul für Modul (Fahrplan: Ausbaustufen in der Übersicht): Modul-Richtung, Startseite, Tier-1-Features mit Scorecard,
   QA, Freigabe; Gerätetest bei Tier 1 (`docs/GERAETETEST.md`).

## 4. Abdeckung des Auftrags
| Auftrag | Stand | Nachweis |
|---|---|---|
| Mission §3 Bestand untersuchen | **Offen** (kein Zugriff auf G:\) | `/takt-phase1`, Annahmen-Register |
| Mission §4–§18 (Workbench, Varianten, Vergleich, Themes, Komponenten, Freigabe, QA, Persistenz, Doku) | Umgesetzt (Session 1), in Session 2 erweitert | README, ARCHITECTURE, QA_REPORT |
| Folgewunsch: alles Notwendige ergänzen, beste Basis | Bauplan aus 7 Perspektiven + 2 Kritiken, umgesetzt in 5 Workflows | `docs/BAUPLAN.md`, WORK_LOG |
| Demo-Launcher, mobil, Versionen am Laptop vergleichen, entscheiden | Umgesetzt (Rahmen je Version, Bewertung, Übernehmen, Handy, QR) | E2E Launcher-Tests |
| Ebene für Ebene, Modul für Modul | Ebenenmodell, App-Ebene, Runden, Gates, Ausbaustufen, Meine Auswahl | Workbench › App-Ebene, Runden |
| Finanzen, Trading, Sparpläne, Wetter, Ernährung, Fitness | Vollwertige Module mit 3 Richtungen, Leitlinien, getesteter Mathematik | Prüfurteile „gut“ bis „erstklassig“ |
| Alles am Ende | 16 Module in einer Datenwelt, Suche/Mitteilungen/Erfassen modulübergreifend | Invarianten-Tests |

## 5. Ehrliche Einschränkungen
- **Phase 1 fehlt** (siehe oben). Persona, Module, Theme-Farben sind Annahmen. Gesundheits-, Finanz- und Steuertexte sind
  fachlich nicht geprüft (Grundsatzfrage „Rechtsprüfung“).
- **Echtes Smartphone nicht getestet** (kein Gerät in der Cloud). Über LAN-HTTP gibt es keinen Service Worker (ADR-001).
- **Simulationen:** Radar, Barcode-Scan, Texterkennung, Kurse, Orders sind simuliert; Datenquellen sind eine offene
  Grundsatzfrage.
- **Workbench-Zustand** liegt in einer JSON-Datei (~1,8 MB); Rückgängig teilt Speicher strukturell. Offene Skalierungsmaßnahme
  (Versions-Snapshots je Feature auslagern) steht in TASKS.md.
- Restpunkte aus den Prüfungen und der Vollständigkeitsprüfung: **TASKS.md**.

## 6. Ordnerübersicht
```
TAKT_DESIGN_WORKBENCH/
  CLAUDE.md HANDOFF.md TASKS.md WORK_LOG.md README.md ARCHITECTURE.md DESIGN_SYSTEM.md QA_REPORT.md
  package.json server.mjs
  app/ index.html launcher.html preview.html manifest.webmanifest sw.js vendor/ src/
  tests/ (Node-Tests)   qa/ (run-qa.mjs, results/)   tools/ (check, verify, register, work-order, feature-ids, component-catalog)
  data/ (workbench.json, backups/, feedback.jsonl – entstehen beim Start)
  docs/ BAUPLAN FEATURE_IDS KOMPONENTEN DATENWELT PERSONA HEALTH_GUIDELINES FINANCE_GUIDELINES TEXT_STIL ADR-001 ADR-002
        GERAETETEST WORKER_BRIEF MISSION PHASE1_BESTANDSAUFNAHME brainstorm/ work-orders/
  .claude/ settings.json commands/ agents/
```
