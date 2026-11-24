// Start: Tagesabschluss – offene Aufgaben verschieben, Gewohnheiten bestätigen, Top 3 für morgen, kurzer Check-in.
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Card, Button, Check, Badge, EmptyState, Icon, Input, toneColor } from '../../ui.js';
import { isoDay, addDays } from '../../../lib/util.js';
import { dueInfo, sortTasks } from '../tasks/_tasks.js';
import { list, todayKey, isDue, isDone, target, setCount, calm } from './_habits.js';

const STEPS = [{ id: 'tasks', label: 'Aufgaben', icon: 'list-checks' }, { id: 'habits', label: 'Gewohnheiten', icon: 'repeat' }, { id: 'tomorrow', label: 'Morgen', icon: 'sunrise' }];
const ENERGY = [['1', 'leer'], ['2', 'müde'], ['3', 'okay'], ['4', 'gut'], ['5', 'stark']];
const SAMPLE = { tasks: [{ id: 't1', title: 'Angebot Müller GmbH finalisieren', due: '2026-11-24T14:00:00', priority: 'hoch', status: 'In Arbeit' }, { id: 't2', title: 'Belege Oktober hochladen', due: '2026-11-23', priority: 'mittel', status: 'Offen' }, { id: 't3', title: 'Produktfotos auswählen', due: '2026-11-25', priority: 'mittel', status: 'Offen' }],
  habits: [{ id: 'h1', name: 'Lesen', icon: 'book-open', tone: 5, daypart: 'abends', rhythm: { type: 'daily' }, goal: { target: 20, unit: 'Min.', step: 5 }, since: '2026-09-01', log: {} }] };

