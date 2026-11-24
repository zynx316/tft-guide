// Notizen: Liste/Raster (Notizliste), Checklisten-Übersicht und Eingang (Schnellnotiz, Einsortieren)
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Card, Button, Badge, Icon, EmptyState, Input, Check, Progress, toneColor } from '../../ui.js';
import { applyUiFilter } from '../../helpers.js';
import { isoLocal, relDay, stripMd, sortNotes, checklistItems, checklistStats, tagTone, toggleTaskLine } from './content-util.js';
import { NoteForm, noteActions } from './note-editor.js';

/** Editor im Dialog: lokaler Zustand, schreibt zusätzlich in den geteilten notes-Slot. */
function DialogEditor({ note, setData, ctx, close }) {
  const [local, setLocal] = useState(note);
  const base = noteActions({ setData, ctx, id: note.id, afterRemove: close });
  const actions = { ...base, patch: (p) => { setLocal((n) => ({ ...n, ...p })); base.patch(p); }, pin: (v) => { setLocal((n) => ({ ...n, pinned: v })); base.pin(v); } };
  return html`<${NoteForm} note=${local} actions=${actions} props=${{ showToolbar: true, showTags: true, allowPreview: true }} ctx=${ctx} />`;
}

const ChecklistBadge = ({ stats }) => stats.total > 0 && html`<span class="tk-note-prog" title=${`${stats.done} von ${stats.total} erledigt`}><${Icon} name="list-checks" size=${13} />${stats.done}/${stats.total}</span>`;

