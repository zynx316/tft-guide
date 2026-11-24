// Dokumente: Ablegen – Art wählen, Ordner vorschlagen, Scanner öffnen (Picture to Text) oder eine Datei ablegen (Demo legt ein Dokument an).
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Card, Button, Icon, Select, EmptyState } from '../../ui.js';
import { fmtDate, fmtTime } from '../../../lib/format.js';
import { toIsoDay } from '../../../lib/date.js';
import { warrantyEnd } from './_deadlines.js';
import { arr, typeIcon, folderOf, IconTile } from './_docs.js';
import { pick } from './_example.js';

const KINDS = [
  { id: 'Vertrag', type: 'Vertrag', folder: 'f-vertraege', hint: 'Kommt in den Ordner Verträge. Frist und Laufzeit stehen in der Dokumentansicht' },
  { id: 'Kaufbeleg', type: 'Beleg', folder: 'f-garantie', hint: 'Legt auch eine Garantie an (24 Monate ab Kaufdatum, änderbar)', warranty: true },
  { id: 'Rechnung', type: 'Rechnung', folder: 'f-steuer', hint: 'Für den Steuerordner' },
  { id: 'Bescheid', type: 'Bescheid', folder: 'f-steuer', hint: 'Vom Amt oder von der Versicherung' },
  { id: 'Ausweis', type: 'Ausweis', folder: 'f-ausweise', hint: 'Wird verdeckt angezeigt. Das Ablaufdatum ergänzt du in der Dokumentansicht', sensitive: true },
];

