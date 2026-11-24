# Übergabe – TAKT Design Workbench (Stand 24.11.2026, Ende Session 2 „V2 – beste Basis“)

## Kurzfassung
Die Workbench ist eine **vollständige Entscheidungs- und Designumgebung** für TAKT V2.0:
- **Demo-Launcher:** die ganze App bedienbar in **drei Versionen** (Kompakt mit Tab-Leiste · Visuell mit Launchpad · Fokus mit
  Erfassen-Knopf) plus „Meine Auswahl“, auf dem Laptop nebeneinander (gekoppelte Navigation) oder auf dem Handy im Vollbild.
  Szenarien (Alltag, Erster Start, Stress-Tag), Offline, Schrift bis 200 %, Beträge ausblenden, Bewertung mit fünf Kriterien.
- **19 Module** mit Startseite in drei Richtungen und echten Navigationswegen, gemeinsame **Datenwelt** (eine Persona, ein Tag,
  alle Zahlen konsistent und getestet): Start, Kalender, Aufgaben, Gewohnheiten, **Ziele**, **Einkauf & Haushalt**, Notizen,
  Wissensdatenbank, Picture to Text, **Dokumente & Verträge**, Sales, **Finanzen, Sparpläne, Trading, Fitness, Ernährung, Wetter**,
  TAKT Kern (Suche, Mitteilungen, Erfassen), Einstellungen.
  Zahlen (Seed 2026-11-24.8): 197 Features, 348 Varianten, 296 Komponenten; alle 49 Tier-1-Features in allen drei Richtungen.
  Listen: `docs/FEATURE_IDS.md` und `docs/KOMPONENTEN.md` (automatisch erzeugt).
- **Entscheiden ohne Endlosschleifen:** App-Ebene (Leitbild, 11 Grundsatzfragen, 20 Muster – jeweils mit begründeter
  Empfehlung), Entscheidungs-Inbox nach Blockierwirkung, **Entscheidungsrunden** mit Zeitbox und Rundenlimit 2, Gates
  (bereit/fertig), Scorecard, Arbeitsauftrag für Claude Code.
- **Qualität:** `npm run check` (< 1 s, 0 Fehler/0 Hinweise), `npm test` (400 Node-Tests), `npm run qa` (Vertrag 0/0, 32 E2E-Tests,
  Screenshot-Matrix, Regression), QA-Sonde mit 11 Prüfungen inkl. Barrierefreiheit, Privatsphäre, Pflichthinweis und Geldformat.
  Alle 348 Varianten sind bei **Schrift 200 %** (390/360/1440 px) ohne abgeschnittene Texte oder zeichenweise Umbrüche.
  Leitlinien für Gesundheit, Finanzen und Text.
- **Ruhiger Erststart:** Szenario „Erster Start“ zeigt auf allen Startseiten Einladungen statt leerer Kennzahlen (Blockbedingungen
  `hideWhenEmpty`/`showWhenEmpty`, `quietEmpty` – siehe `app/src/library/CONTRACT.md`).

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

**Wichtig nach jedem Kopieren/Pull, wenn schon eine `data/workbench.json` existiert:** in der Workbench **Daten & Backup ›
„Seed abgleichen …“** ausführen. Sonst fehlen im gespeicherten Stand neue Module, Varianten und Bindungen (der Launcher zeigt
dann den alten Stand). Neues kommt hinzu, von dir unveränderte Features werden aktualisiert (vorher gesichert), Freigegebenes
bleibt unberührt (erscheint als „Seed-Vorschlag“). Ohne eigene Arbeit: einfach „Zurücksetzen“ (vorher wird automatisch ein
Export heruntergeladen). Der
SessionStart-Hook weist darauf hin, wenn der Seed neuer ist als der Live-Stand.

## 2. Einrichten & starten
Voraussetzung: **Node.js 22 LTS oder neuer** (`node -v`; ältere Versionen scheitern an Playwright und am Test-Loader).
```powershell
cd G:\Projekte\97_Uebernahme\TAKT_DESIGN_WORKBENCH
git init; git add .; git commit -m "TAKT Design Workbench - Uebernahme"   # optional, empfohlen
npm install; npx playwright install chromium            # Playwright-Version ist per package-lock.json fest; Chromium nur für Tests
npm run check; npm test                                 # < 10 s: 0 Fehler/0 Hinweise, 400 Tests grün
npm run qa                                              # dauert länger (Vertrag, 32 E2E, Screenshot-Matrix) und legt die
                                                        # Baselines für diesen Rechner an
```
Danach in einem **eigenen Terminal** `npm start` (Workbench → http://127.0.0.1:4317 · Launcher → /launcher.html; der Server
läuft im Vordergrund, Strg+C beendet ihn). `npm run qa` braucht den laufenden Server nicht, es startet einen eigenen.
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
| Alles am Ende | 19 Module (alle des Bauplans) in einer Datenwelt, Suche/Mitteilungen/Erfassen modulübergreifend | Invarianten-Tests |

