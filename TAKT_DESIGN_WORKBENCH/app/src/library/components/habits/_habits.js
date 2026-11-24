// Gemeinsame Helfer für Gewohnheiten: Datumsschlüssel relativ zu ctx.today, Rhythmus, Serien (mit Gnadentag), Quoten, Ring.
// Datenmodell einer Gewohnheit:
//   { id, name, icon, tone(1–6), daypart('morgens'|'tagsüber'|'abends'), time?('07:30'), reminder?,
//     rhythm:{ type:'daily'|'weekdays'|'days'|'perWeek', days?:[0–6 (Mo=0)], perWeek? },
//     goal?:{ target, unit, step }, joker?(Gnadentag je Woche, Standard an), pauses?:['YYYY-MM-DD'],
//     since:'YYYY-MM-DD', log:{ 'YYYY-MM-DD': Anzahl }, link?:{ module, label } }
import { html } from '../../../lib/html.js';
import { isoDay } from '../../../lib/util.js';
import { Icon } from '../../ui.js';

const pad = (n) => String(n).padStart(2, '0');
export const WD = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
export const WD_LONG = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
export const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
export const DAYPARTS = [{ id: 'morgens', label: 'Morgens', icon: 'sunrise' }, { id: 'tagsüber', label: 'Tagsüber', icon: 'sun' }, { id: 'abends', label: 'Abends', icon: 'moon' }];

export const parseKey = (k) => { const [y, m, d] = String(k).split('-').map(Number); return new Date(y, m - 1, d); };
export const shift = (k, n) => { const d = parseKey(k); d.setDate(d.getDate() + n); return isoDay(d); };
export const wdOf = (k) => (parseKey(k).getDay() + 6) % 7;
export const weekStart = (k) => shift(k, -wdOf(k));
export const todayKey = (ctx) => isoDay(ctx.today);
export const dayLabel = (k) => { const d = parseKey(k); return `${WD[wdOf(k)]}, ${pad(d.getDate())}.${pad(d.getMonth() + 1)}.`; };
export const daysBetween = (a, b) => Math.round((parseKey(b) - parseKey(a)) / 864e5);
export const hourOf = (ctx) => ctx.today.getHours() + ctx.today.getMinutes() / 60;

export const list = (v) => (Array.isArray(v) ? v.filter((h) => h && !h.archived) : []);
export const countOn = (h, k) => Number(h.log?.[k]) || 0;
export const target = (h) => (h.goal ? Number(h.goal.target) || 1 : 1);
export const isDone = (h, k) => countOn(h, k) >= target(h);
export const isPaused = (h, k) => (h.pauses || []).includes(k);
export const isPerWeek = (h) => h.rhythm?.type === 'perWeek';
export const perWeek = (h) => Number(h.rhythm?.perWeek) || 3;

export function isScheduled(h, k) {
  const r = h.rhythm || { type: 'daily' }; const wd = wdOf(k);
  if (r.type === 'weekdays') return wd < 5;
  if (r.type === 'days') return (r.days || []).includes(wd);
  return true; // daily + perWeek (flexibel)
}
export const weekCount = (h, k) => { const s = weekStart(k); let n = 0; for (let i = 0; i < 7; i++) if (isDone(h, shift(s, i))) n++; return n; };
/** Heute fällig: geplant und noch offen – oder bereits erledigt (bleibt sichtbar). */
export function isDue(h, k) {
  if (isPaused(h, k)) return false;
  if (isPerWeek(h)) return isDone(h, k) || weekCount(h, k) < perWeek(h);
  return isScheduled(h, k);
}

export const rhythmLabel = (h) => {
  const r = h.rhythm || { type: 'daily' };
  if (r.type === 'weekdays') return 'Werktags';
  if (r.type === 'perWeek') return `${perWeek(h)}× pro Woche`;
  if (r.type === 'days') return (r.days || []).length === 7 ? 'Täglich' : (r.days || []).map((d) => WD[d]).join(' · ');
  return 'Täglich';
};
export const goalLabel = (h) => (h.goal ? `${h.goal.target} ${h.goal.unit}` : '');

/** Status eines Tages: done | partial | missed | rest | pause | joker | future | none | open */
export function dayStatus(h, k, today, jokers) {
  if (k > today) return 'future';
  if (h.since && k < h.since) return 'none';
  if (isPaused(h, k)) return 'pause';
  if (isDone(h, k)) return 'done';
  if (h.goal && countOn(h, k) > 0) return k === today ? 'open' : 'partial';
  if (jokers?.has(k)) return 'joker';
  if (isPerWeek(h) || !isScheduled(h, k)) return k === today && isPerWeek(h) ? 'open' : 'rest';
  return k === today ? 'open' : 'missed';
}

