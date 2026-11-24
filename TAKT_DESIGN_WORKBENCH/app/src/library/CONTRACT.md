# Komponenten-Vertrag (TAKT Component Library)

Jede TAKT-Komponente ist **eine Definition** (JS-Objekt) in `app/src/library/components/<bereich>/<datei>.js`
und wird im `index.js` des Bereichs exportiert (`export default [compA, compB]`).
Die Registry (`library/registry.js`) sammelt alle Bereiche. Varianten (Feature-Designs) setzen sich
**deklarativ** aus diesen Komponenten zusammen. Wird eine Komponente verbessert, profitieren alle Varianten.

```js
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Card, Button, Badge, EmptyState, Icon } from '../../ui.js';
import { fmt } from '../../../lib/util.js';

export const taskList = {
  id: 'task-list',                 // eindeutig, kebab-case
  name: 'Aufgabenliste',            // Anzeigename (deutsch)
  category: 'Aufgaben',             // Gruppe in der Library (siehe CATEGORY_ORDER in registry.js)
  description: 'Kurzbeschreibung: Zweck + wann einsetzen.',
  version: '1.0',
  props: [                          // erzeugt automatisch den Inspector im Design Studio
    { name: 'title', label: 'Titel', type: 'text', default: 'Aufgaben' },
    { name: 'groupBy', label: 'Gruppieren nach', type: 'select', options: ['none', 'priority', 'due'], default: 'due' },
    { name: 'showDone', label: 'Erledigte zeigen', type: 'boolean', default: false },
    { name: 'limit', label: 'Max. Einträge', type: 'number', default: 8 },
    // type: text | textarea | number | boolean | select (options) | list (kommagetrennt -> string[])
  ],
  data: [                           // Datenslots – werden an Demo-Daten-Schlüssel gebunden (block.bind)
    { slot: 'items', label: 'Aufgaben', default: 'tasks', shape: '{id,title,due?,priority?,done?}[]', required: true },
  ],
  events: ['task.toggle', 'task.open'],   // Interaktions-Events, die emit() auslöst
  states: ['empty'],                // Zustaende, die die Komponente SELBST rendert ('empty' ist Pflicht bei Listen).
                                    // 'loading' / 'error' rendert die Runtime generisch, ausser sie stehen hier.
  css: `.tk-tasklist { … }`,        // NUR Token-Variablen (--tk-…), Klassenpraefix tk-<id>
  example: { props: { title: 'Heute' }, data: { items: [ … ] } },   // für Library-Galerie (Pflicht)
  render: ({ props, data, setData, ctx }) => html`…`,  // Preact-Funktionskomponente (Hooks erlaubt)
};
```

## render-Argumente

| Argument | Bedeutung |
|---|---|
| `props` | Default-Props zusammengefuehrt mit `block.props` |
| `data` | Objekt `{ slot: wert }` – gebundene Demo-Daten (bei Zustand *empty* leere Arrays) |
| `setData(slot, wertOderFn)` | Aendert die geteilten Vorschau-Daten. Alle Blöcke, die denselben Schlüssel binden, aktualisieren sich (z. B. Quick-Add -> Liste). Persistiert NICHT in die Workbench. |
| `ctx.bp` | `'mobile' \| 'tablet' \| 'desktop'` (echte Viewport-Breite der Vorschau) |
| `ctx.today` | Fester Referenz-"Jetzt"-Zeitpunkt (deterministisch für Screenshot-Regression) |
| `ctx.emit(event, detail)` | Meldet eine Interaktion an die Workbench (Interaktions-Log, Abdeckung) |
| `ctx.openDialog({ title, body: (close) => vnode, footer: (close) => vnode })` | Oeffnet Dialog (Mobile: Bottom-Sheet) |
| `ctx.toast(text)` | Kurze Rückmeldung |
| `ctx.ui` / `ctx.setUi(key, value)` | Geteilter UI-Zustand zwischen Blöcken: `query` (Suche), `filter` (Filterchip), `view` (Ansicht), `selectedId` (Master-Detail), `selectedDate` |

