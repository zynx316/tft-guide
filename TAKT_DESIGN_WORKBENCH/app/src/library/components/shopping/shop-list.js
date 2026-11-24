// Einkauf: eine Liste abarbeiten – nach Gang, Abhaken, Menge, Schnelleingabe, Rückgängig. Stile: dicht (rows), Gänge als Karten (cards), Gang für Gang (focus).
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Card, Button, Icon, Check, EmptyState, Progress, Select, Input } from '../../ui.js';
import { SHP_CSS, slots, ex, useShop, useUndo, UndoBar, useFocusRef } from './_shopping.js';
import { groupByAisle, aislesFor, aisleIcon, parseQuick, guessAisle, bumpQty, toggleItem, addItem, removeItem, restoreItem, setQty, setAisle, renameList, deleteList, toPantry } from './_logic.js';
import { money } from '../../helpers.js';

export const shopList = {
  id: 'shop-list',
  name: 'Einkaufsliste (Gänge)',
  category: 'Einkauf',
  description: 'Eine Liste nach Gängen des Ladens: Abhaken, Menge mit − und +, Schnelleingabe („2 Zahnpasta“), Rückgängig. Lebensmittel schreiben in dieselben Daten wie Ernährung. Stile: dicht, Karten je Gang, Gang für Gang.',
  version: '1.1',
  props: [
    { name: 'title', label: 'Titel (leer = Listenname)', type: 'text', default: '' },
    { name: 'style', label: 'Stil', type: 'select', options: ['rows', 'cards', 'focus'], default: 'rows' },
    { name: 'showAdd', label: 'Schnelleingabe', type: 'boolean', default: true },
    { name: 'showPrice', label: 'Preisschätzung', type: 'boolean', default: true },
    { name: 'framed', label: 'In Karte', type: 'boolean', default: false },
  ],
  data: slots('lists', 'shopping', 'plan', 'recipes', 'foods', 'stores'),
  events: ['item.toggle', 'item.add', 'item.remove', 'item.qty', 'item.aisle', 'item.pantry', 'item.undo', 'list.store', 'list.plan', 'list.rename', 'list.delete'],
  states: ['empty'],
  a11y: { role: 'list', nameFrom: 'Listenname' },
  flutter: { widget: 'ShopListView', propMap: { style: 'style', showAdd: 'showAdd' }, events: ['item.toggle', 'item.add', 'item.remove', 'item.qty'] },
  css: `
  .tk-shpr-top { display:flex; align-items:center; gap:12px; flex-wrap:wrap; } .tk-shpr-top .tk-grow { min-width:140px; }
  .tk-shpr-cards { display:grid; grid-template-columns:repeat(auto-fill, minmax(min(100%, 300px), 1fr)); gap:var(--tk-space-3); align-items:start; }
  .tk-shpr-acard { padding:4px 16px 8px; border-radius:var(--tk-radius-lg); background:var(--tk-c-surface); border:1px solid var(--tk-c-border); min-width:0; } .tk-shpr-acard .tk-shp-aisle { padding-top:12px; }
  .tk-shpr-acard .tk-shp-row:last-child { border-bottom:0; }
  .tk-shpr-next { padding:16px; border-radius:var(--tk-radius-lg); background:var(--tk-c-surface); border:1px solid var(--tk-c-border); border-left:4px solid var(--tk-c-accent); }
  .tk-shpr-next .tk-shp-row { min-height:64px; } .tk-shpr-next .tk-shp-row__name { font-size:var(--tk-fs-lg); }
  .tk-shpr-more { display:flex; flex-wrap:wrap; gap:8px; }
  .tk-shpr-more button { min-height:44px; padding:0 14px; border-radius:var(--tk-radius-pill); border:1px solid var(--tk-c-border-strong); background:var(--tk-c-surface2); color:inherit; cursor:pointer; display:inline-flex; align-items:center; gap:6px; font:inherit; }
  .tk-shpr-done { margin-top:8px; }`,
  example: { data: ex('lists', 'shopping', 'plan', 'recipes', 'foods', 'stores') },
  render: function ShopList({ props, data, setData, ctx }) {
    const { views, sel: list, store } = useShop(data, ctx);
    const [editId, setEdit] = useState(null), [editList, setEditList] = useState(false), [listName, setListName] = useState(''), [draft, setDraft] = useState(''), [aisleOpen, setAisleOpen] = useState(null), [showDone, setShowDone] = useState(false);
    const [u, setU] = useUndo(); const [inputRef, focusInput] = useFocusRef();
    const wrap = (b) => (props.framed ? html`<${Card} title=${props.title || list?.name} icon=${list?.icon || 'shopping-cart'}>${b}<//>` : b);
    if (!list) return wrap(html`<${EmptyState} icon="shopping-cart" title="Noch keine Liste" text="Lege eine Liste an, dann kannst du Artikel sammeln." />`);
    const st = store(list), aisles = aislesFor(st, list.items), isFood = list.kind === 'food';
    const { groups, done } = groupByAisle(list.items, aisles, { doneApart: props.style !== 'rows' });
    const toggle = (i) => { toggleItem(setData, list, i); ctx.emit('item.toggle', { id: i.id, done: !i.done }); };
    const add = () => {
      const p = parseQuick(draft); if (!p) return;
      const id = ctx.newId('si'), aisle = guessAisle(p.name, aisles);
      addItem(setData, list, { ...p, aisle }, id); setDraft(''); ctx.emit('item.add', { name: p.name });
      setU({ text: `„${p.name}${p.qty ? `, ${p.qty}` : ''}“ in ${aisle} hinzugefügt`, restore: () => removeItem(setData, list, { id, key: id }) });
    };
    const remove = (i) => { const index = list.items.filter((x) => !x.derived).findIndex((x) => x.id === i.id); removeItem(setData, list, i); setEdit(null); ctx.emit('item.remove', { id: i.id });
      setU({ text: `„${i.name}“ entfernt`, restore: () => restoreItem(setData, list, i, index) }); };
    const qty = (i, d) => { setQty(setData, list, i, bumpQty(i.qty, d)); ctx.emit('item.qty', { id: i.id }); };
    const moveAisle = (i, aisle) => { const from = i.aisle; setAisle(setData, list, i, aisle); ctx.emit('item.aisle', { id: i.id, aisle }); setU({ text: `„${i.name}“ steht jetzt in ${aisle}`, restore: () => setAisle(setData, list, i, from) }); };
    const pantry = (i) => { const undo = toPantry(setData, i); setEdit(null); ctx.emit('item.pantry', { id: i.id }); setU({ text: `„${i.name}“ ist zuhause vorhanden`, restore: undo }); };
    const Row = (i) => html`<div key=${i.id}><div class="tk-shp-row" data-done=${String(i.done)}><${Check} checked=${i.done} onChange=${() => toggle(i)} label=${`${i.name} abhaken`} />
      <button type="button" class="tk-shp-row__main" aria-expanded=${String(editId === i.id)} onClick=${() => setEdit(editId === i.id ? null : i.id)}><span class="tk-shp-row__name">${i.name}</span>
        ${(i.note || i.from?.length > 0) && html`<span class="tk-shp-sub tk-truncate">${i.note || i.from.join(', ')}</span>`}</button>
      ${i.qty && html`<span class="tk-shp-qty">${i.qty}</span>`}</div>
      ${editId === i.id && html`<div class="tk-shp-edit">${i.derived
        ? html`<span class="tk-shp-sub tk-grow">Menge ergibt sich aus dem Plan.</span><${Button} size="sm" icon="house" onClick=${() => pantry(i)}>Zuhause vorhanden<//>`
        : html`<div class="tk-row" role="group" aria-label=${`Menge ${i.name}`}><${Button} icon="minus" aria-label="Weniger" onClick=${() => qty(i, -1)} /><strong class="tk-num" style="min-width:4ch;text-align:center">${i.qty || '1'}</strong><${Button} icon="plus" aria-label="Mehr" onClick=${() => qty(i, 1)} /></div>
          <${Select} value=${i.aisle} onChange=${(v) => moveAisle(i, v)} aria-label=${`Gang für ${i.name}`} options=${aisles} />
          <span class="tk-grow"></span><${Button} variant="ghost" icon="trash-2" onClick=${() => remove(i)}>Entfernen<//>`}</div>`}</div>`;
    const Aisle = (g) => html`<div class="tk-shp-aisle"><${Icon} name=${aisleIcon(g.aisle)} size=${14} />${g.aisle}<span>${g.items.filter((x) => !x.done).length}/${g.items.length}</span></div>`;
    const DoneBlock = done.length > 0 && html`<div class="tk-shpr-done"><${Button} variant="ghost" size="sm" iconRight=${showDone ? 'chevron-up' : 'chevron-down'} aria-expanded=${String(showDone)} onClick=${() => setShowDone(!showDone)}>Erledigt (${done.length})<//>${showDone && done.map(Row)}</div>`;
    const rename = () => { const n = listName.trim(); if (!n || n === list.name) return setEditList(false); const undo = renameList(setData, list, n); setEditList(false); ctx.emit('list.rename', { id: list.id }); setU({ text: `Liste in „${n}“ umbenannt`, restore: undo }); };
    const dropList = () => { const undo = deleteList(setData, data, list); ctx.setUi('selectedId', null); setEditList(false); ctx.emit('list.delete', { id: list.id }); setU({ text: `Liste „${list.name}“ gelöscht`, restore: () => { undo(); ctx.setUi('selectedId', list.id); } }); };
    const listEdit = list.kind === 'custom' && html`<div>${editList
      ? html`<div class="tk-shp-add" role="group" aria-label="Liste bearbeiten"><${Input} value=${listName} onInput=${setListName} aria-label="Name der Liste" onKeyDown=${(e) => e.key === 'Enter' && rename()} /><${Button} variant="primary" icon="check" onClick=${rename}>Umbenennen<//><${Button} variant="ghost" icon="trash-2" onClick=${dropList}>Liste löschen<//><${Button} variant="ghost" onClick=${() => setEditList(false)}>Abbrechen<//></div>`
      : html`<${Button} size="sm" variant="ghost" icon="pencil" aria-expanded="false" onClick=${() => { setListName(list.name); setEditList(true); }}>Liste bearbeiten<//>`}</div>`;
    const header = html`<div class="tk-shpr-top"><div class="tk-grow"><div class="tk-shp-meta"><strong>${list.done}</strong> von ${list.total} erledigt${st ? ` · ${st.short || st.name}` : ''}${props.showPrice && list.priceOpen > 0 ? ` · ca. ${money(ctx, list.priceOpen, { digits: 0 })} offen` : ''}</div>
      <div style="margin-top:6px"><${Progress} value=${list.total ? list.done / list.total : 0} /></div></div>
      <${Button} icon="store" onClick=${() => ctx.emit('list.store', { id: list.id })}>Laden-Modus<//></div>`;
    const addRow = props.showAdd && html`<div class="tk-shp-add"><input ref=${inputRef} class="tk-input" value=${draft} onInput=${(e) => setDraft(e.currentTarget.value)} placeholder=${isFood ? 'z. B. 2 l Milch' : 'Etwas hinzufügen …'} aria-label=${`Artikel zu ${list.name} hinzufügen`} onKeyDown=${(e) => e.key === 'Enter' && add()} /><${Button} variant="primary" icon="plus" aria-label="Hinzufügen" onClick=${add} /></div>`;
    if (!list.items.length) return wrap(html`<div class="tk-shp">${addRow}${listEdit}<${UndoBar} u=${u} set=${setU} ctx=${ctx} /><${EmptyState} icon="shopping-cart" title=${isFood ? 'Die Liste ist leer' : `${list.name} ist leer`}
      text=${isFood ? 'Plane Mahlzeiten, dann entsteht die Liste von selbst. Oder schreib auf, was fehlt.' : 'Schreib auf, was fehlt. Die Gänge ordnet TAKT nach deinem Laden.'}
      action=${isFood ? html`<${Button} variant="primary" icon="calendar-days" onClick=${() => ctx.emit('list.plan')}>Plan übernehmen<//>` : html`<${Button} variant="primary" icon="plus" onClick=${focusInput}>Ersten Artikel hinzufügen<//>`} /></div>`);
    let body;
    if (props.style === 'focus') {
      const cur = aisleOpen && groups.find((g) => g.aisle === aisleOpen) || groups[0], rest = groups.filter((g) => g !== cur);
      body = html`${cur ? html`<div class="tk-shpr-next"><div class="tk-shp-aisle" style="padding-top:0"><${Icon} name=${aisleIcon(cur.aisle)} size=${14} />Als Nächstes: ${cur.aisle}<span>${cur.items.length}</span></div>${cur.items.map(Row)}</div>`
        : html`<${EmptyState} icon="check-circle-2" title="Alles im Wagen" text="Alle Artikel sind abgehakt." />`}
        ${rest.length > 0 && html`<div class="tk-shpr-more" role="group" aria-label="Weitere Gänge">${rest.map((g) => html`<button type="button" onClick=${() => setAisleOpen(g.aisle)}><${Icon} name=${aisleIcon(g.aisle)} size=${15} />${g.aisle} · ${g.items.length}</button>`)}</div>`}${DoneBlock}`;
    } else if (props.style === 'cards') body = html`<div class="tk-shpr-cards">${groups.map((g) => html`<div class="tk-shpr-acard">${Aisle(g)}${g.items.map(Row)}</div>`)}</div>${DoneBlock}`;
    else body = html`<div>${groups.map((g) => html`${Aisle(g)}${g.items.map(Row)}`)}</div>`;
    return wrap(html`<div class="tk-shp">${header}${listEdit}${props.style === 'focus' ? addRow : null}<${UndoBar} u=${u} set=${setU} ctx=${ctx} />${props.style !== 'focus' ? addRow : null}${body}</div>`);
  },
};
export default shopList;
