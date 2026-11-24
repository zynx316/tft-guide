// Wetter: aktuelle Bedingungen
import { html } from '../../../lib/html.js';
import { Card, Button, Icon, EmptyState, toneColor } from '../../ui.js';
import { fmt } from '../../../lib/util.js';
import { wx, deg, mm } from './weather-util.js';

export const weatherNow = {
  id: 'weather-now',
  name: 'Aktuelles Wetter',
  category: 'Wetter',
  description: 'Aktuelle Bedingungen groß: Temperatur, gefühlte Temperatur, Zustand mit Icon, Wind, Niederschlag, Luftfeuchte – plus Ort, Tageshoch/-tief und Sonnenzeiten.',
  version: '1.0',
  props: [
    { name: 'layout', label: 'Darstellung', type: 'select', options: ['hero', 'compact'], default: 'hero' },
    { name: 'showDetails', label: 'Detailwerte', type: 'boolean', default: true },
    { name: 'showSummary', label: 'Zusammenfassung (Text)', type: 'boolean', default: true },
    { name: 'showSun', label: 'Sonnenauf-/untergang', type: 'boolean', default: true },
  ],
  data: [{ slot: 'current', label: 'Aktuelle Werte', default: 'current', shape: '{location,updated,temp,feels,code,high,low,wind,windDir,gust,precip,pop,humidity,pressure?,uv?,sunrise?,sunset?,summary?}', required: true }],
  events: ['weather.refresh', 'weather.detail'],
  states: ['empty'],
  css: `
  .tk-wnow { display:flex; flex-direction:column; gap:var(--tk-space-5); min-width:0; }
  .tk-wnow__top { display:flex; align-items:center; gap:var(--tk-space-3); min-width:0; }
  .tk-wnow__loc { display:flex; align-items:center; gap:6px; font-weight:var(--tk-fw-semibold); min-width:0; }
  .tk-wnow__upd { font-size:var(--tk-fs-xs); color:var(--tk-c-text-subtle); }
  .tk-wnow__main { display:flex; align-items:center; gap:var(--tk-space-6); flex-wrap:wrap; min-width:0; }
  .tk-wnow__icon { width:96px; height:96px; border-radius:28px; display:grid; place-items:center; flex:none; }
  .tk-wnow__temp { font-size:72px; font-weight:var(--tk-fw-bold); letter-spacing:-0.04em; line-height:1; font-variant-numeric:tabular-nums; }
  .tk-wnow__cond { font-size:var(--tk-fs-xl); font-weight:var(--tk-fw-semibold); margin-top:6px; }
  .tk-wnow__sub { color:var(--tk-c-text-muted); font-size:var(--tk-fs-sm); margin-top:2px; }
  .tk-wnow__grid { display:grid; grid-template-columns:repeat(4, minmax(0,1fr)); gap:var(--tk-space-3); }
  .bp-tablet .tk-wnow__grid { grid-template-columns:repeat(2, minmax(0,1fr)); }
  .bp-mobile .tk-wnow__grid { grid-template-columns:repeat(2, minmax(0,1fr)); gap:var(--tk-space-2); }
  .tk-wnow__cell { display:flex; flex-direction:column; gap:4px; padding:var(--tk-space-3); border-radius:var(--tk-radius-md); background:var(--tk-c-surface2); border:1px solid var(--tk-c-border); text-align:left; color:inherit; font:inherit; cursor:pointer; min-width:0; }
  .tk-wnow__cell:hover { border-color:var(--tk-c-border-strong); }
  .tk-wnow__cell-l { display:flex; align-items:center; gap:6px; font-size:var(--tk-fs-xs); color:var(--tk-c-text-muted); text-transform:uppercase; letter-spacing:var(--tk-ls-wide); font-weight:var(--tk-fw-semibold); }
  .tk-wnow__cell-v { font-size:var(--tk-fs-xl); font-weight:var(--tk-fw-semibold); font-variant-numeric:tabular-nums; }
  .tk-wnow__cell-s { font-size:var(--tk-fs-xs); color:var(--tk-c-text-subtle); }
  .tk-wnow__summary { padding:var(--tk-space-3) var(--tk-space-4); border-radius:var(--tk-radius-md); background:var(--tk-c-accent-soft); color:var(--tk-c-text); font-size:var(--tk-fs-md); display:flex; gap:10px; align-items:flex-start; }
  .tk-wnow__summary svg { flex:none; margin-top:3px; color:var(--tk-c-accent); }
  .tk-wnow__sun { display:flex; gap:var(--tk-space-5); font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); flex-wrap:wrap; }
  .tk-wnow__sun span { display:inline-flex; align-items:center; gap:6px; }
  .tk-wnow--compact .tk-wnow__icon { width:60px; height:60px; border-radius:18px; }
  .tk-wnow--compact .tk-wnow__temp { font-size:var(--tk-fs-4xl); }
  .bp-mobile .tk-wnow__temp { font-size:60px; }
  .bp-mobile .tk-wnow__icon { width:80px; height:80px; border-radius:24px; }
  .bp-mobile .tk-wnow__main { gap:var(--tk-space-4); }`,
  example: { data: { current: { location: 'Bielefeld', updated: '2026-11-24T09:15:00', temp: 6, feels: 3, code: 'cloudy', high: 7, low: 3, wind: 18, windDir: 'SW', gust: 34, precip: 0.2, pop: 30, humidity: 84, pressure: 1012, uv: 1, sunrise: '07:52', sunset: '16:28', summary: 'Meist trüb und mild für die Jahreszeit, am Nachmittag vereinzelt Schauer.' } } },
  render: ({ props, data, ctx }) => {
    const c = data.current;
    if (!c || c.temp == null) return html`<${Card}><${EmptyState} icon="cloud" title="Keine Wetterdaten" text="Für diesen Ort liegen gerade keine Daten vor." /><//>`;
    const w = wx(c.code); const col = toneColor(w.tone);
    const cells = [
      { id: 'feels', icon: 'thermometer', l: 'Gefühlt', v: deg(c.feels), s: c.feels < c.temp ? 'Kälter durch Wind' : 'Wie gemessen' },
      { id: 'wind', icon: 'wind', l: 'Wind', v: `${fmt.number(c.wind)} km/h`, s: `${c.windDir || ''}${c.gust ? ` · Böen ${fmt.number(c.gust)}` : ''}` },
      { id: 'precip', icon: 'umbrella', l: 'Niederschlag', v: mm(c.precip ?? 0), s: c.pop != null ? `Wahrsch. ${fmt.number(c.pop)} %` : 'letzte Stunde' },
      { id: 'humidity', icon: 'droplets', l: 'Luftfeuchte', v: `${fmt.number(c.humidity)} %`, s: c.pressure ? `${fmt.number(c.pressure)} hPa` : '' },
    ];
    return html`<${Card}><div class=${`tk-wnow tk-wnow--${props.layout}`}>
      <div class="tk-wnow__top">
        <div class="tk-wnow__loc tk-grow"><span style="color:var(--tk-c-accent)"><${Icon} name="map-pin" size=${17} /></span><span class="tk-truncate">${c.location}</span><span class="tk-wnow__upd">· ${fmt.time(c.updated)} Uhr</span></div>
        <${Button} variant="ghost" size="sm" icon="refresh-cw" aria-label="Aktualisieren" onClick=${() => { ctx.emit('weather.refresh'); ctx.toast('Wetter aktualisiert'); }} />
      </div>
      <div class="tk-wnow__main">
        <div class="tk-wnow__icon" style=${`background:color-mix(in srgb, ${col} 16%, transparent);color:${col}`}><${Icon} name=${w.icon} size=${props.layout === 'compact' ? 32 : 48} stroke=${1.6} /></div>
        <div><div class="tk-wnow__temp">${deg(c.temp)}</div><div class="tk-wnow__cond">${w.label}</div>
          <div class="tk-wnow__sub">Heute ${deg(c.high)} / ${deg(c.low)}</div></div>
      </div>
      ${props.showSummary && c.summary && html`<div class="tk-wnow__summary"><${Icon} name="sparkles" size=${16} /><span>${c.summary}</span></div>`}
      ${props.showDetails && html`<div class="tk-wnow__grid">${cells.map((x) => html`<button type="button" class="tk-wnow__cell" onClick=${() => ctx.emit('weather.detail', { metric: x.id })}>
        <span class="tk-wnow__cell-l"><${Icon} name=${x.icon} size=${14} />${x.l}</span><span class="tk-wnow__cell-v">${x.v}</span><span class="tk-wnow__cell-s">${x.s || ' '}</span></button>`)}</div>`}
      ${props.showSun && c.sunrise && html`<div class="tk-wnow__sun"><span><${Icon} name="sunrise" size=${16} />Aufgang ${c.sunrise}</span><span><${Icon} name="sunset" size=${16} />Untergang ${c.sunset}</span>${c.uv != null && html`<span><${Icon} name="sun-medium" size=${16} />UV-Index ${c.uv}</span>`}</div>`}
    </div><//>`;
  },
};
