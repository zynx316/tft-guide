// Dokumente: Vertragsliste – Laufzeit, Kündigungsfrist (mit Stufe), Kosten (maskierbar), Erinnerung 30/14/3 und „Kündigung vorbereiten“.
// Verträge werden aus Finanzen abgeleitet; Kosten und Fristen sind dort Eigentum und hier nur zu lesen.
import { html } from '../../../lib/html.js';
import { Card, Button, Badge, Icon, EmptyState, Chip, Switch } from '../../ui.js';
import { money } from '../../helpers.js';
import { dayDiff } from '../../../lib/date.js';
import { stageOf } from './_deadlines.js';
import { arr, todayOf, dateLabel, plural, termProgress, IconTile, StageBadge } from './_docs.js';
import { openCancelDraft } from './_cancel.js';
import { pick } from './_example.js';

const FILTERS = ['Alle', 'Mit Frist', 'Privat', 'Geschäft'];
const noTemplate = (c) => (c.kind === 'Wohnen' ? 'Keine Vorlage: Miete kündigst du mit der Frist laut Mietvertrag.' : 'Keine Vorlage: Kündige mit der Frist laut Vertrag.');
const KIND_TONE = { Versicherung: 3, Mobilfunk: 1, Fitness: 5, Energie: 4, Wohnen: 2, Streaming: 6, Cloud: 6, Software: 1 };