export const dokScanIn = {
  id: 'dok-scan-in',
  name: 'Dokument ablegen',
  category: 'Dokumente',
  description: 'Neues Dokument ablegen: Art wählen (Vertrag, Kaufbeleg, Rechnung, Bescheid, Ausweis), passenden Ordner vorschlagen und den Scanner öffnen (Picture to Text). „Datei ablegen“ legt in der Demo ein Dokument in der gewählten Art und dem Ordner an.',
  version: '1.1',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Dokument ablegen' },
    { name: 'allowFile', label: 'Datei ablegen (Demo)', type: 'boolean', default: true },
  ],
  data: [
    { slot: 'documents', label: 'Dokumente', default: 'documents', shape: '{id,title,folderId,type,date,added}[]', required: true },
    { slot: 'folders', label: 'Ordner', default: 'folders', shape: '{id,name,icon,tone}[]', required: true },
    { slot: 'warranties', label: 'Garantien (für Kaufbelege)', default: 'warranties', shape: '{id,title,purchaseDate,legalEnd,documentId}[]', required: false },
  ],
  events: ['scan.open', 'doc.added', 'doc.open', 'doc.warranty', 'scan.kind'],
  states: ['empty'],
  flutter: { widget: 'TaktDocumentIntake', propMap: { title: 'title', allowFile: 'allowFilePicker' }, events: { 'scan.open': 'onOpenScanner', 'doc.added': 'onAdded', 'doc.open': 'onOpen', 'doc.warranty': 'onOpenWarranty' } },
  css: `
  .tk-dok-in { display:flex; flex-direction:column; gap:var(--tk-space-4); min-width:0; } .tk-dok-in__kinds { display:grid; grid-template-columns:repeat(auto-fill, minmax(min(100%, 170px), 1fr)); gap:var(--tk-space-2); }
  .tk-dok-in__k { all:unset; box-sizing:border-box; display:flex; flex-direction:column; gap:8px; min-height:var(--tk-size-touch); padding:var(--tk-space-3); border-radius:var(--tk-radius-lg); border:1.5px solid var(--tk-c-border); background:var(--tk-c-surface); cursor:pointer; }
  .tk-dok-in__k[aria-pressed="true"] { border-color:var(--tk-c-accent); background:var(--tk-c-accent-soft); } .tk-dok-in__k:focus-visible { outline:2px solid var(--tk-c-focus); outline-offset:2px; }
  .tk-dok-in__k b { font-weight:var(--tk-fw-semibold); }`,
  example: { props: {}, data: pick('documents', 'folders', 'warranties') },
  render: function DokScanIn({ props, data, setData, ctx }) {
    const [kindId, setKind] = useState('Vertrag'), [folderId, setFolder] = useState(''), [last, setLast] = useState(null);
    const kind = KINDS.find((k) => k.id === kindId), folders = arr(data.folders), fid = folderId || kind.folder;
    const pickKind = (k) => { setKind(k.id); setFolder(''); ctx.emit('scan.kind', { kind: k.id }); };
    const add = () => {
      const now = ctx.now(), day = toIsoDay(now), warrantyId = kind.warranty ? ctx.newId('w') : null;
      const doc = { id: ctx.newId('doc'), title: `${kind.id} vom ${fmtDate(day)}`, folderId: fid, type: kind.type, date: day, added: `${day}T${fmtTime(now)}:00`, pages: 1, format: 'PDF', size: '–', source: 'Datei', tags: kind.warranty ? ['neu', 'Garantie'] : ['neu'], excerpt: 'Aus einer Datei abgelegt (Demo).', ...(kind.sensitive ? { sensitive: true } : {}), ...(warrantyId ? { warrantyId } : {}) };
      setData('documents', (l) => [doc, ...arr(l)]);
      if (warrantyId) setData('warranties', (l) => [{ id: warrantyId, title: doc.title, purchaseDate: day, price: 0, legalMonths: 24, makerMonths: 0, legalEnd: warrantyEnd(day, 24), makerEnd: null, documentId: doc.id, store: 'Händler ergänzen', category: 'Privat' }, ...arr(l)]);
      setLast({ ...doc, warranty: !!warrantyId }); ctx.emit('doc.added', { id: doc.id }); ctx.toast(`Abgelegt in „${folderOf(folders, fid)?.name}“${warrantyId ? ', Garantie angelegt' : ''}`);
    };
    if (!folders.length) return html`<${Card}><${EmptyState} icon="folder" title="Noch keine Ordner" text="Ordner legt TAKT beim ersten Dokument an." /><//>`;
    return html`<div class="tk-dok-in"><${Card} title=${props.title} icon="scan">
      <div class="tk-dok-in__kinds" role="group" aria-label="Art des Dokuments">${KINDS.map((k) => html`<button type="button" class="tk-dok-in__k" aria-pressed=${k.id === kindId ? 'true' : 'false'} onClick=${() => pickKind(k)}><${IconTile} icon=${typeIcon(k.type)} tone=${folderOf(folders, k.folder)?.tone || 'accent'} /><b>${k.id}</b><span class="tk-dok-sub">${k.hint}</span></button>`)}</div>
      <div style="margin:var(--tk-space-4) 0 var(--tk-space-2)"><span class="tk-label">Ordner</span></div><${Select} value=${fid} onChange=${setFolder} options=${folders.map((f) => ({ value: f.id, label: f.name }))} aria-label="Ordner" />
      <div class="tk-dok-btns" style="margin-top:var(--tk-space-4)"><${Button} variant="primary" icon="scan" onClick=${() => ctx.emit('scan.open', { id: kind.id })}>Scanner öffnen<//>${props.allowFile && html`<${Button} icon="upload" onClick=${add}>Datei ablegen<//>`}</div>
      <p class="tk-dok-fine" style="margin-top:var(--tk-space-3);display:flex;gap:6px;align-items:flex-start"><${Icon} name="lock" size=${12} /> Die Texterkennung läuft auf deinem Gerät, nichts wird hochgeladen.</p><//>
      ${last && html`<${Card} title="Gerade abgelegt" icon="check-circle-2" flush><button type="button" class="tk-dok-row" onClick=${() => { ctx.setUi('selectedId', last.id); ctx.emit('doc.open', { id: last.id }); }}><${IconTile} icon=${typeIcon(last.type)} tone="success" /><span class="tk-dok-main"><b>${last.title}</b><span class="tk-dok-sub">${folderOf(folders, last.folderId)?.name} · jetzt${last.warranty ? ' · Garantie 24 Monate' : ''}${last.sensitive ? ' · verdeckt' : ''}</span></span><${Icon} name="chevron-right" size=${16} /></button><div class="tk-dok-btns" style="padding:var(--tk-space-3) var(--tk-space-4)"><${Button} size="sm" icon="file-text" onClick=${() => { ctx.setUi('selectedId', last.id); ctx.emit('doc.open', { id: last.id }); }}>Dokument öffnen<//>${last.warranty && html`<${Button} size="sm" icon="badge-check" onClick=${() => { ctx.setUi('selectedId', last.warrantyId); ctx.emit('doc.warranty', { id: last.warrantyId }); }}>Garantie ansehen<//>`}</div><//>`}</div>`;
  },
};
export default dokScanIn;
