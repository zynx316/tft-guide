// Finanzen: Budget-Hüllen – jede Kategorie ist eine Hülle mit Rest, Tagesbudget und Verlauf im Monat.
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Card, Button, Icon, EmptyState, Field, Input, Select } from '../../ui.js';
import { envelope, spentByCategory, arr, r2 } from './_calc.js';
import { FIN_CSS, slots, pctx, eur, eur0, Tile } from './_fin.js';
import { ex } from './_example.js';

const STAT = { ok: { icon: 'check-circle-2', col: 'var(--tk-c-accent)' }, warn: { icon: 'alert-triangle', col: 'var(--tk-c-warning)' }, over: { icon: 'alert-triangle', col: 'var(--tk-c-warning)' } };
const num = (v) => { const n = parseFloat(String(v).replace(/\./g, '').replace(',', '.')); return Number.isFinite(n) ? n : 0; };

function BudgetForm({ b, cats, taken, onSave, onRemove }) {
  const [target, setTarget] = useState(b ? String(b.target).replace('.', ',') : '100');
  const free = arr(cats).filter((c) => c.kind === 'variabel' && !taken.includes(c.id));
  const [cat, setCat] = useState(free[0]?.id || '');
  return html`<div class="tk-fn-stack">
    ${!b && html`<${Field} label="Kategorie"><${Select} value=${cat} onChange=${setCat} options=${free.map((c) => ({ value: c.id, label: c.label }))} /><//>`}
    <${Field} label="Monatsbudget in €" hint="Der Rest wird nicht in den nächsten Monat übertragen."><${Input} inputmode="decimal" value=${target} onInput=${setTarget} /><//>
    <div class="tk-fn-actions"><${Button} variant="primary" icon="check" disabled=${num(target) <= 0 || (!b && !cat)} onClick=${() => onSave({ target: r2(num(target)), cat })}>Speichern<//>
    ${b && html`<${Button} variant="ghost" icon="trash-2" onClick=${onRemove}>Hülle entfernen<//>`}</div></div>`;
}

export const finBudgetEnvelopes = {
  id: 'fin-budget-envelopes',
  name: 'Budget-Hüllen',
  category: 'Finanzen',
  description: 'Budgets als Hüllen: Rest, Tagesbudget und Monatsverlauf je Kategorie. Warnfarbe ab 85 %, bei Überschreitung sachlich in Warnton. Hüllen lassen sich anpassen, hinzufügen und entfernen.',
  version: '1.0',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Budgets' },
    { name: 'style', label: 'Darstellung', type: 'select', options: ['bars', 'envelopes', 'attention'], default: 'bars' },
    { name: 'showPace', label: 'Monatsverlauf markieren', type: 'boolean', default: true },
    { name: 'editable', label: 'Anpassen erlauben', type: 'boolean', default: true },
    { name: 'limit', label: 'Max. Hüllen (0 = alle)', type: 'number', default: 0 },
  ],
  data: slots('budgets', 'transactions', 'cats', 'prefs'),
  events: ['budget.open', 'budget.edit', 'budget.add', 'budget.remove'],
  states: ['empty'],
  css: `
  .tk-fnb__rows > * + * { border-top:1px solid var(--tk-c-border); }
  .tk-fnb__line { display:flex; align-items:center; gap:4px; } .tk-fnb__line .tk-btn--icon { flex:none; }
  .tk-fnb__row { flex:1 1 auto; min-width:0; padding:10px 0; display:grid; grid-template-columns:minmax(0,1.1fr) minmax(0,1.4fr) auto; gap:4px 14px; align-items:center; cursor:pointer; background:none; border:0; color:inherit; font:inherit; text-align:left; min-height:48px; }
  .tk-fnb__row:hover { background:var(--tk-c-surface2); }
  .bp-mobile .tk-fnb__row { grid-template-columns:minmax(0,1fr) auto; } .bp-mobile .tk-fnb__row .tk-fnb__track { grid-column:1 / -1; order:2; } .bp-mobile .tk-fnb__row .tk-fnb__stat { order:1; }
  .tk-fnb__track { position:relative; } .tk-fnb__track .tk-fn-bar > i { border-radius:4px; }
  .tk-fnb__tick { position:absolute; top:-3px; bottom:-3px; width:2px; background:var(--tk-c-text); opacity:.55; border-radius:1px; }
  .tk-fnb__grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(min(100%, 210px), 1fr)); gap:var(--tk-space-3); }
  .tk-fnb__env { position:relative; border:1px solid var(--tk-c-border); border-radius:var(--tk-radius-lg); background:var(--tk-c-surface2); }
  .tk-fnb__env > .tk-fnb__open { display:flex; flex-direction:column; gap:10px; width:100%; border:0; background:none; color:inherit; font:inherit; text-align:left; cursor:pointer; padding:var(--tk-space-4); border-radius:var(--tk-radius-lg); min-height:44px; }
  .tk-fnb__env > .tk-fnb__open:hover { background:var(--tk-c-surface3); }
  .tk-fnb__edit { position:absolute; top:6px; right:6px; }
  .tk-fnb__rest { font-size:var(--tk-fs-xl); font-weight:var(--tk-fw-bold); font-variant-numeric:tabular-nums; }
  .tk-fnb__foot { display:flex; flex-wrap:wrap; gap:4px 16px; margin-top:var(--tk-space-3); padding-top:var(--tk-space-3); border-top:1px solid var(--tk-c-border); font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); font-variant-numeric:tabular-nums; }
  .tk-fnb__stat { display:inline-flex; align-items:center; gap:6px; font-size:var(--tk-fs-sm); }`,
  example: { props: { style: 'envelopes' }, data: ex('budgets', 'transactions', 'categories', 'prefs') },
  render: function FinBudgetEnvelopes({ props, data, setData, ctx }) {
    const c = pctx(ctx, data);
    const txs = arr(data.transactions), spent = spentByCategory(txs, ctx.today);
    let list = arr(data.budgets).map((b) => envelope(b, spent, ctx.today, txs.length > 0));
    if (props.style === 'attention') list = list.filter((b) => b.status !== 'ok');
    list.sort((a, b) => b.pct - a.pct);
    const all = arr(data.budgets);
    const addBtn = props.editable && html`<${Button} size="sm" variant="ghost" icon="plus" onClick=${() => edit(null)}>Hülle<//>`;
    function edit(b) {
      ctx.openDialog({ title: b ? `${b.label} anpassen` : 'Hülle hinzufügen', body: (close) => html`<${BudgetForm} b=${b} cats=${data.categories} taken=${all.map((x) => x.category)}
        onSave=${({ target, cat }) => { if (b) setData('budgets', (l) => arr(l).map((x) => (x.id === b.id ? { ...x, target } : x))); else { const m = arr(data.categories).find((x) => x.id === cat); setData('budgets', (l) => [...arr(l), { id: `b-${cat}`.toLowerCase(), label: m?.label || cat, category: cat, target, icon: m?.icon || 'tag', value: 0 }]); } ctx.emit(b ? 'budget.edit' : 'budget.add', { id: b?.id || cat }); ctx.toast('Gespeichert'); close(); }}
        onRemove=${() => { setData('budgets', (l) => arr(l).filter((x) => x.id !== b.id)); ctx.emit('budget.remove', { id: b.id }); ctx.toast(`${b.label} entfernt`); close(); }} />` });
    }
    if (!all.length) return html`<${Card} title=${props.title} icon="wallet" actions=${addBtn}><${EmptyState} icon="wallet" title="Noch keine Budgets" text="Lege für Kategorien wie Lebensmittel eine Hülle an, dann siehst du jederzeit, was übrig ist." action=${props.editable && html`<${Button} variant="primary" icon="plus" onClick=${() => edit(null)}>Budget anlegen<//>`} /><//>`;
    if (!list.length) return html`<${Card} title=${props.title} icon="wallet"><${EmptyState} icon="check-circle-2" title="Alle Budgets im Plan" text="Keine Hülle ist über 85 % gefüllt." /><//>`;
    const shown = props.limit > 0 ? list.slice(0, props.limit) : list;
    const open = (b) => ctx.emit('budget.open', { id: b.id, ui: { filter: b.category } });
    const text = (b) => (b.status === 'over' ? `${eur(c, -b.left)} über dem Budget` : b.status === 'warn' ? `Knapp: noch ${eur(c, b.left)}` : `Noch ${eur(c, b.left)}`);
    const bar = (b) => html`<div class="tk-fnb__track"><div class="tk-fn-bar" role="progressbar" aria-valuenow=${Math.round(b.pct * 100)} aria-valuemin="0" aria-valuemax="100" aria-label=${`${b.label}: ${Math.round(b.pct * 100)} Prozent`}><i style=${`width:${Math.min(100, b.pct * 100)}%;background:${STAT[b.status].col}`}></i></div>
      ${props.showPace && html`<span class="tk-fnb__tick" style=${`left:${b.paceTick * 100}%`} title=${`Nach ${Math.round(b.paceTick * 100)} % des Monats wären ${eur(c, b.expected)} üblich`}></span>`}</div>`;
    const totT = shown.reduce((s, b) => s + b.target, 0), totU = shown.reduce((s, b) => s + b.used, 0);
    const foot = html`<div class="tk-fnb__foot"><span>Zugeteilt ${eur0(c, totT)}</span><span>Ausgegeben ${eur0(c, totU)}</span><span>${totT - totU >= 0 ? `Übrig ${eur0(c, totT - totU)}` : `${eur0(c, totU - totT)} über Plan`}</span></div>`;
    if (props.style === 'envelopes') return html`<${Card} title=${props.title} icon="wallet" actions=${addBtn}><div class="tk-fnb__grid">${shown.map((b) => html`<div class="tk-fnb__env"><button type="button" class="tk-fnb__open" onClick=${() => open(b)} aria-label=${`${b.label}: ${text(b)}`}>
      <div class="tk-fn-row"><${Tile} icon=${b.icon} tone=${b.status === 'ok' ? 'accent' : 'warning'} size=${32} /><span class="tk-fn-title">${b.label}</span></div>
      <div><div class="tk-fnb__rest" style=${b.status !== 'ok' ? 'color:var(--tk-c-warning)' : ''}>${text(b)}</div><div class="tk-fn-sub">${eur(c, b.used)} von ${eur0(c, b.target)}${b.left > 0 ? ` · ${eur(c, b.perDay)} pro Tag` : ''}</div></div>${bar(b)}</button>
      ${props.editable && html`<button type="button" class="tk-btn tk-btn--ghost tk-btn--icon tk-fnb__edit" aria-label=${`${b.label} anpassen`} onClick=${() => edit(b)}><${Icon} name="pencil" size=${15} /></button>`}</div>`)}</div>${foot}<//>`;
    return html`<${Card} title=${props.title} icon="wallet" actions=${addBtn}><div class="tk-fnb__rows">${shown.map((b) => html`<div class="tk-fnb__line"><button type="button" class="tk-fnb__row" onClick=${() => open(b)} aria-label=${`${b.label}: ${text(b)}`}>
      <span class="tk-fn-row"><${Tile} icon=${b.icon} tone=${b.status === 'ok' ? 'accent' : 'warning'} size=${30} /><span class="tk-fn-grow"><span class="tk-fn-title" style="display:block">${b.label}</span><span class="tk-fn-sub">${eur(c, b.used)} von ${eur0(c, b.target)}</span></span></span>
      ${bar(b)}
      <span class="tk-fnb__stat tk-fn-num" style=${b.status !== 'ok' ? 'font-weight:600' : ''}><${Icon} name=${STAT[b.status].icon} size=${14} />${text(b)}</span></button>
      ${props.editable && html`<button type="button" class="tk-btn tk-btn--ghost tk-btn--icon" aria-label=${`${b.label} anpassen`} onClick=${() => edit(b)}><${Icon} name="pencil" size=${15} /></button>`}</div>`)}</div>${foot}<//>`;
  },
};
export default [finBudgetEnvelopes];
