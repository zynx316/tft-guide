// Fitness: Satz-Logger – alle Übungen einer Einheit mit Vorgabe, „Vorher“-Werten, Steppern und 1-Tap-Haken.
import { html } from '../../../lib/html.js';
import { useState, useEffect } from 'preact/hooks';
import { Card, Button, Badge, Icon, EmptyState } from '../../ui.js';
import { fmtKg } from './_calc.js';
import { liveExercises } from './_session.js';
import { Stepper, MuscleDot, FIT_CSS } from './_ui.js';
import { useOps, prevText, setLabel, pbText, LOGGER_CSS } from './_logger.js';

const unitLabel = (ex) => (ex.unit === 's' ? 'Sek.' : 'Wdh.');

function SetRow({ ex, st, i, ops, mode }) {
  const kgUnit = ex.unit === 'kg', warm = st.type === 'warm';
  const prev = st.prevReps != null ? (kgUnit ? `${fmtKg(st.prevKg)} × ${st.prevReps}` : `${st.prevReps}`) : '–';
  return html`<div class=${`tk-sl-row ${kgUnit ? '' : 'tk-sl-row--one'}`} data-done=${String(!!st.done)} data-warm=${String(warm)}>
    <span class="tk-sl-nr" title=${warm ? 'Aufwärmsatz' : `Arbeitssatz ${setLabel(ex, i)}`}>${setLabel(ex, i)}</span>
    ${html`<span class="tk-sl-prev" title="Letztes Mal">${prev}</span>`}
    ${kgUnit && html`<${Stepper} label=${`Gewicht Satz ${setLabel(ex, i)}`} value=${st.kg} step=${ex.step} min=${0} max=${600} disabled=${ops.locked} onChange=${(v) => ops.edit(ex, st, { kg: v })} />`}
    <${Stepper} label=${`${unitLabel(ex)} Satz ${setLabel(ex, i)}`} value=${st.reps} step=${ex.unit === 's' ? 5 : 1} min=${0} max=${ex.unit === 's' ? 600 : 100} disabled=${ops.locked} onChange=${(v) => ops.edit(ex, st, { reps: v })} />
    <button type="button" class="tk-sl-ok" aria-pressed=${String(!!st.done)} aria-label=${`Satz ${setLabel(ex, i)} ${st.done ? 'zurücknehmen' : 'abhaken'}`} disabled=${ops.locked && !st.done} onClick=${() => ops.toggle(ex, st)}><${Icon} name="check" size=${20} stroke=${3} /></button>
  </div>`;
}

function Dots({ ex }) { return html`<span class="tk-sl-dots" aria-hidden="true">${ex.sets.map((x) => html`<i data-done=${String(!!x.done)} data-warm=${String(x.type === 'warm')}></i>`)}</span>`; }

function ExerciseBlock({ ex, cur, ops, props }) {
  const [open, setOpen] = useState(props.mode === 'rows' || cur);
  useEffect(() => { if (cur) setOpen(true); }, [cur]);
  const done = ex.sets.filter((x) => x.done).length, hint = [ex.hint, pbText(ex)].filter(Boolean);
  const head = html`<div class="tk-sl-head"><button type="button" class="tk-fit-link tk-sl-name tk-truncate" onClick=${() => ops.open(ex)} aria-label=${`${ex.name} – Details`}>${ex.name}</button>
    ${ex.pr && html`<${Badge} tone="success" icon="trophy">Bestwert<//>`}<span class="tk-grow"></span>
    ${props.mode === 'cards' && html`<${Dots} ex=${ex} />`}<span class="tk-subtle tk-num" style="font-size:var(--tk-fs-sm)">${done}/${ex.sets.length}</span>
    ${!ops.locked && html`<${Button} variant="ghost" size="sm" icon="refresh-cw" aria-label=${`${ex.name} ersetzen`} onClick=${() => ops.swap(ex)} /><${Button} variant="ghost" size="sm" icon="x" aria-label=${`${ex.name} auslassen`} onClick=${() => ops.skip(ex)} />`}</div>`;
  if (ex.skipped) return html`<section class="tk-sl-ex tk-sl-ex--skipped"><div class="tk-sl-head"><span class="tk-grow tk-truncate tk-muted">${ex.name} – ausgelassen</span><${Button} size="sm" icon="undo-2" onClick=${() => ops.skip(ex, false)}>Rückgängig<//></div></section>`;
  return html`<section class=${`tk-sl-ex ${cur ? 'tk-sl-ex--current' : ''}`}>${head}<div class="tk-row" style="gap:10px;flex-wrap:wrap"><${MuscleDot} muscle=${ex.muscle} /><span class="tk-subtle" style="font-size:var(--tk-fs-sm)">${ex.equipment} · ${ex.sets.filter((x) => x.type === 'work').length} × ${ex.repLo}–${ex.repHi}${ex.unit === 's' ? ' Sek.' : ''}</span>${prevText(ex) && html`<span class="tk-sl-last tk-subtle">Letztes Mal ${prevText(ex)}</span>`}
      ${props.mode === 'cards' && html`<button type="button" class="tk-fit-link tk-subtle" style="margin-left:auto;font-size:var(--tk-fs-sm)" aria-expanded=${String(open)} onClick=${() => setOpen(!open)}>${open ? 'Einklappen' : 'Sätze zeigen'}</button>`}</div>
    ${props.showHints && hint.length > 0 && (open || cur) && html`<div class="tk-sl-hint"><${Icon} name="lightbulb" size=${15} /><span>${hint.join(' · ')}</span></div>`}
    ${open && html`<div class="tk-sl-rows">${html`<div class="tk-sl-cols"><span></span><span>Vorher</span>${ex.unit === 'kg' && html`<span>kg</span>`}<span>${unitLabel(ex)}</span><span></span></div>`}
      ${ex.sets.map((st, i) => html`<${SetRow} ex=${ex} st=${st} i=${i} ops=${ops} mode=${props.mode} />`)}
      ${!ops.locked && html`<div><${Button} size="sm" variant="ghost" icon="plus" onClick=${() => ops.add(ex)}>Satz hinzufügen<//></div>`}</div>`}
  </section>`;
}

