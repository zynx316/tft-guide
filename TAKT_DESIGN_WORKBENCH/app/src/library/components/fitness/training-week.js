// Fitness: Trainingswoche Mo–So – erledigt, geplant, Erholung, Lauf; Antippen wählt den Tag.
import { html } from '../../../lib/html.js';
import { Card, Badge, Icon, EmptyState } from '../../ui.js';
import { isoDay } from '../../../lib/util.js';
import { weekOverview, dateShort, isoWeekNo } from './_calc.js';
import { FIT_CSS } from './_ui.js';

const KIND = {
  done: { icon: 'check', tone: 'success', label: 'Erledigt' }, 'run-done': { icon: 'check', tone: 'success', label: 'Gelaufen' },
  strength: { icon: 'dumbbell', tone: 'accent', label: 'Geplant', badge: 'neutral' }, run: { icon: 'footprints', tone: 'info', label: 'Lauf' },
  rest: { icon: 'moon', tone: 'neutral', label: 'Erholung' }, missed: { icon: 'minus', tone: 'neutral', label: 'Ausgelassen' },
};

export const trainingWeek = {
  id: 'training-week',
  name: 'Trainingswoche',
  category: 'Fitness',
  description: 'Wochenrhythmus Mo–So mit erledigten, geplanten und Erholungstagen sowie Läufen. Als Streifen oder Liste. Antippen eines Tages wählt ihn (ctx.ui.selectedDay) und meldet day.open.',
  version: '1.0',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Diese Woche' },
    { name: 'layout', label: 'Darstellung', type: 'select', options: ['strip', 'list'], default: 'strip' },
    { name: 'event', label: 'Event beim Antippen', type: 'text', default: 'day.open' },
  ],
  data: [
    { slot: 'program', label: 'Programm', default: 'program', shape: '{rhythm:[{dow,kind,dayId}],days:[{id,name,durationMin}]}', required: true },
    { slot: 'history', label: 'Verlauf', default: 'history', shape: 'Einheiten[]' },
    { slot: 'runs', label: 'Läufe', default: 'runs', shape: '{date,km}[]' },
  ],
  events: ['day.open'],
  states: ['empty'],
  css: `
  .tk-tw { display:grid; grid-template-columns:repeat(7, minmax(0,1fr)); gap:var(--tk-space-2); }
  .tk-tw__day { display:flex; flex-direction:column; align-items:center; gap:6px; padding:10px 4px; min-height:92px; border-radius:var(--tk-radius-md); border:1px solid var(--tk-c-border); background:var(--tk-c-surface); color:inherit; cursor:pointer; min-width:0; text-align:center; }
  .tk-tw__day:hover { border-color:var(--tk-c-border-strong); } .tk-tw__day[aria-pressed="true"] { border-color:var(--tk-c-accent); background:var(--tk-c-accent-soft); } .tk-tw__day[data-today="true"] .tk-tw__lbl { color:var(--tk-c-accent); font-weight:var(--tk-fw-bold); }
  .tk-tw__lbl { font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); font-weight:var(--tk-fw-semibold); } .tk-tw__dot { width:34px; height:34px; border-radius:50%; display:grid; place-items:center; flex:none; }
  .tk-tw__t { font-size:var(--tk-fs-xs); line-height:1.2; color:var(--tk-c-text-muted); max-width:100%; overflow-wrap:anywhere; } .tk-tw__d { font-size:var(--tk-fs-xs); color:var(--tk-c-text-muted); }
  .tk-tw__row { display:flex; align-items:center; gap:var(--tk-space-3); width:100%; min-height:56px; padding:6px var(--tk-space-4); border:0; border-bottom:1px solid var(--tk-c-border); background:none; color:inherit; cursor:pointer; text-align:left; } .tk-tw__row:last-child { border-bottom:0; } .tk-tw__row[aria-pressed="true"] { background:var(--tk-c-accent-soft); }
  .bp-mobile .tk-tw { gap:4px; } .bp-mobile .tk-tw__day { padding:8px 2px; min-height:84px; } .bp-mobile .tk-tw__dot { width:30px; height:30px; } .bp-mobile .tk-tw__t { font-size:10px; }`,
  example: { data: { program: { rhythm: [{ dow: 0, kind: 'strength', dayId: 'lower' }, { dow: 1, kind: 'rest' }, { dow: 2, kind: 'strength', dayId: 'upperA' }, { dow: 3, kind: 'rest' }, { dow: 4, kind: 'strength', dayId: 'full' }, { dow: 5, kind: 'run', title: 'Lockerer Lauf' }, { dow: 6, kind: 'run', title: 'Langer Lauf' }],
    days: [{ id: 'lower', name: 'Unterkörper', durationMin: 60 }, { id: 'upperA', name: 'Oberkörper A', durationMin: 55 }, { id: 'full', name: 'Ganzkörper', durationMin: 60 }] },
    history: [{ id: 'h1', date: '2026-11-23', title: 'Unterkörper', durationMin: 58 }], runs: [] } },
  render: function TrainingWeek({ props, data, ctx }) {
    const today = isoDay(ctx.today);
    if (!(data.program?.rhythm || []).length) return html`<${Card} title=${props.title}><${EmptyState} icon="calendar-days" title="Noch kein Plan" text="Wähle ein Programm, dann erscheint hier deine Woche." /><//>`;
    const week = weekOverview(data.program, data.history || [], data.runs || [], today);
    const upcoming = week.find((d) => d.date >= today && d.dayId); const selected = ctx.ui.selectedDay || (week.some((d) => d.dayId === ctx.ui.selectedId) ? ctx.ui.selectedId : upcoming?.dayId);
    const pick = (d) => { if (d.dayId) ctx.setUi('selectedDay', d.dayId); ctx.emit(props.event || 'day.open', { id: d.dayId || d.sessionId || d.date, date: d.date }); };
    const dot = (d) => { const k = KIND[d.kind] || KIND.rest; return html`<span class="tk-tw__dot" style=${`background:var(--tk-c-${k.tone === 'neutral' ? 'surface3' : `${k.tone}-soft`});color:${k.tone === 'neutral' ? 'var(--tk-c-text-subtle)' : `var(--tk-c-${k.tone})`}`}><${Icon} name=${k.icon} size=${16} stroke=${2.5} /></span>`; };
    const done = week.filter((d) => d.kind === 'done').length;
    const head = html`<${Badge} tone=${done >= 3 ? 'success' : 'accent'}>KW ${isoWeekNo(today)} · ${done} Einheit${done === 1 ? '' : 'en'}<//>`;
    if (props.layout === 'list') return html`<${Card} flush title=${props.title} actions=${head}>${week.map((d) => html`<button type="button" class="tk-tw__row" aria-pressed=${String(selected === d.dayId && !!d.dayId)} onClick=${() => pick(d)} aria-label=${`${d.label} ${dateShort(d.date)}: ${d.title}`}>${dot(d)}
      <div class="tk-grow"><div style="font-weight:600">${d.label}, ${dateShort(d.date)}${d.isToday ? ' · heute' : ''}</div><div class="tk-muted tk-truncate" style="font-size:var(--tk-fs-sm)">${d.title}${d.detail ? ` · ${d.detail}` : ''}</div></div><${Badge} tone=${KIND[d.kind]?.badge || KIND[d.kind]?.tone || 'neutral'}>${KIND[d.kind]?.label}<//></button>`)}<//>`;
    return html`<${Card} title=${props.title} actions=${head}><div class="tk-tw" role="group" aria-label="Woche">${week.map((d) => html`<button type="button" class="tk-tw__day" data-today=${String(d.isToday)} aria-pressed=${String(selected === d.dayId && !!d.dayId)} onClick=${() => pick(d)} aria-label=${`${d.label} ${dateShort(d.date)}: ${d.title}`}>
      <span class="tk-tw__lbl">${d.label}</span>${dot(d)}<span class="tk-tw__t">${d.short}</span>${d.detail && html`<span class="tk-tw__d">${d.detail}</span>`}</button>`)}</div><//>`;
  },
};
export default [trainingWeek];
