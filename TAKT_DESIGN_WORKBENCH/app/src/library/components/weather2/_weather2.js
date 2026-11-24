// Gemeinsame Helfer des Wetter-Bereichs (weather2): Zustände, Einheiten, Zeit, Diagramm-Helfer, Beispieldaten.
// Kein Komponenten-Objekt. Alle Zeitangaben der Daten sind lokale ISO-Strings ohne Zeitzone („2026-11-24T09:00:00“).
import { html } from '../../../lib/html.js';
import { useState, useEffect } from 'preact/hooks';
import { Card, EmptyState, Icon, Button } from '../../ui.js';
import { fmt, isoDay } from '../../../lib/util.js';
import { WX } from '../content/weather-util.js';
import { wxActive, wxSettings, wxPlaces, wxTraining, wxVenues, wxAlertLevels } from '../../../seed/world/weather.js';
import { events as wxEvents } from '../../../seed/world/organisation.js';

export const p2 = (n) => String(n).padStart(2, '0');
/** „2026-11-24T09:30:00“ aus Date/ISO (lokal). */
export const stamp = (d) => { const x = new Date(d); return `${isoDay(x)}T${p2(x.getHours())}:${p2(x.getMinutes())}:00`; };
export const hourStamp = (d) => { const x = new Date(d); return `${isoDay(x)}T${p2(x.getHours())}:00:00`; };
export const hm = (iso) => String(iso).slice(11, 16);
export const dkey = (v) => (v instanceof Date ? isoDay(v) : String(v).slice(0, 10));
export const isDate = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v);
export const minOf = (iso) => { const t = hm(iso); return +t.slice(0, 2) * 60 + +t.slice(3, 5); };
export const diffMin = (a, b) => Math.round((new Date(a) - new Date(b)) / 60000);
export const dayDiff = (iso, today) => Math.round((new Date(`${dkey(iso)}T12:00:00`) - new Date(`${isoDay(today)}T12:00:00`)) / 864e5);
export const wd = (iso) => fmt.weekday(`${dkey(iso)}T12:00:00`).replace('.', '');
export const dateStr = (iso) => `${wd(iso)}, ${fmt.dateShort(`${dkey(iso)}T12:00:00`)}`;
export const dayName = (iso, today, long = false) => { const d = dayDiff(iso, today); return d === 0 ? 'Heute' : d === 1 ? 'Morgen' : long ? fmt.weekdayLong(`${dkey(iso)}T12:00:00`) : wd(iso); };
export const durText = (min) => { const m = Math.max(0, Math.round(min)); return m < 60 ? `${m} Min.` : `${Math.floor(m / 60)} Std.${m % 60 ? ` ${m % 60} Min.` : ''}`; };
export const toneVar = (t) => `var(--tk-c-${!t || t === 'neutral' ? 'text-muted' : t})`;
export const softVar = (t) => (!t || t === 'neutral' ? 'var(--tk-c-surface2)' : `var(--tk-c-${t}-soft)`);

// ---------------------------------------------------------------- Zustände
export const WX2 = { ...WX, fair: { icon: 'cloud-sun', tone: 'warning', label: 'Leicht bewölkt' }, sleet: { icon: 'cloud-snow', tone: 'info', label: 'Schneeregen' }, storm: { icon: 'cloud-lightning', tone: 'danger', label: 'Gewitter' } };
export function cond(code, night = false) {
  const c = WX2[code] || WX2.cloudy;
  if (night && (code === 'sun' || code === 'clear')) return WX2.clear;
  if (night && (code === 'fair' || code === 'partly')) return { ...c, icon: 'cloud-moon', tone: 'info' };
  return c;
}
export const isWet = (h) => ['rain', 'drizzle', 'snow', 'sleet', 'storm'].includes(h.code) || (h.precip || 0) >= 0.2;

