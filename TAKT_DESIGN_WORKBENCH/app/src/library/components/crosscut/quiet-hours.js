// Ruhezeiten: 24-Stunden-Band, Von/Bis, Wichtiges durchlassen.
import { html } from '../../../lib/html.js';
import { Icon, Switch, Select, Card } from '../../ui.js';
import { getPrefs } from './_system.js';
import { XC_CSS } from './_xc-css.js';

const TIMES = Array.from({ length: 48 }, (_, i) => `${String(Math.floor(i / 2)).padStart(2, '0')}:${i % 2 ? '30' : '00'}`);
const mins = (t) => { const [h, m] = String(t).split(':').map(Number); return (h || 0) * 60 + (m || 0); };
const CSS = `
  .tk-xc-qh { display: flex; flex-direction: column; gap: var(--tk-space-4); padding: var(--tk-space-4); min-width: 0; }
  .tk-xc-qh__band { position: relative; height: 40px; border-radius: var(--tk-radius-md); background: var(--tk-c-surface3); overflow: hidden; }
  .tk-xc-qh__band i { position: absolute; top: 0; bottom: 0; background: var(--tk-c-accent2); opacity: .75; }
  .tk-xc-qh__band[data-off="true"] i { opacity: .12; }
  .tk-xc-qh__ticks { display: flex; justify-content: space-between; font-size: var(--tk-fs-xs); color: var(--tk-c-text-subtle); font-variant-numeric: tabular-nums; }
  .tk-xc-qh__sel { display: grid; grid-template-columns: 1fr 1fr; gap: var(--tk-space-3); }
  .tk-xc-qh__sel label { display: flex; flex-direction: column; gap: 4px; font-size: var(--tk-fs-sm); color: var(--tk-c-text-muted); }
  .tk-xc-qh__line { display: flex; align-items: center; justify-content: space-between; gap: var(--tk-space-3); }`;

export const quietHours = {
  id: 'quiet-hours',
  name: 'Ruhezeiten',
  category: 'Querschnitt',
  description: 'Ruhezeiten für Mitteilungen: Schalter, Von/Bis mit 24-Stunden-Band und die Ausnahme „Wichtiges durchlassen“. Gilt für alle Module.',
  version: '1.0',
  props: [{ name: 'title', label: 'Titel', type: 'text', default: 'Ruhezeiten' }],
  data: [{ slot: 'prefs', label: 'Einstellungen', default: 'prefs', shape: 'Welt: prefs', required: false }],
  events: ['quiet.toggle', 'quiet.change', 'quiet.important'],
  states: ['empty'],
  flutter: { widget: 'TaktQuietHours', propMap: { title: 'title' }, events: { 'quiet.change': 'onChanged' } },
  a11y: { role: 'group', nameFrom: 'Titel' },
  css: XC_CSS + CSS,
  example: { props: {}, data: { prefs: {} } },
  render: function QuietHours({ props, data, setData, ctx }) {
    const prefs = getPrefs(data.prefs), q = prefs.quietHours;
    const save = (p, ev) => { setData('prefs', { ...prefs, quietHours: { ...q, ...p } }); ctx.emit(ev, p); };
    const a = mins(q.from), b = mins(q.to), pct = (m) => `${(m / 1440) * 100}%`;
    const dur = ((b - a + 1440) % 1440) / 60;
    const segs = a <= b ? [[a, b]] : [[a, 1440], [0, b]];
    return html`<${Card} title=${props.title} icon="moon-star"><div class="tk-xc-qh" style="padding:0" data-qa="quiet-hours">
      <div class="tk-xc-qh__line"><span class="tk-xc-main"><span class="tk-xc-t">Ruhezeiten aktiv</span><span class="tk-xc-s">${q.on ? `${q.from}–${q.to} Uhr, ${String(dur).replace('.', ',')} Std. ohne Ton` : 'Mitteilungen kommen jederzeit'}</span></span>
        <${Switch} checked=${q.on} label="Ruhezeiten aktiv" onChange=${(v) => save({ on: v }, 'quiet.toggle')} /></div>
      <div role="img" aria-label=${`Ruhezeit von ${q.from} bis ${q.to}`}><div class="tk-xc-qh__band" data-off=${q.on ? undefined : 'true'}>${segs.map(([s, e]) => html`<i style=${`left:${pct(s)};width:${(((e - s) / 1440) * 100)}%`}></i>`)}</div>
        <div class="tk-xc-qh__ticks" aria-hidden="true"><span>0</span><span>6</span><span>12</span><span>18</span><span>24</span></div></div>
      <div class="tk-xc-qh__sel"><label>Von<${Select} value=${q.from} options=${TIMES} aria-label="Ruhezeit von" disabled=${!q.on} onChange=${(v) => save({ from: v }, 'quiet.change')} /></label>
        <label>Bis<${Select} value=${q.to} options=${TIMES} aria-label="Ruhezeit bis" disabled=${!q.on} onChange=${(v) => save({ to: v }, 'quiet.change')} /></label></div>
      <div class="tk-xc-qh__line"><span class="tk-xc-main"><span class="tk-xc-t">Wichtiges durchlassen</span><span class="tk-xc-s">Unwetter, Fristen und Sync-Fehler bleiben hörbar</span></span>
        <${Switch} checked=${q.allowImportant} label="Wichtiges durchlassen" onChange=${(v) => save({ allowImportant: v }, 'quiet.important')} /></div></div><//>`;
  },
};
export default quietHours;
