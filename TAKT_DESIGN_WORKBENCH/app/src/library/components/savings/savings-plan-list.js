// Sparpläne: Liste der Sparpläne – Tabelle (dicht), Karten (visuell) oder kompakte Zeilen; Pausieren direkt in der Zeile.
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Card, Button, Badge, Icon, EmptyState } from '../../ui.js';
import { fmtDate } from '../../../lib/format.js';
import { arr, todayOf, eur, eur2, Tile, TrackerNote, Gain, SV_CSS, sum, whenLabel } from './_savings.js';
import { CHART_CSS } from './_chart.js';
import { planTarget, planStatus, rhythmLabel, planExecutions, planStats, confirmedSet, monthlyTotal, setPlanActive, pauseUntil, perExecution } from './_plans.js';

const PAUSES = [[1, '1 Monat'], [3, '3 Monate'], [6, '6 Monate'], [0, 'Unbefristet']];

export const savingsPlanList = {
  id: 'savings-plan-list',
  name: 'Sparplan-Liste',
  category: 'Sparpläne',
  description: 'Alle Sparpläne mit Rate, Rhythmus, nächster Ausführung, Wert und Status. Tabelle (dicht), Karten (mit Anteilsbalken) oder kompakte Zeilen; Pausieren und Fortsetzen direkt in der Zeile, mit Rückgängig.',
  version: '1.0',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Sparpläne' },
    { name: 'style', label: 'Darstellung', type: 'select', options: ['table', 'cards', 'compact'], default: 'table' },
    { name: 'limit', label: 'Max. Einträge (0 = alle)', type: 'number', default: 0 },
    { name: 'showActions', label: 'Pausieren in der Zeile', type: 'boolean', default: true },
    { name: 'selectable', label: 'Auswahl markieren (selectedId)', type: 'boolean', default: false },
    { name: 'showTracker', label: 'Plan-Tracker-Hinweis', type: 'boolean', default: true },
    { name: 'respectFilter', label: 'Filter beachten (Aktiv/Pausiert)', type: 'boolean', default: false },
  ],
  data: [
    { slot: 'plans', label: 'Sparpläne', default: 'plans', shape: '{id,name,monthly,day,intervalMonths,active,positionId?,accountId?}[]', required: true },
    { slot: 'positions', label: 'Positionen', default: 'positions', shape: '{id,value,cost,gain}[]' },
    { slot: 'accounts', label: 'Konten', default: 'accounts', shape: '{id,name,balance}[]' },
    { slot: 'goals', label: 'Sparziele', default: 'goals', shape: '{id,monthly,paused}[]' },
    { slot: 'transactions', label: 'Buchungen', default: 'transactions', shape: '{id,planId?,execDate?}[]' },
  ],
  events: ['plan.open', 'plan.toggle', 'plan.create', 'plans.open'],
  states: ['empty'],
  css: `${SV_CSS}${CHART_CSS}
  .tk-svpl__head, .tk-svpl__row { display:grid; grid-template-columns:minmax(0,2.3fr) minmax(0,1.25fr) minmax(0,1.25fr) minmax(0,1.3fr) 40px; gap:var(--tk-space-3); align-items:center; padding:0 var(--tk-space-4); }
  .tk-svpl__head { height:34px; border-bottom:1px solid var(--tk-c-border); font-size:var(--tk-fs-xs); text-transform:uppercase; letter-spacing:var(--tk-ls-wide); font-weight:var(--tk-fw-semibold); color:var(--tk-c-text-subtle); }
  .tk-svpl__row { border-bottom:1px solid var(--tk-c-border); min-height:64px; padding-top:8px; padding-bottom:8px; }
  .tk-svpl__row:last-child { border-bottom:0; } .tk-svpl__row[aria-selected="true"] { background:var(--tk-c-accent-soft); } .tk-svpl__row:hover { background:var(--tk-c-surface2); }
  .tk-svpl__main { all:unset; box-sizing:border-box; grid-column:1 / 5; display:grid; grid-template-columns:subgrid; gap:var(--tk-space-3); align-items:center; cursor:pointer; min-width:0; }
  .tk-svpl__main:focus-visible { outline:2px solid var(--tk-c-focus); outline-offset:2px; border-radius:var(--tk-radius-sm); }
  .tk-svpl__name { display:flex; align-items:center; gap:12px; min-width:0; } .tk-svpl__name > div { min-width:0; }
  .tk-svpl__name strong, .tk-svpl__cell strong { display:block; font-weight:var(--tk-fw-semibold); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .tk-svpl__name > div > span, .tk-svpl__cell > span { display:block; font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .tk-svpl__cell { min-width:0; font-variant-numeric:tabular-nums; } .tk-svpl__cell--r { text-align:right; }
  .tk-svpl__acts { display:flex; gap:4px; align-items:center; }
  .tk-svpl__sum { display:flex; justify-content:space-between; gap:12px; flex-wrap:wrap; padding:10px var(--tk-space-4); border-top:1px solid var(--tk-c-border); font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); background:var(--tk-c-surface2); }
  .tk-svpl__sum strong { color:var(--tk-c-text); font-variant-numeric:tabular-nums; }
  .bp-mobile .tk-svpl__head { display:none; }
  .bp-mobile .tk-svpl__row { grid-template-columns:minmax(0,1fr) 44px; padding:10px var(--tk-space-3); gap:6px 6px; }
  .bp-mobile .tk-svpl__main { grid-column:1; grid-template-columns:minmax(0,1fr) auto; grid-template-areas:"n r" "x y"; row-gap:6px; }
  .bp-mobile .tk-svpl__main > :nth-child(1) { grid-area:n; } .bp-mobile .tk-svpl__main > :nth-child(2) { grid-area:r; text-align:right; }
  .bp-mobile .tk-svpl__main > :nth-child(3) { grid-area:x; } .bp-mobile .tk-svpl__main > :nth-child(3) span { display:none; }
  .bp-mobile .tk-svpl__main > :nth-child(4) { grid-area:y; text-align:right; } .bp-mobile .tk-svpl__main > :nth-child(4) strong { display:inline; margin-right:8px; } .bp-mobile .tk-svpl__main > :nth-child(4) span { display:inline; }
  .bp-mobile .tk-svpl__acts { align-self:start; }
  .tk-svpl__cards { display:grid; grid-template-columns:repeat(auto-fill, minmax(250px,1fr)); gap:var(--tk-space-4); }
  .tk-svpl__card { all:unset; box-sizing:border-box; display:flex; flex-direction:column; gap:10px; padding:var(--tk-space-4); border-radius:var(--tk-radius-lg); border:1px solid var(--tk-c-border); background:var(--tk-c-surface); cursor:pointer; min-width:0; }
  .tk-svpl__card:hover { border-color:var(--tk-c-border-strong); } .tk-svpl__card:focus-visible { outline:2px solid var(--tk-c-focus); } .tk-svpl__card[aria-selected="true"] { border-color:var(--tk-c-accent); }
  .tk-svpl__big { font-size:var(--tk-fs-2xl); font-weight:var(--tk-fw-bold); letter-spacing:var(--tk-ls-tight); font-variant-numeric:tabular-nums; line-height:1.1; }
  .tk-svpl__share { display:flex; flex-direction:column; gap:8px; margin-bottom:var(--tk-space-4); }
  .tk-svpl__cmp { display:flex; align-items:center; gap:10px; min-height:44px; padding:6px var(--tk-space-3); border-radius:var(--tk-radius-md); cursor:pointer; border:0; background:transparent; width:100%; text-align:left; color:inherit; }
  .tk-svpl__cmp:hover { background:var(--tk-c-surface2); } .tk-svpl__cmp[aria-selected="true"] { background:var(--tk-c-accent-soft); }
  .tk-svpl__cmp > div { min-width:0; flex:1; } .tk-svpl__cmp strong { display:block; font-weight:var(--tk-fw-semibold); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .tk-svpl__foot { display:flex; flex-direction:column; gap:var(--tk-space-3); margin-top:var(--tk-space-3); }`,
  example: { data: {
    plans: [{ id: 'sp1', name: 'All-World Sparplan', positionId: 'p1', monthly: 300, day: 1, intervalMonths: 1, startDate: '2024-03-01', active: true, dynamicPa: 0.03, expectedReturnPa: 0.06, tone: 1 },
      { id: 'sp2', name: 'Notgroschen (Dauerauftrag)', accountId: 'k1', monthly: 150, day: 1, intervalMonths: 1, startDate: '2025-01-01', active: true, expectedReturnPa: 0.025, tone: 3 },
      { id: 'sp3', name: 'E-Bike', accountId: 'k1', monthly: 100, day: 15, intervalMonths: 1, startDate: '2026-03-15', active: false, pausedUntil: '2027-01-15', tone: 5 }],
    positions: [{ id: 'p1', short: 'All-World', name: 'Vanguard FTSE All-World', type: 'ETF', isin: 'IE00BK5BQT80', value: 18036.55, cost: 14636.99, gain: 3399.56 }], accounts: [{ id: 'k1', name: 'Tagesgeld', balance: 9500, interestPa: 0.025 }], goals: [], transactions: [] } },
  render: function SavingsPlanList({ props, data, setData, ctx }) {
    const [last, setLast] = useState(null);
    const today = todayOf(ctx);
    let plans = arr(data.plans);
    const conf = confirmedSet(data.transactions);
    if (props.respectFilter && ctx.ui.filter && !/^alle?$/i.test(ctx.ui.filter)) plans = plans.filter((p) => planStatus(p).id === String(ctx.ui.filter).toLowerCase());
    if (props.respectFilter && ctx.ui.query) plans = plans.filter((p) => `${p.name} ${planTarget(p, data.positions, data.accounts).label}`.toLowerCase().includes(String(ctx.ui.query).toLowerCase()));
    const shown = props.limit > 0 ? plans.slice(0, props.limit) : plans;
    const selId = ctx.ui.selectedId ?? (arr(data.plans).find((p) => p.active) || arr(data.plans)[0])?.id;
    const open = (p) => { ctx.setUi('selectedId', p.id); ctx.emit('plan.open', { id: p.id }); };
    const rows = shown.map((p) => ({ p, tgt: planTarget(p, data.positions, data.accounts), st: planStatus(p), next: planExecutions(p, today, 1, conf)[0], stats: planStats(p, { positions: data.positions, accounts: data.accounts, today }) }));
    const toggle = (p) => {
      const ctxData = { setData, plan: p, plans: arr(data.plans) };
      if (p.active) {
        ctx.openDialog({ title: `${p.name} pausieren`, body: (close) => html`<div class="tk-col" style="gap:12px"><p class="tk-muted" style="font-size:var(--tk-fs-sm)">Während der Pause erinnert TAKT nicht an Ausführungen. Bereits ausgeführte Käufe bleiben unverändert.</p>
          <div class="tk-sv-btnrow">${PAUSES.map(([m, l]) => html`<${Button} onClick=${() => { setPlanActive({ ...ctxData, active: false, until: pauseUntil(today, m) }); setLast({ p, text: `${p.name} pausiert${m ? ` bis ${fmtDate(pauseUntil(today, m))}` : ''}.` }); ctx.emit('plan.toggle', { id: p.id, active: false }); close(); }}>${l}<//>`)}</div></div>` });
      } else { setPlanActive({ ...ctxData, active: true }); setLast({ p, text: `${p.name} wird fortgesetzt.` }); ctx.emit('plan.toggle', { id: p.id, active: true }); }
    };
    const undo = () => { if (!last) return; setPlanActive({ setData, plan: last.p, plans: arr(data.plans), active: last.p.active, until: last.p.pausedUntil || null }); ctx.emit('plan.toggle', { id: last.p.id, undo: true }); setLast(null); };
    const empty = html`<${EmptyState} icon="piggy-bank" title="Noch kein Sparplan" text="Lege deinen ersten Sparplan an. TAKT erinnert dich an jede Ausführung und rechnet mit, wie dein Vermögen wächst." action=${html`<${Button} variant="primary" icon="plus" onClick=${() => ctx.emit('plan.create')}>Sparplan anlegen<//>`} />`;
    const undoBar = last && html`<div class="tk-sv-undo" role="status"><span>${last.text}</span><${Button} size="sm" variant="ghost" icon="undo-2" onClick=${undo}>Rückgängig<//></div>`;
    const more = props.limit > 0 && plans.length > shown.length && html`<${Button} variant="ghost" iconRight="chevron-right" onClick=${() => ctx.emit('plans.open')}>Alle ${plans.length} Pläne<//>`;
    const nextText = (r) => (r.next ? whenLabel(r.next.date, today) : r.st.id === 'pausiert' ? 'Pausiert' : '–');
    const foot = html`<div class="tk-svpl__foot">${undoBar}${props.showTracker && html`<${TrackerNote} />`}${more}</div>`;
    const act = (r) => props.showActions && html`<${Button} size="sm" variant="ghost" icon=${r.p.active ? 'pause' : 'play'} aria-label=${r.p.active ? `${r.p.name} pausieren` : `${r.p.name} fortsetzen`} onClick=${() => toggle(r.p)} />`;
    const action = html`<${Button} size="sm" icon="plus" onClick=${() => ctx.emit('plan.create')}>Neu<//>`;
    if (!plans.length && arr(data.plans).length) return html`<${Card} title=${props.title} icon="piggy-bank"><${EmptyState} icon="search" title="Keine Treffer" text="Kein Sparplan passt zum Filter." /><//>`;
    if (!plans.length) return html`<${Card} title=${props.title} icon="piggy-bank">${empty}${props.showTracker && html`<div style="margin-top:12px"><${TrackerNote} /></div>`}<//>`;

    if (props.style === 'cards') {
      const total = monthlyTotal(plans) || 1;
      return html`<div class="tk-col" style="gap:var(--tk-space-4)">
        <${Card} title=${props.title} icon="piggy-bank" actions=${action}><div class="tk-svpl__share"><div class="tk-sv-bar" role="img" aria-label="Anteil der Raten am Monatsbetrag">${rows.filter((r) => r.p.active).map((r) => html`<i title=${r.p.name} style=${`flex:${r.p.monthly};background:var(--tk-chart-${r.p.tone || 1})`}></i>`)}</div>
          <span class="tk-sv-meta">Verteilung der ${eur(ctx, total)} pro Monat auf ${rows.filter((r) => r.p.active).length} aktive Pläne</span></div>
          <div class="tk-svpl__cards">${rows.map((r) => html`<button type="button" class="tk-svpl__card" aria-selected=${props.selectable && selId === r.p.id ? 'true' : 'false'} onClick=${() => open(r.p)}>
            <div class="tk-sv-row"><${Tile} tone=${r.p.tone || 1} icon=${r.tgt.icon} /><div class="tk-grow"><strong class="tk-truncate" style="display:block">${r.p.name}</strong><span class="tk-sv-meta tk-truncate" style="display:block">${r.tgt.label}</span></div></div>
            <div><div class="tk-svpl__big">${eur(ctx, r.p.monthly)}</div><span class="tk-sv-meta">pro Monat · ${rhythmLabel(r.p)}</span></div>
            <div class="tk-sv-row" style="justify-content:space-between;flex-wrap:wrap;gap:6px"><${Badge} tone=${r.st.tone} icon=${r.st.icon}>${r.st.label}<//><span class="tk-sv-meta tk-num">${r.next ? `Nächste: ${fmtDate(r.next.date, { style: 'weekday' })}` : ''}</span></div>
            <div class="tk-sv-row" style="justify-content:space-between;border-top:1px solid var(--tk-c-border);padding-top:10px"><span class="tk-sv-meta">Wert</span><span class="tk-num" style="font-weight:600">${eur(ctx, r.stats.value)}</span><${Gain} ctx=${ctx} value=${r.stats.gain} ratio=${r.stats.ratio} showAmount=${false} /></div></button>`)}</div>
        ${foot}<//></div>`;
    }
    if (props.style === 'compact') {
      return html`<${Card} title=${props.title} icon="piggy-bank" actions=${action}><div class="tk-col" style="gap:2px">${rows.map((r) => html`<button type="button" class="tk-svpl__cmp" aria-selected=${props.selectable && selId === r.p.id ? 'true' : 'false'} onClick=${() => open(r.p)}>
        <${Tile} tone=${r.p.tone || 1} icon=${r.tgt.icon} size=${16} /><div><strong>${r.p.name}</strong><span class="tk-sv-meta tk-truncate" style="display:block">${r.st.id === 'aktiv' ? nextText(r) : r.st.label}</span></div><strong class="tk-num">${eur(ctx, r.p.monthly)}</strong></button>`)}</div>${foot}<//>`;
    }
    const totals = { monthly: monthlyTotal(plans), value: sum(rows.filter((r) => r.stats), (r) => r.stats.value), gain: sum(rows, (r) => r.stats.gain) };
    return html`<${Card} flush title=${props.title} icon="piggy-bank" actions=${action}>
      <div class="tk-svpl__head" aria-hidden="true"><span>Plan</span><span>Rate</span><span>Nächster Termin</span><span style="text-align:right">Wert</span><span></span></div>
      ${rows.map((r) => html`<div class="tk-svpl__row" aria-selected=${props.selectable && selId === r.p.id ? 'true' : 'false'}>
        <button type="button" class="tk-svpl__main" onClick=${() => open(r.p)} aria-label=${`${r.p.name} öffnen`}>
          <div class="tk-svpl__name"><${Tile} tone=${r.p.tone || 1} icon=${r.tgt.icon} size=${17} /><div><strong>${r.p.name}</strong><span>${r.tgt.label}${r.st.id !== 'aktiv' ? ` · ${r.st.label}` : ''}</span></div></div>
          <div class="tk-svpl__cell"><strong>${eur(ctx, r.p.monthly)}</strong><span>${rhythmLabel(r.p)}</span></div>
          <div class="tk-svpl__cell"><strong>${nextText(r)}</strong><span>${r.next ? `${eur2(ctx, perExecution(r.p))}${r.next.shifted ? ' · verschoben' : ''}` : r.st.label}</span></div>
          <div class="tk-svpl__cell tk-svpl__cell--r"><strong>${eur(ctx, r.stats.value)}</strong><span><${Gain} ctx=${ctx} value=${r.stats.gain} ratio=${r.stats.ratio} showAmount=${false} /></span></div></button>
        <div class="tk-svpl__acts">${act(r)}</div></div>`)}
      <div class="tk-svpl__sum"><span>${shown.length} ${shown.length === 1 ? 'Plan' : 'Pläne'}</span><span>Sparrate <strong>${eur(ctx, totals.monthly)}</strong> pro Monat</span><span>Wert <strong>${eur(ctx, totals.value)}</strong></span></div>
      <div style="padding:var(--tk-space-3) var(--tk-space-4) var(--tk-space-4)">${foot}</div><//>`;
  },
};
export default [savingsPlanList];
