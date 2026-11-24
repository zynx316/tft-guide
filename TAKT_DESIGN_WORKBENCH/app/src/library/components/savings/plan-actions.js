// Sparpläne: Plan-Aktionen (Fokus) – je Sparplan eine Karte mit genau einer klaren Aktion.
// Reihenfolge nach Dringlichkeit: „Jetzt dran“ (Ausführung in den nächsten 7 Tagen: bestätigen), „Danach“ (Termin später: pausieren),
// „Pausiert“ (fortsetzen). Eine Karte erklärt immer, was als Nächstes passiert; Deckung des Girokontos steht als kurze Zeile dabei.
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Card, Button, Badge, Icon, EmptyState } from '../../ui.js';
import { fmtDate } from '../../../lib/format.js';
import { dayDiff } from '../../../lib/date.js';
import { arr, todayOf, eur, eur2, Tile, PlanName, TrackerNote, SV_CSS, plural, whenLabel, QuietNote, QUIET_PROP } from './_savings.js';
import { planTarget, planStatus, rhythmLabel, planExecutions, confirmedSet, confirmExecution, setPlanActive, pauseUntil, perExecution } from './_plans.js';
import { coverageCheck, DEFAULT_BUFFER } from './_coverage.js';

const PAUSES = [[1, '1 Monat'], [3, '3 Monate'], [6, '6 Monate'], [0, 'Unbefristet']];

