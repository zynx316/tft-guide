// Dokumente: Dokumentliste – Zeilen mit Suche und Filter (Ordner, Typ, Tags), Karten mit Vorschau-Attrappe oder „Zuletzt hinzugefügt“.
import { html } from '../../../lib/html.js';
import { Card, Button, Badge, Icon, EmptyState, Chip, Search } from '../../ui.js';
import { fmtDate, fmtRelativeDay } from '../../../lib/format.js';
import { documentState } from './_deadlines.js';
import { arr, todayOf, typeIcon, folderOf, recentFirst, matchDoc, plural, IconTile, dateLabel } from './_docs.js';
import { pick } from './_example.js';

export const dokList = {
  id: 'dok-list',
  name: 'Dokumentliste',
  category: 'Dokumente',
  description: 'Alle Dokumente mit Suche (Titel, Auszug, Tags) und Filterchips für Ordner und Tags. Stile: Zeilen (neueste zuerst, „hinzugefügt heute“) oder Karten mit Vorschau-Attrappe. Suche und Filter kommen alternativ aus „Suche & Filter“ (ctx.ui.query/filter).',
  version: '1.0',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Dokumente' },
    { name: 'style', label: 'Darstellung', type: 'select', options: ['rows', 'cards'], default: 'rows' },
    { name: 'controls', label: 'Bedienung', type: 'select', options: ['none', 'search', 'full'], default: 'none' },
    { name: 'limit', label: 'Max. Einträge (0 = alle)', type: 'number', default: 0 },
    { name: 'quietEmpty', label: 'Leerzustand als Einzeiler', type: 'boolean', default: false },
  ],
  data: [
    { slot: 'documents', label: 'Dokumente', default: 'documents', shape: '{id,title,folderId,type,date,added,pages,format,tags[],validUntil?}[]', required: true },
    { slot: 'folders', label: 'Ordner', default: 'folders', shape: '{id,name,icon,tone}[]', required: false },
  ],
  events: ['doc.open', 'scan.start', 'doc.search.all'],
  states: ['empty'],
  flutter: { widget: 'TaktDocumentList', propMap: { title: 'title', style: 'variant', controls: 'controls', limit: 'maxItems' }, events: { 'doc.open': 'onOpen', 'scan.start': 'onScan' } },
  css: `
  .tk-dok-ctl { display:flex; flex-direction:column; gap:var(--tk-space-3); padding:var(--tk-space-3) var(--tk-space-4) var(--tk-space-2); }
  .tk-dok-ctl .tk-dok-chips { display:flex; gap:var(--tk-space-2); overflow-x:auto; scrollbar-width:none; } .tk-dok-ctl .tk-dok-chips > * { flex:none; }
  .tk-dok-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(min(100%, 200px), 1fr)); gap:var(--tk-space-3); }
  .tk-dok-thumb { height:96px; border-radius:var(--tk-radius-md); border:1px solid var(--tk-c-border); background:var(--tk-c-surface2); padding:10px 12px; display:flex; flex-direction:column; gap:6px; overflow:hidden; position:relative; }
  .tk-dok-thumb i { display:block; height:5px; border-radius:3px; background:var(--tk-c-surface3); } .tk-dok-thumb i:nth-child(1) { width:55%; background:color-mix(in srgb, var(--tc) 55%, var(--tk-c-surface3)); height:7px; } .tk-dok-thumb i:nth-child(3) { width:82%; } .tk-dok-thumb i:nth-child(4) { width:68%; } .tk-dok-thumb i:nth-child(5) { width:76%; }
  .tk-dok-thumb .tk-dok-lock { position:absolute; right:8px; bottom:6px; color:var(--tk-c-text-subtle); }
  .tk-dok-title { display:flex; align-items:center; gap:6px; flex-wrap:wrap; } .tk-dok-title b { overflow-wrap:anywhere; }`,
  example: { props: { style: 'rows', controls: 'full' }, data: pick('documents', 'folders') },
  render: function DokList({ props, data, ctx }) {
    const docs = recentFirst(data.documents), folders = arr(data.folders), today = todayOf(ctx);
    const q = ctx.ui.query || '', filter = ctx.ui.filter && !/^alle?$/i.test(ctx.ui.filter) ? ctx.ui.filter : '';
    const chips = [...folders.map((f) => f.name), ...[...new Set(docs.flatMap((d) => arr(d.tags)))].slice(0, 6)];
    const inFilter = (d) => !filter || folderOf(folders, d.folderId)?.name === filter || d.type === filter || arr(d.tags).includes(filter);
    let list = docs.filter((d) => inFilter(d) && matchDoc(d, q, folders));
    if (props.limit > 0) list = list.slice(0, props.limit);
    const open = (d) => { ctx.setUi('selectedId', d.id); ctx.emit('doc.open', { id: d.id }); };
    const when = (d) => { const n = fmtRelativeDay(d.added, ctx.today); return ['heute', 'gestern'].includes(n) ? `hinzugefügt ${n}` : fmtDate(d.date); };
    const flag = (d) => { const s = documentState(d, today); return s.status === 'läuft ab' ? html`<${Badge} tone="warning" icon="hourglass">bis ${dateLabel(d.validUntil, today)}<//>` : s.status === 'abgelaufen' ? html`<${Badge}>abgelaufen<//>` : d.sensitive ? html`<${Badge} icon="lock">sensibel<//>` : null; };
    const row = (d) => html`<button type="button" class="tk-dok-row" onClick=${() => open(d)} aria-current=${ctx.ui.selectedId === d.id ? 'true' : 'false'}>
      <${IconTile} icon=${typeIcon(d.type)} tone=${folderOf(folders, d.folderId)?.tone || 'accent'} /><span class="tk-dok-main"><span class="tk-dok-title"><b>${d.title}</b></span>
      <span class="tk-dok-sub">${folderOf(folders, d.folderId)?.name || d.type} · ${when(d)} · ${plural(d.pages, 'Seite', 'Seiten')}</span></span>${flag(d) && html`<span class="tk-dok-end">${flag(d)}</span>`}</button>`;
    const card = (d) => html`<button type="button" class="tk-dok-card" onClick=${() => open(d)} style=${`--tc:var(--tk-chart-${folderOf(folders, d.folderId)?.tone || 1})`}>
      <span class="tk-dok-thumb" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i>${d.sensitive && html`<span class="tk-dok-lock"><${Icon} name="lock" size=${14} /></span>`}</span>
      <span class="tk-dok-main"><b>${d.title}</b><span class="tk-dok-sub">${d.type} · ${when(d)}</span></span>${flag(d)}</button>`;
    if (!docs.length && props.quietEmpty) return html`<${Card} title=${props.title}><p class="tk-dok-sub" role="note"><${Icon} name="folder-open" size=${14} /> Noch keine Dokumente. Sie erscheinen hier, sobald du eines ablegst.</p><//>`;
    const empty = !docs.length
      ? html`<${EmptyState} icon="folder-open" title="Noch keine Dokumente" text="Scanne ein Dokument oder lege eine Datei ab. TAKT erkennt Datum und Fristen und sortiert sie in einen Ordner." action=${html`<${Button} variant="primary" icon="scan" onClick=${() => ctx.emit('scan.start')}>Dokument scannen<//>`} />`
      : html`<${EmptyState} icon="search" title=${q ? `Keine Treffer für „${q}“` : 'Keine Dokumente in diesem Filter'} text="Prüfe die Schreibweise oder zeige alle Dokumente." action=${html`<${Button} icon="files" onClick=${() => { ctx.setUi('query', ''); ctx.setUi('filter', 'Alle'); ctx.emit('doc.search.all'); }}>Alle Dokumente zeigen<//>`} />`;
    const controls = props.controls !== 'none' && html`<div class="tk-dok-ctl"><${Search} value=${q} placeholder="Dokumente durchsuchen" onInput=${(v) => ctx.setUi('query', v)} />
      ${props.controls === 'full' && html`<div class="tk-dok-chips" role="group" aria-label="Filter"><${Chip} active=${!filter} onClick=${() => ctx.setUi('filter', 'Alle')}>Alle<//>${chips.map((c) => html`<${Chip} active=${filter === c} onClick=${() => ctx.setUi('filter', c)}>${c}<//>`)}</div>`}</div>`;
    const body = !list.length ? empty : props.style === 'cards' ? html`<div class="tk-dok-grid" style="padding:var(--tk-space-3)">${list.map(card)}</div>` : list.map(row);
    return html`<${Card} flush title=${props.title} actions=${html`<${Badge}>${list.length}<//>`}>${controls}${body}<//>`;
  },
};
export default dokList;
