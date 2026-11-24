// Wetter: Sonne & Mond (wx-sun) – Sonnenbogen, Tageslänge, goldene Stunde, Mondphase
import { html } from '../../../lib/html.js';
import { useRef } from 'preact/hooks';
import { Card, Icon } from '../../ui.js';
import { placeOf, useWidth, NoPlace, SLOT_PLACE, EX } from './_weather2.js';

const toM = (t) => +t.slice(0, 2) * 60 + +t.slice(3, 5);
function Moon({ moon, size = 44 }) {
  const f = moon.illumination / 100, r = size / 2 - 2, c = size / 2, waxing = moon.age < 14.77, k = Math.abs(1 - 2 * f) * r;
  const sweepRight = waxing ? 1 : 0;
  const lit = f >= 0.995 ? html`<circle cx=${c} cy=${c} r=${r} fill="color-mix(in srgb, var(--tk-c-warning) 60%, var(--tk-c-surface))" />` : f <= 0.01 ? null
    : html`<path d=${`M${c},${c - r} A${r},${r} 0 0 ${sweepRight} ${c},${c + r} A${k},${r} 0 0 ${(f > 0.5) === waxing ? 0 : 1} ${c},${c - r} Z`} fill="color-mix(in srgb, var(--tk-c-warning) 60%, var(--tk-c-surface))" />`;
  return html`<svg width=${size} height=${size} viewBox=${`0 0 ${size} ${size}`} role="img" aria-label=${`${moon.name}, ${moon.illumination} Prozent beleuchtet`}><circle cx=${c} cy=${c} r=${r} fill="var(--tk-c-surface3)" stroke="var(--tk-c-border-strong)" />${lit}</svg>`;
}

