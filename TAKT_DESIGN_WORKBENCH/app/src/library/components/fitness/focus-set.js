// Fitness: Fokus-Satz – genau ein Satz im Blick, große Stepper, ein großer Haken, Pause als Ring.
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Card, Button, Badge, Icon, EmptyState } from '../../ui.js';
import { fmtKg } from './_calc.js';
import { liveExercises, nextSet, finish, doneCount, totalCount } from './_session.js';
import { Stepper, MuscleDot, FIT_CSS } from './_ui.js';
import { useOps, prevText, setLabel, LOGGER_CSS } from './_logger.js';
import { RestBody } from './rest-timer.js';

export const focusSet = {
  id: 'focus-set',
  name: 'Fokus-Satz',
  category: 'Fitness',
  description: 'Ein Satz im Fokus: große kg- und Wiederholungs-Stepper, ein großer „Satz geschafft“-Knopf, Pause als Ring, Vor/Zurück zwischen Übungen. Für Training mit nassen Fingern.',
  version: '1.1',
  props: [{ name: 'showUpcoming', label: 'Folgende Übungen zeigen', type: 'boolean', default: true }, { name: 'quietEmpty', label: 'Ohne Einheit nichts anzeigen (Erststart)', type: 'boolean', default: false }],
  data: [
    { slot: 'session', label: 'Live-Einheit', default: 'session', shape: 'Live-Einheit (siehe set-logger)', required: true },
    { slot: 'library', label: 'Übungsbibliothek', default: 'library', shape: 'Übungen[]' },
    { slot: 'history', label: 'Verlauf', default: 'history', shape: 'Einheiten[]' },
  ],
  events: ['set.complete', 'set.edit', 'set.add', 'exercise.swap', 'exercise.skip', 'exercise.open', 'session.finish', 'pr.hit', 'timer.skip', 'timer.add'],
  states: ['empty'],
  css: `
  .tk-fs { display:flex; flex-direction:column; gap:var(--tk-space-4); align-items:stretch; }
  .tk-fs__name { font-size:var(--tk-fs-2xl); font-weight:var(--tk-fw-bold); letter-spacing:var(--tk-ls-tight); line-height:1.15; }
  .tk-fs__ctl { display:grid; grid-template-columns:repeat(2, minmax(0,1fr)); gap:var(--tk-space-3); } .tk-fs__ctl > div { display:flex; flex-direction:column; gap:6px; align-items:center; min-width:0; }
  .tk-fs__ctl .tk-fit-step { width:100%; } .tk-fs__ctl .tk-fit-step input { flex:1 1 0; width:auto; } .tk-fs__ctl .tk-label { text-align:center; }
  .tk-fs__ok { min-height:68px; font-size:var(--tk-fs-xl); font-weight:var(--tk-fw-bold); border-radius:var(--tk-radius-lg); } .tk-fs__nav { display:flex; flex-wrap:wrap; justify-content:space-between; gap:var(--tk-space-2); } .tk-fs__nav .tk-btn { max-width:100%; }
  .tk-fs__up { display:flex; flex-direction:column; gap:2px; } .tk-fs__up button { display:flex; gap:10px; align-items:center; min-height:44px; padding:0 4px; border:0; border-bottom:1px solid var(--tk-c-border); background:none; color:inherit; cursor:pointer; text-align:left; }
  .tk-fs__up button:last-child { border-bottom:0; } .tk-fs__dots { display:flex; gap:8px; justify-content:center; } .tk-fs__dots i { width:12px; height:12px; border-radius:50%; border:2px solid var(--tk-c-border-strong); display:block; }
  .tk-fs__dots i[data-done="true"] { background:var(--tk-c-success); border-color:var(--tk-c-success); } .tk-fs__dots i[data-cur="true"] { border-color:var(--tk-c-accent); background:var(--tk-c-accent-soft); }
  .bp-mobile .tk-fs__ctl { grid-template-columns:minmax(0,1fr); } .bp-mobile .tk-fs__ctl .tk-fit-step button { width:64px; height:60px; } .bp-mobile .tk-fs__ctl .tk-fit-step input { height:60px; font-size:28px; min-width:0; }`,
  example: { data: { session: { id: 's', status: 'running', title: 'Oberkörper A', rest: null, exercises: [
    { id: 'x1', exerciseId: 'bankdruecken', name: 'Bankdrücken', muscle: 'Brust', equipment: 'Langhantel', unit: 'kg', step: 2.5, rest: 120, repLo: 8, repHi: 10, hint: 'Alle Sätze bei 10 Wdh. – heute 62,5 kg × 8.', sets: [
      { id: 'a', type: 'work', kg: 62.5, reps: 8, prevKg: 60, prevReps: 10, done: true }, { id: 'b', type: 'work', kg: 62.5, reps: 8, prevKg: 60, prevReps: 10, done: false }, { id: 'c', type: 'work', kg: 62.5, reps: 8, prevKg: 60, prevReps: 10, done: false }] },
    { id: 'x2', exerciseId: 'rudern-kabel', name: 'Rudern am Kabel', muscle: 'Rücken', equipment: 'Kabel', unit: 'kg', step: 2.5, rest: 90, repLo: 10, repHi: 12, sets: [{ id: 'd', type: 'work', kg: 45, reps: 12, done: false }] }] }, library: [], history: [] } },
  render: function FocusSet({ props, data, setData, ctx }) {
    const s = data.session; const setS = (v) => setData('session', v);
    const ops = useOps(s || {}, setS, ctx, data);
    const [sel, setSel] = useState(null);
    if ((!s || !(s.exercises || []).length) && props.quietEmpty) return null;
    if (!s || !(s.exercises || []).length) return html`<${Card}><${EmptyState} icon="dumbbell" title="Kein Training geplant" text="Wähle im Plan einen Trainingstag." /><//>`;
    const live = liveExercises(s); const nx = nextSet(s);
    const exIdx = sel ? live.findIndex((e) => e.id === sel) : nx ? nx.exIdx : -1;
    const ex = live[exIdx]; const setIdx = ex ? (sel ? Math.max(0, ex.sets.findIndex((x) => !x.done)) : nx.setIdx) : 0;
    const finishNow = () => { setS(finish(s)); ctx.emit('session.finish', { done: doneCount(s), total: totalCount(s) }); };
    if (!ex || s.status === 'done') return html`<${Card}><${EmptyState} icon="check-circle-2" title=${s.status === 'done' ? 'Training beendet' : 'Alle Sätze erledigt'} text=${s.status === 'done' ? 'Die Zusammenfassung steht darunter.' : `${doneCount(s)} Sätze geschafft – gut gemacht.`}
      action=${s.status !== 'done' && html`<${Button} variant="primary" icon="check" onClick=${finishNow}>Training beenden<//>`} /><//>`;
    const st = ex.sets[Math.min(setIdx, ex.sets.length - 1)]; const kgUnit = ex.unit === 'kg'; const prev = prevText(ex);
    const go = (d) => { const t = live[Math.min(live.length - 1, Math.max(0, exIdx + d))]; setSel(t.id); ctx.emit('exercise.focus', { id: t.exerciseId }); };
    const ok = () => { setSel(null); ops.toggle(ex, st); };
    return html`<${Card}><div class="tk-fs">
      <div class="tk-row" style="gap:8px"><${Badge}>Übung ${exIdx + 1} von ${live.length}<//><${MuscleDot} muscle=${ex.muscle} /><span class="tk-grow"></span>
        <${Button} variant="ghost" size="sm" icon="refresh-cw" aria-label="Übung ersetzen" onClick=${() => ops.swap(ex)} /><${Button} variant="ghost" size="sm" icon="x" aria-label="Übung auslassen" onClick=${() => { setSel(null); ops.skip(ex); }} /></div>
      <div><button type="button" class="tk-fit-link tk-fs__name" onClick=${() => ops.open(ex)}>${ex.name}</button>
        <div class="tk-muted" style="margin-top:4px;font-size:var(--tk-fs-sm)">${st.type === 'warm' ? 'Aufwärmsatz' : `Satz ${setLabel(ex, ex.sets.indexOf(st))} von ${ex.sets.filter((x) => x.type === 'work').length}`} · ${ex.equipment}${prev ? ` · letztes Mal ${prev}` : ''}</div></div>
      <div class="tk-fs__dots" aria-hidden="true">${ex.sets.map((x, i) => html`<i data-done=${String(!!x.done)} data-cur=${String(i === setIdx)}></i>`)}</div>
      ${s.rest && html`<${RestBody} s=${s} setS=${setS} ctx=${ctx} mode="ring" />`}
      ${ex.hint && html`<div class="tk-sl-hint" style="display:flex;gap:8px;font-size:var(--tk-fs-sm);color:var(--tk-c-text-muted)"><${Icon} name="lightbulb" size=${15} /><span>${ex.hint}</span></div>`}
      <div class="tk-fs__ctl">${kgUnit && html`<div><span class="tk-label">Gewicht (kg)</span><${Stepper} size="lg" label="Gewicht" value=${st.kg} step=${ex.step} max=${600} decimals=${1} onChange=${(v) => ops.edit(ex, st, { kg: v })} /></div>`}
        <div style=${kgUnit ? '' : 'grid-column:1 / -1'}><span class="tk-label">${ex.unit === 's' ? 'Sekunden' : 'Wiederholungen'}</span><${Stepper} size="lg" label=${ex.unit === 's' ? 'Sekunden' : 'Wiederholungen'} value=${st.reps} step=${ex.unit === 's' ? 5 : 1} max=${ex.unit === 's' ? 600 : 100} onChange=${(v) => ops.edit(ex, st, { reps: v })} /></div></div>
      <${Button} variant="primary" icon="check" class="tk-fs__ok" onClick=${ok}>${st.done ? 'Satz zurücknehmen' : 'Satz geschafft'}<//>
      <div class="tk-fs__nav"><${Button} icon="arrow-left" disabled=${exIdx === 0} onClick=${() => go(-1)}>Vorherige<//><${Button} iconRight="arrow-right" disabled=${exIdx >= live.length - 1} onClick=${() => go(1)}>Nächste Übung<//></div>
      ${props.showUpcoming && live.length > exIdx + 1 && html`<div><div class="tk-label" style="margin-bottom:4px">Danach</div><div class="tk-fs__up">${live.slice(exIdx + 1, exIdx + 4).map((e) => html`<button type="button" onClick=${() => { setSel(e.id); }}><span class="tk-grow tk-truncate">${e.name}</span><span class="tk-subtle tk-num" style="font-size:var(--tk-fs-sm)">${e.sets.filter((x) => x.type === 'work').length} × ${e.repLo}–${e.repHi}</span></button>`)}</div></div>`}
    </div><//>`;
  },
};
export default [focusSet];
