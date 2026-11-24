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
- **CSS-Präfixe:** je Bereich eindeutig (`tk-fit-…`, `tk-nut-…`, `tk-wx-…`, `tk-hab-…`, `tk-fin-…`, `tk-sav-…`, `tk-trd-…`,
  `tk-cal-…`, `tk-task-…`, `tk-xc-…` für Querschnitt), um Kollisionen zwischen Bereichen auszuschließen.
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