export const setLogger = {
  id: 'set-logger',
  name: 'Satz-Logger',
  category: 'Fitness',
  description: 'Alle Übungen der Einheit mit Sätzen: Vorgabe aus dem letzten Training, „Vorher“-Werte, kg- und Wiederholungs-Stepper (Dezimalkomma), 1-Tap-Haken, Übung tauschen oder auslassen, Bestwert-Hinweis. Modus „rows“ (dicht) oder „cards“ (Karte je Übung mit Fortschrittspunkten).',
  version: '1.2',
  props: [
    { name: 'quietEmpty', label: 'Ohne Einheit nichts anzeigen (Erststart)', type: 'boolean', default: false },
    { name: 'mode', label: 'Darstellung', type: 'select', options: ['rows', 'cards'], default: 'rows' },
    { name: 'showHints', label: 'Vorschläge zeigen', type: 'boolean', default: true },
    { name: 'prHints', label: 'Bestwert-Hinweis', type: 'boolean', default: true },
  ],
  data: [
    { slot: 'session', label: 'Live-Einheit', default: 'session', shape: '{status,exercises:[{id,exerciseId,name,muscle,unit,step,sets:[{id,type,kg,reps,done,prevKg,prevReps}]}]}', required: true },
    { slot: 'library', label: 'Übungsbibliothek', default: 'library', shape: 'Übungen[] (für „Ersetzen“)' },
    { slot: 'history', label: 'Verlauf', default: 'history', shape: 'Einheiten[] (für „Ersetzen“)' },
  ],
  events: ['set.complete', 'set.edit', 'set.add', 'set.remove', 'exercise.swap', 'exercise.skip', 'exercise.open', 'pr.hit'],
  states: ['empty'],
  css: `${FIT_CSS}${LOGGER_CSS}
  .tk-sl { display:flex; flex-direction:column; gap:var(--tk-space-3); }
  .tk-sl-ex { background:var(--tk-c-surface); border:1px solid var(--tk-c-border); border-radius:var(--tk-radius-lg); padding:var(--tk-space-4); display:flex; flex-direction:column; gap:var(--tk-space-3); min-width:0; }
  .tk-sl-ex--current { border-color:var(--tk-c-accent); box-shadow:0 0 0 1px var(--tk-c-accent) inset; }
  .tk-sl-head { display:flex; align-items:center; gap:var(--tk-space-2); min-width:0; } .tk-sl-name { font-weight:var(--tk-fw-semibold); font-size:var(--tk-fs-lg); }
  .tk-sl-hint { display:flex; gap:8px; align-items:flex-start; font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); background:var(--tk-c-surface2); border-radius:var(--tk-radius-md); padding:8px 10px; } .tk-sl-hint .icon { margin-top:2px; color:var(--tk-c-warning); }
  .tk-sl-rows { display:flex; flex-direction:column; gap:4px; }
  .tk-sl-row, .tk-sl-cols { display:grid; grid-template-columns:30px 88px minmax(0,1fr) minmax(0,1fr) 48px; gap:8px; align-items:center; }
  .tk-sl-row--one { grid-template-columns:30px 88px minmax(0,1fr) 48px; } .tk-sl-row { padding:4px 4px 4px 0; border-radius:var(--tk-radius-md); }
  .tk-sl-row[data-done="true"] { background:var(--tk-c-success-soft); } .tk-sl-row .tk-fit-step { width:100%; } .tk-sl-row .tk-fit-step input { flex:1 1 0; width:auto; }
  .tk-sl-cols { font-size:var(--tk-fs-xs); text-transform:uppercase; letter-spacing:var(--tk-ls-wide); color:var(--tk-c-text-subtle); font-weight:var(--tk-fw-semibold); text-align:center; } .tk-sl-cols span:nth-child(2) { text-align:left; }
  .tk-sl-nr { text-align:center; font-weight:var(--tk-fw-semibold); color:var(--tk-c-text-muted); } .tk-sl-row[data-warm="true"] .tk-sl-nr { color:var(--tk-c-warning); }
  .tk-sl-last { display:none; font-size:var(--tk-fs-sm); font-variant-numeric:tabular-nums; } .bp-mobile .tk-sl-last { display:inline; }
  .tk-sl-prev { font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); white-space:nowrap; font-variant-numeric:tabular-nums; }
  .tk-sl-dots { display:inline-flex; gap:5px; } .tk-sl-dots i { width:9px; height:9px; border-radius:50%; border:1.5px solid var(--tk-c-border-strong); display:block; } .tk-sl-dots i[data-done="true"] { background:var(--tk-c-success); border-color:var(--tk-c-success); }
  .bp-mobile .tk-sl-row, .bp-mobile .tk-sl-cols { grid-template-columns:24px minmax(0,1fr) minmax(0,1fr) 44px; gap:6px; } .bp-mobile .tk-sl-row--one { grid-template-columns:24px minmax(0,1fr) 44px; }
  .bp-mobile .tk-sl-prev, .bp-mobile .tk-sl-cols span:nth-child(2) { display:none; } .bp-mobile .tk-sl-ex { padding:var(--tk-space-3); }
  .bp-mobile .tk-sl-row .tk-fit-step button { width:32px; } .bp-mobile .tk-sl-row .tk-fit-step input { font-size:16px; min-width:0; }
  .tk-sl-head .tk-btn { flex:none; } .bp-mobile .tk-sl-head .tk-btn--icon { width:40px; height:40px; }`,
  example: { data: { session: { id: 's', dayId: 'upperA', title: 'Oberkörper A', status: 'running', exercises: [
    { id: 'x1', exerciseId: 'bankdruecken', name: 'Bankdrücken', muscle: 'Brust', equipment: 'Langhantel', unit: 'kg', step: 2.5, rest: 120, repLo: 8, repHi: 10, hint: 'Alle Sätze bei 10 Wdh. – heute 62,5 kg × 8.', best: 80, sets: [
      { id: 'a', type: 'warm', kg: 32.5, reps: 8, done: true }, { id: 'b', type: 'work', kg: 62.5, reps: 8, prevKg: 60, prevReps: 10, done: true }, { id: 'c', type: 'work', kg: 62.5, reps: 8, prevKg: 60, prevReps: 10, done: false }, { id: 'd', type: 'work', kg: 62.5, reps: 8, prevKg: 60, prevReps: 10, done: false }] },
    { id: 'x2', exerciseId: 'rudern-kabel', name: 'Rudern am Kabel', muscle: 'Rücken', equipment: 'Kabel', unit: 'kg', step: 2.5, rest: 90, repLo: 10, repHi: 12, hint: 'Gewicht halten (45 kg), Ziel 12 Wiederholungen.', sets: [
      { id: 'e', type: 'work', kg: 45, reps: 12, prevKg: 45, prevReps: 11, done: false }, { id: 'f', type: 'work', kg: 45, reps: 12, prevKg: 45, prevReps: 11, done: false }] }] }, library: [], history: [] } },
  render: function SetLogger({ props, data, setData, ctx }) {
    const s = data.session;
    const ops = useOps(s || {}, (v) => setData('session', v), ctx, data, props.prHints);
    if ((!s || !(s.exercises || []).length) && props.quietEmpty) return null;
    if (!s || !(s.exercises || []).length) return html`<${Card} title="Übungen" icon="dumbbell"><${EmptyState} icon="dumbbell" title="Keine Übungen" text="Wähle einen Trainingstag im Plan oder füge eine Übung hinzu." /><//>`;
    const live = liveExercises(s); const cur = live.find((e) => e.sets.some((x) => !x.done));
    return html`<div class="tk-sl" data-qa="set-logger">${s.exercises.map((ex) => html`<${ExerciseBlock} key=${ex.id} ex=${ex} cur=${!ops.locked && cur && cur.id === ex.id} ops=${ops} props=${props} />`)}</div>`;
  },
};
export default [setLogger];
