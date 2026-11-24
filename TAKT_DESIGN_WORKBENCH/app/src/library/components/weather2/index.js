// Komponentenbereich "weather2" – Wetter-Ausbau (siehe library/CONTRACT.md). Kategorie in der Library: „Wetter“.
// Gemeinsame Helfer: _weather2.js (Einheiten, Zeit, Diagramm), _advice.js (Kleidung, Aktivität, Wege, Briefing), _radar.js (Radar-Simulation).
import now from './now.js';
import nowcast from './nowcast.js';
import alerts from './alerts.js';
import alertTimeline from './alert-timeline.js';
import hourly from './hourly.js';
import strip from './strip.js';
import days from './days.js';
import curve from './curve.js';
import timeline from './timeline.js';
import clothing from './clothing.js';
import activity from './activity.js';
import pollen from './env-pollen.js';
import uvAir from './env-uv-air.js';
import sun from './sun.js';
import radar from './radar.js';
import radarTable from './radar-table.js';
import places from './places.js';
import settings from './settings.js';

export default [...now, ...nowcast, ...radar, ...radarTable, ...alerts, ...alertTimeline, ...hourly, ...strip, ...days, ...curve, ...timeline, ...clothing, ...activity, ...pollen, ...uvAir, ...sun, ...places, ...settings];
