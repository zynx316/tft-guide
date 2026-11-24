# TAKT Design Workbench

Der dauerhafte Designarbeitsplatz für **TAKT V2.0**: Module und Features verwalten, Anforderungen festhalten, Designvarianten
aus einer gemeinsamen Komponentenbibliothek zusammensetzen, **interaktiv** in echten Gerätebreiten vergleichen, Entscheidungen
dokumentieren, **freigeben und einfrieren** – und alles automatisiert prüfen, statt jede Kleinigkeit am Smartphone zu testen.

## Starten
Voraussetzung: **Node.js ≥ 18** (Windows, macOS, Linux).
```powershell
cd G:\Projekte\97_Uebernahme\TAKT_DESIGN_WORKBENCH
npm start                  # = node server.mjs --open  → http://127.0.0.1:4317
```
- Ohne npm: `node server.mjs --open`. Anderer Port: `node server.mjs --port 5000`.
- Der Stand wird in `data/workbench.json` gespeichert (plus Browser-Speicher als Rückfall). Beim ersten Start wird der Seed geladen
  (12 Module, 60 Features, 57 Varianten).
- Nur für die automatisierten Tests einmalig: `npm install` und `npx playwright install chromium`.

## Aufbau der Oberfläche
| Bereich | Wofür |
|---|---|
| **Übersicht** | Gesamtstatus, Statusverteilung, Fortschritt je Modul, **nächste sinnvolle Schritte**, offene Entscheidungen, Qualität, letzte Änderungen |
| **Module** | Alle Module (Kacheln/Liste, Drag & Drop-Sortierung, Archiv, Referenzmodule) → **Modul-Cockpit**: Features nach Gruppen, Informationsarchitektur, Dokumentation, Verknüpfungen, Entscheidungen, „Modul prüfen“ |
| **Features** | Feature-Browser über alle Module: Suche, Status-/Modulfilter, Sortierung, Status ändern, Aktionsmenü (umbenennen, duplizieren, verschieben, zusammenführen, archivieren, löschen) |
| **Feature-Workspace** | Pro Feature: Übersicht · Anforderungen · Design · Vergleich · Interaktionen · Demo-Daten · Qualität · Entscheidungen · Historie |
| **Design Studio** | Varianten gestalten: Layout, Blöcke (Komponenten) hinzufügen/sortieren/Regionen, Props & Datenbindung, Live-Vorschau (1 oder mehrere Viewports), Theme, Zustand |
| **Komponenten** | Designsystem: Tokens & Themes mit Kontrast-Audit; jede Komponente mit Live-Galerie, Zuständen, Schnittstelle, Verwendung, „Betroffene prüfen“ |
| **Versionen & Entscheidungen** | Freigaben, alle Versionen, Entscheidungslog (Export als Markdown), offene Punkte, Änderungsprotokoll |
| **Quality Center** | Matrix Features × Viewports, selektive Tests (Komponente → betroffene Features), Läufe, CLI-Screenshots & Regression, Gerätetest-Meilensteine, Prüfumfang |
| **Daten & Backup** | Speicherstatus, Export/Import, Server-Backups, Seed-Abgleich, Zurücksetzen |

Tastatur: **Strg+K** Suche/Sprung überallhin · **Strg+Z / Strg+Umschalt+Z** Rückgängig/Wiederholen · **Esc** schließt Dialoge ·
im Studio **Alt+Klick** in der Vorschau wählt einen Block.

## Typischer Ablauf je Feature
1. **Modul öffnen** (Cockpit) → Feature wählen oder **„+ Feature“**.
2. **Anforderungen** erfassen (Information / Aktion / Zustand / Regel, Muss/Soll/Kann). Zu groß? Anforderungen markieren → **„In neues Feature auslagern“**.
3. **Design Studio**: **Variante anlegen** (leer, mit Layout-Vorlage oder aus bestehender ableiten). **„+ Block“** wählt Komponenten aus
   der Bibliothek; rechts im Inspector Region, Breite, Sichtbarkeit je Gerät, **Datenbindung** und **Eigenschaften** einstellen.
   Die Vorschau ist sofort bedienbar.
4. Weitere Varianten mit **strukturell anderem Ansatz** (z. B. Kompakt / Visuell / Produktiv). **Vergleich**-Tab: bis zu 3 Varianten
   nebeneinander, gemeinsamer Viewport/Theme/Zustand, Strukturunterschiede, **„Bevorzugen“** mit Begründung → Entscheidung wird dokumentiert.
5. **Interaktionen** beschreiben (Auslöser → Ergebnis, Event-Name). Beim Bedienen der Live-Vorschau werden sie automatisch als abgedeckt markiert.
6. **QA ausführen** (prüft alle Ziel-Viewports automatisch), Befunde beheben.
7. **Version sichern** / **Zur Prüfung** → **Freigeben**: Checkliste, Freigabenotiz → Feature ist **v1.0 und gesperrt**.
8. Spätere Änderung: **„Neue Arbeitsversion“** (v1.1). Die Freigabe v1.0 bleibt unverändert in der Historie (ansehen, Diff, zurückholen).

