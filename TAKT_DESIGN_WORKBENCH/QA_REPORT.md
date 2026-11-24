# QA-Bericht – TAKT Design Workbench

Stand: 24.11.2026, Ende Session 2 („V2 – beste Basis“) · Umgebung: Linux-Container, Chromium (Playwright), Node 22 ·
Datenbasis: Seed 2026-11-24.8 – **19 Module, 197 Features, 348 Varianten, 296 Komponenten**, Datenwelt mit 219 Schlüsseln.
Der Bericht aus Session 1 (12 Module, 57 Varianten) ist durch diesen ersetzt; seine Funde stehen weiter in `WORK_LOG.md`.

## Zusammenfassung
| Prüfung | Umfang | Ergebnis |
|---|---|---|
| Statische Prüfung (`npm run check`) | 436 JS-Dateien, Seed-Integrität, Vertragsregeln, Begriffslisten (Gesundheit/Finanzen), Umlaute, `legal`-Felder, Welt-Schlüssel | **0 Fehler · 0 Hinweise** (auch mit CRLF-Zeilenenden) |
| Node-Tests (`npm test`) | 400 Tests in 29 Dateien: Kern, Welt-Invarianten (33), Szenarien, Seed-Abgleich, Format, Wiederholung, Gesundheits- und Finanzmathematik, Module | **400/400** |
| Vertragsprüfung (Browser) | 296 Komponenten, 197 Features, alle Varianten, Bindungen, Props-Schemata, Interaktions-Events | **0 Fehler · 0 Hinweise** |
| E2E-Bedientests | 32 Tests: Workbench, Demo-Launcher (Versionen, Szenarien, Offline, Schrift 200 %), App-Rahmen, Runden, Gates, Spezifikation | **32/32** |
| Screenshot-Matrix (Gesamtlauf) | bevorzugte Variante von 154 Features × 1440/1280/1024/768/390 · Graphite | Lauf noch nicht abgeschlossen – Ergebnis folgt |
| Szenario „Erster Start“ | bevorzugte Variante aller 154 Features mit Varianten · 390 px | **154/154** |
| Szenario „Stress-Tag“ | dito | **154/154** |
| Privatsphäre-Modus („Beträge ausblenden“) | dito | **154/154** (keine Beträge sichtbar) |
| Themes Horizon und Intensiv | **alle 348 Varianten** × 2 Themes · 390 px | Sonde **696/696** (Kontrast, Layout, Barrierefreiheit); Pixelvergleich siehe unten |
| Schrift 200 % (Sweep mit der QA-Sonde) | **alle 348 Varianten** × 390 / 360 / 1440 px | **0 Befunde** (vorher 57 Varianten mit abgeschnittenem Text) |
| Schrift 130 % | alle 348 Varianten × 390 px | **0 Befunde** (auch Touch-Ziele) |
| 100-%-Identität der 200-%-Kernregeln | alle 348 Varianten × 390 / 1440 px, alter gegen neuen Stand | **696/696 pixelgleich** (unabhängige Prüfung) |

**Ergebnis:** Keine offenen Fehler der QA-Sonde in irgendeiner Variante, Größe, Szenario, Umgebung oder in irgendeinem Theme.
Die einzigen Abweichungen sind Pixelvergleiche gegen Referenzbilder aus Session 1 – erklärt im Abschnitt „Pixelvergleich“.

## Geprüfte Kriterien je Vorschau (QA-Sonde `preview/qa-probe.js`, 11 Prüfungen)
1. **render** – keine Block-Fehler (Error-Boundary), keine Laufzeitfehler.
2. **blocks** – alle Blöcke der Variante vorhanden und sichtbar (berücksichtigt Breakpoint, Reiter, eingeklappte Panels,
   Blockbedingungen `hideWhenEmpty`/`showWhenEmpty`).
3. **overflow-x** – Dokumentbreite ≤ Viewport; bewusst scrollbare Container (`data-scroll-x`) ausgenommen.
4. **clipped** – abgeschnittener Inhalt; bei großer Schrift zusätzlich „…“, auf unter 48 px gequetschte Titel und zu schmale
   Spalten (Text bricht zeichenweise um). Bewusst abgeschnittene Flächen tragen `data-clip-ok`.
5. **touch** – Touch-Ziele auf Mobile (< 24 px Fehler, < 32 px Warnung, Ziel 44 px).
6. **contrast** – WCAG-Kontrast von bis zu 500 Textstellen gegen den tatsächlichen Hintergrund.
7. **images** – geladen und beschriftet.
8. **a11y-names** – Bedienelemente haben einen Namen (Screenreader).
9. **privacy** – im Privatsphäre-Modus keine Beträge sichtbar (auch „96,10€“, „Tsd./Mio./Mrd.“, Achsen, Freitext).
10. **legal-present** – Pflichthinweis des Moduls (Feld `legal`) sichtbar.
11. **money-format** – Beträge im Standardformat (`money()`: geschütztes Leerzeichen vor „€“, Komma, echtes Minus).

CLI zusätzlich: Pixelvergleich gegen Baselines (Schwelle 0,2 %). Für **freigegebene** Features ist jede Abweichung ein Fehler,
für Arbeitsstände ein Hinweis. Screenshots und Baselines tragen seit heute Szenario, Umgebung und Skalierung im Dateinamen.

## Viewports
1440 Desktop · 1280 Notebook · 1024 Tablet quer · 768 Tablet · 390 Smartphone · 360 Android kompakt (Schrift-Sweeps).

