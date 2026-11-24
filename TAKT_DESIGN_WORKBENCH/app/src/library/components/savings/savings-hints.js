// Sparpläne: Hinweise – wenige, priorisierte, sachliche Hinweise (Deckung, Ziele, Ausführung, Dynamik, Freibetrag) mit einer Aktion je Hinweis.
import { html } from '../../../lib/html.js';
import { Card, Button, Icon, EmptyState } from '../../ui.js';
import { fmtDate, fmtRelativeDay } from '../../../lib/format.js';
import { dayDiff, addDays, MONTHS_LONG } from '../../../lib/date.js';
import { arr, obj, todayOf, eur, eur2, Tile, SV_CSS, plural } from './_savings.js';
import { allExecutions, confirmedSet, goalForecast, nextRaise } from './_plans.js';
import { coverageCheck, DEFAULT_BUFFER } from './_coverage.js';

/** Alle möglichen Hinweise, nach Dringlichkeit sortiert (kleinere Zahl zuerst). */
export function buildHints(ctx, data) {
  const today = todayOf(ctx), plans = arr(data.plans), out = [];
  const conf = confirmedSet(data.transactions), buffer = ctx.ui.buffer ?? DEFAULT_BUFFER;
  const cov = coverageCheck({ plans, accounts: data.accounts, subscriptions: data.subscriptions, transactions: data.transactions, today, buffer });
  if (cov.problem) out.push({ id: 'cov', p: 1, tone: 'warning', icon: 'alert-triangle', title: 'Deckung prüfen', text: `Am ${fmtDate(cov.problem.date, { style: 'weekday' })} fehlen ${eur2(ctx, cov.problem.short)} auf dem Girokonto für alle Sparpläne.`, label: 'Deckung ansehen', event: 'hint.coverage' });
  else if (cov.tight) out.push({ id: 'cov', p: 2, tone: 'warning', icon: 'alert-circle', title: 'Es wird knapp', text: `Am ${fmtDate(cov.tight.date, { style: 'weekday' })} bleiben nach den Sparraten ${eur(ctx, cov.tight.free)} über dem Puffer.`, label: 'Deckung ansehen', event: 'hint.coverage' });
  const fc = arr(data.goals).map((g) => goalForecast(g, plans, today)).filter((f) => ['hinterher', 'ohne Rate'].includes(f.status)).sort((a, b) => b.gap - a.gap || b.required - a.required);
  if (fc[0]) { const f = fc[0]; out.push({ id: `goal-${f.goal.id}`, p: 2, tone: 'warning', icon: 'target', title: `${f.goal.name}: mehr Rate nötig`, text: f.status === 'ohne Rate' ? `Bis ${fmtDate(f.due)} wären etwa ${eur(ctx, f.required)} pro Monat nötig. Aktuell ist keine Rate geplant.` : `Mit ${eur(ctx, f.monthly)} pro Monat wird das Ziel nicht bis ${fmtDate(f.due)} erreicht. Nötig wären etwa ${eur(ctx, f.required)}.`, label: 'Ziele ansehen', event: 'hint.goal' }); }
  const exs = allExecutions(plans, today, { perPlan: 4, until: addDays(today, 60) }, conf);
  const first = exs[0];
  if (first) { const day = exs.filter((e) => dayDiff(e.date, first.date) === 0); const n = dayDiff(today, first.date);
    if (n <= 10) out.push({ id: 'exec', p: 3, tone: 'info', icon: 'calendar-check', title: `Nächste Ausführung ${fmtRelativeDay(first.date, today)}`, text: `${fmtDate(first.date, { style: 'weekday' })}: ${eur(ctx, day.reduce((s, e) => s + e.amount, 0))} in ${plural(day.length, 'Plan', 'Plänen')}. Trage sie bei deinem Broker ein und bestätige danach.`, label: 'Ausführungen', event: 'hint.execution' }); }
  const sh = exs.find((e) => e.shifted);
  if (sh) out.push({ id: 'shift', p: 5, tone: 'info', icon: 'calendar-clock', title: 'Termin verschiebt sich', text: `${sh.plan.name}: ${fmtDate(sh.nominal, { style: 'weekday' })} ist kein Handelstag, die Ausführung läuft am ${fmtDate(sh.date, { style: 'weekday' })}.`, label: 'Ausführungen', event: 'hint.execution' });
  const al = obj(data.allowance), daysLeft = dayDiff(today, new Date(today.getFullYear(), 11, 31));
  if (al.total != null && daysLeft >= 0 && daysLeft <= 60) out.push({ id: 'tax', p: 4, tone: 'info', icon: 'scale', title: 'Jahresende: Freibetrag prüfen', text: `Noch ${plural(Math.ceil(daysLeft / 7), 'Woche', 'Wochen')} bis Jahresende. ${eur2(ctx, Math.max(0, al.total - (al.used || 0)))} vom Freistellungsauftrag sind frei (Annahme).`, label: 'Steuern ansehen', event: 'hint.tax' });
  const paused = plans.find((p) => !p.active && p.pausedUntil);
  if (paused) out.push({ id: `pause-${paused.id}`, p: 5, tone: 'info', icon: 'pause', title: `${paused.name} pausiert`, text: `Die Pause endet am ${fmtDate(paused.pausedUntil, { style: 'weekday' })}. Bis dahin gibt es keine Ausführung.`, label: 'Plan ansehen', event: 'hint.plan', detail: { id: paused.id } });
  const raise = plans.map((p) => ({ p, r: nextRaise(p, today) })).filter((x) => x.r && dayDiff(today, x.r.date) <= 150).sort((a, b) => a.r.date - b.r.date)[0];
  if (raise) out.push({ id: `raise-${raise.p.id}`, p: 6, tone: 'info', icon: 'trending-up', title: 'Rate steigt automatisch', text: `${raise.p.name}: ab ${fmtDate(raise.r.date, { style: 'weekday' })} ${eur(ctx, raise.r.to)} statt ${eur(ctx, raise.r.from)} pro Monat.`, label: 'Plan ansehen', event: 'hint.plan', detail: { id: raise.p.id } });
  const ok = arr(data.goals).map((g) => goalForecast(g, plans, today)).filter((f) => f.status === 'im Plan' && f.eta).sort((a, b) => a.eta - b.eta)[0];
  if (ok) out.push({ id: `ok-${ok.goal.id}`, p: 7, tone: 'success', icon: 'check-circle-2', title: `${ok.goal.name}: im Plan`, text: `Bei gleicher Rate voraussichtlich erreicht im ${MONTHS_LONG[ok.eta.getMonth()]} ${ok.eta.getFullYear()} (Modellrechnung).`, label: 'Ziele ansehen', event: 'hint.goal' });
  return out.sort((a, b) => a.p - b.p);
}

