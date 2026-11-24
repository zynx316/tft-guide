# Designsystem – TAKT V2.0 (in der Workbench)

Implementierung: `app/src/design-system/tokens.js` (Tokens & Themes) · `app/src/design-system/takt-base.css` (Primitive, App-Shell,
Layouts) · `app/src/library/` (Primitive `ui.js`, Komponenten, Vertrag `CONTRACT.md`). Live-Dokumentation in der Workbench unter
**Komponenten › Design Tokens & Themes** (Farbrollen, Kontrast-Audit, Typografie, Abstände) und je Komponente (Galerie, Zustände,
Props, Datenslots, Events, Verwendung).

## Grundregeln
1. **Eine Quelle:** Alle Werte stehen in `tokens.js` und werden als CSS-Variablen `--tk-…` ausgegeben. Komponenten verwenden
   keine festen Farben/Abstände. Eine Token-Änderung wirkt sofort in allen Komponenten, Varianten und Vorschauen.
2. **Themes ändern nur Farbe:** Hintergrund, Oberflächen, Kontraste, Akzente, Schatten, Diagrammpalette. Nie Abstände, Größen,
   Typografie oder die Informationsarchitektur.
3. **Kontrast ist geprüft:** `auditTheme()` prüft je Theme 16 Paare (Text auf Hintergrund/Oberfläche, Text auf Akzent, Status auf
   Soft-Flächen, aktive Navigation). Stand: **alle drei Themes bestanden**. Zusätzlich misst die QA-Sonde den Kontrast real gerenderter Texte.
4. **Mobile zuerst bedienbar:** Touch-Ziele auf Mobile ≥ 36 px (Ziel 44 px, `--tk-size-touch`), Eingaben 16 px (kein Zoom auf iOS),
   Dialoge werden zu Bottom-Sheets, Navigation zur Bottom-Navigation.
5. **Komponenten statt Einzelanfertigung:** Neue Muster als Komponente in die Library, nicht in eine Variante hineinbauen.

## Themes
| Theme | Charakter | Schema | Akzent |
|---|---|---|---|
| **Graphite** (Standard) | Ruhiges, neutrales Dunkelgrau, kühler Blau-Akzent – für tägliche Nutzung | dunkel | `#6aa6ff` |
| **Horizon** | Hell und luftig, weiße Flächen, Blau/Petrol – für Tageslicht und Lesbarkeit | hell | `#1a62bb` |
| **Intensiv** | Hoher Kontrast, Tiefschwarz, Orange/Magenta – Fokus und Motivation | dunkel | `#ff7a1a` |

**Farbrollen** (jedes Theme definiert alle): `bg, surface, surface2, surface3, overlay, border, borderStrong, text, textMuted,
textSubtle, textOnAccent, accent, accentHover, accentSoft, accent2, success(+Soft), warning(+Soft), danger(+Soft), info(+Soft),
focus, navBg, navActive` + `chart-1…6` + Schatten `sm/md/lg`.
> **Offen (Phase 1):** Farbwerte mit den echten TAKT-Themes im Flutter-Projekt abgleichen (`tokens.js`, TODO).

## Basis-Tokens
| Gruppe | Werte |
|---|---|
| Schrift | Inter / Segoe UI Variable / System · Größen xs 11 · sm 12,5 · md 14 · lg 16 · xl 19 · 2xl 23 · 3xl 29 · 4xl 36 · Gewichte 400/500/600/700 |
| Abstände | 0 · 4 · 8 · 12 · 16 · 20 · 24 · 28 · 32 · 40 · 48 · 64 px (`--tk-space-N`) |
| Radien | xs 4 · sm 6 · md 10 · lg 14 · xl 20 · pill |
| Größen | Touch 44 · Control 36 (sm 28) · Icon 18 · App-Bar 56 · Bottom-Nav 64 · Nav-Rail 76 · Sidebar 232 · Inhalt max. 1280 |
| Breakpoints | Mobile < 600 · Tablet 600–1023 · Desktop ≥ 1024 (wide ≥ 1366) |
| Bewegung | fast 120 ms · base 180 ms · slow 280 ms · Easing `cubic-bezier(.2,.7,.2,1)` · `prefers-reduced-motion` respektiert |

