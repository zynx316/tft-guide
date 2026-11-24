// Fitness: Trainingsprogramm – Tage mit Übungen, Sätzen × Wiederholungen, Pausen, letztem Gewicht und Progressionsregel.
import { html } from '../../../lib/html.js';
import { Card, Button, Badge, Icon, Segmented, EmptyState } from '../../ui.js';
import { lastSets, fmtKg } from './_calc.js';
import { MuscleDot, FIT_CSS } from './_ui.js';

function DayBody({ day, lib, history, ctx, props, event }) {
  const sets = day.exercises.reduce((n, e) => n + e.sets, 0);
  return html`<div class="tk-pc">
    <div class="tk-row" style="gap:10px;flex-wrap:wrap"><div class="tk-grow"><div class="tk-h3">${day.name}</div><div class="tk-muted" style="font-size:var(--tk-fs-sm)">${day.weekdayLabel} ${day.time} · ca. ${day.durationMin} Min. · ${sets} Sätze · ${day.focus}</div></div>
      <${Button} variant="primary" icon="play" onClick=${() => ctx.emit(event, { id: day.id })}>Starten<//></div>
    <div class="tk-pc__list">${day.exercises.map((pe) => { const l = lib.find((x) => x.id === pe.exerciseId) || { name: pe.exerciseId, muscle: '' }; const last = lastSets(history, pe.exerciseId);
      const lastTxt = last ? (l.unit === 'kg' ? fmtKg(Math.max(...last.sets.map((s) => s.kg))) : `${last.sets[0].reps} ${l.unit === 's' ? 's' : 'Wdh.'}`) : null;
      return html`<button type="button" class="tk-pc__ex" onClick=${() => { ctx.setUi('selectedId', pe.exerciseId); ctx.emit('exercise.open', { id: pe.exerciseId }); }} aria-label=${`${l.name} öffnen`}>
        <div class="tk-grow" style="min-width:0"><div class="tk-truncate" style="font-weight:600">${l.name}</div><div class="tk-subtle" style="font-size:var(--tk-fs-sm)"><${MuscleDot} muscle=${l.muscle} /></div></div>
        <div class="tk-pc__num"><strong>${pe.sets} × ${pe.repLo}–${pe.repHi}${l.unit === 's' ? ' s' : ''}</strong><span>${lastTxt ? `zuletzt ${lastTxt}` : `Pause ${pe.rest} s`}</span></div></button>`; })}</div></div>`;
}

