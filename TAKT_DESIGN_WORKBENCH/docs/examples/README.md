# Beispiele

- `export-beispiel.json` – gekürzter Workbench-Export (nur Modul **Kalender**: 9 Features inkl. Varianten, Demo-Daten,
  Versionen der freigegebenen Monatsansicht und Entscheidungen). Struktur identisch mit einem vollständigen Export
  (Daten & Backup › „Workbench exportieren“) und importierbar (ersetzt dann den aktuellen Stand – vorher wird automatisch gesichert).

## Struktur eines Exports (Kurzform)
```json
{
  "schemaVersion": 1,
  "meta": { "project": "TAKT V2.0", "updatedAt": "…", "rev": 42, "seedVersion": "…", "exportedAt": "…" },
  "settings": { "previewTheme": "graphite", "viewport": "mobile", "qaViewports": ["desktop", "notebook", "tablet-l", "tablet", "mobile"] },
  "modules":   [ { "id": "calendar", "name": "Kalender", "icon": "calendar", "status": "active", "theme": "graphite" } ],
  "features":  [ { "id": "calendar.week", "moduleId": "calendar", "status": "design", "version": "0.1",
                   "requirements": [], "interactions": [], "variants": [ { "id": "A", "layout": { "type": "sidebar" }, "blocks": [] } ],
                   "selectedVariantId": "B", "demoData": {} } ],
  "versions":  [ { "featureId": "calendar.month", "version": "1.0", "kind": "release", "snapshot": {} } ],
  "decisions": [ { "featureId": "calendar.week", "title": "…", "status": "open" } ],
  "history":   [], "qa": { "runs": [], "latest": {} }, "components": {}
}
```

## Wiederherstellen aus Server-Backup
`data/backups/workbench-<Zeitstempel>-auto.json` → Workbench › Daten & Backup › Server-Backups › „Wiederherstellen“
(oder Datei über „Import“ einlesen). Manuell bei gestopptem Server: Backup nach `data/workbench.json` kopieren.
