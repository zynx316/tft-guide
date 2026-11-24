// Start: „Dein Tag“ in Ringen – Aufgaben, Gewohnheiten, Wasser, Termine als live berechnete Tagesfortschritte.
import { html } from '../../../lib/html.js';
import { Card, EmptyState, Icon, toneColor } from '../../ui.js';
import { fmt } from '../../../lib/util.js';
import { dayData, linked } from './_today.js';
import { calm, countOn, target } from './_habits.js';

export const dayRings = {
  id: 'day-rings',
  name: 'Tagesringe',
  category: 'Start',
  description: 'Der Tag in vier Ringen: Aufgaben, Gewohnheiten, Wasser und Termine. Live berechnet, ruhig formuliert, jede Zeile öffnet ihr Modul.',
  version: '1.0',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Dein Tag' },
    { name: 'size', label: 'Durchmesser (px)', type: 'number', default: 192 },
    { name: 'layout', label: 'Anordnung', type: 'select', options: ['side', 'stacked'], default: 'side' },
  ],
  data: [
    { slot: 'events', label: 'Termine', default: 'events', shape: 'Termine (Welt)', required: false },
    { slot: 'tasks', label: 'Aufgaben', default: 'tasks', shape: 'Aufgaben (Welt)', required: false },
    { slot: 'habits', label: 'Gewohnheiten', default: 'habits', shape: 'siehe habit-list', required: false },
  ],
  events: ['tile.open.tasks', 'tile.open.habits', 'tile.open.calendar', 'tile.open.nutrition'],
  states: ['empty'],
  css: `
  .tk-dr { display:flex; align-items:center; gap:var(--tk-space-6); flex-wrap:wrap; } .tk-dr--stacked { flex-direction:column; align-items:stretch; } .tk-dr svg { flex:none; margin:0 auto; } .tk-dr__legend { flex:1 1 220px; display:flex; flex-direction:column; gap:4px; min-width:0; }
  .tk-dr__item { display:flex; align-items:center; gap:12px; padding:8px 10px; min-height:52px; border-radius:var(--tk-radius-md); border:1px solid transparent; background:none; color:inherit; font:inherit; text-align:left; cursor:pointer; min-width:0; } .tk-dr__item:hover { background:var(--tk-c-surface2); border-color:var(--tk-c-border); }
  .tk-dr__dot { width:34px; height:34px; border-radius:11px; display:grid; place-items:center; flex:none; background:color-mix(in srgb, var(--rc) 16%, transparent); color:var(--rc); } .tk-dr__val { text-align:right; font-variant-numeric:tabular-nums; white-space:nowrap; } .tk-dr__val strong { display:block; } .tk-dr__val small { color:var(--tk-c-text-subtle); font-size:var(--tk-fs-xs); }
  .tk-dr__note { margin-top:12px; font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); text-align:center; }`,
  example: { data: { events: [{ id: 'e', title: 'Daily Stand-up', start: '2026-11-24T09:15:00', end: '2026-11-24T09:30:00' }, { id: 'f', title: 'Call', start: '2026-11-24T15:00:00', end: '2026-11-24T16:00:00' }], tasks: [{ id: 't1', title: 'Angebot', due: '2026-11-24T14:00:00' }, { id: 't2', title: 'Belege', due: '2026-11-24', done: true }], habits: [
    { id: 'w', name: 'Wasser trinken', icon: 'droplet', tone: 3, rhythm: { type: 'daily' }, goal: { target: 8, unit: 'Gläser', step: 1 }, link: { module: 'nutrition' }, since: '2026-09-01', log: { '2026-11-24': 3 } },
    { id: 'v', name: 'Vitamin D', icon: 'pill', tone: 4, rhythm: { type: 'daily' }, since: '2026-09-01', log: { '2026-11-24': 1 } }] } },
  render: ({ props, data, ctx }) => {
    const dd = dayData(data, ctx), wa = linked(dd.habits, 'nutrition');
    const rings = [
      { key: 'tasks', label: 'Aufgaben', icon: 'list-checks', tone: 'warning', value: dd.scopeDone, goal: dd.scope.length, text: `${dd.scopeDone} von ${dd.scope.length}`, sub: dd.overdue.length ? `${dd.overdue.length} überfällig` : 'erledigt' },
      { key: 'habits', label: 'Gewohnheiten', icon: 'repeat', tone: 'success', value: dd.hab.done, goal: dd.hab.due, text: `${dd.hab.done} von ${dd.hab.due}`, sub: 'erledigt' },
      wa?.goal && { key: 'nutrition', label: 'Wasser', icon: 'droplet', tone: 3, value: countOn(wa, dd.key), goal: target(wa), text: `${countOn(wa, dd.key)} von ${target(wa)}`, sub: wa.goal.unit },
      { key: 'calendar', label: 'Termine', icon: 'calendar', tone: 'accent', value: dd.timed.length - dd.rest.length, goal: dd.timed.length, text: `${dd.timed.length - dd.rest.length} von ${dd.timed.length}`, sub: 'vorbei' },
    ].filter((r) => r && r.goal > 0);
    if (!rings.length) return html`<${Card} title=${props.title}><${EmptyState} icon="sun" title="Ein freier Tag" text="Heute ist nichts geplant – Zeit für etwas Ruhe." /><//>`;
    const S = props.size, c = S / 2, sw = Math.max(8, S * 0.055), gap = 4, avg = rings.reduce((a, r) => a + Math.min(1, r.value / r.goal), 0) / rings.length;
    return html`<${Card} title=${props.title} actions=${html`<span class="tk-subtle" style="font-size:var(--tk-fs-sm)">${fmt.weekday(ctx.today)}, ${fmt.dateShort(ctx.today)}</span>`}><div class=${`tk-dr tk-dr--${props.layout}`}>
      <svg width=${S} height=${S} viewBox=${`0 0 ${S} ${S}`} role="img" aria-label=${`Tagesfortschritt ${Math.round(avg * 100)} Prozent`}>${rings.map((r, i) => { const R = c - sw / 2 - i * (sw + gap) - 2, C = 2 * Math.PI * R, p = Math.min(1, r.value / r.goal), col = toneColor(r.tone);
        return html`<g><circle cx=${c} cy=${c} r=${R} fill="none" stroke=${col} stroke-opacity=".18" stroke-width=${sw} /><circle cx=${c} cy=${c} r=${R} fill="none" stroke=${col} stroke-width=${sw} stroke-linecap="round" stroke-dasharray=${`${Math.max(p * C, 0.01)} ${C}`} transform=${`rotate(-90 ${c} ${c})`} /></g>`; })}
        <text x=${c} y=${c + 2} text-anchor="middle" fill="var(--tk-c-text)" style="font-size:26px;font-weight:700">${Math.round(avg * 100)}%</text><text x=${c} y=${c + 20} text-anchor="middle" fill="var(--tk-c-text-subtle)" style="font-size:11px">des Tages</text></svg>
      <div class="tk-dr__legend">${rings.map((r) => html`<button type="button" class="tk-dr__item" style=${`--rc:${toneColor(r.tone)}`} onClick=${() => ctx.emit(`tile.open.${r.key}`, { id: r.key })}><span class="tk-dr__dot"><${Icon} name=${r.value >= r.goal ? 'check' : r.icon} size=${17} /></span><span class="tk-grow tk-truncate" style="font-weight:500">${r.label}</span><span class="tk-dr__val"><strong>${r.text}</strong><small>${r.sub}</small></span></button>`)}</div></div>
      <p class="tk-dr__note">${calm(dd.hab.done, dd.hab.due)}</p><//>`;
  },
};
export default dayRings;
