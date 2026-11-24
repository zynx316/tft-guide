// Sparpläne: Freibetrag und Steuer-Schätzung – Sparer-Pauschbetrag, Freistellungsauftrag, Teilfreistellung, Beispielrechnung. Parameter nur aus dem Rechenkern.
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Card, Button, Segmented, Icon, Badge, EmptyState } from '../../ui.js';
import { fmtPercent, fmtDate } from '../../../lib/format.js';
import { estimateTax, TAX_DE } from '../../../core/finmath.js';
import { arr, obj, todayOf, eur, eur2, Stepper, Ring, SV_CSS, Stat } from './_savings.js';
import { planPosition } from './_plans.js';

const standText = () => { const [y, m] = TAX_DE.stand.split('-'); return `${m}/${y}`; };
const KIND = [{ value: 'single', label: 'Einzeln' }, { value: 'gemeinsam', label: 'Zusammen' }];

function OrderForm({ total, used, max, ctx, close, save }) {
  const [v, setV] = useState(total);
  const e = v > max ? `Der Freistellungsauftrag darf den Sparer-Pauschbetrag (${eur(ctx, max)}) nicht übersteigen.` : v < used ? `Der Auftrag liegt unter dem bereits genutzten Betrag (${eur2(ctx, used)}).` : '';
  return html`<div class="tk-col" style="gap:14px"><span class="tk-sv-meta">Freistellungsauftrag beim Institut. Die Summe aller Aufträge darf den Pauschbetrag nicht übersteigen.</span>
    <${Stepper} label="Freistellungsauftrag" value=${v} step=${50} min=${0} max=${5000} unit="€" onChange=${setV} />${e && html`<span class="tk-field__error" role="alert">${e}</span>`}
    <div class="tk-sv-btnrow"><${Button} variant="primary" disabled=${!!e} onClick=${() => { save(v); close(); }}>Speichern<//><${Button} variant="ghost" onClick=${close}>Abbrechen<//></div></div>`;
}