## App-Shell & Layouts
- **App-Rahmen:** Desktop Sidebar mit Modulen · Tablet Navigationsleiste (Icons + Kurzlabel) · Mobile App-Bar + Bottom-Navigation (4 Module + „Mehr“).
- **Layouts für Varianten:** `stack` (eine Spalte, optional schmal) · `split` (2/3 + 1/3, Mobile untereinander) · `sidebar` (Panel + Inhalt,
  Mobile einklappbar) · `grid` (12er-Raster, Spannweite je Block) · `tabs` (Reiter). Regionen: Kopf, Hauptbereich, Seitenspalte,
  Seitenleiste, Fuß, unten fixiert. Blöcke können je Breakpoint ausgeblendet werden.

## Primitive (`library/ui.js`)
Button (default/primary/ghost/danger, sm, Icon-only) · IconButton · Badge (Töne) · Chip (Filter) · Card · SectionHeader · Field ·
Input · Textarea · Select · Search · Check (Touch-Fläche 40 px mobil) · Switch · Segmented · Tabs · Progress · Avatar ·
EmptyState · ErrorState · Skeleton · Sparkline · Delta · `toneColor()`. Zusätzlich in der Runtime: Dialog/Bottom-Sheet, Toast.

## Zustände
Jede Variante ist in **Standard, Leer, Lädt, Fehler** prüfbar (Vorschau-Werkzeugleiste). Leer = alle gebundenen Daten leer →
Komponenten zeigen `EmptyState`. Lädt/Fehler rendert die Runtime generisch (Skeleton / Fehler mit „Erneut versuchen“), sofern die
Komponente das nicht selbst übernimmt.