export const savingsHints = {
  id: 'savings-hints',
  name: 'Sparplan-Hinweise',
  category: 'Sparpläne',
  description: 'Wenige, priorisierte und sachliche Hinweise aus dem Sparen: Deckung des Girokontos, Ziele mit zu wenig Rate, nächste Ausführung, verschobene Termine, Pausen, automatische Ratensteigerung, Freibetrag zum Jahresende. Je Hinweis genau eine Aktion.',
  version: '1.0',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Hinweise' },
    { name: 'limit', label: 'Max. Hinweise', type: 'number', default: 3 },
    { name: 'skip', label: 'Hinweise auslassen (ID-Anfang: cov, goal, exec, shift, tax, pause, raise, ok)', type: 'list', default: [] },
    { name: 'style', label: 'Darstellung', type: 'select', options: ['list', 'cards'], default: 'list' },
    { name: 'framed', label: 'In Karte', type: 'boolean', default: true },
  ],
  data: [
    { slot: 'plans', label: 'Sparpläne', default: 'plans', shape: '{id,name,monthly,day,active}[]', required: true },
    { slot: 'goals', label: 'Sparziele', default: 'goals', shape: '{id,name,target,current,due,monthly}[]' },
    { slot: 'accounts', label: 'Konten', default: 'accounts', shape: '{id,type,balance}[]' },
    { slot: 'subscriptions', label: 'Fixkosten', default: 'subscriptions', shape: '{id,name,amount,day}[]' },
    { slot: 'transactions', label: 'Buchungen', default: 'transactions', shape: '{id,account,type,amount}[]' },
    { slot: 'allowance', label: 'Freistellungsauftrag', default: 'allowance', shape: '{total,used}' },
  ],
  events: ['hint.coverage', 'hint.goal', 'hint.execution', 'hint.plan', 'hint.tax'],
  states: ['empty'],
  css: `${SV_CSS}
  .tk-svh { display:flex; flex-direction:column; min-width:0; } .tk-svh--cards { display:grid; grid-template-columns:repeat(auto-fit, minmax(250px,1fr)); gap:var(--tk-space-3); }
  .tk-svh__i { display:flex; gap:12px; align-items:flex-start; padding:12px 0; border-bottom:1px solid var(--tk-c-border); min-width:0; } .tk-svh__i:last-child { border-bottom:0; }
  .tk-svh--cards .tk-svh__i { border:1px solid var(--tk-c-border); border-radius:var(--tk-radius-lg); padding:var(--tk-space-4); background:var(--tk-c-surface); flex-direction:column; }
  .tk-svh__i strong { display:block; font-weight:var(--tk-fw-semibold); overflow-wrap:anywhere; } .tk-svh__i p { margin:2px 0 6px; color:var(--tk-c-text-muted); font-size:var(--tk-fs-sm); line-height:var(--tk-lh-snug); }
  .tk-svh__i > div { min-width:0; flex:1; }`,
  example: { data: { plans: [{ id: 'a', name: 'Notgroschen', monthly: 150, day: 1, intervalMonths: 1, active: true, startDate: '2024-01-01', goalId: 'g1' }], goals: [{ id: 'g1', name: 'Japan-Reise', target: 6000, current: 2150, due: '2027-09-01', monthly: 0 }], accounts: [{ id: 'acc-giro', type: 'giro', balance: 3842 }], subscriptions: [], transactions: [], allowance: { total: 1000, used: 312.4 } } },
  render: function SavingsHints({ props, data, ctx }) {
    const skip = Array.isArray(props.skip) ? props.skip : String(props.skip || '').split(',').map((x) => x.trim()).filter(Boolean);
    const list = buildHints(ctx, data).filter((h) => !skip.some((k) => h.id.startsWith(k))).slice(0, props.limit);
    const wrap = (b) => (props.framed && props.style !== 'cards' ? html`<${Card} title=${props.title} icon="lightbulb">${b}<//>` : html`<div>${props.framed ? html`<h3 class="tk-card__title" style="margin-bottom:10px">${props.title}</h3>` : null}${b}</div>`);
    if (!list.length) return wrap(html`<${EmptyState} icon="check-circle-2" title="Nichts zu tun" text="Kein Hinweis offen. Neue erscheinen, wenn Termine, Ziele oder Deckung Aufmerksamkeit brauchen." />`);
    return wrap(html`<div class=${`tk-svh${props.style === 'cards' ? ' tk-svh--cards' : ''}`}>${list.map((h) => html`<div class="tk-svh__i"><${Tile} tone=${h.tone} icon=${h.icon} size=${16} /><div><strong>${h.title}</strong><p>${h.text}</p><${Button} size="sm" variant="ghost" iconRight="chevron-right" onClick=${() => ctx.emit(h.event, h.detail)}>${h.label}<//></div></div>`)}</div>`);
  },
};
export default [savingsHints];