## 5. Ehrliche Einschränkungen
- **Phase 1 fehlt** (siehe oben). Persona, Module, Theme-Farben sind Annahmen. Gesundheits-, Finanz- und Steuertexte sind
  fachlich nicht geprüft (Grundsatzfrage „Rechtsprüfung“).
- **Echtes Smartphone nicht getestet** (kein Gerät in der Cloud). Über LAN-HTTP gibt es keinen Service Worker (ADR-001).
- **Simulationen:** Radar, Barcode-Scan, Texterkennung, Kurse, Orders sind simuliert; Datenquellen sind eine offene
  Grundsatzfrage.
- **Workbench-Zustand** liegt in einer JSON-Datei (`data/workbench.json`, ~3 MB eingerückt, Seed-Stand rund 2 MB kompakt); Rückgängig teilt Speicher strukturell. Offene Skalierungsmaßnahme
  (Versions-Snapshots je Feature auslagern) steht in TASKS.md.
- **Abgeleitete Welt-Werte** (Zusammenfassungen, Start-Untertitel, Hinweiskarten) werden beim Laden berechnet und folgen
  Änderungen in der Demo erst nach Neuladen.
- Restpunkte aus den Prüfungen und der Vollständigkeitsprüfung: **TASKS.md**.

## 5a. Vorbereitete, offene Entscheidungen (du entscheidest)
Alle liegen mit Empfehlung in der Workbench (Entscheidungs-Inbox, App-Ebene) bzw. in `TASKS.md`; nichts davon ist vorentschieden:
- **App-Richtung** (Kompakt · Visuell · Fokus · Mischung) und die 11 Grundsatzfragen – erste Runde mit `/takt-round-prep app`.
- **Privatsphäre-Ausnahmen:** welche Werte bei „Beträge ausblenden“ sichtbar bleiben (Anteile, Kurse, Sparziel-%).
- **Einkaufsliste:** gehört sie Ernährung oder „Einkauf & Haushalt“ (`shopping.list`)?
- **Dokumente:** Modulsperre für sensible Module (Schalter ist da, Standard aus), Erinnerungsstufen, Verknüpfung Abo → Vertrag
  („Vorlage“ ist als Vorschlag gebaut).
- **Große Schrift:** sollen die Reiter der unteren Leiste bei 200 % nur Symbole zeigen?
- **Rechtsprüfung** der Gesundheits-, Finanz-, Steuer- und Gewährleistungstexte vor einer Veröffentlichung.

## 6. Ordnerübersicht
```
TAKT_DESIGN_WORKBENCH/
  CLAUDE.md HANDOFF.md TASKS.md WORK_LOG.md README.md ARCHITECTURE.md DESIGN_SYSTEM.md QA_REPORT.md
  package.json server.mjs
  package-lock.json .gitattributes (LF-Zeilenenden auch unter Windows)
  app/ index.html launcher.html preview.html manifest.webmanifest sw.js icon.svg vendor/ src/
  tests/ (Node-Tests)   qa/ (run-qa.mjs, baselines/; results/ entsteht beim ersten QA-Lauf)
  tools/ (check, verify, register, work-order, feature-ids, component-catalog, export-spec, session-brief, test-finmath)
  data/ (workbench.json entsteht beim ersten Öffnen im Browser, backups/; feedback.jsonl beim ersten Launcher-Feedback)
  docs/ BAUPLAN BAUPLAN_STATUS BAUPLAN_PAKETE.json FEATURE_IDS KOMPONENTEN DATENWELT PERSONA HEALTH_GUIDELINES
        FINANCE_GUIDELINES TEXT_STIL ADR-001 ADR-002 GERAETETEST WORKER_BRIEF MISSION PHASE1_BESTANDSAUFNAHME brainstorm/
        examples/ work-orders/ (wird bei Bedarf angelegt)
  .claude/ settings.json commands/ agents/
```
