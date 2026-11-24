// Trading: Hinweise nach Priorität – Alarm nah, simulierte Orders offen, Sparplan-Termin, Abweichung vom Zielwert. Sachlich, keine Empfehlung.
import { html } from '../../../lib/html.js';
import { Card, EmptyState, Icon } from '../../ui.js';
import { money } from '../../helpers.js';
import { fmtPercent, fmtPP, fmtDate, fmtRelativeDay } from '../../../lib/format.js';
import { toIsoDay, dayDiff } from '../../../lib/date.js';
import { arr, byId, alertInfo, known, holdings, planExecutions, sum } from './_calc.js';
import { slots, Px, Tile, TRD_CSS } from './_trd.js';
import { groupsOf } from './allocation.js';
import { ex } from './_example.js';

/** Hinweise als Daten: { id, tone, icon, text, event, to, params }. Höhere Priorität zuerst. */
export function buildHints(data, ctx, tol = 2) {
  const out = [], ok = known(data.positions, data.watchlist), name = (id) => { const i = byId(data.instruments, id); return i ? i.short || i.name : '–'; };
  for (const a of arr(data.alerts).filter((x) => x.status === 'aktiv' && ok(x))) {
    const s = alertInfo(a, byId(data.instruments, a.securityId));
    if (s.near) out.push({ id: `h-al-${a.id}`, tone: 'warning', icon: 'bell', event: 'hint.alert', to: 'trading.detail', params: { id: a.securityId }, text: html`${name(a.securityId)} liegt ${fmtPercent(s.dist, { digits: 1 })} von deiner Marke ${a.dir === 'above' ? 'über' : 'unter'} <${Px} v=${a.price} /> entfernt.` });
  }
  for (const a of arr(data.alerts).filter((x) => x.status === 'ausgelöst' && ok(x) && x.triggeredAt && dayDiff(x.triggeredAt, ctx.today) <= 1)) out.push({ id: `h-hit-${a.id}`, tone: 'success', icon: 'check-circle-2', event: 'hint.alert', to: 'trading.alerts', text: html`Alarm erreicht: ${name(a.securityId)} ${a.dir === 'above' ? 'über' : 'unter'} <${Px} v=${a.price} />.` });
  const open = arr(data.orders).filter((o) => o.status === 'offen' && ok(o));
  if (open.length) out.push({ id: 'h-orders', tone: 'info', icon: 'flask-conical', event: 'hint.order', to: 'trading.order', text: `${open.length} offene simulierte Order${open.length > 1 ? 's' : ''}: ${open.map((o) => `${o.side === 'buy' ? 'Kauf' : 'Verkauf'} ${name(o.securityId)}`).join(', ')}.` });
  const ex_ = planExecutions(data.plans, data.positions, ctx.today, 6), first = ex_[0];
  if (first && dayDiff(ctx.today, first.date) <= 10) {
    const day = ex_.filter((e) => toIsoDay(e.date) === toIsoDay(first.date)), due = sum(day, (e) => e.amount), giro = arr(data.accounts).find((a) => a.type === 'giro');
    out.push({ id: 'h-plan', tone: giro && giro.balance < due ? 'warning' : 'info', icon: 'repeat', event: 'hint.plan', to: 'savings.calendar', text: html`${fmtRelativeDay(first.date, ctx.today) === 'heute' ? 'Heute' : fmtDate(first.date, { style: 'weekday' })}: ${day.length} Sparplan-Ausführung${day.length > 1 ? 'en' : ''} über ${money(ctx, due)}${giro ? (giro.balance >= due ? ', das Girokonto deckt sie.' : `, auf dem Girokonto fehlen ${money(ctx, due - giro.balance)}.`) : '.'}` });
  }
  const hd = holdings(data.positions, data.cash);
  if (hd.rows.length && Object.keys(data.targets || {}).length) { const g = groupsOf(hd, data.targets, 'position').filter((x) => x.soll != null).map((x) => ({ ...x, d: x.ist - x.soll })).sort((a, b) => Math.abs(b.d) - Math.abs(a.d))[0];
    if (g && Math.abs(g.d) > tol / 100) out.push({ id: 'h-alloc', tone: 'info', icon: 'pie-chart', event: 'hint.alloc', to: 'trading.performance', text: `${g.label} liegt ${fmtPP(Math.abs(g.d), { sign: false })} ${g.d > 0 ? 'über' : 'unter'} deinem Zielwert.` }); }
  return out;
}

export const trdHints = {
  id: 'trd-hints',
  name: 'Hinweise Trading',
  category: 'Trading',
  description: 'Priorisierte, sachliche Hinweise: Kursalarm nah an der Marke, simulierte Orders offen, nächste Sparplan-Abbuchung mit Deckungs-Check, Abweichung vom Zielwert. Antippen führt zum passenden Bereich. Keine Kauf- oder Verkaufsempfehlungen.',
  version: '1.0',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Wichtig' },
    { name: 'limit', label: 'Max. Hinweise', type: 'number', default: 4 },
    { name: 'tolerance', label: 'Toleranz Abweichung (PP)', type: 'number', default: 2 },
  ],
  data: slots('alerts', 'instruments', 'positions', 'watchlist', 'orders', 'plans', 'accounts', 'cash', 'targets'),
  events: ['hint.alert', 'hint.order', 'hint.plan', 'hint.alloc'],
  states: ['empty'],
  css: `${TRD_CSS}
  .tk-trd-hn { display:flex; align-items:center; gap:12px; padding:10px 4px; min-height:56px; width:100%; background:none; border:0; color:inherit; font:inherit; text-align:left; cursor:pointer; border-radius:var(--tk-radius-md); } .tk-trd-hn:hover { background:var(--tk-c-surface2); }`,
  example: { data: ex('alerts', 'instruments', 'positions', 'watchlist', 'orders', 'plans', 'accounts', 'cash', 'targets') },
  render: function TrdHints({ props, data, ctx }) {
    const list = buildHints(data, ctx, props.tolerance).slice(0, props.limit);
    if (!list.length) return html`<${Card} title=${props.title} icon="info"><${EmptyState} icon="check-circle-2" title="Alles ruhig" text="Keine Alarme in der Nähe, keine offenen Orders und kein Sparplan-Termin in den nächsten Tagen." /><//>`;
    return html`<${Card} title=${props.title} icon="info"><div class="tk-trd-list">${list.map((h) => html`<button type="button" class="tk-trd-hn" onClick=${() => { if (h.params?.id) ctx.setUi('selectedId', h.params.id); ctx.emit(h.event, { to: h.to, ...(h.params || {}) }); }}>
      <${Tile} icon=${h.icon} tone=${h.tone} size=${34} /><span class="tk-trd-grow" style="min-width:0">${h.text}</span><${Icon} name="chevron-right" size=${16} /></button>`)}</div><//>`;
  },
};
export default [trdHints];
