// ============================================================================
// KOMPONENTEN-REGISTRY – zentrale Liste aller TAKT-Bibliothekskomponenten.
// Neue Komponente: Datei in components/<bereich>/ anlegen, im index.js des
// Bereichs exportieren. Vertrag: siehe library/CONTRACT.md
// ============================================================================
import core from './components/core/index.js';
import calendar from './components/calendar/index.js';
import tasks from './components/tasks/index.js';
import content from './components/content/index.js';
import insights from './components/insights/index.js';
import finance from './components/finance/index.js';      // Finanzen (Ausbau)
import savings from './components/savings/index.js';      // Sparpläne
import trading from './components/trading/index.js';      // Trading (Ausbau)
import fitness from './components/fitness/index.js';      // Fitness (Ausbau)
import nutrition from './components/nutrition/index.js';  // Ernährung
import weather2 from './components/weather2/index.js';    // Wetter (Ausbau)
import habits from './components/habits/index.js';        // Gewohnheiten & Ziele
import crosscut from './components/crosscut/index.js';    // Querschnitt (Suche, Benachrichtigungen, Onboarding …)

export const COMPONENTS = [...core, ...calendar, ...tasks, ...content, ...insights, ...finance, ...savings, ...trading, ...fitness, ...nutrition, ...weather2, ...habits, ...crosscut];

export const CATEGORY_ORDER = ['Struktur', 'Navigation', 'Daten', 'Diagramme', 'Formulare', 'Feedback', 'Querschnitt',
  'Kalender', 'Aufgaben', 'Inhalte', 'Wetter', 'Vertrieb', 'Finanzen', 'Sparpläne', 'Trading', 'Fitness', 'Ernährung', 'Gewohnheiten', 'Start'];

const map = new Map();
for (const c of COMPONENTS) {
  if (map.has(c.id)) console.warn('[registry] Doppelte Komponenten-ID:', c.id);
  map.set(c.id, c);
}
export const getComponent = (id) => map.get(id);

export function componentsByCategory() {
  const groups = new Map();
  for (const c of COMPONENTS) {
    if (!groups.has(c.category)) groups.set(c.category, []);
    groups.get(c.category).push(c);
  }
  return [...groups.entries()].sort((a, b) => {
    const ia = CATEGORY_ORDER.indexOf(a[0]), ib = CATEGORY_ORDER.indexOf(b[0]);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a[0].localeCompare(b[0]);
  });
}

/** Default-Props einer Komponente (aus props-Schema). */
export function defaultProps(def) {
  const p = {};
  for (const s of def?.props || []) if (s.default !== undefined) p[s.name] = s.default;
  return p;
}

/** Validiert eine Komponenten-Definition gegen den Vertrag (für QA/Library). */
export function validateComponent(def) {
  const errs = [];
  for (const k of ['id', 'name', 'category', 'description', 'render']) if (!def[k]) errs.push(`Feld "${k}" fehlt`);
  if (def.id && !/^[a-z0-9-]+$/.test(def.id)) errs.push('id muss kebab-case sein');
  if (typeof def.render !== 'function') errs.push('render ist keine Funktion');
  for (const p of def.props || []) if (!p.name || !p.type) errs.push(`Prop ohne name/type`);
  if (!def.example) errs.push('example fehlt (Galerie)');
  return errs;
}

export function allComponentCss() {
  return COMPONENTS.map((c) => (c.css ? `/* ${c.id} */\n${c.css}` : '')).join('\n');
}
