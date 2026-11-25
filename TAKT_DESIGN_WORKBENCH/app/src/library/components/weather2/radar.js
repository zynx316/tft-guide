// Wetter: simuliertes Regenradar mit Zeitleiste (wx-radar)
import { html } from '../../../lib/html.js';
import { useState, useEffect, useMemo } from 'preact/hooks';
import { Card, Badge, Button, Icon, Segmented } from '../../ui.js';
import { placeOf, settingsOf, unitsOf, hm, dateStr, stamp, NoPlace, SLOT_PLACE, SLOT_SETTINGS, EX } from './_weather2.js';
import { rainLevel } from './nowcast.js';
import { GW, GH, HOME, frame, LEVEL_FILL, LEVEL_NAME, BaseMap, HomeMarker } from './_radar.js';

const clock = (today, t) => stamp(new Date(new Date(today).getTime() + t * 60000));

export const wxRadar = {
  id: 'wx-radar',
  name: 'Regenradar (Simulation)',
  category: 'Wetter',
  description: 'Simulierte, animierte Regenkarte der Region mit Ortsmarke, Zeitleiste von −2 bis +2 Stunden (Beobachtung und Vorhersage), Play/Pause, Zoom und Intensitäts-Legende. Der Zeitpunkt wird in ctx.ui.radarT geteilt, damit der Nowcast mitläuft. Als Karte mit Steuerung oder als kleine Kachel für die Startseite.',
  version: '1.2',
  props: [
    { name: 'layout', label: 'Darstellung', type: 'select', options: ['full', 'compact', 'tile'], default: 'full' },
    { name: 'title', label: 'Titel', type: 'text', default: 'Regenradar' },
    { name: 'autoplay', label: 'Automatisch abspielen', type: 'boolean', default: false },
    { name: 'previewMin', label: 'Kachel: Zeitpunkt (Min. ab jetzt)', type: 'number', default: 12 },
  ],
  data: [SLOT_PLACE, SLOT_SETTINGS],
  events: ['weather.radar.play', 'weather.radar.frame', 'weather.radar.zoom', 'weather.radar.open'],
  states: ['empty'],
  css: `
  .tk-wxr__map { position:relative; width:100%; aspect-ratio:3 / 2; border-radius:var(--tk-radius-lg); overflow:hidden; border:1px solid var(--tk-c-border); background:var(--tk-c-surface2); }
  .tk-wxr__map > svg { position:absolute; inset:0; width:100%; height:100%; display:block; }
  .tk-wxr--compact .tk-wxr__map { aspect-ratio:16 / 9; } .tk-wxr--tile .tk-wxr__map { aspect-ratio:4 / 3; }
  .tk-wxr__chip { position:absolute; display:inline-flex; align-items:center; gap:6px; padding:4px 10px; border-radius:var(--tk-radius-pill); background:color-mix(in srgb, var(--tk-c-surface) 90%, transparent); border:1px solid var(--tk-c-border); font-size:var(--tk-fs-sm); font-weight:var(--tk-fw-semibold); font-variant-numeric:tabular-nums; }
  .tk-wxr__ctl { display:flex; align-items:center; gap:var(--tk-space-3); margin-top:var(--tk-space-3); }
  .tk-wxr__range { flex:1; min-width:0; height:44px; margin:0; accent-color:var(--tk-c-accent); cursor:pointer; background:transparent; }
  .tk-wxr__ticks { display:flex; justify-content:space-between; font-size:var(--tk-fs-xs); color:var(--tk-c-text-subtle); font-variant-numeric:tabular-nums; padding:0 4px; margin-top:-6px; }
  .tk-wxr__legend { display:flex; flex-wrap:wrap; gap:4px 14px; margin-top:var(--tk-space-3); font-size:var(--tk-fs-xs); color:var(--tk-c-text-muted); } .tk-wxr__legend span { display:inline-flex; align-items:center; gap:5px; } .tk-wxr__legend i { width:12px; height:12px; border-radius:3px; }
  [data-tk-large-text] .tk-wxr--tile .tk-wxr__map { aspect-ratio:1; } [data-tk-large-text] .tk-wxr--tile .tk-wxr__chip { max-width:calc(100% - 20px); white-space:normal; font-size:var(--tk-fs-xs); padding:2px 8px; } [data-tk-large-text] .tk-wxr--tile .tk-wxr__chip--ph { right:6px !important; } [data-tk-large-text] .tk-wxr--tile .tk-wxr__chip--ph { top:auto !important; bottom:6px; }
  [data-tk-large-text] .tk-wxr__th { flex-wrap:wrap; row-gap:4px; } [data-tk-large-text] .tk-wxr__th > strong { flex:1 1 6em; }
  .tk-wxr__tilebtn { display:block; width:100%; padding:0; border:0; background:transparent; color:inherit; font:inherit; text-align:left; cursor:pointer; }`,
  example: { data: { place: EX.place, settings: EX.settings } },
  render: ({ props, data, ctx }) => {
    const place = placeOf(data);
    const tile = props.layout === 'tile';
    const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    const [t, setT] = useState(tile ? props.previewMin : 0);
    const [playing, setPlaying] = useState(props.autoplay && !reduce && !tile);
    const [zoom, setZoom] = useState(1);
    useEffect(() => { if (!playing) return undefined; const id = setInterval(() => setT((v) => (v >= 120 ? -120 : v + 5)), 420); return () => clearInterval(id); }, [playing]);
    useEffect(() => { if (!tile) ctx.setUi('radarT', t); }, [t]);
    const shift = place && place.id !== 'bielefeld' ? (place.lon * 3) % 7 : 0;
    const paths = useMemo(() => frame(t, shift), [t, shift]);
    if (!place) return html`<${NoPlace} icon="waves" title="Kein Radar" text="Für diesen Ort liegt keine Radarkarte vor." />`;
    const U = unitsOf(settingsOf(data)), nc = place.nowcast, idx = Math.floor(t / 5);
    const at = t >= 0 && t < 120 ? nc.values[idx]?.mm ?? 0 : null, lvl = at != null ? rainLevel(at) : null;
    const compactChip = !!(tile && ctx.largeText); // große Schrift, kleine Kachel: nur Uhrzeit, kleiner, am Rand
    const phase = t < 0 ? 'Beobachtung' : t === 0 ? 'Jetzt' : 'Vorhersage', time = clock(ctx.today, t);
    const vb = zoom === 2 ? `${HOME[0] - GW / 4} ${HOME[1] - GH / 4} ${GW / 2} ${GH / 2}` : `0 0 ${GW} ${GH}`;
    const play = () => { setPlaying(!playing); ctx.emit('weather.radar.play', { playing: !playing }); };
    const map = html`<div class="tk-wxr__map" role="img" aria-label=${`Regenradar ${place.name}, ${phase} ${hm(time)} Uhr${lvl ? `, am Ort ${lvl.label}` : ''}`}>
      <svg viewBox=${vb} preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><filter id="tk-wxr-blur" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation=".32" /></filter></defs>
        <${BaseMap} named=${place.id === 'bielefeld'} /><g filter="url(#tk-wxr-blur)">${[1, 2, 3, 4, 5].map((l) => paths[l] && html`<path d=${paths[l]} fill=${LEVEL_FILL[l]} />`)}</g><${HomeMarker} name=${place.name} /></svg>
      <span class="tk-wxr__chip" style=${compactChip ? 'left:6px;top:6px' : 'left:10px;top:10px'}>${!compactChip && dateStr(time)}${!compactChip && ' · '}${hm(time)} Uhr</span>
      <span class="tk-wxr__chip tk-wxr__chip--ph" style=${`right:10px;top:10px;${t < 0 ? 'color:var(--tk-c-text-muted)' : t === 0 ? 'color:var(--tk-c-success)' : 'color:var(--tk-c-accent)'}`}>${phase}</span>
      ${!tile && html`<span class="tk-wxr__chip" style="left:10px;bottom:10px"><${Icon} name="map-pin" size=${13} />${place.name}: ${lvl ? (at >= 0.1 ? `${lvl.label} · ${U.p(at).replace(/ (mm|in)$/, '')} ${U.raw.precip === 'in' ? 'in' : 'mm'}/h` : 'trocken') : 'beobachtet'}</span>`}</div>`;
    if (tile) return html`<${Card} flush><button type="button" class="tk-wxr__tilebtn tk-wxr--tile" aria-label=${`${props.title} öffnen. ${nc.headline}`} onClick=${() => ctx.emit('weather.radar.open', { id: 'tile' })}>
      <div class="tk-wxr__th" style="padding:var(--tk-space-3) var(--tk-space-4) var(--tk-space-2);display:flex;align-items:center;gap:var(--tk-space-2)"><span class="tk-subtle" style="display:inline-flex"><${Icon} name="waves" size=${16} /></span><strong class="tk-grow">${props.title}</strong><${Badge} tone=${nc.state === 'dry' ? 'success' : 'info'}>${nc.headline}<//></div>
      <div style="padding:0 var(--tk-space-3) var(--tk-space-3)">${map}</div></button><//>`;
    return html`<${Card} title=${props.title} icon="waves" actions=${html`<${Segmented} label="Zoom" value=${zoom} onChange=${(v) => { setZoom(v); ctx.emit('weather.radar.zoom', { zoom: v }); }} options=${[{ value: 1, label: '1×' }, { value: 2, label: '2×' }]} />`}><div class=${`tk-wxr--${props.layout}`}>${map}
      <div class="tk-wxr__ctl"><${Button} variant="primary" icon=${playing ? 'pause' : 'play'} aria-label=${playing ? 'Pause' : 'Abspielen'} onClick=${play}>${ctx.bp === 'mobile' ? null : playing ? 'Pause' : 'Abspielen'}<//>
        <input type="range" class="tk-wxr__range" min="-120" max="120" step="5" value=${t} aria-label="Zeitpunkt im Radar" aria-valuetext=${`${phase} ${hm(time)} Uhr`} onInput=${(e) => { setPlaying(false); setT(+e.currentTarget.value); ctx.emit('weather.radar.frame', { minutes: +e.currentTarget.value }); }} />
        <${Button} size="sm" onClick=${() => { setPlaying(false); setT(0); }}>Jetzt<//></div>
      <div class="tk-wxr__ticks" aria-hidden="true"><span>${hm(clock(ctx.today, -120))}</span><span>−1 Std.</span><span>Jetzt</span><span>+1 Std.</span><span>${hm(clock(ctx.today, 120))}</span></div>
      <div class="tk-wxr__legend" aria-label="Legende">${[1, 2, 3, 4, 5].map((l) => html`<span><i style=${`background:${LEVEL_FILL[l]}`}></i>${LEVEL_NAME[l]}</span>`)}</div>
      <div class="tk-subtle" style="font-size:var(--tk-fs-xs);margin-top:var(--tk-space-2)">Schematische Karte mit simulierten Demo-Daten (1 Kästchen ≈ 5 km) · Quelle im Echtbetrieb: DWD-Radar</div></div><//>`;
  },
};
export default [wxRadar];
