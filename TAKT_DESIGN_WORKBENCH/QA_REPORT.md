# QA-Bericht – TAKT Design Workbench

Stand: 24.11.2026, ca. 01:40 UTC · Umgebung: Linux-Container, Chromium (Playwright), Node 22 · Datenbasis: Seed
(12 Module, 60 Features, 57 Varianten, 45 Komponenten).

## Zusammenfassung
| Prüfung | Umfang | Ergebnis |
|---|---|---|
| Statische Prüfung (`npm run check`) | 92 JS-Dateien, Seed-Integrität, Vertragsregeln, Umlaute | **0 Fehler · 0 Hinweise** |
| Vertragsprüfung (Browser) | 45 Komponenten, alle Varianten, Bindungen, Props-Schemata, Interaktions-Events | **0 Fehler · 0 Hinweise** (1 Hinweis gefunden und im Seed behoben) |
| Token-/Theme-Audit | 3 Themes × 16 Kontrastpaare + Vollständigkeit der Farbrollen | **51/51 bestanden** (Horizon nachgebessert) |
| E2E-Bedientests der Workbench | 24 Tests, frischer Seed, temporärer Datenordner | **24/24 bestanden** |
| Visuelle Matrix 1 | 39 Features (bevorzugte Variante) × 1440/1280/1024/768/390 · Graphite | **195/195 bestanden** |
| Visuelle Matrix 2 | **alle 57 Varianten** × Graphite/Horizon/Intensiv × 1440/768/390/360 | **684/684 bestanden** |
| Visuelle Matrix 3 | alle 57 Varianten × Zustände Leer/Lädt/Fehler × 390/1440 | **342/342 bestanden** |
| Pixel-Regression (finaler Gesamtlauf) | 195 Screenshots gegen Baselines | 185 unverändert · **10 erwartete Änderungen** (siehe unten) · 0 Regressionen |
| Selektiv `--changed` | Datei-Hash je Komponente | korrekt: „keine Komponente geändert → nichts zu tun“ |

**Insgesamt 1.221 Layout-/Qualitätsprüfungen in der Vorschau plus 24 E2E-Tests, ohne einen offenen Fehler.**

## Geprüfte Kriterien je Vorschau (QA-Sonde `preview/qa-probe.js`)
1. **Rendering**: keine Block-Fehler (Error-Boundary), keine Laufzeitfehler.
2. **Blöcke**: alle in der Variante definierten Blöcke sind vorhanden und sichtbar. Je Breakpoint ausgeblendete Blöcke, inaktive Reiter und das eingeklappte Mobile-Panel werden berücksichtigt.
3. **Horizontaler Überlauf**: Dokumentbreite ≤ Viewport. Verursachende Elemente werden benannt. Bewusst scrollbare Container (`data-scroll-x`) sind ausgenommen.
4. **Abgeschnittene Inhalte**: `overflow: hidden` ohne Ellipsis oder Line-Clamp.
5. **Touch-Ziele** (nur Mobile): < 24 px ist ein Fehler, < 32 px eine Warnung (Ziel 44 px).
6. **Kontrast (WCAG)**: bis zu 500 gerenderte Textstellen gegen den tatsächlichen Hintergrund, inklusive halbtransparenter Flächen.
7. **Bilder**: geladen und mit Alternativtext.
8. **CLI zusätzlich**: Pixelvergleich mit Baseline (Schwelle 0,2 %). Für **freigegebene** Features ist jede Abweichung eine Regression (Fehler), für Arbeitsstände ein Hinweis.

## Viewports
1440 Desktop · 1280 Notebook · 1024 Tablet quer · 768 Tablet · 390 Smartphone (Pflicht) · **360 Android kompakt**
(zusätzlich, weil es die kleinste gängige Android-Breite ist und Überläufe früh aufdeckt).

## E2E-Bedientests (finaler Lauf)
| | Test | Dauer |
|---|---|---|
| ✓ | Start: Übersicht lädt mit Kennzahlen | 0,0 s |
| ✓ | Navigation: alle Hauptbereiche erreichbar | 1,6 s |
| ✓ | Modul anlegen (Dialog, Validierung, Cockpit) | 1,6 s |
| ✓ | Modul umbenennen, archivieren und wiederherstellen | 1,8 s |
| ✓ | Feature anlegen und Workspace öffnen | 0,8 s |
| ✓ | Anforderung hinzufügen und bearbeiten | 0,4 s |
| ✓ | Design Studio: Variante anlegen, Block hinzufügen, Prop ändern → Vorschau aktualisiert | 2,3 s |
| ✓ | Vorschau: Theme- und Viewport-Wechsel | 1,5 s |
| ✓ | Variante ableiten, Vergleich und Bevorzugen mit Entscheidung | 3,4 s |
| ✓ | Version sichern → Historie | 0,4 s |
| ✓ | QA-Lauf im Browser (alle Ziel-Viewports) | 2,7 s |
| ✓ | Freigabe sperrt Feature (v1.0, Snapshot inkl. Komponentenversionen), neue Arbeitsversion entsperrt (v1.1) | 2,5 s |
| ✓ | Persistenz: Neu laden behält Zustand (Datei) | 0,7 s |
| ✓ | Feature-Browser: Suche & Statusfilter | 0,6 s |
| ✓ | Löschen und Rückgängig (Strg+Z) | 7,9 s |
| ✓ | Befehlspalette (Strg+K) und Zurücknavigation | 1,0 s |
| ✓ | Vorschau-Interaktion erscheint im Interaktions-Log | 1,5 s |
| ✓ | Variantenvergleich eines Seed-Features (3 bedienbare Varianten) | 1,8 s |
| ✓ | Export und Import (Rundreise) | 1,7 s |
| ✓ | Gesperrtes Seed-Feature ist schreibgeschützt (Studio) | 1,3 s |
| ✓ | Sperrregeln: „Freigegeben“ nur über Freigabe-Aktion (UI und Store) | 0,6 s |
| ✓ | Escape schließt Dialoge | 0,5 s |
| ✓ | Workbench auf Smartphone-Breite (390): kein Überlauf, Navigation per Menü | 1,2 s |
| ✓ | Keine JavaScript-Fehler während der gesamten Bedienung | 0,0 s |

