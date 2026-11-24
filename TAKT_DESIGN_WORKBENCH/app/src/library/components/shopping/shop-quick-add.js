// Einkauf: Schnelleingabe – ein Feld, Liste wählbar, Gang wird erkannt; Vorschläge aus knappen Vorräten; Rückgängig.
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Card, Button, Icon, Chip } from '../../ui.js';
import { SHP_CSS, slots, ex, useShop, useUndo, UndoBar } from './_shopping.js';
import { parseQuick, guessAisle, aislesFor, addItem, removeItem, needsRefill, findOnList, refillToList, arr } from './_logic.js';

export const shopQuickAdd = {
  id: 'shop-quick-add',
  name: 'Einkauf erfassen',
  category: 'Einkauf',
  description: 'Eine Zeile für alles, was fehlt: „2 l Milch“, „Zahnpasta“. Zeigt vorab Liste, Gang und Menge, bietet knappe Vorräte als Ein-Tipp-Vorschläge an und macht das Hinzufügen rückgängig.',
  version: '1.1',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Etwas fehlt?' },
    { name: 'showSuggestions', label: 'Vorschläge aus Vorräten', type: 'boolean', default: true },
    { name: 'showTargets', label: 'Listenwahl zeigen', type: 'boolean', default: true },
    { name: 'framed', label: 'In Karte', type: 'boolean', default: true },
    { name: 'placeholder', label: 'Platzhalter', type: 'text', default: 'z. B. 2 l Milch oder Zahnpasta' },
  ],
  data: slots('lists', 'shopping', 'plan', 'recipes', 'foods', 'stores', 'pantry'),
  events: ['item.add', 'item.undo', 'suggest.add'],
  states: ['empty'],
  flutter: { widget: 'ShopQuickAdd', propMap: { placeholder: 'hint' }, events: ['item.add'] },
  css: `${SHP_CSS}
  .tk-shpq-preview { display:flex; align-items:center; gap:6px; flex-wrap:wrap; font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); min-height:24px; }`,
  example: { data: ex('lists', 'shopping', 'plan', 'recipes', 'foods', 'stores', 'pantry') },
  render: function ShopQuickAdd({ props, data, setData, ctx }) {
    const { views, sel } = useShop(data, ctx);
    const [text, setText] = useState(''), [target, setTarget] = useState(null), [u, setU] = useUndo();
    const list = views.find((l) => l.id === target) || sel;
    const wrap = (b) => (props.framed ? html`<${Card} title=${props.title} icon="plus">${b}<//>` : b);
    if (!list) return wrap(html`<div class="tk-shp-sub">Lege zuerst eine Liste an.</div>`);
    const stores = arr(data.stores), st = stores.find((s) => s.id === list.storeId), aisles = aislesFor(st, list.items);
    const p = parseQuick(text), aisle = p ? guessAisle(p.name, aisles) : null;
    const save = () => {
      if (!p) return;
      const id = ctx.newId('si'); addItem(setData, list, { ...p, aisle }, id); setText(''); ctx.emit('item.add', { name: p.name, list: list.id });
      setU({ text: `„${p.name}“ auf ${list.name} gesetzt`, restore: () => removeItem(setData, list, { id, key: id }) });
    };
    const sug = props.showSuggestions ? arr(data.pantry).filter(needsRefill).filter((x) => { const l = views.find((v) => v.id === (x.foodId ? views.find((y) => y.kind === 'food')?.id : x.listId)) || views[0]; return !findOnList(l, x); }).slice(0, 4) : [];
    const suggest = (x) => { const r = refillToList(setData, views, x, ctx.newId('si')); ctx.emit('suggest.add', { id: x.id }); if (r.added) setU({ text: `„${x.name}“ auf ${r.list.name} gesetzt`, restore: r.undo }); };
    return wrap(html`<div class="tk-shp">
      ${props.showTargets && views.length > 1 && html`<div class="tk-shp-chips" role="group" aria-label="Zu welcher Liste?">${views.map((l) => html`<${Chip} active=${l.id === list.id} icon=${l.icon} onClick=${() => setTarget(l.id)}>${l.name}<//>`)}</div>`}
      <div class="tk-shp-add"><input class="tk-input" value=${text} onInput=${(e) => setText(e.currentTarget.value)} placeholder=${props.placeholder} aria-label=${`Artikel zu ${list.name}`} onKeyDown=${(e) => e.key === 'Enter' && save()} /><${Button} variant="primary" icon="plus" disabled=${!p} aria-label="Hinzufügen" onClick=${save} /></div>
      <div class="tk-shpq-preview" aria-live="polite">${p ? html`<${Icon} name="arrow-right" size=${14} />${list.name} · ${aisle}${p.qty ? ` · ${p.qty}` : ''}` : 'Menge und Gang erkennt TAKT selbst.'}</div>
      ${sug.length > 0 && html`<div class="tk-shp-chips" role="group" aria-label="Vorschläge aus Vorräten">${sug.map((x) => html`<${Chip} icon="plus" onClick=${() => suggest(x)}>${x.name} <span class="tk-shp-sub">${x.level === 'empty' ? 'leer' : 'fast leer'}</span><//>`)}</div>`}
      <${UndoBar} u=${u} set=${setU} ctx=${ctx} /></div>`);
  },
};
export default shopQuickAdd;
