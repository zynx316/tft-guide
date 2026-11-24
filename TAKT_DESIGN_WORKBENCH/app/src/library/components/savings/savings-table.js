// Sparpläne: Jahrestabelle der Modellrechnung – eingezahlt, Wert in drei Annahmen, Ertrag. Zum Aufklappen aller Jahre.
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Card, Button } from '../../ui.js';
import { eur, SV_CSS } from './_savings.js';
import { getCalc, runCalc, conventionShort } from './_calc.js';

export const savingsTable = {
  id: 'savings-table',
  name: 'Jahrestabelle',
  category: 'Sparpläne',
  description: 'Jahr für Jahr: eingezahlt, Wert in drei Annahmen (Annahme ± 2 PP) und Ertrag. Liest ui.calc. Lange Laufzeiten zeigen jedes n-te Jahr, mit „Alle Jahre“.',
  version: '1.1',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Jahr für Jahr' },
    { name: 'maxRows', label: 'Zeilen vor dem Aufklappen', type: 'number', default: 8 },
    { name: 'showBand', label: 'Spanne als Spalten', type: 'boolean', default: true },
  ],
  data: [],
  events: ['table.expand'],
  states: [],
  css: `${SV_CSS}
  .tk-svt__conv { margin:0; padding:0 var(--tk-space-4) var(--tk-space-4); font-size:var(--tk-fs-xs); color:var(--tk-c-text-subtle); line-height:var(--tk-lh-snug); }
  .tk-svt { width:100%; border-collapse:collapse; font-size:var(--tk-fs-sm); font-variant-numeric:tabular-nums; }
  .tk-svt th { text-align:right; font-weight:var(--tk-fw-semibold); color:var(--tk-c-text-subtle); font-size:var(--tk-fs-xs); letter-spacing:var(--tk-ls-wide); text-transform:uppercase; padding:8px 8px; border-bottom:1px solid var(--tk-c-border); white-space:nowrap; }
  .tk-svt td { text-align:right; padding:10px 8px; border-bottom:1px solid var(--tk-c-border); white-space:nowrap; }
  .tk-svt th:first-child, .tk-svt td:first-child { text-align:left; } .tk-svt tbody tr:last-child td { border-bottom:0; } .tk-svt td.m { background:var(--tk-c-accent-soft); font-weight:var(--tk-fw-semibold); }
  .bp-mobile .tk-svt .opt { display:none; } .bp-mobile .tk-svt th, .bp-mobile .tk-svt td { padding:10px 6px; }`,
  example: { props: {} },
  render: function SavingsTable({ props, ctx }) {
    const [all, setAll] = useState(false);
    const c = getCalc(ctx), run = runCalc(c);
    const a = run.annahme.series, lo = run.vorsichtig.series, hi = run.zuversichtlich.series;
    let years = Array.from({ length: Math.floor(c.years) }, (_, i) => i + 1);
    const cut = !all && years.length > props.maxRows;
    if (cut) { const k = Math.ceil(years.length / props.maxRows); years = years.filter((y) => y % k === 0 || y === years.length); }
    const row = (y) => ({ y, i: y * 12, inv: a[y * 12].invested, v: a[y * 12].value, lo: lo[y * 12].value, hi: hi[y * 12].value });
    return html`<${Card} flush title=${props.title} icon="table-2" actions=${(years.length < c.years || all) && c.years > props.maxRows ? html`<${Button} size="sm" variant="ghost" onClick=${() => { setAll(!all); ctx.emit('table.expand', { all: !all }); }}>${all ? 'Weniger Jahre' : 'Alle Jahre'}<//>` : null}>
      <div style="padding:0 var(--tk-space-4) var(--tk-space-3);overflow-x:auto" data-scroll-x><table class="tk-svt" aria-label="Modellrechnung nach Jahren"><thead><tr><th scope="col">Jahr</th><th scope="col">Eingezahlt</th>${props.showBand && html`<th scope="col" class="opt">Vorsichtig</th>`}<th scope="col">Annahme</th>${props.showBand && html`<th scope="col" class="opt">Zuversichtlich</th>`}<th scope="col">Ertrag</th></tr></thead>
        <tbody>${years.map(row).map((r) => html`<tr><td>${r.y}</td><td>${eur(ctx, r.inv)}</td>${props.showBand && html`<td class="opt">${eur(ctx, r.lo)}</td>`}<td class="m">${eur(ctx, r.v)}</td>${props.showBand && html`<td class="opt">${eur(ctx, r.hi)}</td>`}<td>${eur(ctx, r.v - r.inv, { sign: true })}</td></tr>`)}</tbody></table></div>
      <p class="tk-svt__conv" data-qa="calc-convention">${conventionShort(c)}</p><//>`;
  },
};
export default [savingsTable];