export const noteList = {
  id: 'note-list',
  name: 'Notizliste',
  category: 'Inhalte',
  description: 'Notizen als Liste, einzeilige Kompaktliste oder Karten-Raster: angeheftete zuerst, Auszug, Tags, Checklisten-Fortschritt, relatives Datum. Beachtet Suche/Filter („Angeheftet“, „Eingang“, „Archiv“, Tags). Auswahl über ctx.ui.selectedId – oder Bearbeiten im Dialog.',
  version: '1.1',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Notizen' },
    { name: 'layout', label: 'Darstellung', type: 'select', options: ['list', 'compact', 'grid'], default: 'list' },
    { name: 'scope', label: 'Auswahl', type: 'select', options: ['alle', 'angeheftet', 'zuletzt'], default: 'alle' },
    { name: 'limit', label: 'Max. Einträge (0 = alle)', type: 'number', default: 0 },
    { name: 'openIn', label: 'Öffnen in', type: 'select', options: ['select', 'dialog'], default: 'select' },
    { name: 'showExcerpt', label: 'Auszug', type: 'boolean', default: true },
    { name: 'showProgress', label: 'Checklisten-Fortschritt', type: 'boolean', default: true },
    { name: 'autoSelect', label: 'Erste Notiz markieren (Master-Detail)', type: 'boolean', default: true },
    { name: 'showCreate', label: 'Neue-Notiz-Button', type: 'boolean', default: true },
    { name: 'groupPinned', label: 'Angeheftete abgrenzen', type: 'boolean', default: true },
    { name: 'cardSize', label: 'Kartengröße (Raster)', type: 'select', options: ['normal', 'large'], default: 'normal' },
    { name: 'minWidth', label: 'Min. Kartenbreite (px, Raster)', type: 'number', default: 230 },
  ],
  data: [{ slot: 'notes', label: 'Notizen', default: 'notes', shape: '{id,title,body,tags?,pinned?,archived?,inbox?,updated}[]', required: true }],
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
  .tk-note-row--compact { align-items:center; min-height:48px; padding:6px 16px; }
  .tk-note-row--compact .tk-note-row__main { flex-direction:row; align-items:baseline; gap:12px; }
  .tk-note-row--compact .tk-note-row__title { flex:0 1 38%; }
  .tk-note-row--compact .tk-note-row__excerpt { flex:1 1 0; min-width:0; }
  .tk-note-row--compact .tk-note-row__meta { flex:none; flex-wrap:nowrap; }
  .bp-mobile .tk-note-row--compact { min-height:56px; }
  .bp-mobile .tk-note-row--compact .tk-note-row__main { flex-direction:column; align-items:stretch; gap:2px; }
  .bp-mobile .tk-note-row--compact .tk-note-row__title { flex:none; }
  .tk-note-row__pin { width:36px; height:36px; margin:-6px -8px -6px 0; display:grid; place-items:center; border:0; background:transparent; color:var(--tk-c-text-subtle); border-radius:var(--tk-radius-sm); cursor:pointer; flex:none; }
  .tk-note-row__pin:hover { background:var(--tk-c-surface3); color:var(--tk-c-text); }
  .tk-note-row__pin[aria-pressed="true"] { color:var(--tk-c-accent); }
  .bp-mobile .tk-note-row__pin { width:44px; height:44px; }
  .tk-note-prog { display:inline-flex; align-items:center; gap:4px; font-variant-numeric:tabular-nums; }
  .tk-note-list__grid { display:grid; gap:var(--tk-space-3); grid-template-columns:repeat(auto-fill, minmax(min(100%, var(--minw,230px)), 1fr)); }
  .tk-note-card { display:flex; flex-direction:column; gap:8px; text-align:left; padding:var(--tk-space-4); min-height:150px; cursor:pointer; color:inherit; font:inherit; position:relative; overflow:hidden; }
  .tk-note-card::before { content:''; position:absolute; left:0; right:0; top:0; height:4px; background:var(--tone, var(--tk-c-accent)); }
  .tk-note-card[aria-current="true"] { border-color:var(--tk-c-accent); }
  .tk-note-card--large { min-height:210px; padding:var(--tk-space-5); }
  .tk-note-card--large .tk-note-row__title { font-size:var(--tk-fs-lg); }
  .tk-note-card__text { font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); display:-webkit-box; -webkit-line-clamp:4; -webkit-box-orient:vertical; overflow:hidden; }
  .tk-note-card__bottom { margin-top:auto; display:flex; flex-direction:column; gap:8px; }
  .tk-note-card--large .tk-note-card__text { -webkit-line-clamp:6; font-size:var(--tk-fs-md); }
  .tk-note-card__foot { display:flex; align-items:center; justify-content:space-between; gap:8px; }
  .tk-note-card__tags { display:flex; gap:6px; flex-wrap:wrap; min-width:0; }
  .tk-note-card__bar { display:flex; align-items:center; gap:8px; font-size:var(--tk-fs-xs); color:var(--tk-c-text-muted); }
  .tk-note-card__bar .tk-progress { flex:1; }`,
  example: { props: { title: 'Notizen' }, data: { notes: [
    { id: 'n1', title: 'Ideen TAKT V2', body: '## Fokus\n- Modulweise Entwicklung\n- Workbench als Designarbeitsplatz', tags: ['Projekt'], pinned: true, updated: '2026-11-24T07:40:00' },
    { id: 'n2', title: 'Einkaufsliste Wochenende', body: '- [ ] Hafermilch\n- [x] Tomaten\n- [ ] Basilikum', tags: ['Privat'], updated: '2026-11-23T18:20:00' },
    { id: 'n3', title: 'Meeting Sales-Review', body: 'Q4-Ziele, neue Kanäle, Preisstrategie für Marktplätze.', tags: ['Arbeit', 'Sales'], updated: '2026-11-18T11:05:00' },
  ] } },
  render: ({ props, data, setData, ctx }) => {
    const all = data.notes || [];
    const f = ctx.ui.filter; const q = String(ctx.ui.query || '').trim();
    const special = ['Angeheftet', 'Archiv', 'Eingang'].includes(f);
    let items = applyUiFilter(all, special ? { ...ctx.ui, filter: undefined } : ctx.ui, { searchFields: ['title', 'body'] });
    items = items.filter((n) => (f === 'Archiv' ? n.archived : f === 'Eingang' ? n.inbox && !n.archived : !n.archived && (q || !n.inbox)) && (f !== 'Angeheftet' || n.pinned));
    items = sortNotes(items);
    if (props.scope === 'angeheftet') items = items.filter((n) => n.pinned);
    if (props.scope === 'zuletzt') items = items.slice().sort((a, b) => String(b.updated).localeCompare(String(a.updated)));
    if (props.limit > 0) items = items.slice(0, props.limit);
    const activeId = ctx.ui.selectedId ?? (props.autoSelect ? items[0]?.id : null);
    const open = (n) => {
      ctx.setUi('selectedId', n.id); ctx.emit('note.open', { id: n.id });
      if (props.openIn === 'dialog') ctx.openDialog({ title: 'Notiz bearbeiten', body: (close) => html`<${DialogEditor} note=${n} setData=${setData} ctx=${ctx} close=${close} />` });
    };
    const pin = (e, n) => { e.stopPropagation(); setData('notes', (a) => a.map((x) => (x.id === n.id ? { ...x, pinned: !x.pinned } : x))); ctx.emit('note.pin', { id: n.id, pinned: !n.pinned }); ctx.toast(n.pinned ? 'Anheften aufgehoben' : 'Notiz angeheftet'); };
    const create = () => {
      const id = `n${Date.now().toString(36)}`; const n = { id, title: '', body: '', tags: [], updated: isoLocal(ctx.today) };
      setData('notes', (a) => [n, ...a]); ctx.setUi('selectedId', id); ctx.emit('note.create', { id, ui: { newNote: n } });
      if (props.openIn === 'dialog') open(n); else ctx.toast('Neue Notiz angelegt');
    };
    const addBtn = props.showCreate && html`<${Button} size="sm" variant="primary" icon="plus" aria-label="Neue Notiz" onClick=${create}>${ctx.bp === 'mobile' ? null : 'Neu'}<//>`;
    const empty = html`<${EmptyState} icon=${f === 'Archiv' ? 'archive' : f === 'Eingang' ? 'inbox' : 'sticky-note'} title=${f === 'Archiv' ? 'Archiv ist leer' : f === 'Eingang' ? 'Eingang ist leer' : 'Keine Notizen gefunden'}
      text=${q ? `Keine Treffer für „${q}“.` : 'Halte Gedanken, Listen und Ideen fest.'} action=${props.showCreate && html`<${Button} variant="primary" icon="plus" onClick=${create}>Neue Notiz<//>`} />`;
    const pinBtn = (n) => html`<button type="button" class="tk-note-row__pin" aria-label=${n.pinned ? 'Anheften aufheben' : 'Anheften'} aria-pressed=${n.pinned ? 'true' : 'false'} onClick=${(e) => pin(e, n)}><${Icon} name="pin" size=${16} /></button>`;
    const tagsOf = (n, max = 2) => (n.tags || []).slice(0, max).map((t) => html`<${Badge}>${t}<//>`);
    const stats = (n) => (props.showProgress ? checklistStats(n.body) : { total: 0 });

    if (props.layout === 'grid') {
      const body = !items.length ? html`<${Card}>${empty}<//>` : html`<div class="tk-note-list__grid" style=${`--minw:${props.minWidth}px`}>
        ${items.map((n) => { const st = stats(n); return html`<div class=${`tk-card tk-card--interactive tk-note-card ${props.cardSize === 'large' ? 'tk-note-card--large' : ''}`} style=${`--tone:${toneColor(tagTone((n.tags || [])[0]))}`} role="button" tabindex="0" aria-current=${n.id === activeId && props.openIn !== 'dialog' ? 'true' : 'false'} onClick=${() => open(n)} onKeyDown=${(e) => e.key === 'Enter' && open(n)}>
          <div class="tk-row" style="justify-content:space-between;align-items:flex-start"><div class="tk-note-row__title"><span class="tk-truncate">${n.title || 'Unbenannte Notiz'}</span></div>${pinBtn(n)}</div>
          ${props.showExcerpt && html`<div class="tk-note-card__text">${stripMd(n.body) || 'Leere Notiz'}</div>`}
          <div class="tk-note-card__bottom">${st.total > 0 && html`<div class="tk-note-card__bar"><${Progress} value=${st.done / st.total} tone=${st.open ? 'accent' : 'success'} /><span class="tk-num">${st.done}/${st.total}</span></div>`}
          <div class="tk-note-card__foot"><div class="tk-note-card__tags">${tagsOf(n)}</div><span class="tk-subtle" style="font-size:var(--tk-fs-xs);white-space:nowrap">${relDay(n.updated, ctx.today)}</span></div></div></div>`; })}</div>`;
      return html`<div class="tk-col" style="gap:12px">${(props.title || addBtn) && html`<div class="tk-row"><div class="tk-h3 tk-grow">${props.title} <span class="tk-subtle tk-num" style="font-weight:400">${items.length}</span></div>${addBtn}</div>`}${body}</div>`;
    }

    const compact = props.layout === 'compact';
    const row = (n) => html`<div role="button" tabindex="0" class=${`tk-note-row ${compact ? 'tk-note-row--compact' : ''}`} aria-current=${n.id === activeId ? 'true' : 'false'} onClick=${() => open(n)} onKeyDown=${(e) => e.key === 'Enter' && open(n)}>
      <div class="tk-note-row__main">
        <div class="tk-note-row__title"><span class="tk-truncate">${n.title || 'Unbenannte Notiz'}</span></div>
        ${props.showExcerpt && html`<div class="tk-note-row__excerpt">${stripMd(n.body) || 'Leere Notiz'}</div>`}
        <div class="tk-note-row__meta"><${ChecklistBadge} stats=${stats(n)} /><span>${relDay(n.updated, ctx.today)}</span>${ctx.bp !== 'mobile' && !compact && tagsOf(n, 2)}</div>
      </div>${pinBtn(n)}</div>`;
    const group = props.groupPinned && props.scope === 'alle' && !props.limit;
    const pinned = group ? items.filter((n) => n.pinned) : []; const rest = group ? items.filter((n) => !n.pinned) : items;
    const body = !items.length ? empty : html`${pinned.length > 0 && html`<div class="tk-note-list__group"><${Icon} name="pin" size=${12} />Angeheftet</div>${pinned.map(row)}`}
      ${pinned.length > 0 && rest.length > 0 && html`<div class="tk-note-list__group">Weitere</div>`}${rest.map(row)}`;
    return html`<${Card} flush title=${props.title} class="tk-note-list" actions=${html`<div class="tk-row"><${Badge}>${items.length}<//>${addBtn}</div>`}>${body}<//>`;
  },
};

