// Wetter: UV-Index (wx-uv) und Luftqualität (wx-air)
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Card, Badge, Button, Icon, Segmented } from '../../ui.js';
import { placeOf, hm, dayName, NoPlace, SLOT_PLACE, SLOT_SETTINGS, EX, toneVar, softVar } from './_weather2.js';

const UV_BANDS = [[3, 'Gering', 'success'], [6, 'Mäßig', 'warning'], [8, 'Hoch', 'warning'], [11, 'Sehr hoch', 'danger'], [99, 'Extrem', 'accent2']];
const uvBand = (v) => UV_BANDS.find(([m]) => v < m) || UV_BANDS[4];
const SKIN = { 1: ['I · sehr hell', 8], 2: ['II · hell', 15], 3: ['III · mittel', 25], 4: ['IV · dunkel', 40] };
const AQ_COLOR = ['', 'var(--tk-c-success)', 'color-mix(in srgb, var(--tk-c-success) 60%, var(--tk-c-warning))', 'var(--tk-c-warning)', 'color-mix(in srgb, var(--tk-c-warning) 50%, var(--tk-c-danger))', 'var(--tk-c-danger)', 'var(--tk-c-accent2)'];
const AQ_NAME = ['', 'Sehr gut', 'Gut', 'Mittel', 'Schlecht', 'Sehr schlecht', 'Extrem schlecht'];
const POLL = { pm25: ['Feinstaub PM2,5', 'µg/m³', 75], pm10: ['Feinstaub PM10', 'µg/m³', 150], o3: ['Ozon', 'µg/m³', 380], no2: ['Stickstoffdioxid', 'µg/m³', 340], so2: ['Schwefeldioxid', 'µg/m³', 750] };

