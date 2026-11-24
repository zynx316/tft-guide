// Notizen: Eingang als Pinnwand – Karten im Raster, die geöffnete Karte zeigt die Ablagen (Tags, Aufgabe, Behalten, Archiv) als Kacheln.
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Card, Button, Badge, Icon, EmptyState, Input, toneColor } from '../../ui.js';
import { relDay, stripMd, tagTone, inboxOps } from './content-util.js';

export const noteBoard = {
  id: 'note-board',
  name: 'Notiz-Pinnwand',
  category: 'Inhalte',
  description: 'Eingang als Pinnwand: große Schnellnotiz-Zeile, Notizen als Karten im Raster. Eine Karte antippen öffnet die Ablagen als Kacheln (Tags mit Farbpunkt, Aufgabe, Behalten, Archiv); „Rückgängig“ holt die letzte Ablage zurück.',
  version: '1.0',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Pinnwand' },
    { name: 'showCapture', label: 'Schnellnotiz-Feld', type: 'boolean', default: true },
    { name: 'tags', label: 'Tags zum Einsortieren', type: 'list', default: ['Arbeit', 'Privat', 'Projekt', 'Ideen'] },
    { name: 'minWidth', label: 'Min. Kartenbreite (px)', type: 'number', default: 250 },
  ],
  data: [
    { slot: 'notes', label: 'Notizen', default: 'notes', shape: '{id,title,body,tags?,inbox?,archived?,updated}[]', required: true },
    { slot: 'tasks', label: 'Aufgaben (Ziel für „Als Aufgabe“)', default: 'tasks', shape: 'Aufgaben-Array', required: false },
  ],
  events: ['note.inbox.add', 'note.inbox.sort', 'note.inbox.keep', 'note.to-task', 'note.archive', 'note.open'],
  states: ['empty'],
  flutter: { widget: 'TaktNoteBoard', propMap: { title: 'title', showCapture: 'showCapture', tags: 'tags' }, events: ['note.inbox.add', 'note.inbox.sort', 'note.inbox.keep', 'note.to-task', 'note.archive', 'note.open'] },
  css: `
  .tk-note-board { display:flex; flex-direction:column; gap:var(--tk-space-4); min-width:0; }
  .tk-note-board__hero { display:flex; gap:8px; padding:var(--tk-space-4); border:1px solid var(--tk-c-border); border-radius:var(--tk-radius-xl); background:linear-gradient(160deg, var(--tk-c-accent-soft), var(--tk-c-surface) 70%); }
  .tk-note-board__hero .tk-input { flex:1; min-width:0; }
  .tk-note-board__grid { display:grid; gap:var(--tk-space-3); grid-template-columns:repeat(auto-fill, minmax(min(100%, var(--minw,250px)), 1fr)); align-items:start; }
  .tk-note-board__card { display:flex; flex-direction:column; gap:10px; padding:var(--tk-space-4); border:1px solid var(--tk-c-border); border-top:4px solid var(--tk-c-accent); border-radius:var(--tk-radius-lg); background:var(--tk-c-surface); color:inherit; font:inherit; text-align:left; min-width:0; }
  .tk-note-board__card[data-open="true"] { border-color:var(--tk-c-accent); background:linear-gradient(180deg, var(--tk-c-accent-soft), var(--tk-c-surface) 60%); }
  .tk-note-board__face { display:flex; flex-direction:column; gap:6px; width:100%; min-height:44px; border:0; padding:0; background:none; color:inherit; font:inherit; text-align:left; cursor:pointer; }
  .tk-note-board__face strong { font-size:var(--tk-fs-lg); font-weight:var(--tk-fw-bold); line-height:1.3; overflow-wrap:anywhere; }
  .tk-note-board__text { font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden; overflow-wrap:anywhere; }
  .tk-note-board__meta { display:flex; align-items:center; justify-content:space-between; gap:8px; font-size:var(--tk-fs-xs); color:var(--tk-c-text-subtle); }
  .tk-note-board__tiles { display:grid; grid-template-columns:repeat(2, minmax(0,1fr)); gap:8px; }
  .tk-note-board__tile { display:flex; align-items:center; gap:8px; min-height:44px; padding:6px 12px; border:1px solid var(--tk-c-border); border-radius:var(--tk-radius-md); background:var(--tk-c-surface2); color:var(--tk-c-text); font:inherit; font-size:var(--tk-fs-sm); text-align:left; cursor:pointer; min-width:0; overflow-wrap:anywhere; }
  .tk-note-board__tile:hover, .tk-note-board__tile:focus-visible { border-color:var(--tk-c-accent); }
  .tk-note-board__dot { width:12px; height:12px; border-radius:50%; flex:none; background:var(--tone); }
  .tk-note-board__tile--act { grid-column:span 2; background:var(--tk-c-accent); border-color:var(--tk-c-accent); color:var(--tk-c-text-on-accent); font-weight:var(--tk-fw-semibold); }
  .tk-note-board__undo { display:flex; align-items:center; justify-content:space-between; gap:8px; flex-wrap:wrap; padding:8px 14px; border:1px dashed var(--tk-c-border-strong); border-radius:var(--tk-radius-md); font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); }
  [data-tk-large-text] .tk-note-board__text { display:block; -webkit-line-clamp:unset; overflow:visible; }`,
  example: { props: { title: 'Pinnwand' }, data: { tasks: [], notes: [
    { id: 'i1', title: 'Newsletter-Betreff testen', body: 'Zwei Varianten im A/B-Test.', tags: [], inbox: true, updated: '2026-11-24T08:52:00' },
    { id: 'i2', title: 'Rückruf Frau Weber', body: 'Lieferzeit Wolldecke klären.', tags: [], inbox: true, updated: '2026-11-24T09:05:00' },
  ] } },
  render: function NoteBoard({ props, data, setData, ctx }) {
    const [text, setText] = useState(''), [openId, setOpenId] = useState(null), [last, setLast] = useState(null);
    const inbox = (data.notes || []).filter((n) => n.inbox && !n.archived).sort((a, b) => String(b.updated).localeCompare(String(a.updated)));
    const tags = Array.isArray(props.tags) ? props.tags : String(props.tags).split(',').map((s) => s.trim()).filter(Boolean);
    const ops = inboxOps({ setData, ctx }), cur = openId === '' ? null : (inbox.find((n) => n.id === openId) || inbox[0]);
    const filed = (n, what, fn) => { fn(); setLast({ id: n.id, what, title: n.title, task: what === 'Aufgabe' }); setOpenId(null); };
    const undo = () => {
      if (!last) return;
      if (last.task) setData('tasks', (a) => (Array.isArray(a) ? a.filter((t) => t.id !== `t-${last.id}`) : a));
      ops.patch(last.id, { inbox: true, archived: false, tags: [] }); ctx.toast('Ablage zurückgenommen'); setLast(null);
    };
    const add = () => { if (ops.add(text)) setText(''); };
    const hero = props.showCapture && html`<div class="tk-note-board__hero"><${Input} value=${text} onInput=${setText} placeholder="Gedanke anpinnen …" aria-label="Schnellnotiz" onKeyDown=${(e) => e.key === 'Enter' && add()} /><${Button} variant="primary" icon="plus" aria-label="Im Eingang speichern" onClick=${add}>${ctx.bp === 'mobile' ? null : 'Anpinnen'}<//></div>`;
    const undoBar = last && html`<div class="tk-note-board__undo" role="status"><span>„${last.title}“ abgelegt (${last.what}).</span><${Button} size="sm" variant="ghost" icon="undo-2" onClick=${undo}>Rückgängig<//></div>`;
    return html`<div class="tk-note-board" data-qa="note-board">${hero}${undoBar}
      ${!inbox.length ? html`<${Card} title=${props.title} icon="pin"><${EmptyState} icon="check-check" title=${last ? 'Alles einsortiert' : 'Eingang ist leer'} text=${last ? 'Die Pinnwand ist leer. Neue Gedanken landen hier, bis du sie ablegst.' : 'Halte oben einen Gedanken fest, er erscheint hier als Karte.'} /><//>`
      : html`<div class="tk-row"><div class="tk-h3 tk-grow">${props.title} <span class="tk-subtle tk-num" style="font-weight:400">${inbox.length}</span></div></div>
        <div class="tk-note-board__grid" style=${`--minw:${props.minWidth}px`}>${inbox.map((n) => { const isOpen = cur && cur.id === n.id;
          return html`<div class="tk-note-board__card" data-open=${isOpen ? 'true' : 'false'}>
            <button type="button" class="tk-note-board__face" aria-expanded=${isOpen ? 'true' : 'false'} onClick=${() => setOpenId(isOpen ? '' : n.id)}><strong>${n.title}</strong>
              ${n.body && n.body !== n.title && html`<span class="tk-note-board__text">${stripMd(n.body)}</span>`}
              <span class="tk-note-board__meta"><span>${relDay(n.updated, ctx.today)}</span><span>${isOpen ? 'Ablegen in …' : 'Antippen zum Ablegen'}</span></span></button>
            ${isOpen && html`<div class="tk-note-board__tiles" role="group" aria-label="Ablegen in">
              ${tags.map((t) => html`<button type="button" class="tk-note-board__tile" style=${`--tone:${toneColor(tagTone(t))}`} onClick=${() => filed(n, t, () => ops.sort(n, t))}><span class="tk-note-board__dot"></span>${t}</button>`)}
              <button type="button" class="tk-note-board__tile tk-note-board__tile--act" onClick=${() => filed(n, 'Aufgabe', () => ops.task(n))}><${Icon} name="list-todo" size=${16} />Als Aufgabe für heute</button>
              <button type="button" class="tk-note-board__tile" onClick=${() => filed(n, 'Behalten', () => ops.keep(n))}><${Icon} name="check" size=${16} />Behalten</button>
              <button type="button" class="tk-note-board__tile" onClick=${() => filed(n, 'Archiv', () => ops.archive(n))}><${Icon} name="archive" size=${16} />Archivieren</button>
              <button type="button" class="tk-note-board__tile" style="grid-column:span 2" onClick=${() => ops.open(n)}><${Icon} name="pencil" size=${16} />Öffnen und bearbeiten</button></div>`}</div>`; })}</div>`}
    </div>`;
  },
};
