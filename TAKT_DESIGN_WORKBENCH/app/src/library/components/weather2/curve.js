// Wetter: Tagesverlauf als Kurve (wx-day-curve) – Temperatur, Regen, Sturmfenster, Sonne, „Jetzt“
import { html } from '../../../lib/html.js';
import { useRef } from 'preact/hooks';
import { Card, Button, Icon } from '../../ui.js';
import { placeOf, settingsOf, unitsOf, hoursOfDay, isDate, dkey, minOf, curve, stamp, useWidth, dayName, hm, NoPlace, SLOT_PLACE, SLOT_SETTINGS, EX } from './_weather2.js';

const H = 168, TOP = 30, BASE = 134;

export const wxDayCurve = {
  id: 'wx-day-curve',
  name: 'Tagesverlauf (Kurve)',
  category: 'Wetter',
  description: 'Der ganze Tag als Kurve: Temperatur, Regenbalken, Sturmfenster, Nacht abgedunkelt, „Jetzt“-Marke. Darunter die Kernaussagen (Regenmenge, Böen, Sonne). Für die Startseite in der visuellen Richtung. Antippen öffnet den Stundenverlauf.',
  version: '1.0',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Tagesverlauf' },
    { name: 'gustFrom', label: 'Böen-Hinweis ab (km/h)', type: 'number', default: 50 },
  ],
  data: [SLOT_PLACE, SLOT_SETTINGS],
  events: ['weather.hourly.open'],
  states: ['empty'],
  css: `
  .tk-wxc { width:100%; } .tk-wxc svg { display:block; overflow:visible; }
  .tk-wxc__facts { display:flex; flex-wrap:wrap; gap:6px var(--tk-space-4); margin-top:var(--tk-space-3); font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); }
  .tk-wxc__facts span { display:inline-flex; align-items:center; gap:6px; } .tk-wxc__facts strong { color:var(--tk-c-text); }`,
  example: { data: { place: EX.place, settings: EX.settings } },
  render: ({ props, data, ctx }) => {
    const box = useRef(null), width = useWidth(box, 340);
    const place = placeOf(data);
    if (!place) return html`<${NoPlace} />`;
    const U = unitsOf(settingsOf(data)), date = [ctx.ui.selectedDate].find(isDate) ? dkey(ctx.ui.selectedDate) : dkey(stamp(ctx.today));
    const hrs = hoursOfDay(place, date);
    if (hrs.length < 24) return html`<${NoPlace} icon="clock" title="Kein Tagesverlauf" text="Für diesen Tag liegen keine Stundenwerte vor." />`;
    const L = 8, R = 8, W = Math.max(240, width - 2), pw = W - L - R, X = (m) => L + (m / 1440) * pw;
    const temps = hrs.map((h) => h.tempExact ?? h.temp), tmin = Math.min(...temps), tmax = Math.max(...temps), Y = (t) => TOP + (1 - (t - tmin) / (tmax - tmin || 1)) * (BASE - TOP - 26);
    const pts = hrs.map((h, i) => [X(i * 60 + 30), Y(temps[i])]), line = curve(pts), st = place.sun;
    const rise = minOf(`${date}T${st.sunrise}`), set = minOf(`${date}T${st.sunset}`), maxMm = Math.max(1, ...hrs.map((h) => h.precip));
    const gust = hrs.filter((h) => h.gust >= props.gustFrom), gMax = Math.max(...hrs.map((h) => h.gust));
    const nowM = date === dkey(stamp(ctx.today)) ? ctx.today.getHours() * 60 + ctx.today.getMinutes() : null;
    const iMax = temps.indexOf(tmax), iMin = temps.indexOf(tmin), mm = hrs.reduce((s, h) => s + h.precip, 0), nowT = nowM != null ? temps[Math.floor(nowM / 60)] : null;
    const open = () => ctx.emit('weather.hourly.open', { id: date });
    return html`<${Card} title=${props.title} icon="chart-spline" interactive onClick=${open} actions=${html`<${Button} size="sm" variant="ghost" iconRight="chevron-right" onClick=${(e) => { e.stopPropagation(); open(); }}>Stündlich<//>`}>
      <div class="tk-wxc" ref=${box}><svg width=${W} height=${H} viewBox=${`0 0 ${W} ${H}`} role="img" aria-label=${`Tagesverlauf ${dayName(date, ctx.today)}: ${U.t(tmin)} bis ${U.t(tmax)}, ${U.p(mm)} Niederschlag, Böen bis ${U.w(gMax)}`}>
        <rect x=${L} y=${TOP - 14} width=${X(rise) - L} height=${BASE - TOP + 14} fill="var(--tk-c-surface2)" /><rect x=${X(set)} y=${TOP - 14} width=${W - R - X(set)} height=${BASE - TOP + 14} fill="var(--tk-c-surface2)" />
        ${gust.length > 0 && html`<rect x=${X(minOf(gust[0].time))} y=${TOP - 14} width=${X(minOf(gust[gust.length - 1].time) + 60) - X(minOf(gust[0].time))} height=${BASE - TOP + 14} fill="var(--tk-c-warning-soft)" /><text x=${X(minOf(gust[0].time)) + 6} y=${TOP - 3} font-size="11.5" font-weight="600" fill="var(--tk-c-text)">Böen bis ${U.wn(gMax)} ${U.wu}</text>`}
        ${hrs.map((h, i) => h.precip > 0 && html`<rect x=${X(i * 60) + 2} y=${BASE - Math.max(3, (h.precip / maxMm) * 24)} width=${Math.max(3, pw / 24 - 4)} height=${Math.max(3, (h.precip / maxMm) * 24)} rx="2" fill="var(--tk-c-info)" />`)}
        <path d=${`${line} L${X(1410)},${BASE} L${X(30)},${BASE} Z`} fill="color-mix(in srgb, var(--tk-c-accent) 13%, transparent)" /><path d=${line} fill="none" stroke="var(--tk-c-accent)" stroke-width="2.6" stroke-linecap="round" />
        ${[[iMax, tmax], [iMin, tmin]].map(([i, t]) => html`<circle cx=${pts[i][0]} cy=${pts[i][1]} r="3.5" fill="var(--tk-c-surface)" stroke="var(--tk-c-accent)" stroke-width="2" /><text x=${pts[i][0]} y=${pts[i][1] + (t === tmax ? -9 : 17)} text-anchor="middle" font-size="12.5" font-weight="600" fill="var(--tk-c-text)">${U.t(t)}</text>`)}
        ${nowM != null && html`<line x1=${X(nowM)} x2=${X(nowM)} y1=${TOP - 14} y2=${BASE} stroke="var(--tk-c-text)" stroke-width="1.5" stroke-dasharray="3 3" /><circle cx=${X(nowM)} cy=${Y(nowT)} r="5" fill="var(--tk-c-text)" stroke="var(--tk-c-surface)" stroke-width="2" />`}
        ${[0, 6, 12, 18, 24].map((h) => html`<text x=${X(h * 60)} y=${H - 6} text-anchor=${h === 0 ? 'start' : h === 24 ? 'end' : 'middle'} font-size="11" fill="var(--tk-c-text-subtle)">${String(h).padStart(2, '0')}</text>`)}</svg></div>
      <div class="tk-wxc__facts"><span><${Icon} name="umbrella" size=${15} /><strong>${U.p(mm)}</strong> Regen</span>${gMax >= props.gustFrom && html`<span><${Icon} name="wind" size=${15} />Böen bis <strong>${U.w(gMax)}</strong> ${hm(gust[0].time)}–${hm(gust[gust.length - 1].time).replace(/^(\d\d):\d\d$/, (a, h) => `${String(+h + 1).padStart(2, '0')}:00`)}</span>`}<span><${Icon} name="sunrise" size=${15} />${st.sunrise} – ${st.sunset} Uhr</span></div><//>`;
  },
};
export default [wxDayCurve];
