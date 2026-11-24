// Aufgaben + Kalender: „Als Nächstes“ – Termine, fällige Aufgaben und freie Zeitfenster zu einem Tagesfokus verbinden.
import { html } from '../../../lib/html.js';
import { Card, Check, Badge, Button, Icon, EmptyState, toneColor } from '../../ui.js';
import { occurrences, dayStart, addDays, minutesOf, timeStr, hm, durLabel, freeSlots, catColor, catTone, openEventDialog, toIso } from '../calendar/_cal.js';
import { openEvent, OPEN_MODE_PROP } from '../calendar/_cal-info.js';
import { dueInfo, sortTasks, toggleTask, PrioFlag, DueText, TASK_CSS } from './_tasks.js';

export const focusNext = {
  id: 'focus-next',
  name: 'Fokus: Als Nächstes',
  category: 'Aufgaben',
  description: 'Verbindet Termine und Aufgaben zur Tagesfokus-Liste: laufender/nächster Termin, überfällige Aufgaben, Zeitleiste mit freien Fenstern und passenden Aufgabenvorschlägen, die sich mit einem Klick einplanen lassen.',
  version: '1.0',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Als Nächstes' },
    { name: 'workEnd', label: 'Arbeitstag bis (Std.)', type: 'number', default: 18 },
    { name: 'minSlot', label: 'Min. Fenster (Min.)', type: 'number', default: 30 },
    { name: 'showOverdue', label: 'Überfällige zeigen', type: 'boolean', default: true },
    { name: 'showSuggestions', label: 'Vorschläge für freie Zeit', type: 'boolean', default: true },
    { name: 'showHero', label: 'Hervorgehobener nächster Termin', type: 'boolean', default: true },
    OPEN_MODE_PROP,
  ],
  data: [
    { slot: 'events', label: 'Termine', default: 'events', shape: '{id,title,start,end,category?,tone?}[]', required: true },
    { slot: 'tasks', label: 'Aufgaben', default: 'tasks', shape: '{id,title,due?,priority?,done?,estimate?(Min.)}[]', required: true },
  ],
  events: ['focus.schedule', 'task.toggle', 'task.open', 'event.open', 'event.update', 'event.delete'],
  states: ['empty'],
  css: `${TASK_CSS}
  .tk-fn__hero { display:flex; gap:14px; align-items:center; padding:16px; background:linear-gradient(135deg, var(--tk-c-accent-soft), transparent 70%); border-bottom:1px solid var(--tk-c-border); cursor:pointer; text-align:left; width:100%; border-left:0; border-right:0; border-top:0; font:inherit; color:var(--tk-c-text); }
  .tk-fn__badge { width:44px; height:44px; border-radius:14px; background:var(--tk-c-accent); color:var(--tk-c-text-on-accent); display:grid; place-items:center; flex:none; }
  .tk-fn__eyebrow { font-size:var(--tk-fs-xs); font-weight:var(--tk-fw-semibold); letter-spacing:var(--tk-ls-wide); text-transform:uppercase; color:var(--tk-c-accent); }
  .tk-fn__sec { padding:10px 16px 6px; font-size:var(--tk-fs-xs); font-weight:var(--tk-fw-semibold); letter-spacing:var(--tk-ls-wide); text-transform:uppercase; color:var(--tk-c-text-subtle); background:var(--tk-c-surface2); border-bottom:1px solid var(--tk-c-border); display:flex; gap:8px; align-items:center; }
  .tk-fn__row { display:flex; align-items:center; gap:12px; padding:10px 16px; min-height:56px; border-bottom:1px solid var(--tk-c-border); min-width:0; }
  .tk-fn__row[data-btn="true"] { cursor:pointer; width:100%; border-left:0; border-right:0; border-top:0; background:transparent; font:inherit; color:var(--tk-c-text); text-align:left; }
  .tk-fn__row[data-btn="true"]:hover { background:var(--tk-c-surface2); }
  .tk-fn__time { width:46px; flex:none; font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); font-variant-numeric:tabular-nums; }
  .tk-fn__bar { width:4px; align-self:stretch; min-height:30px; border-radius:2px; background:var(--ec); flex:none; }
  .tk-fn__free { margin:8px 12px; border:1px dashed color-mix(in srgb, var(--tk-c-success) 55%, var(--tk-c-border)); border-radius:var(--tk-radius-md); background:color-mix(in srgb, var(--tk-c-success) 6%, transparent); }
  .tk-fn__freehead { display:flex; align-items:center; gap:8px; padding:8px 12px; font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); }
  .tk-fn__sug { display:flex; align-items:center; gap:10px; padding:6px 8px 6px 12px; border-top:1px dashed color-mix(in srgb, var(--tk-c-success) 30%, var(--tk-c-border)); min-height:48px; min-width:0; }
  .bp-mobile .tk-fn__row { min-height:60px; } .bp-mobile .tk-fn__free { margin:8px; }`,
  example: { data: {
    events: [
      { id: 'a', title: 'Daily Stand-up', start: '2026-11-24T09:45:00', end: '2026-11-24T10:00:00', category: 'Arbeit', tone: 'accent' },
      { id: 'c', title: 'Lieferanten-Call Etsy', start: '2026-11-24T15:00:00', end: '2026-11-24T16:00:00', category: 'Sales', tone: 'warning' },
    ],
    tasks: [
      { id: 't1', title: 'Angebot Müller GmbH finalisieren', due: '2026-11-24T14:00:00', priority: 'hoch', estimate: 60 },
      { id: 't2', title: 'Belege Oktober hochladen', due: '2026-11-23', priority: 'mittel', estimate: 30 },
    ],
  } },
  render: function FocusNext({ props, data, setData, ctx }) {
    const events = Array.isArray(data.events) ? data.events : [], tasks = Array.isArray(data.tasks) ? data.tasks : [];
    const today = dayStart(ctx.today), nowMin = minutesOf(ctx.today), endMin = Number(props.workEnd) * 60;
    const occs = occurrences(events, today, addDays(today, 1)).filter((o) => !o.allDay);
    const scheduled = new Set(events.map((e) => e.taskId).filter(Boolean));
    const open = tasks.filter((t) => !t.done);
    const overdue = open.filter((t) => dueInfo(t, ctx.today).overdue).sort(sortTasks);
    const dueToday = open.filter((t) => dueInfo(t, ctx.today).diff === 0).sort(sortTasks);
    let pool = [...overdue, ...dueToday].filter((t) => !scheduled.has(t.id));
    const current = occs.find((o) => minutesOf(o._s) <= nowMin && minutesOf(o._e) > nowMin);
    const upcoming = occs.filter((o) => minutesOf(o._s) > nowMin);
    const next = current || upcoming[0];
    const rest = occs.filter((o) => minutesOf(o._e) > nowMin);
    const slots = props.showSuggestions ? freeSlots(occs, Math.ceil(nowMin / 15) * 15, endMin, Number(props.minSlot)) : [];
    const plan = slots.map(([a, b]) => { let left = b - a, at = a; const sug = []; for (const t of pool) { const d = Number(t.estimate) || 30; if (d <= left && sug.length < 2) { sug.push({ t, d, at }); left -= d; at += d; pool = pool.filter((x) => x !== t); } } return { a, b, sug }; });
    const remaining = pool;
    if (!tasks.length && !events.length) return html`<${Card} title=${props.title}><${EmptyState} icon="target" title="Nichts geplant" text="Keine Termine oder Aufgaben für heute – Zeit für etwas Ruhe." /><//>`;
    const schedule = (t, at, d) => { const s = new Date(today); s.setHours(0, at, 0, 0); const e = new Date(+s + d * 60000); const ev = { id: `ev${Date.now().toString(36)}`, title: t.title, start: toIso(s), end: toIso(e), category: 'Fokus', tone: 'success', taskId: t.id, note: 'Aus Aufgabe eingeplant' }; setData('events', (a) => [ev, ...a]); ctx.emit('focus.schedule', { task: t.id, at: hm(at) }); ctx.toast(`„${t.title}“ um ${hm(at)} eingeplant`); };
    const taskRow = (t) => html`<div class="tk-fn__row"><${Check} checked=${t.done} onChange=${() => toggleTask(ctx, setData, t)} label=${`${t.title} erledigt`} />
      <div class="tk-grow" role="button" tabindex="0" style="cursor:pointer;min-width:0" onClick=${() => { ctx.setUi('selectedId', t.id); ctx.emit('task.open', { id: t.id }); }}><div class="tk-truncate" style="font-weight:500">${t.title}</div><${DueText} t=${t} today=${ctx.today} /></div><${PrioFlag} t=${t} /></div>`;
    const head = (icon, text, n) => html`<div class="tk-fn__sec"><${Icon} name=${icon} size=${13} />${text}${n != null && html`<span>${n}</span>`}</div>`;
    const timeline = [...rest.map((o) => ({ at: minutesOf(o._s), o })), ...plan.map((p) => ({ at: p.a, p }))].sort((x, y) => x.at - y.at);
    return html`<${Card} flush=${true} title=${props.title} icon="target" actions=${html`<${Badge} tone="accent">${rest.length} Termine · ${open.filter((t) => dueInfo(t, ctx.today).diff <= 0).length} fällig<//>`}>
      ${props.showHero && next && html`<button type="button" class="tk-fn__hero" onClick=${() => openEvent(ctx, setData, next, events, props)}><span class="tk-fn__badge"><${Icon} name=${current ? 'play' : 'clock'} size=${22} /></span>
        <span class="tk-grow"><div class="tk-fn__eyebrow">${current ? `Läuft jetzt · noch ${durLabel(minutesOf(next._e) - nowMin)}` : `Als Nächstes · in ${durLabel(minutesOf(next._s) - nowMin)}`}</div>
          <div class="tk-truncate" style="font-size:var(--tk-fs-lg);font-weight:600">${next.title}</div><div class="tk-muted" style="font-size:var(--tk-fs-sm)">${timeStr(next._s)}–${timeStr(next._e)}${next.location ? ` · ${next.location}` : ''}</div></span><${Icon} name="chevron-right" size=${18} /></button>`}
      ${props.showOverdue && overdue.length > 0 && html`${head('alert-circle', 'Überfällig', overdue.length)}${overdue.map(taskRow)}`}
      ${head('calendar-clock', 'Heute noch', null)}
      ${timeline.length ? timeline.map((r) => r.o ? html`<button type="button" class="tk-fn__row" data-btn="true" onClick=${() => openEvent(ctx, setData, r.o, events, props)}><span class="tk-fn__time">${timeStr(r.o._s)}</span><span class="tk-fn__bar" style=${`--ec:${catColor(r.o)}`}></span>
          <span class="tk-grow"><div class="tk-truncate" style="font-weight:500">${r.o.title}</div><div class="tk-subtle" style="font-size:var(--tk-fs-sm)">bis ${timeStr(r.o._e)}${r.o.taskId ? ' · Aufgabe eingeplant' : ''}</div></span>${r.o.taskId ? html`<${Icon} name="check-circle-2" size=${16} />` : html`<${Badge} tone=${catTone(r.o)}>${r.o.category || 'Termin'}<//>`}</button>`
        : html`<div class="tk-fn__free"><div class="tk-fn__freehead"><${Icon} name="timer" size=${15} /><span><b>${hm(r.p.a)}–${hm(r.p.b)}</b> frei · ${durLabel(r.p.b - r.p.a)}</span></div>
          ${r.p.sug.length ? r.p.sug.map((s) => html`<div class="tk-fn__sug"><div class="tk-grow"><div class="tk-truncate" style="font-weight:500">${s.t.title}</div><div class="tk-subtle" style="font-size:var(--tk-fs-sm)">ca. ${durLabel(s.d)} · ${dueInfo(s.t, ctx.today).text}</div></div><${PrioFlag} t=${s.t} /><${Button} size="sm" variant="primary" onClick=${() => schedule(s.t, s.at, s.d)}>Einplanen<//></div>`) : html`<div class="tk-fn__sug tk-subtle" style="font-size:var(--tk-fs-sm)">Kein passender Aufgabenvorschlag – Zeit für Pause oder Spontanes.</div>`}</div>`)
        : html`<div class="tk-subtle" style="padding:16px;font-size:var(--tk-fs-sm)">Für den Rest des Tages ist nichts mehr geplant.</div>`}
      ${remaining.length > 0 && html`${head('list-todo', 'Heute fällig, ohne Zeitfenster', remaining.length)}${remaining.filter((t) => !overdue.includes(t)).map(taskRow)}`}
    <//>`;
  },
};
export default focusNext;