## Komponenten (45)
| Kategorie | ID | Name | Zweck | Datei |
|---|---|---|---|---|
| Struktur | page-header | Seitenkopf | Titel, Untertitel und Primäraktion eines Feature-Screens. Auf Mobile kompakt, Aktion als Icon-Button. | core/structure.js |
| Navigation | action-bar | Aktionsleiste | Reihe von Schnellaktionen. Auf Mobile als horizontal scrollbare Icon-Buttons mit Beschriftung. | core/structure.js |
| Navigation | search-filter | Suche & Filter | Suchfeld plus Filterchips. Setzt ctx.ui.query und ctx.ui.filter – Listen, Tabellen und Karten filtern automati … | core/structure.js |
| Navigation | view-switcher | Ansichts-Umschalter | Segmentierter Umschalter (z. B. Tag/Woche/Monat). Schreibt in den geteilten UI-Zustand (ctx.ui[uiKey]); andere … | core/structure.js |
| Daten | activity-feed | Aktivitäts-Verlauf | Chronologische Zeitleiste von Ereignissen (Änderungen, Verlauf, Log). | core/data.js |
| Daten | card-grid | Kartenraster | Raster aus Inhaltskarten (Notizen, Artikel, Kanäle …) mit Icon/Farbfeld, Text-Auszug und Tags. Spaltenzahl res … | core/data.js |
| Daten | data-table | Tabelle | Sortierbare Tabelle. Spalten per "key:Label:typ" (typ: text|number|currency|percent|date|badge|spark). Mobile: … | core/data.js |
| Daten | detail-panel | Detailansicht | Zeigt das in ctx.ui.selectedId gewählte Element (Master-Detail). Felder frei konfigurierbar, Aktionen Bearbeit … | core/data.js |
| Daten | item-list | Liste | Universelle Liste (Titel, Untertitel, Meta, Badge, optional Checkbox). Respektiert Suche/Filter, wählt Element … | core/data.js |
| Daten | metric-row | Kennzahlen-Reihe | KPI-Kacheln mit Wert, Einheit, Trend und optionaler Sparkline. Desktop als Reihe, Mobile als 2er-Raster oder h … | core/data.js |
| Daten | progress-list | Fortschrittsliste | Beschriftete Fortschrittsbalken (Budgets, Ziele, Kapazitäten) mit Ist/Soll und Warnfarbe bei Überschreitung. | core/data.js |
| Diagramme | chart | Diagramm | SVG-Diagramm: Balken, Linie, Fläche oder Ring. Mehrere Serien, Tooltip per Hover/Tap, Zeitraum-Umschalter opti … | core/charts-forms.js |
| Formulare | form-card | Formular | Konfigurierbares Formular ("key:Label:typ[:opt1|opt2]", Pflichtfelder mit *). Validiert, fügt Eintrag in einen … | core/charts-forms.js |
| Formulare | quick-add | Schnelleingabe | Einzeilige Eingabe zum schnellen Anlegen (Enter). Fügt in den gebundenen Datenslot ein – gebundene Listen aktu … | core/charts-forms.js |
| Feedback | notice-banner | Hinweis-Banner | Kontextueller Hinweis (Info, Warnung, Erfolg, Fehler) mit optionaler Aktion; schliessbar. | core/structure.js |
| Kalender | agenda | Agenda | Chronologische Termin-Liste für einen oder mehrere Tage, gruppiert nach Tag, mit Hinweis auf freie Zeitfenster … | calendar/agenda.js |
| Kalender | calendar-legend | Kategorien-Legende | Kategorien mit Farbe und Anzahl der Termine der gewählten Woche. Antippen filtert alle Kalenderblöcke (ctx.ui. … | calendar/calendar-legend.js |
| Kalender | calendar-month | Kalender Monat | Monatsraster mit Termin-Chips (Mobile: Punkte), Tag wählen setzt ctx.ui.selectedDate; optional Tagesliste unte … | calendar/calendar-month.js |
| Kalender | calendar-week | Kalender Tag/Woche | Zeitraster mit Terminen nach Uhrzeit, Überlappungen nebeneinander, Jetzt-Linie und Anlegen per Klick auf freie … | calendar/calendar-week.js |
| Kalender | event-form | Termin-Formular | Vollständiges Formular zum Anlegen eines Termins mit Kategorie-Chips, Dauer-Schnellwahl, Wiederholung und Vali … | calendar/event-form.js |
| Kalender | mini-month | Mini-Monat | Kompakter Monatsnavigator mit Terminpunkten. Auswahl setzt ctx.ui.selectedDate; die gewählte Woche wird hervor … | calendar/mini-month.js |
| Aufgaben | focus-next | Fokus: Als Nächstes | Verbindet Termine und Aufgaben zur Tagesfokus-Liste: laufender/nächster Termin, überfällige Aufgaben, Zeitleis … | tasks/focus-next.js |
| Aufgaben | kanban-board | Kanban-Board | Spalten nach Status, Karten per Drag & Drop oder über das Verschieben-Menü bewegbar. Mobile: wischbare Spalten … | tasks/kanban-board.js |
| Aufgaben | project-list | Projekte | Projekte aus den Aufgaben abgeleitet: offene/erledigte Aufgaben, Fortschritt und nächste Fälligkeit. Antippen  … | tasks/project-list.js |
| Aufgaben | task-detail | Aufgaben-Detail | Detailpanel zur gewählten Aufgabe (ctx.ui.selectedId): Titel, Priorität, Status, Fälligkeit, Projekt, Wiederho … | tasks/task-detail.js |
| Aufgaben | task-list | Aufgabenliste | Aufgaben mit Priorität, Fälligkeit relativ zu „heute“ (überfällig rot), Projekt, Unteraufgaben-Zähler und Abha … | tasks/task-list.js |
| Inhalte | capture-panel | Bild erfassen | Quelle wählen (Kamera, Datei, Zwischenablage – simuliert), Dropzone, Verarbeitungsfortschritt (laden → erkenne … | content/capture-panel.js |
| Inhalte | kb-article | Wissensartikel | Zeigt den gewählten Artikel (ctx.ui.selectedId) mit Markdown-Darstellung, Inhaltsverzeichnis (Desktop), Metada … | content/kb-article.js |
| Inhalte | kb-tree | Wissensbaum | Hierarchische Navigation (Bereiche › Kategorien › Artikel), auf-/zuklappbar. Aktiver Artikel = ctx.ui.selected … | content/kb-tree.js |
| Inhalte | note-editor | Notiz-Editor | Bearbeitet die gewählte Notiz (ctx.ui.selectedId): Titel, Markdown-Textbereich mit Formatierungsleiste, Tags,  … | content/note-editor.js |
| Inhalte | note-list | Notizliste | Notizen als kompakte Liste oder Karten-Raster: angeheftete zuerst, Auszug, Tags, relatives Datum. Beachtet Suc … | content/note-list.js |
| Inhalte | ocr-result | Erkennungsergebnis | Erkannter Text der gewählten Erfassung (ctx.ui.selectedId) mit Markierung unsicherer Wörter (Tippen übernimmt  … | content/ocr-result.js |
| Wetter | weather-alerts | Wetterwarnungen | Amtliche Warnungen nach Schweregrad (Hinweis, markant, Unwetter) mit Zeitraum und Details zum Aufklappen. Warn … | content/weather-alerts.js |
| Wetter | weather-daily | Tagesvorhersage | 7–10-Tage-Vorhersage mit Zustands-Icon, Regenwahrscheinlichkeit und Min/Max-Balken über den gesamten Zeitraum. … | content/weather-daily.js |
| Wetter | weather-hourly | Stündliche Vorhersage | Temperaturkurve (SVG) mit Zustands-Icons und Niederschlagsbalken je Stunde. Auf Mobile horizontal wischbar (nu … | content/weather-hourly.js |
| Wetter | weather-now | Aktuelles Wetter | Aktuelle Bedingungen groß: Temperatur, gefühlte Temperatur, Zustand mit Icon, Wind, Niederschlag, Luftfeuchte  … | content/weather-now.js |
| Vertrieb | channel-cards | Kanal-Karten | Verkaufskanäle (Shopify, Etsy, Amazon …) als Karten mit Status, Umsatz, Bestellungen und letztem Sync. Aktion  … | insights/channel-cards.js |
| Vertrieb | order-pipeline | Bestell-Pipeline | Bestellungen nach Status (neu → bezahlt → versendet → zugestellt) mit Zählern, Summen und Weiterschalten per A … | insights/order-pipeline.js |
| Trading | order-ticket | Order-Ticket (Simulation) | Kauf/Verkauf erfassen mit Stückzahl, Markt-/Limit-Order, Validierung (Guthaben, Bestand) und Bestätigungsdialo … | insights/order-ticket.js |
| Trading | portfolio-summary | Depot-Übersicht | Depotwert, Gewinn/Verlust (absolut und prozentual), Tagesveränderung, Allokation und Positionsliste. Per „layo … | insights/portfolio-summary.js |
| Trading | price-chart | Kursdiagramm | Kursverlauf eines Wertpapiers als Linie, Fläche oder Kerzen (OHLC) mit Zeitraum-Umschalter (1T/1W/1M/1J) und C … | insights/price-chart.js |
| Fitness | activity-rings | Aktivitätsringe | Konzentrische Ziel-Ringe (z. B. Bewegung, Training, Schritte) mit Wert/Ziel-Legende. Antippen eines Rings zeig … | insights/activity-rings.js |
| Fitness | workout-card | Workout-Karte | Ein Training mit Übungen und Sätzen (Wdh. × Gewicht). Sätze sind abhakbar, Fortschrittsbalken und „Training be … | insights/workout-card.js |
| Finanzen | account-cards | Konten-Karten | Konten (Giro, Tagesgeld, Kreditkarte, Depot) mit Saldo, maskierter IBAN und Mini-Verlauf plus Gesamtvermögen.  … | insights/account-cards.js |
| Finanzen | transaction-list | Transaktionsliste | Umsätze nach Datum gruppiert (Heute/Gestern/Datum) mit Kategorie-Icon, farbigem Betrag und Tagessumme. Reagier … | insights/transaction-list.js |

## Flutter-Überführung (Vorbereitung)
- `Daten & Backup › Design-Tokens exportieren` liefert `takt-design-tokens.json` (Basis, Themes, Farbrollen).
- Geplant (TASKS.md): semantischer Export (ARGB, TextTheme-Rollen, ColorScheme-Mapping), je Komponente `flutter: { widget, propMap }`,
  Export einer freigegebenen Feature-Spezifikation (Anforderungen, Interaktionen, Variante, Bindungen) als Umsetzungsvorlage.
