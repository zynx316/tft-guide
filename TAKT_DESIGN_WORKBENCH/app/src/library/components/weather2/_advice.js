// Wetter-Logik für Alltagsentscheidungen (rein, ohne UI): Kleidung, Aktivitätsfenster, Termin-/Pendelwege, Tagesbriefing.
// Alle Zeiten relativ zu „jetzt“ (ctx.today), Einheiten kommen erst in der Anzeige dazu.
import { stamp, hourStamp, hm, dkey, minOf, diffMin, isWet, hoursFrom, wd, dateStr, dayName, LV } from './_weather2.js';

const SENS = { friert: -3, normal: 0, warm: 3 };
export const SENS_LABEL = { friert: 'Friert schnell', normal: 'Normal', warm: 'Unempfindlich' };
const hourOf = (h) => +hm(h.time).slice(0, 2);

// ---------------------------------------------------------------- Kleidung
export function clothingAdvice(place, S, today) {
  const sens = SENS[S.sensitivity] ?? 0;
  const from = hourStamp(today), until = `${dkey(from)}T22:00:00`;
  const win = place.hours.filter((h) => h.time >= from && h.time <= until);
  const hrs = win.length ? win : hoursFrom(place, today, 12);
  const segs = [['Jetzt bis 12 Uhr', 0, 12], ['12 bis 18 Uhr', 12, 18], ['18 bis 22 Uhr', 18, 23]].map(([label, a, b]) => {
    const hs = hrs.filter((h) => hourOf(h) >= a && hourOf(h) < b);
    if (!hs.length) return null;
    const worst = hs.reduce((x, y) => (y.feels < x.feels ? y : x), hs[0]);
    return { label, feels: worst.feels + sens, code: worst.code, night: worst.night, gust: Math.max(...hs.map((h) => h.gust)), rain: hs.some((h) => h.precip >= 0.5 || h.pop >= 70) };
  }).filter(Boolean);
  const f = Math.min(...hrs.map((h) => h.feels)) + sens;
  const gust = Math.max(...hrs.map((h) => h.gust)), pop = Math.max(...hrs.map((h) => h.pop)), mm = hrs.reduce((s, h) => s + h.precip, 0);
  const snow = hrs.some((h) => h.code === 'snow' || h.code === 'sleet'), uv = Math.max(...hrs.map((h) => h.uv));
  const items = [];
  const add = (id, icon, label, why) => items.push({ id, icon, label, why });
  if (f <= -3) { add('jacke', 'shirt', 'Dicke Winterjacke', `gefühlt bis ${Math.round(f)}°`); add('mütze', 'snowflake', 'Mütze, Schal & Handschuhe', 'Kälte an Kopf und Händen'); }
  else if (f <= 4) { add('jacke', 'shirt', 'Winterjacke', `gefühlt ab ${Math.round(f)}°`); add('mütze', 'snowflake', sens < 0 ? 'Mütze & Handschuhe' : 'Mütze', 'Wind und Kälte'); }
  else if (f <= 10) { add('jacke', 'shirt', 'Übergangsjacke', `gefühlt ab ${Math.round(f)}°`); add('pulli', 'shirt', 'Pullover', 'zum Schichten'); }
  else if (f <= 17) add('jacke', 'shirt', 'Leichte Jacke', `gefühlt ab ${Math.round(f)}°`);
  else if (f <= 23) add('shirt', 'shirt', 'T-Shirt, Pullover dabei', 'abends kühler');
  else { add('luftig', 'shirt', 'Luftige Kleidung', 'warm'); add('trinken', 'droplets', 'Wasser mitnehmen', 'Wärme'); }
  const wet = pop >= 50 && mm >= 0.5;
  if (wet && gust >= 50) add('regen', 'umbrella', 'Regenjacke statt Schirm', `Böen bis ${gust} km/h`);
  else if (wet && gust >= 35) add('regen', 'umbrella', 'Regenjacke', 'Regen und Wind');
  else if (wet) add('regen', 'umbrella', 'Schirm', `${Math.round(pop)} % Regenrisiko`);
  if (snow || hrs.some((h) => h.temp <= 0 && h.precip > 0)) add('schuhe', 'footprints', 'Wasserfeste Schuhe', 'Schnee oder Glätte');
  else if (hrs.some((h) => h.temp <= 0)) add('schuhe', 'footprints', 'Schuhe mit Profil', 'Frost, Glätte möglich');
  if (uv >= 3) add('sonne', 'sun-medium', 'Sonnenbrille & Creme', `UV-Index ${Math.round(uv)}`);
  const lead = f <= 4 ? 'Warm einpacken' : f <= 10 ? 'Jacke mitnehmen' : f <= 17 ? 'Leichte Jacke reicht' : 'Leicht anziehen';
  const reason = `Gefühlt ${Math.round(f)}° im Tagesverlauf${gust >= 45 ? `, Böen bis ${gust} km/h` : ''}${wet ? ', zwischendurch Regen' : ''}.`;
  return { lead, headline: items.slice(0, 3).map((i) => i.label).join(', '), reason, items, parts: segs, minFeels: Math.round(f), gust };
}

