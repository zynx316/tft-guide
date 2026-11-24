// Dokumente: Ordner – Kacheln mit Anzahl, kompakte Liste mit Aufbewahrung oder Chips. Antippen öffnet die gefilterte Dokumentliste.
import { html } from '../../../lib/html.js';
import { Card, Button, Icon, EmptyState, Chip, toneColor } from '../../ui.js';
import { arr, IconTile, plural } from './_docs.js';
import { pick } from './_example.js';

export const dokFolders = {
  id: 'dok-folders',
  name: 'Ordner',
  category: 'Dokumente',
  description: 'Die Ordner der Ablage mit Anzahl der Dokumente. Als große Kacheln, dichte Liste (mit Aufbewahrungsrichtwert) oder als Chips. Antippen öffnet die Dokumentliste, gefiltert auf den Ordner.',
  version: '1.0',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Ordner' },
    { name: 'style', label: 'Darstellung', type: 'select', options: ['tiles', 'list', 'chips'], default: 'tiles' },
    { name: 'showRetention', label: 'Aufbewahrung zeigen', type: 'boolean', default: false },
    { name: 'showSettings', label: 'Link zu Aufbewahrung und Sperre', type: 'boolean', default: true },
  ],
  data: [
    { slot: 'folders', label: 'Ordner', default: 'folders', shape: '{id,name,icon,tone,desc,retention}[]', required: true },
    { slot: 'documents', label: 'Dokumente', default: 'documents', shape: '{id,folderId}[]', required: false },
  ],
  events: ['folder.open', 'module.settings', 'scan.start'],
  states: ['empty'],
  flutter: { widget: 'TaktDocumentFolders', propMap: { title: 'title', style: 'variant', showRetention: 'showRetention' }, events: { 'folder.open': 'onOpenFolder', 'module.settings': 'onOpenSettings' } },
  css: `
  .tk-dok-tiles { display:grid; grid-template-columns:repeat(auto-fill, minmax(min(100%, 150px), 1fr)); gap:var(--tk-space-3); }
  .tk-dok-tile { all:unset; box-sizing:border-box; display:flex; flex-direction:column; gap:10px; min-height:var(--tk-size-touch); padding:var(--tk-space-4); border-radius:var(--tk-radius-lg); background:var(--tk-c-surface); border:1px solid var(--tk-c-border); cursor:pointer; min-width:0; }
  .tk-dok-tile:hover { border-color:var(--tk-c-border-strong); background:var(--tk-c-surface2); } .tk-dok-tile:focus-visible { outline:2px solid var(--tk-c-focus); }
  .tk-dok-tile b { font-weight:var(--tk-fw-semibold); overflow-wrap:anywhere; } .tk-dok-tile .tk-dok-ic { --ic:44px; }
  .tk-dok-chips { display:flex; gap:var(--tk-space-2); overflow-x:auto; scrollbar-width:none; padding-bottom:2px; }
  .tk-dok-chips > * { flex:none; }
  .bp-mobile .tk-dok-tiles { grid-template-columns:repeat(2, minmax(0,1fr)); gap:var(--tk-space-2); }`,
  example: { props: { style: 'tiles' }, data: pick('folders', 'documents') },
  render: function DokFolders({ props, data, ctx }) {
    const folders = arr(data.folders), docs = arr(data.documents);
    const count = (f) => docs.filter((d) => d.folderId === f.id).length;
    const open = (f) => { ctx.setUi('folder', f.id); ctx.emit('folder.open', { id: f.id, ui: { filter: f.name } }); };
    if (!folders.length) return html`<${Card} title=${props.title}><${EmptyState} icon="folder" title="Noch keine Ordner" text="Ordner halten Verträge, Belege und Bescheide zusammen." action=${html`<${Button} variant="primary" icon="plus" onClick=${() => ctx.emit('scan.start')}>Dokument hinzufügen<//>`} /><//>`;
    const settings = props.showSettings && html`<${Button} variant="ghost" size="sm" icon="lock" onClick=${() => ctx.emit('module.settings')}>Aufbewahrung und Sperre<//>`;
    if (props.style === 'chips') return html`<div class="tk-dok-chips" role="group" aria-label=${props.title}>${folders.map((f) => html`<${Chip} icon=${f.icon} count=${count(f)} onClick=${() => open(f)}>${f.name}<//>`)}</div>`;
    const head = html`<div class="tk-dok-sec"><h3>${props.title}</h3>${settings}</div>`;
    if (props.style === 'list') return html`<section>${head}<${Card} flush>${folders.map((f) => html`<button type="button" class="tk-dok-row" onClick=${() => open(f)}>
      <${IconTile} icon=${f.icon} tone=${f.tone} /><span class="tk-dok-main"><b>${f.name}</b><span class="tk-dok-sub">${props.showRetention ? f.retention : f.desc}</span></span>
      <span class="tk-dok-fine tk-num" aria-label=${plural(count(f), 'Dokument', 'Dokumente')}>${count(f)}</span><span style=${`color:${toneColor('neutral')}`}><${Icon} name="chevron-right" size=${16} /></span></button>`)}<//></section>`;
    return html`<section>${head}<div class="tk-dok-tiles">${folders.map((f) => html`<button type="button" class="tk-dok-tile" onClick=${() => open(f)} aria-label=${`${f.name}, ${plural(count(f), 'Dokument', 'Dokumente')}`}>
      <${IconTile} icon=${f.icon} tone=${f.tone} size=${44} /><b>${f.name}</b><span class="tk-dok-sub">${plural(count(f), 'Dokument', 'Dokumente')}</span>${props.showRetention && html`<span class="tk-dok-fine">${f.retention}</span>`}</button>`)}</div></section>`;
  },
};
export default dokFolders;