## Module & Features hinzufügen
- **In der Oberfläche:** Übersicht/Module → **„Modul hinzufügen“** (Name, Icon, Status, Theme, Referenzmodul); im Cockpit **„+ Feature“**.
  Umbenennen direkt im Titel, Sortieren per Drag & Drop, Archivieren über das ⋯-Menü.
- **Im Code (z. B. nach der Phase-1-Analyse):** neue Datei `app/src/seed/modules/<id>.js` (Format: `app/src/seed/SEED_FORMAT.md`),
  in `app/src/seed/index.js` eintragen, `SEED_VERSION` erhöhen → in der Workbench **Daten & Backup › Neue Seed-Inhalte übernehmen**.

## Varianten erstellen – gutes Vorgehen
- Varianten unterscheiden sich in **Informationshierarchie, Layout, Komponentenwahl und Bedienkonzept** – nicht nur in Farben.
- Nicht jedes Feature braucht mehrere Varianten; bei komplexen Features 2–3 grundsätzlich verschiedene Ansätze.
- Fehlt ein Baustein, gehört er als **Komponente** in die Bibliothek (`app/src/library/CONTRACT.md`) – dann steht er allen Modulen zur Verfügung.

## Freigabe & Versionen
| Aktion | Wirkung |
|---|---|
| Version sichern | Snapshot des Arbeitsstands, Arbeitsversion 0.x → 0.x+1 |
| Zur Prüfung | Snapshot „Prüfversion“, Status *In Prüfung* |
| Freigeben | Checkliste (Variante, Muss-Anforderungen, Interaktionen, QA ohne Fehler & aktuell, alle Ziel-Viewports); Ausnahme nur mit Begründung. Snapshot inkl. QA-Ergebnis, Entscheidungen, Komponentenversionen → **v1.0, gesperrt** |
| Neue Arbeitsversion | Entsperrt als v1.1; Freigabe bleibt erhalten |
| Wiederherstellen | Snapshot zurückholen (aktueller Stand wird vorher automatisch gesichert) |

Status: Nicht untersucht → Analysiert → Design in Arbeit → In Prüfung → **Freigegeben** → Implementiert → Regression bestanden.

## Qualitätssicherung
**In der Workbench:** „QA ausführen“ (Feature), „Modul prüfen“, Quality Center „Alle prüfen“ / „Veraltete erneuern“ / **Selektive
Tests** (geänderte Komponenten wählen → nur betroffene Features). Geprüft werden: Render-Fehler, fehlende Blöcke, horizontaler
Überlauf, abgeschnittene Inhalte, Touch-Ziele (Mobile), Textkontrast (WCAG), Bilder – je Viewport (1440, 1280, 1024, 768, 390,
optional 360), Theme und Zustand.

**Automatisiert per CLI (Playwright):**
```powershell
npm run check          # statische Schnellprüfung (< 1 s)
npm run qa             # Vertrag + 24 E2E-Bedientests + Screenshot-Matrix + Pixel-Regression → qa/results/latest.md
npm run qa:changed     # nur Features mit seit dem letzten Lauf geänderten Komponenten
npm run qa -- --feature calendar.week --all-variants --themes graphite,horizon,intensiv --viewports desktop,mobile,mobile-s
npm run qa:baseline    # Referenzbilder bewusst neu setzen
```
Ergebnisse (Screenshots, Differenzbilder) erscheinen im **Quality Center › Screenshots & Regression** („CLI-Ergebnis laden“).
Freigegebene Features werden **strikt** gegen ihre Referenzbilder geprüft (Abweichung = Regression).

**Echtes Smartphone** nur an Meilensteinen (erste Modulfreigabe, große Responsive-Änderungen, Modulfreigabe, Gesamtcheck):
`npm run lan`, dann auf dem Handy `http://<PC-IP>:4317/preview.html?feature=<id>` öffnen; Ergebnis im Feature unter
„Gerätetest dokumentieren“ festhalten. (Im LAN-Modus kann das Handy nichts speichern.)

## Export, Backup, Übertragung
- **Export:** Daten & Backup › „Workbench exportieren“ → vollständige JSON-Datei (Beispiel: `docs/examples/export-beispiel.json`).
- **Import:** Datei wählen → Prüfung (Anzahl Module/Features/Versionen) → vor dem Ersetzen wird automatisch eine Sicherung heruntergeladen.
- **Backups:** automatisch in `data/backups/` (höchstens alle 10 Min., 40 behalten), manuell „Jetzt sichern“, Wiederherstellen per Klick.
- **Übertragung auf anderen Rechner:** Ordner kopieren (inkl. `data/`) oder Export/Import.
- **Design-Tokens** als JSON exportieren (Grundlage für das Flutter-Theme).

## Weiterführend
`ARCHITECTURE.md` (Technik & Datenmodell) · `DESIGN_SYSTEM.md` · `QA_REPORT.md` · `HANDOFF.md` (Stand & Übergabe) ·
`TASKS.md` (nächste Schritte) · `WORK_LOG.md` · `docs/MISSION.md` (Auftrag) · `docs/PHASE1_BESTANDSAUFNAHME.md`.
