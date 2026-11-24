// Wetter: Mehrtages-Vorhersage mit Min/Max-Balken
import { html } from '../../../lib/html.js';
import { Card, Icon, EmptyState } from '../../ui.js';
import { fmt } from '../../../lib/util.js';
import { wx, deg, dayKey, dayLabel } from './weather-util.js';

export const weatherDaily = {
  id: 'weather-daily',
  name: 'Tagesvorhersage',
  category: 'Wetter',
  description: '7–10-Tage-Vorhersage mit Zustands-Icon, Regenwahrscheinlichkeit und Min/Max-Balken über den gesamten Zeitraum. Auswahl eines Tages setzt ctx.ui.selectedDate (steuert die stündliche Vorhersage). Als Liste oder als Kacheln.',
  version: '1.1',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: '7-Tage-Vorhersage' },
    { name: 'days', label: 'Anzahl Tage', type: 'number', default: 7 },
    { name: 'layout', label: 'Darstellung', type: 'select', options: ['list', 'tiles'], default: 'list' },
    { name: 'showBars', label: 'Min/Max-Balken', type: 'boolean', default: true },
  ],
  data: [{ slot: 'days', label: 'Tageswerte', default: 'daily', shape: '{date,code,min,max,pop?,precip?,wind?}[]', required: true }],
  events: ['weather.day'],
  states: ['empty'],
  css: `
  .tk-wd__row { display:grid; grid-template-columns:76px 28px 56px minmax(0,1fr); align-items:center; gap:var(--tk-space-3); width:100%; padding:6px var(--tk-space-3); min-height:52px; border:0; border-radius:var(--tk-radius-md); background:transparent; color:var(--tk-c-text); font:inherit; cursor:pointer; text-align:left; }
  .tk-wd__pop svg { color:var(--tk-c-info); }
  .tk-wd__row:hover { background:var(--tk-c-surface2); }
  .tk-wd__row[aria-pressed="true"] { background:var(--tk-c-accent-soft); }
  .tk-wd__day { font-weight:var(--tk-fw-semibold); }
  .tk-wd__date { display:block; font-size:var(--tk-fs-xs); font-weight:var(--tk-fw-regular); color:var(--tk-c-text-muted); }
  .tk-wd__pop { white-space:nowrap; font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); display:inline-flex; align-items:center; gap:3px; font-variant-numeric:tabular-nums; min-height:18px; }
  .tk-wd__range { display:grid; grid-template-columns:38px minmax(0,1fr) 38px; align-items:center; gap:10px; font-variant-numeric:tabular-nums; }
  .tk-wd__min { color:var(--tk-c-text-muted); text-align:right; } .tk-wd__max { font-weight:var(--tk-fw-semibold); }
  .tk-wd__track { position:relative; height:6px; border-radius:3px; background:var(--tk-c-surface3); }
  .tk-wd__fill { position:absolute; top:0; bottom:0; border-radius:3px; background:linear-gradient(90deg, var(--tk-c-info), var(--tk-c-warning)); }
  .bp-mobile .tk-wd__row { grid-template-columns:58px 24px 50px minmax(0,1fr); gap:var(--tk-space-2); min-height:56px; padding:6px var(--tk-space-2); }
  .bp-mobile .tk-wd__range { grid-template-columns:32px minmax(0,1fr) 32px; gap:8px; }
  [data-tk-large-text] .tk-wd__row { grid-template-columns:minmax(0,1fr) 28px auto; row-gap:4px; padding-block:8px; } [data-tk-large-text] .tk-wd__row > :nth-child(4) { grid-column:1 / -1; grid-row:2; }
  .tk-wd__tiles { display:grid; grid-template-columns:repeat(var(--n), minmax(0, 1fr)); max-width:calc(var(--n) * 160px); gap:var(--tk-space-2); }
  .bp-mobile .tk-wd__tiles { grid-template-columns:repeat(auto-fill, minmax(84px, 1fr)); max-width:none; }
  .tk-wd__tile { display:flex; flex-direction:column; align-items:center; gap:6px; padding:12px 6px; border:1px solid var(--tk-c-border); border-radius:var(--tk-radius-lg); background:var(--tk-c-surface2); color:var(--tk-c-text); font:inherit; cursor:pointer; min-height:120px; }
  .tk-wd__tile:hover { border-color:var(--tk-c-border-strong); }
  .tk-wd__tile[aria-pressed="true"] { border-color:var(--tk-c-accent); background:var(--tk-c-accent-soft); }`,
  example: { data: { days: [
    { date: '2026-11-24', code: 'cloudy', min: 3, max: 7, pop: 30 }, { date: '2026-11-25', code: 'rain', min: 4, max: 6, pop: 90 }, { date: '2026-11-26', code: 'sun', min: 0, max: 5, pop: 0 },
    { date: '2026-11-27', code: 'partly', min: -1, max: 4, pop: 10 }, { date: '2026-11-28', code: 'snow', min: -2, max: 2, pop: 60 }, { date: '2026-11-29', code: 'cloudy', min: 0, max: 3, pop: 20 }, { date: '2026-11-30', code: 'drizzle', min: 1, max: 5, pop: 50 },
  ] } },
  render: ({ props, data, ctx }) => {
    const days = (data.days || []).slice(0, props.days);
    if (!days.length) return html`<${Card} title=${props.title} icon="calendar-days"><${EmptyState} icon="cloud" title="Keine Vorhersage" text="Die Tagesvorhersage ist gerade nicht verfügbar." /><//>`;
    const lo = Math.min(...days.map((d) => d.min)), hi = Math.max(...days.map((d) => d.max)), range = hi - lo || 1;
    const sel = ctx.ui.selectedDate ? String(ctx.ui.selectedDate).slice(0, 10) : dayKey(ctx.today);
    const pick = (d) => { ctx.setUi('selectedDate', dayKey(d.date)); ctx.emit('weather.day', { date: dayKey(d.date) }); };
    const wc = (w) => `color:var(--tk-c-${w.tone === 'neutral' ? 'text-muted' : w.tone})`;
    const body = props.layout === 'tiles'
      ? html`<div class="tk-wd__tiles" style=${`--n:${days.length}`}>${days.map((d) => { const w = wx(d.code); return html`<button type="button" class="tk-wd__tile" aria-pressed=${dayKey(d.date) === sel ? 'true' : 'false'} aria-label=${`${dayLabel(d.date, ctx.today, true)}, ${w.label}, ${deg(d.max)} Höchstwert`} onClick=${() => pick(d)}>
          <span class="tk-wd__day">${dayLabel(d.date, ctx.today)}</span><span style=${wc(w)}><${Icon} name=${w.icon} size=${26} /></span>
          <strong class="tk-num">${deg(d.max)}</strong><span class="tk-muted tk-num" style="font-size:var(--tk-fs-sm)">${deg(d.min)}</span>
          <span class="tk-wd__pop">${d.pop >= 20 ? html`<${Icon} name="droplets" size=${12} />${d.pop} %` : ''}</span></button>`; })}</div>`
      : html`<div class="tk-col" style="gap:2px">${days.map((d) => { const w = wx(d.code); const l = ((d.min - lo) / range) * 100, r = ((d.max - lo) / range) * 100;
        return html`<button type="button" class="tk-wd__row" aria-pressed=${dayKey(d.date) === sel ? 'true' : 'false'} aria-label=${`${dayLabel(d.date, ctx.today, true)}, ${w.label}, ${deg(d.min)} bis ${deg(d.max)}`} onClick=${() => pick(d)}>
          <span class="tk-wd__day">${dayLabel(d.date, ctx.today)}<span class="tk-wd__date">${fmt.dateShort(d.date)}</span></span>
          <span style=${wc(w)}><${Icon} name=${w.icon} size=${22} /></span>
          <span class="tk-wd__pop">${d.pop >= 20 ? html`<${Icon} name="droplets" size=${12} />${d.pop} %` : ''}</span>
          ${props.showBars ? html`<span class="tk-wd__range"><span class="tk-wd__min">${deg(d.min)}</span><span class="tk-wd__track"><span class="tk-wd__fill" style=${`left:${l}%;width:${Math.max(r - l, 6)}%`}></span></span><span class="tk-wd__max">${deg(d.max)}</span></span>`
            : html`<span class="tk-num"><strong>${deg(d.max)}</strong> <span class="tk-muted">${deg(d.min)}</span></span>`}</button>`; })}</div>`;
    return html`<${Card} title=${props.title} icon="calendar-days">${body}<//>`;
  },
};