export const LV = {
  1: { tone: 'warning', color: 'var(--tk-c-warning)', name: 'Wetterwarnung', short: 'Stufe 1' },
  2: { tone: 'warning', color: 'color-mix(in srgb, var(--tk-c-warning) 45%, var(--tk-c-danger))', name: 'Markante Wetterwarnung', short: 'Stufe 2' },
  3: { tone: 'danger', color: 'var(--tk-c-danger)', name: 'Unwetterwarnung', short: 'Stufe 3' },
  4: { tone: 'danger', color: 'color-mix(in srgb, var(--tk-c-danger) 60%, var(--tk-c-accent2))', name: 'Extreme Unwetterwarnung', short: 'Stufe 4' },
};
export const lvSoft = (lv) => `color-mix(in srgb, ${(LV[lv] || LV[1]).color} 14%, var(--tk-c-surface))`;
export const KIND_ICON = { wind: 'wind', rain: 'cloud-rain', frost: 'snowflake', snow: 'cloud-snow', thunder: 'cloud-lightning', heat: 'thermometer-sun', fog: 'cloud-fog' };

// ---------------------------------------------------------------- Einstellungen & Einheiten
export const DEFAULT_S = { units: { temp: 'C', wind: 'kmh', precip: 'mm', pressure: 'hPa' }, sensitivity: 'normal', allergens: [], offline: false, refreshMin: 30, alerts: { minLevel: 2, scope: 'standort', quiet: true, quietFrom: '22:00', quietTo: '06:30' }, notify: { nowcast: true, daily: true, dailyTime: '07:00', allergy: true, uv: false, commute: true } };
export const settingsOf = (data) => { const s = data?.settings || {}; return { ...DEFAULT_S, ...s, units: { ...DEFAULT_S.units, ...(s.units || {}) }, alerts: { ...DEFAULT_S.alerts, ...(s.alerts || {}) }, notify: { ...DEFAULT_S.notify, ...(s.notify || {}) } }; };
export const placeOf = (data) => (data?.place && data.place.current && data.place.hours ? data.place : null);

const BFT = [1, 6, 12, 20, 29, 39, 50, 62, 75, 89, 103, 118];
export const bft = (kmh) => BFT.filter((l) => kmh >= l).length;
export function unitsOf(S) {
  const u = { ...DEFAULT_S.units, ...(S?.units || {}) }, F = u.temp === 'F';
  const cv = (v) => (F ? (v * 9) / 5 + 32 : v);
  const t = (v) => { if (v == null || Number.isNaN(v)) return '–'; const r = Math.round(cv(v)); return `${r < 0 ? '−' : ''}${fmt.number(Math.abs(r))}°`; };
  const wn = (v) => (u.wind === 'ms' ? Math.round(v / 3.6) : u.wind === 'mph' ? Math.round(v / 1.609) : u.wind === 'bft' ? bft(v) : Math.round(v));
  const wu = { kmh: 'km/h', ms: 'm/s', mph: 'mph', bft: 'Bft' }[u.wind] || 'km/h';
  return {
    raw: u, tUnit: `°${F ? 'F' : 'C'}`, t, tu: (v) => `${t(v)}${F ? 'F' : 'C'}`, tn: (v) => Math.round(cv(v)), tDelta: (v) => (F ? (v * 9) / 5 : v),
    wn, wu, w: (v) => (u.wind === 'bft' ? `Bft ${bft(v)}` : `${fmt.number(wn(v))} ${wu}`),
    p: (v) => (u.precip === 'in' ? `${fmt.number((v || 0) / 25.4, 2)} in` : `${fmt.number(v || 0, v < 10 && v % 1 ? 1 : 0)} mm`),
    pr: (v) => (u.pressure === 'inHg' ? `${fmt.number(v * 0.02953, 2)} inHg` : `${Math.round(v)} hPa`),
  };
}
export function freshness(place, S, today) {
  if (S.offline) return { state: 'offline', label: `Offline · Stand ${hm(place.updated)}`, tone: 'warning', icon: 'signal' };
  const ageH = (new Date(today) - new Date(place.updated)) / 36e5;
  if (ageH > (place.staleAfterHours || 3)) return { state: 'stale', label: `Veraltet · Stand ${hm(place.updated)}`, tone: 'warning', icon: 'clock' };
  return { state: 'ok', label: `Stand ${hm(place.updated)}`, tone: 'neutral', icon: 'clock' };
}
export const hoursFrom = (place, today, n = 48) => { const k = hourStamp(today); return place.hours.filter((h) => h.time >= k).slice(0, n); };
export const hoursOfDay = (place, date) => place.hours.filter((h) => dkey(h.time) === date);

