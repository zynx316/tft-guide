// ============================================================================
// GEMEINSAME DATENWELT – eine Quelle für alle Module (Persona „Ein Tag“). Vertrag und Schlüsselkatalog: docs/DATENWELT.md.
// * Jeder benannte Export der Teil-Dateien, der keine Funktion ist, wird ein Welt-Schlüssel (`pick`). `scenarios` ist keiner.
// * In demoData binden mit '@world:<schlüssel>' – die Vorschau löst das auf; im Demo-Launcher teilen sich alle Screens
//   denselben Weltzustand (Aufgabe abhaken wirkt überall, ein Haken auf „Start“ erscheint in „Gewohnheiten“).
// * Aggregate (Vertrag je Modul `<modul>Summary/Hints/Search/Notifications`, camelCase der Modul-ID) werden hier gesammelt:
//   allKpis (je Modul-ID), allHints, searchIndex, allNotifications. Start, Suche, Mitteilungen und Launchpad lesen nur diese Aggregate.
// * Teil-Dateien gehören den Eigentümern (docs/DATENWELT.md Abschnitt 3.1). `_util.js` ist eine Hilfsdatei und kein Welt-Teil.
// ============================================================================
import * as persona from './persona.js';
import * as organisation from './organisation.js';
import * as finance from './finance.js';
import * as savings from './savings.js';
import * as trading from './trading.js';
import * as fitness from './fitness.js';
import * as nutrition from './nutrition.js';
import * as weather from './weather.js';
import * as knowledge from './knowledge.js';
import * as scans from './scans.js';
import * as sales from './sales.js';
import * as habits from './habits.js';
import * as goals from './goals.js';
import * as shopping from './shopping.js';
import * as documents from './documents.js';
import * as home from './home.js';
import * as system from './system.js';
import * as settings from './settings.js';

// `scenarios` (gezielte Werte für „Erster Start“/„Stress-Tag“) ist kein Welt-Schlüssel: je Datei sammeln, core/world.js führt zusammen.
const SCEN = [];
const pick = (mod) => { if (mod.scenarios && typeof mod.scenarios === 'object') SCEN.push(mod.scenarios); return Object.fromEntries(Object.entries(mod).filter(([k, v]) => typeof v !== 'function' && k !== 'scenarios')); };
const PARTS = [persona, organisation, finance, savings, trading, fitness, nutrition, weather, knowledge, scans, sales, habits, goals, shopping, documents, home, system, settings];
const BASE = Object.assign({}, ...PARTS.map(pick));

/** Alle Module der App (Reihenfolge wie im Launchpad); Welt-Schlüssel der Aggregate heißen `<camelCase>Summary` usw. */
export const WORLD_MODULES = ['home', 'calendar', 'tasks', 'habits', 'goals', 'shopping', 'finance', 'savings', 'trading', 'fitness', 'nutrition', 'notes', 'knowledge', 'picture-to-text', 'documents', 'weather', 'sales', 'system', 'settings'];
export const camelOf = (id) => id.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
const list = (key) => (Array.isArray(BASE[key]) ? BASE[key] : []);

export const WORLD = {
  ...BASE,
  allKpis: Object.fromEntries(WORLD_MODULES.map((m) => [m, BASE[`${camelOf(m)}Summary`]?.kpis || []])),
  allHints: WORLD_MODULES.flatMap((m) => list(`${camelOf(m)}Hints`)),
  searchIndex: WORLD_MODULES.flatMap((m) => list(`${camelOf(m)}Search`)),
  allNotifications: WORLD_MODULES.flatMap((m) => list(`${camelOf(m)}Notifications`)).sort((a, b) => String(b.time).localeCompare(String(a.time))),
};
/** Szenario-Werte aller Welt-Dateien (Liste von { erststart: {…}, stress: {…} }). */
export const WORLD_SCENARIOS = SCEN;
export const WORLD_REF = '@world:';
export const isWorldRef = (v) => typeof v === 'string' && v.startsWith(WORLD_REF);
export const worldKey = (v) => v.slice(WORLD_REF.length);
