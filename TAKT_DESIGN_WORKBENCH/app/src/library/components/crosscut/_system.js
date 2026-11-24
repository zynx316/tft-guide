// Gemeinsame Helfer der Kern-Bausteine (Suche, Mitteilungen, Erfassen, Onboarding, Einstellungen, Sperre).
import { html } from '../../../lib/html.js';
import { fmtDate, fmtTime, fmtRelativeDay } from '../../../lib/format.js';
import { toDate } from '../../../lib/date.js';

/** Alle Module der App (Navigation, Suche, Onboarding, Einstellungen). `locked` = lässt sich nicht ausschalten. */
export const MODULES = [
  { id: 'home', name: 'Start', icon: 'house', area: 'Tag & Organisation', home: 'home.today', locked: true, desc: 'Dein Tag auf einen Blick' },
  { id: 'calendar', name: 'Kalender', icon: 'calendar', area: 'Tag & Organisation', home: 'calendar.home', desc: 'Termine und Wochenplanung' },
  { id: 'tasks', name: 'Aufgaben', icon: 'list-checks', area: 'Tag & Organisation', home: 'tasks.home', desc: 'Aufgaben, Projekte, Fokuszeit' },
  { id: 'habits', name: 'Gewohnheiten', icon: 'repeat', area: 'Tag & Organisation', home: 'habits.home', desc: 'Routinen und Serien' },
  { id: 'notes', name: 'Notizen', icon: 'sticky-note', area: 'Wissen & Inhalte', home: 'notes.home', desc: 'Schnell festhalten, später finden' },
  { id: 'knowledge', name: 'Wissen', icon: 'library', area: 'Wissen & Inhalte', home: 'knowledge.home', desc: 'Artikel und Wissensdatenbank' },
  { id: 'picture-to-text', name: 'Picture to Text', icon: 'scan-text', area: 'Wissen & Inhalte', home: 'picture-to-text.home', desc: 'Fotos in Text und Belege' },
  { id: 'finance', name: 'Finanzen', icon: 'wallet', area: 'Finanzen', home: 'finance.home', desc: 'Konten, Budgets, Umsätze' },
  { id: 'savings', name: 'Sparpläne', icon: 'piggy-bank', area: 'Finanzen', home: 'savings.home', desc: 'Raten planen, Ziele verfolgen' },
  { id: 'trading', name: 'Trading', icon: 'candlestick-chart', area: 'Finanzen', home: 'trading.portfolio', desc: 'Depot und Watchlist (Simulation)' },
  { id: 'fitness', name: 'Fitness', icon: 'dumbbell', area: 'Gesundheit', home: 'fitness.home', desc: 'Training, Schlaf, Fortschritt' },
  { id: 'nutrition', name: 'Ernährung', icon: 'salad', area: 'Gesundheit', home: 'nutrition.home', desc: 'Mahlzeiten, Rezepte, Wasser' },
  { id: 'weather', name: 'Wetter', icon: 'cloud-sun', area: 'Umgebung', home: 'weather.home', desc: 'Jetzt, Radar, Warnungen' },
  { id: 'sales', name: 'Sales', icon: 'store', area: 'Business', home: 'sales.overview', desc: 'Shop-Kanäle und Bestellungen' },
  { id: 'system', name: 'TAKT Kern', icon: 'sparkles', area: 'System', home: 'system.notifications', locked: true, desc: 'Suche, Mitteilungen, Erfassen' },
  { id: 'settings', name: 'Einstellungen', icon: 'settings', area: 'System', home: 'settings.home', locked: true, desc: 'Darstellung, Daten, Sicherheit' },
];
export const moduleMeta = (id) => MODULES.find((m) => m.id === id) || { id, name: id, icon: 'link-2', area: 'Weitere', home: null };
export const MODULE_AREAS = ['Tag & Organisation', 'Wissen & Inhalte', 'Finanzen', 'Gesundheit', 'Umgebung', 'Business', 'System'];