## Regeln
1. **Keine Hex-Farben** in Komponenten – nur `var(--tk-…)`. Themes duerfen nur Farben ändern.
2. Primitive aus `library/ui.js` verwenden (Button, Badge, Card, Input, Segmented, EmptyState …). Achtung: `Input`, `Textarea` und
   `Search` rufen `onInput` mit dem **Wert** (String) auf, nicht mit dem Event – `onInput=${(v) => setText(v)}`.
3. Responsive über `ctx.bp` oder Selektoren `.bp-mobile …` – Touchziele auf Mobile >= 36 px (Ziel 44 px).
4. Kein horizontaler Überlauf. Lange Texte: `.tk-truncate` oder Umbruch.
5. Jede Interaktion, die für das Feature relevant ist, ruft `ctx.emit('<bereich>.<aktion>')` auf.
6. Listen/Sammlungen rendern bei leeren Daten `EmptyState` (Zustand "empty" wird von QA geprüft).
7. Datumswerte relativ zu `ctx.today` interpretieren, nie `new Date()` für "jetzt".
8. Komponenten-IDs nie umbenennen (Varianten referenzieren sie). Stattdessen neue Komponente + alte als `deprecated: true` markieren.

## Ergänzungen (Schema v2)
- **Geldbeträge** immer mit `money(ctx, wert, { sign, digits, compact })` und Prozente mit `percent(ctx, wert)` aus
  `library/helpers.js` formatieren. Beide respektieren den **Privatsphäre-Modus** (`ctx.privacy` → „•••• €“).
- **Hinweise** (Finanzen, Trading, Sparplan, Steuer, Gesundheit, Daten) über die Komponente `legal-notice`, nicht selbst formulieren.
- **Gemeinsame Datenwelt:** Datenslots dürfen an Welt-Schlüssel gebunden sein (`demoData: { tasks: '@world:tasks' }`).
  Für die Komponente ist das transparent. `setData` schreibt dann in den gemeinsamen Weltzustand, sodass im
  Demo-Launcher alle Screens dieselben Daten sehen.
- **Navigation im Launcher:** `ctx.emit(event, { id })`. Hat die Interaktion des Features ein Ziel (`to`), öffnet der
  Launcher das Ziel-Feature, dort ist `ctx.ui.selectedId = id` vorbelegt. Listen sollten daher beim Antippen eines
  Eintrags `ctx.emit('<bereich>.open', { id })` auslösen.

## Ergänzungen (Stand 24.11.2026, Abend)
- **Kontext:** `ctx.now()` (fest am Referenztag; im Demo-Launcher mit `ctx.live` laufend – Timer nur dann zählen lassen),
  `ctx.fmt` (= `lib/format.js`), `ctx.env` (`offline`, `stale`, `scale`), `ctx.privacy`. Keine eigene Erkennung von
  `navigator.webdriver` mehr nötig: `ctx.live` ist in QA/Workbench immer `false`.
- **Neue Primitive (`ui.js`):** `NumberStepper` (− / +, 44 px auf Mobile, Komma-Eingabe, Dauerdruck, `min`/`max`/`step`/
  `decimals`/`unit`) und `Ring` (Fortschrittsring, zweite Runde gedämpft statt Warnfarbe). Vor eigenen Steppern/Ringen nutzen.
  `Switch` hat auf Mobile eine 44-px-Tippfläche, `Segmented` mindestens 44 px breite Buttons.
- **Layout-Optionen:** `layout.stretch` (Raster: Karten einer Reihe gleich hoch), `layout.asideSticky` (Split: Seitenspalte
  läuft auf Desktop mit). Beide im Design Studio schaltbar – keine komponentenspezifischen CSS-Tricks dafür.
- **Flutter-Feld (neue Komponenten):** `flutter: { widget, propMap: { prop: 'parameter' }, events: ['event'] }`.
- **CSS-Präfixe:** je Bereich eindeutig (`tk-fit-…`, `tk-nu-…`, `tk-wx<kürzel>_…`, `tk-hb-…`, `tk-fn-…`, `tk-sv-…`, `tk-trd-…`,
  `tk-cal-…`, `tk-tsk-…`, `tk-gl-…` für Ziele, `tk-shp…-` für Einkauf, `tk-dok-…` für Dokumente, `tk-note-…`/`tk-kb-…` für Notizen
  und Wissen, `tk-xc-…` für Querschnitt), um Kollisionen zwischen Bereichen auszuschließen.
