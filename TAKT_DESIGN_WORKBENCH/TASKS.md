# Aufgaben – TAKT Design Workbench

> Pflege: Checkboxen abhaken, neue Aufgaben mit Datum ergänzen, Erledigtes in `WORK_LOG.md` protokollieren.
> Priorität: **P1** = als Nächstes · **P2** = bald · **P3** = später/optional. Stand: 24.11.2026, Ende Session 2.
> Umsetzungsstand des Bauplans je Paket: `docs/BAUPLAN_STATUS.md`.

## 0. Übernahme auf den eigenen Rechner (P1, ~15 Min.) – siehe HANDOFF.md
- [ ] Ordner `TAKT_DESIGN_WORKBENCH` nach `G:\Projekte\97_Uebernahme\TAKT_DESIGN_WORKBENCH` kopieren (**neben** `TAKT-Merge-Git`, nicht hinein)
- [ ] Optional eigenes Git-Repo im Workbench-Ordner (die Workbench versioniert dann auch `data/workbench.json`)
- [ ] `npm install` · `npx playwright install chromium`
- [ ] `npm start` · `npm run check` · `npm test` · `npm run qa` (erzeugt Baselines für diesen Rechner) · `npm run qa:baseline` nach Sichtung
- [ ] Wer Session 1 schon genutzt hat: Workbench › Daten & Backup › **Seed abgleichen …** (sonst „Zurücksetzen“)
- [ ] Handy: `npm run lan`, im Launcher „Aufs Handy“ (QR-Link mit WLAN-PIN), einmal bedienen und bewerten

## 1. Phase 1 – Bestandsaufnahme TAKT (P1) → `/takt-phase1`, Anleitung `docs/PHASE1_BESTANDSAUFNAHME.md`
- [ ] Git-Status/Branch/Commit/Untracked des TAKT-Projekts dokumentieren (**nur lesen**; bekannte lokale Änderungen nicht anfassen)
- [ ] Aktuelle Version und Projektkopien identifizieren, maßgebliche Kopie begründen
- [ ] Modulregister und Navigation auslesen → Modul-/Feature-Tabelle mit Belegen; Seed angleichen (Module mit `assumption: true`
      bestätigen oder entfernen, fehlende echte Module ergänzen), danach „Seed abgleichen …“
- [ ] Theme-Farbwerte Graphite/Horizon/Intensiv aus Flutter übernehmen (`tokens.js`), Kontrast-Audit, `npm run qa`
- [ ] Persona und Datenquellen gegen die Grundsatzfragen prüfen (App-Ebene › Grundsatzfragen)
- [ ] Frühere HTML-Prototypen/Konzepte als Referenz verknüpfen; `docs/PHASE1_ERGEBNIS.md` schreiben

## 2. Entscheiden (P1, laufend – der Nutzer entscheidet, Claude bereitet vor)
- [ ] Demo-Launcher: drei Versionen am Laptop und am Handy bedienen und bewerten (Sterne + 5 Kriterien)
- [ ] `/takt-round-prep app` → Runde „App-Ebene“: App-Richtung, Grundsatzfragen (Persona, Sync, Umfang, Quellen, Banking,
      Gesundheit, Rechtsprüfung, Android), wichtigste Muster – Arbeitsauftrag → `/takt-work-order`
- [ ] Danach Modul für Modul nach Ausbaustufen (Übersicht › Fahrplan): Modul-Richtung, Startseite, Tier-1-Features mit Scorecard,
      Gates, QA, Freigabe; Gerätetest für Tier 1 (`docs/GERAETETEST.md`)
- [ ] Nach den ersten Freigaben: `npm run spec -- --released` (Umsetzungsvorlagen für Flutter, `/takt-spec`)

## 3. Inhalte und Module (P2)
- [ ] Skelett-Features (Status „Nicht untersucht“) je Modul mit Varianten füllen – erst nach der Richtungswahl, damit nur die
      gewählte Richtung gebaut wird
- [ ] Einkaufsliste: nach der Entscheidung `shopping.list` („Wem gehört die Lebensmittel-Liste?“) Eigentum von Ernährung
      (`nutShopping`) zu „Einkauf & Haushalt“ (`shoppingLists`) verlagern (Bauplan 5.13, DATENWELT B5); `nutrition.shopping` wird
      dann Verknüpfung; `nutShopping.spentMonth` aus `finance.transactions` ableiten (Budget-Rest folgt „Einkauf fertig“ sofort)
