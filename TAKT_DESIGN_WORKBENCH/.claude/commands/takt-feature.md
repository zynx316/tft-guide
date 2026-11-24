---
description: Ein Feature in der Workbench bearbeiten (Anforderungen → Varianten → Vergleich → QA → Freigabe-Vorbereitung)
argument-hint: "<feature-id, z. B. calendar.week>"
---
Bearbeite das Feature `$ARGUMENTS` der TAKT Design Workbench.

1. Lies das Feature aus `data/workbench.json` (falls vorhanden, sonst Seed) – Zweck, Anforderungen, Varianten, Entscheidungen, QA.
2. Prüfe, ob es gesperrt (freigegeben) ist. Wenn ja: nichts ändern, sondern den Nutzer fragen, ob eine neue Arbeitsversion gewünscht ist.
3. Arbeite die Lücken ab: Anforderungen/Interaktionen vollständig? Varianten strukturell verschieden (nicht nur Farben)?
   Fehlen Komponenten? → Komponenten in der Library bauen/verbessern (CONTRACT.md), nicht feature-spezifisch hacken.
4. Änderungen an Live-Daten: bevorzugt über die Workbench-UI durch den Nutzer bzw. über die Store-Aktionen (`actions.*`).
   Direkte Edits an `data/workbench.json` nur bei gestopptem Server und nur für nicht gesperrte Features; vorher Backup kopieren.
5. `npm run check` · `npm run qa -- --feature $ARGUMENTS --all-variants --themes graphite,horizon,intensiv` → Befunde beheben.
6. Kurzbericht: was geändert, QA-Ergebnis, offene Entscheidung für den Nutzer (Variantenwahl/Freigabe macht der Nutzer).