export const wxUv = {
  id: 'wx-uv',
  name: 'UV-Index',
  category: 'Wetter',
  description: 'UV-Index als Halbkreis-Anzeige mit Stufe, Tagesverlauf mit Schutz-Schwelle (ab UV 3), Hautschutz-Empfehlung mit Hauttyp und Eigenschutzzeit sowie Ausblick. Demo-Schalter „Sommer“, weil im November UV 1 nicht sehenswert ist.',
  version: '1.0',
  props: [{ name: 'title', label: 'Titel', type: 'text', default: 'UV-Index' }, { name: 'showDemoSwitch', label: 'Demo-Umschalter Sommer', type: 'boolean', default: true }],
  data: [SLOT_PLACE, SLOT_SETTINGS],
  events: ['weather.env.info', 'weather.uv.skin'],
  states: ['empty'],
  css: `
  .tk-wxuv__gauge { position:relative; width:min(100%, 260px); margin:0 auto; } .tk-wxuv__gauge svg { display:block; width:100%; height:auto; }
  .tk-wxuv__val { position:absolute; left:0; right:0; bottom:2px; text-align:center; } .tk-wxuv__val strong { display:block; font-size:44px; line-height:1; font-weight:var(--tk-fw-bold); font-variant-numeric:tabular-nums; }
  .tk-wxuv__bars { display:flex; align-items:flex-end; gap:3px; height:64px; position:relative; border-bottom:1px solid var(--tk-c-border); } .tk-wxuv__bars i { flex:1; border-radius:3px 3px 0 0; min-height:2px; }
  .tk-wxuv__skin button { min-width:44px; justify-content:center; }
  .tk-wxuv__thr { position:absolute; left:0; right:0; border-top:1px dashed var(--tk-c-border-strong); } .tk-wxuv__thr span { position:absolute; right:0; top:-17px; font-size:var(--tk-fs-xs); color:var(--tk-c-text-subtle); }`,
  example: { data: { place: EX.place, settings: EX.settings } },
  render: ({ props, data, ctx }) => {
    const [summer, setSummer] = useState(false);
    const [skin, setSkin] = useState(2);
    const place = placeOf(data);
    if (!place?.uv) return html`<${NoPlace} icon="sun-medium" title="Keine UV-Daten" text="Für diesen Ort liegen keine UV-Werte vor." />`;
    const mul = summer ? 8 : 1, uv = place.uv, max = Math.round(uv.maxExact * mul * 10) / 10, [, label, tone] = uvBand(max);
    const hrs = uv.hourly.filter((h) => +hm(h.time).slice(0, 2) >= 6 && +hm(h.time).slice(0, 2) <= 18), top = Math.max(3.5, ...hrs.map((h) => h.uv * mul));
    const prot = hrs.filter((h) => h.uv * mul >= 3), minutes = Math.round((SKIN[skin][1] * 7) / Math.max(1, max));
    const ang = (v) => Math.PI * (1 - Math.min(11, v) / 11), pt = (v, r = 80) => [100 + r * Math.cos(ang(v)), 100 - r * Math.sin(ang(v))];
    const arc = (a, b) => { const [x1, y1] = pt(a), [x2, y2] = pt(b); return `M${x1.toFixed(1)},${y1.toFixed(1)} A80,80 0 0 1 ${x2.toFixed(1)},${y2.toFixed(1)}`; };
    const [dx, dy] = pt(max);
    const info = () => { ctx.emit('weather.env.info', { topic: 'uv' }); ctx.openDialog({ title: 'UV-Index erklärt', body: () => html`<div class="tk-col" style="gap:8px">${[['0–2', 'Gering', 'Kein Schutz nötig'], ['3–5', 'Mäßig', 'Schutz empfohlen: Schatten, Hut, Creme'], ['6–7', 'Hoch', 'Schutz nötig, Mittagssonne meiden'], ['8–10', 'Sehr hoch', 'Zusätzlich Schutzkleidung'], ['11+', 'Extrem', 'Aufenthalt im Freien vermeiden']].map(([r, l, t]) => html`<div class="tk-row" style="gap:10px"><strong style="min-width:48px">${r}</strong><span><strong>${l}</strong> – ${t}</span></div>`)}<p class="tk-subtle" style="margin:0;font-size:var(--tk-fs-sm)">Richtwerte, kein medizinischer Rat.</p></div>` }); };
    return html`<${Card} title=${props.title} icon="sun-medium" actions=${html`<${Button} size="sm" variant="ghost" icon="info" aria-label="UV-Index erklärt" onClick=${info} />`}>
      ${props.showDemoSwitch && html`<div style="margin-bottom:var(--tk-space-3);display:flex;justify-content:center"><${Segmented} label="Datenstand" value=${summer ? 'summer' : 'now'} onChange=${(v) => setSummer(v === 'summer')} options=${[{ value: 'now', label: 'November' }, { value: 'summer', label: 'Sommer (Demo)' }]} /></div>`}
      <div class="tk-wxuv__gauge"><svg viewBox="0 0 200 110" role="img" aria-label=${`UV-Index ${max}, ${label}`}>${UV_BANDS.map(([m, , t], i) => html`<path d=${arc(i ? UV_BANDS[i - 1][0] : 0, Math.min(m, 11))} fill="none" stroke=${toneVar(t)} stroke-width="14" opacity=${max < m && (i ? max >= UV_BANDS[i - 1][0] : true) ? 1 : 0.35} />`).slice(0, 4)}
        <circle cx=${dx} cy=${dy} r="9" fill="var(--tk-c-surface)" stroke="var(--tk-c-text)" stroke-width="3" /></svg>
        <div class="tk-wxuv__val"><strong>${Math.round(max)}</strong><span style=${`color:${toneVar(tone)};font-weight:var(--tk-fw-semibold)`}>${label}</span></div></div>
      <p style=${`margin:var(--tk-space-3) 0;text-align:center;padding:var(--tk-space-3);border-radius:var(--tk-radius-md);background:${softVar(max >= 3 ? 'warning' : 'success')}`}>${max >= 3 ? html`<strong>Schutz nötig von ${hm(prot[0].time)} bis ${String(+hm(prot[prot.length - 1].time).slice(0, 2) + 1).padStart(2, '0')}:00 Uhr.</strong> Eigenschutzzeit ca. ${minutes} Min. (Hauttyp ${SKIN[skin][0]}).` : html`<strong>Kein Sonnenschutz nötig.</strong> Der UV-Index bleibt unter 3.`}</p>
      <div class="tk-wxuv__bars" role="img" aria-label="UV-Verlauf von 6 bis 18 Uhr">${hrs.map((h) => html`<i title=${`${hm(h.time)} Uhr: ${String((h.uv * mul).toFixed(1)).replace('.', ',')}`} style=${`height:${Math.max(3, ((h.uv * mul) / top) * 100)}%;background:${toneVar(uvBand(h.uv * mul)[2])}`}></i>`)}<span class="tk-wxuv__thr" style=${`bottom:${(3 / top) * 100}%`}><span>Schutz ab 3</span></span></div>
      <div class="tk-row" style="justify-content:space-between;font-size:var(--tk-fs-xs);color:var(--tk-c-text-subtle);margin-top:4px"><span>06</span><span>12</span><span>18 Uhr</span></div>
      <div class="tk-row tk-wxuv__skin" style="gap:var(--tk-space-3);flex-wrap:wrap;margin-top:var(--tk-space-3)"><span class="tk-muted" style="font-size:var(--tk-fs-sm)">Hauttyp</span><${Segmented} label="Hauttyp" value=${skin} onChange=${(v) => { setSkin(v); ctx.emit('weather.uv.skin', { type: v }); }} options=${[1, 2, 3, 4].map((v) => ({ value: v, label: ['I', 'II', 'III', 'IV'][v - 1] }))} /></div>
      <div class="tk-row" style="gap:6px;flex-wrap:wrap;margin-top:var(--tk-space-3)">${uv.forecast.slice(1).map((f) => html`<${Badge}>${dayName(f.date, ctx.today)}: UV ${String(f.uv * (summer ? 8 : 1))}<//>`)}</div><//>`;
  },
};

