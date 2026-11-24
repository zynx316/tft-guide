---
description: Phase 1 – Bestandsaufnahme des echten TAKT-Projekts (nur lesen) und Abgleich mit der Workbench
argument-hint: "[Pfad zum TAKT-Projekt, Standard G:\Projekte\97_Uebernahme\TAKT-Merge-Git]"
---
Führe Phase 1 gemäß `docs/PHASE1_BESTANDSAUFNAHME.md` aus. Projektpfad: $ARGUMENTS (leer = `G:\Projekte\97_Uebernahme\TAKT-Merge-Git`).

Strikt nur lesend im TAKT-Projekt (keine Änderungen, kein add/commit/stash/reset/checkout). Nutze den Sub-Agenten `takt-analyst`
für die breite Suche (Modulregister, Navigation, Themes, Prototypen, Dokumente) und behalte Entscheidungen selbst.

Ergebnis:
1. `docs/PHASE1_ERGEBNIS.md` (Git-Status, Version, Projektkopien, Module/Features-Tabelle, Theme-Farbwerte, gefundene Prototypen/Konzepte inkl. Fitness/Finanzen-Referenzen, Abweichungen zur Workbench).
2. Seed anpassen: `app/src/seed/modules/*.js` – Module/Features an das echte Modulregister angleichen (fehlende ergänzen,
   Annahmen kennzeichnen/entfernen, `source` auf die gefundene Quelle setzen), `SEED_VERSION` erhöhen.
3. Theme-Werte in `app/src/design-system/tokens.js` mit den echten TAKT-Themes abgleichen (TODO dort), danach `npm run qa`.
4. `npm run check` und `npm run qa:e2e` grün; `TASKS.md` und `WORK_LOG.md` aktualisieren. Dem Nutzer sagen, dass er in der
   Workbench „Daten & Backup › Neue Seed-Inhalte übernehmen“ ausführen soll (oder bei noch ungenutzter Workbench zurücksetzen).