// ------------------------------------------------------------------------------------------------ Checklisten ---
export const noteChecklists = {
  id: 'note-checklists',
  name: 'Checklisten-Übersicht',
  category: 'Inhalte',
  description: 'Alle Checklisten der Notizen an einem Ort: offene Punkte direkt abhaken (wirkt in der Notiz) oder der Fortschritt je Liste als Karte. Ein Tipp auf den Listennamen öffnet die Notiz.',
  version: '1.0',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Checklisten' },
    { name: 'mode', label: 'Darstellung', type: 'select', options: ['list', 'progress'], default: 'list' },
    { name: 'limit', label: 'Max. Listen (0 = alle)', type: 'number', default: 0 },
    { name: 'showDone', label: 'Erledigte Punkte zeigen', type: 'boolean', default: false },
    { name: 'minWidth', label: 'Min. Kartenbreite (px, Fortschritt)', type: 'number', default: 200 },
    { name: 'link', label: 'Link-Beschriftung (leer = ohne)', type: 'text', default: '' },
  ],
  data: [{ slot: 'notes', label: 'Notizen', default: 'notes', shape: '{id,title,body,archived?,updated}[]', required: true }],
  events: ['note.checklist.toggle', 'note.open', 'note.checklists.open'],
  states: ['empty'],
  css: `
  .tk-note-checks__head { display:flex; align-items:center; gap:10px; width:100%; min-height:44px; padding:6px 16px; border:0; border-bottom:1px solid var(--tk-c-border); background:var(--tk-c-surface2); color:inherit; font:inherit; text-align:left; cursor:pointer; }
  .tk-note-checks__head:hover { background:var(--tk-c-surface3); }
  .tk-note-checks__head strong { flex:1; min-width:0; font-weight:var(--tk-fw-semibold); }
  .tk-note-checks__item { display:flex; align-items:center; gap:12px; min-height:44px; padding:2px 16px; border-bottom:1px solid var(--tk-c-border); }
  .tk-note-checks__item[data-done="true"] span { text-decoration:line-through; color:var(--tk-c-text-subtle); }
  .tk-note-checks__item:last-child { border-bottom:0; }
  .tk-note-checks__cards { display:grid; gap:var(--tk-space-3); grid-template-columns:repeat(auto-fill, minmax(min(100%, var(--minw,200px)), 1fr)); }
  .tk-note-checks__card { display:flex; flex-direction:column; gap:10px; text-align:left; padding:var(--tk-space-4); color:inherit; font:inherit; cursor:pointer; min-width:0; }
  .tk-note-checks__big { font-size:var(--tk-fs-2xl); font-weight:var(--tk-fw-bold); letter-spacing:var(--tk-ls-tight); font-variant-numeric:tabular-nums; line-height:1; }
  .tk-note-checks__big small { font-size:var(--tk-fs-sm); font-weight:var(--tk-fw-medium); color:var(--tk-c-text-muted); margin-left:4px; }
  .tk-note-checks__next { font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); }`,
  example: { props: { title: 'Checklisten' }, data: { notes: [
    { id: 'n2', title: 'Einkaufsliste Wochenende', body: '- [x] Hafermilch\n- [x] Tomaten\n- [ ] Basilikum\n- [ ] Kaffee (Bohnen)', updated: '2026-11-23T18:20:00' },
    { id: 'n8', title: 'Steuer 2026 – To-do', body: '- [x] Spendenquittungen sammeln\n- [ ] Belege Homeoffice-Pauschale\n- [ ] Fahrtenbuch abschließen', updated: '2026-11-09T16:40:00' },
  ] } },
  render: ({ props, data, setData, ctx }) => {
    let lists = (data.notes || []).filter((n) => !n.archived && checklistItems(n.body).length)
      .map((n) => ({ n, items: checklistItems(n.body), st: checklistStats(n.body) }))
      .sort((a, b) => (b.st.open > 0) - (a.st.open > 0) || String(b.n.updated).localeCompare(String(a.n.updated)));
    if (props.mode === 'list' && !props.showDone) lists = lists.filter((l) => l.st.open > 0);
    if (props.limit > 0) lists = lists.slice(0, props.limit);
    const openNote = (n) => { ctx.setUi('selectedId', n.id); ctx.emit('note.open', { id: n.id }); };
    const toggle = (n, it) => { setData('notes', (all) => all.map((x) => (x.id === n.id ? { ...x, body: toggleTaskLine(x.body, it.idx), updated: isoLocal(ctx.today) } : x))); ctx.emit('note.checklist.toggle', { id: n.id }); };
    if (!lists.length) return html`<${Card} title=${props.title} icon="list-checks"><${EmptyState} icon="list-checks" title="Keine offenen Punkte" text="Schreibe „- [ ]“ in eine Notiz, um eine Checkliste anzulegen." /><//>`;
    const linkBtn = props.link && html`<${Button} size="sm" variant="ghost" iconRight="chevron-right" onClick=${() => ctx.emit('note.checklists.open')}>${props.link}<//>`;
    const openTotal = lists.reduce((s, l) => s + l.st.open, 0);
    if (props.mode === 'progress') {
      return html`<div class="tk-col" style="gap:12px">${(props.title || props.link) && html`<div class="tk-row"><div class="tk-h3 tk-grow">${props.title}</div>${linkBtn}</div>`}
        <div class="tk-note-checks__cards" style=${`--minw:${props.minWidth}px`}>${lists.map(({ n, items, st }) => { const next = items.find((i) => !i.done);
          return html`<button type="button" class="tk-card tk-card--interactive tk-note-checks__card" aria-label=${`${n.title}, ${st.done} von ${st.total} erledigt`} onClick=${() => openNote(n)}>
            <div class="tk-note-checks__big">${st.done}<small>von ${st.total} erledigt</small></div>
            <${Progress} value=${st.done / st.total} tone=${st.open ? 'accent' : 'success'} />
            <div><div style="font-weight:var(--tk-fw-semibold)" class="tk-truncate">${n.title}</div>
              <div class="tk-note-checks__next tk-truncate">${next ? `Als Nächstes: ${next.text}` : 'Alles erledigt'}</div></div></button>`; })}</div></div>`;
    }
    return html`<${Card} flush title=${props.title} icon="list-checks" actions=${html`<div class="tk-row"><${Badge}>${openTotal} offen<//>${linkBtn}</div>`}>
      ${lists.map(({ n, items, st }) => html`<div><button type="button" class="tk-note-checks__head" onClick=${() => openNote(n)}><strong class="tk-truncate">${n.title}</strong><span class="tk-subtle tk-num">${st.done}/${st.total}</span><${Icon} name="chevron-right" size=${15} /></button>
        ${items.filter((i) => props.showDone || !i.done).map((it) => html`<div class="tk-note-checks__item" data-done=${it.done ? 'true' : 'false'}><${Check} checked=${it.done} label=${it.text} onChange=${() => toggle(n, it)} /><span>${it.text}</span></div>`)}</div>`)}<//>`;
  },
};

