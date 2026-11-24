// Dokumente: Fristen – Kündigungsfristen, Garantie-Enden, Ablauf von Ausweisen und Steuerordner, gestaffelt in 30/14/3 Tage.
// Stile: Streifen (Karten zum Wischen), Zeilen (dicht) und „Nächste Frist“ (eine Hauptaktion plus Rest).
import { html } from '../../../lib/html.js';
import { Card, Button, Badge, Icon, EmptyState, toneColor } from '../../ui.js';
import { money } from '../../helpers.js';
import { STAGES, countByStage, KIND_ICON } from './_deadlines.js';
import { DOK_CSS, arr, deadlinesOf, dateLabel, inDays, todayOf, plural, IconTile, StageBadge, DaysCount } from './_docs.js';
import { openCancelDraft } from './_cancel.js';
import { pick } from './_example.js';

const PRIMARY = { contract: ['Kündigung vorbereiten', 'send'], warranty: ['Garantie ansehen', 'badge-check'], document: ['Dokument öffnen', 'file-text'], tax: ['Steuerordner öffnen', 'landmark'] };

export const dokDeadlines = {
  id: 'dok-deadlines',
  name: 'Fristen',
  category: 'Dokumente',
  description: 'Alle anstehenden Fristen aus Verträgen, Garantien, Ausweisen und Steuerordner, nach Dringlichkeit gestaffelt (bis 3, 14 und 30 Tage). Als Streifen, dichte Zeilen oder „Nächste Frist“ mit einer Hauptaktion. Beträge sind im Privatmodus maskiert.',
  version: '1.1',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Fristen' },
    { name: 'style', label: 'Darstellung', type: 'select', options: ['strip', 'rows', 'next'], default: 'strip' },
    { name: 'limit', label: 'Max. Einträge (0 = alle)', type: 'number', default: 0 },
    { name: 'horizon', label: 'Horizont in Tagen', type: 'number', default: 90 },
    { name: 'showStages', label: 'Stufen-Übersicht', type: 'boolean', default: true },
    { name: 'showAmount', label: 'Kosten zeigen', type: 'boolean', default: true },
  ],
  data: [
    { slot: 'contracts', label: 'Verträge (abgeleitet aus Finanzen)', default: 'contracts', shape: '{id,name,cancelBy?,endsOn?,amount,interval,icon}[]', required: true },
    { slot: 'warranties', label: 'Garantien', default: 'warranties', shape: '{id,title,legalEnd,makerEnd?}[]', required: false },
    { slot: 'documents', label: 'Dokumente', default: 'documents', shape: '{id,title,validUntil?,contractId?}[]', required: false },
    { slot: 'tax', label: 'Steuerordner', default: 'tax', shape: '{year,due,categories[]}', required: false },
    { slot: 'receipts', label: 'Belege (Bildtext-Erkennung)', default: 'receipts', shape: '{id,merchant,status}[]', required: false },
    { slot: 'transactions', label: 'Buchungen', default: 'transactions', shape: '{id,title,type}[]', required: false },
  ],
  events: ['deadline.contract', 'deadline.warranty', 'deadline.document', 'deadline.tax', 'scan.start', 'contract.cancel'],
  states: ['empty'],
  flutter: { widget: 'TaktDeadlineStrip', propMap: { title: 'title', style: 'variant', limit: 'maxItems', horizon: 'horizonDays', showStages: 'showStages', showAmount: 'showCost' }, events: { 'deadline.contract': 'onOpenContract', 'deadline.warranty': 'onOpenWarranty', 'deadline.document': 'onOpenDocument', 'deadline.tax': 'onOpenTaxFolder', 'contract.cancel': 'onPrepareCancel' } },
  css: `${DOK_CSS}
  .tk-dok-dot { display:inline-block; width:8px; height:8px; border-radius:50%; background:var(--tc); margin-right:6px; flex:none; }
  .tk-dok-stages { display:flex; flex-wrap:wrap; gap:var(--tk-space-2); margin-bottom:var(--tk-space-3); }
  .tk-dok-strip { display:flex; gap:var(--tk-space-3); overflow-x:auto; scroll-snap-type:x proximity; padding:2px 2px var(--tk-space-2); margin:0 calc(-1 * var(--tk-space-1)); }
  .tk-dok-strip { align-items:stretch; } .tk-dok-strip > * { flex:0 0 min(248px, 78%); scroll-snap-align:start; display:flex; min-width:0; }
  .tk-dok-strip .tk-dok-card { width:100%; flex:1 1 auto; }
  .tk-dok-dl__top .tk-dok-main { min-width:0; }
  .tk-dok-dl { gap:12px; } .tk-dok-dl__top { display:flex; align-items:center; gap:12px; } .tk-dok-dl__title { font-weight:var(--tk-fw-semibold); overflow-wrap:anywhere; }
  .tk-dok-hero { display:flex; flex-direction:column; gap:var(--tk-space-3); padding:var(--tk-space-5); border-radius:var(--tk-radius-xl); border:1px solid color-mix(in srgb, var(--tc) 40%, var(--tk-c-border)); background:color-mix(in srgb, var(--tc) 8%, var(--tk-c-surface)); }
  .tk-dok-hero__head { display:flex; flex-wrap:wrap; align-items:center; gap:var(--tk-space-3) var(--tk-space-4); } .tk-dok-hero__title { font-size:var(--tk-fs-xl); font-weight:var(--tk-fw-semibold); line-height:var(--tk-lh-tight); overflow-wrap:anywhere; }
  .tk-dok-hero .tk-dok-days { min-width:calc(var(--tk-fs-2xl) * 3.2); min-height:calc(var(--tk-fs-2xl) * 3.2); } .tk-dok-hero .tk-dok-days b { font-size:var(--tk-fs-2xl); }
  .tk-dok-restlbl { margin:var(--tk-space-4) 0 var(--tk-space-1); }
  .tk-dok-note { display:flex; gap:8px; align-items:flex-start; margin-top:var(--tk-space-2); }`,
  example: { props: { style: 'strip' }, data: pick('contracts', 'warranties', 'documents', 'tax', 'receipts', 'transactions') },
  render: function DokDeadlines({ props, data, ctx }) {
    const all = deadlinesOf(data, ctx, props.horizon), list = props.limit > 0 ? all.slice(0, props.limit) : all;
    const noData = !arr(data.contracts).length && !arr(data.documents).length && !arr(data.warranties).length;
    const open = (d) => { ctx.setUi('selectedId', d.refId); ctx.emit(d.event, { id: d.refId }); };
    const cost = (d) => (props.showAmount && d.amount != null ? `${money(ctx, d.amount)} ${d.interval === 'monatlich' ? 'im Monat' : ''}`.trim() : '');
    const sub = (d) => `${d.label} ${dateLabel(d.date, todayOf(ctx))}${d.note ? ` · ${d.note}` : ''}`;
    if (!list.length) return html`<${Card} title=${props.title} icon="calendar-clock"><${EmptyState} icon=${noData ? 'folder-open' : 'calendar-check'} title=${noData ? 'Noch keine Fristen' : `Keine Fristen in den nächsten ${props.horizon} Tagen`}
      text=${noData ? 'Lege Verträge und Dokumente ab, dann erinnert TAKT dich 30, 14 und 3 Tage vorher.' : 'Sobald ein Vertrag, eine Garantie oder ein Ausweis bald abläuft, steht es hier.'}
      action=${noData && html`<${Button} variant="primary" icon="scan" onClick=${() => ctx.emit('scan.start')}>Dokument scannen<//>`} /><//>`;
    const counts = countByStage(all);
    const stages = props.showStages && html`<div class="tk-dok-stages" role="list" aria-label="Fristen nach Dringlichkeit">${STAGES.slice(0, 3).map((s) => html`<span role="listitem"><${Badge}><span class="tk-dok-dot" style=${`--tc:${counts[s.id] ? toneColor(s.tone) : 'var(--tk-c-text-subtle)'}`}></span>${s.label}: ${counts[s.id]}<//></span>`)}</div>`;
    const card = (d) => html`<button type="button" class="tk-dok-card tk-dok-dl" onClick=${() => open(d)} aria-label=${`${d.title}, ${d.label} ${dateLabel(d.date, todayOf(ctx))}, ${inDays(d.days)}`}>
      <span class="tk-dok-dl__top"><${DaysCount} days=${d.days} stage=${d.stage} /><span class="tk-dok-main"><${StageBadge} stage=${d.stage} /></span><${Icon} name=${d.kindIcon || KIND_ICON[d.kind]} size=${18} /></span>
      <span class="tk-dok-dl__title">${d.title}</span><span class="tk-dok-sub">${sub(d)}</span>${cost(d) && html`<span class="tk-dok-fine">${cost(d)}</span>`}</button>`;
    const row = (d) => html`<button type="button" class="tk-dok-row" onClick=${() => open(d)}>
      <${DaysCount} days=${d.days} stage=${d.stage} /><span class="tk-dok-main"><b>${d.title}</b><span class="tk-dok-sub">${sub(d)}</span></span>
      <span class="tk-dok-end"><${StageBadge} stage=${d.stage} />${cost(d) && html`<span class="tk-dok-fine">${cost(d)}</span>`}</span></button>`;
    if (props.style === 'rows') return html`<${Card} flush title=${props.title} icon="calendar-clock" actions=${html`<${Badge}>${all.length}<//>`}><div style="padding:0 var(--tk-space-4)">${stages}</div>${list.map(row)}<//>`;
    if (props.style === 'next') {
      const first = list[0], rest = list.slice(1), contract = first.kind === 'contract' && arr(data.contracts).find((c) => c.id === first.refId);
      const [label, icon] = PRIMARY[first.kind], go = () => (contract ? openCancelDraft(ctx, contract) : open(first));
      return html`<div class="tk-dok-col"><section class="tk-dok-hero" style=${`--tc:var(--tk-c-${first.stage.tone === 'neutral' ? 'accent' : first.stage.tone})`} aria-label="Nächste Frist">
        <div class="tk-dok-hero__head"><${DaysCount} days=${first.days} stage=${first.stage} /><div class="tk-dok-main"><span class="tk-label">Nächste Frist · ${inDays(first.days)}</span><div class="tk-dok-hero__title">${first.title}</div><div class="tk-dok-sub">${sub(first)}</div></div></div>
        <div class="tk-dok-btns"><${Button} variant="primary" icon=${icon} onClick=${go}>${label}<//>${contract && html`<${Button} onClick=${() => open(first)}>Vertrag ansehen<//>`}</div>
        ${cost(first) && html`<span class="tk-dok-fine">${cost(first)}</span>`}</section>
        ${rest.length > 0 && html`<${Card} flush title=${`Danach (${rest.length})`}>${rest.map(row)}<//>`}</div>`;
    }
    return html`<section aria-label=${props.title}><div class="tk-dok-sec"><h3>${props.title}</h3><span class="tk-dok-fine">${plural(all.length, 'Frist', 'Fristen')} in ${props.horizon} Tagen</span></div>${stages}
      <div class="tk-dok-strip" role="list">${list.map((d) => html`<div role="listitem" key=${d.id}>${card(d)}</div>`)}</div>
      <p class="tk-dok-fine tk-dok-note"><${Icon} name="bell" size=${13} />TAKT erinnert 30, 14 und 3 Tage vorher.</p></section>`;
  },
};
export default dokDeadlines;
