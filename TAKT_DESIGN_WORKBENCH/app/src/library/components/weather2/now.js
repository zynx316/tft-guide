// Wetter: aktuelle Bedingungen (wx-now) und Messwerte (wx-stats)
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Card, Badge, Button, Icon } from '../../ui.js';
import { placeOf, settingsOf, unitsOf, cond, freshness, toneVar, NoPlace, CondIcon, WindArrow, SLOT_PLACE, SLOT_SETTINGS, EX } from './_weather2.js';

export const wxNow = {
  id: 'wx-now',
  name: 'Jetzt (Ort & Zustand)',
  category: 'Wetter',
  description: 'Aktuelles Wetter des gewählten Ortes: Temperatur, Zustand, gefühlte Temperatur, Hoch/Tief und Kurztext. Als große Karte, kompakte Zeile oder einzeilige Leiste. Zeigt Offline-/Veraltet-Hinweis mit Stand und folgt den Einheiten.',
  version: '1.1',
  props: [
    { name: 'layout', label: 'Darstellung', type: 'select', options: ['hero', 'compact', 'line'], default: 'hero' },
    { name: 'showSummary', label: 'Kurztext', type: 'boolean', default: true },
    { name: 'showLocation', label: 'Ort anzeigen', type: 'boolean', default: true },
  ],
  data: [SLOT_PLACE, SLOT_SETTINGS],
  events: ['weather.refresh', 'weather.locations.open'],
  states: ['empty'],
  css: `
  .tk-wxnow { display:flex; flex-direction:column; gap:var(--tk-space-4); min-width:0; }
  .tk-wxnow--hero { padding:var(--tk-space-5); border-radius:var(--tk-radius-xl); border:1px solid var(--tk-c-border); background:linear-gradient(155deg, color-mix(in srgb, var(--wx-tone) 20%, var(--tk-c-surface)) 0%, var(--tk-c-surface) 70%); }
  .tk-wxnow__top { display:flex; align-items:center; gap:var(--tk-space-2); min-width:0; }
  .tk-wxnow__loc { display:inline-flex; align-items:center; gap:6px; min-height:36px; padding:0 10px 0 6px; margin-left:-6px; border:0; border-radius:var(--tk-radius-md); background:transparent; color:var(--tk-c-text); font:inherit; font-weight:var(--tk-fw-semibold); cursor:pointer; min-width:0; }
  .tk-wxnow__loc:hover { background:var(--tk-c-surface2); }
  .tk-wxnow__main { display:flex; align-items:center; justify-content:space-between; gap:var(--tk-space-4); min-width:0; }
  .tk-wxnow__temp { font-size:76px; font-weight:var(--tk-fw-bold); letter-spacing:-0.045em; line-height:.95; font-variant-numeric:tabular-nums; }
  .tk-wxnow__cond { font-size:var(--tk-fs-xl); font-weight:var(--tk-fw-semibold); margin-top:6px; }
  .tk-wxnow__sub { color:var(--tk-c-text-muted); font-size:var(--tk-fs-md); margin-top:2px; display:flex; gap:var(--tk-space-3); flex-wrap:wrap; }
  .tk-wxnow__big { flex:none; display:grid; place-items:center; width:116px; height:116px; border-radius:34px; color:var(--wx-tone); background:color-mix(in srgb, var(--wx-tone) 14%, transparent); }
  .tk-wxnow__sum { display:flex; gap:10px; align-items:flex-start; padding:var(--tk-space-3) var(--tk-space-4); border-radius:var(--tk-radius-md); background:color-mix(in srgb, var(--tk-c-surface) 70%, transparent); border:1px solid var(--tk-c-border); font-size:var(--tk-fs-md); line-height:1.45; }
  .tk-wxnow__sum svg { flex:none; margin-top:2px; color:var(--tk-c-accent); }
  .tk-wxnow--compact { flex-direction:row; align-items:center; gap:var(--tk-space-4); }
  .tk-wxnow--compact .tk-wxnow__temp { font-size:var(--tk-fs-4xl); line-height:1; }
  .tk-wxnow__line { display:flex; align-items:center; gap:var(--tk-space-3); flex-wrap:wrap; min-width:0; }
  .tk-wxnow__where { display:inline-flex; align-items:center; gap:5px; font-size:var(--tk-fs-sm); font-weight:var(--tk-fw-semibold); color:var(--tk-c-text-muted); min-width:0; }
  .tk-wxnow__stale { animation:none; }
  .bp-mobile .tk-wxnow--hero { padding:var(--tk-space-4); }
  .bp-mobile .tk-wxnow__temp { font-size:64px; }
  .bp-mobile .tk-wxnow__big { width:92px; height:92px; border-radius:28px; }
  @keyframes tk-wxspin { to { transform:rotate(360deg); } }
  .tk-wxnow__spin svg { animation:tk-wxspin .8s linear 1; }`,
  example: { data: { place: EX.place, settings: EX.settings } },
  render: ({ props, data, ctx }) => {
    const [spin, setSpin] = useState(0);
    const place = placeOf(data);
    if (!place) return html`<${NoPlace} />`;
    const S = settingsOf(data), U = unitsOf(S), c = place.current, w = cond(c.code, c.night), fr = freshness(place, S, ctx.today);
    const tone = toneVar(w.tone), loc = place.name;
    const refresh = () => { setSpin(spin + 1); ctx.emit('weather.refresh', { place: place.id }); ctx.toast(S.offline ? 'Offline – letzter Stand wird angezeigt' : 'Wetter aktualisiert'); };
    const stat = fr.state !== 'ok' ? html`<${Badge} tone="warning" icon=${fr.icon}>${fr.label}<//>` : html`<span class="tk-subtle" style="font-size:var(--tk-fs-xs)">${fr.label}</span>`;
    if (props.layout === 'line') return html`<${Card}><div class="tk-wxnow__line" style=${`--wx-tone:${tone}`}><${CondIcon} code=${c.code} night=${c.night} size=${22} box=${40} />
      ${props.showLocation && html`<span class="tk-wxnow__where"><${Icon} name="map-pin" size=${13} />${loc}</span>`}<strong class="tk-num" style="font-size:var(--tk-fs-2xl)">${U.t(c.temp)}</strong><span>${w.label}</span><span class="tk-muted">Gefühlt ${U.t(c.feels)} · ${U.t(c.high)} / ${U.t(c.low)}</span>${fr.state !== 'ok' && stat}</div><//>`;
    const loca = props.showLocation && html`<button type="button" class="tk-wxnow__loc" aria-label=${`Ort wählen, aktuell ${loc}`} onClick=${() => ctx.emit('weather.locations.open', { id: place.id })}><span style="color:var(--tk-c-accent);display:inline-flex"><${Icon} name=${place.isCurrentLocation ? 'map-pin' : 'map'} size=${17} /></span><span class="tk-truncate">${loc}</span><${Icon} name="chevron-down" size=${14} /></button>`;
    const top = html`<div class="tk-wxnow__top">${loca}<span class="tk-grow"></span>${stat}<${Button} size="sm" variant="ghost" icon="refresh-cw" class=${spin ? 'tk-wxnow__spin' : ''} key=${spin} aria-label="Aktualisieren" onClick=${refresh} /></div>`;
    if (props.layout === 'compact') return html`<${Card}><div class="tk-wxnow tk-wxnow--compact" style=${`--wx-tone:${tone}`}>
      <${CondIcon} code=${c.code} night=${c.night} size=${32} box=${64} /><div class="tk-grow">${props.showLocation && html`<div class="tk-wxnow__where"><${Icon} name="map-pin" size=${13} />${loc}</div>`}<div class="tk-wxnow__temp">${U.t(c.temp)}</div><div class="tk-muted" style="font-size:var(--tk-fs-sm)">${w.label} · Gefühlt ${U.t(c.feels)}</div></div>
      <div style="text-align:right"><div class="tk-num"><strong>${U.t(c.high)}</strong> <span class="tk-muted">${U.t(c.low)}</span></div>${stat}</div></div><//>`;
    return html`<div class="tk-wxnow tk-wxnow--hero" style=${`--wx-tone:${tone}`}>${top}
      <div class="tk-wxnow__main"><div><div class="tk-wxnow__temp">${U.t(c.temp)}</div><div class="tk-wxnow__cond">${w.label}</div>
        <div class="tk-wxnow__sub"><span>Gefühlt ${U.t(c.feels)}</span><span>Hoch ${U.t(c.high)} · Tief ${U.t(c.low)}</span></div></div>
        <div class="tk-wxnow__big"><${Icon} name=${w.icon} size=${ctx.bp === 'mobile' ? 50 : 62} stroke=${1.5} /></div></div>
      ${props.showSummary && c.summary && html`<div class="tk-wxnow__sum"><${Icon} name="sparkles" size=${16} /><span>${c.summary}</span></div>`}</div>`;
  },
};

