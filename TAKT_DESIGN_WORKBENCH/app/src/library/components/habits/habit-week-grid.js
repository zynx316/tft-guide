// Gewohnheiten: Wochenraster – alle Gewohnheiten × 7 Tage, Tage lassen sich nachtragen.
import { html } from '../../../lib/html.js';
import { Card, Button, EmptyState, Icon, toneColor } from '../../ui.js';
import {
  list, todayKey, shift, weekStart, WD, parseKey, isDone, countOn, target, setCount, dayStatus, streakOf, isPerWeek, perWeek, weekCount,
  isScheduled, isPaused, HABIT_CSS,
} from './_habits.js';

const sample = (id, name, icon, tone, rhythm, days, extra = {}) => ({ id, name, icon, tone, daypart: 'morgens', rhythm, since: '2026-09-01', log: Object.fromEntries(days.map((d) => [`2026-11-${d}`, 1])), ...extra });

export const habitWeekGrid = {
  id: 'habit-week-grid',
  name: 'Gewohnheits-Wochenraster',
  category: 'Gewohnheiten',
  description: 'Alle Gewohnheiten auf einen Blick: Zeilen = Gewohnheiten, Spalten = Mo–So. Tage lassen sich tippen und nachtragen, Wochen wechseln. Zustände sind auch ohne Farbe lesbar (Haken, Punkt, Strich).',
  version: '1.0',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Wochenraster' },
    { name: 'editable', label: 'Nachtragen erlauben', type: 'boolean', default: true },
    { name: 'startOffset', label: 'Start (Wochen zurück)', type: 'number', default: 0 },
    { name: 'showNav', label: 'Wochen wechseln', type: 'boolean', default: true },
  ],
  data: [{ slot: 'habits', label: 'Gewohnheiten', default: 'habits', shape: 'siehe habit-list', required: true }],
  events: ['habit.toggle', 'habit.open', 'week.navigate'],
  states: ['empty'],
  css: `${HABIT_CSS}
  .tk-wg__nav { display:flex; align-items:center; gap:6px; } .tk-wg__range { font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); font-variant-numeric:tabular-nums; min-width:96px; text-align:center; }
  .tk-wg { display:grid; grid-template-columns:minmax(150px, 1fr) repeat(7, minmax(40px, 52px)) 56px; align-items:center; }
  .tk-wg > * { border-bottom:1px solid var(--tk-c-border); min-height:48px; display:flex; align-items:center; justify-content:center; min-width:0; }
  .tk-wg__h { min-height:44px !important; flex-direction:column; gap:0; font-size:var(--tk-fs-xs); color:var(--tk-c-text-subtle); font-weight:var(--tk-fw-semibold); background:var(--tk-c-surface2); }
  .tk-wg__h b { font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); } .tk-wg__h[data-today="true"] b, .tk-wg__h[data-today="true"] { color:var(--tk-c-accent); }
  .tk-wg__name { justify-content:flex-start !important; gap:10px; padding:0 8px 0 16px; background:none; border:0; border-bottom:1px solid var(--tk-c-border); color:inherit; font:inherit; text-align:left; cursor:pointer; }
  .tk-wg__name span:last-child { flex:1; min-width:0; font-weight:var(--tk-fw-medium); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .tk-wg__cell { border:0; border-bottom:1px solid var(--tk-c-border); background:none; padding:0; cursor:pointer; color:var(--tk-c-text-subtle); font:inherit; }
  .tk-wg__cell[disabled] { cursor:default; opacity:.55; } .tk-wg__cell:not([disabled]):hover .tk-wg__mark { border-color:var(--tk-c-accent); }
  .tk-wg__mark { width:28px; height:28px; border-radius:9px; border:1.5px solid var(--tk-c-border-strong); display:grid; place-items:center; font-size:11px; font-weight:var(--tk-fw-semibold); }
  .tk-wg__cell[data-s="done"] .tk-wg__mark { background:var(--tk-c-success); border-color:var(--tk-c-success); color:var(--tk-c-text-on-accent); }
  .tk-wg__cell[data-s="partial"] .tk-wg__mark { background:linear-gradient(135deg, var(--tk-c-success-soft) 50%, transparent 50%); border-color:var(--tk-c-success); color:var(--tk-c-success); }
  .tk-wg__cell[data-s="joker"] .tk-wg__mark { border:1.5px dashed var(--tk-c-accent2); color:var(--tk-c-text-muted); } .tk-wg__cell[data-s="pause"] .tk-wg__mark { border-style:dotted; }
  .tk-wg__cell[data-s="rest"] .tk-wg__mark, .tk-wg__cell[data-s="none"] .tk-wg__mark { border-color:transparent; } .tk-wg__cell[data-s="rest"] .tk-wg__mark::after { content:'–'; color:var(--tk-c-text-subtle); opacity:.6; }
  .tk-wg__cell[data-s="open"] .tk-wg__mark { border-color:var(--tk-c-accent); } .tk-wg__cell[data-s="future"] .tk-wg__mark { border-style:dotted; opacity:.5; }
  .tk-wg__cell[data-today="true"] { background:var(--tk-c-accent-soft); }
  .tk-wg__sum { font-size:var(--tk-fs-sm); font-variant-numeric:tabular-nums; color:var(--tk-c-text-muted); }
  .tk-wg__legend { display:flex; gap:14px; flex-wrap:wrap; padding:10px 16px; font-size:var(--tk-fs-xs); color:var(--tk-c-text-subtle); } .tk-wg__legend span { display:inline-flex; align-items:center; gap:6px; }
  .bp-mobile .tk-wg { grid-template-columns:repeat(7, minmax(0, 1fr)); } .bp-mobile .tk-wg__h0, .bp-mobile .tk-wg__h8 { display:none; }
  .bp-mobile .tk-wg__name { grid-column:1 / -1; min-height:44px; padding:6px 16px 0; border-bottom:0; background:var(--tk-c-surface2); } .bp-mobile .tk-wg__sum { display:none; }
  .bp-mobile .tk-wg__cell { min-height:46px; } .bp-mobile .tk-wg__mark { width:32px; height:32px; }`,
  example: { data: { habits: [
    sample('a', 'Vitamin D', 'pill', 4, { type: 'daily' }, ['16', '17', '18', '19', '20', '21', '22', '23', '24']),
    sample('b', 'Dehnen', 'activity', 2, { type: 'daily' }, ['16', '18', '19', '21', '23']),
    sample('c', 'Tagesplanung', 'list-checks', 1, { type: 'weekdays' }, ['16', '17', '18', '19', '20', '23', '24']),
    sample('d', 'Krafttraining', 'dumbbell', 6, { type: 'perWeek', perWeek: 3 }, ['16', '18', '20', '23']),
  ] } },
  render: function HabitWeekGrid({ props, data, setData, ctx }) {
    const all = list(data.habits), today = todayKey(ctx);
    const off = ctx.ui.weekOffset ?? props.startOffset;
    const ws = shift(weekStart(today), -7 * off);
    const days = Array.from({ length: 7 }, (_, i) => shift(ws, i));
    const nav = (d) => { const n = Math.max(0, off + d); ctx.setUi('weekOffset', n); ctx.emit('week.navigate', { offset: n }); };
    const range = `${parseKey(ws).getDate()}.–${parseKey(days[6]).getDate()}.${String(parseKey(days[6]).getMonth() + 1).padStart(2, '0')}.`;
    const title = html`<div class="tk-card__head" style="padding:14px 16px 12px;margin:0;border-bottom:1px solid var(--tk-c-border)"><h3 class="tk-card__title">${props.title}</h3>
      ${props.showNav && html`<div class="tk-wg__nav"><${Button} size="sm" variant="ghost" icon="chevron-left" aria-label="Vorherige Woche" onClick=${() => nav(1)} /><span class="tk-wg__range">${off === 0 ? 'Diese Woche' : range}</span>
        <${Button} size="sm" variant="ghost" icon="chevron-right" aria-label="Nächste Woche" onClick=${() => nav(-1)} disabled=${off === 0} /></div>`}</div>`;
    if (!all.length) return html`<${Card} flush>${title}<${EmptyState} icon="grid-2x2" title="Noch nichts zu zeigen" text="Sobald du Gewohnheiten anlegst, erscheint hier dein Wochenraster." /><//>`;
    const toggle = (h, k) => { const was = isDone(h, k); setCount(setData, h.id, k, was ? 0 : target(h)); ctx.emit('habit.toggle', { id: h.id, date: k, done: !was }); };
    const glyph = (s) => (s === 'done' ? html`<${Icon} name="check" size=${15} stroke=${3} />` : s === 'partial' ? '½' : s === 'joker' ? 'J' : s === 'missed' ? '·' : s === 'pause' ? 'P' : '');
    const label = { done: 'erledigt', partial: 'teilweise', missed: 'verpasst', joker: 'Gnadentag', pause: 'Pause', rest: 'nicht geplant', open: 'offen', future: 'kommt noch', none: 'vor Beginn' };
    return html`<${Card} flush>${title}<div class="tk-wg" role="table" aria-label=${props.title}>
      <div class="tk-wg__h tk-wg__h0"></div>${days.map((k, i) => html`<div class="tk-wg__h" data-today=${k === today}><span>${WD[i]}</span><b>${parseKey(k).getDate()}</b></div>`)}<div class="tk-wg__h tk-wg__h8">Woche</div>
      ${all.map((h) => { const jk = streakOf(h, today).jokers; const wk = days.filter((k) => isDone(h, k)).length;
        return html`<button type="button" class="tk-wg__name" onClick=${() => ctx.emit('habit.open', { id: h.id })} aria-label=${`${h.name} öffnen`}><span style=${`color:${toneColor(h.tone || 1)}`}><${Icon} name=${h.icon || 'repeat'} size=${16} /></span><span>${h.name}</span></button>
        ${days.map((k) => { const s = dayStatus(h, k, today, jk); const editable = props.editable && k <= today && !isPaused(h, k);
          return html`<button type="button" class="tk-wg__cell" data-s=${s} data-today=${k === today} disabled=${!editable} aria-label=${`${h.name}, ${WD[days.indexOf(k)]} ${parseKey(k).getDate()}.: ${label[s]}`} onClick=${() => toggle(h, k)}><span class="tk-wg__mark">${glyph(s)}</span></button>`; })}
        <div class="tk-wg__sum">${isPerWeek(h) ? `${weekCount(h, ws)}/${perWeek(h)}` : `${wk}/${days.filter((k) => isScheduled(h, k) && k <= today).length || 0}`}</div>`; })}</div>
      <div class="tk-wg__legend" aria-label="Legende"><span><${Icon} name="check" size=${13} /> erledigt</span><span>½ teilweise</span><span>· verpasst</span><span>J Gnadentag</span><span>– nicht geplant</span></div><//>`;
  },
};
export default habitWeekGrid;
