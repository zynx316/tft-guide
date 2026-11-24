// Wetter: stündlicher Verlauf (Temperaturkurve + Niederschlagsbalken)
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Card, Button, Icon, EmptyState } from '../../ui.js';
import { fmt } from '../../../lib/util.js';
import { wx, deg, mm, dayKey, dayLabel } from './weather-util.js';

const H = 100, TOP = 26, BOT = 12;

export const weatherHourly = {
  id: 'weather-hourly',
  name: 'Stündliche Vorhersage',
  category: 'Wetter',
  description: 'Temperaturkurve (SVG) mit Zustands-Icons und Niederschlagsbalken je Stunde. Auf Mobile horizontal wischbar (nur der Verlauf scrollt, nicht die Seite). Zeigt den in der Tagesvorhersage gewählten Tag (ctx.ui.selectedDate), sonst die nächsten Stunden ab „jetzt“.',
  version: '1.0',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Stündlich' },
    { name: 'count', label: 'Anzahl Stunden (ab jetzt)', type: 'number', default: 24 },
    { name: 'showPrecip', label: 'Niederschlagsbalken', type: 'boolean', default: true },
    { name: 'showDetail', label: 'Detailzeile zur gewählten Stunde', type: 'boolean', default: true },
  ],
  data: [{ slot: 'hours', label: 'Stundenwerte', default: 'hours', shape: '{time,temp,code,precip?,pop?,wind?}[]', required: true }],
  events: ['weather.hour', 'weather.day'],
  states: ['empty'],
  css: `
  .tk-wh__scroll { overflow-x:auto; scrollbar-width:thin; padding-bottom:4px; margin:0 calc(var(--tk-space-2) * -1); }
  .tk-wh__row { display:grid; grid-template-columns:repeat(var(--n), minmax(56px, 1fr)); min-width:calc(var(--n) * 56px); }
  .tk-wh__col { display:flex; flex-direction:column; align-items:center; gap:6px; padding:8px 0 6px; border:0; border-radius:var(--tk-radius-md); background:transparent; color:var(--tk-c-text); font:inherit; cursor:pointer; min-width:0; }
  .tk-wh__col:hover { background:var(--tk-c-surface2); }
  .tk-wh__col[aria-pressed="true"] { background:var(--tk-c-accent-soft); }
  .tk-wh__time { font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); font-variant-numeric:tabular-nums; }
  .tk-wh__col[aria-pressed="true"] .tk-wh__time { color:var(--tk-c-text); font-weight:var(--tk-fw-semibold); }
  .tk-wh__pop { font-size:var(--tk-fs-xs); color:var(--tk-c-info); height:14px; font-weight:var(--tk-fw-semibold); }
  .tk-wh__chart { position:relative; width:100%; height:${H}px; }
  .tk-wh__chart svg { position:absolute; top:0; left:-1px; width:calc(100% + 2px); height:100%; display:block; }
  .tk-wh__dot { position:absolute; left:50%; width:9px; height:9px; margin:-4.5px 0 0 -4.5px; border-radius:50%; background:var(--tk-c-accent); border:2px solid var(--tk-c-surface); box-sizing:content-box; }
  .tk-wh__t { position:absolute; left:0; right:0; text-align:center; font-size:var(--tk-fs-sm); font-weight:var(--tk-fw-semibold); font-variant-numeric:tabular-nums; }
  .tk-wh__bars { position:relative; width:100%; height:44px; display:flex; flex-direction:column; justify-content:flex-end; align-items:center; gap:3px; }
  .tk-wh__bar { width:18px; border-radius:4px 4px 0 0; background:var(--tk-c-info); opacity:.85; min-height:2px; }
  .tk-wh__mm { font-size:var(--tk-fs-xs); color:var(--tk-c-text-subtle); font-variant-numeric:tabular-nums; height:14px; }
  .tk-wh__detail { display:flex; align-items:center; gap:10px; flex-wrap:wrap; padding:10px 14px; border-radius:var(--tk-radius-md); background:var(--tk-c-surface2); font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); margin-bottom:var(--tk-space-3); }
  .tk-wh__detail strong { color:var(--tk-c-text); }
  .tk-wh__detail span { display:inline-flex; align-items:center; gap:5px; }`,
  example: { data: { hours: Array.from({ length: 15 }, (_, i) => { const rainy = i % 7 >= 3 && i % 7 < 5; return { time: `2026-11-24T${String(9 + i).padStart(2, '0')}:00:00`, temp: Math.round(5 + 3 * Math.sin(((i + 3) / 24) * 2 * Math.PI)), code: rainy ? 'rain' : i % 7 < 3 ? 'cloudy' : 'partly', precip: rainy ? 0.6 : 0, pop: rainy ? 60 : 10, wind: 18 }; }) } },
  render: ({ props, data, ctx }) => {
    const [selIdx, setSel] = useState(0);
    const all = data.hours || [];
    const selDay = ctx.ui.selectedDate ? String(ctx.ui.selectedDate).slice(0, 10) : null;
    const nowH = new Date(ctx.today); nowH.setMinutes(0, 0, 0);
    let hrs = selDay ? all.filter((h) => dayKey(h.time) === selDay) : all.filter((h) => new Date(h.time) >= nowH).slice(0, props.count);
    const head = selDay ? html`<div class="tk-row" style="margin-bottom:${hrs.length ? 12 : 0}px">
      <span class="tk-grow tk-muted" style="font-size:var(--tk-fs-sm)">${hrs.length ? `${dayLabel(hrs[0].time, ctx.today, true)}, ${fmt.dateShort(hrs[0].time)}` : 'Gewählter Tag'}</span>
      <${Button} size="sm" variant="ghost" icon="rotate-ccw" onClick=${() => { ctx.setUi('selectedDate', null); ctx.emit('weather.day', { date: null }); }}>Ab jetzt<//></div>` : null;
    if (!hrs.length) return html`<${Card} title=${props.title} icon="clock">${head}<${EmptyState} icon="clock" title="Keine Stundenwerte" text="Für diesen Zeitraum liegen keine Stundenwerte vor." /><//>`;
    const temps = hrs.map((h) => h.temp); const min = Math.min(...temps), max = Math.max(...temps), range = max - min || 1;
    const y = (t) => TOP + (1 - (t - min) / range) * (H - TOP - BOT);
    const maxMm = Math.max(1, ...hrs.map((h) => h.precip || 0));
    const sel = hrs[Math.min(selIdx, hrs.length - 1)];
    const sw = wx(sel.code);
    return html`<${Card} title=${props.title} icon="clock">
      ${head}
      ${props.showDetail && html`<div class="tk-wh__detail" aria-live="polite"><strong>${fmt.time(sel.time)} Uhr</strong><span><${Icon} name=${sw.icon} size=${15} />${sw.label}</span><strong>${deg(sel.temp)}</strong>
        ${sel.wind != null && html`<span><${Icon} name="wind" size=${14} />${fmt.number(sel.wind)} km/h</span>`}<span><${Icon} name="umbrella" size=${14} />${mm(sel.precip || 0)}${sel.pop != null ? ` · ${sel.pop} %` : ''}</span></div>`}
      <div class="tk-wh__scroll" data-scroll-x tabindex="0" role="group" aria-label="Stündlicher Verlauf, horizontal scrollbar">
        <div class="tk-wh__row" style=${`--n:${hrs.length}`}>
          ${hrs.map((h, i) => {
            const yc = y(h.temp), yp = i ? (y(hrs[i - 1].temp) + yc) / 2 : yc, yn = i < hrs.length - 1 ? (y(hrs[i + 1].temp) + yc) / 2 : yc;
            const line = `M0,${yp.toFixed(1)} L50,${yc.toFixed(1)} L100,${yn.toFixed(1)}`; const w = wx(h.code);
            const isNow = selDay ? false : i === 0;
            return html`<button type="button" class="tk-wh__col" aria-pressed=${i === Math.min(selIdx, hrs.length - 1) ? 'true' : 'false'} aria-label=${`${fmt.time(h.time)} Uhr, ${w.label}, ${deg(h.temp)}`} onClick=${() => { setSel(i); ctx.emit('weather.hour', { time: h.time }); }}>
              <span class="tk-wh__time">${isNow ? 'Jetzt' : fmt.time(h.time)}</span>
              <span style=${`color:var(--tk-c-${w.tone === 'neutral' ? 'text-muted' : w.tone})`}><${Icon} name=${w.icon} size=${22} /></span>
              <span class="tk-wh__pop">${h.pop >= 20 ? `${h.pop} %` : ''}</span>
              <div class="tk-wh__chart"><svg viewBox=${`0 0 100 ${H}`} preserveAspectRatio="none" aria-hidden="true">
                  <path d=${`${line} L100,${H} L0,${H} Z`} style="fill:color-mix(in srgb, var(--tk-c-accent) 14%, var(--tk-c-surface))" />
                  <path d=${line} fill="none" stroke="var(--tk-c-accent)" stroke-width="2" vector-effect="non-scaling-stroke" stroke-linejoin="round" /></svg>
                <span class="tk-wh__t" style=${`top:${(yc - 24).toFixed(1)}px`}>${deg(h.temp)}</span><span class="tk-wh__dot" style=${`top:${yc.toFixed(1)}px`}></span></div>
              ${props.showPrecip && html`<div class="tk-wh__bars">${(h.precip || 0) > 0 && html`<span class="tk-wh__bar" style=${`height:${Math.max(4, (h.precip / maxMm) * 32).toFixed(0)}px`}></span>`}<span class="tk-wh__mm">${h.precip > 0 ? fmt.number(h.precip, 1) : ''}</span></div>`}
            </button>`; })}
        </div>
      </div>
      ${props.showPrecip && html`<div class="tk-subtle" style="font-size:var(--tk-fs-xs);margin-top:6px">Balken: Niederschlag in mm je Stunde · % = Regenwahrscheinlichkeit</div>`}
    <//>`;
  },
};
