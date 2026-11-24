// Sparpläne: Ergebnis des Rechners – Spanne statt Einzelwert (3/5/7 %), Einzahlungen und Erträge getrennt, Meilensteine.
import { html } from '../../../lib/html.js';
import { Card, Button, Badge, Icon } from '../../ui.js';
import { fmtPercent, fmtDate } from '../../../lib/format.js';
import { todayOf, eur, spanLabel, SV_CSS } from './_savings.js';
import { getCalc, runCalc, milestones, SCENARIO_NAMES, INFLATION } from './_calc.js';
import { CHART_CSS } from './_chart.js';

const pc = (r) => fmtPercent(r, { digits: Number.isInteger(Math.round(r * 1000) / 10) ? 0 : 1 });

export const savingsResult = {
  id: 'savings-result',
  name: 'Rechner-Ergebnis',
  category: 'Sparpläne',
  description: 'Ergebnis der Modellrechnung als Spanne (Annahme ± 2 PP): Endwert in drei Annahmen, Einzahlungen und Erträge getrennt, Meilensteine und Aktionen (vergleichen, als Sparplan anlegen). Liest ui.calc.',
  version: '1.0',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Ergebnis' },
    { name: 'style', label: 'Darstellung', type: 'select', options: ['cards', 'compact'], default: 'cards' },
    { name: 'showMilestones', label: 'Meilensteine', type: 'boolean', default: true },
    { name: 'showActions', label: 'Aktionen', type: 'boolean', default: true },
  ],
  data: [],
  events: ['compare.open', 'calc.create'],
  states: [],
  css: `${SV_CSS}${CHART_CSS}
  .tk-svr { display:flex; flex-direction:column; gap:var(--tk-space-4); min-width:0; }
  .tk-svr__lead { display:flex; flex-direction:column; gap:4px; }
  .tk-svr__range { font-size:var(--tk-fs-2xl); font-weight:var(--tk-fw-bold); letter-spacing:var(--tk-ls-tight); line-height:1.15; font-variant-numeric:tabular-nums; overflow-wrap:anywhere; }
  .tk-svr__trio { display:grid; grid-template-columns:repeat(3, minmax(0,1fr)); gap:var(--tk-space-3); }
  .tk-svr__sc { padding:var(--tk-space-3) var(--tk-space-4); border-radius:var(--tk-radius-lg); border:1px solid var(--tk-c-border); background:var(--tk-c-surface2); display:flex; flex-direction:column; gap:2px; min-width:0; }
  .tk-svr__sc--main { background:var(--tk-c-accent-soft); border-color:color-mix(in srgb, var(--tk-c-accent) 45%, transparent); }
  .tk-svr__sc b { font-size:var(--tk-fs-xl); font-variant-numeric:tabular-nums; font-weight:var(--tk-fw-bold); overflow-wrap:anywhere; line-height:1.2; }
  .tk-svr__sc small { color:var(--tk-c-text-muted); font-size:var(--tk-fs-sm); } .tk-svr__sc em { font-style:normal; font-size:var(--tk-fs-xs); text-transform:uppercase; letter-spacing:var(--tk-ls-wide); font-weight:var(--tk-fw-semibold); color:var(--tk-c-text-muted); }
  .bp-mobile .tk-svr__trio { grid-template-columns:minmax(0,1fr); }
  .bp-mobile .tk-svr__sc { flex-direction:row; align-items:baseline; justify-content:space-between; flex-wrap:wrap; gap:2px 12px; } .bp-mobile .tk-svr__sc small { flex-basis:100%; }
  .tk-svr__split { display:flex; flex-direction:column; gap:8px; }
  .tk-svr__legend { display:flex; justify-content:space-between; gap:10px 16px; flex-wrap:wrap; font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); }
  .tk-svr__legend span { display:inline-flex; align-items:center; gap:6px; font-variant-numeric:tabular-nums; } .tk-svr__legend i { width:10px; height:10px; border-radius:3px; display:inline-block; }
  .tk-svr__ms { display:flex; flex-direction:column; gap:6px; margin:0; padding:0; list-style:none; } .tk-svr__ms li { display:flex; align-items:center; gap:10px; font-size:var(--tk-fs-sm); }
  .tk-svr__tbl { width:100%; border-collapse:collapse; font-variant-numeric:tabular-nums; } .tk-svr__tbl th, .tk-svr__tbl td { padding:8px 6px; text-align:right; border-bottom:1px solid var(--tk-c-border); } .tk-svr__tbl th:first-child, .tk-svr__tbl td:first-child { text-align:left; }
  .tk-svr__tbl th { font-size:var(--tk-fs-xs); text-transform:uppercase; letter-spacing:var(--tk-ls-wide); color:var(--tk-c-text-subtle); font-weight:var(--tk-fw-semibold); }`,
  example: { props: {} },
  render: function SavingsResult({ props, ctx }) {
    const c = getCalc(ctx), run = runCalc(c), today = todayOf(ctx);
    const val = (k) => (c.tax ? run[k].net : run[k].value);
    const keys = ['vorsichtig', 'annahme', 'zuversichtlich'];
    const a = run.annahme, ms = milestones(run);
    const tag = [c.real && `heutige Kaufkraft (Inflation ${pc(INFLATION)})`, c.tax && 'nach Steuern (Schätzung)'].filter(Boolean);
    const gainShare = a.value ? Math.max(0, a.gain) / a.value : 0;
    const actions = props.showActions && html`<div class="tk-sv-btnrow">
      <${Button} icon="git-compare" onClick=${() => ctx.emit('compare.open', { ui: { calc: c } })}>Szenarien vergleichen<//>
      <${Button} variant="primary" icon="plus" onClick=${() => ctx.emit('calc.create', { ui: { draft: { monthly: c.monthly, dynamicPa: c.dynamicPa, ratePa: c.ratePa } } })}>Als Sparplan anlegen<//></div>`;
    const note = html`<p class="tk-sv-note"><${Icon} name="calculator" size=${14} /><span>Annahme: ${pc(c.ratePa)} Rendite p. a. abzüglich ${fmtPercent(c.costPa, { digits: 2 })} Kosten, monatlich umgerechnet, Einzahlung am Monatsende. Stand ${fmtDate(today)}. Kein Versprechen, keine Prognose.</span></p>`;
    if (props.style === 'compact') {
      return html`<${Card} title=${props.title} icon="calculator" actions=${tag.length ? html`<${Badge}>${tag[0]}<//>` : null}><div style="overflow-x:auto" data-scroll-x><table class="tk-svr__tbl"><thead><tr><th>Annahme</th><th>Wert</th><th>Ertrag</th></tr></thead><tbody>
        ${keys.map((k) => html`<tr><td>${SCENARIO_NAMES[k]} · ${pc(run.nominal[k])}</td><td><strong>${eur(ctx, val(k))}</strong></td><td>${eur(ctx, run[k].gain, { sign: true })}</td></tr>`)}</tbody></table></div>
        <p class="tk-sv-meta" style="margin:8px 0">Eingezahlt ${eur(ctx, a.invested)} nach ${c.years} Jahren (davon Start ${eur(ctx, c.initial)}).</p>${actions}${note}<//>`;
    }
    return html`<${Card} title=${props.title} icon="calculator" actions=${tag.map((t) => html`<${Badge} tone="info">${t}<//>`)}><div class="tk-svr">
      <div class="tk-svr__lead"><span class="tk-sv-meta">Nach ${c.years} ${c.years === 1 ? 'Jahr' : 'Jahren'} wären es zwischen</span>
        <div class="tk-svr__range">${eur(ctx, val('vorsichtig'))} und ${eur(ctx, val('zuversichtlich'))}</div>
        <span class="tk-sv-meta">Bei ${pc(c.ratePa)} Rendite pro Jahr etwa <strong class="tk-num" style="color:var(--tk-c-text)">${eur(ctx, val('annahme'))}</strong></span></div>
      <div class="tk-svr__trio">${keys.map((k) => html`<div class=${`tk-svr__sc${k === 'annahme' ? ' tk-svr__sc--main' : ''}`}><em>${SCENARIO_NAMES[k]} · ${pc(run.nominal[k])}</em><b>${eur(ctx, val(k))}</b><small>Ertrag ${eur(ctx, run[k].gain, { sign: true })}${c.tax ? ` · Steuer ${eur(ctx, run[k].tax)}` : ''}</small></div>`)}</div>
      <div class="tk-svr__split"><div class="tk-sv-bar" role="img" aria-label=${`Eingezahlt ${eur(ctx, a.invested)}, Ertrag ${eur(ctx, a.gain)}`}><i style=${`flex:${Math.max(1, (1 - gainShare) * 100)};background:var(--tk-c-text-subtle);opacity:.55`}></i><i style=${`flex:${Math.max(0.5, gainShare * 100)};background:var(--tk-c-accent)`}></i></div>
        <div class="tk-svr__legend"><span><i style="background:var(--tk-c-text-subtle);opacity:.55"></i>Eingezahlt ${eur(ctx, a.invested)}</span><span><i style="background:var(--tk-c-accent)"></i>Ertrag (Annahme) ${eur(ctx, a.gain)} · ${fmtPercent(gainShare, { digits: 0 })} des Werts</span></div></div>
      ${props.showMilestones && ms.length > 0 && html`<ul class="tk-svr__ms" aria-label="Meilensteine bei der Annahme">${ms.map((m) => html`<li><${Icon} name="flag" size=${14} /><span><strong class="tk-num">${eur(ctx, m.target)}</strong> nach ${spanLabel(m.month)}</span></li>`)}</ul>`}
      ${actions}${note}</div><//>`;
  },
};
export default [savingsResult];