- [ ] Neue Module (24.11.): Ziele bearbeiten/archivieren wiederherstellen, `goals.settings` gestalten; Einkauf: Laden anlegen,
      Gänge umbenennen, Wartung anlegen/bearbeiten (recurrence-picker); Dokumente: Erinnerungsstufen frei wählbar (Entscheidung),
      Entsperr-Abfrage für sensible Module (`prefs.privacy.sensitive`), Hinweis „Vorlage in Dokumente“ aus Finanzen › Abos
- [ ] Fachliche Prüfung der Aufbewahrungsrichtwerte (Dokumente) und der Gewährleistungstexte
- [ ] Kredite (Finanzen), Allokation (Trading) als Features ergänzen; Import CSV/CAMT, Entnahmeplan, Widgets, Teilen ausarbeiten
- [ ] Fachliche Prüfung der Gesundheits-, Finanz- und Steuertexte (Grundsatzfrage „Rechtsprüfung“) vor jeder Veröffentlichung
- [ ] Börsenfeiertage gegen den offiziellen Xetra-Kalender abgleichen (Annahme, Stand 24.11.2026)

## 4. Werkzeug und Architektur (P2)
- [ ] **Skalierung:** Versions-Snapshots und QA-Ergebnisse je Feature in eigene Dateien auslagern (Server-API erweitern);
      erledigt: Welt nicht mehr im Zustand, Rückgängig mit strukturellem Teilen (0,3 MB statt ~180 MB für 60 Schritte)
- [ ] **Migrationskette** (`migrations[n]`, Backup vor Migration, Snapshots mitmigrieren) – erst nötig, wenn sich Felder
      inkompatibel ändern (bisher alles additiv in Schema 2)
- [ ] QA-Sonde: DOM-Knotenbudget; E2E-Suite in `qa/e2e/` aufteilen (erledigt: `legal-present`, `money-format`, Privatsphäre im
      App-Modus, statische `legal`-Prüfung in `npm run check`)
- [ ] Hinweise aus `npm run check` abbauen (`Math.random`/`Date.now`/`Intl` in älteren Komponenten → `ctx.newId/now/fmt`)
- [ ] Launcher: Tageszeit-Stationen (07:30/12:30/18:30) für kontextabhängige Startseiten
- [ ] Deklaratives Modell erweitern: Container-/Gruppen-Block, Props je Breakpoint, Feldmapping in `bind`

## 5. Flutter-Überführung (P2, nach Phase 1 und ersten Freigaben)
- [ ] Token-Abgleich mit den Flutter-Themes (`takt_tokens.dart` aus der Workbench gegen das Projekt)
- [ ] Je Komponente `flutter: { widget, propMap, events }` vervollständigen (Bestand nutzt teils die Tabelle in `core/flutter.js`)
- [ ] Status „Implementiert“/„Regression bestanden“ mit Verweis auf Flutter-Commit/Screen; `npm run spec:check` zeigt Abweichungen
- [ ] Später: Entitäten-Dart, ARB, Widgetbook, integration_test (bewusst erst nach Phase 1, sonst geraten)

## 6. Optional (P3)
- [ ] PWA offline über HTTPS-Export bzw. `adb reverse` (Service Worker braucht Secure Context), APK-Hülle
- [ ] Blind-/Duellmodus im Launcher, Scorecard mit Gewichten je Kriterium im Launcher
- [ ] Desktop-App-Hülle nur, falls Browser + Server im Alltag stören

## Erledigt
- [x] Session 1 (Nacht 24.11.2026): Workbench, Design Studio, Vorschau, Varianten & Vergleich, Themes/Tokens, Komponenten,
      Versionierung/Freigabe/Sperre, QA (Sonde, CLI, E2E, Screenshots, Regression), Persistenz, Import/Export, Seed
- [x] Session 2 (24.11.2026, „V2 – beste Basis“): Bauplan aus 7 Perspektiven + 2 Kritiken; Demo-Launcher mit drei Versionen und
      App-Rahmen; Ebenenmodell, App-Ebene, Entscheidungsrunden, Gates, Scorecard, Arbeitsauftrag; gemeinsame Datenwelt mit
      Szenarien; Fachmodule Finanzen, Sparpläne, Trading, Fitness, Ernährung, Wetter (+ alle übrigen Module ausgebaut);
      Formatstandard, Wiederholungslogik, Gesundheits-/Finanzmathematik mit Tests; Leitlinien; WLAN-PIN; Spezifikation als JSON;
      Integritätsprüfung; Tastenkürzel und Querformat im Launcher – Details in WORK_LOG.md