export const planActions = {
  id: 'plan-actions',
  name: 'Plan-Aktionen',
  category: 'Sparpläne',
  description: 'Fokus-Ansicht der Sparpläne: Pläne nach Dringlichkeit, je Plan eine Karte mit Termin, Betrag und genau einer Aktion (Ausführung bestätigen, pausieren oder fortsetzen). Eine Überschrift sagt, was jetzt dran ist; Deckung des Girokontos als kurze Zeile.',
  version: '1.1',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Was jetzt dran ist' },
    QUIET_PROP,
    { name: 'dueDays', label: 'Als „jetzt dran“ zeigen bis (Tage)', type: 'number', default: 7 },
    { name: 'showCoverage', label: 'Deckung zeigen', type: 'boolean', default: true },
    { name: 'showTracker', label: 'Plan-Tracker-Hinweis', type: 'boolean', default: true },
  ],
  data: [
    { slot: 'plans', label: 'Sparpläne', default: 'plans', shape: '{id,name,monthly,day,intervalMonths,active,positionId?,accountId?}[]', required: true },
    { slot: 'positions', label: 'Positionen', default: 'positions', shape: '{id,price,quantity,cost,value}[]' },
    { slot: 'accounts', label: 'Konten', default: 'accounts', shape: '{id,type,balance}[]' },
    { slot: 'subscriptions', label: 'Fixkosten', default: 'subscriptions', shape: '{id,name,amount,day}[]' },
    { slot: 'transactions', label: 'Buchungen', default: 'transactions', shape: '{id,category,type,date,title,planId?,execDate?}[]' },
    { slot: 'goals', label: 'Sparziele', default: 'goals', shape: '{id,monthly,paused}[]' },
  ],
  events: ['plan.open', 'plan.toggle', 'plan.create', 'execution.confirm', 'execution.undo'],
  states: ['empty'],
  flutter: { widget: 'SavingsPlanActions', propMap: { dueDays: 'dueDays', showCoverage: 'showCoverage' }, events: ['plan.open', 'plan.toggle', 'plan.create', 'execution.confirm', 'execution.undo'] },
  css: `${SV_CSS}
  .tk-svpa { display:flex; flex-direction:column; gap:var(--tk-space-5); min-width:0; }
  .tk-svpa__lead { display:flex; flex-direction:column; gap:6px; } .tk-svpa__lead h3 { margin:0; font-size:var(--tk-fs-2xl); line-height:1.15; letter-spacing:var(--tk-ls-tight); font-weight:var(--tk-fw-bold); }
  .tk-svpa__sec { display:flex; flex-direction:column; gap:var(--tk-space-3); min-width:0; }
  .tk-svpa__sh { display:flex; align-items:center; justify-content:space-between; gap:8px; flex-wrap:wrap; }
  .tk-svpa__label { margin:0; font-size:var(--tk-fs-xs); text-transform:uppercase; letter-spacing:var(--tk-ls-wide); font-weight:var(--tk-fw-semibold); color:var(--tk-c-text-subtle); }
  .tk-svpa__card { display:flex; flex-direction:column; gap:var(--tk-space-3); padding:var(--tk-space-4); border-radius:var(--tk-radius-lg); border:1px solid var(--tk-c-border); background:var(--tk-c-surface); min-width:0; }
  .tk-svpa__card[data-due="true"] { border-color:var(--tk-c-accent); }
  .tk-svpa__card[data-paused="true"] { background:var(--tk-c-surface2); }
  .tk-svpa__top { all:unset; box-sizing:border-box; display:flex; align-items:center; gap:12px; cursor:pointer; min-width:0; width:100%; }
  .tk-svpa__top:focus-visible { outline:2px solid var(--tk-c-focus); outline-offset:2px; border-radius:var(--tk-radius-md); }
  .tk-svpa__top > div { min-width:0; flex:1; } .tk-svpa__top strong { display:block; font-weight:var(--tk-fw-semibold); overflow-wrap:break-word; } .tk-svpa__top small { display:block; font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); overflow-wrap:break-word; }
  .tk-svpa__when { display:flex; align-items:baseline; justify-content:space-between; gap:6px 12px; flex-wrap:wrap; }
  .tk-svpa__day { font-size:var(--tk-fs-xl); font-weight:var(--tk-fw-bold); letter-spacing:var(--tk-ls-tight); line-height:1.15; } .tk-svpa__amt { font-size:var(--tk-fs-xl); font-weight:var(--tk-fw-bold); font-variant-numeric:tabular-nums; }
  .tk-svpa__act { display:flex; } .tk-svpa__act .tk-btn { width:100%; justify-content:center; min-height:var(--tk-size-touch); white-space:normal; text-align:center; height:auto; padding-top:8px; padding-bottom:8px; }
  .tk-svpa__cov { display:flex; gap:8px; align-items:flex-start; font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); line-height:var(--tk-lh-snug); } .tk-svpa__cov svg { flex:none; margin-top:2px; }
  .tk-svpa__new { display:flex; } .tk-svpa__new .tk-btn { width:100%; justify-content:center; min-height:var(--tk-size-touch); }`,
  example: { data: {
    plans: [{ id: 'sp1', name: 'All-World Sparplan', positionId: 'p1', monthly: 300, day: 1, intervalMonths: 1, startDate: '2024-03-01', active: true, tone: 1 },
      { id: 'sp2', name: 'Notgroschen (Dauerauftrag)', accountId: 'k1', monthly: 150, day: 15, intervalMonths: 1, startDate: '2025-01-01', active: true, tone: 3 },
      { id: 'sp3', name: 'E-Bike', accountId: 'k1', monthly: 100, day: 15, intervalMonths: 1, startDate: '2026-03-15', active: false, pausedUntil: '2027-01-15', tone: 5 }],
    positions: [{ id: 'p1', short: 'All-World', name: 'Vanguard FTSE All-World', type: 'ETF', price: 118.42, quantity: 152.31, cost: 14636.99, value: 18036.55, gain: 3399.56 }],
    accounts: [{ id: 'acc-giro', type: 'giro', balance: 3842 }, { id: 'k1', name: 'Tagesgeld', balance: 9500 }], subscriptions: [], transactions: [], goals: [] } },
  render: function PlanActions({ props, data, setData, ctx }) {
    const [last, setLast] = useState(null);
    const today = todayOf(ctx), plans = arr(data.plans).filter((p) => !p.ended), conf = confirmedSet(data.transactions);
    if (!plans.length && props.quietEmpty) return html`<${QuietNote} icon="piggy-bank" text="Sobald ein Sparplan läuft, zeigt TAKT hier, was als Nächstes zu tun ist." />`;
    if (!plans.length) return html`<${Card} title=${props.title} icon="piggy-bank"><${EmptyState} icon="piggy-bank" title="Noch kein Sparplan" text="Lege deinen ersten Sparplan an. TAKT erinnert dich an jede Ausführung." action=${html`<${Button} variant="primary" icon="plus" onClick=${() => ctx.emit('plan.create')}>Sparplan anlegen<//>`} />${props.showTracker && html`<div style="margin-top:12px"><${TrackerNote} /></div>`}<//>`;

    const cov = props.showCoverage ? coverageCheck({ plans, accounts: data.accounts, subscriptions: data.subscriptions, transactions: data.transactions, today, buffer: ctx.ui.buffer ?? DEFAULT_BUFFER }) : null;
    const covBy = new Map(arr(cov?.rows).map((r) => [r.iso, r]));
    const rows = plans.map((p) => ({ p, st: planStatus(p), tgt: planTarget(p, data.positions, data.accounts), next: planExecutions(p, today, 1, conf)[0] }));
    const dueIn = (r) => (r.next ? dayDiff(today, r.next.date) : Infinity);
    const due = rows.filter((r) => r.p.active && dueIn(r) <= props.dueDays).sort((a, b) => a.next.date - b.next.date);
    const later = rows.filter((r) => r.p.active && !(dueIn(r) <= props.dueDays)).sort((a, b) => (a.next ? a.next.date : Infinity) - (b.next ? b.next.date : Infinity));
    const paused = rows.filter((r) => !r.p.active);

    const confirm = (r) => {
      const undo = confirmExecution({ ex: r.next, positions: data.positions, accounts: data.accounts, setData, today, ctx });
      ctx.emit('execution.confirm', { id: r.p.id, date: r.next.iso });
      setLast({ text: `${r.p.name} vermerkt: ${eur2(ctx, r.next.amount)} umgebucht.`, undo: () => { undo(); ctx.emit('execution.undo', { id: r.p.id }); } });
    };
    const toggle = (r) => {
      const base = { setData, plan: r.p, plans: arr(data.plans) };
      if (r.p.active) {
        ctx.openDialog({ title: `${r.p.name} pausieren`, body: (close) => html`<div class="tk-col" style="gap:12px"><p class="tk-sv-meta">Während der Pause erinnert TAKT nicht an Ausführungen. Bereits ausgeführte Käufe bleiben unverändert.</p>
          <div class="tk-sv-btnrow">${PAUSES.map(([m, l]) => html`<${Button} onClick=${() => { setPlanActive({ ...base, active: false, until: pauseUntil(today, m) }); setLast({ text: `${r.p.name} pausiert${m ? ` bis ${fmtDate(pauseUntil(today, m))}` : ''}.`, undo: () => setPlanActive({ ...base, active: true }) }); ctx.emit('plan.toggle', { id: r.p.id, active: false }); close(); }}>${l}<//>`)}</div></div>` });
      } else {
        setPlanActive({ ...base, active: true }); setLast({ text: `${r.p.name} wird fortgesetzt.`, undo: () => setPlanActive({ ...base, active: false, until: r.p.pausedUntil || null }) }); ctx.emit('plan.toggle', { id: r.p.id, active: true });
      }
    };
    const open = (r) => { ctx.setUi('selectedId', r.p.id); ctx.emit('plan.open', { id: r.p.id }); };

    const card = (r, kind) => {
      const nm = html`<${PlanName} name=${r.p.name} />`;
      const sub = `${r.tgt.label} · ${rhythmLabel(r.p)}`;
      const c = r.next && covBy.get(r.next.iso);
      const covLine = kind === 'due' && c && c.status !== 'ok' && (html`<p class="tk-svpa__cov" role="status"><${Icon} name=${c.status === 'fehlt' ? 'alert-triangle' : 'alert-circle'} size=${14} /><span>${c.status === 'fehlt' ? `Am ${fmtDate(c.date, { style: 'weekday' })} fehlen ${eur2(ctx, c.short)} auf dem Girokonto für alle Sparpläne.` : `Am ${fmtDate(c.date, { style: 'weekday' })} wird es knapp: ${eur(ctx, c.free)} über dem Puffer.`}</span></p>`);
      const when = kind === 'paused'
        ? html`<div class="tk-svpa__when"><span class="tk-svpa__day">${r.p.pausedUntil ? `Ab ${fmtDate(r.p.pausedUntil, { style: 'weekday' })}` : 'Pausiert'}</span><span class="tk-svpa__amt">${eur(ctx, perExecution(r.p))}</span></div>`
        : html`<div class="tk-svpa__when"><span class="tk-svpa__day">${r.next ? whenLabel(r.next.date, today) : '–'}</span><span class="tk-svpa__amt">${eur(ctx, r.next ? r.next.amount : perExecution(r.p))}</span></div>`;
      const note = r.next?.shifted && kind !== 'paused' && html`<span class="tk-sv-meta">Verschoben vom ${fmtDate(r.next.nominal, { style: 'short' })} (${r.next.why || 'kein Handelstag'}).</span>`;
      const act = kind === 'due' ? html`<${Button} variant="primary" icon="check" onClick=${() => confirm(r)} aria-label=${`${r.p.name}: Ausführung bestätigen`}>Ausführung bestätigen<//>`
        : kind === 'later' ? html`<${Button} icon="pause" onClick=${() => toggle(r)} aria-label=${`${r.p.name} pausieren`}>Pausieren<//>`
          : html`<${Button} variant="primary" icon="play" onClick=${() => toggle(r)} aria-label=${`${r.p.name} fortsetzen`}>Fortsetzen<//>`;
      return html`<article class="tk-svpa__card" data-due=${kind === 'due' ? 'true' : undefined} data-paused=${kind === 'paused' ? 'true' : undefined}>
        <button type="button" class="tk-svpa__top" onClick=${() => open(r)} aria-label=${`${r.p.name} öffnen`}><${Tile} tone=${r.p.tone || 1} icon=${r.tgt.icon} /><div><strong>${nm}</strong><small>${sub}</small></div><${Icon} name="chevron-right" size=${16} /></button>
        ${when}${note}${covLine}<div class="tk-svpa__act">${act}</div></article>`;
    };
    const confirmAll = (list) => { const undos = list.map((r) => confirmExecution({ ex: r.next, positions: data.positions, accounts: data.accounts, setData, today, ctx })); list.forEach((r) => ctx.emit('execution.confirm', { id: r.p.id, date: r.next.iso })); setLast({ text: `${list.length} Ausführungen vermerkt: ${eur2(ctx, list.reduce((s, r) => s + r.next.amount, 0))} umgebucht.`, undo: () => { undos.reverse().forEach((u) => u()); ctx.emit('execution.undo'); } }); };
    const sec = (label, list, kind) => list.length > 0 && html`<section class="tk-svpa__sec" aria-label=${label}><div class="tk-svpa__sh"><h4 class="tk-svpa__label">${label}</h4>${kind === 'due' && list.length > 1 && html`<${Button} size="sm" variant="ghost" icon="check-check" onClick=${() => confirmAll(list)}>Alle ${list.length} bestätigen<//>`}</div>${list.map((r) => card(r, kind))}</section>`;

    const dueSum = due.reduce((s, r) => s + r.next.amount, 0);
    const lead = due.length ? `${plural(due.length, 'Ausführung', 'Ausführungen')} in den nächsten ${props.dueDays} Tagen` : 'Gerade ist nichts fällig';
    const leadSub = due.length ? `${eur(ctx, dueSum)} insgesamt. Trage sie bei deinem Broker ein und bestätige danach hier.` : later[0]?.next ? `Die nächste Ausführung ist am ${fmtDate(later[0].next.date, { style: 'weekday' })}.` : 'Alle Pläne sind pausiert.';
    const c0 = due[0]?.next && covBy.get(due[0].next.iso);
    const okLine = c0 && c0.status === 'ok' && html`<p class="tk-svpa__cov"><${Icon} name="check-circle-2" size=${14} /><span>Girokonto gedeckt: Nach den Sparraten bleiben ${eur(ctx, c0.free)} über dem Puffer.</span></p>`;
    return html`<div class="tk-svpa">
      <div class="tk-svpa__lead"><h3>${lead}</h3><span class="tk-sv-meta">${leadSub}</span></div>
      ${okLine}
      ${last && html`<div class="tk-sv-undo" role="status"><span>${last.text}</span><${Button} size="sm" variant="ghost" icon="undo-2" onClick=${() => { last.undo(); setLast(null); }}>Rückgängig<//></div>`}
      ${sec('Jetzt dran', due, 'due')}${sec('Danach', later, 'later')}${sec('Pausiert', paused, 'paused')}
      <div class="tk-svpa__new"><${Button} icon="plus" onClick=${() => ctx.emit('plan.create')}>Neuen Sparplan anlegen<//></div>
      ${props.showTracker && html`<${TrackerNote} plural />`}</div>`;
  },
};
export default [planActions];
