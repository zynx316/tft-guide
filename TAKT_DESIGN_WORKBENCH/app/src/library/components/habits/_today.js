// Gemeinsame Helfer der Start-Komponenten: aus Welt- und Modul-Daten Tageskennzahlen, Kacheln und Briefing-Zeilen ableiten.
// Alles relativ zu ctx.today; Beträge über money()/percent() (Privatsphäre-Modus).
import { money, percent } from '../../helpers.js';
import { isoDay, addDays } from '../../../lib/util.js';
import { occurrences, dayStart, minutesOf, timeStr, durLabel } from '../calendar/_cal.js';
import { dueInfo, sortTasks, prio } from '../tasks/_tasks.js';
import { list, todayKey, progressOf, isDue, isDone, countOn, target, weekCount, perWeek, dayLabel, hourOf } from './_habits.js';

const WX = { sun: ['Sonnig', 'sun'], clear: ['Klar', 'sun'], fair: ['Leicht bewölkt', 'cloud-sun'], partly: ['Wechselhaft bewölkt', 'cloud-sun'], cloudy: ['Bedeckt', 'cloud'], fog: ['Nebel', 'cloud-fog'], drizzle: ['Nieselregen', 'cloud-drizzle'], rain: ['Regen', 'cloud-rain'], snow: ['Schneefall', 'cloud-snow'], sleet: ['Schneeregen', 'cloud-snow'], storm: ['Gewitter', 'cloud-lightning'] };
/** Wetter: gemeinsame Wetterwelt (Ort mit current/alerts) oder flache Kurzdaten {temp,cond,icon,warn,tip}. */
export function weatherOf(w) {
  if (!w || !w.current) return w || {};
  const c = w.current, a = (w.alerts || [])[0], [cond, icon] = WX[c.code] || ['Wechselhaft', 'cloud-sun'];
  const hh = a?.from ? String(a.from).slice(11, 13).replace(/^0/, '') : '';
  return { location: w.name, temp: c.temp, feels: c.feels, cond, icon, high: c.high, low: c.low, warn: a ? `${a.short}${hh ? ` ab ${hh} Uhr` : ''}` : '', tip: a ? (a.tips || [])[2] || (a.tips || [])[0] || '' : '' };
}
/** Training: Fitness-Welt (fitnessToday) oder flache Kurzdaten {next,nextName}. */
const trainOf = (t) => (t && t.nextWhen ? { next: t.nextWhen, nextName: t.nextName, weekDone: t.weekSessions, weekGoal: t.weekGoal, headline: t.headline } : t || {});
/** Ernährung: Ernährungs-Welt (nutSummary) oder flache Kurzdaten {kcal,kcalGoal,protein,proteinGoal}. */
const nutOf = (n) => (n && n.eatenKcal != null ? { kcal: n.eatenKcal, kcalGoal: n.goalKcal, protein: Math.round(n.protein), proteinGoal: n.proteinGoal, waterMl: n.waterMl, waterGoal: n.waterGoal } : n || {});
const lit = (ml) => `${nf(ml / 1000, 1)}`;
const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});
export const nf = (n, d = 0) => new Intl.NumberFormat('de-DE', { maximumFractionDigits: d, minimumFractionDigits: d }).format(n);

const hasTime = (t) => (t.due && t.due.length > 10 ? 1 : 0);
const byUrgency = (a, b) => (prio(a).rank - prio(b).rank) || (hasTime(b) - hasTime(a)) || String(a.due || '9').localeCompare(String(b.due || '9'));

/** Tagesauswertung aus Terminen, Aufgaben und Gewohnheiten. */
export function dayData(d, ctx) {
  const today = dayStart(ctx.today), now = minutesOf(ctx.today);
  const occ = occurrences(Array.isArray(d.events) ? d.events : [], today, addDays(today, 1));
  const timed = occ.filter((o) => !o.allDay).sort((a, b) => a._s - b._s), allDay = occ.filter((o) => o.allDay);
  const rest = timed.filter((o) => minutesOf(o._e) > now), next = rest.find((o) => minutesOf(o._s) > now) || rest[0] || null;
  const tasks = Array.isArray(d.tasks) ? d.tasks : [];
  const info = (t) => dueInfo(t, ctx.today);
  const overdue = tasks.filter((t) => !t.done && info(t).overdue).sort(sortTasks);
  const dueToday = tasks.filter((t) => info(t).diff === 0).sort(sortTasks);
  const scope = [...dueToday, ...overdue];
  const habits = list(d.habits), key = todayKey(ctx);
  return { timed, allDay, rest, next, tasks, overdue, dueToday, scope, scopeDone: scope.filter((t) => t.done).length, scopeOpen: scope.filter((t) => !t.done).sort(byUrgency), habits, hab: progressOf(habits, key), key, now };
}
export const nextHabit = (dd, ctx) => { const hr = hourOf(ctx), cur = hr < 11 ? 'morgens' : hr < 17 ? 'tagsüber' : 'abends'; const open = dd.hab.items.filter((h) => !isDone(h, dd.key)); return open.find((h) => h.daypart === cur) || open[0] || null; };
export const linked = (habits, mod) => habits.find((h) => h.link?.module === mod);

