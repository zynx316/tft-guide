// Gemeinsame Helfer der Querschnitt-Bausteine (Offline, Sync, Rückgängig, Verknüpfungen …).
import { useState } from 'preact/hooks';

/** Modul-ID → Icon (für Verknüpfungen, Einladungen, Hinweise). */
export const MODULE_ICONS = {
  home: 'house', start: 'house', tasks: 'list-todo', calendar: 'calendar', notes: 'notebook-pen', knowledge: 'book-open', documents: 'folder',
  finance: 'wallet', savings: 'piggy-bank', trading: 'candlestick-chart', fitness: 'dumbbell', nutrition: 'utensils', habits: 'target',
  weather: 'cloud-sun', shopping: 'shopping-basket', settings: 'settings', insights: 'bar-chart-3',
};
/** Modul-ID → deutscher Anzeigename. */
export const MODULE_NAMES = {
  home: 'Start', start: 'Start', tasks: 'Aufgaben', calendar: 'Kalender', notes: 'Notizen', knowledge: 'Wissen', documents: 'Dokumente',
  finance: 'Finanzen', savings: 'Sparpläne', trading: 'Trading', fitness: 'Fitness', nutrition: 'Ernährung', habits: 'Gewohnheiten',
  weather: 'Wetter', shopping: 'Einkauf', settings: 'Einstellungen', insights: 'Auswertung',
};
export const moduleIcon = (m) => MODULE_ICONS[m] || 'link-2';

/** Wie useState, setzt sich aber auf den Prop-Wert zurück, sobald sich dieser ändert (Design Studio, Inspector). */
export function useSynced(value) {
  const [s, set] = useState({ base: value, v: value });
  return [s.base === value ? s.v : value, (v) => set({ base: value, v })];
}

let undoCounter = 0;
/**
 * Meldet eine rückgängig zu machende Aktion an den undo-toast im selben Screen.
 * @param {object} ctx Komponentenkontext
 * @param {{text:string, restore:Function, seconds?:number}} entry Text, Wiederherstellung, optionale Dauer
 */
export function pushUndo(ctx, { text, restore, seconds }) {
  undoCounter += 1;
  ctx.setUi('undo', { id: `undo${undoCounter}`, text, restore, seconds, at: performance.now() });
}

/** Uhrzeit „minutesAgo“ Minuten vor dem Referenzzeitpunkt (ctx.today). */
export const minutesBefore = (today, minutes) => new Date(+today - minutes * 60000);

/** Kurze, gemeinsame CSS-Bausteine: Spinner und reduzierte Bewegung. */
export const SPIN_CSS = `
  @keyframes tk-cc-spin { to { transform: rotate(360deg); } }
  .tk-cc-spin { animation: tk-cc-spin 1s linear infinite; }
  @media (prefers-reduced-motion: reduce) { .tk-cc-spin { animation: none; } }`;
