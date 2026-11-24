// Simuliertes Regenradar: deterministisches Niederschlagsfeld auf einem 36×24-Raster (1 Zelle ≈ 5 km), Basiskarte der Region Bielefeld.
// Keine echten Daten – die Zellen ziehen von Südwest nach Nordost und passen grob zum Nowcast für Bielefeld.
import { html } from '../../../lib/html.js';

export const GW = 36, GH = 24, HOME = [18, 12];
const CELLS = [
  { x: 12, y: 14.7, vx: 0.2, vy: -0.09, rx: 4.2, ry: 2.8, peak: 1.7 },   // der Schauer, der gegen 09:42 Bielefeld erreicht
  { x: 26, y: 3, vx: 0.2, vy: -0.09, rx: 5.2, ry: 3.2, peak: 2.9 },      // älterer Schauer nördlich der Stadt (Beobachtung)
  { x: 20, y: 21.5, vx: 0.12, vy: -0.02, rx: 6.5, ry: 2.4, peak: 0.45 }, // Nieselregen im Süden
  { x: -17, y: 22, vx: 0.22, vy: -0.1, rx: 7.5, ry: 5, peak: 3.4 },      // Regenfront, die am Nachmittag Sturm bringt (noch fern)
];
const hash = (a, b) => { let n = (a * 374761393 + b * 668265263) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967295; };
const sm = (t) => t * t * (3 - 2 * t);
function noise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = sm(x - xi), yf = sm(y - yi);
  const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
  return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf;
}
/** Niederschlag in mm/h an Rasterpunkt (x,y), t Minuten relativ zu „jetzt“. shift verschiebt das Muster für andere Orte. */
export function rainAt(x, y, t, shift = 0) {
  let v = 0;
  for (const c of CELLS) {
    const cx = c.x + c.vx * t + shift, cy = c.y + c.vy * t, dx = x - cx, dy = y - cy, d2 = (dx * dx) / (c.rx * c.rx) + (dy * dy) / (c.ry * c.ry);
    if (d2 > 4) continue;
    v += c.peak * Math.exp(-d2 * 1.6) * (0.4 + 0.95 * noise((x - c.vx * t) * 0.6 + 3, (y - c.vy * t) * 0.6 + 7));
  }
  return v;
}
export const LEVEL_OF = (mm) => (mm < 0.1 ? 0 : mm < 0.5 ? 1 : mm < 2.5 ? 2 : mm < 7.6 ? 3 : mm < 20 ? 4 : 5);

/** Pfade je Stufe (1–5) für den Zeitpunkt t; zusammenhängende Zeilen werden zu einem Rechteck zusammengefasst. */
export function frame(t, shift = 0) {
  const paths = ['', '', '', '', '', ''];
  for (let y = 0; y < GH; y++) {
    let run = 0, lvl = 0;
    for (let x = 0; x <= GW; x++) {
      const l = x < GW ? LEVEL_OF(rainAt(x + 0.5, y + 0.5, t, shift)) : 0;
      if (l !== lvl) { if (lvl) paths[lvl] += `M${x - run},${y}h${run}v1h${-run}z`; run = 0; lvl = l; }
      if (l) run++;
    }
  }
  return paths;
}
export const LEVEL_FILL = ['', 'color-mix(in srgb, var(--tk-c-info) 45%, transparent)', 'color-mix(in srgb, var(--tk-c-info) 85%, transparent)', 'var(--tk-c-accent)', 'var(--tk-c-warning)', 'var(--tk-c-danger)'];
export const LEVEL_NAME = ['', 'Nieselregen', 'Leichter Regen', 'Mäßiger Regen', 'Starker Regen', 'Starkregen'];

const CITIES = [['Münster', 5.8, 12.6], ['Osnabrück', 11.4, 6.2], ['Gütersloh', 15.8, 14.6], ['Herford', 20.4, 9.6], ['Minden', 23.6, 5.6], ['Detmold', 23.2, 14.2], ['Paderborn', 21, 19]];
/** Basiskarte (SVG-Elemente im Rasterkoordinatensystem). named = Städtenamen für Bielefeld-Karte. */
export function BaseMap({ named = true, home = 'Bielefeld' }) {
  return html`<rect width=${GW} height=${GH} fill="var(--tk-c-surface2)" />
    <path d="M9,5 C13,7 16,10 18,12 C20,14 22,17 25,22" fill="none" stroke="var(--tk-c-surface3)" stroke-width="1.5" stroke-linecap="round" />
    <path d="M25.5,0 C24.5,3 23.6,6 24.6,10 C25.6,14 27,20 30.5,24" fill="none" stroke="var(--tk-c-info)" stroke-width=".22" opacity=".55" />
    <path d="M0,22.5 C4,17 8,13 12,13" fill="none" stroke="var(--tk-c-info)" stroke-width=".22" opacity=".55" />
    <path d="M0,9.2 L36,8.2" fill="none" stroke="var(--tk-c-border-strong)" stroke-width=".16" stroke-dasharray=".5 .4" /><path d="M16.4,13.6 L21,24" fill="none" stroke="var(--tk-c-border-strong)" stroke-width=".16" stroke-dasharray=".5 .4" />
    ${named && CITIES.map(([n, x, y]) => html`<circle cx=${x} cy=${y} r=".28" fill="var(--tk-c-text-subtle)" /><text x=${x + 0.5} y=${y + 0.38} font-size="1" fill="var(--tk-c-text-muted)">${n}</text>`)}`;
}
export const HomeMarker = ({ name }) => html`<circle cx=${HOME[0]} cy=${HOME[1]} r="1.25" fill="var(--tk-c-text)" opacity=".16" /><circle cx=${HOME[0]} cy=${HOME[1]} r=".55" fill="var(--tk-c-text)" stroke="var(--tk-c-surface)" stroke-width=".22" />
  <text x=${HOME[0] + 0.95} y=${HOME[1] - 0.7} font-size="1.15" font-weight="700" fill="var(--tk-c-text)" stroke="var(--tk-c-surface2)" stroke-width=".28" paint-order="stroke">${name}</text>`;