export const ritualStepper = {
  id: 'ritual-stepper',
  name: 'Tagesabschluss',
  category: 'Start',
  description: 'Abendliches Ritual in 3 Schritten: offene Aufgaben erledigen, auf morgen schieben oder streichen · Gewohnheiten bestätigen · Top 3 für morgen und kurzer Energie-Check. Stile: Schritt für Schritt oder alles auf einer Seite.',
  version: '1.1',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Tagesabschluss' },
    { name: 'style', label: 'Stil', type: 'select', options: ['wizard', 'list'], default: 'wizard' },
  ],
  data: [
    { slot: 'tasks', label: 'Aufgaben', default: 'tasks', shape: 'Aufgaben (Welt)', required: true },
    { slot: 'habits', label: 'Gewohnheiten', default: 'habits', shape: 'siehe habit-list', required: false },
  ],
  events: ['ritual.step', 'ritual.task.done', 'ritual.task.move', 'ritual.task.drop', 'ritual.top3', 'ritual.complete', 'habit.toggle', 'ritual.habits'],
  states: ['empty'],
  css: `
  .tk-rs__steps { display:flex; gap:6px; padding:14px 16px 0; } .tk-rs__s { flex:1; display:flex; flex-direction:column; gap:6px; min-width:0; font-size:var(--tk-fs-xs); color:var(--tk-c-text-subtle); font-weight:var(--tk-fw-semibold); } .tk-rs__s i { display:block; height:5px; border-radius:3px; background:var(--tk-c-surface3); } .tk-rs__s[data-on="true"] i { background:var(--tk-c-accent); } .tk-rs__s[data-on="true"] { color:var(--tk-c-text); } .tk-rs__s span { white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  ${['1.5','1.75','2'].map((v) => `:root[style*="--tk-text-scale: ${v}"] .tk-rs__steps`).join(', ')} { flex-direction:column; } ${['1.5','1.75','2'].map((v) => `:root[style*="--tk-text-scale: ${v}"] .tk-rs__s span`).join(', ')} { white-space:normal; text-overflow:clip; }
 
  .tk-rs__sec { padding:14px 0 6px; } .tk-rs__h { padding:0 16px 8px; } .tk-rs__h b { display:block; font-size:var(--tk-fs-lg); letter-spacing:var(--tk-ls-tight); } .tk-rs__h span { font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); }
  .tk-rs__row { display:flex; align-items:center; gap:10px; padding:8px 12px 8px 16px; min-height:60px; border-top:1px solid var(--tk-c-border); min-width:0; } .tk-rs__t { flex:1; min-width:0; } .tk-rs__t b { display:block; font-weight:var(--tk-fw-medium); } .tk-rs__t span { font-size:var(--tk-fs-sm); color:var(--tk-c-text-subtle); }
  .tk-rs__acts { display:flex; gap:2px; flex:none; } .tk-rs__acts .tk-btn { gap:5px; } .tk-rs__star { color:var(--tk-c-text-subtle); } .tk-rs__star[aria-pressed="true"] { color:var(--tk-c-warning); } .tk-rs__star[aria-pressed="true"] svg { fill:currentColor; }
  .tk-rs__energy { display:grid; grid-template-columns:repeat(5, minmax(0, 1fr)); gap:6px; padding:0 16px; } .tk-rs__e { display:flex; flex-direction:column; align-items:center; gap:2px; min-height:52px; justify-content:center; border-radius:var(--tk-radius-md); border:1px solid var(--tk-c-border); background:var(--tk-c-surface2); color:inherit; font:inherit; cursor:pointer; } .tk-rs__e b { font-size:var(--tk-fs-lg); } .tk-rs__e span { font-size:var(--tk-fs-xs); color:var(--tk-c-text-subtle); } .tk-rs__e[aria-pressed="true"] { border-color:var(--tk-c-accent); background:var(--tk-c-accent-soft); }
  .tk-rs__foot { display:flex; justify-content:space-between; gap:8px; align-items:center; padding:12px 16px 16px; border-top:1px solid var(--tk-c-border); flex-wrap:wrap; } .tk-rs__done { display:flex; flex-direction:column; align-items:center; gap:10px; text-align:center; padding:32px 20px; } .tk-rs__sum { display:flex; gap:8px; flex-wrap:wrap; justify-content:center; }
  .bp-mobile .tk-rs__acts .tk-btn--sm { height:40px; padding:0 10px; } .bp-mobile .tk-rs__row { padding-right:8px; }`,
  example: { data: SAMPLE },
  render: function RitualStepper({ props, data, setData, ctx }) {
    const [step, setStep] = useState(0), [stat, setStat] = useState({ done: 0, moved: 0, dropped: 0 }), [fin, setFin] = useState(false), [energy, setEnergy] = useState(null), [note, setNote] = useState('');
    const all = Array.isArray(data.tasks) ? data.tasks : [], habits = list(data.habits), today = todayKey(ctx), tomorrow = isoDay(addDays(ctx.today, 1));
    const open = all.filter((t) => !t.done && dueInfo(t, ctx.today).diff != null && dueInfo(t, ctx.today).diff <= 0).sort(sortTasks);
    const pending = habits.filter((h) => isDue(h, today) && !isDone(h, today)), doneHabits = habits.filter((h) => isDue(h, today) && isDone(h, today));
    const top = ctx.ui.top3 || [];
    const cand = all.filter((t) => !t.done && (dueInfo(t, ctx.today).diff ?? 9) <= 1).sort(sortTasks).slice(0, 8);
    if (!all.length && !habits.length) return html`<${Card} title=${props.title}><${EmptyState} icon="moon" title="Nichts abzuschließen" text="Heute gab es keine Aufgaben und Gewohnheiten – schönen Feierabend." /><//>`;
    const patch = (id, fn) => setData('tasks', (xs) => xs.map((t) => (t.id === id ? fn(t) : t)));
    const doneT = (t) => { patch(t.id, (x) => ({ ...x, done: true, status: 'Erledigt' })); setStat((s) => ({ ...s, done: s.done + 1 })); ctx.emit('ritual.task.done', { id: t.id }); };
    const moveT = (t) => { patch(t.id, (x) => ({ ...x, due: tomorrow + (x.due && x.due.length > 10 ? x.due.slice(10) : '') })); setStat((s) => ({ ...s, moved: s.moved + 1 })); ctx.emit('ritual.task.move', { id: t.id }); ctx.toast('Auf morgen verschoben'); };
    const dropT = (t) => { setData('tasks', (xs) => xs.filter((x) => x.id !== t.id)); setStat((s) => ({ ...s, dropped: s.dropped + 1 })); ctx.emit('ritual.task.drop', { id: t.id }); ctx.toast('Gestrichen'); };
    const star = (t) => { const n = top.includes(t.id) ? top.filter((x) => x !== t.id) : top.length < 3 ? [...top, t.id] : top; ctx.setUi('top3', n); ctx.emit('ritual.top3', { ids: n }); };
    const finish = () => { setFin(true); ctx.emit('ritual.complete', { ...stat, top3: top.length, energy }); ctx.toast('Tagesabschluss gespeichert'); };

    const secTasks = html`<div class="tk-rs__sec"><div class="tk-rs__h"><b>Offene Aufgaben</b><span>${open.length ? `${open.length} offen – erledigen, verschieben oder streichen.` : 'Alles erledigt oder verschoben.'}</span></div>
      ${open.length === 0 ? html`<${EmptyState} icon="check-circle-2" title="Sauber abgeschlossen" text="Keine offenen Aufgaben für heute." />` : open.map((t) => html`<div class="tk-rs__row"><div class="tk-rs__t"><b class="tk-truncate">${t.title}</b><span>${dueInfo(t, ctx.today).text}</span></div>
        <div class="tk-rs__acts"><${Button} size="sm" variant="ghost" icon="check" aria-label=${`${t.title} erledigt`} onClick=${() => doneT(t)} /><${Button} size="sm" variant="ghost" icon="calendar-plus" aria-label=${`${t.title} auf morgen`} onClick=${() => moveT(t)}>${ctx.bp === 'mobile' ? null : 'Morgen'}<//><${Button} size="sm" variant="ghost" icon="trash-2" aria-label=${`${t.title} streichen`} onClick=${() => dropT(t)} /></div></div>`)}</div>`;
    const secHabits = html`<div class="tk-rs__sec"><div class="tk-rs__h"><b>Gewohnheiten</b><span>${calm(doneHabits.length, doneHabits.length + pending.length)}</span></div>
      ${[...pending, ...doneHabits].length === 0 ? html`<${EmptyState} icon="leaf" title="Heute nichts fällig" text="Deine Serien laufen weiter." />` : [...pending, ...doneHabits].map((h) => html`<div class="tk-rs__row"><${Check} checked=${isDone(h, today)} label=${`${h.name} erledigt`} onChange=${(on) => { setCount(setData, h.id, today, on ? target(h) : 0); ctx.emit('habit.toggle', { id: h.id, done: on }); }} />
        <span style=${`color:${toneColor(h.tone || 1)}`}><${Icon} name=${h.icon || 'repeat'} size=${17} /></span><div class="tk-rs__t"><b class="tk-truncate">${h.name}</b><span>${h.goal ? `${h.goal.target} ${h.goal.unit}` : h.daypart}</span></div></div>`)}</div>`;
    const secTomorrow = html`<div class="tk-rs__sec"><div class="tk-rs__h"><b>Top 3 für morgen</b><span>${top.length}/3 gewählt – mehr braucht ein guter Tag nicht.</span></div>
      ${cand.length === 0 ? html`<${EmptyState} icon="sunrise" title="Morgen ist frei" text="Keine fälligen Aufgaben – genieße den freien Tag." />` : cand.map((t) => html`<div class="tk-rs__row"><div class="tk-rs__t"><b class="tk-truncate">${t.title}</b><span>${dueInfo(t, ctx.today).text}</span></div><${Button} size="sm" variant="ghost" class="tk-rs__star" icon="star" aria-pressed=${top.includes(t.id)} aria-label=${`${t.title} ${top.includes(t.id) ? 'aus Top 3 entfernen' : 'in Top 3'}`} onClick=${() => star(t)} /></div>`)}
      <div class="tk-rs__h" style="padding-top:14px"><b style="font-size:var(--tk-fs-md)">Wie war deine Energie heute?</b></div><div class="tk-rs__energy" role="group" aria-label="Energie">${ENERGY.map(([n, l]) => html`<button type="button" class="tk-rs__e" aria-pressed=${energy === n} onClick=${() => setEnergy(n)}><b>${n}</b><span>${l}</span></button>`)}</div>
      <div style="padding:12px 16px 0"><${Input} value=${note} onInput=${setNote} placeholder="Ein Satz zum Tag (optional)" aria-label="Notiz zum Tag" maxlength="120" /></div></div>`;

    if (fin) return html`<${Card} flush><div class="tk-rs__done"><span class="tk-rs__star" style="color:var(--tk-c-success)"><${Icon} name="moon-star" size=${36} /></span><h3 class="tk-h2">Tag abgeschlossen</h3><div class="tk-rs__sum"><${Badge} tone="success">${stat.done} erledigt<//><${Badge}>${stat.moved} verschoben<//><${Badge}>${stat.dropped} gestrichen<//><${Badge} tone="accent">${top.length} Top-3<//></div>
      <p class="tk-muted" style="max-width:36ch">Gute Nacht. Morgen beginnt ${top.length === 0 ? 'mit einem klaren Kopf' : top.length === 1 ? 'mit deiner wichtigsten Aufgabe' : `mit deinen ${top.length} wichtigsten Aufgaben`}.</p><${Button} variant="ghost" icon="rotate-ccw" onClick=${() => { setFin(false); setStep(0); }}>Zurück zum Abschluss<//></div><//>`;
    if (props.style === 'list') return html`<${Card} flush title=${props.title}>${secTasks}${secHabits}${secTomorrow}<div class="tk-rs__foot"><span class="tk-subtle" style="font-size:var(--tk-fs-sm)">Dauert etwa 2 Minuten</span><${Button} variant="primary" icon="moon-star" onClick=${finish}>Tag abschließen<//></div><//>`;
    return html`<${Card} flush title=${props.title}><div class="tk-rs__steps" aria-label=${`Schritt ${step + 1} von 3`}>${STEPS.map((s, i) => html`<div class="tk-rs__s" data-on=${i <= step}><i></i><span>${s.label}</span></div>`)}</div>
      ${[secTasks, secHabits, secTomorrow][step]}<div class="tk-rs__foot"><${Button} variant="ghost" icon="chevron-left" onClick=${() => { setStep(Math.max(0, step - 1)); ctx.emit('ritual.step', { step: step - 1 }); }} disabled=${step === 0}>Zurück<//>
      ${step < 2 ? html`<${Button} variant="primary" iconRight="chevron-right" onClick=${() => { setStep(step + 1); ctx.emit('ritual.step', { step: step + 1 }); }}>Weiter<//>` : html`<${Button} variant="primary" icon="moon-star" onClick=${finish}>Tag abschließen<//>`}</div><//>`;
  },
};
export default ritualStepper;
