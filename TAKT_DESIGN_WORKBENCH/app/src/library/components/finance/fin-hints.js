// Finanzen: Hinweise nach Priorität – Budget über Plan, Kündigungsfristen, ungenutzte Abos, Deckung am Monatswechsel.
import { html } from '../../../lib/html.js';
import { Card, Button, EmptyState } from '../../ui.js';
import { arr, obj, envelope, spentByCategory, subStats, yearly, safeToSpend, r2 } from './_calc.js';
import { FIN_CSS, slots, pctx, eur, eur0, Tile, shortDate } from './_fin.js';
import { ex } from './_example.js';

export function buildHints({ data, today, c }) {
  const out = [], txs = arr(data.transactions), spent = spentByCategory(txs, today);
  for (const b of arr(data.budgets).map((x) => envelope(x, spent, today, txs.length > 0))) {
    if (b.status === 'over') out.push({ id: `b-${b.id}`, p: 10, tone: 'warning', icon: 'wallet', text: `${b.label} liegt ${eur(c, -b.left)} über dem Budget.`, action: 'Budget', event: 'hint.budget', detail: { id: b.id, ui: { filter: b.category } } });
    else if (b.status === 'warn') out.push({ id: `b-${b.id}`, p: 30, tone: 'info', icon: 'wallet', text: `${b.label}: noch ${eur(c, b.left)} bis zum Limit.`, action: 'Budget', event: 'hint.budget', detail: { id: b.id, ui: { filter: b.category } } });
  }
  const st = subStats(data.subscriptions, data.subMeta, today), meta = obj(data.subMeta);
  for (const s of st.deadlines.filter((x) => !x.cancelPlanned)) { const d = st.deadline(s); out.push({ id: `f-${s.id}`, p: 12 + d / 100, tone: 'warning', icon: 'clock', text: `${s.name}: Kündigungsfrist endet am ${shortDate(c, meta[s.id].cancelBy)} (${d === 0 ? 'heute' : d === 1 ? 'morgen' : `in ${d} Tagen`}).`, action: 'Abos', event: 'hint.sub', detail: { id: s.id } }); }
  for (const s of st.unused.filter((x) => !x.cancelPlanned)) out.push({ id: `u-${s.id}`, p: 40, tone: 'info', icon: 'eye-off', text: `${s.name} seit ${s.lastUsedDays} Tagen nicht genutzt (${eur0(c, yearly(s))} im Jahr).`, action: 'Abos', event: 'hint.sub', detail: { id: s.id } });
  const sg = safeToSpend({ accounts: data.accounts, txs, subs: data.subscriptions, plans: data.plans, events: data.events, today, reserve: 0 });
  if (sg) {
    const out1 = r2(sg.fixedUpcoming + sg.plannedSavings), gap = r2(sg.balance - sg.cardOpen - out1);
    if (out1 > 0) out.push({ id: 'cover', p: gap < 0 ? 11 : 35, tone: gap < 0 ? 'warning' : 'success', icon: gap < 0 ? 'alert-triangle' : 'check-circle-2', text: gap < 0 ? `Am ${shortDate(c, sg.horizon)} fehlen ${eur(c, -gap)} auf dem Girokonto.` : `Am ${shortDate(c, sg.horizon)} gehen ${eur(c, out1)} ab (davon ${eur0(c, sg.plannedSavings)} Sparraten). Das Girokonto deckt alles.`, action: 'Sparpläne', event: 'hint.savings', detail: {} });
    if (sg.cardOpen > 0) out.push({ id: 'card', p: 50, tone: 'info', icon: 'credit-card', text: `Kreditkarte: ${eur(c, sg.cardOpen)} werden am ${shortDate(c, sg.end)} abgerechnet.`, action: 'Konten', event: 'hint.account', detail: {} });
  }
  return out.sort((a, b) => a.p - b.p);
}

export const finHints = {
  id: 'fin-hints',
  name: 'Finanz-Hinweise',
  category: 'Finanzen',
  description: 'Was jetzt Aufmerksamkeit braucht, nach Priorität: Budget über Plan, Kündigungsfristen, ungenutzte Abos, Deckung am Monatswechsel, Kreditkartenabrechnung. Jeder Hinweis führt mit einem Tipp zum passenden Bereich.',
  version: '1.0',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Als Nächstes' },
    { name: 'limit', label: 'Max. Hinweise', type: 'number', default: 3 },
    { name: 'style', label: 'Darstellung', type: 'select', options: ['list', 'cards'], default: 'list' },
    { name: 'hide', label: 'Hinweisarten ausblenden (Events)', type: 'list', default: [] },
  ],
  data: slots('budgets', 'transactions', 'subs', 'subMeta', 'accounts', 'plans', 'events', 'prefs'),
  events: ['hint.budget', 'hint.sub', 'hint.savings', 'hint.account'],
  states: ['empty'],
  css: `
  .tk-fnh__cards { display:grid; grid-template-columns:repeat(auto-fit, minmax(min(100%, 240px), 1fr)); gap:var(--tk-space-3); }
  .tk-fnh__card { display:flex; flex-direction:column; gap:10px; padding:var(--tk-space-4); border-radius:var(--tk-radius-lg); border:1px solid var(--tk-c-border); background:var(--tk-c-surface2); }
  .tk-fnh__row { display:flex; align-items:center; gap:12px; padding:10px 0; min-height:56px; }
  .tk-fnh__txt { flex:1 1 auto; min-width:0; line-height:var(--tk-lh-snug); }`,
  example: { data: ex('budgets', 'transactions', 'subscriptions', 'subMeta', 'accounts', 'plans', 'events', 'prefs') },
  render: function FinHints({ props, data, ctx }) {
    const c = pctx(ctx, data), hide = Array.isArray(props.hide) ? props.hide : String(props.hide || '').split(',').map((x) => x.trim()), all = buildHints({ data, today: ctx.today, c }).filter((h) => !hide.includes(h.event)), list = all.slice(0, props.limit);
    if (!list.length) return html`<${Card} title=${props.title} icon="target"><${EmptyState} icon="check-circle-2" title="Alles im Plan" text="Kein Budget überschritten, keine Frist in Sicht." /><//>`;
    const go = (h) => ctx.emit(h.event, h.detail);
    const btn = (h) => html`<${Button} size="sm" icon=${h.icon === 'x' ? 'x' : undefined} iconRight="chevron-right" onClick=${() => go(h)} aria-label=${`${h.action}: ${h.text}`}>${h.action}<//>`;
    const more = all.length > list.length && html`<p class="tk-fn-sub" style="margin:var(--tk-space-2) 0 0">${all.length - list.length} weitere Hinweise</p>`;
    if (props.style === 'cards') return html`<${Card} title=${props.title} icon="target"><div class="tk-fnh__cards">${list.map((h) => html`<div class="tk-fnh__card"><${Tile} icon=${h.icon} tone=${h.tone} size=${34} /><div class="tk-fnh__txt">${h.text}</div><div>${btn(h)}</div></div>`)}</div>${more}<//>`;
    return html`<${Card} title=${props.title} icon="target"><div class="tk-fn-list">${list.map((h) => html`<div class="tk-fnh__row"><${Tile} icon=${h.icon} tone=${h.tone} size=${34} /><div class="tk-fnh__txt">${h.text}</div>${btn(h)}</div>`)}</div>${more}<//>`;
  },
};
export default [finHints];