// ---------------------------------------------------------------- Aktivitäten
export const ACTIVITIES = [
  { id: 'run', label: 'Laufen', icon: 'footprints', dur: 1, comfort: [1, 14], wind: 28, gust: 45, day: true, air: true, snow: 28 },
  { id: 'bike', label: 'Radfahren', icon: 'bike', dur: 2, comfort: [4, 20], wind: 22, gust: 38, day: true, air: true, snow: 60 },
  { id: 'walk', label: 'Spaziergang', icon: 'person-standing', dur: 1, comfort: [-2, 22], wind: 34, gust: 55, day: true, snow: 8 },
  { id: 'car', label: 'Auto waschen', icon: 'car', dur: 2, comfort: [4, 28], wind: 30, gust: 50, day: true, rain: 100 },
  { id: 'laundry', label: 'Wäsche draußen trocknen', icon: 'wind', dur: 5, comfort: [10, 30], wind: 40, gust: 60, day: true, rain: 100, humid: 70 },
];
const RATING = (s) => (s >= 78 ? 'Sehr gut' : s >= 58 ? 'Gut' : s >= 38 ? 'Mäßig' : 'Eher nicht');
export const ratingOf = RATING;
export const scoreTone = (s) => (s >= 58 ? 'success' : s >= 38 ? 'warning' : 'danger');

export function hourScore(a, h, airIdx = 2, pen = 0) {
  const f = h.feels, [lo, hi] = a.comfort;
  let s = 96 - Math.min(60, 5 * Math.max(0, lo - f, f - hi)) - Math.min(14, 1.3 * Math.abs(f - (lo + hi) / 2)) - Math.max(0, h.gust - a.gust * 0.6) * 0.5 - h.wind * 0.25 - pen;
  const wet = isWet(h);
  if (wet) s -= (a.rain || 38) * Math.min(1, 0.55 + h.precip);
  else if (h.pop >= 50) s -= (a.rain || 38) * 0.35;
  s -= Math.max(0, h.wind - a.wind) * 1.3 + Math.max(0, h.gust - a.gust) * 1.1;
  if (a.humid && h.humidity > a.humid) s -= (h.humidity - a.humid) * 1.6;
  if (a.day && h.night) s = Math.min(s, 8);
  if (a.air && airIdx >= 4) s -= 30;
  if (a.snow && (h.code === 'snow' || h.code === 'sleet' || (h.temp <= 1 && h.precip > 0))) s -= a.snow;
  return Math.max(0, Math.min(100, Math.round(s)));
}
const describe = (hs, U) => {
  const gust = Math.max(...hs.map((h) => h.gust)), t = hs.reduce((s, h) => s + h.temp, 0) / hs.length, ft = hs.reduce((s, h) => s + h.feels, 0) / hs.length;
  const dry = !hs.some(isWet);
  return `${dry ? 'trocken' : 'Niederschlag'}, ${U.t(t)}${Math.abs(ft - t) >= 2 ? ` (gefühlt ${U.t(ft)})` : ''}, Böen bis ${U.w(gust)}`;
};
/** Bestes Fenster der Länge dur (Stunden) aus einer Stundenliste. */
export function bestWindow(a, hs, U, airIdx, pens = {}) {
  const n = Math.max(1, Math.min(a.dur, hs.length)); let best = null;
  const sc = (h) => hourScore(a, h, airIdx, pens[h.time] || 0);
  for (let i = 0; i + n <= hs.length; i++) {
    const w = hs.slice(i, i + n), avg = w.reduce((s, h) => s + sc(h), 0) / n, worst = Math.min(...w.map(sc));
    const total = Math.round(avg * 0.7 + worst * 0.3);
    if (!best || total > best.score) best = { score: total, start: w[0].time, end: stamp(new Date(new Date(w[n - 1].time).getTime() + 3600000)), hours: w, reason: describe(w, U) };
  }
  return best;
}
export function activityAdvice(place, today, U, minutesBusy = []) {
  const airIdx = place.air?.index || 2, next = hoursFrom(place, today, 48);
  const pens = {}; for (const h of place.hours) pens[h.time] = Math.min(40, (place.alerts || []).filter((x) => x.from < stamp(new Date(new Date(h.time).getTime() + 3600000)) && x.to > h.time).reduce((s, x) => s + x.level * 12, 0));
  const isFree = (h) => !minutesBusy.some((b) => h.time < b.end && stamp(new Date(new Date(h.time).getTime() + 3600000)) > b.start);
  return ACTIVITIES.map((a) => {
    const free = next.filter(isFree);
    const best = bestWindow(a, free.length >= a.dur ? free : next, U, airIdx, pens);
    const nowScore = next.length ? hourScore(a, next[0], airIdx, pens[next[0].time]) : 0;
    const days = [...new Set(place.hours.map((h) => dkey(h.time)))].slice(0, 5).map((d) => { const hs = place.hours.filter((h) => dkey(h.time) === d && h.time >= hourStamp(today) && isFree(h)); return hs.length >= a.dur ? { date: d, best: bestWindow(a, hs, U, airIdx, pens) } : null; }).filter(Boolean);
    return { ...a, nowScore, best, days, strip: next.map((h) => ({ time: h.time, score: hourScore(a, h, airIdx, pens[h.time]) })) };
  });
}

