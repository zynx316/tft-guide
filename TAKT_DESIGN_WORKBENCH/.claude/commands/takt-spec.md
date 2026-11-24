---
description: Umsetzungsvorlagen für Flutter exportieren und prüfen, was sich seit dem letzten Export geändert hat
argument-hint: "[--released | --feature id,… | --version dir:kompakt|mix|freigabe]"
---
Exportiere die Umsetzungsvorlagen der TAKT Design Workbench für das Flutter-Projekt. Argument: `$ARGUMENTS`

1. Stand prüfen: `npm run check`. Läuft der Server, ist `data/workbench.json` aktuell (sonst wird der Seed exportiert – Hinweis
   in der Ausgabe beachten und dem Nutzer melden).
2. Änderungen seit dem letzten Export: `npm run spec:check` (meldet neue/geänderte/entfernte Features über `specHash`).
3. Export: `npm run spec -- $ARGUMENTS` → `export/spec/`:
   - `features/<id>.json` (Format `takt-feature-spec/1`: Variante, Blöcke, Komponenten mit Flutter-Hinweis, Datenstruktur mit
     Welt-Verweisen, Anforderungen, Akzeptanzkriterien, Navigation, Entscheidungen, `specHash`) und `features/<id>.md` (lesbar),
   - `routes.json` (alle Navigationswege, `valid` je Ziel), `manifest.json` (deterministisch, `bundleHash`).
   Ohne Argument: alle Features mit Variante in Version „auto“ (Freigabe, sonst „Meine Auswahl“). Für die Übergabe an Flutter
   in der Regel `--released`.
4. Dem Nutzer berichten: Anzahl, geänderte Features (aus Schritt 2), Features ohne Freigabe in Tier 1, ungültige Routen.
5. **Umsetzung im TAKT-Projekt (`TAKT-Merge-Git`) nur auf ausdrücklichen Auftrag des Nutzers** – dann auf einem eigenen Branch,
   den der Nutzer bestimmt, ohne die bekannten lokalen Änderungen (`android/version_code.state`, `_bau_apk_2026-09-27.ps1`)
   anzufassen. Ohne diesen Auftrag bleibt es beim Export.
