// Fitness: Rekorde – persönliche Bestwerte je Übung (geschätzte 1RM, Wiederholungen, Haltezeit), ohne Rangliste oder Vergleich.
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Card, Badge, Button, Icon, Segmented, EmptyState } from '../../ui.js';
import { isoDay } from '../../../lib/util.js';
import { exerciseSeries, fmtKg, numAuto, dayShort, diffDays, num } from './_calc.js';
import { muscleColor, FIT_CSS } from './_ui.js';

/** Bestwerte je Übung aus dem Verlauf. */
export function computeRecords(history, library) {
  const out = [];
  for (const lib of library || []) {
    const series = exerciseSeries(history || [], lib.id); if (!series.length) continue;
    const key = lib.unit === 'kg' ? 'e1rm' : 'reps'; let best = null, prev = null;
    for (const s of series) { const v = s[key]; if (v == null) continue; if (!best || v > best[key]) { prev = best; best = s; } }
    if (best) out.push({ id: lib.id, name: lib.name, muscle: lib.muscle, unit: lib.unit, value: best[key], kg: best.kg, reps: best.reps, date: best.date, previous: prev ? prev[key] : null, count: series.length });
  }
  return out.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.name.localeCompare(b.name, 'de')));
}
const icoStyle = (r, fr) => { const c = fr ? 'var(--tk-c-success)' : muscleColor(r.muscle); return `color:${c};background:color-mix(in srgb, ${c} 15%, transparent)`; };
const valueText = (r) => (r.unit === 'kg' ? fmtKg(r.value) : r.unit === 's' ? `${r.value} s` : `${r.value} Wdh.`);
const setText = (r) => (r.unit === 'kg' ? `${numAuto(r.kg, 1)} kg × ${r.reps}` : r.unit === 's' ? 'Haltezeit' : 'in einem Satz');
const deltaText = (r) => (r.previous == null ? 'erster Wert' : `${r.value - r.previous >= 0 ? '+' : '−'}${r.unit === 'kg' ? fmtKg(Math.abs(r.value - r.previous)) : Math.abs(r.value - r.previous)}`);

