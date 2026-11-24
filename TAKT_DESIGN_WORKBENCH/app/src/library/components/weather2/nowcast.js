// Wetter: Nowcast – Regen der nächsten 2 Stunden in 5-Minuten-Schritten („Regen in 12 Minuten“)
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Card, Badge, Icon, Button } from '../../ui.js';
import { placeOf, settingsOf, unitsOf, hm, NoPlace, SLOT_PLACE, SLOT_SETTINGS, EX } from './_weather2.js';

/** Intensitätsstufen in mm/h (DWD-nah): Nieselregen · leicht · mäßig · stark · Starkregen */
export const RAIN_LEVELS = [
  { max: 0.1, key: 0, label: 'Trocken', color: 'transparent' },
  { max: 0.5, key: 1, label: 'Nieselregen', color: 'color-mix(in srgb, var(--tk-c-info) 55%, var(--tk-c-surface))' },
  { max: 2.5, key: 2, label: 'Leichter Regen', color: 'var(--tk-c-info)' },
  { max: 7.6, key: 3, label: 'Mäßiger Regen', color: 'var(--tk-c-accent)' },
  { max: 20, key: 4, label: 'Starker Regen', color: 'var(--tk-c-warning)' },
  { max: 999, key: 5, label: 'Starkregen', color: 'var(--tk-c-danger)' },
];
export const rainLevel = (mm) => RAIN_LEVELS.find((l) => mm < l.max) || RAIN_LEVELS[5];

