// Fitness: Abschluss-Zusammenfassung einer beendeten Einheit (Dauer, Sätze, Volumen, Bestwerte, Befinden) mit Speichern.
import { html } from '../../../lib/html.js';
import { Card, Button, Badge, Icon, EmptyState } from '../../ui.js';
import { isoDay } from '../../../lib/util.js';
import { num } from './_calc.js';
import { doneCount, totalCount, volumeNow, liveExercises, setRating, toHistoryEntry } from './_session.js';
import { clock } from './session-header.js';
import { FIT_CSS } from './_ui.js';

const FEEL = ['Zäh', 'Schwer', 'Okay', 'Gut', 'Sehr gut'];

export const workoutSummary = {
  id: 'workout-summary',
  name: 'Workout-Zusammenfassung',
  category: 'Fitness',
  description: 'Abschluss einer Einheit: Dauer, Sätze, Volumen, Bestwerte und Befinden (1–5). „Speichern“ schreibt die Einheit in den Verlauf. Erscheint erst, wenn die Einheit beendet ist.',
  version: '1.1',
  props: [{ name: 'title', label: 'Titel', type: 'text', default: 'Training geschafft' }, { name: 'quietEmpty', label: 'Ohne Einheit nichts anzeigen (Erststart)', type: 'boolean', default: false }],
  data: [
    { slot: 'session', label: 'Live-Einheit', default: 'session', shape: 'Live-Einheit (status: done)', required: true },
    { slot: 'history', label: 'Verlauf', default: 'history', shape: 'Einheiten[]' },
  ],
  events: ['session.saved', 'session.rate', 'progress.open'],
  states: ['empty'],
  css: `
  .tk-wsum { display:flex; flex-direction:column; gap:var(--tk-space-4); }
  .tk-wsum__stats { display:grid; grid-template-columns:repeat(4, minmax(0,1fr)); gap:var(--tk-space-3); } .bp-mobile .tk-wsum__stats { grid-template-columns:repeat(2, minmax(0,1fr)); }
  .tk-wsum__feel { display:grid; grid-template-columns:repeat(5, minmax(0,1fr)); gap:6px; } .tk-wsum__feel button { min-height:48px; border-radius:var(--tk-radius-md); border:1px solid var(--tk-c-border); background:var(--tk-c-surface2); color:var(--tk-c-text-muted); cursor:pointer; font-size:var(--tk-fs-sm); padding:0 2px; }
  .tk-wsum__feel button[aria-checked="true"] { background:var(--tk-c-accent-soft); border-color:var(--tk-c-accent); color:var(--tk-c-accent); font-weight:var(--tk-fw-semibold); }
  .tk-wsum__head { display:flex; gap:12px; align-items:center; } .tk-wsum__medal { width:44px; height:44px; border-radius:14px; display:grid; place-items:center; background:var(--tk-c-success-soft); color:var(--tk-c-success); flex:none; }`,
  example: { data: { session: { id: 's', dayId: 'upperA', title: 'Oberkörper A', status: 'done', elapsed: 3180, rating: null, saved: false, prs: ['bankdruecken'], exercises: [
    { id: 'x1', exerciseId: 'bankdruecken', name: 'Bankdrücken', sets: [{ id: 'a', type: 'work', kg: 62.5, reps: 8, done: true }, { id: 'b', type: 'work', kg: 62.5, reps: 8, done: true }, { id: 'c', type: 'work', kg: 62.5, reps: 7, done: true }] }] }, history: [] } },
  render: function WorkoutSummary({ props, data, setData, ctx }) {
    const s = data.session;
    if ((!s || !(s.exercises || []).length) && props.quietEmpty) return null;
    if (!s || !(s.exercises || []).length) return html`<${Card}><${EmptyState} icon="trophy" title="Noch keine Einheit" text="Nach dem Training siehst du hier deine Zusammenfassung." /><//>`;
    if (s.status !== 'done') return null;
    const done = doneCount(s), total = totalCount(s), vol = volumeNow(s);
    const prs = liveExercises(s).filter((e) => e.pr || (s.prs || []).includes(e.exerciseId));
    const rate = (r) => { setData('session', setRating(s, r)); ctx.emit('session.rate', { rating: r }); };
    const save = () => {
      const entry = toHistoryEntry(s, isoDay(ctx.today));
      setData('history', (h) => [...(Array.isArray(h) ? h : []), entry]);
      setData('session', { ...s, saved: true }); ctx.emit('session.saved', { id: entry.id, volume: entry.volume, sets: entry.sets }); ctx.toast('Training gespeichert');
    };
    return html`<${Card}><div class="tk-wsum" data-qa="workout-summary">
      <div class="tk-wsum__head"><span class="tk-wsum__medal"><${Icon} name="trophy" size=${22} /></span><div class="tk-grow"><div class="tk-h3">${done ? props.title : 'Training beendet'}</div><div class="tk-muted" style="font-size:var(--tk-fs-sm)">${s.title} · ${done} von ${total} Sätzen</div></div></div>
      <div class="tk-wsum__stats"><div class="tk-fit-stat"><span>Dauer</span><strong>${clock(s.elapsed || 0)}</strong></div><div class="tk-fit-stat"><span>Sätze</span><strong>${done}<small>/${total}</small></strong></div>
        <div class="tk-fit-stat"><span>Volumen</span><strong>${num(vol)}<small> kg</small></strong></div><div class="tk-fit-stat"><span>Bestwerte</span><strong>${prs.length}</strong></div></div>
      ${prs.length > 0 && html`<div class="tk-fit-chips">${prs.map((e) => html`<${Badge} tone="success" icon="trophy">${e.name}<//>`)}</div>`}
      <div class="tk-col" style="gap:8px"><span class="tk-label" id="feel-lbl">Wie war das Training?</span>
        <div class="tk-wsum__feel" role="radiogroup" aria-labelledby="feel-lbl">${FEEL.map((l, i) => html`<button type="button" role="radio" aria-checked=${String(s.rating === i + 1)} disabled=${s.saved} onClick=${() => rate(i + 1)}>${l}</button>`)}</div></div>
      <div class="tk-row" style="gap:8px;flex-wrap:wrap">${!s.saved ? html`<${Button} variant="primary" icon="save" class="tk-fit-cta" disabled=${done === 0} onClick=${save}>Training speichern<//>`
        : html`<${Badge} tone="success" icon="check-circle-2">Gespeichert<//><span class="tk-grow"></span><${Button} variant="primary" iconRight="arrow-right" onClick=${() => ctx.emit('progress.open')}>Fortschritt ansehen<//>`}</div>
    </div><//>`;
  },
};
export default [workoutSummary];