export const recordsList = {
  id: 'records-list',
  name: 'Rekordliste',
  category: 'Fitness',
  description: 'Persönliche Bestwerte je Übung aus dem Verlauf (geschätztes 1RM nach Epley bis 10 Wiederholungen, bei Körpergewichtsübungen Wiederholungen oder Haltezeit) – mit Datum und Zuwachs. Bewusst ohne Rangliste und Vergleich. Antippen öffnet die Übung.',
  version: '1.3',
  props: [
    { name: 'emptyActionLabel', label: 'Aktion im Leerzustand (leer = keine; führt zum Trainingsplan)', type: 'text', default: '' },
    { name: 'quietEmpty', label: 'Ohne Daten nichts anzeigen (Erststart)', type: 'boolean', default: false },
    { name: 'title', label: 'Titel', type: 'text', default: 'Rekorde' },
    { name: 'view', label: 'Darstellung', type: 'select', options: ['list', 'highlights'], default: 'list' },
    { name: 'limit', label: 'Max. Einträge (0 = alle)', type: 'number', default: 0 },
    { name: 'showRange', label: 'Zeitraum wählbar', type: 'boolean', default: true },
  ],
  data: [
    { slot: 'history', label: 'Verlauf', default: 'history', shape: 'Einheiten[]', required: true },
    { slot: 'library', label: 'Übungen', default: 'library', shape: 'Übungen[]', required: true },
  ],
  events: ['record.open', 'range.change', 'plan.open'],
  states: ['empty'],
  css: `
  .tk-rec__row { display:flex; align-items:center; gap:var(--tk-space-3); padding:8px var(--tk-space-4); min-height:60px; border:0; border-bottom:1px solid var(--tk-c-border); width:100%; background:none; color:inherit; cursor:pointer; text-align:left; min-width:0; } .tk-rec__row:last-child { border-bottom:0; } .tk-rec__row:hover { background:var(--tk-c-surface2); }
  .tk-rec__ico { width:36px; height:36px; border-radius:12px; display:grid; place-items:center; flex:none; } .tk-rec__val { text-align:right; font-variant-numeric:tabular-nums; flex:none; } .tk-rec__val strong { display:block; font-size:var(--tk-fs-lg); }
  .tk-rec__grid { display:grid; gap:var(--tk-space-3); grid-template-columns:repeat(auto-fill, minmax(min(100%, 200px), 1fr)); } .tk-rec__card { display:flex; flex-direction:column; gap:6px; text-align:left; padding:var(--tk-space-4); border-radius:var(--tk-radius-lg); border:1px solid var(--tk-c-border); background:var(--tk-c-surface); color:inherit; cursor:pointer; min-width:0; } .tk-rec__card:hover { border-color:var(--tk-c-border-strong); }
  [data-tk-large-text] .tk-rec__row[data-tight] { flex-wrap:wrap; row-gap:2px; } [data-tk-large-text] .tk-rec__row[data-tight] > .tk-rec__ico { display:none; } [data-tk-large-text] .tk-rec__row[data-tight] > .tk-grow { flex:1 1 100%; } [data-tk-large-text] .tk-rec__row[data-tight] .tk-rec__val { flex:1 1 100%; text-align:left; display:flex; flex-wrap:wrap; align-items:baseline; gap:2px 10px; } [data-tk-large-text] .tk-rec__row[data-tight] .tk-rec__val strong { display:inline; }
  .bp-mobile .tk-rec__grid { grid-template-columns:repeat(2, minmax(0,1fr)); gap:var(--tk-space-2); } .bp-mobile .tk-rec__card { padding:var(--tk-space-3); }`,
  example: { data: { history: [
    { id: 'h1', date: '2026-10-28', exercises: [{ exerciseId: 'bankdruecken', sets: [{ type: 'work', kg: 57.5, reps: 10 }] }] }, { id: 'h2', date: '2026-11-18', exercises: [{ exerciseId: 'bankdruecken', sets: [{ type: 'work', kg: 60, reps: 10 }] }] }],
    library: [{ id: 'bankdruecken', name: 'Bankdrücken', muscle: 'Brust', unit: 'kg' }] } },
  render: function RecordsList({ props, data, ctx }) {
    const [range, setRange] = useState('8 Wochen');
    const all = computeRecords(data.history, data.library); const today = isoDay(ctx.today);
    const cutoff = range === '4 Wochen' ? 28 : 999;
    const rows = all.filter((r) => diffDays(today, r.date) <= cutoff); const shown = props.limit > 0 ? rows.slice(0, props.limit) : rows;
    const head = props.showRange && html`<${Segmented} label="Zeitraum" value=${range} onChange=${(v) => { setRange(v); ctx.emit('range.change', { range: v }); }} options=${['4 Wochen', '8 Wochen'].map((v) => ({ value: v, label: v }))} />`;
    const open = (r) => { ctx.setUi('selectedId', r.id); ctx.emit('record.open', { id: r.id }); };
    const tight = !!ctx.largeText && (ctx.blockWidth || ctx.width || 390) < 220 * (ctx.textScale || 1); // schmal bei großer Schrift: Wert unter den Titel, ohne Kachel
    const fresh = (r) => diffDays(today, r.date) <= 14;
    if (!shown.length && !all.length && props.quietEmpty) return null;
    if (!shown.length) return html`<${Card} title=${props.title} actions=${all.length ? head : null}><${EmptyState} icon="trophy" title=${all.length ? 'Keine neuen Bestwerte' : 'Noch keine Rekorde'} text=${all.length ? 'In diesem Zeitraum gab es keinen neuen Bestwert – Konstanz zählt genauso.' : 'Nach den ersten Einheiten erscheinen hier deine Bestwerte.'} action=${!all.length && props.emptyActionLabel && html`<${Button} variant="primary" icon="arrow-right" onClick=${() => ctx.emit('plan.open', { to: 'fitness.plan' })}>${props.emptyActionLabel}<//>`} /><//>`;
    if (props.view === 'highlights') return html`<div class="tk-col" style="gap:var(--tk-space-3)"><div class="tk-row"><h3 class="tk-h3 tk-grow">${props.title}</h3>${head}</div><div class="tk-rec__grid">${shown.map((r) => html`<button type="button" class="tk-rec__card" onClick=${() => open(r)} aria-label=${`${r.name}: ${valueText(r)} – öffnen`}>
      <span class="tk-rec__ico" style=${icoStyle(r, fresh(r))}><${Icon} name=${fresh(r) ? 'trophy' : 'medal'} size=${18} /></span>
      <span class="tk-truncate" style="font-weight:600;max-width:100%">${r.name}</span><span class="tk-fit-big" style="font-size:var(--tk-fs-2xl)">${valueText(r)}</span><span class="tk-subtle" style="font-size:var(--tk-fs-sm)">${setText(r)} · ${dayShort(r.date)}</span>${fresh(r) && html`<${Badge} tone="success">${deltaText(r)}<//>`}</button>`)}</div></div>`;
    return html`<${Card} flush title=${props.title} actions=${head}>${shown.map((r) => html`<button type="button" class="tk-rec__row" data-tight=${tight ? 'true' : undefined} onClick=${() => open(r)} aria-label=${`${r.name}: ${valueText(r)} – Verlauf öffnen`}>
      <span class="tk-rec__ico" style=${icoStyle(r, fresh(r))}><${Icon} name=${fresh(r) ? 'trophy' : 'medal'} size=${17} /></span>
      <div class="tk-grow"><div class="tk-truncate" style="font-weight:600">${r.name}</div><div class="tk-subtle tk-truncate" style="font-size:var(--tk-fs-sm)">${setText(r)} · ${dayShort(r.date)}</div></div>
      <div class="tk-rec__val"><strong>${valueText(r)}</strong>${fresh(r) ? html`<${Badge} tone="success">${deltaText(r)}<//>` : html`<span class="tk-subtle" style="font-size:var(--tk-fs-xs)">${r.unit === 'kg' ? '1RM geschätzt' : ''}</span>`}</div></button>`)}<//>`;
  },
};
export default [recordsList];
