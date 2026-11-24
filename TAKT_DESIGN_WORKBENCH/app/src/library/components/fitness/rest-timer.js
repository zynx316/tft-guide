// Fitness: Pausen-Timer der Live-Einheit (Leiste, Ring oder schwebende Leiste).
import { html } from '../../../lib/html.js';
import { Card, Button, Progress, Icon } from '../../ui.js';
import { fmtClock } from './_calc.js';
import { nextSet, start, startRest, clearRest, addRest } from './_session.js';
import { Ring, useSessionTicker } from './_ui.js';

export function RestBody({ s, setS, ctx, mode }) {
  const r = s.rest, nx = nextSet(s);
  const act = (name, fn, detail) => { setS(fn); ctx.emit(name, detail || {}); };
  if (!r) return html`<div class="tk-rest__idle"><span class="tk-muted tk-row" style="gap:6px"><${Icon} name="timer" size=${15} />Pause starten</span>
    <div class="tk-fit-chips">${[60, 90, 120].map((sec) => html`<${Button} size="sm" onClick=${() => act('timer.start', (c) => startRest(start(c), sec), { seconds: sec, manual: true })}>${sec} Sek.<//>`)}</div></div>`;
  const left = Math.max(0, r.left), ratio = r.total ? 1 - left / r.total : 1;
  const ctrl = html`<div class="tk-fit-chips"><${Button} size="sm" aria-label="15 Sekunden weniger" onClick=${() => act('timer.add', (c) => addRest(c, -15), { delta: -15 })}>−15<//><${Button} size="sm" aria-label="15 Sekunden mehr" onClick=${() => act('timer.add', (c) => addRest(c, 15), { delta: 15 })}>+15<//>
    <${Button} size="sm" variant=${r.done ? 'primary' : 'default'} icon=${r.done ? 'check' : 'arrow-right'} onClick=${() => act('timer.skip', (c) => clearRest(c))}>${r.done ? 'Weiter' : 'Überspringen'}<//></div>`;
  const time = html`<span class="tk-fit-big" aria-live="off" aria-label=${`Pause noch ${fmtClock(left)}`}>${r.done ? 'Los!' : fmtClock(left)}</span>`;
  const label = r.done ? 'Pause vorbei' : 'Pause';
  const next = nx ? html`<span class="tk-muted tk-truncate" style="font-size:var(--tk-fs-sm)">Als Nächstes: ${nx.ex.name} · Satz ${nx.setIdx + 1}</span>` : null;
  if (mode === 'ring') return html`<div class="tk-rest tk-rest--ring"><${Ring} value=${ratio} size=${168} stroke=${12} tone=${r.done ? 'success' : 'accent'} label=${`${label} ${fmtClock(left)}`}><div>${time}<div class="tk-subtle" style="font-size:var(--tk-fs-sm)">${label}</div></div><//>${next}${ctrl}</div>`;
  if (mode === 'floating') return html`<div class="tk-rest tk-rest--float"><${Ring} value=${ratio} size=${44} stroke=${5} tone=${r.done ? 'success' : 'accent'} label=${label}><${Icon} name="timer" size=${16} /><//><div class="tk-grow"><div style="font-weight:600">${time}</div>${next}</div>${ctrl}</div>`;
  return html`<div class="tk-rest"><div class="tk-row" style="justify-content:space-between"><span class="tk-label">${label}</span>${time}</div><${Progress} value=${ratio} tone=${r.done ? 'success' : undefined} />${next}${ctrl}</div>`;
}

export const restTimer = {
  id: 'rest-timer',
  name: 'Pausen-Timer',
  category: 'Fitness',
  description: 'Pausen-Timer der Live-Einheit: startet automatisch nach jedem Satz mit der Übungsvorgabe, ±15 Sekunden, Überspringen. Als Leiste, Ring oder schwebende Leiste. Zählt nur im Launcher herunter.',
  version: '1.1',
  props: [
    { name: 'quietEmpty', label: 'Ohne Einheit nichts anzeigen (Erststart)', type: 'boolean', default: false },
    { name: 'mode', label: 'Darstellung', type: 'select', options: ['bar', 'ring', 'floating'], default: 'bar' },
    { name: 'title', label: 'Titel', type: 'text', default: 'Pause' },
  ],
  data: [{ slot: 'session', label: 'Live-Einheit', default: 'session', shape: '{status,rest:{total,left,running,done},exercises}', required: true }],
  events: ['timer.start', 'timer.add', 'timer.skip', 'timer.done'],
  states: ['empty'],
  css: `
  .tk-rest { display:flex; flex-direction:column; gap:var(--tk-space-3); }
  .tk-rest--ring { align-items:center; text-align:center; padding:var(--tk-space-2) 0; }
  .tk-rest--float { flex-direction:row; align-items:center; gap:var(--tk-space-3); }
  .tk-rest__idle { display:flex; align-items:center; justify-content:space-between; gap:var(--tk-space-3); flex-wrap:wrap; }
  .tk-rest-float-card { box-shadow:var(--tk-shadow-md); border-color:var(--tk-c-border-strong); }
  .bp-mobile .tk-rest--float { flex-wrap:wrap; } .bp-mobile .tk-rest .tk-btn { min-height:40px; }`,
  example: { data: { session: { status: 'running', rest: { total: 90, left: 47, running: true, done: false }, exercises: [{ id: 'x', name: 'Rudern am Kabel', sets: [{ id: 'a', done: true }, { id: 'b', done: false }] }] } } },
  render: function RestTimer({ props, data, setData, ctx }) {
    const s = data.session; const setS = (fn) => setData('session', fn);
    useSessionTicker(s, setS, ctx);
    if ((!s || !(s.exercises || []).length) && props.quietEmpty) return null;
    if (!s || !(s.exercises || []).length) return html`<${Card} title=${props.title} icon="timer"><div class="tk-muted" style="font-size:var(--tk-fs-sm)">Der Timer startet nach dem ersten Satz.</div><//>`;
    return html`<${Card} title=${props.mode === 'floating' ? undefined : props.title} icon=${props.mode === 'floating' ? undefined : 'timer'} class=${props.mode === 'floating' ? 'tk-rest-float-card' : ''}><${RestBody} s=${s} setS=${setS} ctx=${ctx} mode=${props.mode} /><//>`;
  },
};
export default [restTimer];