// ---------------------------------------------------------------- Diagramm
/** Glatte Kurve (Catmull-Rom → Bézier) durch Punkte [[x,y],…]. */
export function curve(pts, t = 0.17) {
  if (pts.length < 2) return pts.length ? `M${pts[0][0]},${pts[0][1]}` : '';
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    d += ` C${(p1[0] + (p2[0] - p0[0]) * t).toFixed(1)},${(p1[1] + (p2[1] - p0[1]) * t).toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) * t).toFixed(1)},${(p2[1] - (p3[1] - p1[1]) * t).toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
}

// ---------------------------------------------------------------- Bausteine
export const SLOT_PLACE = { slot: 'place', label: 'Ort (Wetterdaten)', default: 'place', shape: 'Ortsbündel (wxActive): current, nowcast, hours, daily, alerts, pollen, air, uv, sun', required: true };
export const SLOT_SETTINGS = { slot: 'settings', label: 'Einstellungen', default: 'settings', shape: '{units,sensitivity,allergens,offline,alerts,notify}' };
export const SLOT_EVENTS = { slot: 'events', label: 'Termine (Kalender)', default: 'events', shape: '{id,title,start,end,location?,allDay?}[]' };
export const EX = { place: wxActive, settings: wxSettings, events: wxEvents, places: wxPlaces, active: wxActive, training: wxTraining, venues: wxVenues, levels: wxAlertLevels };

export const NoPlace = ({ icon = 'cloud', title = 'Keine Wetterdaten', text = 'Für diesen Ort liegen gerade keine Daten vor.', card = true } = {}) => {
  const body = html`<${EmptyState} icon=${icon} title=${title} text=${text} />`;
  return card ? html`<${Card}>${body}<//>` : body;
};
/** Wetter-Symbol in getönter Kachel. */
export const CondIcon = ({ code, night, size = 24, box = 0, tone }) => {
  const c = cond(code, night), col = toneVar(tone || c.tone);
  const ic = html`<${Icon} name=${c.icon} size=${size} stroke=${1.7} />`;
  return box ? html`<span style=${`display:grid;place-items:center;flex:none;width:${box}px;height:${box}px;border-radius:${Math.round(box * 0.3)}px;color:${col};background:color-mix(in srgb, ${col} 15%, transparent)`}>${ic}</span>` : html`<span style=${`color:${col};display:inline-flex`}>${ic}</span>`;
};
/** Kopf-Aktion als Textlink („Alle ansehen“). */
export const HeadLink = ({ label, onClick, icon = 'chevron-right' }) => html`<${Button} size="sm" variant="ghost" iconRight=${icon} onClick=${onClick}>${label}<//>`;
export const DIR_DEG = { N: 0, NO: 45, O: 90, SO: 135, S: 180, SW: 225, W: 270, NW: 315 };
/** Pfeil, der in die Richtung zeigt, in die der Wind weht (windDeg = Herkunft). */
export const WindArrow = ({ deg = 225, size = 14 }) => html`<span style=${`display:inline-flex;transform:rotate(${(deg + 180) % 360}deg)`} aria-hidden="true"><${Icon} name="navigation-2" size=${size} /></span>`;

/** Breite eines Elements in px (für SVG-Diagramme mit echten Pixelgrößen). */
export function useWidth(ref, fallback = 320) {
  const [w, setW] = useState(fallback);
  useEffect(() => {
    const el = ref.current; if (!el) return undefined;
    const set = () => setW(Math.round(el.clientWidth) || fallback);
    set();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(set); ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return w;
}
