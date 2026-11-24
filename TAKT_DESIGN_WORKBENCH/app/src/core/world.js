// ============================================================================
// DATENWELT ZUR LAUFZEIT – eine Welt aus dem Code (seed/world), nicht aus dem gespeicherten Stand.
// * getWorld(state, scenario): Welt des Szenarios + optionale Nutzer-Überschreibungen (state.worldOverrides).
// * Szenarien: alltag (Standard), erststart (leere Sammlungen → Leerzustände/Einladungen prüfen),
//   stress (dreifache Listen, lange Texte → Umbrüche, Überlauf, Leistung prüfen).
// * Welt-Dateien dürfen zusätzlich `export const scenarios = { erststart: {schlüssel: wert}, stress: {…} }`
//   liefern; diese gezielten Werte gewinnen gegenüber der generischen Umformung.
// Rein (kein DOM), auch in Node nutzbar.
// ============================================================================
import { WORLD } from '../seed/world/index.js';
import * as persona from '../seed/world/persona.js';

export const SCENARIOS = [
  { id: 'alltag', label: 'Alltag', icon: 'sun', hint: 'Ein typischer, voller Dienstag (Standard)' },
  { id: 'erststart', label: 'Erster Start', icon: 'sparkles', hint: 'Noch keine eigenen Daten – prüft Leerzustände und erste Aktionen' },
  { id: 'stress', label: 'Stress-Tag', icon: 'zap', hint: 'Dreifache Listen und lange Texte – prüft Umbrüche, Überlauf und Ruhe' },
];
export const scenarioById = (id) => SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];

/** Schlüssel, die nie geleert werden (Identität, Grundeinstellungen). */
const PROTECTED = new Set([...Object.keys(persona), 'prefs', 'scenarios']);
const LONG = ' – mit ausführlichem Zusatztext, der Umbrüche und Kürzungen auf schmalen Geräten prüft';
const TEXT_FIELDS = ['title', 'name', 'text', 'note', 'label', 'subtitle', 'description'];

const clone = (v) => (v == null ? v : JSON.parse(JSON.stringify(v)));
const isPlain = (v) => v && typeof v === 'object' && !Array.isArray(v);

function emptied(v, depth = 0) {
  if (Array.isArray(v)) return [];
  if (isPlain(v) && depth < 2) return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, emptied(x, depth + 1)]));
  return v;
}

function stressed(v, depth = 0) {
  if (Array.isArray(v)) {
    if (!v.length || !isPlain(v[0])) return v;
    const out = [];
    for (let copy = 1; copy <= 3; copy++) {
      for (const item of v) {
        const x = { ...item };
        if (copy > 1 && x.id != null) x.id = `${x.id}~${copy}`;
        if (copy > 1) for (const f of TEXT_FIELDS) if (typeof x[f] === 'string' && x[f].length > 2) { x[f] = x[f] + (f === 'title' || f === 'name' ? LONG : ''); break; }
        out.push(x);
      }
    }
    return out;
  }
  if (isPlain(v) && depth < 1) return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, stressed(x, depth + 1)]));
  return v;
}

/**
 * Welt für ein Szenario umformen. Gezielte Szenario-Werte aus den Welt-Dateien (WORLD.scenarios[id])
 * überschreiben die generische Umformung.
 */
export function applyScenario(world, id = 'alltag') {
  const base = {};
  for (const [k, v] of Object.entries(world || {})) {
    if (k === 'scenarios') continue;
    if (id === 'alltag' || PROTECTED.has(k)) base[k] = clone(v);
    else if (id === 'erststart') base[k] = emptied(clone(v));
    else if (id === 'stress') base[k] = stressed(clone(v));
    else base[k] = clone(v);
  }
  const specific = world?.scenarios?.[id];
  if (isPlain(specific)) Object.assign(base, clone(specific));
  return base;
}

/** Laufzeit-Welt: Seed-Welt im Szenario + (optional) bewusst gespeicherte Überschreibungen. */
export function getWorld(state, scenario = 'alltag') {
  return { ...applyScenario(WORLD, scenario), ...clone(state?.worldOverrides || {}) };
}

/** Existiert ein Welt-Schlüssel (für Prüfungen von '@world:'-Bindungen)? */
export const hasWorldKey = (key) => Object.prototype.hasOwnProperty.call(WORLD, key) && key !== 'scenarios';
export const worldKeys = () => Object.keys(WORLD).filter((k) => k !== 'scenarios');
