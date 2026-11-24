---
description: QA ausführen, Befunde analysieren und beheben, QA_REPORT.md aktualisieren
argument-hint: "[changed | all | --feature <id> | --module <id> | --component <id>]"
---
Führe die QA der TAKT Design Workbench aus: `$ARGUMENTS` (leer/`changed` = `npm run qa:changed`, `all` = `npm run qa`,
sonst `npm run qa -- $ARGUMENTS`).

1. Vorher `npm run check`.
2. Lauf starten, `qa/results/latest.md` lesen. Für Fehler die Screenshots/Differenzbilder in `qa/results/<lauf>/` ansehen.
3. Ursachen beheben (Komponente/Layout/Tokens, nicht Tests abschwächen). Freigegebene Features mit visueller Regression:
   Ursache finden; nur wenn die Änderung gewollt ist und der Nutzer zustimmt → `npm run qa:baseline -- --feature <id>`.
4. Gezielt erneut prüfen (nur Betroffenes). `QA_REPORT.md` (Abschnitt „Letzter Lauf“) und `WORK_LOG.md` aktualisieren.