/** Serie (Vorwärtslauf): geplante Tage in Folge; pro Woche verzeiht 1 verpasster Tag (Gnadentag). Perwoche: Wochen in Folge. */
export function streakOf(h, today) {
  const start = h.since || shift(today, -400);
  let run = 0, best = 0; const jokers = new Set(); const usedWeek = new Set();
  if (isPerWeek(h)) {
    for (let w = weekStart(start); w <= weekStart(today); w = shift(w, 7)) {
      const met = weekCount(h, w) >= perWeek(h);
      if (met) { run++; best = Math.max(best, run); } else if (w < weekStart(today)) run = 0;
    }
    return { current: run, best, unit: run === 1 ? 'Woche' : 'Wochen', jokers, jokerFree: false, perWeek: true };
  }
  const last = isScheduled(h, today) && !isDone(h, today) && !isPaused(h, today) ? shift(today, -1) : today;
  for (let k = start; k <= last; k = shift(k, 1)) {
    if (isPaused(h, k) || !isScheduled(h, k)) continue;
    if (isDone(h, k)) { run++; best = Math.max(best, run); continue; }
    const w = weekStart(k);
    if (h.joker !== false && !usedWeek.has(w)) { usedWeek.add(w); jokers.add(k); } else run = 0;
  }
  return { current: run, best, unit: run === 1 ? 'Tag' : 'Tage', jokers, jokerFree: h.joker !== false && !usedWeek.has(weekStart(today)), perWeek: false };
}

/** Erfüllungsquote der letzten n Tage (ohne den noch offenen heutigen Tag). */
export function rateOf(h, today, n) {
  let due = 0, done = 0;
  if (isPerWeek(h)) {
    const weeks = Math.max(1, Math.round(n / 7));
    for (let i = 1; i <= weeks; i++) { const c = weekCount(h, shift(weekStart(today), -7 * i)); done += Math.min(c, perWeek(h)); due += perWeek(h); }
    return due ? done / due : 0;
  }
  for (let i = 1; i <= n; i++) { const k = shift(today, -i); if (h.since && k < h.since) break; if (!isScheduled(h, k) || isPaused(h, k)) continue; due++; if (isDone(h, k)) done++; }
  return due ? done / due : 0;
}
export const totalDone = (h) => Object.keys(h.log || {}).filter((k) => isDone(h, k)).length;

/** Quote je Wochentag (Mo=0) über n Tage. */
export function weekdayRates(h, today, n = 90) {
  const due = Array(7).fill(0), done = Array(7).fill(0);
  for (let i = 1; i <= n; i++) { const k = shift(today, -i); if ((h.since && k < h.since) || !isScheduled(h, k) || isPaused(h, k)) continue; const w = wdOf(k); due[w]++; if (isDone(h, k)) done[w]++; }
  return due.map((d, i) => (d ? done[i] / d : null));
}

export const weekDots = (h, today) => { const s = weekStart(today); const j = streakOf(h, today).jokers; return Array.from({ length: 7 }, (_, i) => { const k = shift(s, i); return { k, s: dayStatus(h, k, today, j), today: k === today }; }); };
export const progressOf = (habits, k) => { const due = list(habits).filter((h) => isDue(h, k)); return { due: due.length, done: due.filter((h) => isDone(h, k)).length, items: due }; };

/** Schreibt den Zähler eines Tages (0 löscht den Eintrag). */
export const setCount = (setData, id, k, n) => setData('habits', (all) => (Array.isArray(all) ? all : []).map((h) => {
  if (h.id !== id) return h;
  const log = { ...(h.log || {}) }; if (n > 0) log[k] = n; else delete log[k];
  return { ...h, log };
}));
export const tapLabel = (h) => `${h.name} ${h.goal ? 'abschließen' : 'abhaken'}`;
export const nextMilestone = (n) => [3, 7, 14, 21, 30, 50, 75, 100, 150, 200, 365].find((m) => m > n) || n + 50;
export const calm = (done, due) => (!due ? 'Heute ist nichts fällig – ein ruhiger Tag.' : done >= due ? 'Alles erledigt – schönen Tag.' : done === 0 ? 'Ein kleiner Schritt reicht für den Anfang.' : done / due >= 0.5 ? 'Gut dabei – der Rest hat Zeit.' : 'Jeder Haken zählt.');

