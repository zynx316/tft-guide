// Wetter-Helfer: Zustandscodes -> Icon/Ton/Text, Formatierung. Kein eigenes Komponenten-Objekt.
import { fmt } from '../../../lib/util.js';

export const WX = {
  sun: { icon: 'sun', tone: 'warning', label: 'Sonnig' },
  clear: { icon: 'moon', tone: 'info', label: 'Klar' },
  partly: { icon: 'cloud-sun', tone: 'warning', label: 'Teils bewölkt' },
  cloudy: { icon: 'cloud', tone: 'neutral', label: 'Bewölkt' },
  fog: { icon: 'cloud-fog', tone: 'neutral', label: 'Nebel' },
  drizzle: { icon: 'cloud-drizzle', tone: 'info', label: 'Nieselregen' },
  rain: { icon: 'cloud-rain', tone: 'info', label: 'Regen' },
  storm: { icon: 'cloud-lightning', tone: 'danger', label: 'Gewitter' },
  snow: { icon: 'cloud-snow', tone: 'info', label: 'Schnee' },
};
export const wx = (code) => WX[code] || WX.cloudy;

/** 6 -> "6°", -2 -> "−2°" */
export const deg = (t) => (t == null ? '–' : `${t < 0 ? '−' : ''}${fmt.number(Math.abs(Math.round(t)))}°`);
export const mm = (v) => `${fmt.number(v, v < 10 && v % 1 ? 1 : 0)} mm`;
export const dayKey = (d) => { const x = new Date(d); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`; };
export const dayLabel = (iso, today, long = false) => {
  const k = dayKey(iso); const t = dayKey(today);
  const diff = Math.round((new Date(`${k}T12:00:00`) - new Date(`${t}T12:00:00`)) / 864e5);
  if (diff === 0) return 'Heute';
  if (diff === 1) return long ? 'Morgen' : 'Morgen';
  return long ? fmt.weekdayLong(iso) : fmt.weekday(iso).replace('.', '');
};
