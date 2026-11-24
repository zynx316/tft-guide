// Dokumente: Garantien – Gewährleistung (gesetzlich) und Herstellergarantie mit Ablauf, Fortschritt und Verknüpfung zum Kaufbeleg.
import { html } from '../../../lib/html.js';
import { Card, Button, Badge, Icon, EmptyState, Chip } from '../../ui.js';
import { money } from '../../helpers.js';
import { dayDiff } from '../../../lib/date.js';
import { fmtDate } from '../../../lib/format.js';
import { warrantyState } from './_deadlines.js';
import { arr, todayOf, dateLabel, inDays, plural, IconTile, StageBadge } from './_docs.js';
import { pick } from './_example.js';

const FILTERS = ['Alle', 'Aktiv', 'Läuft ab', 'Abgelaufen'];
const ICON = { Geschäft: 'briefcase', Haushalt: 'home', Privat: 'package' };
const STATUS_TONE = { aktiv: 'success', 'läuft ab': 'warning', abgelaufen: 'neutral' };

export const dokWarranties = {
  id: 'dok-warranties',
  name: 'Garantien',
  category: 'Dokumente',
  description: 'Gekaufte Dinge mit Ende der Gewährleistung und der Herstellergarantie, Fortschritt und Link zum Kaufbeleg. „Läuft ab“ gilt ab 30 Tagen vor dem Ende. Filter nach Zustand; Preise sind im Privatmodus maskiert. Hinweis zur gesetzlichen Gewährleistung ohne Rechtsberatung.',
  version: '1.1',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Garantien' },
    { name: 'style', label: 'Darstellung', type: 'select', options: ['rows', 'cards'], default: 'rows' },
    { name: 'showPrice', label: 'Preis zeigen', type: 'boolean', default: true },
  ],
  data: [
    { slot: 'warranties', label: 'Garantien', default: 'warranties', shape: '{id,title,purchaseDate,price,legalEnd,makerEnd?,documentId?,store,category}[]', required: true },
    { slot: 'documents', label: 'Dokumente (Kaufbelege)', default: 'documents', shape: '{id,title}[]', required: false },
  ],
  events: ['receipt.open', 'scan.start'],
  states: ['empty'],
  flutter: { widget: 'TaktWarrantyList', propMap: { title: 'title', style: 'variant', showPrice: 'showPrice' }, events: { 'receipt.open': 'onOpenReceipt' } },
  css: `
  .tk-dok-wlist { display:flex; flex-direction:column; } .tk-dok-wr { display:flex; flex-direction:column; gap:10px; padding:var(--tk-space-4); border-bottom:1px solid var(--tk-c-border); min-width:0; } .tk-dok-wr:last-child { border-bottom:0; }
  .tk-dok-wr[aria-current="true"] { background:var(--tk-c-accent-soft); } .tk-dok-wr__head { display:flex; align-items:center; gap:12px; min-width:0; flex-wrap:wrap; }
  .tk-dok-wgrid { display:grid; grid-template-columns:repeat(auto-fill, minmax(min(100%, 290px), 1fr)); gap:var(--tk-space-3); padding:var(--tk-space-3); }
  .tk-dok-wgrid .tk-dok-wr { border:1px solid var(--tk-c-border); border-radius:var(--tk-radius-lg); background:var(--tk-c-surface); }
  .tk-dok-wr__ends { display:flex; flex-wrap:wrap; gap:4px var(--tk-space-4); }`,
  example: { props: { style: 'rows' }, data: pick('warranties', 'documents') },
  render: function DokWarranties({ props, data, ctx }) {
    const today = todayOf(ctx), f = ctx.ui.wfilter || 'Alle';
    const items = arr(data.warranties).map((w) => ({ w, s: warrantyState(w, today) })).sort((a, b) => (a.s.status === 'abgelaufen') - (b.s.status === 'abgelaufen') || (a.s.days ?? 0) - (b.s.days ?? 0));
    const shown = items.filter(({ s }) => f === 'Alle' || s.status === f.toLowerCase());
    if (!items.length) return html`<${Card} title=${props.title}><${EmptyState} icon="badge-check" title="Noch keine Garantien" text="Lege einen Kaufbeleg ab. TAKT merkt sich das Ende von Gewährleistung und Garantie und erinnert dich rechtzeitig." action=${html`<${Button} variant="primary" icon="scan" onClick=${() => ctx.emit('scan.start')}>Kaufbeleg scannen<//>`} /><//>`;
    const progress = (w, s) => { const end = s.last?.date, all = end ? dayDiff(w.purchaseDate, end) : 0; return all > 0 ? Math.min(1, Math.max(0, dayDiff(w.purchaseDate, today) / all)) : 1; };
    const item = ({ w, s }) => { const doc = arr(data.documents).find((x) => x.id === w.documentId), p = progress(w, s);
      return html`<article class="tk-dok-wr" aria-current=${ctx.ui.selectedId === w.id ? 'true' : 'false'} style=${`--tc:var(--tk-c-${s.status === 'abgelaufen' ? 'text-subtle' : s.stage && s.stage.tone !== 'neutral' ? s.stage.tone : 'success'})`}>
        <div class="tk-dok-wr__head"><${IconTile} icon=${ICON[w.category] || 'package'} tone=${w.business ? 1 : 3} /><div class="tk-dok-main"><b>${w.title}</b><span class="tk-dok-sub">${w.store} · gekauft ${dateLabel(w.purchaseDate, today)}${props.showPrice && w.price ? ` · ${money(ctx, w.price)}` : ''}</span></div>
          ${s.status === 'abgelaufen' ? html`<${Badge}>abgelaufen<//>` : s.stage && s.days <= 30 ? html`<${StageBadge} stage=${s.stage} />` : html`<${Badge} tone=${STATUS_TONE[s.status]}>${s.status}<//>`}</div>
        <div class="tk-dok-bar" role="progressbar" aria-label="Zeit seit dem Kauf" aria-valuenow=${Math.round(p * 100)} aria-valuemin="0" aria-valuemax="100"><i style=${`width:${p * 100}%`}></i></div>
        <div class="tk-dok-wr__ends tk-dok-sub">${s.ends.map((e) => html`<span>${e.label}: ${e.days < 0 ? `seit ${fmtDate(e.date)}` : `bis ${dateLabel(e.date, today)}`}${e.days >= 0 ? ` (${inDays(e.days)})` : ''}</span>`)}</div>
        <div class="tk-dok-btns">${doc ? html`<${Button} size="sm" icon="receipt" onClick=${() => { ctx.setUi('selectedId', w.id); ctx.emit('receipt.open', { id: doc.id }); }}>Kaufbeleg öffnen<//>` : html`<${Button} size="sm" icon="scan" onClick=${() => ctx.emit('scan.start')}>Kaufbeleg hinzufügen<//>`}</div></article>`; };
    const filters = html`<div class="tk-dok-ctfilter" role="group" aria-label="Filter" style="padding:var(--tk-space-2) var(--tk-space-4)">${FILTERS.map((x) => html`<${Chip} active=${f === x} onClick=${() => ctx.setUi('wfilter', x)}>${x}<//>`)}</div>`;
    const body = !shown.length ? html`<${EmptyState} icon="filter" title="Keine Garantien in diesem Filter" text="Wähle „Alle“, um alle Garantien zu sehen." />` : props.style === 'cards' ? html`<div class="tk-dok-wgrid">${shown.map(item)}</div>` : html`<div class="tk-dok-wlist">${shown.map(item)}</div>`;
    return html`<${Card} flush title=${props.title} icon="badge-check" actions=${html`<${Badge}>${plural(items.length, 'Eintrag', 'Einträge')}<//>`}>${filters}${body}<//>`;
  },
};
export default dokWarranties;
