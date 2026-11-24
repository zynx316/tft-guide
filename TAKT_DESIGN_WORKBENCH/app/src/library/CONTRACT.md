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
2. Primitive aus `library/ui.js` verwenden (Button, Badge, Card, Input, Segmented, EmptyState …).
3. Responsive über `ctx.bp` oder Selektoren `.bp-mobile …` – Touchziele auf Mobile >= 36 px (Ziel 44 px).
4. Kein horizontaler Überlauf. Lange Texte: `.tk-truncate` oder Umbruch.
5. Jede Interaktion, die für das Feature relevant ist, ruft `ctx.emit('<bereich>.<aktion>')` auf.
6. Listen/Sammlungen rendern bei leeren Daten `EmptyState` (Zustand "empty" wird von QA geprüft).
7. Datumswerte relativ zu `ctx.today` interpretieren, nie `new Date()` für "jetzt".
8. Komponenten-IDs nie umbenennen (Varianten referenzieren sie). Stattdessen neue Komponente + alte als `deprecated: true` markieren.
