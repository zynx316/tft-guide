// Fitness: Muskelgruppen-Balance – Sätze pro Woche je Muskelgruppe gegen einen Orientierungskorridor (Balken oder Netz).
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Card, Badge, Icon, Segmented, EmptyState } from '../../ui.js';
import { isoDay, addDays } from '../../../lib/util.js';
import { MUSCLES, SET_CORRIDOR, setsByMuscle, plannedSets, num } from './_calc.js';
import { muscleColor, FIT_CSS } from './_ui.js';

const status = (v, [lo, hi]) => (v < lo ? { t: 'etwas wenig', tone: 'info' } : v > hi ? { t: 'viel', tone: 'neutral' } : { t: 'im Korridor', tone: 'success' });

function Radar({ rows, size = 300, onPick }) {
  const c = size / 2, R = size / 2 - 52; const ang = (i) => (Math.PI * 2 * i) / rows.length - Math.PI / 2;
  const pt = (i, f) => [c + Math.cos(ang(i)) * R * f, c + Math.sin(ang(i)) * R * f]; const poly = (fs) => fs.map((f, i) => pt(i, f).join(',')).join(' ');
  return html`<svg viewBox=${`0 0 ${size} ${size}`} class="tk-bal__radar" role="img" aria-label="Muskelgruppen-Balance als Netz">
    ${[0.4, 1].map((f) => html`<polygon points=${poly(rows.map(() => f))} fill="none" stroke="var(--tk-c-border)" stroke-dasharray=${f === 1 ? '' : '3 4'} />`)}
    <polygon points=${poly(rows.map(() => 0.8))} fill="var(--tk-c-success)" fill-opacity=".07" stroke="var(--tk-c-success)" stroke-width="1.5" stroke-dasharray="4 3" />
    <polygon points=${poly(rows.map((r) => Math.min(1.25, r.v / r.hi) * 0.8))} fill="var(--tk-c-accent)" fill-opacity=".18" stroke="var(--tk-c-accent)" stroke-width="2" stroke-linejoin="round" />
    ${rows.map((r, i) => { const [x, y] = pt(i, 1.17); return html`<g style="cursor:pointer" onClick=${() => onPick(r.m)}><circle cx=${pt(i, Math.min(1.25, r.v / r.hi) * 0.8)[0]} cy=${pt(i, Math.min(1.25, r.v / r.hi) * 0.8)[1]} r="4" fill=${muscleColor(r.m)} /><text x=${x} y=${y + 4} text-anchor="middle" fill="var(--tk-c-text-muted)" style="font-size:11.5px;font-weight:600">${r.m}</text></g>`; })}</svg>`;
}