export const dokContracts = {
  id: 'dok-contracts',
  name: 'Vertragsliste',
  category: 'Dokumente',
  description: 'Verträge und Abos mit Laufzeit, Kündigungsfrist und Stufe (30/14/3 Tage), Kosten (im Privatmodus maskiert) und Erinnerung. „Kündigung vorbereiten“ öffnet eine Textvorlage, nichts wird versendet. Als Tabelle oder als Karten mit Laufzeit-Balken.',
  version: '1.1',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Verträge und Abos' },
    { name: 'style', label: 'Darstellung', type: 'select', options: ['table', 'cards'], default: 'table' },
    { name: 'showCosts', label: 'Kosten zeigen', type: 'boolean', default: true },
    { name: 'filters', label: 'Filterchips', type: 'boolean', default: true },
  ],
  data: [{ slot: 'contracts', label: 'Verträge (abgeleitet aus Finanzen)', default: 'contracts', shape: '{id,name,kind,provider,amount,interval,cancelBy?,endsOn?,term,cancelable,reminder}[]', required: true }],
  events: ['contract.open', 'contract.cancel', 'contract.reminder', 'scan.start'],
  states: ['empty'],
  flutter: { widget: 'TaktContractList', propMap: { title: 'title', style: 'variant', showCosts: 'showCosts', filters: 'showFilters' }, events: { 'contract.open': 'onOpen', 'contract.cancel': 'onPrepareCancel', 'contract.reminder': 'onToggleReminder' } },
  css: `
  .tk-dok-ctrow { display:flex; align-items:center; gap:var(--tk-space-3) var(--tk-space-4); flex-wrap:wrap; padding:10px var(--tk-space-4); border-bottom:1px solid var(--tk-c-border); min-width:0; }
  .tk-dok-ctrow:last-child { border-bottom:0; } .tk-dok-ctopen { all:unset; box-sizing:border-box; display:flex; align-items:center; gap:12px; flex:1 1 240px; min-width:0; min-height:var(--tk-size-touch); cursor:pointer; border-radius:var(--tk-radius-md); }
  .tk-dok-ctcard .tk-dok-ctopen { flex:0 0 auto; }
  .tk-dok-ctopen:hover b { text-decoration:underline; } .tk-dok-ctopen:focus-visible { outline:2px solid var(--tk-c-focus); outline-offset:2px; }
  .tk-dok-ctcell { flex:1 1 150px; min-width:0; display:flex; flex-direction:column; gap:2px; } .tk-dok-ctcell .tk-dok-fine { text-transform:none; }
  .tk-dok-ctact { display:flex; align-items:center; gap:var(--tk-space-3); flex:0 1 auto; flex-wrap:wrap; }
  .tk-dok-ctgrid { display:grid; grid-template-columns:repeat(auto-fill, minmax(min(100%, 280px), 1fr)); gap:var(--tk-space-3); }
  .tk-dok-ctcard { display:flex; flex-direction:column; gap:var(--tk-space-3); padding:var(--tk-space-4); border-radius:var(--tk-radius-lg); background:var(--tk-c-surface); border:1px solid var(--tk-c-border); min-width:0; }
  .tk-dok-ctfilter { display:flex; gap:var(--tk-space-2); overflow-x:auto; scrollbar-width:none; padding:0 var(--tk-space-4) var(--tk-space-2); } .tk-dok-ctfilter > * { flex:none; }
  .tk-dok-cancel { display:flex; flex-direction:column; align-items:flex-start; gap:4px; max-width:260px; }
  .tk-dok-remind { display:flex; align-items:center; gap:8px; font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); }`,
  example: { props: { style: 'table' }, data: pick('contracts') },
  render: function DokContracts({ props, data, setData, ctx }) {
    const all = arr(data.contracts), today = todayOf(ctx), f = ctx.ui.cfilter || 'Alle';
    const shown = all.filter((c) => (f === 'Mit Frist' ? c.cancelBy : f === 'Privat' ? !c.business : f === 'Geschäft' ? c.business : true));
    const open = (c) => { ctx.setUi('selectedId', c.id); ctx.emit('contract.open', { id: c.id }); };
    const remind = (c, on) => { setData('contracts', (l) => arr(l).map((x) => (x.id === c.id ? { ...x, reminder: { ...x.reminder, on } } : x))); ctx.emit('contract.reminder', { id: c.id, on }); ctx.toast(on ? `Erinnerung 30, 14 und 3 Tage vorher für ${c.name}` : 'Erinnerung ausgeschaltet'); };
    const frist = (c) => { if (!c.cancelBy) return html`<span>${c.noticeDays ? `${c.noticeDays} Tage Frist` : c.cancelable ? 'ohne feste Frist' : 'laut Vertrag'}</span>`; const n = dayDiff(today, c.cancelBy); return n < 0 ? html`<span>Frist verstrichen</span>` : html`<span class="tk-dok-wrap"><span>bis ${dateLabel(c.cancelBy, today)}</span><${StageBadge} stage=${stageOf(n)} /></span>`; };
    const cancelBtn = (c) => html`<span class="tk-dok-cancel"><${Button} size="sm" icon="send" disabled=${!c.cancelable} title=${c.cancelable ? 'Textvorlage, nichts wird gesendet' : noTemplate(c)} onClick=${() => openCancelDraft(ctx, c)}>Kündigung vorbereiten<//>${!c.cancelable && html`<span class="tk-dok-fine">${noTemplate(c)}</span>`}</span>`;
    const remindSw = (c) => c.cancelable && c.cancelBy && html`<span class="tk-dok-remind"><${Switch} checked=${!!c.reminder?.on} onChange=${(on) => remind(c, on)} label=${`Erinnerung für ${c.name}`} />Erinnerung</span>`;
    const cost = (c) => props.showCosts && html`<span class="tk-num">${money(ctx, c.amount)}<span class="tk-dok-fine"> ${c.interval === 'monatlich' ? '/ Monat' : c.interval}</span></span>`;
    const filters = props.filters && html`<div class="tk-dok-ctfilter" role="group" aria-label="Filter">${FILTERS.map((x) => html`<${Chip} active=${f === x} onClick=${() => ctx.setUi('cfilter', x)}>${x}<//>`)}</div>`;
    const row = (c) => html`<div class="tk-dok-ctrow"><button type="button" class="tk-dok-ctopen" onClick=${() => open(c)} aria-label=${`${c.name} öffnen`}><${IconTile} icon=${c.icon || 'scroll-text'} tone=${KIND_TONE[c.kind] || 1} />
        <span class="tk-dok-main"><b>${c.name}</b><span class="tk-dok-sub">${c.kind} · ${c.term}</span></span></button>
      <span class="tk-dok-ctcell"><span class="tk-dok-fine">Kündigung</span>${frist(c)}</span>${props.showCosts && html`<span class="tk-dok-ctcell"><span class="tk-dok-fine">Kosten</span>${cost(c)}</span>`}
      <span class="tk-dok-ctact">${remindSw(c)}${cancelBtn(c)}</span></div>`;
    const card = (c) => { const p = termProgress(c, today); return html`<article class="tk-dok-ctcard" style=${`--tc:var(--tk-chart-${KIND_TONE[c.kind] || 1})`}>
      <button type="button" class="tk-dok-ctopen" onClick=${() => open(c)} aria-label=${`${c.name} öffnen`}><${IconTile} icon=${c.icon || 'scroll-text'} tone=${KIND_TONE[c.kind] || 1} size=${44} /><span class="tk-dok-main"><b>${c.name}</b><span class="tk-dok-sub">${c.provider} · ${c.kind}</span></span></button>
      ${p != null ? html`<div><div class="tk-dok-bar" role="progressbar" aria-label="Laufzeit" aria-valuenow=${Math.round(p * 100)} aria-valuemin="0" aria-valuemax="100"><i style=${`width:${p * 100}%`}></i></div><div class="tk-dok-fine" style="margin-top:4px">${c.term}</div></div>` : html`<div class="tk-dok-sub">${c.term}</div>`}
      <div class="tk-dok-wrap" style="justify-content:space-between"><span class="tk-dok-sub">Kündigung</span>${frist(c)}</div>
      ${props.showCosts && html`<div class="tk-dok-wrap" style="justify-content:space-between"><span class="tk-dok-sub">Kosten</span>${cost(c)}</div>`}
      <div class="tk-dok-ctact" style="justify-content:space-between">${remindSw(c)}${cancelBtn(c)}</div></article>`; };
    if (!all.length) return html`<${Card} title=${props.title}><${EmptyState} icon="scroll-text" title="Noch keine Verträge" text="Verträge und Abos kommen aus Finanzen. Lege einen Vertrag als Dokument ab, dann steht die Frist hier." action=${html`<${Button} variant="primary" icon="scan" onClick=${() => ctx.emit('scan.start')}>Vertrag scannen<//>`} /><//>`;
    const count = all.filter((c) => c.cancelBy).length;
    const empty = html`<${EmptyState} icon="filter" title="Keine Verträge in diesem Filter" text="Wähle „Alle“, um alle Verträge zu sehen." />`;
    return html`<${Card} flush title=${props.title} actions=${html`<${Badge}>${plural(all.length, 'Vertrag', 'Verträge')} · ${count} mit Frist<//>`}>${filters}
      ${!shown.length ? empty : props.style === 'cards' ? html`<div class="tk-dok-ctgrid" style="padding:var(--tk-space-3)">${shown.map(card)}</div>` : shown.map(row)}<//>`;
  },
};
export default dokContracts;