export const wxNowcast = {
  id: 'wx-nowcast',
  name: 'Nowcast (Regen in den nächsten 2 Stunden)',
  category: 'Wetter',
  description: 'Kurzfrist-Regenvorhersage in 5-Minuten-Schritten mit Klartext („Regen beginnt in 12 Min., hört gegen 10:15 auf“). Als Balkenkurve zum Streichen, als Text-zuerst-Karte oder einzeilige Leiste. Folgt dem Zeitpunkt im Regenradar (ctx.ui.radarT). Tippen öffnet das Radar.',
  version: '1.1',
  props: [
    { name: 'layout', label: 'Darstellung', type: 'select', options: ['bars', 'headline', 'strip'], default: 'bars' },
    { name: 'title', label: 'Titel', type: 'text', default: 'Regen in den nächsten 2 Stunden' },
    { name: 'linkRadar', label: 'Tippen öffnet Radar', type: 'boolean', default: true },
  ],
  data: [SLOT_PLACE, SLOT_SETTINGS],
  events: ['weather.radar.open', 'weather.nowcast.point'],
  states: ['empty'],
  css: `
  .tk-wxn__head { display:flex; align-items:center; gap:var(--tk-space-3); }
  .tk-wxn__title { font-size:var(--tk-fs-xl); font-weight:var(--tk-fw-bold); letter-spacing:var(--tk-ls-tight); line-height:1.2; }
  .tk-wxn__text { color:var(--tk-c-text-muted); font-size:var(--tk-fs-md); margin-top:2px; }
  .tk-wxn__chart { position:relative; height:84px; margin-top:var(--tk-space-3); display:flex; align-items:flex-end; gap:2px; padding-bottom:1px; border-bottom:1px solid var(--tk-c-border); }
  .tk-wxn__bar { flex:1 1 0; min-width:2px; border-radius:3px 3px 0 0; background:var(--tk-c-surface3); min-height:3px; }
  .tk-wxn__bar[data-sel="true"] { outline:2px solid var(--tk-c-text); outline-offset:1px; }
  .tk-wxn__scrub { position:absolute; inset:-8px 0 0 0; width:100%; height:calc(100% + 8px); opacity:0; margin:0; cursor:pointer; }
  .tk-wxn__axis { display:flex; justify-content:space-between; font-size:var(--tk-fs-xs); color:var(--tk-c-text-subtle); margin-top:6px; font-variant-numeric:tabular-nums; }
  .tk-wxn__tip { display:flex; align-items:center; gap:8px; margin-top:var(--tk-space-2); font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); min-height:22px; }
  .tk-wxn__dot { width:10px; height:10px; border-radius:3px; flex:none; }
  .tk-wxn__big { font-size:var(--tk-fs-3xl); font-weight:var(--tk-fw-bold); letter-spacing:-0.02em; line-height:1.1; }
  .tk-wxn__strip { display:flex; align-items:center; gap:var(--tk-space-3); width:100%; min-height:56px; padding:var(--tk-space-3) var(--tk-space-4); border:1px solid var(--tk-c-border); border-radius:var(--tk-radius-lg); background:var(--tk-c-surface); color:var(--tk-c-text); font:inherit; text-align:left; cursor:pointer; }
  .tk-wxn__strip:hover { border-color:var(--tk-c-border-strong); }
  .tk-wxn__mini { display:flex; align-items:flex-end; gap:1px; height:26px; width:84px; flex:none; }
  .tk-wxn__mini i { flex:1; border-radius:1px; background:var(--tk-c-surface3); min-height:2px; }
  [data-tk-large-text] .tk-wxn__strip .tk-wxn__mini { display:none; }
  .tk-wxn__legend { display:flex; flex-wrap:wrap; gap:4px 12px; margin-top:var(--tk-space-3); font-size:var(--tk-fs-xs); color:var(--tk-c-text-muted); }
  .tk-wxn__legend span { display:inline-flex; align-items:center; gap:5px; }`,
  example: { data: { place: EX.place, settings: EX.settings } },
  render: ({ props, data, ctx }) => {
    const place = placeOf(data), nc = place?.nowcast;
    const [sel, setSel] = useState(null);
    if (!nc) return html`<${NoPlace} icon="cloud-rain" title="Kein Nowcast" text="Für diesen Ort liegt keine Kurzfrist-Vorhersage vor." />`;
    const U = unitsOf(settingsOf(data)), vals = nc.values, max = Math.max(2.5, nc.peakMm);
    const radarT = ctx.ui.radarT, radarIdx = radarT != null && radarT >= 0 && radarT < 120 ? Math.floor(radarT / 5) : null;
    const idx = sel ?? radarIdx, cur = idx != null ? vals[idx] : null;
    const tone = nc.state === 'dry' ? 'success' : 'info';
    const open = () => props.linkRadar && ctx.emit('weather.radar.open', { id: 'nowcast' });
    const icon = nc.state === 'dry' ? 'sun' : 'cloud-rain';
    if (props.layout === 'strip') return html`<button type="button" class="tk-wxn__strip" onClick=${open} aria-label=${`${nc.headline}. ${nc.text} Radar öffnen`}>
      <span style=${`color:var(--tk-c-${tone});display:inline-flex`}><${Icon} name=${icon} size=${22} /></span>
      <span class="tk-grow"><strong>${nc.headline}</strong><span class="tk-muted" style="display:block;font-size:var(--tk-fs-sm)">${nc.text}</span></span>
      <span class="tk-wxn__mini" aria-hidden="true">${vals.map((v) => html`<i style=${`height:${Math.max(2, (v.mm / max) * 26)}px;${v.mm >= 0.1 ? `background:${rainLevel(v.mm).color}` : ''}`}></i>`)}</span>
      <${Icon} name="chevron-right" size=${16} /></button>`;
    const chart = html`<div class="tk-wxn__chart" role="img" aria-label=${`Regenintensität in 5-Minuten-Schritten. ${nc.text}`}>
      ${vals.map((v, i) => html`<span class="tk-wxn__bar" data-sel=${idx === i ? 'true' : 'false'} style=${`height:${Math.max(3, (v.mm / max) * 100)}%;${v.mm >= 0.1 ? `background:${rainLevel(v.mm).color}` : ''}`}></span>`)}
      <input type="range" class="tk-wxn__scrub" min="0" max=${vals.length - 1} value=${idx ?? 0} aria-label="Zeitpunkt im Nowcast wählen" onClick=${(e) => e.stopPropagation()} onInput=${(e) => { const i = +e.currentTarget.value; setSel(i); ctx.emit('weather.nowcast.point', { time: vals[i].t }); }} /></div>
      <div class="tk-wxn__axis"><span>Jetzt</span><span>+30 Min.</span><span>+1 Std.</span><span>+90 Min.</span><span>+2 Std.</span></div>
      <div class="tk-wxn__tip" aria-live="polite">${cur ? html`<span class="tk-wxn__dot" style=${`background:${rainLevel(cur.mm).color === 'transparent' ? 'var(--tk-c-surface3)' : rainLevel(cur.mm).color}`}></span><strong>${hm(cur.t)} Uhr</strong><span>${rainLevel(cur.mm).label}${cur.mm >= 0.1 ? ` · ${U.p(cur.mm).replace(/ (mm|in)$/, '')} ${U.raw.precip === 'in' ? 'in' : 'mm'}/h` : ''}</span>` : html`<span>Balken streichen für Details${nc.state !== 'dry' ? ` · Spitze ${nc.peakMm.toString().replace('.', ',')} mm/h` : ''}</span>`}</div>`;
    if (props.layout === 'headline') return html`<${Card} interactive=${props.linkRadar} onClick=${open}><div class="tk-wxn__head"><div class="tk-grow"><div class="tk-label" style="margin-bottom:6px">Nowcast · Stand ${hm(nc.issued)}</div>
      <div class="tk-wxn__big">${nc.headline}</div><div class="tk-wxn__text">${nc.text}</div></div><${Badge} tone=${tone} icon=${icon}>${nc.state === 'dry' ? 'Trocken' : nc.intensity}<//></div>${chart}
      <div class="tk-row" style="margin-top:var(--tk-space-3);justify-content:space-between;flex-wrap:wrap"><div class="tk-wxn__legend" style="margin:0" aria-hidden="true">${RAIN_LEVELS.slice(1, 4).map((l) => html`<span><i class="tk-wxn__dot" style=${`background:${l.color}`}></i>${l.label}</span>`)}</div>
        ${props.linkRadar && html`<${Button} size="sm" iconRight="chevron-right" onClick=${(e) => { e.stopPropagation(); open(); }}>Regenradar<//>`}</div><//>`;
    return html`<${Card} title=${props.title} icon=${icon} interactive=${props.linkRadar} onClick=${open} actions=${props.linkRadar ? html`<${Button} size="sm" variant="ghost" iconRight="chevron-right" onClick=${(e) => { e.stopPropagation(); open(); }}>Radar<//>` : html`<${Badge} tone=${tone}>${nc.headline}<//>`}>
      <div class="tk-wxn__text" style="margin-top:0">${nc.text}</div>${chart}<//>`;
  },
};
export default [wxNowcast];