// ---------------------------------------------------------------- Termine & Wege
const MODE_ICON = { Fuß: 'footprints', Rad: 'bike', Auto: 'car', Bahn: 'train-front' };
export const modeIcon = (m) => MODE_ICON[m] || 'navigation';
const at = (place, iso) => place.hours.find((h) => h.time === hourStamp(iso));
function legCheck(h, mode, mid) {
  const tips = []; let sev = 0;
  if (!h) return { sev: 0, tips, h };
  const exposed = mode === 'Rad' || mode === 'Fuß';
  if (exposed && h.gust >= 60) { sev = 2; tips.push(`Böen bis ${h.gust} km/h – ${mode === 'Rad' ? 'besser Bahn oder Auto' : 'Bäume und Gerüste meiden'}`); }
  else if (exposed && h.gust >= 45) { sev = Math.max(sev, 1); tips.push(`Windig (Böen ${h.gust} km/h)`); }
  if (mode === 'Auto' && h.gust >= 60) { sev = Math.max(sev, 1); tips.push('Sturmböen: Abstand halten, auf Äste achten'); }
  if (isWet(h) && h.code !== 'snow' && h.code !== 'sleet' && exposed) { sev = Math.max(sev, 1); tips.push(`${mid}: Regen – Regenjacke einplanen`); }
  if ((h.code === 'snow' || h.code === 'sleet') && mode !== 'Bahn') { sev = Math.max(sev, mode === 'Rad' ? 2 : 1); tips.push(`${mid}: Schnee${mode === 'Auto' ? ' – mehr Zeit einplanen' : ''}`); }
  if (h.temp <= 0 && mode === 'Rad' && !(h.code === 'snow')) { sev = Math.max(sev, 1); tips.push('Frost: Glätte auf Brücken und Radwegen möglich'); }
  return { sev, tips, h };
}
/** Termine/Trainings mit Weg im Zeitraum – bewertet Hin- und Rückweg gegen die Stundenwerte. */
export function tripAdvice(events, training, venues, place, today, hoursAhead = 72, alerts = []) {
  const now = stamp(today), until = stamp(new Date(new Date(today).getTime() + hoursAhead * 3600000));
  const src = [
    ...(events || []).filter((e) => !e.allDay && e.start >= now.slice(0, 11) + '00:00:00' && e.start <= until && venues?.[e.location]).map((e) => ({ id: e.id, title: e.title, start: e.start, end: e.end, venue: e.location, kind: 'Termin' })),
    ...(training || []).filter((t) => t.start && venues?.[t.where]).map((t) => ({ id: t.id, title: t.title, start: `${t.date}T${t.start}:00`, end: `${t.date}T${t.end}:00`, venue: t.where, kind: 'Training' })),
  ].filter((e) => e.end >= now && e.start <= until).sort((a, b) => a.start.localeCompare(b.start));
  return src.map((e) => {
    const v = venues[e.venue], depart = stamp(new Date(new Date(e.start).getTime() - (v.min + 5) * 60000));
    const out = legCheck(at(place, depart), v.mode, 'Hinweg'), back = legCheck(at(place, e.end), v.mode, 'Rückweg');
    const tips = [...new Set([...out.tips, ...back.tips])];
    const next = alerts.filter((a) => a.level >= 2 && a.from >= e.end && diffMin(a.from, e.end) <= 150).sort((a, b) => a.from.localeCompare(b.from))[0];
    if (next && !tips.length) tips.push(`Danach ab ${hm(next.from)} Uhr: ${next.short} – gut, dass du vorher zurück bist`);
    const during = alerts.find((a) => a.level >= 2 && a.from < e.end && a.to > depart);
    const sev = Math.max(out.sev, back.sev, during ? 1 : 0);
    if (during && !tips.some((t) => t.includes(during.short))) tips.push(`Warnung während des Termins: ${during.short}`);
    return { ...e, mode: v.mode, minutes: v.min, depart, out, back, sev, verdict: sev >= 2 ? 'bad' : sev === 1 ? 'warn' : 'ok', tips: tips.length ? tips : ['Beste Bedingungen – nichts zu beachten'] };
  });
}