Abgedeckte Interaktionsarten laut Auftrag: Navigation, Tabs, Dialoge, Formulare (Validierung), Filter, Suche, Theme-Wechsel,
responsive Navigation, Featurewechsel, Variantenwechsel, Speichern, Bearbeiten, Löschen, Zurücknavigation.
Zusätzlich haben die Worker in ihren Selbsttests Klickpfade in den Fachkomponenten geprüft: Termin anlegen und löschen,
Kanban per Drag & Drop, Aufgabe abhaken, Notiz bearbeiten (Autosave), OCR-Erfassung, Kanal synchronisieren,
Order-Ticket validieren und bestätigen, Wetter-Tag wählen.

## Gefundene und behobene Fehler
| Fund | Ursache | Behebung |
|---|---|---|
| Checkboxen auf Mobile 24 × 24 px (QA-Sonde) | Primitiv zu klein | Trefferfläche 40 px, Box 24 px |
| Switch auf Mobile 22 px (Worker B) | Primitiv zu klein | 48 × 30 px |
| Horizon-Kontrast 4,27–4,36 : 1 (Badges, aktive Chips, Navigation) | Akzent- und Statusfarben auf Soft-Flächen zu hell | Horizon-Farben abgedunkelt, Audit um diese Paare erweitert |
| Diagramm-Achsen verzerrt (Worker C) | `preserveAspectRatio="none"` | echte Breite messen (ResizeObserver) |
| Donut-Mittelwert läuft über den Ring | feste Schriftgröße | Größe abhängig von der Textlänge |
| Kennzahl-Kacheln mit unnötiger Leerhöhe | Fußzeile immer gerendert | nur mit Inhalt |
| `asideFirstOnMobile` wirkte auch auf Tablet (Worker A) | Bedingung `!== 'desktop'` | nur Mobile |
| Kurze aufeinanderfolgende Termine überlappen optisch | Spaltenaufteilung ohne Mindesthöhe | Mindestdauer aus Mindesthöhe → `calendar-week` v1.1 |
| Escape schloss einen Dialog direkt nach dem Öffnen nicht (E2E) | Listener je Dialog wurde erst nach dem Rendern registriert | ein globaler Escape-Handler |
| Fälligkeit „heute“ ab UTC+10 um einen Tag verschoben | `toISOString()` liefert UTC | `isoDay()` (lokal) |
| Vertragshinweis: Interaktion `focus.schedule` ohne auslösende Komponente | Seed-Inkonsistenz | Block `focus-next` in „Kalender › Aufgabenintegration“ |
| Architektur-Review: 8 Muss-Punkte (Sperre, Undo, Konflikte, Server …) | siehe ARCHITECTURE.md §11 | alle umgesetzt und per E2E abgesichert |

## Erwartete visuelle Änderungen im finalen Lauf
`calendar.week/B` (0,50–1,14 %) und `calendar.tasks/A` (0,21–0,52 %): Das ist die bewusste Korrektur der Terminüberlappung in
`calendar-week` v1.1. Erkannt wurden genau die Features, deren bevorzugte Variante diese Komponente nutzt. Beide sind
Arbeitsstände, deshalb ist es ein Hinweis und die Baseline folgt. Freigegebene Features waren nicht betroffen.
**Damit ist die selektive Regressionserkennung praktisch nachgewiesen.**

## Offene Punkte / Grenzen der QA
- **Kein echtes Smartphone getestet** (keines verfügbar). Vorgesehen sind Meilensteine über `npm run lan`, dokumentiert im Feature und im Quality Center.
- **Baselines sind maschinenspezifisch.** Der erste `npm run qa` auf dem Windows-Rechner legt neue an; erst danach sind Vergleiche aussagekräftig.
- **Klickpfade der Fachkomponenten** sind noch nicht als automatisierte CLI-Tests hinterlegt (nur Selbsttests der Worker). Das steht in TASKS.md §5.
- **Kontrastprüfung**: Stichprobe von max. 500 Textstellen je Ansicht, keine Prüfung von Fokusreihenfolge und Screenreader (TASKS.md §5).
- **Theme-Werte**: eigener Entwurf, bis Phase 1 sie mit Flutter abgleicht. Danach `npm run qa` (globale Änderung).

## So wiederholen
```powershell
npm run check
npm run qa                                                     # Standard (wie „Gesamtlauf“)
npm run qa -- --only visual --all-variants --themes graphite,horizon,intensiv --viewports desktop,tablet,mobile,mobile-s
npm run qa -- --only visual --all-variants --viewports mobile,desktop --states empty,loading,error
npm run qa:changed                                             # nach Komponenten-Änderungen
```
Bericht des letzten Laufs: `qa/results/latest.md`. Screenshots und Differenzbilder liegen in `qa/results/<Zeitstempel>/`.
In der Workbench unter Quality Center › Screenshots & Regression.