export const wxAir = {
  id: 'wx-air',
  name: 'Luftqualität',
  category: 'Wetter',
  description: 'Luftqualitätsindex (6 Stufen von „sehr gut“ bis „extrem schlecht“) mit führendem Schadstoff, Werten für Feinstaub, Ozon, Stickstoffdioxid und Schwefeldioxid, Tagesverlauf, Ausblick und Empfehlung für Sport im Freien. Stufen erklärt im Info-Dialog.',
  version: '1.1',
  props: [{ name: 'title', label: 'Titel', type: 'text', default: 'Luftqualität' }, { name: 'showDetails', label: 'Schadstoffe zeigen', type: 'boolean', default: true }],
  data: [SLOT_PLACE, SLOT_SETTINGS],
  events: ['weather.env.info', 'weather.air.pollutant'],
  states: ['empty'],
  css: `
  .tk-wxair__scale { display:grid; grid-template-columns:repeat(6, 1fr); gap:3px; margin-top:var(--tk-space-3); position:relative; } .tk-wxair__scale i { height:10px; border-radius:3px; }
  .tk-wxair__mark { position:absolute; top:-5px; width:3px; height:20px; border-radius:2px; background:var(--tk-c-text); transform:translateX(-1.5px); }
  .tk-wxair__row { display:grid; grid-template-columns:minmax(0, 1.5fr) minmax(0, 1fr) 70px; gap:var(--tk-space-3); align-items:center; min-height:42px; border-bottom:1px solid var(--tk-c-border); width:100%; background:transparent; border-left:0; border-right:0; border-top:0; color:var(--tk-c-text); font:inherit; text-align:left; cursor:pointer; }
  .tk-wxair__row:last-child { border-bottom:0; } .tk-wxair__bar { height:6px; border-radius:3px; background:var(--tk-c-surface3); overflow:hidden; } .tk-wxair__bar i { display:block; height:100%; border-radius:3px; }
  .tk-wxair__hours { display:flex; gap:2px; height:18px; } .tk-wxair__hours i { flex:1; border-radius:2px; }
  [data-tk-large-text] .tk-wxair__row { grid-template-columns:minmax(0,1fr) auto; row-gap:4px; padding:8px 0; } [data-tk-large-text] .tk-wxair__row > :nth-child(1) { grid-column:1; grid-row:1; } [data-tk-large-text] .tk-wxair__row > :nth-child(3) { grid-column:2; grid-row:1; } [data-tk-large-text] .tk-wxair__row > :nth-child(2) { grid-column:1 / -1; grid-row:2; }`,
  example: { data: { place: EX.place, settings: EX.settings } },
  render: ({ props, data, ctx }) => {
    const place = placeOf(data), A = place?.air;
    if (!A) return html`<${NoPlace} icon="leaf" title="Keine Luftdaten" text="Für diesen Ort liegen keine Luftqualitätswerte vor." />`;
    const info = () => { ctx.emit('weather.env.info', { topic: 'air' }); ctx.openDialog({ title: 'Luftqualitätsindex', body: () => html`<div class="tk-col" style="gap:8px">${[1, 2, 3, 4, 5, 6].map((i) => html`<div class="tk-row" style="gap:10px"><span style=${`width:14px;height:14px;border-radius:4px;background:${AQ_COLOR[i]};flex:none`}></span><span><strong>${AQ_NAME[i]}</strong> – ${['Beste Luft, keine Einschränkung', 'Gute Luft, Sport im Freien unbedenklich', 'Empfindliche Personen sollten intensive Anstrengung draußen reduzieren', 'Anstrengende Aktivitäten draußen verschieben', 'Aufenthalt im Freien einschränken', 'Draußen möglichst vermeiden'][i - 1]}</span></div>`)}
      <p class="tk-subtle" style="margin:0;font-size:var(--tk-fs-sm)">Vereinfachte Skala nach dem Luftqualitätsindex des Umweltbundesamts. Fiktive Demo-Daten, kein medizinischer Rat.</p></div>` }); };
    const lead = POLL[A.lead];
    return html`<${Card} title=${props.title} icon="leaf" actions=${html`<${Button} size="sm" variant="ghost" icon="info" aria-label="Luftqualitätsindex erklärt" onClick=${info} />`}>
      <div class="tk-row" style="gap:var(--tk-space-4);align-items:center"><span style=${`width:64px;height:64px;border-radius:20px;display:grid;place-items:center;flex:none;font-size:28px;font-weight:var(--tk-fw-bold);color:var(--tk-c-text-on-accent);background:${AQ_COLOR[A.index]}`}>${A.index}</span>
        <div class="tk-grow"><div style="font-size:var(--tk-fs-2xl);font-weight:var(--tk-fw-bold);letter-spacing:var(--tk-ls-tight)">${A.label}</div><div class="tk-muted" style="font-size:var(--tk-fs-sm)">Stufe ${A.index} von 6 · bestimmt durch ${lead[0]}</div></div></div>
      <div class="tk-wxair__scale" aria-hidden="true">${[1, 2, 3, 4, 5, 6].map((i) => html`<i style=${`background:${AQ_COLOR[i]};opacity:${i === A.index ? 1 : 0.4}`}></i>`)}<span class="tk-wxair__mark" style=${`left:${((A.index - 0.5) / 6) * 100}%`}></span></div>
      <p style=${`margin:var(--tk-space-4) 0 var(--tk-space-3);padding:var(--tk-space-3);border-radius:var(--tk-radius-md);display:flex;gap:8px;align-items:flex-start;background:${softVar(A.index <= 2 ? 'success' : 'warning')}`}><${Icon} name="footprints" size=${16} /><span>${A.advice}</span></p>
      ${props.showDetails && html`<div>${Object.entries(A.parts).map(([k, p]) => html`<button type="button" class="tk-wxair__row" onClick=${() => ctx.emit('weather.air.pollutant', { id: k })}><span>${POLL[k][0]}</span><span class="tk-wxair__bar"><i style=${`width:${Math.max(6, Math.min(100, (p.value / (POLL[k][2] / 4)) * 100))}%;background:${AQ_COLOR[p.level]}`}></i></span><span class="tk-num" style="text-align:right"><strong>${p.value}</strong> <span class="tk-subtle" style="font-size:var(--tk-fs-xs)">${POLL[k][1]}</span></span></button>`)}</div>`}
      <div class="tk-label" style="margin:var(--tk-space-4) 0 6px">Heute im Verlauf</div><div class="tk-wxair__hours" role="img" aria-label="Luftqualität im Tagesverlauf">${A.hourly.map((h) => html`<i title=${`${hm(h.time)} Uhr: ${AQ_NAME[h.index]}`} style=${`background:${AQ_COLOR[h.index]}`}></i>`)}</div>
      <div class="tk-row" style="justify-content:space-between;font-size:var(--tk-fs-xs);color:var(--tk-c-text-subtle);margin-top:4px"><span>00</span><span>12</span><span>24 Uhr</span></div>
      <div class="tk-row" style="gap:6px;flex-wrap:wrap;margin-top:var(--tk-space-3)">${A.forecast.map((f) => html`<${Badge}><span style=${`display:inline-block;width:8px;height:8px;border-radius:50%;background:${AQ_COLOR[f.index]}`}></span> ${dayName(f.date, ctx.today)}: ${f.label}<//>`)}</div>
      <div class="tk-subtle" style="font-size:var(--tk-fs-xs);margin-top:var(--tk-space-3)">Stand ${hm(A.updated)} Uhr · Umweltdaten fiktiv</div><//>`;
  },
};
export default [wxUv, wxAir];