export const muscleBalance = {
  id: 'muscle-balance',
  name: 'Muskelgruppen-Balance',
  category: 'Fitness',
  description: 'Sätze pro Woche je Muskelgruppe (indirekte Sätze zählen halb) gegen einen Orientierungskorridor – als Balken oder Netz. Zeigt freundlich, was etwas zu kurz kommt, ohne Wertung. Antippen öffnet die Übungen dieser Gruppe.',
  version: '1.0',
  props: [
    { name: 'view', label: 'Darstellung', type: 'select', options: ['bars', 'radar'], default: 'bars' },
    { name: 'title', label: 'Titel', type: 'text', default: 'Balance pro Woche' },
    { name: 'source', label: 'Startquelle', type: 'select', options: ['Letzte 4 Wochen', 'Plan'], default: 'Letzte 4 Wochen' },
    { name: 'showSuggestion', label: 'Hinweis „Was kommt zu kurz?“', type: 'boolean', default: true },
  ],
  data: [
    { slot: 'history', label: 'Verlauf', default: 'history', shape: 'Einheiten[]', required: true },
    { slot: 'library', label: 'Übungen', default: 'library', shape: 'Übungen[]', required: true },
    { slot: 'program', label: 'Programm', default: 'program', shape: '{days}' },
  ],
  events: ['balance.open', 'balance.source'],
  states: ['empty'],
  css: `
  .tk-bal { display:flex; flex-direction:column; gap:var(--tk-space-4); } .tk-bal__row { display:grid; grid-template-columns:96px minmax(0,1fr) 92px; gap:var(--tk-space-3); align-items:center; min-height:44px; border:0; background:none; color:inherit; padding:0; cursor:pointer; text-align:left; width:100%; }
  .tk-bal__track { position:relative; height:12px; border-radius:6px; background:var(--tk-c-surface3); } .tk-bal__band { position:absolute; top:0; bottom:0; background:var(--tk-c-success); opacity:.22; border-radius:6px; } .tk-bal__fill { position:absolute; left:0; top:2px; bottom:2px; border-radius:4px; }
  .tk-bal__val { text-align:right; font-variant-numeric:tabular-nums; font-weight:var(--tk-fw-semibold); } .tk-bal__val small { display:block; font-weight:var(--tk-fw-regular); color:var(--tk-c-text-subtle); font-size:var(--tk-fs-xs); }
  .tk-bal__radar { width:100%; max-width:320px; margin:0 auto; display:block; } .tk-bal__tip { display:flex; gap:10px; padding:var(--tk-space-3); border-radius:var(--tk-radius-md); background:var(--tk-c-surface2); font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); } .tk-bal__tip .icon { color:var(--tk-c-accent); margin-top:2px; }
  .bp-mobile .tk-bal__row { grid-template-columns:78px minmax(0,1fr) 70px; gap:var(--tk-space-2); }`,
  example: { data: { history: [{ id: 'h', date: '2026-11-18', exercises: [{ exerciseId: 'bankdruecken', sets: [{ type: 'work', kg: 60, reps: 10 }, { type: 'work', kg: 60, reps: 10 }, { type: 'work', kg: 60, reps: 10 }] }, { exerciseId: 'latziehen', sets: [{ type: 'work', kg: 50, reps: 10 }, { type: 'work', kg: 50, reps: 10 }] }] }],
    library: [{ id: 'bankdruecken', name: 'Bankdrücken', muscle: 'Brust', secondary: ['Trizeps'], equipment: 'Langhantel', type: 'Verbund' }, { id: 'latziehen', name: 'Latziehen', muscle: 'Rücken', secondary: ['Bizeps'], equipment: 'Kabel', type: 'Verbund' }, { id: 'kabel-fliegende', name: 'Kabelzug-Fliegende', muscle: 'Brust', secondary: [], equipment: 'Kabel', type: 'Isolation' }], program: { days: [] } } },
  render: function MuscleBalance({ props, data, ctx }) {
    const [src, setSrc] = useState(props.source || 'Letzte 4 Wochen');
    const lib = data.library || [], hist = data.history || [];
    if (!lib.length || !hist.length) return html`<${Card} title=${props.title}><${EmptyState} icon="chart-pie" title="Noch keine Daten" text="Nach ein paar Einheiten siehst du hier, wie sich dein Training auf die Muskelgruppen verteilt." /><//>`;
    const from = isoDay(addDays(ctx.today, -28)); const sets = src === 'Plan' ? plannedSets(data.program, lib) : Object.fromEntries(Object.entries(setsByMuscle(hist.filter((h) => h.date > from), lib)).map(([k, v]) => [k, v / 4]));
    const rows = MUSCLES.map((m) => ({ m, v: Math.round(sets[m] * 10) / 10, lo: SET_CORRIDOR[m][0], hi: SET_CORRIDOR[m][1] }));
    const lowest = [...rows].filter((r) => r.v < r.lo).sort((a, b) => a.v / a.lo - b.v / b.lo)[0];
    const sugg = lowest && lib.find((l) => l.muscle === lowest.m && l.type === 'Isolation');
    const pick = (m) => { ctx.emit('balance.open', { ui: { filter: m } }); };
    const max = Math.max(...rows.map((r) => Math.max(r.v, r.hi))) * 1.08;
    const tip = props.showSuggestion && html`<div class="tk-bal__tip"><${Icon} name="lightbulb" size=${16} /><span>${lowest ? html`<strong style="color:var(--tk-c-text)">${lowest.m}</strong> liegt mit ${num(lowest.v, 1)} Sätzen pro Woche etwas unter dem Orientierungsbereich (${lowest.lo}–${lowest.hi}).${sugg ? ` Eine Idee: ${sugg.name} ergänzen.` : ''}` : 'Alle Muskelgruppen liegen im Orientierungsbereich – die Verteilung passt.'}</span></div>`;
    const sel = html`<${Segmented} label="Datenquelle" value=${src} onChange=${(v) => { setSrc(v); ctx.emit('balance.source', { source: v }); }} options=${['Letzte 4 Wochen', 'Plan'].map((v) => ({ value: v, label: v }))} />`;
    return html`<${Card} title=${props.title} actions=${sel}><div class="tk-bal">
      ${props.view === 'radar' ? html`<${Radar} rows=${rows} onPick=${pick} />` : rows.map((r) => { const st = status(r.v, [r.lo, r.hi]); return html`<button type="button" class="tk-bal__row" onClick=${() => pick(r.m)} aria-label=${`${r.m}: ${num(r.v, 1)} Sätze pro Woche, ${st.t}`}>
        <span class="tk-fit-mus" style="font-weight:600;color:var(--tk-c-text)"><i style=${`background:${muscleColor(r.m)}`}></i>${r.m}</span>
        <span class="tk-bal__track"><span class="tk-bal__band" style=${`left:${(r.lo / max) * 100}%;width:${((r.hi - r.lo) / max) * 100}%`}></span><span class="tk-bal__fill" style=${`width:${Math.max(2, (r.v / max) * 100)}%;background:${muscleColor(r.m)}`}></span></span>
        <span class="tk-bal__val">${num(r.v, 1)}<small>${st.t}</small></span></button>`; })}
      <div class="tk-row" style="gap:8px;flex-wrap:wrap"><${Badge} tone="success">Korridor = Orientierung<//><span class="tk-subtle" style="font-size:var(--tk-fs-xs)">Sätze pro Woche, indirekte zählen halb – ein Richtwert, kein Soll.</span></div>${tip}</div><//>`;
  },
};
export default [muscleBalance];
