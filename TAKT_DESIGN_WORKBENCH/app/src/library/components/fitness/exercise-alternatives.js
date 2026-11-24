// Fitness: „Alternative finden“ – passende Ersatzübungen (Muskelgruppe, Equipment) und Tausch in der laufenden Einheit.
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Card, Button, Badge, Chip, Icon, EmptyState } from '../../ui.js';
import { liveExercises, swapExercise } from './_session.js';
import { FIT_CSS } from './_ui.js';

const reason = (base, l) => [l.muscle === base.muscle ? 'gleiche Muskelgruppe' : `trainiert auch ${l.muscle}`, l.equipment === base.equipment ? 'gleiches Gerät' : l.equipment, l.level === 'Anfänger' ? 'einfach zu lernen' : l.type === 'Isolation' ? 'schonender für Gelenke' : null].filter(Boolean).join(' · ');

export const exerciseAlternatives = {
  id: 'exercise-alternatives',
  name: 'Alternative finden',
  category: 'Fitness',
  description: 'Ersatz für eine Übung finden (gleiche Muskelgruppe, anderes Gerät) und direkt in der laufenden Einheit tauschen – bereits erledigte Sätze bleiben erhalten.',
  version: '1.1',
  props: [{ name: 'title', label: 'Titel', type: 'text', default: 'Übung ersetzen' }],
  data: [
    { slot: 'items', label: 'Übungen', default: 'library', shape: 'Übungen[]', required: true },
    { slot: 'session', label: 'Live-Einheit', default: 'session', shape: 'Live-Einheit (optional)' },
    { slot: 'history', label: 'Verlauf', default: 'history', shape: 'Einheiten[]' },
  ],
  events: ['exercise.swap', 'exercise.open', 'exercise.pick'],
  states: ['empty'],
  css: `
  .tk-alt { display:flex; flex-direction:column; gap:var(--tk-space-3); } .tk-alt__chips { display:flex; gap:var(--tk-space-2); overflow-x:auto; scrollbar-width:none; padding-bottom:2px; } .tk-alt__chips > * { flex:none; }
  .tk-alt__row { display:flex; align-items:center; gap:var(--tk-space-3); padding:var(--tk-space-3); border:1px solid var(--tk-c-border); border-radius:var(--tk-radius-md); background:var(--tk-c-surface2); min-width:0; }
  .tk-alt__row > button.tk-fit-link { flex:1 1 auto; display:flex; flex-direction:column; gap:2px; }
  [data-tk-large-text] .tk-alt__row { flex-wrap:wrap; } [data-tk-large-text] .tk-alt__row > button.tk-fit-link { flex:1 1 100%; min-width:0; }`,
  example: { data: { items: [
    { id: 'bankdruecken', name: 'Bankdrücken', muscle: 'Brust', secondary: [], equipment: 'Langhantel', type: 'Verbund', level: 'Mittel', unit: 'kg', alternatives: ['kurzhantel-bankdruecken', 'brustpresse'] },
    { id: 'kurzhantel-bankdruecken', name: 'Kurzhantel-Bankdrücken', muscle: 'Brust', secondary: [], equipment: 'Kurzhantel', type: 'Verbund', level: 'Anfänger', unit: 'kg', alternatives: [] },
    { id: 'brustpresse', name: 'Brustpresse', muscle: 'Brust', secondary: [], equipment: 'Maschine', type: 'Verbund', level: 'Anfänger', unit: 'kg', alternatives: [] }],
    session: { status: 'running', exercises: [{ id: 'x1', exerciseId: 'bankdruecken', name: 'Bankdrücken', muscle: 'Brust', sets: [{ id: 'a', type: 'work', kg: 60, reps: 8, done: false }] }] }, history: [] } },
  render: function ExerciseAlternatives({ props, data, setData, ctx }) {
    const lib = data.items || []; const s = data.session; const live = liveExercises(s);
    const [pick, setPick] = useState(null);
    const baseId = pick || (live.find((e) => e.exerciseId === ctx.ui.selectedId) || live.find((e) => e.sets.some((x) => !x.done)) || live[0])?.exerciseId || ctx.ui.selectedId;
    const base = lib.find((l) => l.id === baseId);
    if (!base) return html`<${Card} title=${props.title}><${EmptyState} icon="refresh-cw" title="Keine Übung gewählt" text="Wähle eine Übung, für die du Ersatz suchst." /><//>`;
    const ranked = [...lib.filter((l) => l.id !== base.id && (l.muscle === base.muscle || (base.alternatives || []).includes(l.id)))]
      .sort((a, b) => (((base.alternatives || []).includes(b.id) ? 1 : 0) - ((base.alternatives || []).includes(a.id) ? 1 : 0)) || a.name.localeCompare(b.name, 'de')).slice(0, 6);
    const inSession = live.find((e) => e.exerciseId === base.id);
    const replace = (l) => {
      if (!inSession) { ctx.toast(`${base.name} ist nicht im aktuellen Training`); return; }
      setData('session', swapExercise(s, inSession.id, l, data.history)); ctx.emit('exercise.swap', { from: base.id, to: l.id }); ctx.toast(`${l.name} ersetzt ${base.name}`); setPick(l.id);
    };
    return html`<${Card} title=${props.title} icon="refresh-cw"><div class="tk-alt">
      ${live.length > 0 && html`<div class="tk-alt__chips" role="group" aria-label="Übung im Training">${live.map((e) => html`<${Chip} active=${e.exerciseId === base.id} onClick=${() => { setPick(e.exerciseId); ctx.emit('exercise.pick', { id: e.exerciseId }); }}>${e.name}<//>`)}</div>`}
      <div class="tk-muted" style="font-size:var(--tk-fs-sm)">Ersatz für <strong style="color:var(--tk-c-text)">${base.name}</strong> (${base.muscle}, ${base.equipment})</div>
      ${ranked.length ? ranked.map((l) => html`<div class="tk-alt__row"><button type="button" class="tk-fit-link" onClick=${() => { ctx.setUi('selectedId', l.id); ctx.emit('exercise.open', { id: l.id }); }} aria-label=${`${l.name} ansehen`}>
          <span style="font-weight:600">${l.name}</span><span class="tk-subtle" style="font-size:var(--tk-fs-sm)">${reason(base, l)}</span></button><${Badge}>${l.equipment}<//><${Button} size="sm" icon="refresh-cw" onClick=${() => replace(l)}>Ersetzen<//></div>`)
        : html`<${EmptyState} icon="search" title="Keine Alternative gefunden" text="Für diese Übung gibt es keine passenden Vorschläge." />`}
    </div><//>`;
  },
};
export default [exerciseAlternatives];