// ------------------------------------------------------------------------------------------------ Eingang ---
export const noteInbox = {
  id: 'note-inbox',
  name: 'Notiz-Eingang',
  category: 'Inhalte',
  description: 'Schnellnotiz ohne Umweg und Eingang zum Einsortieren: Tag vergeben, als Aufgabe übernehmen, behalten oder archivieren. Als Liste mit Aktionen in der Zeile oder als Sortier-Assistent (eine Notiz nach der anderen).',
  version: '1.0',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Eingang' },
    { name: 'mode', label: 'Darstellung', type: 'select', options: ['list', 'triage'], default: 'list' },
    { name: 'showCapture', label: 'Schnellnotiz-Feld', type: 'boolean', default: true },
    { name: 'limit', label: 'Max. Einträge (0 = alle)', type: 'number', default: 0 },
    { name: 'tags', label: 'Tags zum Einsortieren', type: 'list', default: ['Arbeit', 'Privat', 'Projekt', 'Ideen'] },
    { name: 'link', label: 'Link-Beschriftung (leer = ohne)', type: 'text', default: '' },
  ],
  data: [
    { slot: 'notes', label: 'Notizen', default: 'notes', shape: '{id,title,body,tags?,inbox?,archived?,updated}[]', required: true },
    { slot: 'tasks', label: 'Aufgaben (Ziel für „Als Aufgabe“)', default: 'tasks', shape: 'Aufgaben-Array', required: false },
  ],
  events: ['note.inbox.add', 'note.inbox.sort', 'note.inbox.keep', 'note.to-task', 'note.archive', 'note.open', 'note.inbox.open'],
  states: ['empty'],
  css: `
  .tk-note-inbox__capture { display:flex; gap:8px; padding:var(--tk-space-3) var(--tk-space-4); border-bottom:1px solid var(--tk-c-border); }
  .tk-note-inbox__capture .tk-input { flex:1; min-width:0; }
  .tk-note-inbox__row { display:flex; flex-direction:column; gap:8px; padding:12px 16px; border-bottom:1px solid var(--tk-c-border); min-width:0; }
  .tk-note-inbox__row:last-child { border-bottom:0; }
  .tk-note-inbox__title { display:flex; align-items:baseline; gap:10px; width:100%; min-height:28px; border:0; background:none; padding:0; color:inherit; font:inherit; text-align:left; cursor:pointer; min-width:0; }
  .tk-note-inbox__title strong { font-weight:var(--tk-fw-semibold); }
  .tk-note-inbox__title span { margin-left:auto; flex:none; font-size:var(--tk-fs-xs); color:var(--tk-c-text-subtle); }
  .tk-note-inbox__text { font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
  .tk-note-inbox__acts { display:flex; flex-wrap:wrap; gap:6px; align-items:center; }
  .tk-note-inbox__acts .tk-chip { min-height:32px; }
  .bp-mobile .tk-note-inbox__acts .tk-chip, .bp-mobile .tk-note-inbox__acts .tk-btn { min-height:40px; }
  .bp-mobile .tk-note-inbox__title { min-height:36px; align-items:center; }
  .tk-note-inbox__big { display:flex; flex-direction:column; gap:14px; padding:var(--tk-space-5); }
  .tk-note-inbox__big h3 { margin:0; font-size:var(--tk-fs-xl); font-weight:var(--tk-fw-bold); letter-spacing:var(--tk-ls-tight); }
  .tk-note-inbox__grid { display:grid; grid-template-columns:repeat(2, minmax(0,1fr)); gap:8px; }
  .tk-note-inbox__grid .tk-btn { min-height:48px; justify-content:center; }`,
  example: { props: { title: 'Eingang' }, data: { tasks: [], notes: [
    { id: 'i1', title: 'Newsletter-Betreff testen', body: 'Zwei Varianten im A/B-Test.', tags: [], inbox: true, updated: '2026-11-24T08:52:00' },
    { id: 'i2', title: 'Rückruf Frau Weber', body: 'Lieferzeit Wolldecke klären.', tags: [], inbox: true, updated: '2026-11-24T09:05:00' },
  ] } },
  render: ({ props, data, setData, ctx }) => {
    const [text, setText] = useState('');
    let inbox = (data.notes || []).filter((n) => n.inbox && !n.archived).sort((a, b) => String(b.updated).localeCompare(String(a.updated)));
    if (props.limit > 0) inbox = inbox.slice(0, props.limit);
    const tags = Array.isArray(props.tags) ? props.tags : String(props.tags).split(',').map((s) => s.trim()).filter(Boolean);
    const patch = (id, p) => setData('notes', (all) => all.map((n) => (n.id === id ? { ...n, ...p } : n)));
    const add = () => {
      const t = text.trim(); if (!t) return; const id = `n${Date.now().toString(36)}`;
      setData('notes', (all) => [{ id, title: t.slice(0, 70), body: t.length > 70 ? t : '', tags: [], inbox: true, updated: isoLocal(ctx.today) }, ...all]);
      ctx.emit('note.inbox.add', { id }); ctx.toast('Im Eingang gespeichert'); setText('');
    };
    const sort = (n, tag) => { patch(n.id, { tags: [tag], inbox: false }); ctx.emit('note.inbox.sort', { id: n.id, tag }); ctx.toast(`In „${tag}“ einsortiert`); };
    const keep = (n) => { patch(n.id, { inbox: false }); ctx.emit('note.inbox.keep', { id: n.id }); ctx.toast('Bei den Notizen abgelegt'); };
    const task = (n) => {
      const due = isoLocal(ctx.today).slice(0, 10);
      setData('tasks', (all) => [{ id: `t-${n.id}`, title: n.title, due, priority: 'mittel', project: 'Eingang', category: 'Arbeit', status: 'Offen', subtasks: [], note: n.body || '' }, ...(Array.isArray(all) ? all : [])]);
      patch(n.id, { inbox: false, archived: true }); ctx.emit('note.to-task', { id: n.id }); ctx.toast('Aufgabe für heute angelegt');
    };
    const archive = (n) => { patch(n.id, { inbox: false, archived: true }); ctx.emit('note.archive', { id: n.id, archived: true }); ctx.toast('Notiz archiviert'); };
    const open = (n) => { ctx.setUi('selectedId', n.id); ctx.emit('note.open', { id: n.id }); };
    const capture = props.showCapture && html`<div class="tk-note-inbox__capture"><${Input} value=${text} onInput=${setText} placeholder="Schnellnotiz … (Enter)" aria-label="Schnellnotiz" onKeyDown=${(e) => e.key === 'Enter' && add()} /><${Button} variant="primary" icon="plus" aria-label="Im Eingang speichern" onClick=${add}>${ctx.bp === 'mobile' ? null : 'Erfassen'}<//></div>`;
    const empty = html`<${EmptyState} icon="inbox" title="Eingang ist leer" text="Alles einsortiert. Neue Gedanken landen hier, bis du sie ablegst." />`;
    const badge = html`<div class="tk-row"><${Badge} tone=${inbox.length ? 'warning' : 'success'}>${inbox.length}<//>${props.link && html`<${Button} size="sm" variant="ghost" iconRight="chevron-right" onClick=${() => ctx.emit('note.inbox.open')}>${props.link}<//>`}</div>`;

    if (props.mode === 'triage') {
      const n = inbox[0];
      return html`<${Card} flush title=${props.title} icon="inbox" actions=${badge}>${capture}${!n ? empty : html`<div class="tk-note-inbox__big">
        <div class="tk-subtle tk-num" style="font-size:var(--tk-fs-sm)">1 von ${inbox.length} · ${relDay(n.updated, ctx.today)}</div>
        <h3>${n.title}</h3>${n.body && n.body !== n.title && html`<div class="tk-muted" style="line-height:1.6">${stripMd(n.body)}</div>`}
        <div class="tk-label">Einsortieren in</div>
        <div class="tk-note-inbox__acts">${tags.map((t) => html`<${Button} size="sm" onClick=${() => sort(n, t)}>${t}<//>`)}</div>
        <div class="tk-note-inbox__grid"><${Button} variant="primary" icon="list-todo" onClick=${() => task(n)}>Als Aufgabe<//><${Button} icon="check" onClick=${() => keep(n)}>Behalten<//>
          <${Button} icon="archive" onClick=${() => archive(n)}>Archivieren<//><${Button} icon="pencil" onClick=${() => open(n)}>Öffnen<//></div></div>`}<//>`;
    }
    return html`<${Card} flush title=${props.title} icon="inbox" actions=${badge}>${capture}${!inbox.length ? empty : inbox.map((n) => html`<div class="tk-note-inbox__row">
      <button type="button" class="tk-note-inbox__title" onClick=${() => open(n)}><strong class="tk-truncate">${n.title}</strong><span>${relDay(n.updated, ctx.today)}</span></button>
      ${n.body && n.body !== n.title && html`<div class="tk-note-inbox__text">${stripMd(n.body)}</div>`}
      <div class="tk-note-inbox__acts">${tags.slice(0, ctx.bp === 'mobile' ? 3 : 4).map((t) => html`<${Button} size="sm" aria-label=${`In ${t} einsortieren`} onClick=${() => sort(n, t)}>${t}<//>`)}
        <${Button} size="sm" variant="ghost" icon="list-todo" aria-label="Als Aufgabe übernehmen" title="Als Aufgabe" onClick=${() => task(n)} /><${Button} size="sm" variant="ghost" icon="archive" aria-label="Archivieren" title="Archivieren" onClick=${() => archive(n)} /></div></div>`)}<//>`;
  },
};
