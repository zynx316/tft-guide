---
description: Session-Start – Stand der TAKT Design Workbench erfassen und nächste Schritte vorschlagen
---
Du arbeitest an der TAKT Design Workbench (siehe CLAUDE.md).

1. Lies `HANDOFF.md`, `TASKS.md` und die letzten ~60 Zeilen von `WORK_LOG.md`.
2. Prüfe den Zustand: `git status` (falls die Workbench ein eigenes Repo ist), `npm run check`, ob `data/workbench.json` existiert
   (Größe, `meta.updatedAt`, Anzahl Module/Features via `node -e`), und ob `qa/results/latest.md` existiert (Status, Datum).
3. Fasse in max. 12 Zeilen zusammen: Stand, offene Phase, Top-3 der nächsten Aufgaben aus TASKS.md, Risiken.
4. Frage nur, wenn eine Entscheidung wirklich beim Nutzer liegt; sonst mit der obersten offenen Aufgabe beginnen
   und den Fortschritt in `WORK_LOG.md` (chronologisch, mit Datum) sowie die Checkboxen in `TASKS.md` pflegen.
