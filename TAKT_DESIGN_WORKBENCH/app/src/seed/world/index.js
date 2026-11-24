// ============================================================================
// GEMEINSAME DATENWELT – eine Quelle für alle Module (Persona „Ein Tag“).
// * Jeder benannte Export der Teil-Dateien ist ein Welt-Schlüssel.
// * In demoData binden mit '@world:<schlüssel>' – die Vorschau löst das auf; im Demo-Launcher
//   teilen sich alle Screens denselben Weltzustand (Aufgabe abhaken wirkt überall).
// * Teil-Dateien gehören den Modul-Workern (organisation, finance, fitness, nutrition, weather).
// ============================================================================
import * as persona from './persona.js';
import * as organisation from './organisation.js';
import * as finance from './finance.js';
import * as fitness from './fitness.js';
import * as nutrition from './nutrition.js';
import * as weather from './weather.js';

const pick = (mod) => Object.fromEntries(Object.entries(mod).filter(([, v]) => typeof v !== 'function'));
export const WORLD = { ...pick(persona), ...pick(organisation), ...pick(finance), ...pick(fitness), ...pick(nutrition), ...pick(weather) };
export const WORLD_REF = '@world:';
export const isWorldRef = (v) => typeof v === 'string' && v.startsWith(WORLD_REF);
export const worldKey = (v) => v.slice(WORLD_REF.length);
