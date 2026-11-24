---
description: Arbeitsauftrag aus einer Entscheidungsrunde (oder dem Gesamtstand) abarbeiten
argument-hint: "[pfad/zur/arbeitsauftrag.md | latest | feature-id,…]"
---
Arbeite einen Arbeitsauftrag der TAKT Design Workbench ab. Argument: `$ARGUMENTS`

1. Auftrag beschaffen:
   - Pfad zu einer `.md`-Datei → diese lesen (exportiert über Workbench › Entscheidungsrunde › „Arbeitsauftrag (.md)“).
   - `latest` → `node tools/work-order.mjs --round latest --out docs/work-orders/<datum>-runde.md` und lesen.
   - Feature-IDs (kommagetrennt) → `node tools/work-order.mjs --feature <ids> --out docs/work-orders/<datum>-features.md`.
   - leer → `node tools/work-order.mjs` (Gesamtstand).
2. Plan je Abschnitt (TaskCreate):
   - **Entschieden – umsetzen:** Variantenwahl → Feature-Spezifikation im Anhang prüfen; fehlende Komponenten in der Library bauen
     (CONTRACT.md), nicht feature-spezifisch hacken. Muster (App-weit) → alle betroffenen Komponenten/Varianten angleichen und in
     `DESIGN_SYSTEM.md` dokumentieren. App-Richtung → Features ohne Variante dieser Richtung bekommen eine (Studio bzw. Seed).
   - **Änderungen nötig:** Muss-Anmerkungen zuerst. Die zugehörige Frage kommt in die nächste Runde – dort gilt das Rundenlimit
     (nur noch entscheiden, Empfehlung übernehmen oder parken). Keine neuen Alternativvarianten erfinden, nur die notierte Änderung.
   - **Feedback aus dem Launcher:** Übernahme-Wünsche gelten erst nach Bestätigung in der Workbench (Runde) als Entscheidung.
3. Regeln: TAKT-Projekt (`TAKT-Merge-Git`) nur lesen. Freigegebene Features nicht direkt ändern (Neue Arbeitsversion).
   Live-Daten (`data/workbench.json`) nur bei gestopptem Server und nach Backup ändern; bevorzugt über die Workbench-UI.
4. Nach jedem Punkt: `npm run check`; nach Komponenten-/Layoutänderungen `npm run qa:changed`; am Ende `npm run qa -- --only contract,e2e`.
5. Abschluss: Checkboxen im Auftrag abhaken, `WORK_LOG.md` ergänzen (was, warum, QA-Ergebnis), offene Punkte in `TASKS.md`.
   Kurzbericht an den Nutzer: umgesetzt / offen / nächste Runde (welche Fragen, Empfehlung).