/** Fortschrittsring (SVG) mit Inhalt in der Mitte. */
export function Ring({ value = 0, size = 44, stroke = 5, color = 'var(--tk-c-accent)', children, label }) {
  const R = (size - stroke) / 2, C = 2 * Math.PI * R, v = Math.max(0, Math.min(1, value));
  return html`<span class="tk-hb-ring" style=${`width:${size}px;height:${size}px`} role=${label ? 'img' : undefined} aria-label=${label} aria-hidden=${label ? undefined : 'true'}>
    <svg width=${size} height=${size} viewBox=${`0 0 ${size} ${size}`}><circle cx=${size / 2} cy=${size / 2} r=${R} fill="none" stroke=${color} stroke-opacity=".18" stroke-width=${stroke} />
    <circle cx=${size / 2} cy=${size / 2} r=${R} fill="none" stroke=${color} stroke-width=${stroke} stroke-linecap="round" stroke-dasharray=${`${Math.max(v * C, 0.01)} ${C}`} transform=${`rotate(-90 ${size / 2} ${size / 2})`} /></svg>
    <span class="tk-hb-ring__in">${children}</span></span>`;
}
/** Fortschrittsbalken in beliebiger Farbe (auch Chart-Töne). */
export const Bar = ({ value = 0, color = 'var(--tk-c-accent)' }) => html`<div class="tk-progress" role="progressbar" aria-valuenow=${Math.round(Math.max(0, Math.min(1, value)) * 100)} aria-valuemin="0" aria-valuemax="100"><span style=${`width:${Math.max(0, Math.min(1, value)) * 100}%;background:${color}`}></span></div>`;
export const Streak = ({ n, unit = 'Tage', big }) => html`<span class=${`tk-hb-streak ${big ? 'tk-hb-streak--big' : ''}`} data-on=${n > 0 ? 'true' : 'false'} title=${`Serie: ${n} ${unit}`} aria-label=${`Serie: ${n} ${unit}`}><${Icon} name="flame" size=${big ? 20 : 13} />${n}</span>`;

export const HABIT_CSS = `
.bp-mobile :is(.tk-tc__row, .tk-hf__row, .tk-db__sched) .tk-switch { width:52px; height:32px; border-radius:16px; } .bp-mobile :is(.tk-tc__row, .tk-hf__row, .tk-db__sched) .tk-switch::after { top:5px; left:5px; width:20px; height:20px; } .bp-mobile :is(.tk-tc__row, .tk-hf__row, .tk-db__sched) .tk-switch[aria-checked="true"]::after { transform:translateX(20px); }
.tk-hb-ring { position:relative; display:inline-grid; place-items:center; flex:none; } .tk-hb-ring svg { position:absolute; inset:0; } .tk-hb-ring__in { position:relative; display:grid; place-items:center; font-weight:var(--tk-fw-semibold); font-variant-numeric:tabular-nums; }
.tk-hb-streak { display:inline-flex; align-items:center; gap:3px; font-size:var(--tk-fs-sm); font-weight:var(--tk-fw-semibold); font-variant-numeric:tabular-nums; color:var(--tk-c-text-subtle); white-space:nowrap; }
.tk-hb-streak[data-on="true"] { color:var(--tk-c-text-muted); } .tk-hb-streak[data-on="true"] svg { color:var(--tk-c-accent2); } .tk-hb-streak--big[data-on="true"] { color:var(--tk-c-text); } .tk-hb-streak--big { font-size:var(--tk-fs-3xl); gap:6px; letter-spacing:var(--tk-ls-tight); }
.tk-hb-dots { display:inline-flex; gap:5px; align-items:center; }
.tk-hb-dot { width:10px; height:10px; border-radius:50%; border:1.5px solid var(--tk-c-border-strong); background:transparent; flex:none; position:relative; }
.tk-hb-dot[data-s="done"] { background:var(--tk-c-success); border-color:var(--tk-c-success); }
.tk-hb-dot[data-s="partial"] { background:linear-gradient(90deg, var(--tk-c-success) 50%, transparent 50%); border-color:var(--tk-c-success); }
.tk-hb-dot[data-s="joker"] { border-color:var(--tk-c-accent2); border-style:dashed; }
.tk-hb-dot[data-s="pause"] { border-style:dotted; opacity:.6; } .tk-hb-dot[data-s="rest"], .tk-hb-dot[data-s="none"] { width:6px; height:6px; opacity:.45; border-width:1px; }
.tk-hb-dot[data-s="future"] { opacity:.4; } .tk-hb-dot[data-s="missed"]::after { content:''; position:absolute; inset:2px; border-radius:50%; background:var(--tk-c-text-subtle); opacity:.55; }
.tk-hb-dot[data-today="true"] { outline:2px solid var(--tk-c-accent); outline-offset:1px; }
`;
