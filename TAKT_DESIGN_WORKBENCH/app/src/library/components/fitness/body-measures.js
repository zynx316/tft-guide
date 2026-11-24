// Fitness: Umfänge und weitere Körperwerte (Taille, Brust, Hüfte, Oberarm, Oberschenkel, Körperfett) mit Verlauf seit dem Start.
import { html } from '../../../lib/html.js';
import { Card, Button, Badge, Icon, Sparkline, EmptyState, Select } from '../../ui.js';
import { isoDay } from '../../../lib/util.js';
import { num, dateShort, r1 } from './_calc.js';
import { Stepper, FIT_CSS, hideVal, weightHidden } from './_ui.js';
import { useState } from 'preact/hooks';

function AddForm({ items, close, onSave }) {
  const [id, setId] = useState(items[0].id); const m = items.find((x) => x.id === id); const [v, setV] = useState(m.points.at(-1)?.value ?? 0);
  return html`<div class="tk-col" style="gap:12px"><label class="tk-field"><span class="tk-field__label">Messwert</span><${Select} value=${id} onChange=${(x) => { setId(x); setV(items.find((i) => i.id === x).points.at(-1)?.value ?? 0); }} options=${items.map((i) => ({ value: i.id, label: i.label }))} /></label>
    <div class="tk-field"><span class="tk-field__label">Wert (${m.unit})</span><${Stepper} label="Messwert" value=${v} step=${0.1} min=${1} max=${250} decimals=${1} unit=${m.unit} onChange=${setV} /></div>
    <div class="tk-row" style="justify-content:flex-end;gap:8px"><${Button} onClick=${close}>Abbrechen<//><${Button} variant="primary" icon="check" onClick=${() => { onSave(id, v); close(); }}>Speichern<//></div></div>`;
}

export const bodyMeasures = {
  id: 'body-measures',
  name: 'Umfänge & Körperwerte',
  category: 'Fitness',
  description: 'Umfänge (Taille, Brust, Hüfte, Oberarm, Oberschenkel) und Körperfett (Waagen-Schätzung) mit Verlauf seit der ersten Messung. Änderungen werden neutral dargestellt, ohne Bewertungsfarbe. Messung per Dialog erfassen; Werte lassen sich ausblenden.',
  version: '1.1',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Umfänge' },
    { name: 'showAdd', label: 'Erfassen-Knopf', type: 'boolean', default: true },
  ],
  data: [{ slot: 'items', label: 'Messwerte', default: 'measures', shape: '{id,label,unit,points:[{date,value}]}[]', required: true }],
  events: ['body.metric', 'body.add-open'],
  states: ['empty'],
  css: `
  .tk-bm__row { display:grid; grid-template-columns:minmax(0,1fr) auto 84px; gap:var(--tk-space-3); align-items:center; min-height:56px; border-bottom:1px solid var(--tk-c-border); } .tk-bm__row:last-child { border-bottom:0; }
  .tk-bm__v { text-align:right; font-variant-numeric:tabular-nums; } .tk-bm__v strong { display:block; font-size:var(--tk-fs-lg); } .tk-bm__v span { font-size:var(--tk-fs-xs); color:var(--tk-c-text-subtle); }
  .bp-mobile .tk-bm__row { grid-template-columns:minmax(0,1fr) auto 60px; gap:var(--tk-space-2); }`,
  example: { data: { items: [{ id: 'waist', label: 'Taille', unit: 'cm', points: [{ date: '2026-08-30', value: 88 }, { date: '2026-11-22', value: 84.8 }] }, { id: 'arm', label: 'Oberarm', unit: 'cm', points: [{ date: '2026-08-30', value: 34.8 }, { date: '2026-11-22', value: 35.6 }] }] } },
  render: function BodyMeasures({ props, data, setData, ctx }) {
    const items = data.items || [];
    if (!items.length) return html`<${Card} title=${props.title}><${EmptyState} icon="ruler" title="Noch keine Messungen" text="Ein Maßband genügt – einmal im Monat reicht für ein gutes Bild." /><//>`;
    const add = () => { ctx.emit('body.add-open'); ctx.openDialog({ title: 'Messung erfassen', body: (close) => html`<${AddForm} items=${items} close=${close} onSave=${(id, v) => { setData('items', (a) => a.map((m) => (m.id === id ? { ...m, points: [...m.points.filter((p) => p.date !== isoDay(ctx.today)), { date: isoDay(ctx.today), value: v }] } : m))); ctx.emit('body.metric', { id, value: v }); ctx.toast('Messung gespeichert'); }} />` }); };
    return html`<${Card} title=${props.title} icon="ruler" actions=${props.showAdd && html`<${Button} size="sm" icon="plus" onClick=${add}>Messung<//>`}>
      ${items.map((m) => { const p = m.points; const first = p[0], last = p.at(-1); const d = r1(last.value - first.value);
        return html`<div class="tk-bm__row"><div class="tk-grow"><div style="font-weight:600">${m.label}</div><div class="tk-subtle" style="font-size:var(--tk-fs-sm)">seit ${dateShort(first.date)}${hideVal(ctx, '') ? '' : ` · ${d > 0 ? '+' : d < 0 ? '−' : '±'}${num(Math.abs(d), 1)} ${m.unit}`}</div></div>
          ${!weightHidden(ctx) && p.length > 1 && html`<${Sparkline} values=${p.map((x) => x.value)} width=${72} height=${26} tone="accent" />`}<div class="tk-bm__v"><strong>${hideVal(ctx, num(last.value, 1))}</strong><span>${m.unit} · ${dateShort(last.date)}</span></div></div>`; })}<//>`;
  },
};
export default [bodyMeasures];
