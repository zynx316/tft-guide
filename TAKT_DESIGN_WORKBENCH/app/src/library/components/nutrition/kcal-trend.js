// Ernährung: Kalorien-Verlauf (Woche/Monat) – neutrale Balken, Zielmarke, Durchschnitt nur über erfasste Tage.
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Card, Button, Segmented, EmptyState } from '../../ui.js';
import { num, avg, inCorridor, wdOf, dayOf, dayLabel, todayIso } from './_calc.js';
import { NU_CSS, arr, obj } from './_ui.js';

export const kcalTrend = {
  id: 'kcal-trend',
  name: 'Kalorien-Verlauf',
  category: 'Ernährung',
  description: 'Balken je Tag für Woche oder Monat mit gestrichelter Zielmarke. Nicht erfasste Tage bleiben leer und zählen nicht in den Durchschnitt; unter drei erfassten Tagen gibt es bewusst keine Statistik. Ohne Rot, ohne Bewertung.',
  version: '1.0',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Verlauf' },
    { name: 'range', label: 'Zeitraum', type: 'select', options: ['week', 'month'], default: 'week' },
    { name: 'switcher', label: 'Umschalter Woche/Monat', type: 'boolean', default: false },
    { name: 'height', label: 'Höhe (px)', type: 'number', default: 150 },
    { name: 'showStats', label: 'Kennzahlen', type: 'boolean', default: true },
    { name: 'linkEvent', label: 'Link „Auswertung“ (Event)', type: 'boolean', default: false },
    { name: 'framed', label: 'In Karte', type: 'boolean', default: true },
  ],
  data: [
    { slot: 'history', label: 'Verlauf', default: 'history', shape: '{date,kcal,protein,logged,partial?}[]', required: true },
    { slot: 'goals', label: 'Ziele', default: 'goals', shape: '{kcal,protein}', required: true },
  ],
  events: ['trend.day', 'trend.range', 'trend.open'],
  states: ['empty'],
  css: `${NU_CSS}
  .tk-kt { display:flex; flex-direction:column; gap:var(--tk-space-4); min-width:0; }
  .tk-kt__plot { position:relative; display:flex; align-items:flex-end; gap:4px; padding-top:8px; }
  .tk-kt--month .tk-kt__plot { gap:2px; }
  .tk-kt__col { flex:1; min-width:0; display:flex; flex-direction:column; align-items:center; justify-content:flex-end; gap:6px; height:100%; border:0; background:transparent; padding:0; color:inherit; font:inherit; cursor:pointer; }
  .tk-kt__bar { width:100%; max-width:34px; border-radius:6px 6px 3px 3px; background:var(--tk-c-accent); opacity:.6; min-height:3px; transition:opacity var(--tk-motion-fast); }
  .tk-kt__col:hover .tk-kt__bar, .tk-kt__col[aria-pressed="true"] .tk-kt__bar { opacity:1; }
  .tk-kt__col[data-state="none"] .tk-kt__bar { background:transparent; border:1.5px dashed var(--tk-c-border-strong); opacity:1; height:14px !important; }
  .tk-kt__col[data-state="partial"] .tk-kt__bar { background:repeating-linear-gradient(135deg, var(--tk-c-accent) 0 5px, color-mix(in srgb, var(--tk-c-accent) 45%, transparent) 5px 10px); opacity:.85; }
  .tk-kt__lab { font-size:var(--tk-nfs-xs); color:var(--tk-c-text-subtle); height:16px; line-height:16px; white-space:nowrap; }
  .tk-kt__goal { position:absolute; left:0; right:0; border-top:1.5px dashed var(--tk-c-text-subtle); pointer-events:none; } .tk-kt__goal span { position:absolute; right:0; top:-19px; font-size:var(--tk-nfs-xs); color:var(--tk-c-text-muted); background:var(--tk-c-surface); padding:0 4px; border-radius:4px; }
  .tk-kt__stats { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:var(--tk-space-3); } .tk-kt__stats div { min-width:0; } .tk-kt__stats strong { display:block; font-size:var(--tk-nfs-lg); font-variant-numeric:tabular-nums; } .tk-kt__stats span { font-size:var(--tk-nfs-xs); color:var(--tk-c-text-subtle); }
  .tk-kt__sel { font-size:var(--tk-nfs-sm); color:var(--tk-c-text-muted); min-height:20px; font-variant-numeric:tabular-nums; }`,
  example: { data: {
    history: [{ date: '2026-11-18', kcal: 2444, protein: 161, logged: true }, { date: '2026-11-19', kcal: 0, protein: 0, logged: false }, { date: '2026-11-20', kcal: 2466, protein: 148, logged: true }, { date: '2026-11-21', kcal: 2089, protein: 125, logged: true }, { date: '2026-11-22', kcal: 2701, protein: 123, logged: true }, { date: '2026-11-23', kcal: 2273, protein: 166, logged: true }, { date: '2026-11-24', kcal: 1490, protein: 69, logged: true, partial: true }],
    goals: { kcal: 2400, protein: 140 },
  } },
  render: function KcalTrend({ props, data, ctx }) {
    const [range, setRange] = useState(props.range);
    const [sel, setSel] = useState(null);
    const goals = obj(data.goals), goal = goals.kcal || 2400;
    const n = range === 'month' ? 28 : 7;
    let rows = arr(data.history).slice(-n);
    const weekly = range === 'month' && ctx.bp === 'mobile'; // schmale Displays: Wochen-Durchschnitte statt 28 Mini-Balken
    if (weekly) rows = [0, 1, 2, 3].map((w) => { const part = rows.slice(w * 7, w * 7 + 7); if (!part.length) return null; const done = part.filter((x) => x.logged && !x.partial); return { date: part[0].date, kcal: Math.round(avg(done, 'kcal')), protein: Math.round(avg(done, 'protein')), logged: done.length > 0, partial: false, week: true, count: done.length }; }).filter(Boolean);
    const wrap = (b) => (props.framed ? html`<${Card} title=${props.title} icon="bar-chart-3" actions=${html`<div class="tk-row" style="gap:6px">${props.switcher && html`<${Segmented} value=${range} onChange=${(r) => { setRange(r); ctx.emit('trend.range', { range: r }); }} options=${[{ value: 'week', label: 'Woche' }, { value: 'month', label: 'Monat' }]} label="Zeitraum" />`}${props.linkEvent && html`<${Button} size="sm" variant="ghost" iconRight="chevron-right" onClick=${() => ctx.emit('trend.open')}>Auswertung<//>`}</div>`}>${b}<//>` : b);
    if (!rows.length) return wrap(html`<${EmptyState} icon="bar-chart-3" title="Noch kein Verlauf" text="Nach ein paar erfassten Tagen siehst du hier deinen Wochenverlauf." />`);
    const done = rows.filter((r) => r.logged && !r.partial);
    const max = Math.max(goal * 1.3, ...rows.map((r) => r.kcal)), H = props.height;
    const enough = (weekly ? arr(data.history).slice(-n).filter((x) => x.logged && !x.partial) : done).length >= 3;
    const src = weekly ? arr(data.history).slice(-n).filter((x) => x.logged && !x.partial) : done;
    const aK = avg(src, 'kcal'), aP = avg(src, 'protein'), cor = src.filter((r) => inCorridor(r.kcal, goal)).length;
    const pick = (r) => { setSel(sel === r.date ? null : r.date); ctx.emit('trend.day', { day: r.date }); };
    const cur = rows.find((r) => r.date === sel);
    const state = (r) => (!r.logged ? 'none' : r.partial ? 'partial' : 'full');
    const body = html`<div class=${`tk-kt tk-kt--${range}`}>
      <div class="tk-kt__plot" style=${`height:${H + 24}px`} role="group" aria-label=${`Kalorien der letzten ${n} Tage`}>
        <div class="tk-kt__goal" style=${`bottom:${(goal / max) * H + 24}px`}><span>Ziel ${num(goal)}</span></div>
        ${rows.map((r) => { const d = dayOf(r.date); const lab = r.week ? `ab ${d.getDate()}.${d.getMonth() + 1}.` : range === 'month' ? (d.getDay() === 1 ? `${d.getDate()}.${d.getMonth() + 1}.` : '') : wdOf(r.date);
          return html`<button type="button" class="tk-kt__col" data-state=${state(r)} aria-pressed=${String(sel === r.date)} onClick=${() => pick(r)} aria-label=${r.week ? `Woche ab ${dayLabel(r.date)}: Durchschnitt ${num(r.kcal)} Kilokalorien` : `${dayLabel(r.date)}: ${r.logged ? `${num(r.kcal)} Kilokalorien${r.partial ? ', Tag läuft noch' : ''}` : 'nicht erfasst'}`}>
            <div class="tk-kt__bar" style=${`height:${r.logged ? Math.max(4, (r.kcal / max) * H) : 14}px`}></div><span class="tk-kt__lab">${lab}</span></button>`; })}</div>
      <div class="tk-kt__sel" aria-live="polite">${cur ? (cur.logged ? (cur.week ? `Woche ab ${dayLabel(cur.date)}: Ø ${num(cur.kcal)} kcal · ${num(cur.protein)} g Eiweiß · ${cur.count} erfasste Tage` : `${dayLabel(cur.date)}: ${num(cur.kcal)} kcal · ${num(cur.protein)} g Eiweiß${cur.partial ? ' · Tag läuft noch' : ''}`) : `${dayLabel(cur.date)}: nicht erfasst. Das ist in Ordnung.`) : 'Tippe auf einen Tag für Details.'}</div>
      ${props.showStats && (enough ? html`<div class="tk-kt__stats"><div><strong>${num(aK)}</strong><span>Ø kcal · erfasste Tage</span></div><div><strong>${cor} von ${src.length}</strong><span>Tage im Zielkorridor (±10 %)</span></div><div><strong>${num(aP)} g</strong><span>Ø Eiweiß</span></div></div>`
        : html`<p class="tk-nu-meta" style="margin:0">Noch zu wenig Daten: Ab drei erfassten Tagen zeigt TAKT Durchschnitte.</p>`)}</div>`;
    return wrap(body);
  },
};
export default [kcalTrend];