export const programCard = {
  id: 'program-card',
  name: 'Trainingsprogramm',
  category: 'Fitness',
  description: 'Das aktive Programm: Trainingstage mit Übungen, Sätzen × Wiederholungsbereich, letztem Gewicht und der Progressionsregel. Als Reiter (ein Tag im Detail) oder als Karten aller Tage. „Starten“ öffnet die Einheit des Tages.',
  version: '1.0',
  props: [
    { name: 'layout', label: 'Darstellung', type: 'select', options: ['tabs', 'cards'], default: 'tabs' },
    { name: 'showProgression', label: 'Progressionsregel zeigen', type: 'boolean', default: true },
    { name: 'startEvent', label: 'Event für „Starten“', type: 'text', default: 'plan.start' },
  ],
  data: [
    { slot: 'program', label: 'Programm', default: 'program', shape: '{name,progression,deload,days:[{id,name,exercises:[{exerciseId,sets,repLo,repHi,rest}]}]}', required: true },
    { slot: 'library', label: 'Übungen', default: 'library', shape: 'Übungen[]' },
    { slot: 'history', label: 'Verlauf', default: 'history', shape: 'Einheiten[]' },
  ],
  events: ['plan.start', 'exercise.open', 'day.open'],
  states: ['empty'],
  css: `
  .tk-pc { display:flex; flex-direction:column; gap:var(--tk-space-3); min-width:0; } .tk-pc__list { display:flex; flex-direction:column; }
  .tk-pc__ex { display:flex; align-items:center; gap:var(--tk-space-3); min-height:56px; padding:6px 0; border:0; border-bottom:1px solid var(--tk-c-border); background:none; color:inherit; cursor:pointer; text-align:left; width:100%; } .tk-pc__ex:last-child { border-bottom:0; } .tk-pc__ex:hover { background:var(--tk-c-surface2); }
  .tk-pc__num { display:flex; flex-direction:column; align-items:flex-end; gap:2px; flex:none; font-variant-numeric:tabular-nums; } .tk-pc__num span { font-size:var(--tk-fs-xs); color:var(--tk-c-text-subtle); }
  .tk-pc__rule { display:flex; gap:10px; padding:var(--tk-space-3); border-radius:var(--tk-radius-md); background:var(--tk-c-surface2); color:var(--tk-c-text-muted); font-size:var(--tk-fs-sm); } .tk-pc__rule .icon { color:var(--tk-c-accent); margin-top:2px; }
  .tk-pc__grid { display:grid; gap:var(--tk-space-3); grid-template-columns:repeat(auto-fill, minmax(min(100%, 300px), 1fr)); } .tk-pc__grid > .tk-card { min-width:0; }`,
  example: { data: { program: { name: 'Unter-/Oberkörper/Ganzkörper', progression: 'Doppelte Progression: obere Wiederholungszahl bei allen Sätzen erreicht → nächstes Mal +2,5 kg.', deload: 'Alle 6 Wochen Entlastung.', days: [
    { id: 'upperA', name: 'Oberkörper A', weekdayLabel: 'Mi', time: '18:30', durationMin: 55, focus: 'Brust, Rücken, Schulter', exercises: [{ exerciseId: 'bankdruecken', sets: 3, repLo: 8, repHi: 10, rest: 120 }, { exerciseId: 'rudern-kabel', sets: 3, repLo: 10, repHi: 12, rest: 90 }] }] },
    library: [{ id: 'bankdruecken', name: 'Bankdrücken', muscle: 'Brust', unit: 'kg' }, { id: 'rudern-kabel', name: 'Rudern am Kabel', muscle: 'Rücken', unit: 'kg' }], history: [] } },
  render: function ProgramCard({ props, data, ctx }) {
    const p = data.program; const days = p?.days || [];
    if (!days.length) return html`<${Card} title="Programm"><${EmptyState} icon="clipboard-check" title="Noch kein Programm" text="Wähle eine Vorlage, zum Beispiel Ganzkörper oder Push/Pull/Beine." /><//>`;
    const lib = data.library || [], history = data.history || [];
    const sel = days.find((d) => d.id === (ctx.ui.selectedDay || ctx.ui.selectedId)) || days.find((d) => d.id === 'upperA') || days[0];
    const rule = props.showProgression && html`<div class="tk-pc__rule"><${Icon} name="trending-up" size=${16} /><div><strong style="color:var(--tk-c-text)">Progression.</strong> ${p.progression}${p.deload ? html`<div style="margin-top:4px">${p.deload}</div>` : ''}</div></div>`;
    const bodyProps = { lib, history, ctx, props, event: props.startEvent || 'plan.start' };
    if (props.layout === 'cards') return html`<div class="tk-col" style="gap:var(--tk-space-4)"><div class="tk-pc__grid">${days.map((d) => html`<${Card}><${DayBody} day=${d} ...${bodyProps} /><//>`)}</div>${rule}</div>`;
    return html`<${Card} title=${p.name} icon="clipboard-check"><div class="tk-pc" style="gap:var(--tk-space-4)"><${Segmented} label="Trainingstag" value=${sel.id} onChange=${(v) => { ctx.setUi('selectedDay', v); ctx.emit('day.open', { id: v }); }} options=${days.map((d) => ({ value: d.id, label: d.name }))} />
      <${DayBody} day=${sel} ...${bodyProps} />${rule}</div><//>`;
  },
};
export default [programCard];