export const taxAllowance = {
  id: 'tax-allowance',
  name: 'Freibetrag und Steuern',
  category: 'Sparpläne',
  description: 'Sparer-Pauschbetrag und Freistellungsauftrag mit Auslastung, Teilfreistellung Aktienfonds und eine Schätzung der Steuer auf einen Gewinn – mit Herleitung. Beispielrechnung je Position („wenn verkauft würde“). Parameter kommen aus dem Rechenkern (Stand), Orientierung statt Steuerberatung.',
  version: '1.0',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Sparer-Pauschbetrag' },
    { name: 'part', label: 'Teil', type: 'select', options: ['all', 'allowance', 'estimate', 'positions'], default: 'all' },
    { name: 'startGain', label: 'Start-Gewinn für die Schätzung (€)', type: 'number', default: 1500 },
  ],
  data: [
    { slot: 'allowance', label: 'Freistellungsauftrag', default: 'allowance', shape: '{total,used,bank,stand}', required: true },
    { slot: 'plans', label: 'Sparpläne', default: 'plans', shape: '{id,positionId}[]' },
    { slot: 'positions', label: 'Positionen', default: 'positions', shape: '{id,short,type,gain,value}[]' },
  ],
  events: ['tax.kind', 'tax.order', 'tax.estimate', 'position.open'],
  states: ['empty'],
  css: `${SV_CSS}
  .tk-svt2 { display:flex; flex-direction:column; gap:var(--tk-space-5); min-width:0; }
  .tk-svt2__top { display:flex; gap:var(--tk-space-5); align-items:center; flex-wrap:wrap; } .tk-svt2__top > div:last-child { flex:1; min-width:200px; display:flex; flex-direction:column; gap:8px; }
  .tk-svt2__est { display:grid; grid-template-columns:repeat(auto-fit, minmax(220px,1fr)); gap:var(--tk-space-4); align-items:start; }
  .tk-svt2__res { padding:var(--tk-space-4); border-radius:var(--tk-radius-lg); background:var(--tk-c-surface2); border:1px solid var(--tk-c-border); display:flex; flex-direction:column; gap:6px; }
  .tk-svt2__dl { display:grid; grid-template-columns:minmax(0,1fr) auto; gap:4px 0; margin:0; font-size:var(--tk-fs-sm); font-variant-numeric:tabular-nums; } .tk-svt2__dl dd { margin:0; text-align:right; } .tk-svt2__dl dt { color:var(--tk-c-text-muted); padding-right:12px; } .tk-svt2__dl .s { font-weight:var(--tk-fw-semibold); border-top:1px solid var(--tk-c-border); padding-top:6px; color:var(--tk-c-text); }
  .tk-svt2__pos { display:grid; grid-template-columns:minmax(0,1fr) auto auto; gap:4px 16px; align-items:center; padding:10px 0; border-bottom:1px solid var(--tk-c-border); font-variant-numeric:tabular-nums; } .tk-svt2__pos:last-child { border-bottom:0; } .tk-svt2__pos small { color:var(--tk-c-text-muted); display:block; }
  .tk-svt2__pos > :nth-child(n+2) { text-align:right; } .bp-mobile .tk-svt2__pos { grid-template-columns:minmax(0,1fr) auto; } .bp-mobile .tk-svt2__pos > :nth-child(2) { display:none; }`,
  example: { data: { allowance: { total: 1000, used: 312.4, bank: 'Trade Republic', stand: '24.11.2026' }, plans: [{ id: 'sp1', positionId: 'p1' }], positions: [{ id: 'p1', short: 'All-World', type: 'ETF', gain: 3399.56, value: 18036.55 }] } },
  render: function TaxAllowance({ props, data, setData, ctx }) {
    const [kind, setKind] = useState('single'), [gain, setGain] = useState(props.startGain), [eq, setEq] = useState('fonds');
    const a = obj(data.allowance), today = todayOf(ctx);
    if (a.total == null) return html`<${Card} title=${props.title} icon="scale"><${EmptyState} icon="scale" title="Noch kein Freistellungsauftrag" text="Trage ein, wie viel vom Sparer-Pauschbetrag bei welchem Institut freigestellt ist." /><//>`;
    const max = TAX_DE.sparerPauschbetrag[kind], used = a.used || 0, total = a.total, left = Math.max(0, Math.min(total, max) - used), share = max ? Math.min(1, used / max) : 0;
    const t = estimateTax({ gain, allowanceLeft: left, equityFund: eq === 'fonds' }), tf = eq === 'fonds' ? TAX_DE.teilfreistellungAktienfonds : 0, afterTf = Math.max(0, gain * (1 - tf));
    const edit = () => ctx.openDialog({ title: `Freistellungsauftrag ${a.bank || ''}`.trim(), body: (close) => html`<${OrderForm} total=${total} used=${used} max=${max} ctx=${ctx} close=${close} save=${(v) => { setData('allowance', (x) => ({ ...obj(x), total: v })); ctx.emit('tax.order', { total: v }); ctx.toast(`Freistellungsauftrag auf ${eur(ctx, v)} gesetzt.`); }} />` });
    const positions = arr(data.plans).map((p) => planPosition(p, data.positions)).filter((p, i, l) => p && l.indexOf(p) === i);
    const part = props.part;
    const allowance = html`<div class="tk-svt2__top"><${Ring} size=${128} stroke=${13} value=${share} tone=${share > 0.85 ? 'warning' : 'accent'} label=${`${fmtPercent(share, { digits: 0 })} des Sparer-Pauschbetrags genutzt`}><strong class="tk-num" style="font-size:var(--tk-fs-xl)">${fmtPercent(share, { digits: 0 })}</strong><span class="tk-sv-meta" style="font-size:var(--tk-fs-xs)">genutzt</span><//>
      <div><${Stat} big label="Noch frei" value=${eur2(ctx, left)} sub=${`${eur2(ctx, used)} von ${eur(ctx, max)} genutzt · Stand ${a.stand || fmtDate(today)}`} />
        <div class="tk-sv-btnrow"><${Segmented} label="Veranlagung" value=${kind} onChange=${(v) => { setKind(v); ctx.emit('tax.kind', { kind: v }); }} options=${KIND} /><${Button} size="sm" icon="pencil" onClick=${edit}>Auftrag ändern<//></div>
        <span class="tk-sv-meta">${a.bank ? `Freistellungsauftrag bei ${a.bank}: ${eur(ctx, total)}.` : ''} ${total < max ? `${eur(ctx, max - total)} sind keinem Institut zugeteilt.` : 'Der Pauschbetrag ist vollständig zugeteilt.'}</span></div></div>`;
    const estimate = html`<div class="tk-svt2__est"><div class="tk-col" style="gap:12px"><span class="tk-label">Schätzung bei Verkauf</span><label class="tk-field"><span class="tk-field__label">Gewinn</span><${Stepper} label="Gewinn" value=${gain} step=${100} min=${0} max=${1000000} unit="€" onChange=${(v) => { setGain(v); ctx.emit('tax.estimate', { gain: v }); }} /></label>
        <${Segmented} label="Art der Anlage" value=${eq} onChange=${setEq} options=${[{ value: 'fonds', label: 'Aktienfonds' }, { value: 'sonst', label: 'Sonstige' }]} /></div>
      <div class="tk-svt2__res" role="status" aria-live="polite"><span class="tk-sv-meta">Geschätzte Steuer</span><strong class="tk-num" style="font-size:var(--tk-fs-2xl)">${eur2(ctx, t.tax)}</strong>
        <dl class="tk-svt2__dl"><dt>Gewinn</dt><dd>${eur2(ctx, gain)}</dd>${tf > 0 && html`<dt>nach Teilfreistellung ${fmtPercent(tf, { digits: 0 })}</dt><dd>${eur2(ctx, afterTf)}</dd>`}<dt>abzüglich freier Betrag</dt><dd>−${eur2(ctx, t.allowanceUsed)}</dd><dt>steuerpflichtig</dt><dd>${eur2(ctx, t.taxable)}</dd><dt class="s">mal ${fmtPercent(TAX_DE.effektiv, { digits: 3 })}</dt><dd class="s">${eur2(ctx, t.tax)}</dd></dl></div></div>`;
    const pos = html`<div><span class="tk-label">Beispiel: wenn verkauft würde (nichts wird verkauft)</span>${positions.length ? positions.map((p) => { const e = estimateTax({ gain: Math.max(0, p.gain), allowanceLeft: left, equityFund: p.type === 'ETF' }); return html`<div class="tk-svt2__pos"><div><strong>${p.short || p.name}</strong><small>${p.type === 'ETF' ? 'Aktienfonds, 30 % Teilfreistellung' : 'ohne Teilfreistellung'}</small></div><span>Gewinn ${eur(ctx, p.gain)}</span><strong>${eur2(ctx, e.tax)}</strong></div>`; }) : html`<p class="tk-sv-meta" style="padding:8px 0">Noch keine Position mit Sparplan.</p>`}<p class="tk-sv-meta" style="margin-top:6px">Jede Zeile rechnet einzeln mit dem vollen freien Betrag, nicht gemeinsam.</p></div>`;
    const note = html`<p class="tk-sv-note"><${Icon} name="scale" size=${14} /><span>Annahmen Stand ${standText()}: Abgeltungsteuer ${fmtPercent(TAX_DE.abgeltungsteuer, { digits: 0 })} plus Solidaritätszuschlag, ohne Kirchensteuer und Vorabpauschale. Annahme, vor Veröffentlichung prüfen. Steuer-Orientierung, keine Steuerberatung.</span></p>`;
    const body = part === 'allowance' ? allowance : part === 'estimate' ? estimate : part === 'positions' ? pos : html`<div class="tk-svt2">${allowance}${estimate}${pos}</div>`;
    return html`<${Card} title=${props.title} icon="scale" actions=${html`<${Badge}>Stand ${standText()}<//>`}><div class="tk-svt2">${body}${note}</div><//>`;
  },
};
export default [taxAllowance];
