# Aufgaben – TAKT Design Workbench

> Pflege: Checkboxen abhaken, neue Aufgaben mit Datum ergänzen, Erledigtes in `WORK_LOG.md` protokollieren.
> Priorität: **P1** = als Nächstes · **P2** = bald · **P3** = später/optional. Stand: 24.11.2026, Ende Session 2 (Mittag).
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
- [ ] Offene Gestaltungsfragen der neuen Varianten (je eine Entscheidung mit Empfehlung im Manifest, z. B. Fächer vs. Tasten im
      Aufgaben-Eingang, Pinnwand, Kapitelkarten, Beleg-Kategorien als Kacheln, Modulsperre Dokumente, Vorlage-Verweis aus
      Finanzen, Fitness-Plan im Erststart) – erscheinen in der Entscheidungs-Inbox
- [ ] Freigegebenes Demo-Feature `calendar.month`: seit der Freigabe (Session 1) durch Basisregeln und den Vorschau-Rahmen leicht
      verändert (0,23–0,36 % gegenüber den Session-1-Bildern, siehe `QA_REPORT.md`; `weather.current` ist pixelgleich).
      Entscheiden: Freigabe so belassen oder per „Neue Arbeitsversion“ neu freigeben

## 3. Inhalte und Module (P2)
- [ ] Skelett-Features (Status „Nicht untersucht“) je Modul mit Varianten füllen – erst nach der Richtungswahl, damit nur die
      gewählte Richtung gebaut wird
- [ ] Einkaufsliste: nach der Entscheidung `shopping.list` („Wem gehört die Lebensmittel-Liste?“) Eigentum von Ernährung
      (`nutShopping`) zu „Einkauf & Haushalt“ (`shoppingLists`) verlagern (Bauplan 5.13, DATENWELT B5); `nutrition.shopping` wird
      dann Verknüpfung. Das Budget in „Einkauf & Haushalt“ rechnet schon live aus den Buchungen; nur die ältere Liste in Ernährung
      zeigt noch den festen Wert `nutShopping.spentMonth`
- [ ] Neue Module (24.11.): Ziele bearbeiten/archivieren wiederherstellen, `goals.settings` gestalten; Einkauf: Laden anlegen,
      Gänge umbenennen, Wartung anlegen/bearbeiten (recurrence-picker); Dokumente: Erinnerungsstufen frei wählbar (Entscheidung),
      Entsperr-Abfrage für sensible Module (`prefs.privacy.sensitive` wird gespeichert, hat in der Demo noch keine Wirkung)
- [ ] Erststart weiterer Features ruhig machen (Start-Seiten aller Module sind es): z. B. fitness.goals/body/activity/recovery,
      notes.overview, nutrition.log stapeln noch mehrere Leerkarten – mit `hideWhenEmpty`/`showWhenEmpty`/`quietEmpty` lösbar
- [ ] Fachliche Prüfung der Aufbewahrungsrichtwerte (Dokumente) und der Gewährleistungstexte
- [ ] Kredite (Finanzen), Allokation (Trading) als Features ergänzen; Import CSV/CAMT, Entnahmeplan, Widgets, Teilen ausarbeiten
- [ ] Fachliche Prüfung der Gesundheits-, Finanz- und Steuertexte (Grundsatzfrage „Rechtsprüfung“) vor jeder Veröffentlichung
- [ ] Börsenfeiertage gegen den offiziellen Xetra-Kalender abgleichen (Annahme, Stand 24.11.2026)

## 4. Werkzeug und Architektur (P2)
- [ ] **Skalierung:** Versions-Snapshots und QA-Ergebnisse je Feature in eigene Dateien auslagern (Server-API erweitern);
      erledigt: Welt nicht mehr im Zustand, Rückgängig mit strukturellem Teilen (0,3 MB statt ~180 MB für 60 Schritte)
- [ ] **Migrationskette** (`migrations[n]`, Backup vor Migration, Snapshots mitmigrieren) – erst nötig, wenn sich Felder
      inkompatibel ändern (bisher alles additiv in Schema 2)
- [ ] QA-Sonde: DOM-Knotenbudget, Textüberlappung; E2E-Suite in `qa/e2e/` aufteilen (erledigt: `legal-present`, `money-format`,
      Privatsphäre im App-Modus, „…“, gequetschte Titel und zu schmale Spalten bei großer Schrift, statische `legal`-Prüfung)
