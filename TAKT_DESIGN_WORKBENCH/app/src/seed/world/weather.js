// Gemeinsame Datenwelt: Wetter. Alle Werte sind fiktive Demo-Daten (Warnstufen nach DWD-Schema, aber nicht amtlich).
// Referenzmoment: Di, 24.11.2026 09:30 in Bielefeld – 6 °C, leicht bewölkt, ab 14 Uhr Sturmböen (siehe persona.js).
// Abgeleitete Werte (Tageswerte, Gefühlte Temperatur, Nowcast-Text, Luftqualitätsindex, Sonnenzeiten, Mondphase)
// berechnet diese Datei selbst – es steht nichts doppelt von Hand drin.
//
// Welt-Schlüssel (benannte Exporte):
//   wxActive         aktiver Ort als vollständiges Bündel (Standard: Bielefeld) – Komponenten binden den Slot „place“ daran
//   wxPlaces         alle bekannten Orte als Bündel; saved:true = in „Orte“ gemerkt, sonst nur Suchtreffer
//   wxSettings       Einheiten, Empfindlichkeit, Allergene, Benachrichtigungen
//   wxAlertLevels    Warnstufen 1–4 (DWD-Schema) mit Bedeutung
//   wxVenues         Orte aus dem Kalender -> Verkehrsmittel, Wegzeit (für Termin- und Pendelfenster)
//   wxTraining       geplante Trainingseinheiten der nächsten 7 Tage (aus der Fitness-Welt: Mo/Mi/Fr Kraft, Sa Lauf; So Wanderung aus dem Kalender)
import { trainingProgram, fitnessProfile } from './fitness.js';
const p2 = (n) => String(n).padStart(2, '0');
const NOW = '2026-11-24T09:30:00';
const DAY0 = '2026-11-24';
const addDay = (iso, n) => { const d = new Date(`${iso}T12:00:00`); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`; };
const hhmm = (min) => { const m = ((Math.round(min) % 1440) + 1440) % 1440; return `${p2(Math.floor(m / 60))}:${p2(m % 60)}`; };
const toMin = (s) => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
const lerp = (pts, x) => { if (x <= pts[0][0]) return pts[0][1]; for (let i = 1; i < pts.length; i++) if (x <= pts[i][0]) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i]; return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0); } return pts[pts.length - 1][1]; };
const cosInterp = (pts, x) => { if (x <= pts[0][0]) return pts[0][1]; for (let i = 1; i < pts.length; i++) if (x <= pts[i][0]) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i]; return y0 + ((y1 - y0) * (1 - Math.cos((Math.PI * (x - x0)) / (x1 - x0)))) / 2; } return pts[pts.length - 1][1]; };
const r1 = (v) => Math.round(v * 10) / 10;

// ---------------------------------------------------------------- Konstanten
const CODE = { s: 'sun', c: 'clear', a: 'fair', p: 'partly', o: 'cloudy', g: 'fog', d: 'drizzle', r: 'rain', n: 'snow', m: 'sleet', t: 'storm' };
const MM = { d: 0.3, r: 1, n: 0.5, m: 0.5, t: 2.2 };
const POP = { s: 0, c: 0, a: 12, p: 15, o: 22, g: 10, d: 60, r: 90, n: 75, m: 80, t: 95 };
const CLOUD = { s: 5, c: 5, a: 30, p: 55, o: 90, g: 100, d: 95, r: 100, n: 100, m: 100, t: 100 };
const HUM = { s: 62, c: 68, a: 76, p: 78, o: 84, g: 97, d: 92, r: 93, n: 90, m: 92, t: 90 };
const DIRS = ['N', 'NO', 'O', 'SO', 'S', 'SW', 'W', 'NW'];
const dirName = (deg) => DIRS[Math.round(deg / 45) % 8];
const DAY_TEXT = { sun: 'Sonnig', clear: 'Klar', fair: 'Leicht bewölkt', partly: 'Wechselhaft bewölkt', cloudy: 'Bedeckt', fog: 'Nebel, zäh', drizzle: 'Nieselregen', rain: 'Regnerisch', snow: 'Schneefall', sleet: 'Schneeregen', storm: 'Gewitter' };

// ------------------------------------------------------------------ Sonne & Mond
function sunTimes(lat, lon, iso, calib = [-12, 5]) {
  const N = Math.round((Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) - Date.UTC(2026, 0, 0)) / 864e5);
  const rad = Math.PI / 180, dec = -23.44 * Math.cos((2 * Math.PI / 365) * (N + 10)) * rad;
  const B = (2 * Math.PI * (N - 81)) / 364, eot = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
  const w = Math.acos((Math.sin(-0.833 * rad) - Math.sin(lat * rad) * Math.sin(dec)) / (Math.cos(lat * rad) * Math.cos(dec))) / rad;
  const noon = 12 * 60 + ((15 - lon) / 15) * 60 - eot;
  const rise = noon - (w / 15) * 60 + calib[0], set = noon + (w / 15) * 60 + calib[1];
  return { sunrise: hhmm(rise), sunset: hhmm(set), noon: hhmm(noon), len: set - rise };
}
const lenText = (min) => `${Math.floor(min / 60)} h ${p2(Math.round(min % 60))} min`;
function moonOf(iso, sunrise, sunset) {
  const syn = 29.530588853, age = (((Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10), 12) - Date.UTC(2000, 0, 6, 18, 14)) / 864e5) % syn + syn) % syn;
  const illum = (1 - Math.cos((2 * Math.PI * age) / syn)) / 2;
  const names = [[1.2, 'Neumond'], [6.2, 'Zunehmende Sichel'], [8.6, 'Erstes Viertel'], [13.2, 'Zunehmender Mond'], [16.3, 'Vollmond'], [21, 'Abnehmender Mond'], [23.2, 'Letztes Viertel'], [28.3, 'Abnehmende Sichel'], [99, 'Neumond']];
  const shift = (age - 14.77) * 50; // Mondaufgang verspätet sich ~50 min je Tag gegenüber der Sonne
  return { age: r1(age), illumination: Math.round(illum * 100), name: names.find(([m]) => age < m)[1], rise: hhmm(toMin(sunset) + shift), set: hhmm(toMin(sunrise) + shift) };
}

// ------------------------------------------------------------------ Stunden
/** days: je Tag Liste [code, anzahl] (24 Stunden). ext: Temperatur-Extrema [absStunde, °C]. wind/press: Stützpunkte [absStunde, Wert]. */
function buildHours({ days, ext, wind, press, dirs, mmOverride = {}, lat, lon, uvMax = 1.2, tzShift = 0 }) {
  const out = [];
  days.forEach((spec, d) => {
    const codes = spec.flatMap(([c, n]) => Array(n).fill(c));
    const date = addDay(DAY0, d), st = sunTimes(lat, lon, date);
    codes.forEach((c, h) => {
      const i = d * 24 + h, t = cosInterp(ext, i), v = lerp(wind, i);
      const gust = Math.round(v * (v >= 28 ? 1.75 : v >= 20 ? 1.6 : 1.9));
      const feels = t <= 10 && v >= 5 ? 13.12 + 0.6215 * t - 11.37 * Math.pow(v, 0.16) + 0.3965 * t * Math.pow(v, 0.16) : t;
      const mins = h * 60 + 30, day = mins > toMin(st.sunrise) && mins < toMin(st.sunset);
      const sunPart = day ? Math.sin((Math.PI * (mins - toMin(st.sunrise))) / (toMin(st.sunset) - toMin(st.sunrise))) : 0;
      const uv = r1(uvMax * sunPart * (1 - CLOUD[c] / 140));
      out.push({
        time: `${date}T${p2(h)}:00:00`, temp: Math.round(t), tempExact: r1(t), feels: Math.round(feels), code: CODE[c], night: !day,
        precip: mmOverride[i] ?? MM[c] ?? 0, pop: POP[c], wind: Math.round(v), gust, windDir: dirName(dirs[d] ?? 225), humidity: Math.min(99, HUM[c] + (t < 3 ? 2 : 0)),
        pressure: Math.round(lerp(press, i)), cloud: CLOUD[c], uv,
      });
    });
  });
  return out;
}
const sum = (a) => a.reduce((s, x) => s + x, 0);
function dayCodeOf(hs) {
  const n = (k) => hs.filter((h) => h.code === k).length;
  if (n('snow') + n('sleet') >= 3) return 'snow';
  if (n('rain') >= 3) return 'rain';
  if (n('rain') + n('drizzle') >= 3) return 'drizzle';
  const day = hs.filter((h) => !h.night);
  const avg = sum(day.map((h) => h.cloud)) / (day.length || 1);
  return n('fog') >= 3 ? 'fog' : avg < 25 ? 'sun' : avg < 45 ? 'fair' : avg < 70 ? 'partly' : 'cloudy';
}
const partsOf = (min, max, code, hs) => [
  ['nacht', 'Nacht', 0, min + (max - min) * 0.05], ['morgen', 'Morgens', 6, min + (max - min) * 0.3], ['mittag', 'Mittags', 12, max], ['abend', 'Abends', 18, min + (max - min) * 0.35],
].map(([id, label, h0, temp], k) => { const sl = hs ? hs.slice(h0, h0 + 6) : []; return { id, label, temp: Math.round(temp), code: sl.length ? dayCodeOf(sl.map((x) => ({ ...x, night: false }))) : code }; });

function dailyFromHours(hours, d, sunDay) {
  const hs = hours.slice(d * 24, d * 24 + 24), date = addDay(DAY0, d), temps = hs.map((h) => h.tempExact);
  const min = Math.round(Math.min(...temps)), max = Math.round(Math.max(...temps)), code = dayCodeOf(hs), st = sunDay(date);
  const sunHours = r1(sum(hs.filter((h) => !h.night).map((h) => Math.max(0, 1 - h.cloud / 100))) * 1.05);
  const gustMax = Math.max(...hs.map((h) => h.gust)), windMax = Math.max(...hs.map((h) => h.wind));
  return {
    date, code, min, max, pop: Math.max(...hs.map((h) => h.pop)), precip: r1(sum(hs.map((h) => h.precip))), wind: windMax, gust: gustMax, windDir: hs[13].windDir,
    sunHours, uv: Math.round(Math.max(...hs.map((h) => h.uv))), sunrise: st.sunrise, sunset: st.sunset, humidity: Math.round(sum(hs.map((h) => h.humidity)) / 24),
    text: `${DAY_TEXT[code]}${gustMax >= 60 ? `, stürmisch (Böen bis ${gustMax} km/h)` : gustMax >= 45 ? `, windig (Böen bis ${gustMax} km/h)` : ''}${min < 0 ? ', Frost' : ''}.`, parts: partsOf(min, max, code, hs),
  };
}
function manualDay(date, o, sunDay) {
  const st = sunDay(date), code = o.code;
  return { date, code, min: o.min, max: o.max, pop: o.pop, precip: o.precip, wind: o.wind, gust: o.gust, windDir: o.dir || 'W', sunHours: o.sun, uv: o.uv ?? 0, sunrise: st.sunrise, sunset: st.sunset, humidity: o.hum ?? 84,
    text: `${DAY_TEXT[code]}${o.gust >= 60 ? `, stürmisch (Böen bis ${o.gust} km/h)` : o.gust >= 45 ? `, windig (Böen bis ${o.gust} km/h)` : ''}${o.min < 0 ? ', Frost' : ''}.`, parts: partsOf(o.min, o.max, code, null), hoursAvailable: false };
}

// ------------------------------------------------------------------ Nowcast (5-Minuten-Schritte, mm/h)
function buildNowcast(rates, issued = '2026-11-24T09:25:00') {
  const base = new Date(NOW).getTime();
  const values = Array.from({ length: 24 }, (_, k) => { const d = new Date(base + k * 300000); return { t: `${DAY0}T${p2(d.getHours())}:${p2(d.getMinutes())}:00`, mm: rates[k] || 0 }; });
  const wet = values.map((v) => v.mm >= 0.1);
  const start = wet.indexOf(true);
  let end = -1; for (let k = values.length - 1; k >= 0; k--) if (wet[k]) { end = k; break; }
  const peak = Math.max(...values.map((v) => v.mm));
  const endIso = end >= 0 ? values[end].t : null;
  const endT = endIso ? new Date(new Date(endIso).getTime() + 300000) : null;
  const endText = endT ? `${p2(endT.getHours())}:${p2(endT.getMinutes())}` : null;
  const startsIn = start >= 0 ? start * 5 + 2 : null; // Beginn im Schritt: Mitte des 5-Min-Fensters ≈ +2 min
  const state = start < 0 ? 'dry' : startsIn <= 3 ? 'raining' : 'rain-soon';
  const text = state === 'dry' ? 'In den nächsten 2 Stunden bleibt es trocken.'
    : state === 'raining' ? `Es regnet gerade, gegen ${endText} hört es auf.`
    : `Regen beginnt in ${startsIn} Min., hört gegen ${endText} wieder auf.`;
  return { issued, step: 5, values, state, startsInMin: startsIn, endsAt: endText, peakMm: peak, text, headline: state === 'dry' ? 'Trocken' : state === 'raining' ? 'Es regnet' : `Regen in ${startsIn} Min.`, intensity: peak >= 2.5 ? 'mäßig' : peak >= 0.5 ? 'leicht' : 'Nieselregen' };
}

// ------------------------------------------------------------------ Luftqualität (UBA-Schema, 6 Stufen)
const AQ_LIMITS = { pm25: [10, 20, 25, 50, 75], pm10: [20, 40, 50, 100, 150], o3: [50, 100, 130, 240, 380], no2: [40, 90, 120, 230, 340], so2: [100, 200, 350, 500, 750] };
const AQ_LABEL = ['', 'Sehr gut', 'Gut', 'Mittel', 'Schlecht', 'Sehr schlecht', 'Extrem schlecht'];
const aqLevel = (key, v) => 1 + AQ_LIMITS[key].filter((l) => v > l).length;
function buildAir(v, forecastIdx = [2, 2, 1], ozoneShift = 0) {
  const parts = Object.fromEntries(Object.entries(v).map(([k, val]) => [k, { value: val, level: aqLevel(k, val) }]));
  const index = Math.max(...Object.values(parts).map((p) => p.level));
  const lead = Object.entries(parts).sort((a, b) => b[1].level - a[1].level)[0][0];
  return {
    updated: '2026-11-24T09:00:00', index, label: AQ_LABEL[index], lead, parts,
    advice: index <= 2 ? 'Gute Luft: Sport im Freien ist unbedenklich.' : index === 3 ? 'Mittlere Belastung: empfindliche Personen sollten intensive Anstrengung draußen reduzieren.' : 'Hohe Belastung: anstrengende Aktivitäten draußen verschieben.',
    forecast: forecastIdx.map((idx, k) => ({ date: addDay(DAY0, k + 1), index: idx, label: AQ_LABEL[idx] })),
    hourly: Array.from({ length: 24 }, (_, h) => { const rush = h >= 7 && h <= 9 || h >= 17 && h <= 19; const i = Math.min(6, Math.max(1, index - 1 + (rush ? 1 : 0) + ozoneShift)); return { time: `${DAY0}T${p2(h)}:00:00`, index: i }; }),
  };
}

// ------------------------------------------------------------------ Pollen
const POLLEN_TYPES = [
  { id: 'hasel', name: 'Hasel', season: [1, 3], icon: 'trees' }, { id: 'erle', name: 'Erle', season: [2, 4], icon: 'trees' }, { id: 'birke', name: 'Birke', season: [3, 5], icon: 'trees' },
  { id: 'graeser', name: 'Gräser', season: [5, 8], icon: 'wheat' }, { id: 'roggen', name: 'Roggen', season: [5, 7], icon: 'wheat' }, { id: 'beifuss', name: 'Beifuß', season: [7, 9], icon: 'leaf' }, { id: 'ambrosia', name: 'Ambrosia', season: [8, 10], icon: 'flower-2' },
];
const SPRING = { hasel: [1, 1, 2], erle: [2, 3, 3], birke: [3, 3, 2], graeser: [1, 1, 1], roggen: [0, 0, 1], beifuss: [0, 0, 0], ambrosia: [0, 0, 0] };
const pollenOf = (region) => ({
  updated: '2026-11-24T06:00:00', region, source: 'Pollenflug-Gefahrenindex (fiktive Demo-Daten)', dates: [DAY0, addDay(DAY0, 1), addDay(DAY0, 2)],
  types: POLLEN_TYPES.map((t) => ({ ...t, levels: [0, 0, 0] })), demo: { label: 'Frühling (Demo)', levels: SPRING },
  note: 'Im November fliegt praktisch keine Pollen. Die Haselsaison beginnt voraussichtlich Mitte Januar.',
});

// ------------------------------------------------------------------ Ort zusammensetzen
function makePlace(o) {
  const lat = o.lat, lon = o.lon, n = o.hoursN || 120;
  const sunDay = (date) => sunTimes(lat, lon, date, o.calib || [-12, 5]);
  const hours = buildHours({ ...o, days: o.days.slice(0, n / 24), uvMax: o.uvMax || 1.2 });
  const daily = [...Array(n / 24)].map((_, d) => ({ ...dailyFromHours(hours, d, sunDay), hoursAvailable: true }));
  (o.later || []).forEach((l) => daily.push(manualDay(addDay(DAY0, daily.length), l, sunDay)));
  const st = sunDay(DAY0), h9 = hours[9], tNow = r1(cosInterp(o.ext, 9.5)), vNow = lerp(o.wind, 9.5);
  const feelsNow = tNow <= 10 && vNow >= 5 ? 13.12 + 0.6215 * tNow - 11.37 * Math.pow(vNow, 0.16) + 0.3965 * tNow * Math.pow(vNow, 0.16) : tNow;
  const nowcast = buildNowcast(o.nowcast || {});
  const today = daily[0];
  const current = {
    temp: Math.round(tNow), feels: Math.round(feelsNow), code: o.nowCode || 'fair', night: false, high: today.max, low: today.min, wind: Math.round(vNow), windDir: h9.windDir, windDeg: o.dirs[0] ?? 225,
    gust: Math.round(vNow * 1.9), precip: 0, pop: nowcast.state === 'dry' ? 10 : 55, humidity: h9.humidity, pressure: Math.round(lerp(o.press, 9.5)), dewPoint: Math.round(tNow - (100 - h9.humidity) / 5), visibility: o.visibility || 14, cloud: h9.cloud, uv: Math.round(h9.uv * 10) / 10,
    sunrise: st.sunrise, sunset: st.sunset, summary: o.summary,
  };
  const moon = moonOf(DAY0, st.sunrise, st.sunset);
  const sun = { date: DAY0, sunrise: st.sunrise, sunset: st.sunset, noon: st.noon, dayLength: lenText(st.len), dayDeltaMin: Math.round(st.len - sunTimes(lat, lon, addDay(DAY0, -1), o.calib || [-12, 5]).len),
    golden: { morning: [st.sunrise, hhmm(toMin(st.sunrise) + 42)], evening: [hhmm(toMin(st.sunset) - 42), st.sunset] }, civil: { dawn: hhmm(toMin(st.sunrise) - 36), dusk: hhmm(toMin(st.sunset) + 36) }, moon,
    days: daily.map((d) => ({ date: d.date, sunrise: d.sunrise, sunset: d.sunset })) };
  const todayHours = hours.slice(0, 24);
  const uv = { max: Math.round(Math.max(...todayHours.map((h) => h.uv))), maxExact: Math.max(...todayHours.map((h) => h.uv)), peakTime: todayHours.reduce((a, h) => (h.uv > a.uv ? h : a), todayHours[0]).time, hourly: todayHours.map((h) => ({ time: h.time, uv: h.uv })), forecast: daily.slice(0, 5).map((d) => ({ date: d.date, uv: d.uv })), skin: 'Hauttyp 2 (hell): ohne Schutz unbedenklich bis UV 2' };
  return {
    id: o.id, name: o.name, region: o.region, country: o.country, lat, lon, elevation: o.elevation, kind: o.kind, saved: !!o.saved, favorite: !!o.favorite, order: o.order ?? 99, isCurrentLocation: !!o.isCurrentLocation,
    trip: o.trip || null, climate: o.climate || null, tzNote: o.tzNote || '', updated: '2026-11-24T09:25:00', staleAfterHours: 3, source: 'Deutscher Wetterdienst (DWD) · fiktive Demo-Daten',
    current, nowcast, hours, daily, alerts: o.alerts || [], pollen: pollenOf(o.pollenRegion || 'Nordrhein-Westfalen'), air: buildAir(o.air || { pm25: 12, pm10: 18, o3: 31, no2: 29, so2: 2 }, o.airForecast), uv, sun,
  };
}

// ------------------------------------------------------------------ Warnungen (DWD-Schema, fiktiv)
const maxIn = (hours, from, to, key) => Math.max(...hours.filter((h) => h.time >= from && h.time < to).map((h) => h[key]));
export const wxAlertLevels = [
  { level: 1, name: 'Wetterwarnung', color: 'Gelb', meaning: 'Wetter, das im Alltag Aufmerksamkeit verlangt, zum Beispiel Windböen oder leichter Frost.', action: 'Aufmerksam sein, Plan bei Bedarf anpassen.' },
  { level: 2, name: 'Markante Wetterwarnung', color: 'Orange', meaning: 'Deutlich ausgeprägtes Wetter mit möglichen Schäden und Behinderungen, zum Beispiel Sturmböen oder Dauerregen.', action: 'Vorsicht: Aktivitäten im Freien überdenken, Gegenstände sichern.' },
  { level: 3, name: 'Unwetterwarnung', color: 'Rot', meaning: 'Gefährliches Unwetter mit hohem Schadenspotenzial, zum Beispiel schwere Sturmböen oder Starkregen.', action: 'Gefahr: Aufenthalt im Freien meiden, Wege verschieben.' },
  { level: 4, name: 'Extreme Unwetterwarnung', color: 'Violett', meaning: 'Extremes Unwetter mit Lebensgefahr, zum Beispiel Orkanböen. Kommt nur selten vor.', action: 'Lebensgefahr: Schutz in Gebäuden suchen, Anweisungen der Behörden befolgen.' },
];
const SRC = 'Deutscher Wetterdienst (DWD) · fiktive Demo-Daten';

// ------------------------------------------------------------------ Bielefeld (Standort)
const BI_DAYS = [
  [['o', 7], ['a', 4], ['p', 3], ['r', 5], ['d', 2], ['o', 3]],                                  // Di 24.11.: Sturm & Regen ab 14 Uhr
  [['d', 2], ['o', 4], ['d', 1], ['r', 2], ['d', 2], ['o', 1], ['p', 4], ['o', 8]],              // Mi 25.11.: Schauer, böig
  [['c', 7], ['a', 1], ['s', 8], ['a', 1], ['c', 7]],                                            // Do 26.11.: sonnig, kalt
  [['c', 5], ['g', 3], ['a', 2], ['p', 6], ['o', 4], ['o', 4]],                                  // Fr 27.11.: Reifnebel, Frost
  [['o', 6], ['p', 2], ['o', 3], ['n', 6], ['m', 2], ['o', 5]],                                  // Sa 28.11.: Schnee am Nachmittag
];
const BI_EXT = [[-10, 7], [5, 3.4], [13, 8], [30, 3], [36, 7.2], [55, 0.2], [62, 5.2], [78, -0.8], [86, 3.6], [102, -1.7], [109, 2], [126, -0.9], [134, 3]];
const BI_WIND = [[0, 14], [8, 16], [11, 19], [13, 24], [15, 36], [17, 41], [19, 33], [22, 24], [27, 30], [30, 33], [33, 27], [36, 24], [42, 20], [48, 14], [60, 12], [72, 8], [84, 12], [96, 10], [108, 12], [120, 14]];
const BI_PRESS = [[0, 1013], [14, 1008], [20, 1003], [30, 1004], [42, 1010], [54, 1017], [66, 1021], [84, 1022], [100, 1020], [120, 1015]];
const BI_DIRS = [225, 270, 315, 45, 90];
const bielefeldHours = buildHours({ days: BI_DAYS, ext: BI_EXT, wind: BI_WIND, press: BI_PRESS, dirs: BI_DIRS, lat: 52.02, lon: 8.53, mmOverride: { 9: 0.3, 10: 0.1 } });
const sturmMax = maxIn(bielefeldHours, '2026-11-24T14', '2026-11-24T23', 'gust');
const windMi = maxIn(bielefeldHours, '2026-11-25T06', '2026-11-25T12', 'gust');
const frostMin = Math.min(...bielefeldHours.filter((h) => h.time >= '2026-11-26T22' && h.time < '2026-11-27T09').map((h) => h.temp));
const frostTxt = `${frostMin < 0 ? '−' : ''}${Math.abs(frostMin)}`;
const biAlerts = [
  { id: 'wx-a1', level: 2, kind: 'wind', title: 'Markante Wetterwarnung vor Sturmböen', short: `Sturmböen bis ${sturmMax} km/h`, text: `Aus Südwest treten Sturmböen mit Geschwindigkeiten bis ${sturmMax} km/h (Bft 8) auf. In exponierten Lagen sind einzelne schwere Sturmböen bis ${sturmMax + 12} km/h möglich. Dazu schauerartiger Regen.`,
    from: '2026-11-24T14:00:00', to: '2026-11-24T23:00:00', issued: '2026-11-24T08:52:00', area: 'Stadt Bielefeld', source: SRC,
    tips: ['Lose Gegenstände auf Balkon und Terrasse sichern', 'Aufenthalt im Freien und unter Bäumen meiden', 'Mit dem Rad lieber früh unterwegs sein oder auf Bahn und Auto ausweichen', 'Fenster und Türen geschlossen halten'] },
  { id: 'wx-a2', level: 1, kind: 'wind', title: 'Wetterwarnung vor Windböen', short: `Windböen bis ${windMi} km/h`, text: `Am Mittwochvormittag sind aus West Windböen bis ${windMi} km/h (Bft 7) möglich, begleitet von einzelnen Schauern.`,
    from: '2026-11-25T06:00:00', to: '2026-11-25T12:00:00', issued: '2026-11-24T08:52:00', area: 'Stadt Bielefeld', source: SRC,
    tips: ['Auf dem Rad auf Seitenwind achten', 'Gartenmöbel und Mülltonnen sichern'] },
  { id: 'wx-a3', level: 1, kind: 'frost', title: 'Wetterwarnung vor Frost und Glätte', short: `Frost bis ${frostTxt} °C, Reifglätte`, text: `In der Nacht zum Freitag sinken die Temperaturen auf bis zu ${frostTxt} °C. Auf Brücken, Radwegen und in Senken ist Reifglätte möglich, vereinzelt Reifnebel.`,
    from: '2026-11-26T22:00:00', to: '2026-11-27T09:00:00', issued: '2026-11-24T08:52:00', area: 'Stadt Bielefeld', source: SRC,
    tips: ['Morgens mehr Zeit für den Weg einplanen', 'Auf Brücken und im Schatten vorsichtig fahren', 'Autoscheiben vorher freikratzen'] },
];
const bielefeld = makePlace({
  id: 'bielefeld', name: 'Bielefeld', region: 'Nordrhein-Westfalen', country: 'Deutschland', lat: 52.02, lon: 8.53, elevation: 118, kind: 'standort', saved: true, favorite: true, order: 0, isCurrentLocation: true,
  days: BI_DAYS, ext: BI_EXT, wind: BI_WIND, press: BI_PRESS, dirs: BI_DIRS, mmOverride: { 9: 0.3, 10: 0.1 },
  nowcast: { 2: 0.3, 3: 0.7, 4: 1.1, 5: 1.4, 6: 0.9, 7: 0.4, 8: 0.2 },
  summary: `Zunächst leicht bewölkt, gegen 09:42 kurzer Schauer. Am Nachmittag Regen und Sturmböen bis ${sturmMax} km/h.`,
  later: [
    { code: 'cloudy', min: -1, max: 3, pop: 20, precip: 0.2, wind: 16, gust: 30, sun: 1.2, dir: 'N' },
    { code: 'drizzle', min: 1, max: 5, pop: 55, precip: 1.8, wind: 24, gust: 42, sun: 0.4, dir: 'W' },
    { code: 'rain', min: 3, max: 7, pop: 75, precip: 6.2, wind: 32, gust: 56, sun: 0.2, dir: 'SW' },
    { code: 'partly', min: 2, max: 6, pop: 25, precip: 0.4, wind: 22, gust: 38, sun: 2.4, dir: 'W' },
    { code: 'fog', min: 1, max: 5, pop: 10, precip: 0, wind: 8, gust: 16, sun: 0.8, dir: 'S', hum: 94 },
  ],
  alerts: biAlerts, airForecast: [2, 1, 1],
});

// ------------------------------------------------------------------ Hamburg (gemerkt, mit Unwetterwarnung Stufe 3)
const HH_DAYS = [
  [['o', 6], ['d', 3], ['r', 9], ['d', 3], ['o', 3]], [['d', 4], ['r', 3], ['d', 3], ['p', 5], ['o', 9]], [['c', 6], ['a', 2], ['s', 8], ['a', 2], ['c', 6]], [['c', 4], ['g', 4], ['a', 3], ['p', 6], ['o', 7]], [['o', 8], ['d', 3], ['n', 4], ['m', 3], ['o', 6]],
];
const HH_EXT = [[-10, 8], [5, 5.2], [14, 8.6], [29, 4.6], [36, 7.4], [55, 1], [62, 5.8], [78, 0], [86, 4], [102, -1], [110, 2.6], [126, -0.4], [134, 3.2]];
const HH_WIND = [[0, 22], [8, 28], [12, 36], [15, 48], [18, 54], [21, 46], [26, 34], [32, 30], [40, 22], [48, 14], [72, 10], [96, 14], [120, 14]];
const HH_PRESS = [[0, 1010], [14, 1004], [20, 999], [30, 1002], [42, 1009], [54, 1016], [84, 1021], [120, 1016]];
const hhHours = buildHours({ days: HH_DAYS, ext: HH_EXT, wind: HH_WIND, press: HH_PRESS, dirs: [225, 270, 315, 45, 90], lat: 53.55, lon: 10, uvMax: 1.1 });
const hhGust = maxIn(hhHours, '2026-11-24T15', '2026-11-25T02', 'gust');
const hamburg = makePlace({
  id: 'hamburg', name: 'Hamburg', region: 'Hamburg', country: 'Deutschland', lat: 53.55, lon: 10, elevation: 6, kind: 'gemerkt', saved: true, favorite: false, order: 1, pollenRegion: 'Schleswig-Holstein und Hamburg',
  days: HH_DAYS, ext: HH_EXT, wind: HH_WIND, press: HH_PRESS, dirs: [225, 270, 315, 45, 90], uvMax: 1.1, nowCode: 'drizzle', nowcast: { 0: 0.3, 1: 0.3, 2: 0.4, 3: 0.3, 6: 0.2, 7: 0.2, 12: 0.3, 13: 0.3, 14: 0.4 },
  summary: `Regnerisch und kräftiger Wind. Nachmittags schwere Sturmböen bis ${hhGust} km/h, Unwetterwarnung Stufe 3.`,
  later: [{ code: 'cloudy', min: 0, max: 4, pop: 25, precip: 0.4, wind: 20, gust: 38, sun: 1, dir: 'N' }, { code: 'drizzle', min: 2, max: 6, pop: 60, precip: 2.6, wind: 26, gust: 46, sun: 0.4, dir: 'W' }, { code: 'rain', min: 4, max: 8, pop: 80, precip: 7.4, wind: 34, gust: 58, sun: 0.1, dir: 'SW' }, { code: 'partly', min: 3, max: 6, pop: 30, precip: 0.6, wind: 24, gust: 40, sun: 2, dir: 'W' }, { code: 'cloudy', min: 2, max: 5, pop: 25, precip: 0.3, wind: 18, gust: 32, sun: 0.8, dir: 'NW' }],
  alerts: [{ id: 'wx-hh1', level: 3, kind: 'wind', title: 'Unwetterwarnung vor schweren Sturmböen', short: `Schwere Sturmböen bis ${hhGust} km/h`, text: `Aus Südwest treten schwere Sturmböen mit Geschwindigkeiten bis ${hhGust} km/h (Bft 10) auf. Es besteht Gefahr durch umstürzende Bäume und herabfallende Äste.`, from: '2026-11-24T15:00:00', to: '2026-11-25T02:00:00', issued: '2026-11-24T08:40:00', area: 'Freie und Hansestadt Hamburg', source: SRC,
    tips: ['Aufenthalt im Freien unbedingt vermeiden', 'Nicht unter Bäumen oder an Gerüsten aufhalten', 'Bahn- und Fährverkehr kann ausfallen, vorher informieren'] }],
  airForecast: [2, 2, 1],
});

// ------------------------------------------------------------------ Lissabon (Reiseziel ab 12.12.)
const LI_DAYS = [[['c', 6], ['a', 3], ['s', 8], ['a', 2], ['c', 5]], [['c', 6], ['s', 10], ['a', 3], ['c', 5]], [['c', 5], ['a', 3], ['p', 6], ['d', 3], ['o', 7]], [['o', 6], ['d', 3], ['r', 5], ['d', 4], ['o', 6]], [['o', 4], ['p', 6], ['s', 6], ['a', 3], ['c', 5]]];
const LI_EXT = [[-10, 16], [5, 11], [14, 17.4], [29, 11.6], [38, 17.8], [53, 12.4], [62, 17], [77, 13], [86, 16.4], [101, 12.2], [110, 15], [125, 11], [134, 16]];
const LI_WIND = [[0, 12], [14, 16], [30, 10], [48, 12], [72, 20], [96, 16], [120, 12]];
const LI_PRESS = [[0, 1022], [24, 1024], [48, 1020], [72, 1014], [96, 1016], [120, 1020]];
const lissabon = makePlace({
  id: 'lissabon', name: 'Lissabon', region: 'Lissabon', country: 'Portugal', lat: 38.72, lon: -9.14, elevation: 2, kind: 'reise', saved: true, favorite: false, order: 2, pollenRegion: 'Großraum Lissabon',
  days: LI_DAYS, ext: LI_EXT, wind: LI_WIND, press: LI_PRESS, dirs: [315, 315, 270, 225, 270], uvMax: 3.2, nowCode: 'sun', tzNote: 'Alle Zeiten in MEZ (Lissabon: Ortszeit −1 h)', calib: [-4, 4],
  trip: { from: '2026-12-12', to: '2026-12-19', label: 'Reise', note: 'Städtetrip mit Jana' }, climate: { month: 'Dezember', hi: 15, lo: 9, rainDays: 9, sunHours: 5.4, text: 'Im Dezember meist mild, 9 Regentage, im Schnitt 5 Sonnenstunden. Regenjacke einpacken.' },
  summary: 'Meist sonnig und mild, nachts frisch. Zum Wochenende ziehen Wolken und leichter Regen auf.', visibility: 20,
  later: [{ code: 'rain', min: 12, max: 16, pop: 70, precip: 7, wind: 24, gust: 40, sun: 1, dir: 'SW' }, { code: 'partly', min: 11, max: 16, pop: 20, precip: 0.4, wind: 18, gust: 30, sun: 4.8, dir: 'W' }, { code: 'sun', min: 10, max: 17, pop: 5, precip: 0, wind: 12, gust: 20, sun: 8, dir: 'NW' }, { code: 'sun', min: 10, max: 17, pop: 5, precip: 0, wind: 10, gust: 18, sun: 8.2, dir: 'N' }, { code: 'fair', min: 11, max: 16, pop: 15, precip: 0, wind: 12, gust: 22, sun: 6, dir: 'NW' }],
  alerts: [], air: { pm25: 7, pm10: 14, o3: 44, no2: 18, so2: 3 }, airForecast: [1, 1, 2],
});

// ------------------------------------------------------------------ weitere Orte (nur Suche; zufallsbasierte, aber feste Verläufe)
const PAT = {
  sunny: [['c', 6], ['a', 2], ['s', 8], ['a', 2], ['c', 6]], mixed: [['o', 6], ['p', 4], ['a', 4], ['p', 4], ['o', 6]], rainy: [['o', 4], ['d', 3], ['r', 8], ['d', 4], ['o', 5]], gray: [['o', 24]], snowy: [['o', 6], ['p', 2], ['n', 8], ['m', 2], ['o', 6]],
};
const quick = (id, name, region, country, lat, lon, base, pats, extra = {}) => {
  const ext = [[-10, base + 2], [5, base - 2], [14, base + 3], [29, base - 2.4], [38, base + 2.4], [53, base - 3], [62, base + 1.8], [77, base - 2.6], [86, base + 2.2], [101, base - 2], [110, base + 2], [125, base - 1.8], [134, base + 2]];
  return makePlace({ id, name, region, country, lat, lon, elevation: 100, kind: 'suche', days: pats.map((p) => PAT[p]), ext, wind: [[0, 12], [48, 18], [96, 12], [120, 14]], press: [[0, 1016], [120, 1018]], dirs: [225, 270, 270, 315, 270], hoursN: 72,
    nowCode: extra.nowCode || 'partly', nowcast: {}, summary: extra.summary || 'Wechselhaft, kaum Wind.', calib: extra.calib || [-12, 5], later: extra.later || [{ code: 'cloudy', min: base - 3, max: base + 1, pop: 25, precip: 0.4, wind: 14, gust: 26, sun: 1 }, { code: 'partly', min: base - 3, max: base + 2, pop: 20, precip: 0, wind: 12, gust: 22, sun: 3 }, { code: 'rain', min: base - 1, max: base + 3, pop: 70, precip: 5, wind: 20, gust: 36, sun: 0.4 }, { code: 'cloudy', min: base - 2, max: base + 2, pop: 30, precip: 0.5, wind: 14, gust: 26, sun: 1 }, { code: 'sun', min: base - 4, max: base + 3, pop: 5, precip: 0, wind: 10, gust: 18, sun: 6 }, { code: 'partly', min: base - 3, max: base + 2, pop: 15, precip: 0, wind: 10, gust: 18, sun: 3 }, { code: 'cloudy', min: base - 2, max: base + 1, pop: 25, precip: 0.2, wind: 12, gust: 22, sun: 1 }], ...extra });
};
const catalog = [
  quick('berlin', 'Berlin', 'Berlin', 'Deutschland', 52.52, 13.4, 5, ['mixed', 'gray', 'sunny', 'sunny', 'mixed'], { tzNote: '' }),
  quick('muenchen', 'München', 'Bayern', 'Deutschland', 48.14, 11.58, 3, ['sunny', 'mixed', 'snowy', 'gray', 'mixed'], { nowCode: 'sun', summary: 'Sonnig und trocken, ab Donnerstag Schneefall.' }),
  quick('koeln', 'Köln', 'Nordrhein-Westfalen', 'Deutschland', 50.94, 6.96, 7, ['rainy', 'mixed', 'sunny', 'gray', 'mixed'], { nowCode: 'drizzle' }),
  quick('wien', 'Wien', 'Wien', 'Österreich', 48.21, 16.37, 4, ['gray', 'gray', 'sunny', 'mixed', 'snowy'], { nowCode: 'cloudy', summary: 'Bedeckt und windarm, am Wochenende Schneefall.' }),
  quick('tokio', 'Tokio', 'Kantō', 'Japan', 35.68, 139.69, 14, ['sunny', 'sunny', 'mixed', 'rainy', 'sunny'], { nowCode: 'sun', calib: [-12, 5], tzNote: 'Alle Zeiten in MEZ (Tokio: Ortszeit +8 h)', summary: 'Klare, trockene Herbsttage. Ideal für die Japan-Reise 2027 zum Vergleich.' }),
];
const catalogPlaces = catalog.map((p, i) => ({ ...p, order: 10 + i }));

export const wxPlaces = [bielefeld, hamburg, lissabon, ...catalogPlaces];
export const wxActive = bielefeld;

// ------------------------------------------------------------------ Einstellungen, Orte im Kalender, Training
export const wxSettings = {
  units: { temp: 'C', wind: 'kmh', precip: 'mm', pressure: 'hPa' }, clock: '24h', sensitivity: 'normal',
  allergens: ['birke', 'graeser'], offline: false, refreshMin: 30, source: 'DWD',
  alerts: { minLevel: 2, scope: 'standort', quiet: true, quietFrom: '22:00', quietTo: '06:30' },
  notify: { nowcast: true, daily: true, dailyTime: '07:00', allergy: true, uv: false, commute: true },
};
export const wxVenues = {
  'Café Moll': { mode: 'Fuß', min: 8, outdoor: true }, 'Trattoria Bella': { mode: 'Fuß', min: 10, outdoor: true }, 'Markt am Dom': { mode: 'Fuß', min: 10, outdoor: true, stayOutdoor: true },
  'Praxis Lindner': { mode: 'Rad', min: 15, outdoor: true }, 'Praxis Dr. Weber': { mode: 'Rad', min: 12, outdoor: true }, 'Studio Kraftwerk': { mode: 'Rad', min: 12, outdoor: true }, 'FitX Bielefeld': { mode: 'Rad', min: 12, outdoor: true },
  'Studio Ehrenfeld': { mode: 'Auto', min: 25, outdoor: false }, 'Kanzlei Brandt': { mode: 'Auto', min: 18, outdoor: false }, Brauhaus: { mode: 'Fuß', min: 12, outdoor: true },
};
// Trainingstage kommen aus der Fitness-Welt (Eigentümer: Fitness): Mo Unterkörper, Mi Oberkörper A, Fr Ganzkörper, Sa lockerer Lauf.
// Die Wanderung am Sonntag steht im Kalender (e20, Feldberg) und liegt außerhalb der gemerkten Orte.
const dowOfIso = (iso) => (new Date(`${iso}T12:00:00`).getDay() + 6) % 7; // 0 = Montag
const endOf = (start, min) => hhmm(toMin(start) + min);
export const wxTraining = [
  ...Array.from({ length: 7 }, (_, k) => addDay(DAY0, k)).flatMap((date) => {
    const dow = dowOfIso(date), day = trainingProgram.days.find((d) => d.dow === dow);
    if (day) return [{ id: `tr-${day.id}`, eventId: `e-fit-${day.id}`, date, start: day.time, end: endOf(day.time, day.durationMin), title: `Krafttraining ${day.name}`, where: fitnessProfile.gym, outdoor: false, kind: 'Kraft' }];
    if (dow === 5) return [{ id: 'tr-run', date, start: null, end: null, title: 'Lockerer Lauf', where: 'Johannisberg', outdoor: true, kind: 'Laufen', durationMin: 50 }];
    if (dow === 6) return [{ id: 'tr-hike', eventId: 'e20', date, start: '11:00', end: '15:00', title: 'Wanderung Taunus', where: 'Feldberg', outdoor: true, kind: 'Wandern', externalPlace: true }];
    return [];
  }),
];

// --- Launchpad, Hinweise, Suche, Mitteilungen (aus den Orten und Warnungen oben abgeleitet) -------------------------------------
const alertNow = wxActive.alerts.find((a) => a.level >= 2) || wxActive.alerts[0];
const hm = (iso) => `${iso.slice(11, 13)}:${iso.slice(14, 16)}`;
export const weatherSummary = {
  kpis: [
    { label: wxActive.name, value: String(Math.round(wxActive.current.temp)), unit: '°C', icon: 'cloud-sun', tone: 'info', to: 'weather.home' },
    ...(alertNow ? [{ label: `Warnung Stufe ${alertNow.level}`, value: alertNow.short, icon: 'alert-triangle', tone: 'warning', to: 'weather.alerts' }] : []),
    { label: 'Regen', value: wxActive.nowcast.text || 'trocken', icon: 'cloud-rain', tone: 'neutral', to: 'weather.radar' },
  ],
};
export const weatherHints = alertNow ? [
  { id: 'h-wx-alert', text: `${alertNow.short} ab ${hm(alertNow.from)} Uhr (Warnstufe ${alertNow.level}). Wege am besten vorher erledigen, der Lieferanten-Call um 15:00 Uhr läuft per Zoom.`, source: `wxActive.alerts[${alertNow.id}]`, module: 'weather', tone: 'warning', to: 'weather.alerts' },
] : [];
export const weatherSearch = [
  ...wxPlaces.filter((p) => p.saved).map((p) => ({ id: `place:${p.id}`, type: 'Ort', title: p.name, subtitle: p.region, module: 'weather', to: 'weather.locations', params: { id: p.id } })),
  ...wxActive.alerts.map((a) => ({ id: `wxalert:${a.id}`, type: 'Warnung', title: a.title, subtitle: `Stufe ${a.level} · ${a.short}`, module: 'weather', to: 'weather.alerts', params: { id: a.id } })),
];
export const weatherNotifications = alertNow ? [
  { id: 'n-wx', title: `Böen-Warnung ab ${hm(alertNow.from)} Uhr`, text: `Stufe ${alertNow.level}, ${alertNow.short.toLowerCase().replace('sturmböen', 'Sturmböen')} bis ${hm(alertNow.to)} Uhr. Draußen-Termine prüfen.`, module: 'weather', tone: 'warning', priority: 'wichtig', time: alertNow.issued, to: 'weather.alerts' },
] : [];

// Szenarien: Wetter und Orte kommen von außen und bleiben im Ersten Start erhalten. Geplantes Training gibt es erst mit einem gewählten Plan
// (der Erste Start hat noch keinen Termin im Kalender), darum ist `wxTraining` dort leer (Referenzen auf Termine bleiben auflösbar).
export const scenarios = { erststart: { wxTraining: [] } };
