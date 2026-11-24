// Notizen: Liste/Raster mit Auszug, Pin, relativem Datum, Suche & Filter
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Card, Button, Badge, Icon, EmptyState } from '../../ui.js';
import { applyUiFilter } from '../../helpers.js';
import { isoLocal, relDay, stripMd, sortNotes } from './content-util.js';
import { NoteForm, noteActions } from './note-editor.js';

/** Editor im Dialog: lokaler Zustand, schreibt zusätzlich in den geteilten notes-Slot. */
function DialogEditor({ note, setData, ctx, close }) {
  const [local, setLocal] = useState(note);
  const base = noteActions({ setData, ctx, id: note.id, afterRemove: close });
  const actions = { ...base, patch: (p) => { setLocal((n) => ({ ...n, ...p })); base.patch(p); }, pin: (v) => { setLocal((n) => ({ ...n, pinned: v })); base.pin(v); } };
  return html`<${NoteForm} note=${local} actions=${actions} props=${{ showToolbar: true, showTags: true, allowPreview: true }} ctx=${ctx} />`;
}

export const noteList = {
  id: 'note-list',
  name: 'Notizliste',
  category: 'Inhalte',
  description: 'Notizen als kompakte Liste oder Karten-Raster: angeheftete zuerst, Auszug, Tags, relatives Datum. Beachtet Suche/Filter („Angeheftet“, „Archiv“, Tags). Auswahl über ctx.ui.selectedId – oder Bearbeiten im Dialog.',
  version: '1.0',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Notizen' },
    { name: 'layout', label: 'Darstellung', type: 'select', options: ['list', 'grid'], default: 'list' },
    { name: 'openIn', label: 'Öffnen in', type: 'select', options: ['select', 'dialog'], default: 'select' },
    { name: 'showExcerpt', label: 'Auszug', type: 'boolean', default: true },
    { name: 'showCreate', label: 'Neue-Notiz-Button', type: 'boolean', default: true },
    { name: 'groupPinned', label: 'Angeheftete abgrenzen', type: 'boolean', default: true },
    { name: 'minWidth', label: 'Min. Kartenbreite (px, Raster)', type: 'number', default: 230 },
  ],
  data: [{ slot: 'notes', label: 'Notizen', default: 'notes', shape: '{id,title,body,tags?,pinned?,archived?,updated}[]', required: true }],
  events: ['note.open', 'note.pin', 'note.create'],
  states: ['empty'],
  css: `
  .tk-note-list { display:flex; flex-direction:column; min-width:0; }
  .tk-note-list__group { padding:10px 16px 6px; font-size:var(--tk-fs-xs); font-weight:var(--tk-fw-semibold); letter-spacing:var(--tk-ls-wide); text-transform:uppercase; color:var(--tk-c-text-subtle); display:flex; align-items:center; gap:6px; }
  .tk-note-row { display:flex; align-items:flex-start; gap:10px; width:100%; text-align:left; border:0; border-bottom:1px solid var(--tk-c-border); background:transparent; color:inherit; font:inherit; padding:12px 16px; min-height:64px; cursor:pointer; min-width:0; position:relative; }
  .tk-note-row:last-child { border-bottom:0; }
  .tk-note-row:hover { background:var(--tk-c-surface2); }
  .tk-note-row[aria-current="true"] { background:var(--tk-c-accent-soft); }
  .tk-note-row[aria-current="true"] .tk-note-row__meta { color:var(--tk-c-text-muted); }
  .tk-note-row[aria-current="true"]::before { content:''; position:absolute; left:0; top:8px; bottom:8px; width:3px; border-radius:2px; background:var(--tk-c-accent); }
  .tk-note-row__main { flex:1; min-width:0; display:flex; flex-direction:column; gap:3px; }
  .tk-note-row__title { font-weight:var(--tk-fw-semibold); display:flex; gap:6px; align-items:center; min-width:0; }
  .tk-note-row__excerpt { font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .tk-note-row__meta { display:flex; align-items:center; gap:6px; flex-wrap:wrap; font-size:var(--tk-fs-xs); color:var(--tk-c-text-subtle); }
  .tk-note-row__pin { width:36px; height:36px; margin:-6px -8px -6px 0; display:grid; place-items:center; border:0; background:transparent; color:var(--tk-c-text-subtle); border-radius:var(--tk-radius-sm); cursor:pointer; flex:none; }
  .tk-note-row__pin:hover { background:var(--tk-c-surface3); color:var(--tk-c-text); }
  .tk-note-row__pin[aria-pressed="true"] { color:var(--tk-c-accent); }
  .bp-mobile .tk-note-row__pin { width:44px; height:44px; }
  .tk-note-list__grid { display:grid; gap:var(--tk-space-3); grid-template-columns:repeat(auto-fill, minmax(min(100%, var(--minw,230px)), 1fr)); }
  .tk-note-card { display:flex; flex-direction:column; gap:8px; text-align:left; padding:var(--tk-space-4); min-height:150px; cursor:pointer; color:inherit; font:inherit; position:relative; }
  .tk-note-card[aria-current="true"] { border-color:var(--tk-c-accent); }
  .tk-note-card__text { font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); display:-webkit-box; -webkit-line-clamp:4; -webkit-box-orient:vertical; overflow:hidden; flex:1; }
  .tk-note-card__foot { display:flex; align-items:center; justify-content:space-between; gap:8px; }
  .tk-note-card__tags { display:flex; gap:6px; flex-wrap:wrap; min-width:0; }`,
  example: { props: { title: 'Notizen' }, data: { notes: [
    { id: 'n1', title: 'Ideen TAKT V2', body: '## Fokus\n- Modulweise Entwicklung\n- Workbench als Designarbeitsplatz', tags: ['Projekt'], pinned: true, updated: '2026-11-24T07:40:00' },
    { id: 'n2', title: 'Einkaufsliste Wochenende', body: '- [ ] Hafermilch\n- [x] Tomaten\n- [ ] Basilikum', tags: ['Privat'], updated: '2026-11-23T18:20:00' },
    { id: 'n3', title: 'Meeting Sales-Review', body: 'Q4-Ziele, neue Kanäle, Preisstrategie für Marktplätze.', tags: ['Arbeit', 'Sales'], updated: '2026-11-18T11:05:00' },
  ] } },
  render: ({ props, data, setData, ctx }) => {
    const all = data.notes || [];
    const f = ctx.ui.filter; const special = f === 'Angeheftet' || f === 'Archiv';
    let items = applyUiFilter(all, special ? { ...ctx.ui, filter: undefined } : ctx.ui, { searchFields: ['title', 'body'] });
    items = items.filter((n) => (f === 'Archiv' ? n.archived : !n.archived) && (f !== 'Angeheftet' || n.pinned));
    items = sortNotes(items);
    const activeId = ctx.ui.selectedId ?? items[0]?.id;
    const open = (n) => {
      ctx.setUi('selectedId', n.id); ctx.emit('note.open', { id: n.id });
      if (props.openIn === 'dialog') ctx.openDialog({ title: 'Notiz bearbeiten', body: (close) => html`<${DialogEditor} note=${n} setData=${setData} ctx=${ctx} close=${close} />` });
    };
    const pin = (e, n) => { e.stopPropagation(); setData('notes', (a) => a.map((x) => (x.id === n.id ? { ...x, pinned: !x.pinned } : x))); ctx.emit('note.pin', { id: n.id, pinned: !n.pinned }); ctx.toast(n.pinned ? 'Anheften aufgehoben' : 'Notiz angeheftet'); };
    const create = () => {
      const id = `n${Date.now().toString(36)}`; const n = { id, title: '', body: '', tags: [], updated: isoLocal(ctx.today) };
      setData('notes', (a) => [n, ...a]); ctx.setUi('selectedId', id); ctx.emit('note.create', { id });
      if (props.openIn === 'dialog') open(n); else ctx.toast('Neue Notiz angelegt');
    };
    const addBtn = props.showCreate && html`<${Button} size="sm" variant="primary" icon="plus" aria-label="Neue Notiz" onClick=${create}>${ctx.bp === 'mobile' ? null : 'Neu'}<//>`;
    const empty = html`<${EmptyState} icon=${f === 'Archiv' ? 'archive' : 'sticky-note'} title=${f === 'Archiv' ? 'Archiv ist leer' : 'Keine Notizen gefunden'}
      text=${ctx.ui.query ? `Keine Treffer für „${ctx.ui.query}“.` : 'Halte Gedanken, Listen und Ideen fest.'} action=${props.showCreate && html`<${Button} variant="primary" icon="plus" onClick=${create}>Neue Notiz<//>`} />`;
    const pinBtn = (n) => html`<button type="button" class="tk-note-row__pin" aria-label=${n.pinned ? 'Anheften aufheben' : 'Anheften'} aria-pressed=${n.pinned ? 'true' : 'false'} onClick=${(e) => pin(e, n)}><${Icon} name="pin" size=${16} /></button>`;
    const tagsOf = (n, max = 2) => (n.tags || []).slice(0, max).map((t) => html`<${Badge}>${t}<//>`);

    if (props.layout === 'grid') {
      const body = !items.length ? html`<${Card}>${empty}<//>` : html`<div class="tk-note-list__grid" style=${`--minw:${props.minWidth}px`}>
        ${items.map((n) => html`<div class="tk-card tk-card--interactive tk-note-card" role="button" tabindex="0" aria-current=${n.id === activeId && props.openIn !== 'dialog' ? 'true' : 'false'} onClick=${() => open(n)} onKeyDown=${(e) => e.key === 'Enter' && open(n)}>
          <div class="tk-row" style="justify-content:space-between;align-items:flex-start"><div class="tk-note-row__title"><span class="tk-truncate">${n.title || 'Unbenannte Notiz'}</span></div>${pinBtn(n)}</div>
          ${props.showExcerpt && html`<div class="tk-note-card__text">${stripMd(n.body) || 'Leere Notiz'}</div>`}
          <div class="tk-note-card__foot"><div class="tk-note-card__tags">${tagsOf(n)}</div><span class="tk-subtle" style="font-size:var(--tk-fs-xs);white-space:nowrap">${relDay(n.updated, ctx.today)}</span></div></div>`)}</div>`;
      return html`<div class="tk-col" style="gap:12px">${(props.title || addBtn) && html`<div class="tk-row"><div class="tk-h3 tk-grow">${props.title} <span class="tk-subtle tk-num" style="font-weight:400">${items.length}</span></div>${addBtn}</div>`}${body}</div>`;
    }

    const row = (n) => html`<div role="button" tabindex="0" class="tk-note-row" aria-current=${n.id === activeId ? 'true' : 'false'} onClick=${() => open(n)} onKeyDown=${(e) => e.key === 'Enter' && open(n)}>
      <div class="tk-note-row__main">
        <div class="tk-note-row__title"><span class="tk-truncate">${n.title || 'Unbenannte Notiz'}</span></div>
        ${props.showExcerpt && html`<div class="tk-note-row__excerpt">${stripMd(n.body) || 'Leere Notiz'}</div>`}
        <div class="tk-note-row__meta"><span>${relDay(n.updated, ctx.today)}</span>${ctx.bp !== 'mobile' && tagsOf(n, 2)}</div>
      </div>${pinBtn(n)}</div>`;
    const pinned = props.groupPinned ? items.filter((n) => n.pinned) : []; const rest = props.groupPinned ? items.filter((n) => !n.pinned) : items;
    const body = !items.length ? empty : html`${pinned.length > 0 && html`<div class="tk-note-list__group"><${Icon} name="pin" size=${12} />Angeheftet</div>${pinned.map(row)}`}
      ${pinned.length > 0 && rest.length > 0 && html`<div class="tk-note-list__group">Weitere</div>`}${rest.map(row)}`;
    return html`<${Card} flush title=${props.title} class="tk-note-list" actions=${html`<div class="tk-row"><${Badge}>${items.length}<//>${addBtn}</div>`}>${body}<//>`;
  },
};