- [ ] **Abgeleitete Welt-Werte live halten:** `<modul>Summary`, `homeHeadline`, `homeHintCards` werden beim Laden berechnet und folgen
      Änderungen in der Demo nicht (Start-Untertitel bleibt nach dem Abhaken der Aufgabe stehen) – Ableitung in die Runtime ziehen
- [ ] Tagesfortschritt einheitlich definieren (Start-Ringe „0 von 6“ vs. Aufgaben-Diagramm „2/6 erledigt“), Vorwoche in der Welt
      (Delta im Wochenrückblick)
- [ ] Privatsphäre-Modus: Ausnahmeliste bestätigen (Allokationsanteile, PP-Abweichung, Kurse öffentlicher Papiere, Sparziel-%,
      Annahmen 3/5/7 % bleiben sichtbar) – Entscheidung des Nutzers
- [ ] App-Rahmen bei großer Schrift: Kopfzeile und Reiterbeschriftungen der Leiste („Einstellun…“) bleiben gekürzt (feste Höhe);
      prüfen, ob Reiter bei 200 % nur Symbole zeigen sollen
- [ ] Große Schrift, Feinschliff (alle Varianten sind bei 200 % ohne Befund der Sonde; Rest ist Optik): Querschnitt-Komponenten
      `_xc-css.js` von `overflow-wrap:anywhere` auf `break-word` (Versionssprung ~20 Komponenten); Sparplan-Ausführungsliste
      zweispaltig eng; Depot-Positionen und „Auch wichtig“ mit Icon-Kachel; Kursalarm-Aktionen nur als Symbol; Kalender-Woche
      kürzt Termine in schmalen Überlappungsspalten (`data-clip-ok`, Volltext per Tippen); Wochenleiste nutrition.home/B eng;
      Notizkarten kürzen die Vorschau (line-clamp); `calendar/_cal.js › bigTextScale()` auf `ctx.textScale` umstellen;
      umbrechende Reiter (`.tk-tabs`) haben nur unter der letzten Zeile eine Grundlinie (optional: Linie je Zeile)
- [ ] Kleinigkeiten beim allerersten Start: `GET /api/state` antwortet 404, solange es noch keine `data/workbench.json` gibt
      (harmlose rote Konsolenmeldung im Browser; Client erwartet heute genau das); `work-order --round latest` ohne Runde endet
      mit Exit 1 (Hinweis steht in `/takt-work-order`)
- [ ] Viewport 320 px bei 200 % (außerhalb der Zielbreiten 360/390): Fitness `records-list`, `set-logger`, `weight-entry`,
      `focus-set` haben noch enge Stellen
- [ ] Launcher: Tageszeit-Stationen (07:30/12:30/18:30) für kontextabhängige Startseiten
- [ ] Bestehende Stände: nach jedem Pull **Daten & Backup › Seed abgleichen …** (neue Varianten, Bindungen, Module kommen sonst
      nicht in einen gespeicherten Stand)
- [ ] Deklaratives Modell erweitern: Container-/Gruppen-Block, Props je Breakpoint, Feldmapping in `bind`
- [ ] Master-Detail mobil (`preview/layouts.js`, Typ `sidebar`): Liste zuerst, nach Auswahl (`ctx.ui.selectedId`) Detail mit
      Zurück-Schritt; heute startet die Liste nur aufgeklappt (`layout.panelOpen` bei notes.overview/B, knowledge.browse/A,
      picture-to-text.history/A). Achtung: `detail-view` wählt mit `autoSelectFirst` sofort den ersten Eintrag

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
- [x] Session 2, Vormittag: Module Ziele, Einkauf & Haushalt, Dokumente & Verträge (19 Module des Bauplans); Abschluss-QA aller
      Modulgruppen mit Korrektur und Nachprüfung; Lückenschluss: alle 49 Tier-1-Features in allen drei Richtungen, ruhige
      Erststarts der Startseiten, Altlasten (check 0 Hinweise, Vertrag 0 Hinweise); große Schrift; Start/Suche/Erfassen kennen
      die neuen Module; Blockbedingungen `hideWhenEmpty`/`showWhenEmpty`, `quietEmpty`
- [x] Session 2, Mittag: Schrift 200 % in allen 348 Varianten (390/360/1440 px) ohne abgeschnittene Texte, zeichenweise Umbrüche
      oder zu schmale Spalten – 4 Modulgruppen mit Korrektur und unabhängiger Nachprüfung (alle „gut“), bei 100 % pixelgleich;
      Basisregeln für Chips, Badges, Reiter, Filterchips, Silbentrennung und Listenzeilen; `ctx.textScale`/`ctx.largeText`
