// Fitness: „Nächstes Training“ – heute oder der nächste geplante Tag, mit Übungen, Kalender-Kontext und Start.
import { html } from '../../../lib/html.js';
import { Card, Button, Badge, Icon, EmptyState } from '../../ui.js';
import { isoDay } from '../../../lib/util.js';
import { FIT_CSS } from './_ui.js';

const clockOf = (iso) => String(iso).slice(11, 16);
/** Termine des Tages (ohne Ganztägige und Serien) – als Kontext für freie Zeit vor dem Training. */
const dayEvents = (events, date) => (events || []).filter((e) => !e.allDay && !e.repeat && String(e.start).slice(0, 10) === date).sort((a, b) => String(a.start).localeCompare(String(b.start)));

export const nextWorkout = {
  id: 'next-workout',
  name: 'Nächstes Training',
  category: 'Fitness',
  description: 'Was steht an: heute trainieren oder Erholungstag mit Blick auf die nächste Einheit. Zeigt Übungen, Dauer, Termine davor aus dem Kalender und startet das Training.',
  version: '1.4',
  props: [
    { name: 'quietEmpty', label: 'Ohne Daten nichts anzeigen (Erststart)', type: 'boolean', default: false },
    { name: 'style', label: 'Darstellung', type: 'select', options: ['hero', 'plain'], default: 'hero' },
    { name: 'showExercises', label: 'Übungen zeigen', type: 'boolean', default: true },
    { name: 'contextNote', label: 'Zusatzhinweis (überschreibt den Wetter-Hinweis aus der Welt)', type: 'text', default: '' },
    { name: 'showContext', label: 'Kalender-Kontext zeigen', type: 'boolean', default: true },
  ],
  data: [
    { slot: 'today', label: 'Heute', default: 'today', shape: '{kind,headline,text,nextDayId,nextDate,nextWhen,nextName,nextMinutes,nextSets,nextExercises,lastTitle,weekSessions,weekGoal}', required: true },
    { slot: 'program', label: 'Programm (leer = noch kein Plan)', default: 'program', shape: '{days}' },
    { slot: 'wxnote', label: 'Wetter-Hinweis zum Training (Text aus der Wetter-Welt)', default: 'wxnote', shape: 'string' },
    { slot: 'events', label: 'Termine', default: 'events', shape: '{id,title,start,end,category}[]' },
  ],
  events: ['workout.open', 'plan.open'],
  states: ['empty'],
  css: `
  .tk-nw { display:flex; flex-direction:column; gap:var(--tk-space-4); } .tk-nw--hero { padding:var(--tk-space-2) 0; }
  .tk-nw__rest { display:flex; align-items:center; gap:var(--tk-space-3); } .tk-nw__moon { width:48px; height:48px; border-radius:16px; display:grid; place-items:center; background:var(--tk-c-surface3); color:var(--tk-c-text-muted); flex:none; }
  .tk-nw__next { display:flex; flex-direction:column; gap:var(--tk-space-3); padding:var(--tk-space-4); border-radius:var(--tk-radius-lg); background:var(--tk-c-surface2); border:1px solid var(--tk-c-border); }
  .tk-nw__ctx { display:flex; gap:8px; align-items:flex-start; font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); }
  .tk-nw__cta { display:flex; gap:var(--tk-space-2); flex-wrap:wrap; } .tk-nw__cta .tk-btn--primary { flex:1 1 180px; min-height:48px; }
  [data-tk-large-text] .tk-nw .tk-badge, [data-tk-large-text] .tk-nw__next .tk-badge { max-width:100%; white-space:normal; height:auto; }`,
  example: { data: { today: { kind: 'rest', headline: 'Erholungstag', text: 'Heute ist Erholung eingeplant – morgen steht Oberkörper A an.', nextDayId: 'upperA', nextDate: '2026-11-25', nextWhen: 'Morgen, 18:30', nextName: 'Oberkörper A', nextMinutes: 55, nextSets: 16, nextExercises: ['Bankdrücken', 'Rudern am Kabel', 'Schulterdrücken (Kurzhantel)', 'Latziehen'], lastTitle: 'Unterkörper', weekSessions: 1, weekGoal: 3 },
    events: [{ id: 'e9', title: 'Physiotherapie', start: '2026-11-25T16:30:00', end: '2026-11-25T17:30:00', category: 'Gesundheit' }] } },
  render: function NextWorkout({ props, data, ctx }) {
    const t = data.today;
    const noPlan = data.program && !(data.program.days || []).length;
    if ((!t || !t.nextDayId || noPlan) && props.quietEmpty) return null;
    if (!t || !t.nextDayId || noPlan) return html`<${Card} title="Training"><${EmptyState} icon="dumbbell" title="Kein Training geplant" text="Wähle im Plan einen Rhythmus, dann erscheint hier dein nächstes Training." action=${html`<${Button} size="sm" icon="calendar-days" onClick=${() => ctx.emit('plan.open')}>Plan wählen<//>`} /><//>`;
    const isToday = t.kind === 'strength'; const evs = props.showContext ? dayEvents(data.events, t.nextDate) : [];
    const before = evs.filter((e) => clockOf(e.end) <= '18:30').pop();
    const note = props.contextNote || (typeof data.wxnote === 'string' ? data.wxnote : '');
    const open = () => ctx.emit('workout.open', { id: t.nextDayId });
    return html`<${Card}><div class=${`tk-nw tk-nw--${props.style}`} data-qa="next-workout">
      ${!isToday && html`<div class="tk-nw__rest"><span class="tk-nw__moon"><${Icon} name="moon" size=${24} /></span><div class="tk-grow"><div class="tk-h3">${t.headline}</div><div class="tk-muted" style="font-size:var(--tk-fs-sm)">${t.text}</div></div></div>`}
      <div class="tk-nw__next"><div class="tk-row" style="gap:8px;flex-wrap:wrap"><span class="tk-label">${isToday ? 'Heute' : 'Als Nächstes'}</span><${Badge} tone="accent" icon="calendar">${t.nextWhen}<//><span class="tk-grow"></span><span class="tk-subtle" style="font-size:var(--tk-fs-sm)">${t.weekSessions} von ${t.weekGoal} diese Woche</span></div>
        <div><div class="tk-h2">${t.nextName}</div><div class="tk-muted" style="font-size:var(--tk-fs-sm);margin-top:2px">ca. ${t.nextMinutes} Min. · ${t.nextSets} Sätze · ${(t.nextExercises || []).length} Übungen</div></div>
        ${props.showExercises && html`<div class="tk-fit-chips">${(t.nextExercises || []).slice(0, 5).map((n) => html`<${Badge}>${n}<//>`)}${(t.nextExercises || []).length > 5 && html`<${Badge}>+${t.nextExercises.length - 5}<//>`}</div>`}
        ${before && html`<div class="tk-nw__ctx"><${Icon} name="calendar-clock" size=${15} /><span>Davor: ${before.title} bis ${clockOf(before.end)} – dein Training um 18:30 passt gut dazu.</span></div>`}
        ${note && html`<div class="tk-nw__ctx"><${Icon} name="cloud-sun-rain" size=${15} /><span>${note}</span></div>`}
        <div class="tk-nw__cta"><${Button} variant="primary" icon="play" onClick=${open}>${isToday ? 'Training starten' : 'Training ansehen'}<//><${Button} icon="calendar-days" onClick=${() => ctx.emit('plan.open')}>Plan<//></div></div>
    </div><//>`;
  },
};
export default [nextWorkout];
