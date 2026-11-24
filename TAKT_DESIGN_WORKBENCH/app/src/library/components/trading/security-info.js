// Trading: Kennzahlen eines Wertpapiers und „Meine Position“ mit Sparplan-Bezug.
import { html } from '../../../lib/html.js';
import { Card, Button, EmptyState, Icon } from '../../ui.js';
import { money } from '../../helpers.js';
import { fmtNumber, fmtPercent, fmtDate } from '../../../lib/format.js';
import { arr, holdings, stats, planExecutions, alertInfo } from './_calc.js';
import { slots, qtyText, Px, Chg, Gain, Stat, Tile, TRD_CSS, pickSecurity } from './_trd.js';
import { ex } from './_example.js';

export const trdFacts = {
  id: 'trd-facts',
  name: 'Kennzahlen',
  category: 'Trading',
  description: 'Kennzahlen des gewählten Wertpapiers: Tageshoch und -tief, Spanne der letzten 52 Wochen mit aktueller Lage, Wertentwicklung je Zeitraum, Volumen sowie bei ETFs Kosten (TER), Ausschüttung, Region und Sektor.',
  version: '1.0',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Kennzahlen' },
    { name: 'followSelection', label: 'Auswahl folgen', type: 'boolean', default: true },
  ],
  data: slots('instruments', 'positions'),
  events: [],
  states: ['empty'],
  css: `${TRD_CSS}
  .tk-trd-fx { display:flex; flex-direction:column; gap:var(--tk-space-5); } .tk-trd-fx__rng { position:relative; height:8px; border-radius:4px; background:var(--tk-c-surface3); margin:8px 0 4px; } .tk-trd-fx__rng i { position:absolute; top:-4px; width:4px; height:16px; border-radius:2px; background:var(--tk-c-accent); transform:translateX(-50%); }
  .tk-trd-fx__ends { display:flex; justify-content:space-between; font-size:var(--tk-fs-sm); font-variant-numeric:tabular-nums; }`,
  example: { data: ex('instruments', 'positions') },
  render: function TrdFacts({ props, data, ctx }) {
    const insts = arr(data.instruments), inst = (props.followSelection && insts.find((i) => i.id === ctx.ui.selectedId)) || insts.find((i) => arr(data.positions).some((p) => p.id === i.id)) || insts[0];
    if (!inst) return html`<${Card} title=${props.title} icon="gauge"><${EmptyState} icon="gauge" title="Keine Kennzahlen" text="Wähle ein Wertpapier, um Kennzahlen zu sehen." /><//>`;
    const s = stats(inst), pos = s.yearHigh > s.yearLow ? (inst.price - s.yearLow) / (s.yearHigh - s.yearLow) : 0.5;
    const ret = [['1 Woche', s.r1w], ['1 Monat', s.r1m], ['1 Jahr', s.r1y], ['5 Jahre', s.r5y]].filter((x) => x[1] != null);
    return html`<${Card} title=${props.title} icon="gauge"><div class="tk-trd-fx"><div class="tk-trd-stats"><${Stat} label="Tageshoch (bisher)"><${Px} v=${s.dayHigh} /><//><${Stat} label="Tagestief (bisher)"><${Px} v=${s.dayLow} /><//><${Stat} label="Volumen heute">${fmtNumber(inst.volume, { digits: 0 })} Stück<//></div>
      <div><div class="tk-trd-cap">Spanne 52 Wochen</div><div class="tk-trd-fx__rng" role="img" aria-label=${`Kurs liegt bei ${fmtPercent(pos, { digits: 0 })} der 52-Wochen-Spanne`}><i style=${`left:${Math.max(2, Math.min(98, pos * 100))}%`}></i></div><div class="tk-trd-fx__ends"><span>Tief <${Px} v=${s.yearLow} /></span><span>Hoch <${Px} v=${s.yearHigh} /></span></div></div>
      <div><div class="tk-trd-cap" style="margin-bottom:6px">Wertentwicklung</div><div class="tk-trd-stats">${ret.map(([l, v]) => html`<${Stat} label=${l}><${Chg} v=${v} /><//>`)}</div></div>
      <div class="tk-trd-stats"><${Stat} label="Region">${inst.region || '–'}<//><${Stat} label="Sektor">${inst.sector || '–'}<//>${inst.ter != null && html`<${Stat} label="Kosten (TER)">${fmtPercent(inst.ter, { digits: 2 })} p. a.<//>`}${inst.distribution && html`<${Stat} label="Ausschüttung">${inst.distribution}<//>`}</div></div><//>`;
  },
};

