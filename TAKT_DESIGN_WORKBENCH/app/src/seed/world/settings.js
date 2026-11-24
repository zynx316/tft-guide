// Gemeinsame Datenwelt: Einstellungen (Eigentümer: settings) – `prefs` und Sicherungen.
// `prefs` hat Format und Standardwerte von `library/components/crosscut/_system.js › DEFAULT_PREFS` (Werte identisch, ein Test prüft das):
// Die Runtime wertet Werte, die dem Standard entsprechen, nicht als Änderung. Szenarien ändern `prefs` nie.
import { at } from './_util.js';

export const prefs = {
  favorites: ['home', 'calendar', 'tasks', 'finance'], enabled: {}, theme: 'graphite', density: 'komfortabel', textScale: 1, reduceMotion: false,
  privacy: { hideAmounts: false, lock: true, method: 'pin', autoLock: 'Nach 1 Minute', hidePreview: true, blockScreenshots: false, sensitive: ['finance', 'savings', 'trading'] },
  quietHours: { on: true, from: '22:00', to: '07:00', allowImportant: true },
  notify: { on: true, digest: true, digestTime: '07:30', groupBy: 'time', rules: { tasks: true, calendar: '15 Min.', finance: true, savings: true, trading: true, fitness: true, nutrition: false, weather: 'ab Stufe 2', sales: true, habits: true, goals: true, shopping: true, documents: true } },
  region: { weekStart: 'Montag', temp: '°C', distance: 'km', weight: 'kg', state: 'Nordrhein-Westfalen' },
};

/** Sicherungen (automatisch jede Nacht 03:00, dazu eine manuelle). Im Ersten Start gibt es noch keine. */
export const backups = [
  { id: 'b1', at: at(0, '03:00'), size: 6.9, kind: 'auto' },
  { id: 'b2', at: at(-1, '03:00'), size: 6.8, kind: 'auto' },
  { id: 'b3', at: at(-2, '03:00'), size: 6.8, kind: 'auto' },
  { id: 'b4', at: at(-3, '03:00'), size: 6.7, kind: 'auto' },
  { id: 'b5', at: at(-4, '21:15'), size: 6.7, kind: 'manual' },
];

const MODULE_COUNT = 19; // = WORLD_MODULES.length (world/index.js); tests/world-invariants.test.mjs prüft den Gleichstand
const day = (iso) => (iso.slice(0, 10) === at(0).slice(0, 10) ? 'heute' : `am ${iso.slice(8, 10)}.${iso.slice(5, 7)}.`);
const summaryOf = (list) => ({ kpis: [
  { label: 'Module aktiv', value: `${prefs.enabled && Object.values(prefs.enabled).includes(false) ? MODULE_COUNT - Object.values(prefs.enabled).filter((v) => v === false).length : MODULE_COUNT} von ${MODULE_COUNT}`, icon: 'layout-grid', tone: 'accent', to: 'settings.modules' },
  { label: 'letzte Sicherung', value: list[0] ? `${day(list[0].at)} ${list[0].at.slice(11, 16)}` : 'noch keine', icon: 'cloud-upload', tone: list[0] ? 'success' : 'info', to: 'settings.data' },
  { label: 'Ruhezeit', value: prefs.quietHours.on ? `${prefs.quietHours.from}–${prefs.quietHours.to}` : 'aus', icon: 'moon', tone: 'neutral', to: 'settings.notifications' },
] });
export const settingsSummary = summaryOf(backups);
export const settingsHints = [{ id: 'h-set-etsy', text: 'Etsy neu verbinden: Die Anmeldung ist abgelaufen, Bestellungen werden nicht abgeglichen.', source: 'channels[etsy]', module: 'settings', tone: 'warning', to: 'settings.accounts' }];
export const settingsSearch = [];
export const settingsNotifications = backups.slice(0, 1).map((b) => ({ id: 'n-backup', title: 'Sicherung erstellt', text: `${day(b.at) === 'heute' ? 'Heute' : 'Am ' + b.at.slice(8, 10) + '.' + b.at.slice(5, 7) + '.'} ${b.at.slice(11, 16)} Uhr, ${String(b.size).replace('.', ',')} MB. Die automatische Sicherung läuft jede Nacht.`, module: 'settings', tone: 'neutral', priority: 'leise', time: b.at, to: 'settings.data' }));
export const scenarios = { erststart: { settingsSummary: summaryOf([]), settingsHints: [], settingsNotifications: [] } };