## Pixelvergleich gegen die Baselines aus Session 1 (Theme-Lauf)
Die Referenzbilder für Horizon/Intensiv stammen aus Session 1 (24.11., 01:20). Seitdem sind die Features bewusst
weiterentwickelt worden, daher **84 Hinweise** bei Arbeitsständen (z. B. Notizen, Wissen, Wetter, Sales – andere Höhe oder
0,4–5 % Abweichung) und **4 Fehler** bei `calendar.month` A/B (0,23–0,36 %), das im Seed als **freigegeben** markiert ist.
Ursache (Bildvergleich geprüft): (1) Der Vorschau-Rahmen zeigt in der unteren Leiste seit Session 2 „Gewohnheiten“ statt
„Notizen“ (Rahmen, nicht das Feature), (2) die Monatsleiste ist um wenige Pixel verschoben – Folge von Basisregeln aus
Session 2 (z. B. Icon-Knöpfe werden in Zeilen nicht mehr gestaucht). Die 100-%-Identitätsprüfung zeigt, dass die heutigen
200-%-Korrekturen daran nicht beteiligt sind.
**Entscheidung des Nutzers:** Freigabe von `calendar.month` so belassen (neue Baseline) oder über „Neue Arbeitsversion“ neu
freigeben. Steht in `TASKS.md`. Hinweis: Der Seed-Freigabe-Snapshot enthält keine Komponentenversionen, die Drift-Anzeige
der Workbench greift deshalb erst bei Freigaben über die Oberfläche.

## Gefundene und behobene Fehler (Session 2, Auswahl – vollständig in `WORK_LOG.md`)
| Fund | Ursache | Behebung |
|---|---|---|
| Visuelle QA-Stufe brach mit „extra is not defined“ ab (Übergabe-Simulation) | Variable im Gültigkeitsbereich von `plan()`, genutzt in `visualStage()` | auf Modulebene; Vertrag/E2E liefen davor, daher unbemerkt |
| `npm install` zog Playwright für Node ≥ 20, `engines` versprach ≥ 18 | kein Lockfile, Caret-Version | Node ≥ 22, Playwright `~1.65.1`, `package-lock.json` |
| Szenario-/200-%-Läufe überschrieben Standard-Baselines | Dateiname ohne Szenario/Skalierung | Zusatz `__sc-…`, `__env-…`, `__x2` |
| `npm run check` meldete unter Windows 2 Fehlalarme | `split('\n')` bei CRLF | `/\r?\n/`, `.gitattributes` (LF) |
| 57 Varianten mit abgeschnittenem Text bei Schrift 200 % | feste Spalten, `nowrap`, `rem`-Breiten | 4 Modulgruppen korrigiert und unabhängig nachgeprüft; Basisregeln für Chips, Badges, Reiter, Filter, Listen |
| Wörter mit 8–9 Zeichen brachen hart („Dokume/nte“) | Silbentrennungsgrenze 10 zu streng | `hyphenate-limit-chars: 8 2 2` |
| Chips in Scrollreihen streckten sich auf die Höhe des längsten | Umbruch im längsten Chip | Scrollreihen einzeilig (3 Komponenten) |
| Mahlzeiten-Zeitleiste: „Schätzung“ Buchstabe für Buchstabe senkrecht (1440 px, 200 %) | Nebenzeile auf 0 px gequetscht (Altlast) | stapelt bei großer Schrift |
| Papierkorb: „23,99 €“ mit normalem Leerzeichen | Welt-Datei | geschütztes Leerzeichen (Sonde `money-format`) |
| Privatsphäre-Lecks in Achsen und Freitext, Doppelbuchungen, falsche Wochenstunden | siehe Abschluss-QA im WORK_LOG | behoben, Nachprüfung „gut“ |

## Offene Punkte / Grenzen der QA
- **Kein echtes Smartphone getestet** (keines in der Cloud). Ablauf: `docs/GERAETETEST.md`, `npm run lan`.
- **Baselines sind maschinenspezifisch** und nicht im Repo. Der erste `npm run qa` zuhause legt neue an; Vergleiche sind erst
  danach aussagekräftig. Ein Vergleich gegen die Cloud-Bilder ist nicht vorgesehen.
- **Windows nicht ausgeführt**, nur per Codelektüre und CRLF-Simulation geprüft (Pfade, `start ""`, Glob in `npm test` ab Node 22).
- **Klickpfade der Fachkomponenten** sind nur teilweise als E2E hinterlegt (Workbench, Launcher, Runden, Gates); die
  Fachmodule wurden von den Prüfern im Browser bedient.
- **Kontrastprüfung:** Stichprobe bis 500 Textstellen je Ansicht; Fokusreihenfolge und Screenreader-Ablauf nicht automatisiert.
- **Große Schrift, Feinschliff** (Optik, keine Befunde der Sonde): `TASKS.md` › Abschnitt 4.

## So wiederholen
```powershell
npm run check; npm test
npm run qa                                                     # Vertrag + 32 E2E + Screenshot-Matrix (legt Baselines an)
npm run qa:scenarios                                           # Erster Start / Stress-Tag (eigene Baselines)
npm run qa -- --only visual --viewports mobile --env privacy   # Beträge ausblenden
npm run qa -- --only visual --all-variants --viewports mobile --themes horizon,intensiv
npm run qa -- --only visual --all-variants --viewports mobile,mobile-s --scale 2   # Schrift 200 %
npm run qa:changed                                             # nach Komponenten-Änderungen
```
Bericht des letzten Laufs: `qa/results/latest.md`; Screenshots und Differenzbilder in `qa/results/<Zeitstempel>/`.
In der Workbench: Quality Center › Screenshots & Regression.
