// Ernährung: Erfassen-Leiste – feste Schnellaktionen (Erfassen, Scannen, Wasser +250 ml) für Screens, die ohne Umweg erfassen sollen.
import { html } from '../../../lib/html.js';
import { Button } from '../../ui.js';
import { hhmm, eid, viewDay } from './_calc.js';
import { NU_CSS, arr, obj } from './_ui.js';

export const logBar = {
  id: 'log-bar',
  name: 'Erfassen-Leiste',
  category: 'Ernährung',
  description: 'Schwebende Leiste mit den drei häufigsten Aktionen: Mahlzeit erfassen, Barcode scannen und 250 ml Wasser mit einem Tap. Gedacht für die Region „unten fixiert“.',
  version: '1.1',
  props: [
    { name: 'quietEmpty', label: 'Im Erststart (noch nichts erfasst) nichts anzeigen', type: 'boolean', default: false },
    { name: 'primaryLabel', label: 'Haupt-Button', type: 'text', default: 'Mahlzeit erfassen' },
    { name: 'showScan', label: 'Scan-Button', type: 'boolean', default: true },
    { name: 'showWater', label: 'Wasser-Button', type: 'boolean', default: true },
    { name: 'waterMl', label: 'Wasser pro Tap (ml)', type: 'number', default: 250 },
  ],
  data: [{ slot: 'water', label: 'Wasser', default: 'water', shape: '{entries:[]}', required: false }, { slot: 'diary', label: 'Tagebuch (nur für „Im Erststart nichts anzeigen“)', default: 'diary', shape: 'Einträge', required: false }],
  events: ['meal.add', 'scan.open', 'water.add'],
  states: ['empty'],
  css: `${NU_CSS}
  .tk-lb { display:flex; gap:8px; padding:10px; border-radius:var(--tk-radius-xl); background:var(--tk-c-surface); border:1px solid var(--tk-c-border-strong); box-shadow:var(--tk-shadow-md); }
  .tk-lb .tk-btn--primary { flex:1 1 auto; justify-content:center; min-width:0; }`,
  example: { data: { water: { entries: [] } } },
  render: function LogBar({ props, data, setData, ctx }) {
    if (props.quietEmpty && !arr(data?.diary).length && !arr(obj(data?.water).entries).length) return null;
    const water = () => { setData('water', (w) => ({ ...obj(w), entries: [...arr(obj(w).entries), { id: eid('w', ctx), date: viewDay(ctx), time: hhmm(ctx.today), ml: props.waterMl, vessel: 'Glas' }] })); ctx.emit('water.add', { ml: props.waterMl }); ctx.toast(`+${props.waterMl} ml Wasser`); };
    return html`<div class="tk-lb" role="toolbar" aria-label="Schnell erfassen">
      <${Button} variant="primary" icon="plus" onClick=${() => ctx.emit('meal.add', { ui: { foodTab: 'Zuletzt' } })}>${props.primaryLabel}<//>
      ${props.showScan && html`<${Button} icon="scan-barcode" aria-label="Barcode scannen" onClick=${() => ctx.emit('scan.open', { ui: { logMode: 'scan' } })} />`}
      ${props.showWater && html`<${Button} icon="droplets" aria-label=${`${props.waterMl} Milliliter Wasser hinzufügen`} onClick=${water}>+${props.waterMl}<//>`}</div>`;
  },
};
export default [logBar];