- **Leitlinien:** Texte in Gesundheits- und Finanzkomponenten werden von `npm run check` gegen die Begriffslisten in
  `docs/HEALTH_GUIDELINES.md` und `docs/FINANCE_GUIDELINES.md` geprüft.
- **Navigation aus Komponenten:** `ctx.emit(event, { id, to })` – liegt keine Navigationsregel (`interaction.to`) für das Event
  vor, navigiert der App-Modus zu `detail.to` (Feature-ID oder `module:<id>`). So kann **ein** Event (z. B. `tile.open`,
  `link.open`) viele Ziele haben. `ctx.emit` liefert `true`, wenn navigiert wurde – Hinweis-Toasts nur bei `false` zeigen.
  `ctx.mode` ist `feature` (Einzel-Screen), `app` (Launcher) oder `component` (Galerie); Detailansichten öffnen im App-Modus
  per Navigation statt Dialog (keine DOM-Erkennung über `.tk-app` mehr nötig).
- **Welt aus Komponenten:** `ctx.world.get/set/add/reset` (gemeinsamer Zustand aller Screens im Launcher) und
  `ctx.newId(prefix)` (deterministische IDs, kein `Math.random`). Bevorzugt weiterhin über Datenbindung (`@world:`) arbeiten;
  `ctx.world` für modulübergreifende Aktionen (z. B. Buchung erzeugt auch Saldo-Änderung).
- **Einstellungen wirken in der Demo:** `ctx.setPrefs(patch)`, `ctx.setTheme(id)`, `ctx.setPrivacy(on)` schreiben in den
  Welt-Schlüssel `prefs` (Format: `crosscut/_system.js › DEFAULT_PREFS`). Der App-Modus wendet geänderte Werte sofort an:
  Favoriten der Leiste, ausgeschaltete Module (`enabled[id] === false`), Theme, Schriftgröße, Beträge ausblenden.
- **Blockbreite:** `ctx.blockWidth` (gemessene Breite des eigenen Blocks, folgt Größenänderungen) – für Diagramme und SVG
  statt eigenem ResizeObserver. Große Schrift: Attribut `data-tk-large-text` am Root (≥ 125 %), Variable `--tk-text-scale`.

## Ergänzungen (Stand 24.11.2026, nach der Abschluss-QA)
- **Große Schrift (`[data-tk-large-text]`, ab 125 %):** `.tk-truncate`, Kartentitel, Seitentitel und Umschalter brechen um
  (Silbentrennung über `lang="de"`), statt mit „…“ zu kürzen. Die QA-Sonde meldet „…“ und auf unter 48 px gequetschte
  Titel bei großer Schrift als `clipped`. Bewusst abgeschnittene Bereiche (z. B. Vorschaubilder) tragen `data-clip-ok`.
  Feste Breiten für Zahlenfelder in `ch` statt `px` angeben, damit sie mit der Schrift wachsen.
- **Freitext mit Beträgen** (Belegtext, Untertitel, Papierkorb): `maskAmounts(ctx, text)` aus `library/helpers.js` ersetzt im
  Privatsphäre-Modus jeden Betrag durch „•••• €“. `item-list` (Untertitel, Meta) und `card-grid` (Text) tun das bereits.
- **Kennzahlen:** `metric-row` kennt je Kennzahl `sensitive` (Wert und Veränderung im Privatsphäre-Modus maskiert) und
  `neutral` (Veränderung ohne Grün/Rot und ohne Pfeil – Gesundheitswerte wie Gewicht und Puls). Das Primitiv `Delta` zeigt 0
  immer neutral und nutzt das echte Minus „−“.
- **Leerzustände je Einsatz:** `item-list` und `card-grid` haben `emptyTitle`/`emptyText`; gekürzte Listen (`limit`) zählen
  „3 von 11“.
- **Seitenkopf aus Daten:** `page-header` liest einen Untertitel aus dem Datenslot `subtitle` (Standard-Schlüssel
  `headerSubtitle`), z. B. `bind: { subtitle: 'homeHeadline' }` mit einem Welt-Schlüssel – der Eigenschaftstext bleibt Rückfall.