export const trdHolding = {
  id: 'trd-holding',
  name: 'Meine Position',
  category: 'Trading',
  description: 'Die eigene Position im gewählten Wertpapier: Stückzahl, Einstand, Wert, Gewinn/Verlust, Anteil am Depot, dazu der Sparplan-Bezug mit nächster Ausführung, aktive Alarme und offene simulierte Orders. Ohne Bestand: Hinweis und Weg zur Order.',
  version: '1.1',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Meine Position' },
    { name: 'followSelection', label: 'Auswahl folgen', type: 'boolean', default: true },
  ],
  data: slots('instruments', 'positions', 'cash', 'plans', 'alerts', 'orders'),
  events: ['plan.open', 'order.new', 'alert.new', 'portfolio.open'],
  states: ['empty'],
  css: `${TRD_CSS}
  .tk-trd-hd { display:flex; flex-direction:column; gap:var(--tk-space-4); } .tk-trd-hd__kv { display:grid; grid-template-columns:minmax(0,1fr) auto; gap:8px 12px; margin:0; font-size:var(--tk-fs-sm); } .tk-trd-hd__kv dd { margin:0; text-align:right; font-variant-numeric:tabular-nums; } .tk-trd-hd__kv dt { color:var(--tk-c-text-muted); }
  .tk-trd-hd__plan { display:flex; align-items:center; gap:12px; padding:10px 12px; border:1px solid var(--tk-c-border); border-radius:var(--tk-radius-md); background:var(--tk-c-surface2); width:100%; color:inherit; font:inherit; text-align:left; cursor:pointer; min-height:56px; } .tk-trd-hd__plan:hover { background:var(--tk-c-surface3); }`,
  example: { data: ex('instruments', 'positions', 'cash', 'plans', 'alerts', 'orders') },
  render: function TrdHolding({ props, data, ctx }) {
    const insts = arr(data.instruments), inst = (props.followSelection && insts.find((i) => i.id === ctx.ui.selectedId)) || insts.find((i) => arr(data.positions).some((p) => p.id === i.id)) || insts[0];
    if (!inst) return html`<${Card} title=${props.title} icon="wallet"><${EmptyState} icon="wallet" title="Kein Wertpapier gewählt" text="Wähle ein Wertpapier, um deine Position zu sehen." /><//>`;
    const hd = holdings(data.positions, data.cash), r = hd.rows.find((x) => x.id === inst.id);
    const plan = arr(data.plans).find((p) => p.positionId === inst.id), nextEx = plan ? planExecutions([plan], data.positions, ctx.today, 1)[0] : null;
    const al = arr(data.alerts).filter((a) => a.securityId === inst.id && a.status === 'aktiv'), open = arr(data.orders).filter((o) => o.securityId === inst.id && o.status === 'offen');
    const planBtn = plan && html`<button type="button" class="tk-trd-hd__plan" onClick=${() => ctx.emit('plan.open', { id: plan.id, to: 'savings.plan' })} aria-label=${`Sparplan ${plan.name} öffnen`}><${Tile} icon="repeat" tone="info" size=${34} />
      <span class="tk-trd-grow"><span class="tk-trd-title" style="display:block">Sparplan ${money(ctx, plan.monthly, { digits: 0 })} monatlich${plan.active ? '' : ' (pausiert)'}</span><span class="tk-trd-sub">${nextEx ? `Nächste Ausführung ${fmtDate(nextEx.date, { style: 'weekday' })}` : `Ausführung am ${plan.day}. des Monats`} · führt dein Broker aus</span></span><${Icon} name="chevron-right" size=${16} /></button>`;
    return html`<${Card} title=${props.title} icon="wallet"><div class="tk-trd-hd">${r ? html`<div><div class="tk-trd-cap">Wert</div><div class="tk-trd-big">${money(ctx, r.value)}</div><div style="margin-top:6px"><${Gain} ctx=${ctx} v=${r.gain} pct=${r.gainPct} /> <span class="tk-trd-meta">seit Kauf</span></div></div>
      <dl class="tk-trd-hd__kv"><dt>Stück</dt><dd>${qtyText(ctx, r.q)}</dd><dt>Ø Einstand</dt><dd>${money(ctx, r.buy)}</dd><dt>Eingesetzt</dt><dd>${money(ctx, r.cost)}</dd><dt>Heute</dt><dd><${Gain} ctx=${ctx} v=${r.day} pct=${r.dayPct} /></dd><dt>Anteil am Depot</dt><dd>${fmtPercent(r.weight, { digits: 1 })}</dd></dl>`
      : html`<${EmptyState} icon="wallet" title="Nicht im Depot" text="Du hältst dieses Wertpapier nicht. Du kannst eine Order simulieren oder einen Kursalarm anlegen." action=${html`<${Button} icon="trending-up" onClick=${() => ctx.emit('order.new', { id: inst.id, to: 'trading.order', ui: { side: 'buy', selectedId: inst.id } })}>Order simulieren<//>`} />`}
      ${planBtn}${(al.length > 0 || open.length > 0) && html`<div class="tk-trd-meta">${al.length > 0 && html`Kursalarm: ${al.map((a, i) => html`${i ? ', ' : ''}${a.dir === 'above' ? 'über' : 'unter'} <${Px} v=${a.price} />${alertInfo(a, inst).near ? ' (nah)' : ''}`)}. `}${open.length > 0 && `${open.length} offene simulierte Order${open.length > 1 ? 's' : ''}.`}</div>`}</div><//>`;
  },
};
export default [trdFacts, trdHolding];
