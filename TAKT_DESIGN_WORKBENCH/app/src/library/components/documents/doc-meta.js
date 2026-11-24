// Dokumente: Metadaten – Ordner, Datum, Format, Ablaufdatum mit Stufe, Tags, Aufbewahrung und Verknüpfungen (Vertrag, Garantie, Beleg, Termin).
// Aktionen: Ordner wechseln, Teilen (Simulation), Löschen mit „Rückgängig“.
import { html } from '../../../lib/html.js';
import { Card, Button, Badge, Icon, EmptyState, Select } from '../../ui.js';
import { fmtDate } from '../../../lib/format.js';
import { documentState, stageOf } from './_deadlines.js';
import { arr, todayOf, recentFirst, folderOf, dateLabel, inDays, typeIcon, plural, IconTile } from './_docs.js';
import { pushUndo } from '../crosscut/_crosscut.js';
import { pick } from './_example.js';

export const dokMeta = {
  id: 'dok-meta',
  name: 'Dokument-Metadaten',
  category: 'Dokumente',
  description: 'Metadaten eines Dokuments: Ordner (wechselbar), Typ, Datum, Format, Ablaufdatum mit Stufe und Erinnerung, Tags, Aufbewahrung und Verknüpfungen zu Vertrag, Garantie, Beleg und Termin. Teilen ist simuliert, Löschen bietet „Rückgängig“.',
  version: '1.1',
  props: [
    { name: 'showActions', label: 'Aktionen', type: 'boolean', default: true },
    { name: 'showLinks', label: 'Verknüpfungen', type: 'boolean', default: true },
  ],
  data: [
    { slot: 'documents', label: 'Dokumente', default: 'documents', shape: '{id,title,type,folderId,date,added,validUntil?,contractId?,warrantyId?,links?}[]', required: true },
    { slot: 'folders', label: 'Ordner', default: 'folders', shape: '{id,name,icon,tone,retention}[]', required: false },
    { slot: 'contracts', label: 'Verträge', default: 'contracts', shape: '{id,name}[]', required: false },
    { slot: 'warranties', label: 'Garantien', default: 'warranties', shape: '{id,title}[]', required: false },
  ],
  events: ['link.contract', 'link.warranty', 'link.event', 'doc.share', 'doc.move', 'doc.delete', 'scan.start', 'undo'],
  states: ['empty'],
  flutter: { widget: 'TaktDocumentMeta', propMap: { showActions: 'showActions', showLinks: 'showLinks' }, events: { 'link.contract': 'onOpenContract', 'link.warranty': 'onOpenWarranty', 'doc.share': 'onShare', 'doc.delete': 'onDelete' } },
  css: `
  .tk-dok-md { display:flex; flex-direction:column; gap:var(--tk-space-4); min-width:0; } .tk-dok-md__id { display:flex; align-items:center; gap:12px; min-width:0; } .tk-dok-md__id h2 { margin:0; font-size:var(--tk-fs-xl); line-height:1.2; overflow-wrap:anywhere; }
  .tk-dok-md__exp { display:flex; align-items:center; gap:12px; padding:var(--tk-space-3) var(--tk-space-4); border-radius:var(--tk-radius-lg); border:1px solid var(--tk-c-border); background:var(--tk-c-surface2); }`,
  example: { props: {}, data: pick('documents', 'folders', 'contracts', 'warranties') },
  render: function DokMeta({ props, data, setData, ctx }) {
    const docs = recentFirst(data.documents), d = docs.find((x) => x.id === ctx.ui.selectedId) || docs[0], today = todayOf(ctx), folders = arr(data.folders);
    if (!d) return html`<${Card}><${EmptyState} icon="file-text" title="Kein Dokument gewählt" text="Wähle ein Dokument in der Liste oder scanne ein neues." action=${html`<${Button} variant="primary" icon="scan" onClick=${() => ctx.emit('scan.start')}>Dokument scannen<//>`} /><//>`;
    const folder = folderOf(folders, d.folderId), st = documentState(d, today);
    const contract = arr(data.contracts).find((c) => c.id === d.contractId), war = arr(data.warranties).find((w) => w.id === d.warrantyId || w.documentId === d.id);
    const links = [contract && { k: 'contract', ev: 'link.contract', label: contract.name, sub: 'Vertrag', icon: 'scroll-text', id: contract.id, to: 'documents.contract' }, war && { k: 'warranty', ev: 'link.warranty', label: war.title, sub: 'Garantie', icon: 'badge-check', id: war.id, to: 'documents.warranties' },
      ...arr(d.links).map((l) => (l.kind === 'event' ? { k: 'event', ev: 'link.event', label: 'Termin bei der Kanzlei Brandt', sub: 'Kalender', icon: 'calendar', id: l.id, to: 'calendar.event' } : null))].filter(Boolean);
    const move = (id) => { setData('documents', (l) => arr(l).map((x) => (x.id === d.id ? { ...x, folderId: id } : x))); ctx.emit('doc.move', { id: d.id, folderId: id }); ctx.toast(`Verschoben nach „${folderOf(folders, id)?.name}“`); };
    const remove = () => { const copy = d; setData('documents', (l) => arr(l).filter((x) => x.id !== d.id)); ctx.emit('doc.delete', { id: d.id });
      pushUndo(ctx, { text: `„${d.title}“ gelöscht. 30 Tage im Papierkorb.`, restore: () => setData('documents', (l) => [copy, ...arr(l)]) }); };
    const expStage = st.days != null && st.days >= 0 ? stageOf(st.days) : null;
    return html`<div class="tk-dok-md">
      <div class="tk-dok-md__id"><${IconTile} icon=${typeIcon(d.type)} tone=${folder?.tone || 'accent'} size=${44} /><div class="tk-dok-main"><h2>${d.title}</h2><span class="tk-dok-sub">${d.type}${d.sensitive ? ' · sensibel' : ''}</span></div></div>
      ${d.validUntil && html`<div class="tk-dok-md__exp" role="status"><${Icon} name="hourglass" size=${20} /><div class="tk-dok-main"><b>${st.status === 'abgelaufen' ? 'Abgelaufen' : `Gültig bis ${dateLabel(d.validUntil, today)}`}</b><span class="tk-dok-sub">${st.status === 'abgelaufen' ? `seit ${-st.days} Tagen` : `${inDays(st.days)} · Erinnerung 30, 14 und 3 Tage vorher`}</span></div>${expStage && html`<${Badge} tone=${expStage.tone}>${expStage.label}<//>`}</div>`}
      <${Card} title="Details" icon="info"><dl class="tk-dok-kv"><dt>Ordner</dt><dd>${folder?.name || '–'}</dd><dt>Datum</dt><dd>${fmtDate(d.date)}</dd><dt>Format</dt><dd>${d.format}, ${d.size}, ${plural(d.pages, 'Seite', 'Seiten')}</dd><dt>Quelle</dt><dd>${d.source}</dd>
        <dt>Tags</dt><dd>${arr(d.tags).length ? arr(d.tags).join(', ') : '–'}</dd><dt>Aufbewahrung</dt><dd>${folder?.retention || '–'}</dd></dl>${d.note && html`<p class="tk-dok-sub" style="margin-top:var(--tk-space-3)">${d.note}</p>`}<//>
      ${props.showLinks && html`<${Card} flush title="Verknüpft" icon="link-2">${links.length ? links.map((l) => html`<button type="button" class="tk-dok-row" onClick=${() => ctx.emit(l.ev, { id: l.id })}><${IconTile} icon=${l.icon} tone="info" /><span class="tk-dok-main"><b>${l.label}</b><span class="tk-dok-sub">${l.sub}</span></span><${Icon} name="chevron-right" size=${16} /></button>`)
        : html`<${EmptyState} icon="link-2" title="Nichts verknüpft" text="Verträge, Garantien und Belege lassen sich mit diesem Dokument verbinden." />`}<//>`}
      ${props.showActions && html`<div class="tk-dok-btns"><div style="min-width:180px;flex:1 1 180px"><${Select} value=${d.folderId} onChange=${move} options=${folders.map((f) => ({ value: f.id, label: f.name }))} aria-label="Ordner wechseln" /></div>
        <${Button} icon="share-2" onClick=${() => { ctx.emit('doc.share', { id: d.id }); ctx.toast('Teilen ist in der Demo simuliert'); }}>Teilen<//><${Button} variant="ghost" icon="trash-2" onClick=${remove}>Löschen<//></div>`}</div>`;
  },
};
export default dokMeta;
