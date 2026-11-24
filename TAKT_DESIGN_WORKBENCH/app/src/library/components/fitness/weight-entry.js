// Fitness: Gewicht erfassen – Stepper in 0,1-kg-Schritten, ein Tap speichern, Rückfrage bei auffälligem Sprung.
import { html } from '../../../lib/html.js';
import { Card, Button, Badge, Icon } from '../../ui.js';
import { isoDay } from '../../../lib/util.js';
import { dayShort, fmtKg, r1 } from './_calc.js';
import { Stepper, FIT_CSS, hideVal } from './_ui.js';
import { useState } from 'preact/hooks';

export const weightEntry = {
  id: 'weight-entry',
  name: 'Gewicht erfassen',
  category: 'Fitness',
  description: 'Gewicht in 0,1-kg-Schritten erfassen (Vorbelegung: letzter Wert), speichern mit einem Tap. Bei einem Sprung über 3 kg folgt eine freundliche Rückfrage. Ein vorhandener Wert des Tages wird ersetzt.',
  version: '1.2',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Heute wiegen' },
    { name: 'openEvent', label: 'Event für „Verlauf“ (leer = kein Knopf)', type: 'text', default: '' },
    { name: 'layout', label: 'Darstellung', type: 'select', options: ['card', 'inline'], default: 'card' },
  ],
  data: [{ slot: 'log', label: 'Gewichtsverlauf', default: 'log', shape: '{date,kg}[]', required: true }],
  events: ['body.add', 'body.confirm', 'body.open'],
  states: ['empty'],
  css: `
  .tk-we { display:flex; flex-direction:column; gap:var(--tk-space-3); } .tk-we--inline { flex-direction:row; align-items:center; flex-wrap:wrap; } .tk-we--inline > .tk-grow { min-width:160px; }
  .bp-mobile .tk-we .tk-btn--primary { min-height:48px; } .bp-mobile .tk-we--inline .tk-btn--primary { flex:1 1 140px; }`,
  example: { data: { log: [{ date: '2026-11-22', kg: 78.2 }, { date: '2026-11-23', kg: 78.7 }] } },
  render: function WeightEntry({ props, data, setData, ctx }) {
    const log = [...(data.log || [])].sort((a, b) => (a.date < b.date ? -1 : 1)); const last = log.at(-1); const today = isoDay(ctx.today);
    const [kg, setKg] = useState(null); const value = kg ?? last?.kg ?? 75; const has = last && last.date === today;
    const commit = () => { setData('log', (all) => [...(Array.isArray(all) ? all.filter((x) => x.date !== today) : []), { date: today, kg: value }].sort((a, b) => (a.date < b.date ? -1 : 1))); ctx.emit('body.add', { kg: value, date: today }); ctx.toast(`${fmtKg(value)} gespeichert`); setKg(null); };
    const save = () => {
      if (last && Math.abs(value - last.kg) > 3) return ctx.openDialog({ title: 'Stimmt der Wert?', body: () => html`<p>${fmtKg(value)} liegt ${fmtKg(r1(Math.abs(value - last.kg)))} ${value > last.kg ? 'über' : 'unter'} deinem letzten Wert (${fmtKg(last.kg)}). Magst du kurz prüfen, ob die Eingabe passt?</p>`,
        footer: (close) => html`<${Button} onClick=${close}>Korrigieren<//><${Button} variant="primary" onClick=${() => { ctx.emit('body.confirm', { kg: value }); commit(); close(); }}>Passt so<//>` });
      return commit();
    };
    const body = html`<div class=${`tk-we tk-we--${props.layout}`}><div class="tk-grow"><div class="tk-muted" style="font-size:var(--tk-fs-sm);margin-bottom:6px">${dayShort(today)}${has ? ` · schon ${hideVal(ctx, fmtKg(last.kg))} eingetragen` : ' · am besten morgens, vor dem Frühstück'}</div>
      <${Stepper} label="Gewicht" value=${value} step=${0.1} min=${30} max=${250} decimals=${1} unit="kg" size="lg" onChange=${setKg} /></div>
      <${Button} variant="primary" icon="check" onClick=${save}>${has ? 'Aktualisieren' : 'Speichern'}<//>${props.openEvent && html`<${Button} icon="trending-down" onClick=${() => ctx.emit(props.openEvent)}>Verlauf<//>`}</div>`;
    return props.layout === 'inline' ? body : html`<${Card} title=${props.title} icon="scale">${body}<//>`;
  },
};
export default [weightEntry];