// ---------------------------------------------------------------- Briefing (Fokus)
export function briefing(place, S, events, training, venues, today, U) {
  const now = stamp(today), items = [];
  const al = (place.alerts || []).filter((a) => a.to > now).sort((a, b) => b.level - a.level || a.from.localeCompare(b.from));
  const a0 = al.find((a) => a.level >= 2 && diffMin(a.from, now) <= 600) || al[0];
  if (a0) items.push({ id: 'alert', kind: 'alert', pri: 90 + a0.level * 3, tone: LV[a0.level].tone, icon: 'alert-triangle', title: `${a0.short} ab ${hm(a0.from)} Uhr`, text: `${LV[a0.level].short}, gilt bis ${hm(a0.to)} Uhr. ${a0.tips[0]}.`, action: 'Warnung', event: 'weather.alert.open', detail: { id: a0.id } });
  const nc = place.nowcast;
  if (nc && nc.state !== 'dry') items.push({ id: 'nowcast', kind: 'nowcast', pri: nc.startsInMin <= 30 ? 95 : 60, tone: 'info', icon: 'cloud-rain', title: nc.headline, text: `${nc.text} Ein ${nc.intensity}er Schauer, danach trocken.`, action: 'Radar', event: 'weather.radar.open', detail: { id: 'nowcast' } });
  const trips = tripAdvice(events, training, venues, place, today, 30, place.alerts || []).filter((t) => t.start >= now.slice(0, 11) + '00:00:00' && dkey(t.start) === dkey(now));
  const t0 = trips.find((t) => t.verdict !== 'ok') || trips[0];
  if (t0) items.push({ id: `trip-${t0.id}`, kind: 'trip', pri: t0.verdict === 'ok' ? 55 : 80, tone: t0.verdict === 'ok' ? 'success' : 'warning', icon: 'calendar-clock', title: `${t0.title} um ${hm(t0.start)} Uhr`, text: t0.tips[0], action: 'Wege', event: 'weather.advice.open', detail: { id: t0.id } });
  const c = clothingAdvice(place, S, today);
  items.push({ id: 'clothing', kind: 'clothing', pri: 70, tone: 'accent', icon: 'shirt', title: `${c.lead}: ${c.headline}`, text: c.reason, action: 'Kleidung', event: 'weather.advice.open', detail: { id: 'clothing' } });
  const busy = (events || []).filter((e) => !e.allDay).map((e) => ({ start: e.start, end: e.end }));
  const run = activityAdvice(place, today, U, busy).find((a) => a.id === 'run');
  const runDay = run.days.find((d) => d.best && d.best.score >= 58 && dkey(d.best.start) !== dkey(now));
  const runNow = run.best && dkey(run.best.start) === dkey(now) && run.best.score >= 58;
  if (runNow || runDay) { const b = runNow ? run.best : runDay.best; items.push({ id: 'run', kind: 'activity', pri: 40, tone: 'success', icon: 'footprints', title: `Lauffenster ${dayName(b.start, today)} ${hm(b.start)}–${hm(b.end)} Uhr`, text: `${b.reason}.`, action: 'Fenster', event: 'weather.advice.open', detail: { id: 'run' } }); }
  const env = (S.allergens || []).map((id) => place.pollen.types.find((t) => t.id === id)).filter((t) => t && t.levels[0] >= 2);
  if (env.length) items.push({ id: 'pollen', kind: 'env', pri: 65, tone: 'warning', icon: 'flower-2', title: `Pollenflug: ${env.map((t) => t.name).join(', ')}`, text: 'Stufe 2 oder höher für deine Allergene.', action: 'Pollen', event: 'weather.environment.open', detail: { id: 'pollen' } });
  return items.sort((a, b) => b.pri - a.pri);
}
export { wd, dateStr, minOf };