const METRICS = {
  wind: (c, U) => ({ icon: 'wind', l: 'Wind', v: U.w(c.wind), s: `${c.windDir} · Böen ${U.w(c.gust)}`, arrow: c.windDeg }),
  gust: (c, U) => ({ icon: 'tornado', l: 'Böen', v: U.w(c.gust), s: 'Spitze der letzten Stunde' }),
  rain: (c, U) => ({ icon: 'umbrella', l: 'Niederschlag', v: U.p(c.precip), s: `Risiko ${Math.round(c.pop)} %` }),
  humidity: (c) => ({ icon: 'droplets', l: 'Luftfeuchte', v: `${Math.round(c.humidity)} %`, s: `Wolken ${Math.round(c.cloud)} %` }),
  pressure: (c, U) => ({ icon: 'gauge', l: 'Luftdruck', v: U.pr(c.pressure), s: c.pressure < 1013 ? 'unter Normal' : 'über Normal' }),
  dew: (c, U) => ({ icon: 'thermometer', l: 'Taupunkt', v: U.t(c.dewPoint), s: c.dewPoint >= 16 ? 'schwül' : 'angenehm trocken' }),
  vis: (c) => ({ icon: 'eye', l: 'Sicht', v: `${Math.round(c.visibility)} km`, s: c.visibility >= 10 ? 'gut' : 'eingeschränkt' }),
  uv: (c, U, p) => ({ icon: 'sun-medium', l: 'UV-Index', v: `${p.uv.max}`, s: p.uv.max <= 2 ? 'gering – kein Schutz nötig' : 'Schutz empfohlen', nav: true }),
  air: (c, U, p) => ({ icon: 'leaf', l: 'Luftqualität', v: p.air.label, s: `Stufe ${p.air.index} von 6`, nav: true }),
  pollen: (c, U, p) => { const m = Math.max(...p.pollen.types.map((t) => t.levels[0])); return { icon: 'flower-2', l: 'Pollen', v: ['Keine', 'Gering', 'Mäßig', 'Stark'][m], s: m ? 'Pollenflug aktiv' : 'kein Pollenflug', nav: true }; },
};
export const wxStats = {
  id: 'wx-stats',
  name: 'Messwerte',
  category: 'Wetter',
  description: 'Detailwerte des aktuellen Wetters (Wind mit Richtung, Böen, Niederschlag, Luftfeuchte, Druck, Taupunkt, Sicht) plus UV, Luft und Pollen. Als Kacheln oder dichte Zeilen. UV/Luft/Pollen öffnen den Bereich „Pollen, UV & Luft“.',
  version: '1.1',
  props: [
    { name: 'metrics', label: 'Werte (Reihenfolge)', type: 'list', default: ['wind', 'rain', 'humidity', 'pressure', 'uv', 'air'] },
    { name: 'layout', label: 'Darstellung', type: 'select', options: ['tiles', 'rows'], default: 'tiles' },
    { name: 'title', label: 'Titel', type: 'text', default: '' },
  ],
  data: [SLOT_PLACE, SLOT_SETTINGS],
  events: ['weather.detail', 'weather.environment.open'],
  states: ['empty'],
  css: `
  .tk-wxs { display:grid; grid-template-columns:repeat(auto-fill, minmax(150px, 1fr)); gap:var(--tk-space-3); }
  .tk-wxs__tile { display:flex; flex-direction:column; gap:4px; padding:var(--tk-space-3) var(--tk-space-4); border-radius:var(--tk-radius-lg); background:var(--tk-c-surface); border:1px solid var(--tk-c-border); color:var(--tk-c-text); font:inherit; text-align:left; cursor:pointer; min-width:0; min-height:92px; }
  .tk-wxs__tile:hover { border-color:var(--tk-c-border-strong); }
  .tk-wxs__tile { min-width:0; overflow-wrap:anywhere; text-align:left; } .tk-wxs__l { min-width:0; overflow-wrap:anywhere; }
  .tk-wxs__l { display:flex; align-items:center; gap:6px; font-size:var(--tk-fs-xs); font-weight:var(--tk-fw-semibold); letter-spacing:var(--tk-ls-wide); text-transform:uppercase; color:var(--tk-c-text-muted); }
  .tk-wxs__v { font-size:var(--tk-fs-xl); font-weight:var(--tk-fw-semibold); font-variant-numeric:tabular-nums; display:flex; align-items:center; gap:8px; }
  .tk-wxs__s { font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); }
  .tk-wxs__row { display:flex; align-items:center; gap:var(--tk-space-3); width:100%; min-height:44px; padding:6px var(--tk-space-4); border:0; border-bottom:1px solid var(--tk-c-border); background:transparent; color:var(--tk-c-text); font:inherit; text-align:left; cursor:pointer; }
  .tk-wxs__row:last-child { border-bottom:0; } .tk-wxs__row:hover { background:var(--tk-c-surface2); }
  .tk-wxs__row .tk-wxs__ic { color:var(--tk-c-text-muted); display:inline-flex; width:20px; }
  .tk-wxs__row .tk-wxs__s { margin-left:auto; text-align:right; max-width:55%; }
  .bp-mobile .tk-wxs { grid-template-columns:repeat(2, minmax(0,1fr)); gap:var(--tk-space-2); }`,
  example: { props: { metrics: ['wind', 'rain', 'humidity', 'pressure', 'uv', 'air', 'pollen', 'dew'] }, data: { place: EX.place, settings: EX.settings } },
  render: ({ props, data, ctx }) => {
    const place = placeOf(data);
    if (!place) return html`<${NoPlace} />`;
    const U = unitsOf(settingsOf(data));
    const list = (Array.isArray(props.metrics) ? props.metrics : String(props.metrics).split(',')).map((s) => s.trim()).filter((k) => METRICS[k]);
    const items = list.map((k) => ({ k, ...METRICS[k](place.current, U, place) }));
    const open = (m) => (m.nav ? ctx.emit('weather.environment.open', { id: m.k }) : ctx.emit('weather.detail', { metric: m.k }));
    const val = (m) => html`${m.v}${m.arrow != null && html`<${WindArrow} deg=${m.arrow} size=${15} />`}`;
    const body = props.layout === 'rows'
      ? items.map((m) => html`<button type="button" class="tk-wxs__row" onClick=${() => open(m)}><span class="tk-wxs__ic"><${Icon} name=${m.icon} size=${16} /></span><span class="tk-muted">${m.l}</span><strong class="tk-num" style="display:inline-flex;align-items:center;gap:6px">${val(m)}</strong><span class="tk-wxs__s tk-truncate">${m.s}</span></button>`)
      : html`<div class="tk-wxs">${items.map((m) => html`<button type="button" class="tk-wxs__tile" onClick=${() => open(m)}><span class="tk-wxs__l"><${Icon} name=${m.icon} size=${14} />${m.l}</span><span class="tk-wxs__v">${val(m)}</span><span class="tk-wxs__s">${m.s}</span></button>`)}</div>`;
    return props.layout === 'rows' ? html`<${Card} flush title=${props.title || 'Details'} icon="gauge">${body}<//>` : props.title ? html`<${Card} title=${props.title} icon="gauge">${body}<//>` : body;
  },
};
export default [wxNow, wxStats];
