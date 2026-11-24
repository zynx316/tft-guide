# Aufgaben – TAKT Design Workbench

> Pflege: Checkboxen abhaken, neue Aufgaben mit Datum ergänzen, Erledigtes in `WORK_LOG.md` protokollieren.
> Priorität: **P1** = als Nächstes · **P2** = bald · **P3** = später/optional.

## 0. Übernahme auf den eigenen Rechner (P1, ~15 Min.) – siehe HANDOFF.md
- [ ] Ordner `TAKT_DESIGN_WORKBENCH` nach `G:\Projekte\97_Uebernahme\TAKT_DESIGN_WORKBENCH` kopieren (**neben** `TAKT-Merge-Git`, nicht hinein)
- [ ] Optional eigenes Git-Repo: `git init` im Workbench-Ordner, erster Commit (Workbench versioniert sich dann selbst, inkl. `data/workbench.json`)
- [ ] `npm install` · `npx playwright install chromium`
- [ ] `npm start` → Workbench öffnet sich, Seed wird geladen; `npm run check` und `npm run qa` (erzeugt Baselines für diesen Rechner)

## 1. Phase 1 – Bestandsaufnahme TAKT (P1) → `/takt-phase1`, Anleitung `docs/PHASE1_BESTANDSAUFNAHME.md`
- [ ] Git-Status/Branch/Commit/Untracked des TAKT-Projekts dokumentieren (nur lesen!)
- [ ] Aktuelle Version + Projektkopien identifizieren, maßgebliche Kopie begründen
- [ ] Modulregister & Navigation auslesen → Modul-/Feature-Tabelle mit Belegen
- [ ] Seed an echte Module/Features angleichen (Annahmen „Start“ und „Einstellungen“ bestätigen oder entfernen; weitere echte Module ergänzen)
- [ ] Theme-Farbwerte Graphite/Horizon/Intensiv aus Flutter übernehmen (`tokens.js`), Kontrast-Audit + `npm run qa`
- [ ] Frühere HTML-Prototypen & Konzepte finden; Fitness/Finanzen-Konzepte als Referenz verknüpfen (`references`, `docs`) – kein neues Vollaudit
- [ ] `docs/PHASE1_ERGEBNIS.md` schreiben; Workbench: „Neue Seed-Inhalte übernehmen“

## 2. Designarbeit mit der Workbench (P1, laufend – Nutzer entscheidet, Claude unterstützt)
- [ ] Kalender › Wochenansicht: Varianten A/B/C vergleichen, bevorzugen (offene Entscheidung im Seed), QA, Freigabe
- [ ] Aufgaben › Aufgabenübersicht: Variantenwahl (offene Entscheidung), Freigabe
- [ ] Erstes Modul komplett freigeben → **Gerätetest-Meilenstein** auf dem echten Smartphone (`npm run lan`)
- [ ] Je Modul die Features im Status „Nicht untersucht/Analysiert“ mit Anforderungen füllen, dann Varianten entwerfen

## 3. Architektur – mittelfristig (P2, aus Review Worker G)
- [ ] **Skalierung:** Versionen-Snapshots und QA-Ergebnisse aus dem Hauptzustand in eigene Dateien je Feature auslagern (Server-API erweitern); Snapshots dedupliziert/als Delta
- [ ] **Undo als Patches** statt 60 Vollkopien; Browser-Speicher nur als Notfallkopie (Grenze ~5 MB)
- [ ] **Migrationskette** (`migrations[n]`, Backup vor Migration, Snapshots mitmigrieren); `inspectImport` strukturell prüfen (IDs, Komponenten, Bindungen)
- [ ] **Library vereinheitlichen:** ein Exportmuster je Bereich, gemeinsames `lib/date.js` (dayStart/dayDiff/relativ), eine Filter-Implementierung (`applyUiFilter` vs. `filterTasks`/`filterItems`), `ctx.newId()` statt `Date.now()`-IDs, Ordner = Kategorien (insights/content aufteilen)
- [ ] **Komponentenversionen pflegen** (bei sichtbarer Änderung `version` erhöhen), `deprecated` in der Registry auswerten (Picker ausblenden, Hinweis)
- [ ] **Deklaratives Modell erweitern:** Container-/Gruppen-Block (Verschachtelung), Props je Breakpoint, Feldmapping in `bind`, `shape` als JSON-Schema, einfache Aktionen (Navigation/Zustand) für Abläufe
- [ ] `page-header`-Primäraktion an Aktionen anderer Blöcke koppeln (z. B. „Neuer Termin“ öffnet Termin-Dialog) – Wunsch aus Worker A/B/C
- [ ] `form-card`: Feldmapping auf Zielfelder (z. B. `start`/`end` für Termine) – Wunsch Worker A
- [ ] `Textarea`-Primitiv mit `ref`-Weitergabe (Editor nutzt derzeit rohes `<textarea>`) – Wunsch Worker B
- [ ] `module.theme` in der Vorschau berücksichtigen (aktuell nur globales Vorschau-Theme)
- [ ] Seed-Updates für bestehende, unveränderte Features opt-in übernehmen (`seedRev` je Feature)

## 4. Flutter-Überführung vorbereiten (P2)
- [ ] Semantischer Token-Export (ARGB, ColorScheme-/TextTheme-Rollen, Schatten als Werte) + Abgleich mit Flutter-Themes
- [ ] Je Komponente `flutter: { widget, propMap }` (Mapping auf bestehende/neue Widgets)
- [ ] Export „Feature-Spezifikation“ für freigegebene Features (Anforderungen, Interaktionen, Variante, Bindungen, Version) als Umsetzungsvorlage
- [ ] Status „Implementiert“/„Regression bestanden“ mit Verweis auf Flutter-Commit/Screen verknüpfen

## 5. QA-Ausbau (P3)
- [ ] Interaktions-Abläufe je Feature als automatisierte Klickpfade (aus `interactions` generiert) in der CLI
- [ ] Optional: Desktop-App-Hülle (Tauri/Electron) nur falls Browser+Server im Alltag stören
- [ ] Tastatur-/Screenreader-Prüfung (Fokusreihenfolge, ARIA) in der QA-Sonde

## Erledigt (Nacht 24.11.2026) – Details in WORK_LOG.md
- [x] Architektur, Datenmodell, Workbench (9 Bereiche), Design Studio, Preview Engine, Varianten & Vergleich, Themes/Tokens,
      Komponenten-Library (45), Versionierung/Freigabe/Sperre, Entscheidungen, QA (Sonde, Workbench-Läufe, CLI mit E2E/Screenshots/Regression,
      selektiv), Persistenz (Datei + Browser, Revisionen, Backups), Import/Export, Seed (12 Module, 60 Features, 57 Varianten)
- [x] Architekturprüfung (Worker G) – alle 8 Muss-Punkte umgesetzt
- [x] Übergabe: CLAUDE.md, HANDOFF.md, Slash-Commands, Agent-Definitionen