export const wxSun = {
  id: 'wx-sun',
  name: 'Sonne & Mond',
  category: 'Wetter',
  description: 'Sonnenbogen mit aktueller Position, Auf- und Untergang, Tageslänge (im Vergleich zu gestern), goldene Stunde und Dämmerung, dazu Mondphase mit Beleuchtung sowie Auf- und Untergang des Mondes.',
  version: '1.2',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Sonne & Mond' },
    { name: 'layout', label: 'Darstellung', type: 'select', options: ['full', 'compact'], default: 'full' },
  ],
  data: [SLOT_PLACE],
  events: ['weather.sun.detail'],
  states: ['empty'],
  css: `
  .tk-wxsun__arc { width:100%; } .tk-wxsun__arc svg { display:block; overflow:visible; }
  .tk-wxsun__grid { display:grid; grid-template-columns:repeat(4, minmax(0,1fr)); gap:var(--tk-space-3); margin-top:var(--tk-space-3); } .bp-mobile .tk-wxsun__grid { grid-template-columns:repeat(2, minmax(0,1fr)); }
  .tk-wxsun__m { display:flex; flex-direction:column; gap:3px; padding:var(--tk-space-3); border-radius:var(--tk-radius-md); background:var(--tk-c-surface2); min-width:0; } .tk-wxsun__m small { font-size:var(--tk-fs-xs); text-transform:uppercase; letter-spacing:var(--tk-ls-wide); font-weight:var(--tk-fw-semibold); color:var(--tk-c-text-muted); } .tk-wxsun__m strong { font-size:var(--tk-fs-lg); font-variant-numeric:tabular-nums; } .tk-wxsun__m span { font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); }
  [data-tk-large-text] .tk-wxsun__grid, [data-tk-large-text] .bp-mobile .tk-wxsun__grid { grid-template-columns:repeat(auto-fit, minmax(min(100%, 14ch), 1fr)); }
  .tk-wxsun__moon { display:flex; align-items:center; gap:var(--tk-space-4); margin-top:var(--tk-space-3); padding:var(--tk-space-3) var(--tk-space-4); border-radius:var(--tk-radius-md); border:1px solid var(--tk-c-border); }`,
  example: { data: { place: EX.place } },
  render: ({ props, data, ctx }) => {
    const box = useRef(null), width = useWidth(box, 320);
    const place = placeOf(data), s = place?.sun;
    if (!s) return html`<${NoPlace} icon="sunrise" title="Keine Sonnendaten" text="Für diesen Ort liegen keine Sonnenzeiten vor." />`;
    const W = Math.max(240, width), H = 120, rise = toM(s.sunrise), set = toM(s.sunset), now = ctx.today.getHours() * 60 + ctx.today.getMinutes();
    const frac = Math.min(1, Math.max(0, (now - rise) / (set - rise))), up = now >= rise && now <= set;
    const cx = W / 2, ry = 82, rx = W / 2 - 20, bx = 20, base = H - 24, X = (f) => bx + f * (W - 40), Y = (f) => base - Math.sin(Math.PI * f) * ry;
    const pos = [X(frac), Y(frac)], d = s.dayDeltaMin;
    const full = props.layout === 'full';
    return html`<${Card} title=${props.title} icon="sunrise" actions=${html`<span class="tk-subtle" style="font-size:var(--tk-fs-xs)">${s.moon.name}</span>`}>
      <div class="tk-wxsun__arc" ref=${box}><svg width=${W} height=${H} viewBox=${`0 0 ${W} ${H}`} role="img" aria-label=${`Sonnenaufgang ${s.sunrise}, Sonnenuntergang ${s.sunset}, Tageslänge ${s.dayLength}`}>
        <line x1=${bx - 8} x2=${W - bx + 8} y1=${base} y2=${base} stroke="var(--tk-c-border-strong)" />
        <path d=${`M${X(0)},${base} A${rx},${ry} 0 0 1 ${X(1)},${base}`} fill="none" stroke="var(--tk-c-border-strong)" stroke-width="2" stroke-dasharray="4 5" />
        ${up && html`<path d=${`M${X(0)},${base} A${rx},${ry} 0 0 1 ${pos[0]},${pos[1]}`} fill="none" stroke="var(--tk-c-warning)" stroke-width="3.5" stroke-linecap="round" />`}
        <circle cx=${up ? pos[0] : X(frac < 0.5 ? 0 : 1)} cy=${up ? pos[1] : base} r="9" fill=${up ? 'var(--tk-c-warning)' : 'var(--tk-c-surface3)'} stroke="var(--tk-c-surface)" stroke-width="3" />
        <text x=${bx} y=${H - 6} font-size="12" font-weight="600" fill="var(--tk-c-text)">${s.sunrise}</text><text x=${W - bx} y=${H - 6} text-anchor="end" font-size="12" font-weight="600" fill="var(--tk-c-text)">${s.sunset}</text>
        <text x=${cx} y=${base - 18} text-anchor="middle" font-size="13" fill="var(--tk-c-text-muted)">${s.dayLength}</text></svg></div>
      <div class="tk-wxsun__grid">${[['Aufgang', s.sunrise, `Dämmerung ${s.civil.dawn}`], ['Untergang', s.sunset, `Dämmerung bis ${s.civil.dusk}`], ['Tageslänge', s.dayLength, `${d < 0 ? '−' : '+'}${Math.abs(d)} Min. zu gestern`], ['Goldene Stunde', `${s.golden.evening[0]}`, `morgens ${s.golden.morning[0]}–${s.golden.morning[1]}`]].slice(0, full ? 4 : 3).map(([l, v, sub]) => html`<div class="tk-wxsun__m"><small>${l}</small><strong>${v}</strong><span>${sub}</span></div>`)}</div>
      ${full && html`<div class="tk-wxsun__moon"><${Moon} moon=${s.moon} /><div class="tk-grow"><strong>${s.moon.name}</strong><div class="tk-muted" style="font-size:var(--tk-fs-sm)">${s.moon.illumination} % beleuchtet</div></div><div class="tk-muted" style="font-size:var(--tk-fs-sm);text-align:right"><div><${Icon} name="moon" size=${13} /> auf ${s.moon.rise}</div><div>unter ${s.moon.set}</div></div></div>`}<//>`;
  },
};
export default [wxSun];
