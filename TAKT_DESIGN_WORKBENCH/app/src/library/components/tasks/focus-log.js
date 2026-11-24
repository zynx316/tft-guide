// Aufgaben: Fokus-Protokoll – Blöcke von heute (oder der Woche) mit Aufgabe, Uhrzeit, Summe und Tagesziel.
import { html } from '../../../lib/html.js';
import { Card, Badge, Icon, Progress, EmptyState } from '../../ui.js';
import { isoDay } from '../../../lib/util.js';
import { timeStr } from '../calendar/_cal.js';
import { sessionsOn, focusByDay, hoursOf } from './_tasks-x.js';

export const focusLog = {
  id: 'focus-log',
  name: 'Fokus-Protokoll',
  category: 'Aufgaben',
  description: 'Protokoll der Fokusblöcke: heute mit Aufgabe und Uhrzeit oder die Woche als Zusammenfassung, dazu Fortschritt zum Tagesziel. Antippen eines Eintrags öffnet die Aufgabe.',
  version: '1.0',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Fokus heute' },
    { name: 'scope', label: 'Zeitraum', type: 'select', options: ['today', 'week'], default: 'today' },
    { name: 'limit', label: 'Max. Einträge', type: 'number', default: 6 },
  ],
  data: [
    { slot: 'log', label: 'Fokus-Protokoll', default: 'log', shape: '{id,taskId,title,start,minutes}[]', required: true },
    { slot: 'goal', label: 'Tagesziel', default: 'goal', shape: '{sessionsPerDay}', required: false },
  ],
  events: ['task.open'],
  states: ['empty'],
  css: `
  .tk-focuslog__row { display:flex; align-items:center; gap:12px; width:100%; min-height:52px; padding:6px 16px; border:0; border-bottom:1px solid var(--tk-c-border); background:transparent; color:var(--tk-c-text); font:inherit; text-align:left; cursor:pointer; }
  .tk-focuslog__row:last-of-type { border-bottom:0; } .tk-focuslog__row:hover { background:var(--tk-c-surface2); }
  .tk-focuslog__time { width:44px; flex:none; font-variant-numeric:tabular-nums; font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); }
  .tk-focuslog__sum { padding:12px 16px; display:flex; flex-direction:column; gap:8px; border-top:1px solid var(--tk-c-border); background:var(--tk-c-surface2); }`,
  example: { data: { log: [{ id: 'a', taskId: 't1', title: 'Angebot Müller GmbH finalisieren', start: '2026-11-24T08:05:00', minutes: 25 }, { id: 'b', taskId: 't5', title: 'Wireframes prüfen', start: '2026-11-24T08:40:00', minutes: 25 }], goal: { sessionsPerDay: 6 } } },
  render: ({ props, data, ctx }) => {
    const log = Array.isArray(data.log) ? data.log : [], goal = Number(data.goal?.sessionsPerDay) || 6, key = isoDay(ctx.today);
    const week = focusByDay(log, 7, ctx.today), today = sessionsOn(log, key).sort((a, b) => String(a.start).localeCompare(b.start));
    const mins = today.reduce((n, x) => n + x.minutes, 0);
    if (!log.length) return html`<${Card} title=${props.title} icon="timer"><${EmptyState} icon="timer" title="Noch kein Fokusblock" text="Starte den Timer – abgeschlossene Blöcke erscheinen hier." /><//>`;
    if (props.scope === 'week') {
      const total = week.reduce((n, d) => n + d.minutes, 0);
      return html`<${Card} flush=${true} title=${props.title} icon="timer" actions=${html`<${Badge}>${hoursOf(total)} in 7 Tagen<//>`}><div data-qa="focus-log">${[...week].reverse().filter((d) => d.sessions || d.key === key).map((d) => html`<div class="tk-focuslog__row" style="cursor:default"><span class="tk-focuslog__time" style="width:88px;white-space:nowrap">${new Intl.DateTimeFormat('de-DE', { weekday: 'short', day: 'numeric', month: 'numeric' }).format(d.day).replace(',', '')}</span><span class="tk-grow"><${Progress} value=${d.sessions / goal} tone=${d.key === key ? 'success' : undefined} /></span><b class="tk-num" style="width:52px;text-align:right">${d.sessions} ×</b></div>`)}</div><//>`;
    }
    return html`<${Card} flush=${true} title=${props.title} icon="timer" actions=${html`<${Badge} tone=${today.length >= goal ? 'success' : 'neutral'}>${today.length}/${goal}<//>`}><div data-qa="focus-log">
      ${!today.length && html`<div class="tk-subtle" style="padding:16px;font-size:var(--tk-fs-sm)">Heute noch kein Fokusblock – 25 Minuten, dann Pause.</div>`}
      ${today.slice(-Number(props.limit)).reverse().map((x) => html`<button type="button" class="tk-focuslog__row" onClick=${() => { ctx.setUi('selectedId', x.taskId); ctx.emit('task.open', { id: x.taskId }); }}><span class="tk-focuslog__time">${timeStr(x.start)}</span><${Icon} name="target" size=${16} /><span class="tk-grow tk-truncate">${x.title}</span><span class="tk-subtle tk-num" style="font-size:var(--tk-fs-sm);white-space:nowrap">${x.minutes} Min.</span></button>`)}
      <div class="tk-focuslog__sum"><div class="tk-row"><span class="tk-grow" style="font-size:var(--tk-fs-sm)">${hoursOf(mins)} Fokuszeit · Ziel ${goal} Blöcke</span></div><${Progress} value=${today.length / goal} tone="success" /></div></div><//>`;
  },
};
export default focusLog;