/** Nächste Sparplan-Ausführung: früheste Fälligkeit aller aktiven Pläne (Tag im Monat). */
export function nextSavings(plans, now) {
  const act = (Array.isArray(plans) ? plans : []).filter((p) => p.active !== false && p.day);
  if (!act.length) return null;
  const at = (p) => { const x = new Date(now.getFullYear(), now.getMonth(), p.day); if (x < dayStart(now)) x.setMonth(x.getMonth() + 1); return x; };
  const first = Math.min(...act.map((p) => +at(p)));
  const hit = act.filter((p) => +at(p) === first);
  return { date: new Date(first), total: hit.reduce((s, p) => s + (p.monthly || 0), 0), names: hit.map((p) => p.name), count: hit.length };
}

export const TILE_KEYS = ['calendar', 'tasks', 'habits', 'weather', 'finance', 'savings', 'training', 'nutrition'];
export const TILE_META = {
  calendar: { label: 'Termine', icon: 'calendar', tone: 'accent' }, tasks: { label: 'Aufgaben', icon: 'list-checks', tone: 'warning' }, habits: { label: 'Gewohnheiten', icon: 'repeat', tone: 'success' },
  weather: { label: 'Wetter', icon: 'cloud-sun', tone: 'info' }, finance: { label: 'Finanzen', icon: 'wallet', tone: 'accent2' }, savings: { label: 'Sparplan', icon: 'piggy-bank', tone: 3 },
  training: { label: 'Training', icon: 'dumbbell', tone: 6 }, nutrition: { label: 'Ernährung', icon: 'apple', tone: 4 },
};

/** Kacheln mit Wert, Zusatzzeile und Fortschritt (0–1 oder null). */
export function buildTiles(d, ctx, dd = dayData(d, ctx)) {
  const w = weatherOf(d.weather), tr = trainOf(d.training), nu = nutOf(d.nutrition), fin = obj(d.finance), sv = nextSavings(d.plans, ctx.today);
  const tk = linked(dd.habits, 'fitness'), wa = linked(dd.habits, 'nutrition'), nh = nextHabit(dd, ctx);
  const hasFin = fin.expenses != null, over = dd.overdue.length;
  const t = {
    calendar: { value: dd.rest.length ? `${dd.rest.length} offen` : dd.timed.length ? 'Alles durch' : 'Frei', sub: dd.next ? `${timeStr(dd.next._s)} ${dd.next.title}` : dd.allDay[0] ? dd.allDay[0].title : 'Keine Termine heute', progress: dd.timed.length ? (dd.timed.length - dd.rest.length) / dd.timed.length : null, meta: `${dd.timed.length} heute` },
    tasks: { value: `${dd.scopeOpen.length} fällig`, sub: over ? `${over} überfällig · ${dd.scopeOpen[0]?.title || ''}` : dd.scopeOpen[0]?.title || 'Nichts offen', progress: dd.scope.length ? dd.scopeDone / dd.scope.length : null, meta: `${dd.scopeDone}/${dd.scope.length} erledigt` },
    habits: { value: `${dd.hab.done} von ${dd.hab.due}`, sub: nh ? `Als Nächstes: ${nh.name}` : dd.hab.due ? 'Alles erledigt' : 'Heute nichts fällig', progress: dd.hab.due ? dd.hab.done / dd.hab.due : null, meta: 'heute' },
    weather: { value: w.temp != null ? `${nf(w.temp)} °C` : '–', sub: [w.cond, w.warn].filter(Boolean).join(' · ') || 'Keine Daten', progress: null, meta: w.location || '', icon: w.icon, alert: !!w.warn },
    finance: { value: hasFin ? money(ctx, fin.expenses, { digits: 0 }) : '–', sub: hasFin ? `Ausgaben Nov. · Sparquote ${percent(ctx, fin.savingsRate, { sign: false, digits: 0 })}` : 'Keine Daten', progress: null, meta: hasFin ? `Depot ${money(ctx, fin.depotValue, { digits: 0 })}` : '' },
    savings: { value: sv ? money(ctx, sv.total, { digits: 0 }) : '–', sub: sv ? `${Math.round((sv.date - dayStart(ctx.today)) / 864e5) === 0 ? 'Heute' : dayLabel(isoDay(sv.date))} · ${sv.count} ${sv.count === 1 ? 'Plan' : 'Pläne'}` : 'Kein aktiver Plan', progress: null, meta: 'nächste Ausführung' },
    training: { value: tr.weekGoal ? `${tr.weekDone} von ${tr.weekGoal}` : tk ? `${weekCount(tk, dd.key)} von ${perWeek(tk)}` : tr.next || '–', sub: tr.next ? `${tr.headline ? `${tr.headline} · ` : ''}${tr.next}: ${tr.nextName}` : 'Kein Training geplant', progress: tr.weekGoal ? Math.min(1, tr.weekDone / tr.weekGoal) : tk ? Math.min(1, weekCount(tk, dd.key) / perWeek(tk)) : null, meta: 'diese Woche' },
    nutrition: { value: nu.kcal != null ? `${nf(nu.kcal)} kcal` : '–', sub: nu.kcal != null ? `von ${nf(nu.kcalGoal)} · Protein ${nf(nu.protein)}/${nf(nu.proteinGoal)} g${nu.waterMl != null ? ` · Wasser ${lit(nu.waterMl)}/${lit(nu.waterGoal)} l` : wa ? ` · Wasser ${countOn(wa, dd.key)}/${target(wa)}` : ''}` : 'Keine Daten', progress: nu.kcalGoal ? Math.min(1, nu.kcal / nu.kcalGoal) : null, meta: 'heute' },
  };
  return TILE_KEYS.map((k) => ({ key: k, ...TILE_META[k], ...t[k] }));
}