- **Pflichthinweise:** Modulfeld `legal` ist eine Liste von `legal-notice`-Arten (`keine-beratung`, `gesundheit`, `dokumente`,
  `steuer-ordner`, `gewaehrleistung`, `aufbewahrung` …). `npm run check` verlangt dann in jeder Variante einen `legal-notice`;
  die QA-Sonde prüft es im Browser (`legal-present`).
- **Geldformat:** Beträge nur aus `money()` – die Sonde (`money-format`) meldet normale Leerzeichen vor „€“, englische
  Dezimalpunkte und Bindestrich statt „−“.
- **Hinweise anderer Module** (Komponente `hint-cards`): ein Hinweis mit `to`/`carry` navigiert direkt zum Anlass
  (`detail.to`, Auswahl über `detail.ui`), ohne feste Regel im Manifest.
- **Blöcke nach Datenlage:** Block-Felder `hideWhenEmpty` / `showWhenEmpty` (Datenschlüssel oder Liste) blenden einen Block
  aus bzw. nur im Leerzustand ein – z. B. Erststart-Kopf statt Kennzahlen. Komponenten mit `quietEmpty` (metric-row, item-list,
  card-grid, chart) rendern ohne Daten nichts; leere Blöcke nehmen keinen Platz ein (`.tk-block:empty`).

## Ergänzungen (Stand 24.11.2026, nach dem 200-%-Sweep)
- **Kontext:** `ctx.textScale` (Zahl, 1 = 100 %) und `ctx.largeText` (`true` ab 125 %) – für Logik, die mit der Schrift wächst
  (Spaltenzahl, Stundenhöhe, Ringgröße). CSS-Regeln weiterhin unter `[data-tk-large-text]`; ACHTUNG: in der Vorschau hängen
  `.bp-mobile` und `data-tk-large-text` am selben Root-Element – Selektoren `.bp-mobile[data-tk-large-text] …` bzw.
  `[data-tk-large-text] …` verwenden, nicht `[data-tk-large-text] .bp-mobile …`.
- **Basis bei großer Schrift (takt-base.css):** Chips und Badges werden nie gequetscht (`flex-shrink:0`, umbrechen erst, wenn
  länger als die Zeile), Chips mind. 36 px hoch; Reiter (`.tk-tabs`) und Filterchips (`search-filter`) brechen um statt
  versteckt seitlich zu wischen; Silbentrennung ab Wörtern mit 8 Zeichen (`hyphenate-limit-chars: 8 2 2` – bei 10 brachen
  8–9-stellige Wörter hart um). Chips in bewusst seitlich scrollenden Reihen bleiben einzeilig (`white-space:nowrap;
  max-width:none`), sonst streckt der längste Chip die ganze Reihe.
- **Zeilen mit Titel + Betrag/Meta:** bei großer Schrift umbrechen lassen (`flex-wrap`, Titel `flex:1 1 6em`, Meta rechts in
  der Folgezeile) statt den Titel auf wenige Pixel zu quetschen; Icon-Kacheln dürfen ausgeblendet werden. Vorbild: `item-list`
  1.3, `fin-tx-list` 1.1.
- **Seitenspalten und feste Raster** (Inhaltsverzeichnis, Bildstreifen, Vorschau-Split, 4-Spalten-Boards): bei großer Schrift
  einspaltig schalten bzw. Raster in `em` statt `px` angeben – `repeat(auto-fill, minmax(min(100%, 9em), 1fr))`. Vorbilder:
  `kb-article` 1.5, `receipt-review` 1.5, `receipt-slip` 1.2, `order-pipeline` 1.5, `card-grid` 1.3, `tile-config` 1.1.
- **Mehrspaltigkeit nach Blockbreite, nicht nach Viewport:** Ein Block in der Seitenspalte ist auch auf dem Desktop schmal.
  Spalten innerhalb einer Komponente an `ctx.blockWidth` koppeln (z. B. zwei Spalten erst ab 560 px), nicht an `.bp-desktop`.
  Vorbild: `exercise-detail` 1.2.
- **Prüfen:** Sonde bei 200 % in allen Breiten (360/390/768/1024/1280/1440) – die Zwischenbreiten 1024/1280 zeigen gequetschte
  Seitenspalten, die bei 390 und 1440 nicht auffallen. Bei 100 % muss die Darstellung pixelgleich bleiben.
