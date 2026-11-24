---
description: Entscheidungsrunde vorbereiten – offene Fragen mit Belegen und begründeter Empfehlung aufbereiten
argument-hint: "[app | module:<id> | leer = Top 7 der Inbox]"
---
Bereite eine Entscheidungsrunde für den Umfang `$ARGUMENTS` vor. Du entscheidest **nicht** selbst – der Nutzer entscheidet
in der Workbench (Entscheidungsrunden, Rundenlimit 2). Deine Aufgabe ist eine knappe, belegte Vorlage.

1. Stand laden: `data/workbench.json` (sonst Seed). Offene Fragen nach Blockierwirkung: `node tools/work-order.mjs` (Abschnitt
   „Als Nächstes entscheiden“) bzw. `rankDecisions` aus `app/src/core/process.js`. Umfang filtern (App/Muster oder Modul).
2. Belege je Frage sammeln:
   - Launcher-Feedback (`data/feedback.jsonl` + `state.feedback`): Sterne, Kriterien (zeit, einhand, uebersicht, ruhe, module20),
     „Übernehmen“-Wünsche, Kommentare – je Option zählen.
   - Scorecards (`state.scores`) und Gewichte (`state.app.weights`) bei Variantenfragen.
   - Abdeckung je Richtung (`versionCoverage` in `core/directions.js`), Gates (`core/process.js`).
   - Leitlinien: `docs/HEALTH_GUIDELINES.md`, `docs/FINANCE_GUIDELINES.md`, `docs/TEXT_STIL.md`, Leitbild (`state.app`).
3. Schreibe `docs/work-orders/<YYYY-MM-DD>-rundenvorbereitung.md`: je Frage (max. 7) Frage, Optionen (1 Zeile), vorhandene
   Empfehlung, **Belege** (Zahlen), deine Einschätzung (1–3 Sätze, mit Unsicherheit), Reversibilität, was bei „Parken“ passiert.
   Am Ende: vorgeschlagene Reihenfolge und Zeitbox (Minuten).
4. Wenn eine vorhandene Empfehlung den Belegen widerspricht: im Dokument deutlich markieren (nicht still ändern).
5. Dem Nutzer: Pfad der Datei, Top-3 Fragen mit Empfehlung, Hinweis „Workbench › Entscheidungsrunden › Neue Runde“.
