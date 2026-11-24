// Gewohnheiten: Serie mit Gnadentag – große Serienanzeige, beste Serie, nächster Meilenstein; oder Überblick über alle Serien.
import { html } from '../../../lib/html.js';
import { Card, Button, EmptyState, Icon, Chip, Badge, toneColor } from '../../ui.js';
import {
  list, todayKey, streakOf, rateOf, totalDone, weekDots, nextMilestone, rhythmLabel, dayLabel, isPaused, isScheduled, isDone, Streak, Bar, HABIT_CSS, shift,
} from './_habits.js';

export const streakPanel = {
  id: 'streak-panel',
  name: 'Serien-Anzeige',
  category: 'Gewohnheiten',
  description: 'Aktuelle und beste Serie einer Gewohnheit mit Gnadentag („Pause statt Serie verlieren“), nächstem Meilenstein und Wochenpunkten. Modus „Überblick“ zeigt alle Serien als Rangliste. Bewusst ohne Punkte oder Druck.',
  version: '1.0',
  props: [
    { name: 'mode', label: 'Modus', type: 'select', options: ['selected', 'overview'], default: 'selected' },
    { name: 'title', label: 'Titel (Überblick)', type: 'text', default: 'Serien' },
    { name: 'showPicker', label: 'Gewohnheit wählbar', type: 'boolean', default: true },
    { name: 'showPause', label: 'Pause-Aktion', type: 'boolean', default: true },
    { name: 'limit', label: 'Max. Einträge (Überblick)', type: 'number', default: 6 },
  ],
  data: [{ slot: 'habits', label: 'Gewohnheiten', default: 'habits', shape: 'siehe habit-list', required: true }],
  events: ['streak.open', 'habit.pause', 'habit.select'],
  states: ['empty'],
  css: `${HABIT_CSS}
  .tk-sp { display:flex; flex-direction:column; } .tk-sp__pick { display:flex; gap:8px; overflow-x:auto; scrollbar-width:none; padding:12px 16px 0; }
  .tk-sp__hero { display:flex; align-items:center; gap:18px; padding:18px 18px 8px; flex-wrap:wrap; } .tk-sp__big { display:flex; flex-direction:column; gap:2px; }
  .tk-sp__unit { font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); } .tk-sp__stats { display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:10px; flex:1 1 220px; min-width:0; }
  .tk-sp__stat { padding:10px 12px; border-radius:var(--tk-radius-md); background:var(--tk-c-surface2); border:1px solid var(--tk-c-border); min-width:0; } .tk-sp__stat b { display:block; font-size:var(--tk-fs-xl); letter-spacing:var(--tk-ls-tight); font-variant-numeric:tabular-nums; } .tk-sp__stat span { font-size:var(--tk-fs-xs); color:var(--tk-c-text-subtle); }
  .tk-sp__ms { padding:6px 18px 4px; } .tk-sp__ms-t { display:flex; justify-content:space-between; font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); margin-bottom:6px; }
  .tk-sp__joker { margin:10px 18px 0; padding:10px 12px; border-radius:var(--tk-radius-md); border:1px dashed color-mix(in srgb, var(--tk-c-accent2) 55%, var(--tk-c-border)); background:color-mix(in srgb, var(--tk-c-accent2) 7%, transparent); display:flex; gap:10px; align-items:flex-start; font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); }
  .tk-sp__joker strong { color:var(--tk-c-text); } .tk-sp__foot { display:flex; align-items:center; gap:12px; padding:12px 18px 16px; flex-wrap:wrap; } .tk-sp__foot > span:first-child { flex:1; min-width:140px; font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); }
  .tk-sp__row { display:flex; align-items:center; gap:12px; width:100%; padding:10px 16px; min-height:56px; border:0; border-bottom:1px solid var(--tk-c-border); background:none; color:inherit; font:inherit; text-align:left; cursor:pointer; } .tk-sp__row:last-child { border-bottom:0; } .tk-sp__row:hover { background:var(--tk-c-surface2); }
  .tk-sp__rk { width:26px; text-align:center; font-weight:var(--tk-fw-semibold); color:var(--tk-c-text-subtle); font-variant-numeric:tabular-nums; } .tk-sp__bar { flex:1; min-width:0; } .tk-sp__bar .tk-progress { margin-top:6px; }
  .bp-mobile .tk-sp__stats { grid-template-columns:repeat(3, minmax(0, 1fr)); gap:6px; } .bp-mobile .tk-sp__stat { padding:8px 8px; } .bp-mobile .tk-sp__stat b { font-size:var(--tk-fs-lg); } .bp-mobile .tk-sp__hero { gap:12px; padding:14px 14px 6px; }`,
  example: { data: { habits: [{ id: 'a', name: 'Vitamin D', icon: 'pill', tone: 4, daypart: 'morgens', rhythm: { type: 'daily' }, since: '2026-09-01',
    log: Object.fromEntries(Array.from({ length: 30 }, (_, i) => [`2026-10-${String(26 - Math.min(i, 25)).padStart(2, '0')}`, 1]).concat(Array.from({ length: 24 }, (_, i) => [`2026-11-${String(i + 1).padStart(2, '0')}`, 1]))) }] } },
  render: function StreakPanel({ props, data, setData, ctx }) {
    const all = list(data.habits), today = todayKey(ctx);
    if (!all.length) return html`<${Card} title=${props.title}><${EmptyState} icon="flame" title="Noch keine Serie" text="Eine Serie entsteht, sobald du eine Gewohnheit an mehreren Tagen abhakst." /><//>`;
    if (props.mode === 'overview') {
      const rows = all.map((h) => ({ h, s: streakOf(h, today) })).sort((a, b) => b.s.current - a.s.current).slice(0, props.limit || 99);
      const max = Math.max(1, ...rows.map((r) => r.s.best));
      return html`<${Card} flush class="tk-sp"><div class="tk-card__head" style="padding:14px 16px 4px;margin:0"><h3 class="tk-card__title">${props.title}</h3><${Badge}>aktuell · beste<//></div>
        ${rows.map(({ h, s }, i) => html`<button type="button" class="tk-sp__row" onClick=${() => { ctx.setUi('selectedId', h.id); ctx.emit('streak.open', { id: h.id }); }} aria-label=${`${h.name}: Serie ${s.current} ${s.unit}, beste ${s.best}`}>
          <span class="tk-sp__rk">${i + 1}</span><span class="tk-sp__bar"><div class="tk-row" style="gap:8px"><span style=${`color:${toneColor(h.tone || 1)}`}><${Icon} name=${h.icon || 'repeat'} size=${15} /></span><span class="tk-truncate" style="font-weight:500">${h.name}</span></div>
            <${Bar} value=${s.current / max} color=${toneColor(h.tone || 1)} /></span><${Streak} n=${s.current} unit=${s.unit} /><span class="tk-subtle tk-num" style="min-width:34px;text-align:right;font-size:var(--tk-fs-sm)">${s.best}</span></button>`)}<//>`;
    }
    const h = all.find((x) => x.id === ctx.ui.selectedId) || all[0];
    const s = streakOf(h, today), ms = nextMilestone(s.current), prev = [0, 3, 7, 14, 21, 30, 50, 75, 100, 150, 200, 365].filter((m) => m <= s.current).pop() || 0;
    const jokerDays = [...s.jokers].filter((k) => k >= shift(today, -14)).sort();
    const paused = isPaused(h, today);
    const pause = () => { setData('habits', (xs) => xs.map((x) => (x.id === h.id ? { ...x, pauses: paused ? (x.pauses || []).filter((k) => k !== today) : [...(x.pauses || []), today] } : x))); ctx.emit('habit.pause', { id: h.id, paused: !paused }); ctx.toast(paused ? 'Pause beendet' : 'Pausentag eingelegt – deine Serie ist sicher'); };
    return html`<${Card} flush class="tk-sp" style=${`--hc:${toneColor(h.tone || 1)}`}>
      ${props.showPicker && all.length > 1 && html`<div class="tk-sp__pick" role="group" aria-label="Gewohnheit wählen">${all.map((x) => html`<${Chip} active=${x.id === h.id} icon=${x.icon || 'repeat'} onClick=${() => { ctx.setUi('selectedId', x.id); ctx.emit('habit.select', { id: x.id }); }}>${x.name}<//>`)}</div>`}
      <div class="tk-sp__hero"><div class="tk-sp__big"><${Streak} n=${s.current} unit=${s.unit} big=${true} /><span class="tk-sp__unit">${s.current === 0 ? (s.best > 0 ? 'Neustart – dein Verlauf bleibt erhalten' : 'Bereit für den Start') : `${s.unit} in Folge${s.perWeek ? ' (Wochenziel erreicht)' : ''}`}</span></div>
        <div class="tk-sp__stats"><div class="tk-sp__stat"><b>${s.best}</b><span>Beste Serie</span></div><div class="tk-sp__stat"><b>${Math.round(rateOf(h, today, 30) * 100)} %</b><span>Quote 30 Tage</span></div><div class="tk-sp__stat"><b>${totalDone(h)}</b><span>Mal erledigt</span></div></div></div>
      <div class="tk-sp__ms"><div class="tk-sp__ms-t"><span>Nächster Meilenstein: <strong>${ms} ${s.perWeek ? 'Wochen' : 'Tage'}</strong></span><span class="tk-num">${s.current}/${ms}</span></div><${Bar} value=${(s.current - prev) / (ms - prev)} color=${toneColor(h.tone || 1)} /></div>
      ${s.perWeek ? null : html`<div class="tk-sp__joker"><${Icon} name="shield" size=${18} /><div><strong>Gnadentag: ${s.jokerFree ? 'diese Woche verfügbar' : 'diese Woche genutzt'}</strong><br />Ein verpasster Tag pro Woche bricht deine Serie nicht.${jokerDays.length ? ` Zuletzt genutzt: ${jokerDays.map(dayLabel).join(' · ')}` : ''}</div></div>`}
      <div class="tk-sp__foot"><span>${rhythmLabel(h)}${h.time ? ` · Erinnerung ${h.time}` : ''}</span><span class="tk-hb-dots" role="img" aria-label="Diese Woche">${weekDots(h, today).map((d) => html`<span class="tk-hb-dot" data-s=${d.s} data-today=${d.today}></span>`)}</span>
        ${props.showPause && isScheduled(h, today) && !isDone(h, today) && html`<${Button} size="sm" icon=${paused ? 'play' : 'pause'} onClick=${pause}>${paused ? 'Pause beenden' : 'Heute pausieren'}<//>`}</div><//>`;
  },
};
export default streakPanel;
