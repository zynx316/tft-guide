// Sparpläne: Ausführungskalender – nächste Ausführungen als Liste, Monatsraster oder „Als Nächstes“; Handelstag-Verschiebung, Deckung, manuelles Bestätigen.
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Card, Button, Badge, Icon, EmptyState } from '../../ui.js';
import { fmtDate, fmtRelativeDay } from '../../../lib/format.js';
import { addMonths, addDays, dayDiff, daysInMonth, isoWeekday, toIsoDay, toDate, MONTHS_LONG, WEEKDAYS_SHORT } from '../../../lib/date.js';
import { arr, todayOf, eur, eur2, Tile, TrackerNote, SV_CSS, plural, whenLabel, QuietNote, QUIET_PROP } from './_savings.js';
import { allExecutions, confirmedSet, confirmExecution, planTarget, isTradingDay, holidayName } from './_plans.js';
import { coverageCheck, DEFAULT_BUFFER, COVER_TONE, COVER_LABEL, COVER_ICON } from './_coverage.js';

const dayHead = (ctx, date, today) => whenLabel(date, today);

export const executionCalendar = {
  id: 'execution-calendar',
  name: 'Ausführungskalender',
  category: 'Sparpläne',
  description: 'Wann wird welcher Sparplan ausgeführt? Liste nach Tagen, Monatsraster mit Markern oder „Als Nächstes“. Wochenenden und Feiertage verschieben auf den nächsten Handelstag (mit Hinweis), Deckung des Girokontos je Tag, Ausführung manuell bestätigen (erzeugt eine Umbuchung), mit Rückgängig.',
  version: '1.0',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Ausführungen' },
    QUIET_PROP,
    { name: 'view', label: 'Ansicht', type: 'select', options: ['list', 'month', 'next'], default: 'list' },
    { name: 'months', label: 'Horizont Liste (Monate)', type: 'number', default: 3 },
    { name: 'limit', label: 'Max. Tage (0 = alle)', type: 'number', default: 0 },
    { name: 'showCoverage', label: 'Deckung je Tag', type: 'boolean', default: true },
    { name: 'showPast', label: 'Zuletzt ausgeführt zeigen', type: 'boolean', default: false },
    { name: 'showTracker', label: 'Plan-Tracker-Hinweis', type: 'boolean', default: true },
    { name: 'framed', label: 'In Karte', type: 'boolean', default: true },
  ],
  data: [
    { slot: 'plans', label: 'Sparpläne', default: 'plans', shape: '{id,name,monthly,day,intervalMonths,active,positionId?,accountId?}[]', required: true },
    { slot: 'positions', label: 'Positionen', default: 'positions', shape: '{id,price,quantity,cost,value}[]' },
    { slot: 'accounts', label: 'Konten', default: 'accounts', shape: '{id,type,balance}[]' },
    { slot: 'subscriptions', label: 'Fixkosten', default: 'subscriptions', shape: '{id,name,amount,day}[]' },
    { slot: 'transactions', label: 'Buchungen', default: 'transactions', shape: '{id,category,type,date,title,planId?,execDate?}[]' },
  ],
  events: ['execution.open', 'execution.confirm', 'execution.undo', 'calendar.day', 'calendar.open', 'plan.create'],
  states: ['empty'],
  css: `${SV_CSS}
  .tk-sve { display:flex; flex-direction:column; gap:var(--tk-space-4); min-width:0; }
  .tk-sve__day { display:flex; flex-direction:column; border:1px solid var(--tk-c-border); border-radius:var(--tk-radius-lg); background:var(--tk-c-surface); overflow:hidden; min-width:0; }
  .tk-sve__dh { display:flex; align-items:center; gap:10px; flex-wrap:wrap; padding:10px var(--tk-space-4); background:var(--tk-c-surface2); border-bottom:1px solid var(--tk-c-border); }
  .tk-sve__dh strong { font-weight:var(--tk-fw-semibold); } .tk-sve__dh .tk-grow { min-width:120px; }
  .tk-sve__it { display:flex; align-items:center; gap:12px; padding:10px var(--tk-space-4); border-bottom:1px solid var(--tk-c-border); min-width:0; } .tk-sve__it:last-child { border-bottom:0; }
  .tk-sve__it > button.m { all:unset; box-sizing:border-box; display:flex; align-items:center; gap:12px; flex:1; min-width:0; cursor:pointer; } .tk-sve__it > button.m:focus-visible { outline:2px solid var(--tk-c-focus); outline-offset:2px; border-radius:6px; }
  .tk-sve__it strong { display:block; font-weight:var(--tk-fw-semibold); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; } .tk-sve__it small { display:block; font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .tk-sve__amt { font-variant-numeric:tabular-nums; font-weight:var(--tk-fw-semibold); white-space:nowrap; }
  .tk-sve__mh { display:flex; align-items:center; justify-content:space-between; gap:8px; } .tk-sve__mh strong { font-size:var(--tk-fs-lg); }
  .tk-sve__grid { display:grid; grid-template-columns:repeat(7, minmax(0,1fr)); gap:4px; } .tk-sve__wd { text-align:center; font-size:var(--tk-fs-xs); color:var(--tk-c-text-subtle); text-transform:uppercase; letter-spacing:var(--tk-ls-wide); padding:4px 0; }
  .tk-sve__c { all:unset; box-sizing:border-box; min-height:54px; padding:4px 6px; border-radius:var(--tk-radius-md); border:1px solid var(--tk-c-border); background:var(--tk-c-surface); cursor:pointer; display:flex; flex-direction:column; justify-content:space-between; gap:2px; min-width:0; }
  .tk-sve__c:hover { border-color:var(--tk-c-border-strong); } .tk-sve__c:focus-visible { outline:2px solid var(--tk-c-focus); } .tk-sve__c[data-off="true"] { background:var(--tk-c-surface2); color:var(--tk-c-text-subtle); } .tk-sve__c[data-out="true"] { opacity:.4; border-style:dashed; }
  .tk-sve__c[data-today="true"] .n { background:var(--tk-c-accent); color:var(--tk-c-text-on-accent); } .tk-sve__c[aria-pressed="true"] { border-color:var(--tk-c-accent); background:var(--tk-c-accent-soft); }
  .tk-sve__c .n { align-self:flex-start; min-width:22px; height:22px; border-radius:11px; display:grid; place-items:center; font-size:var(--tk-fs-sm); font-variant-numeric:tabular-nums; padding:0 4px; }
  .tk-sve__c .dots { display:flex; gap:3px; flex-wrap:wrap; } .tk-sve__c .dots i { width:8px; height:8px; border-radius:50%; display:block; } .tk-sve__c .dots i.done { background:transparent !important; border:2px solid var(--tk-c-success); }
  .tk-sve__c .a { font-size:var(--tk-fs-xs); font-variant-numeric:tabular-nums; color:var(--tk-c-text-muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; } .bp-mobile .tk-sve__c .a { display:none; } .bp-mobile .tk-sve__c { min-height:48px; }
  .tk-sve__hero { display:flex; flex-direction:column; gap:var(--tk-space-4); } .tk-sve__big { font-size:var(--tk-fs-2xl); font-weight:var(--tk-fw-bold); letter-spacing:var(--tk-ls-tight); line-height:1.15; }
  .tk-sve__past { display:flex; flex-direction:column; gap:6px; font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); } .tk-sve__past div { display:flex; gap:8px; align-items:center; font-variant-numeric:tabular-nums; }`,
  example: { data: { plans: [{ id: 'a', name: 'All-World', monthly: 300, day: 1, intervalMonths: 1, active: true, startDate: '2024-01-01', tone: 1, positionId: 'p1' }, { id: 'b', name: 'Notgroschen', monthly: 150, day: 1, intervalMonths: 1, active: true, startDate: '2024-01-01', tone: 3, accountId: 'k1' }], positions: [{ id: 'p1', short: 'All-World', price: 118.42, quantity: 152.31, cost: 14636.99, value: 18036.55 }], accounts: [{ id: 'acc-giro', type: 'giro', balance: 3842 }, { id: 'k1', name: 'Tagesgeld', balance: 9500 }], subscriptions: [], transactions: [] } },
  render: function ExecutionCalendar({ props, data, setData, ctx }) {
    const [last, setLast] = useState(null), [off, setOff] = useState(0);
    const today = todayOf(ctx), plans = arr(data.plans), conf = confirmedSet(data.transactions);
    const wrap = (b, actions) => (props.framed ? html`<${Card} title=${props.title} icon="calendar-check" actions=${actions}>${b}<//>` : b);
    if (props.quietEmpty && !plans.some((p) => p.active || p.pausedUntil)) return html`<${QuietNote} icon="calendar-check" text="Ausführungstermine erscheinen, sobald ein Sparplan aktiv ist." />`;
    if (!plans.some((p) => p.active || p.pausedUntil)) return wrap(html`<${EmptyState} icon="calendar-check" title="Keine Ausführungen geplant" text="Sobald ein Sparplan aktiv ist, erscheinen hier seine Termine, inklusive Verschiebung auf Handelstage." action=${html`<${Button} variant="primary" icon="plus" onClick=${() => ctx.emit('plan.create')}>Sparplan anlegen<//>`} />${props.showTracker ? html`<div style="margin-top:12px"><${TrackerNote} plural /></div>` : ''}`);
    const buffer = ctx.ui.buffer ?? DEFAULT_BUFFER;
    const cov = new Map(coverageCheck({ plans, accounts: data.accounts, subscriptions: data.subscriptions, transactions: data.transactions, today, buffer }).rows.map((r) => [r.iso, r]));
    const horizon = props.view === 'month' ? addMonths(today, 13) : addMonths(today, Math.max(1, props.months));
    const all = allExecutions(plans, today, { perPlan: 16, until: horizon }, conf);
    const byDay = new Map(); for (const e of all) { if (!byDay.has(e.iso)) byDay.set(e.iso, []); byDay.get(e.iso).push(e); }
    const confirm = (list) => { const undos = list.map((ex) => confirmExecution({ ex, positions: data.positions, accounts: data.accounts, setData, today, ctx })); list.forEach((ex) => ctx.emit('execution.confirm', { id: ex.planId, date: ex.iso })); setLast({ text: list.length === 1 ? `${list[0].plan.name} als ausgeführt vermerkt: ${eur2(ctx, list[0].amount)} umgebucht.` : `${list.length} Ausführungen vermerkt, ${eur2(ctx, list.reduce((s, e) => s + e.amount, 0))} umgebucht.`, undo: () => undos.reverse().forEach((u) => u()) }); };
    const undo = html`${last && html`<div class="tk-sv-undo" role="status"><span>${last.text}</span><${Button} size="sm" variant="ghost" icon="undo-2" onClick=${() => { last.undo(); ctx.emit('execution.undo'); setLast(null); }}>Rückgängig<//></div>`}`;
    const item = (e) => html`<div class="tk-sve__it"><button type="button" class="m" onClick=${() => { ctx.emit('execution.open', { id: e.planId }); ctx.setUi('selectedId', e.planId); }} aria-label=${`${e.plan.name} öffnen`}>
        <${Tile} tone=${e.plan.tone || 1} icon=${planTarget(e.plan, data.positions, data.accounts).icon} size=${16} /><div class="tk-grow" style="min-width:0"><strong>${e.plan.name}</strong><small>${e.shifted ? `Verschoben vom ${fmtDate(e.nominal, { style: 'short' })} (${e.why || 'kein Handelstag'})` : planTarget(e.plan, data.positions, data.accounts).label}</small></div><span class="tk-sve__amt">${eur2(ctx, e.amount)}</span></button>
      <${Button} size="sm" variant="ghost" icon="check" aria-label=${`${e.plan.name} als ausgeführt bestätigen`} title="Als ausgeführt bestätigen" onClick=${() => confirm([e])} /></div>`;
    const covBadge = (iso) => { const c = cov.get(iso); return props.showCoverage && c ? html`<${Badge} tone=${COVER_TONE[c.status]} icon=${COVER_ICON[c.status]}>${c.status === 'fehlt' ? `Fehlt ${eur(ctx, c.short)}` : COVER_LABEL[c.status]}<//>` : null; };
    const dayBlock = (iso, list) => html`<section class="tk-sve__day" aria-label=${dayHead(ctx, list[0].date, today)}><div class="tk-sve__dh"><strong class="tk-grow">${dayHead(ctx, list[0].date, today)}</strong><span class="tk-sve__amt">${eur(ctx, list.reduce((s, e) => s + e.amount, 0))}</span>${covBadge(iso)}${list.length > 1 ? html`<${Button} size="sm" onClick=${() => confirm(list)}>Alle bestätigen<//>` : ''}</div>${list.map(item)}</section>`;
    const past = props.showPast && arr(data.transactions).filter((t) => t.type === 'transfer' && t.category === 'Sparen' && dayDiff(t.date, today) >= 0).sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 4);
    const pastBlock = past && past.length > 0 && html`<div class="tk-sve__past"><span class="tk-label">Zuletzt ausgeführt</span>${past.map((t) => html`<div><${Icon} name="check-circle-2" size=${14} /><span class="tk-grow tk-truncate">${t.title}</span><span>${fmtDate(t.date, { style: 'weekday' })}</span><span>${eur2(ctx, -t.amount)}</span></div>`)}</div>`;
    const tracker = props.showTracker && html`<${TrackerNote} plural />`;

    if (props.view === 'next') {
      const [iso, list] = [...byDay.entries()][0] || [];
      if (!iso) return wrap(html`<${EmptyState} icon="calendar-check" title="Alles erledigt" text="Im gewählten Zeitraum steht keine Ausführung an." />`);
      const sum = list.reduce((s, e) => s + e.amount, 0), d = list[0].date;
      return wrap(html`<div class="tk-sve__hero"><div><div class="tk-sve__big">${fmtDate(d, { style: 'weekday' })} · ${eur(ctx, sum)}</div><span class="tk-sv-meta">${fmtRelativeDay(d, today)} · ${plural(list.length, 'Sparplan', 'Sparpläne')}${list.some((e) => e.shifted) ? ' · auf Handelstag verschoben' : ''}</span></div>
        <div class="tk-sve__day">${list.map(item)}</div><div class="tk-sv-btnrow">${covBadge(iso)}<${Button} variant="primary" icon="check" onClick=${() => confirm(list)}>${list.length > 1 ? 'Alle als ausgeführt bestätigen' : 'Als ausgeführt bestätigen'}<//></div>${undo}${tracker}</div>`);
    }
    if (props.view === 'month') {
      const base = new Date(today.getFullYear(), today.getMonth() + off, 1), y = base.getFullYear(), m = base.getMonth();
      const lead = isoWeekday(base) - 1, n = daysInMonth(y, m), cells = Math.ceil((lead + n) / 7) * 7;
      const pastTx = arr(data.transactions).filter((t) => t.type === 'transfer' && t.category === 'Sparen');
      const ym = `${y}-${String(m + 1).padStart(2, '0')}`, sel = ctx.ui.selectedDate?.startsWith(ym) ? ctx.ui.selectedDate : [...byDay.keys()].find((k) => k.startsWith(ym)) || (off === 0 ? toIsoDay(today) : null);
      const selList = byDay.get(sel) || [], selDate = sel ? toDate(sel) : null;
      const nextEx = !selList.length ? all.find((e) => !sel || e.iso > sel) : null;
      const nav = html`<div class="tk-sve__mh"><${Button} size="sm" variant="ghost" icon="chevron-left" aria-label="Vorheriger Monat" disabled=${off <= 0} onClick=${() => setOff(off - 1)} /><strong>${MONTHS_LONG[m]} ${y}</strong><${Button} size="sm" variant="ghost" icon="chevron-right" aria-label="Nächster Monat" disabled=${off >= 12} onClick=${() => setOff(off + 1)} /></div>`;
      return wrap(html`<div class="tk-sve">${nav}<div class="tk-sve__grid" role="grid" aria-label=${`${MONTHS_LONG[m]} ${y}`}>${WEEKDAYS_SHORT.map((w) => html`<div class="tk-sve__wd" role="columnheader">${w}</div>`)}
        ${Array.from({ length: cells }, (_, i) => { const dn = i - lead + 1; if (dn < 1 || dn > n) return html`<div></div>`; const d = new Date(y, m, dn), iso = toIsoDay(d), ex = byDay.get(iso) || [], done = pastTx.filter((t) => toIsoDay(t.date) === iso), sum = ex.reduce((s, e) => s + e.amount, 0), isPast = dayDiff(today, d) < 0;
          return html`<button type="button" class="tk-sve__c" role="gridcell" data-today=${dayDiff(today, d) === 0 ? 'true' : undefined} data-off=${!isTradingDay(d) ? 'true' : undefined} data-out=${isPast && !done.length ? 'true' : undefined} aria-pressed=${sel === iso ? 'true' : 'false'}
            aria-label=${`${fmtDate(d, { style: 'weekday' })}${ex.length ? `: ${plural(ex.length, 'Ausführung', 'Ausführungen')}, ${eur(ctx, sum)}` : done.length ? ': ausgeführt' : ''}${!isTradingDay(d) ? `, ${holidayName(d) || 'kein Handelstag'}` : ''}`} onClick=${() => { ctx.setUi('selectedDate', iso); ctx.emit('calendar.day', { date: iso }); }}>
            <span class="n">${dn}</span><span class="dots">${ex.slice(0, 4).map((e) => html`<i style=${`background:var(--tk-chart-${e.plan.tone || 1})`}></i>`)}${done.slice(0, 4).map(() => html`<i class="done"></i>`)}</span>${ex.length > 0 && html`<span class="a">${eur(ctx, sum)}</span>`}</button>`; })}</div>
        <div class="tk-sv-legend"><span><i style="border:0;width:10px;height:10px;border-radius:50%;background:var(--tk-c-accent)"></i>geplant</span><span><i style="border:2px solid var(--tk-c-success);width:10px;height:10px;border-radius:50%"></i>ausgeführt</span><span>Grau: kein Handelstag</span></div>
        <div class="tk-sve__day" aria-live="polite">${selList.length ? html`<div class="tk-sve__dh"><strong class="tk-grow">${dayHead(ctx, selDate, today)}</strong><span class="tk-sve__amt">${eur(ctx, selList.reduce((s, e) => s + e.amount, 0))}</span>${covBadge(sel)}</div>${selList.map(item)}` : html`<div class="tk-sve__it" style="flex-wrap:wrap"><span class="tk-sv-meta">${selDate ? `${fmtDate(selDate, { style: 'weekday' })}: keine Ausführung${!isTradingDay(selDate) ? ` (${holidayName(selDate) || 'kein Handelstag'})` : ''}.` : 'Tag wählen, um Ausführungen zu sehen.'}</span>${nextEx && html`<${Button} size="sm" variant="ghost" iconRight="chevron-right" onClick=${() => { setOff((nextEx.date.getFullYear() - today.getFullYear()) * 12 + nextEx.date.getMonth() - today.getMonth()); ctx.setUi('selectedDate', nextEx.iso); ctx.emit('calendar.day', { date: nextEx.iso }); }}>Nächste: ${fmtDate(nextEx.date, { style: 'weekday' })}<//>`}</div>`}</div>${undo}${tracker}</div>`);
    }
    let days = [...byDay.entries()];
    const moreDays = props.limit > 0 && days.length > props.limit;
    if (props.limit > 0) days = days.slice(0, props.limit);
    return wrap(html`<div class="tk-sve">${undo}${days.length ? days.map(([iso, list]) => dayBlock(iso, list)) : html`<${EmptyState} icon="calendar-check" title="Keine Ausführung im Zeitraum" text="Alle Pläne sind pausiert oder die Termine liegen weiter in der Zukunft." />`}${moreDays ? html`<${Button} size="sm" variant="ghost" iconRight="chevron-right" onClick=${() => ctx.emit('calendar.open')}>Alle Ausführungen<//>` : ''}${pastBlock}${tracker}</div>`);
  },
};
export default [executionCalendar];
