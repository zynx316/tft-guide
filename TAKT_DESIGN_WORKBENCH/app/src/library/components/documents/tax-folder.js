// Dokumente: Steuerordner – Belege, Geschäftsbuchungen, Abos und Bescheide nach Kategorien (nur Verweise auf die Quellen),
// Stand „bereit/offen“ und Export für die Steuerberatung als Simulation. Keine Steuerberatung.
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Card, Button, Badge, Icon, EmptyState, Check, Chip, Ring } from '../../ui.js';
import { money } from '../../helpers.js';
import { fmtDate, fmtTime } from '../../../lib/format.js';
import { toIsoDay } from '../../../lib/date.js';
import { taxStats } from './_deadlines.js';
import { arr, obj, todayOf, dateLabel, inDays, plural, daysTo, IconTile } from './_docs.js';
import { pick } from './_example.js';

const KIND_ICON = { tx: 'banknote', receipt: 'receipt', doc: 'file-text', sub: 'repeat', missing: 'circle-dashed' };

export const dokTaxFolder = {
  id: 'dok-tax-folder',
  name: 'Steuerordner',
  category: 'Dokumente',
  description: 'Der Ordner für die Steuerberatung: Einnahmen, Betriebsausgaben, Anschaffungen, Versicherungen und Bescheide als Verweise auf Belege, Buchungen, Abos und Dokumente. Zeigt, was bereit und was offen ist, und simuliert den Export (Sammelmappe, ZIP, Liste). Keine Steuerberatung.',
  version: '1.1',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Steuerordner' },
    { name: 'style', label: 'Darstellung', type: 'select', options: ['categories', 'overview'], default: 'categories' },
    { name: 'showExport', label: 'Export für die Steuerberatung', type: 'boolean', default: true },
  ],
  data: [
    { slot: 'tax', label: 'Steuerordner', default: 'tax', shape: '{year,due,advisor,formats[],lastExport?,categories[{id,name,icon,refs[]}]}', required: true },
    { slot: 'documents', label: 'Dokumente', default: 'documents', shape: '{id,title,date,type}[]', required: false },
    { slot: 'receipts', label: 'Belege (Bildtext-Erkennung)', default: 'receipts', shape: '{id,merchant,date,total,status}[]', required: false },
    { slot: 'transactions', label: 'Buchungen (Finanzen)', default: 'transactions', shape: '{id,title,date,amount,type}[]', required: false },
    { slot: 'contracts', label: 'Verträge und Abos', default: 'contracts', shape: '{subscriptionId,name,amount}[]', required: false },
    { slot: 'events', label: 'Termine', default: 'events', shape: '{id,title,start}[]', required: false },
  ],
  events: ['tax.item.open', 'tax.export', 'advisor.open', 'scan.start'],
  states: ['empty'],
  flutter: { widget: 'TaktTaxFolder', propMap: { title: 'title', style: 'variant', showExport: 'showExport' }, events: { 'tax.item.open': 'onOpenItem', 'tax.export': 'onExport', 'advisor.open': 'onOpenAppointment' } },
  css: `
  .tk-dok-tx { display:flex; flex-direction:column; gap:var(--tk-space-4); min-width:0; }
  .tk-dok-tx__sum { display:flex; align-items:center; gap:var(--tk-space-4); flex-wrap:wrap; } .tk-dok-tx__sum .tk-dok-main { min-width:200px; display:flex; flex-direction:column; align-items:flex-start; gap:2px; }
  .tk-dok-tx .tk-dok-chips { display:flex; flex-wrap:wrap; gap:var(--tk-space-2); }
  .tk-dok-tx__cat { all:unset; box-sizing:border-box; display:flex; align-items:center; gap:12px; width:100%; min-height:var(--tk-size-touch); padding:12px var(--tk-space-4); cursor:pointer; border-bottom:1px solid var(--tk-c-border); }
  .tk-dok-tx__cat:hover { background:var(--tk-c-surface2); } .tk-dok-tx__cat:focus-visible { outline:2px solid var(--tk-c-focus); outline-offset:-2px; }
  .tk-dok-tx__item { padding-left:calc(var(--tk-space-4) + 20px); background:var(--tk-c-surface2); } .tk-dok-tx__tiles { display:grid; grid-template-columns:repeat(auto-fill, minmax(min(100%, 150px), 1fr)); gap:var(--tk-space-3); }
  .tk-dok-tx__exp { display:flex; flex-direction:column; gap:var(--tk-space-3); } .tk-dok-tx__chk { display:flex; align-items:center; gap:10px; min-height:var(--tk-size-touch); }`,
  example: { props: { style: 'categories' }, data: { ...pick('documents', 'receipts', 'transactions', 'contracts'), tax: pick('tax').tax, events: [{ id: 'e17', title: 'Steuerberater', start: '2026-11-27T15:00:00' }] } },
  render: function DokTaxFolder({ props, data, setData, ctx }) {
    const tax = obj(data.tax), today = todayOf(ctx);
    const [openCat, setOpenCat] = useState(() => new Set(['tc-betrieb'])), [picked, setPicked] = useState(null), [format, setFormat] = useState('');
    const src = { transactions: data.transactions, receipts: data.receipts, documents: data.documents, subscriptions: arr(data.contracts).map((c) => ({ id: c.subscriptionId, name: c.name, amount: c.amount })) };
    const st = taxStats(tax, src), formats = arr(tax.formats), fmtSel = format || formats[0];
    const ev = arr(data.events).find((e) => e.id === tax.advisor?.eventId), sel = picked || new Set(st.categories.filter((c) => c.items.length).map((c) => c.id));
    if (!st.total) return html`<${Card} title=${props.title} icon="landmark"><${EmptyState} icon="landmark" title="Noch nichts im Steuerordner" text="Lege Belege und Bescheide ab. TAKT sortiert sie für die Steuerberatung in Kategorien." action=${html`<${Button} variant="primary" icon="scan" onClick=${() => ctx.emit('scan.start')}>Beleg scannen<//>`} /><//>`;
    const toggle = (id) => setOpenCat((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
    const item = (i) => html`<button type="button" class="tk-dok-row tk-dok-tx__item" onClick=${() => ctx.emit('tax.item.open', { id: i.id, to: i.to })}>
      <${Icon} name=${KIND_ICON[i.kind]} size=${17} /><span class="tk-dok-main"><b>${i.title}</b><span class="tk-dok-sub">${i.note}${i.date ? ` · ${fmtDate(i.date)}` : ''}${i.amount != null ? ` · ${money(ctx, i.amount)}${i.per ? ` pro ${i.per}` : ''}` : ''}</span></span>
      ${i.state === 'ok' ? html`<${Badge} tone="success" icon="check">bereit<//>` : html`<${Badge} tone="warning" icon="circle-dashed">offen<//>`}</button>`;
    const cat = (c) => { const open = openCat.has(c.id); return html`<div><button type="button" class="tk-dok-tx__cat" aria-expanded=${open ? 'true' : 'false'} onClick=${() => toggle(c.id)}><${IconTile} icon=${c.icon} tone="accent" />
      <span class="tk-dok-main"><b>${c.name}</b><span class="tk-dok-sub">${c.hint}</span></span><span class="tk-dok-end"><span class="tk-dok-sub">${plural(c.items.length, 'Eintrag', 'Einträge')}</span>${c.open > 0 && html`<${Badge} tone="warning">${c.open} offen<//>`}</span><${Icon} name=${open ? 'chevron-up' : 'chevron-down'} size=${16} /></button>
      ${open && (c.items.length ? c.items.map(item) : html`<div class="tk-dok-row tk-dok-tx__item" style="cursor:default"><span class="tk-dok-sub">Noch nichts in dieser Kategorie. Scanne einen Beleg oder verschiebe ein Dokument hierher.</span></div>`)}</div>`; };
    const run = () => {
      const chosen = st.categories.filter((c) => sel.has(c.id)), files = chosen.reduce((n, c) => n + c.items.filter((i) => i.state === 'ok').length, 0), open = chosen.reduce((n, c) => n + c.open, 0), now = ctx.now();
      setData('tax', (t) => ({ ...obj(t), lastExport: { format: fmtSel, files, day: toIsoDay(now), time: fmtTime(now) } })); ctx.emit('tax.export', { files, format: fmtSel });
      ctx.openDialog({ title: 'Export simuliert', body: (close) => html`<div class="tk-dok-col"><p><b>${plural(files, 'Datei', 'Dateien')}</b> als ${fmtSel} für ${plural(chosen.length, 'Kategorie', 'Kategorien')}, mit Inhaltsverzeichnis.</p>
        ${open > 0 && html`<p class="tk-dok-sub">${plural(open, 'Eintrag ist', 'Einträge sind')} noch offen und ${open === 1 ? 'fehlt' : 'fehlen'} in der Mappe.</p>`}<p class="tk-dok-fine">Simulation: Es wurde nichts erzeugt, gespeichert oder gesendet. Keine Steuerberatung.</p><${Button} variant="primary" onClick=${close}>Verstanden<//></div>` });
    };
    const last = obj(tax.lastExport);
    const head = html`<${Card}><div class="tk-dok-tx__sum"><${Ring} value=${st.ok} max=${Math.max(1, st.total)} size=${72} stroke=${9} tone=${st.open ? 'warning' : 'success'} label=${`${st.ok} von ${st.total} bereit`}><b class="tk-num">${st.ok}/${st.total}</b><//>
      <div class="tk-dok-main"><b>${st.open ? plural(st.open, 'Eintrag ist', 'Einträge sind') + ' noch offen' : 'Alles bereit'}</b><span class="tk-dok-sub">Unterlagen bis ${dateLabel(tax.due, today)} (${inDays(daysTo(ctx, tax.due))})</span>
        ${ev && html`<button type="button" class="tk-btn tk-btn--ghost tk-btn--sm" style="padding:0" onClick=${() => ctx.emit('advisor.open', { id: ev.id, to: 'calendar.event' })}><${Icon} name="calendar" size=${14} /> ${tax.advisor.company}: ${fmtDate(ev.start, { style: 'weekday' })}, ${fmtTime(ev.start)} Uhr</button>`}</div></div><//>`;
    const exportCard = props.showExport && html`<${Card} title="Export für die Steuerberatung" icon="share-2"><div class="tk-dok-tx__exp"><div class="tk-dok-chips" role="group" aria-label="Format">${formats.map((f) => html`<${Chip} active=${f === fmtSel} onClick=${() => setFormat(f)}>${f}<//>`)}</div>
      <div role="group" aria-label="Kategorien">${st.categories.map((c) => html`<div class="tk-dok-tx__chk"><${Check} checked=${sel.has(c.id)} onChange=${(on) => setPicked(() => { const n = new Set(sel); on ? n.add(c.id) : n.delete(c.id); return n; })} label=${c.name} /><span>${c.name}</span><span class="tk-dok-fine">${c.items.length}</span></div>`)}</div>
      <${Button} variant="primary" icon="file-down" disabled=${!sel.size} onClick=${run}>Export simulieren<//>${last.files != null && html`<p class="tk-dok-fine">Zuletzt simuliert: ${last.files} Dateien als ${last.format}, ${fmtDate(last.day, { style: 'weekday' })} ${last.time} Uhr.</p>`}</div><//>`;
    const list = html`<${Card} flush title=${props.title} icon="landmark">${st.categories.map(cat)}<//>`;
    if (props.style === 'overview') return html`<div class="tk-dok-tx">${head}<div class="tk-dok-tx__tiles">${st.categories.map((c) => html`<button type="button" class="tk-dok-tile" onClick=${() => toggle(c.id)} aria-expanded=${openCat.has(c.id) ? 'true' : 'false'}><${IconTile} icon=${c.icon} tone="accent" size=${44} /><b>${c.name}</b><span class="tk-dok-sub">${plural(c.items.length, 'Eintrag', 'Einträge')}${c.open ? `, ${c.open} offen` : ''}</span></button>`)}</div>${st.categories.filter((c) => openCat.has(c.id)).map((c) => html`<${Card} flush title=${c.name} icon=${c.icon}>${c.items.length ? c.items.map(item) : html`<${EmptyState} icon="folder-open" title="Noch nichts hier" text="Scanne einen Beleg, dann erscheint er in dieser Kategorie." />`}<//>`)}${exportCard}</div>`;
    return html`<div class="tk-dok-tx">${head}${list}${exportCard}</div>`;
  },
};
export default dokTaxFolder;
