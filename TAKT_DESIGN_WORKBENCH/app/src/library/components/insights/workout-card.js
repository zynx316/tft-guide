// Fitness (Referenz): Training mit Übungen und abhakbaren Sätzen
import { html } from '../../../lib/html.js';
import { Card, Button, Badge, Icon, Progress, EmptyState } from '../../ui.js';

export const workoutCard = {
  id: 'workout-card',
  name: 'Workout-Karte',
  category: 'Fitness',
  description: 'Ein Training mit Übungen und Sätzen (Wdh. × Gewicht). Sätze sind abhakbar, Fortschrittsbalken und „Training beenden“ mit Zusammenfassung.',
  version: '1.0',
  props: [
    { name: 'restHint', label: 'Pausenhinweis (Sek.)', type: 'number', default: 90 },
    { name: 'showProgress', label: 'Fortschritt zeigen', type: 'boolean', default: true },
  ],
  data: [{ slot: 'workout', label: 'Training', default: 'workout', shape: '{id,title,subtitle?,duration?,exercises:[{id,name,muscle?,sets:[{id,reps,weight?,done?}]}]}', required: true }],
  events: ['workout.set-toggle', 'workout.finish'],
  states: ['empty'],
  css: `
  .tk-workout__ex { padding:var(--tk-space-3) 0; border-top:1px solid var(--tk-c-border); }
  .tk-workout__ex:first-of-type { border-top:0; }
  .tk-workout__sets { display:flex; flex-wrap:wrap; gap:var(--tk-space-2); margin-top:10px; }
  .tk-workout__set { display:inline-flex; align-items:center; gap:8px; height:40px; padding:0 12px; border-radius:var(--tk-radius-md); border:1px solid var(--tk-c-border-strong); background:var(--tk-c-surface2); color:var(--tk-c-text); cursor:pointer; font-variant-numeric:tabular-nums; font-size:var(--tk-fs-sm); }
  .tk-workout__set small { color:var(--tk-c-text-subtle); }
  .tk-workout__set[aria-pressed="true"] { background:var(--tk-c-success-soft); border-color:var(--tk-c-success); color:var(--tk-c-text); }
  .tk-workout__set[aria-pressed="true"] .icon { color:var(--tk-c-success); }
  .tk-workout__set[aria-pressed="true"] small { color:inherit; }
  .bp-mobile .tk-workout__set { height:44px; flex:1 1 calc(33% - 8px); justify-content:center; }`,
  example: { data: { workout: { id: 'w1', title: 'Oberkörper A', subtitle: 'Di · ca. 55 Min.', exercises: [
    { id: 'e1', name: 'Bankdrücken', muscle: 'Brust', sets: [{ id: 's1', reps: 8, weight: 60, done: true }, { id: 's2', reps: 8, weight: 60 }, { id: 's3', reps: 6, weight: 65 }] },
    { id: 'e2', name: 'Rudern am Kabel', muscle: 'Rücken', sets: [{ id: 's4', reps: 10, weight: 45 }, { id: 's5', reps: 10, weight: 45 }] },
  ] } } },
  render: ({ props, data, setData, ctx }) => {
    const w = data.workout;
    if (!w || !w.exercises || !w.exercises.length) return html`<${Card} title="Training"><${EmptyState} icon="dumbbell" title="Kein Training geplant" text="Wähle einen Plan oder starte ein freies Training." /><//>`;
    const sets = w.exercises.flatMap((e) => e.sets);
    const done = sets.filter((s) => s.done).length;
    const toggle = (ex, st) => {
      setData('workout', (cur) => ({ ...cur, exercises: cur.exercises.map((e) => (e.id !== ex.id ? e : { ...e, sets: e.sets.map((s) => (s.id === st.id ? { ...s, done: !s.done } : s)) })) }));
      ctx.emit('workout.set-toggle', { exercise: ex.id, set: st.id, done: !st.done });
      if (!st.done && props.restHint) ctx.toast(`Satz geschafft · Pause ${props.restHint} Sek.`);
    };
    const finish = () => ctx.openDialog({ title: 'Training beenden?',
      body: () => html`<div class="tk-col" style="gap:8px"><p>${done} von ${sets.length} Sätzen abgeschlossen${done < sets.length ? ' – offene Sätze werden nicht gewertet.' : '. Stark!'}</p><${Progress} value=${done / sets.length} tone=${done === sets.length ? 'success' : undefined} /></div>`,
      footer: (close) => html`<${Button} onClick=${close}>Weitermachen<//><${Button} variant="primary" icon="check" onClick=${() => { ctx.emit('workout.finish', { done, total: sets.length }); ctx.toast('Training gespeichert'); close(); }}>Beenden<//>`,
    });
    return html`<${Card} title=${w.title} icon="dumbbell" actions=${html`<${Badge} tone=${done === sets.length ? 'success' : 'accent'}>${done}/${sets.length} Sätze<//>`}>
      ${w.subtitle && html`<p class="tk-muted" style="margin:-4px 0 10px;font-size:var(--tk-fs-sm)">${w.subtitle}</p>`}
      ${props.showProgress && html`<${Progress} value=${done / sets.length} tone=${done === sets.length ? 'success' : undefined} />`}
      <div style="margin-top:8px">${w.exercises.map((ex) => html`<div class="tk-workout__ex"><div class="tk-row"><span style="font-weight:600" class="tk-grow tk-truncate">${ex.name}</span>${ex.muscle && html`<${Badge}>${ex.muscle}<//>`}</div>
        <div class="tk-workout__sets">${ex.sets.map((s, i) => html`<button type="button" class="tk-workout__set" aria-pressed=${String(!!s.done)} aria-label=${`Satz ${i + 1}: ${s.reps} Wiederholungen${s.weight ? ` mit ${s.weight} kg` : ''}`} onClick=${() => toggle(ex, s)}>
          ${s.done ? html`<${Icon} name="check" size=${14} stroke=${3} />` : html`<small>${i + 1}</small>`}<span>${s.reps} × ${s.weight ? `${s.weight} kg` : 'KG'}</span></button>`)}</div></div>`)}</div>
      <div style="margin-top:12px"><${Button} variant="primary" icon="check" style="width:100%" onClick=${finish}>Training beenden<//></div>
    <//>`;
  },
};

export default [workoutCard];