/** Briefing: eine Zeile je Quelle (Wetter, Kalender, Aufgaben, Gewohnheiten, Finanzen, Fitness/Ernährung). */
export function buildBrief(d, ctx, dd = dayData(d, ctx)) {
  const w = weatherOf(d.weather), tr = trainOf(d.training), nu = nutOf(d.nutrition), fin = obj(d.finance), sv = nextSavings(d.plans, ctx.today), nh = nextHabit(dd, ctx), tk = linked(dd.habits, 'fitness');
  const first = dd.next;
  const lines = [];
  if (w.temp != null) lines.push({ key: 'weather', icon: w.icon || 'cloud-sun', tone: w.warn ? 'warning' : 'info', title: `${nf(w.temp)} °C, ${String(w.cond || '').toLowerCase()}`, text: [w.warn, w.tip].filter(Boolean).join('. ') + '.', source: 'Wetter' });
  if (dd.timed.length || dd.allDay.length) lines.push({ key: 'calendar', icon: 'calendar', tone: 'accent', title: `${dd.timed.length} Termine heute`, text: first ? `${minutesOf(first._s) > dd.now ? `In ${durLabel(minutesOf(first._s) - dd.now)}` : 'Jetzt'}: ${first.title} (${timeStr(first._s)}).${dd.rest.length > 1 ? ` Danach noch ${dd.rest.length - 1}.` : ''}` : 'Alle Termine sind durch.', source: 'Kalender' });
  const top = dd.scopeOpen[0];
  lines.push({ key: 'tasks', icon: 'list-checks', tone: dd.overdue.length ? 'danger' : 'warning', title: dd.scopeOpen.length ? `${dd.scopeOpen.length} Aufgaben fällig` : 'Keine Aufgaben fällig', text: dd.scopeOpen.length ? `${dd.overdue.length ? `${dd.overdue.length} überfällig. ` : ''}Wichtigste: ${top.title}${top.due && top.due.length > 10 ? ` (${top.due.slice(11, 16)} Uhr)` : ''}.` : 'Der Tag gehört dir.', source: 'Aufgaben' });
  lines.push({ key: 'habits', icon: 'repeat', tone: 'success', title: `${dd.hab.done} von ${dd.hab.due} Gewohnheiten`, text: nh ? `Als Nächstes: ${nh.name}${nh.goal ? ` (${nh.goal.target} ${nh.goal.unit})` : ''}. Ohne Druck – ein Schritt reicht.` : 'Heute ist alles erledigt.', source: 'Gewohnheiten' });
  if (fin.expenses != null) lines.push({ key: 'finance', icon: 'wallet', tone: 'accent2', title: 'Geld im Rahmen', text: `Ausgaben im November ${money(ctx, fin.expenses, { digits: 0 })}, Sparquote ${percent(ctx, fin.savingsRate, { sign: false, digits: 0 })}.${sv ? ` Sparpläne laufen am ${dayLabel(isoDay(sv.date))} (${money(ctx, sv.total, { digits: 0 })}).` : ''}`, source: 'Finanzen' });
  if (tr.next || nu.kcal != null) lines.push({ key: 'training', icon: 'dumbbell', tone: 'info', title: tr.weekGoal ? `Training ${tr.weekDone} von ${tr.weekGoal}` : tk ? `Training ${weekCount(tk, dd.key)} von ${perWeek(tk)}` : 'Training & Ernährung', text: `${tr.headline ? `Heute: ${tr.headline.toLowerCase()}. ` : ''}${tr.next ? `Nächstes Training: ${tr.next}, ${tr.nextName}. ` : ''}${nu.kcal != null ? `Ernährung: ${nf(nu.kcal)} von ${nf(nu.kcalGoal)} kcal, Protein ${nf(nu.protein)} g.` : ''}`, source: 'Fitness · Ernährung' });
  return lines;
}
export { isDue };