// ------------------------------------------------------------------ Einstellungen (prefs) ---
export const DEFAULT_PREFS = {
  favorites: ['home', 'calendar', 'tasks', 'finance'], enabled: {}, theme: 'graphite', density: 'komfortabel', textScale: 1, reduceMotion: false,
  privacy: { hideAmounts: false, lock: true, method: 'pin', autoLock: 'Nach 1 Minute', hidePreview: true, blockScreenshots: false, sensitive: ['finance', 'savings', 'trading'] },
  quietHours: { on: true, from: '22:00', to: '07:00', allowImportant: true },
  notify: { on: true, digest: true, digestTime: '07:30', groupBy: 'time', rules: { tasks: true, calendar: '15 Min.', finance: true, savings: true, trading: true, fitness: true, nutrition: false, weather: 'ab Stufe 2', sales: true, habits: true } },
  region: { weekStart: 'Montag', temp: '°C', distance: 'km', weight: 'kg', state: 'Nordrhein-Westfalen' },
};
const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
const merge = (base, over) => {
  if (!isObj(over)) return base;
  const out = { ...base };
  for (const [k, v] of Object.entries(over)) out[k] = isObj(v) && isObj(base[k]) ? merge(base[k], v) : v;
  return out;
};
/** Einstellungen = Standardwerte + gespeicherte Abweichungen (Welt-Schlüssel `prefs`, noch leer = Standard). */
export const getPrefs = (raw, ctx) => merge(ctx?.theme && DEFAULT_PREFS.theme !== ctx.theme ? { ...DEFAULT_PREFS, theme: ctx.theme } : DEFAULT_PREFS, raw);
export const prefAt = (p, path) => String(path).split('.').reduce((o, k) => (o == null ? undefined : o[k]), p);
export function setPrefAt(p, path, value) {
  const keys = String(path).split('.');
  const rec = (o, i) => ({ ...o, [keys[i]]: i === keys.length - 1 ? value : rec(isObj(o?.[keys[i]]) ? o[keys[i]] : {}, i + 1) });
  return rec(p, 0);
}
export const isEnabled = (prefs, id) => prefs.enabled?.[id] !== false;

// ------------------------------------------------------------------ Text, Datum ---
/** Für die Suche: klein, ohne Umlaut-Unterschied (ä→a, ß→s; Länge bleibt gleich, damit Markierungen passen). */
export const fold = (s) => String(s ?? '').toLowerCase().replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/ß/g, 's');
export const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);
export const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

/** Text mit hervorgehobenem Treffer (<mark>). */
export function Hl({ text, q }) {
  const t = String(text ?? ''), f = fold(t), needle = fold(q).trim();
  const at = needle ? f.indexOf(needle) : -1;
  if (at < 0) return html`${t}`;
  return html`${t.slice(0, at)}<mark class="tk-xc-mark">${t.slice(at, at + needle.length)}</mark>${t.slice(at + needle.length)}`;
}

/** „heute, 14:00“ / „morgen“ / „Do“ / „24.11.“ relativ zum Referenztag. */
export function whenLabel(ctx, iso, { time = true } = {}) {
  const d = toDate(iso); if (Number.isNaN(d.getTime())) return '';
  const rel = fmtRelativeDay(d, ctx.today);
  const hasTime = time && /T\d{2}:\d{2}/.test(String(iso)) && !/T00:00(:00)?$/.test(String(iso));
  return `${rel}${hasTime ? `, ${fmtTime(d)}` : ''}`;
}
export const dateLine = (iso) => { const d = toDate(iso); return Number.isNaN(d.getTime()) ? '' : fmtDate(d, { style: 'weekday' }); };
/** Minuten seit `iso` bis ctx.today als Kurztext („vor 12 Min.“, „vor 2 Std.“, „gestern“). */
export function agoLabel(ctx, iso) {
  const d = toDate(iso); const min = Math.round((+ctx.today - +d) / 60000);
  if (min < 1) return 'gerade eben';
  if (min < 60) return `vor ${min} Min.`;
  if (min < 60 * 12) return `vor ${Math.round(min / 60)} Std.`;
  return cap(fmtRelativeDay(d, ctx.today)) + (min < 60 * 48 ? `, ${fmtTime(d)}` : '');
}
export const sameIsoDay = (a, b) => String(a).slice(0, 10) === String(b).slice(0, 10);

/** Privatmodus: Geldbeträge in Fließtexten maskieren („812,40 €“ → „•••• €“). */
export const priv = (ctx, text) => (ctx?.privacy ? String(text ?? '').replace(/[−-]?\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?[\s ]?€/g, '•••• €') : text);

/** Speichernutzung je Modul in MB (Demo, für Export-Größe und Speicheranzeige). */
export const MODULE_SIZES = { home: 0.1, calendar: 0.4, tasks: 0.3, habits: 0.1, notes: 0.9, knowledge: 0.5, 'picture-to-text': 1.4, finance: 0.8, savings: 0.2, trading: 0.3, fitness: 0.6, nutrition: 0.7, weather: 0.1, sales: 0.6 };

/** Berechnete Anzeigewerte für Einstellungszeilen/-gruppen (`computed: 'theme'` …), damit Übersichten immer den aktuellen Stand zeigen. */
export const COMPUTED = {
  theme: (p) => ({ graphite: 'Graphite', horizon: 'Horizon', intensiv: 'Intensiv' }[p.theme] || p.theme),
  modules: (p) => `${MODULES.filter((m) => isEnabled(p, m.id)).length} aktiv`,
  favorites: (p) => p.favorites.filter((id) => isEnabled(p, id)).map((id) => moduleMeta(id).name).join(', '),
  quiet: (p) => (p.quietHours.on ? `${p.quietHours.from}–${p.quietHours.to}` : 'Aus'),
  lock: (p) => (p.privacy.lock ? 'An' : 'Aus'),
  notify: (p) => (p.notify.on ? 'An' : 'Aus'),
  sensitive: (p) => `${p.privacy.sensitive.length} Module`,
};
