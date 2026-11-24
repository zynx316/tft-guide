// Sparpläne – Assistent „Sparplan anlegen“: Anlageauswahl, Voreinstellungen, Validierung, Zusammenfassung, Schritte.
import { html } from '../../../lib/html.js';
import { Chip, Badge, Icon, Input, Select, Field } from '../../ui.js';
import { fmtDate, fmtPercent } from '../../../lib/format.js';
import { addDays, dayDiff, toIsoDay, parseLocal } from '../../../lib/date.js';
import { arr, obj, eur, eur2, Stepper, Tile, TrackerNote, pct } from './_savings.js';
import { planExecutions, RHYTHMS, monthsBetween } from './_plans.js';
import { CALC_DEFAULT, runCalc } from './_calc.js';

export const STEPS = ['Ziel', 'Betrag & Rhythmus', 'Anlage', 'Übersicht'];
/** Weitere ETFs als Beispielauswahl (alphabetisch, ohne Empfehlung); Kosten und Risikoklasse sind Demo-Angaben. */
const EXTRA = [
  { id: 'cat-sp500', name: 'iShares Core S&P 500 UCITS ETF (Acc)', short: 'S&P 500', isin: 'IE00B5BMR087', ter: 0.0007, risk: 5, dist: 'thesaurierend' },
  { id: 'cat-world', name: 'iShares Core MSCI World UCITS ETF (Acc)', short: 'MSCI World', isin: 'IE00B4L5Y983', ter: 0.002, risk: 5, dist: 'thesaurierend' },
  { id: 'cat-xworld', name: 'Xtrackers MSCI World UCITS ETF 1C', short: 'MSCI World (Xtrackers)', isin: 'IE00BJ0KDQ92', ter: 0.0019, risk: 5, dist: 'thesaurierend' },
];
export function instruments({ positions, accounts }) {
  const inDepot = arr(positions).filter((p) => p.type === 'ETF').map((p) => ({ id: `pos:${p.id}`, group: 'Im Depot', name: p.name, short: p.short || p.name, isin: p.isin, ter: p.ter ?? 0.002, risk: p.sector === 'Technologie' ? 6 : 5, dist: p.distribution || 'thesaurierend', ratePa: 0.06, positionId: p.id }));
  const have = new Set(inDepot.map((i) => i.isin));
  const more = EXTRA.filter((e) => !have.has(e.isin)).map((e) => ({ ...e, group: 'Weitere ETFs (Beispiele)', ratePa: 0.06 }));
  const konto = arr(accounts).filter((a) => a.type === 'savings').map((a) => ({ id: `acc:${a.id}`, group: 'Konto', name: a.name, short: a.name, sub: `${a.bank || 'Konto'} · ${fmtPercent(a.interestPa ?? 0, { digits: 1 })} Zinsen p. a.`, ter: 0, risk: 1, dist: 'Zinsen', ratePa: a.interestPa ?? 0.02, accountId: a.id }));
  return [...inDepot, ...more.sort((a, b) => a.short.localeCompare(b.short, 'de')), ...konto];
}

export function defaults(ctx, data, today) {
  const d = obj(ctx.ui.draft), goals = arr(data.goals), gp = ctx.ui.wizardGoal;
  const open = goals.find((g) => !arr(data.plans).some((p) => p.goalId === g.id));
  const day = 1, plan = { day, intervalMonths: 1, active: true, id: 'x' };
  return { step: 0, tried: {}, goalMode: gp === 'new' ? 'new' : d.goalId || gp || open ? 'existing' : goals.length ? 'existing' : 'new', goalId: d.goalId || (gp && gp !== 'new' ? gp : open?.id || goals[0]?.id || null),
    newGoal: { name: '', target: 5000, due: toIsoDay(addDays(today, 365 * 3)) }, amount: d.monthly || 100, interval: 1, day, startDate: toIsoDay(planExecutions(plan, today, 1)[0]?.date || today),
    dynamicPa: d.dynamicPa || 0, fromAccount: 'acc-giro', instrument: null, ratePa: d.ratePa ?? null, name: '', done: null };
}

const validDate = (s) => !!parseLocal(s);
export function validate(w, step, ctx, data, today) {
  const e = {};
  if (step === 0) {
    if (w.goalMode === 'existing' && !arr(data.goals).some((g) => g.id === w.goalId)) e.goalId = 'Wähle ein Ziel oder lege ein neues an.';
    if (w.goalMode === 'new') {
      if (String(w.newGoal.name).trim().length < 2) e.goalName = 'Gib dem Ziel einen Namen (mindestens 2 Zeichen).';
      if (!(w.newGoal.target > 0)) e.goalTarget = 'Der Zielbetrag muss größer als 0 € sein.';
      if (!validDate(w.newGoal.due) || dayDiff(today, w.newGoal.due) <= 0) e.goalDue = 'Das Zieldatum muss in der Zukunft liegen.';
    }
  }
  if (step === 1) {
    if (!(w.amount >= 10)) e.amount = 'Die Rate beträgt mindestens 10 €.';
    else if (w.amount > 10000) e.amount = 'Die Rate darf höchstens 10.000 € betragen.';
    if (!(w.day >= 1 && w.day <= 28)) e.day = 'Wähle einen Tag zwischen 1 und 28.';
    if (!validDate(w.startDate) || dayDiff(today, w.startDate) < 0) e.startDate = 'Der Start liegt nicht in der Vergangenheit.';
  }
  if (step === 2 && !w.instrument) e.instrument = 'Wähle eine Anlage oder ein Konto.';
  return e;
}

/** Plan-Entwurf, erste Termine und Modellrechnung für die Übersicht. */
export function preview(w, ctx, data, today) {
  const inst = instruments(data).find((i) => i.id === w.instrument) || null;
  const monthly = Math.round((w.amount / w.interval) * 100) / 100;
  const goal = w.goalMode === 'existing' ? arr(data.goals).find((g) => g.id === w.goalId) : w.goalMode === 'new' ? { name: w.newGoal.name || 'Neues Ziel', target: w.newGoal.target, due: w.newGoal.due, current: 0 } : null;
  const draft = { id: 'draft', name: w.name || `${inst?.short || 'Neuer'} Sparplan`, monthly, day: w.day, intervalMonths: w.interval, active: true, startDate: w.startDate };
  const execs = planExecutions(draft, w.startDate && validDate(w.startDate) ? parseLocal(w.startDate) : today, 3);
  const years = goal?.due ? Math.max(1, Math.min(50, Math.ceil(monthsBetween(today, goal.due) / 12))) : 10;
  const rate = w.ratePa ?? inst?.ratePa ?? 0.05;
  const run = inst ? runCalc({ ...CALC_DEFAULT, monthly, initial: 0, years, ratePa: rate, costPa: inst.ter || 0, dynamicPa: w.dynamicPa, real: false, tax: false }) : null;
  const giro = arr(data.accounts).find((a) => a.id === w.fromAccount);
  return { inst, monthly, goal, draft, execs, years, rate, run, giro, short: giro ? Math.max(0, w.amount - giro.balance) : 0 };
}

const err = (e, k) => e[k] && html`<span class="tk-field__error" role="alert">${e[k]}</span>`;
export function StepGoal({ w, set, e, data, ctx }) {
  const goals = arr(data.goals);
  return html`<div class="tk-col" style="gap:14px"><div class="tk-svw__chips" role="group" aria-label="Ziel wählen">
      <${Chip} active=${w.goalMode === 'existing'} onClick=${() => set({ goalMode: 'existing' })}>Vorhandenes Ziel<//><${Chip} active=${w.goalMode === 'new'} onClick=${() => set({ goalMode: 'new' })}>Neues Ziel<//><${Chip} active=${w.goalMode === 'none'} onClick=${() => set({ goalMode: 'none' })}>Ohne Ziel<//></div>
    ${w.goalMode === 'existing' && html`<div class="tk-svw__opts" role="radiogroup" aria-label="Sparziel">${goals.map((g) => html`<button type="button" role="radio" aria-checked=${w.goalId === g.id ? 'true' : 'false'} class="tk-svw__opt" onClick=${() => set({ goalId: g.id })}>
      <${Tile} tone=${g.tone || 1} icon=${g.icon || 'target'} size=${16} /><span class="tk-grow"><strong>${g.name}</strong><small>${eur(ctx, g.current)} von ${eur(ctx, g.target)} · bis ${fmtDate(g.due)}</small></span>${w.goalId === g.id ? html`<${Icon} name="check-circle-2" size=${18} />` : null}</button>`)}</div>${err(e, 'goalId')}`}
    ${w.goalMode === 'new' && html`<div class="tk-svw__grid"><${Field} label="Name des Ziels" error=${e.goalName}><${Input} value=${w.newGoal.name} placeholder="z. B. Fahrrad, Reise, Anzahlung" invalid=${!!e.goalName} onInput=${(v) => set({ newGoal: { ...w.newGoal, name: v } })} /><//>
      <${Field} label="Zielbetrag" error=${e.goalTarget}><${Stepper} label="Zielbetrag" value=${w.newGoal.target} step=${250} min=${0} max=${2000000} unit="€" onChange=${(v) => set({ newGoal: { ...w.newGoal, target: v } })} /><//>
      <${Field} label="Zieldatum" error=${e.goalDue}><${Input} type="date" value=${w.newGoal.due} invalid=${!!e.goalDue} onInput=${(v) => set({ newGoal: { ...w.newGoal, due: v } })} /><//></div>`}
    ${w.goalMode === 'none' && html`<p class="tk-sv-meta">Ohne Ziel läuft der Plan einfach weiter. Du kannst später ein Ziel verknüpfen.</p>`}</div>`;
}

export function StepAmount({ w, set, e, data, ctx, p }) {
  const accs = arr(data.accounts).filter((a) => ['giro', 'business'].includes(a.type));
  return html`<div class="tk-col" style="gap:14px"><div class="tk-svw__grid">
      <${Field} label="Betrag je Ausführung" error=${e.amount} hint=${w.interval > 1 ? `Entspricht ${eur2(ctx, p.monthly)} pro Monat.` : undefined}><${Stepper} label="Betrag je Ausführung" value=${w.amount} step=${10} min=${0} max=${10000} unit="€" onChange=${(v) => set({ amount: v })} /><//>
      <${Field} label="Rhythmus"><${Select} value=${String(w.interval)} onChange=${(v) => set({ interval: Number(v) })} options=${RHYTHMS.map((r) => ({ value: String(r.value), label: r.label }))} /><//>
      <${Field} label="Ausführungstag im Monat" error=${e.day} hint="Fällt er auf ein Wochenende oder einen Feiertag, wird auf den nächsten Handelstag verschoben."><${Stepper} label="Ausführungstag" value=${w.day} step=${1} min=${1} max=${28} onChange=${(v) => set({ day: v })} /><//>
      <${Field} label="Start ab" error=${e.startDate}><${Input} type="date" value=${w.startDate} invalid=${!!e.startDate} onInput=${(v) => set({ startDate: v })} /><//>
      <${Field} label="Von Konto"><${Select} value=${w.fromAccount} onChange=${(v) => set({ fromAccount: v })} options=${accs.map((a) => ({ value: a.id, label: `${a.name} · ${eur(ctx, a.balance)}` }))} /><//></div>
    <div><span class="tk-field__label">Ratensteigerung pro Jahr (optional)</span><div class="tk-svw__chips" role="group" aria-label="Ratensteigerung" style="margin-top:6px">${[0, 0.02, 0.03, 0.05].map((d) => html`<${Chip} active=${w.dynamicPa === d} onClick=${() => set({ dynamicPa: d })}>${d ? `${pct(d)} p. a.` : 'Keine'}<//>`)}</div></div>
    ${p.short > 0 && html`<div class="tk-svw__warn" role="status"><${Icon} name="alert-circle" size=${16} /><span>Auf dem Konto „${p.giro.name}“ liegen ${eur(ctx, p.giro.balance)}. Für die erste Ausführung fehlen ${eur2(ctx, p.short)}.</span></div>`}</div>`;
}

export function StepInstrument({ w, set, e, data, ctx }) {
  const list = instruments(data), groups = [...new Set(list.map((i) => i.group))];
  return html`<div class="tk-col" style="gap:14px"><p class="tk-sv-meta">Alphabetisch sortiert, keine Empfehlung. Kosten und Risikoklasse sind Demo-Angaben, maßgeblich ist das Basisinformationsblatt des Anbieters.</p>
    ${groups.map((g) => html`<div class="tk-col" style="gap:8px"><span class="tk-label">${g}</span><div class="tk-svw__opts" role="radiogroup" aria-label=${g}>${list.filter((i) => i.group === g).map((i) => html`<button type="button" role="radio" aria-checked=${w.instrument === i.id ? 'true' : 'false'} class="tk-svw__opt" onClick=${() => set({ instrument: i.id, ratePa: i.ratePa })}>
      <${Tile} tone=${i.accountId ? 3 : 1} icon=${i.accountId ? 'piggy-bank' : 'candlestick-chart'} size=${16} /><span class="tk-grow"><strong>${i.name}</strong><small>${i.sub || `${i.isin} · ${i.dist}`}</small><span class="tk-svw__badges">${i.accountId ? '' : html`<${Badge}>Kosten ${fmtPercent(i.ter, { digits: 2 })}<//>`}<${Badge}>Risikoklasse ${i.risk} von 7<//></span></span>${w.instrument === i.id ? html`<${Icon} name="check-circle-2" size=${18} />` : null}</button>`)}</div></div>`)}
    ${err(e, 'instrument')}</div>`;
}

export function StepReview({ w, set, ctx, data, p, today }) {
  const goalText = p.goal ? `${p.goal.name}${p.goal.due ? ` · bis ${fmtDate(p.goal.due)}` : ''}` : 'Ohne Ziel';
  const rows = [['Ziel', goalText], ['Anlage', p.inst ? p.inst.short : '–'], ['Rate', `${eur2(ctx, w.amount)} ${RHYTHMS.find((r) => r.value === w.interval)?.label.toLowerCase()}, am ${w.day}.`], ['Ratensteigerung', w.dynamicPa ? `${pct(w.dynamicPa)} pro Jahr` : 'Keine'],
    ['Von Konto', p.giro?.name || '–'], ['Erste Ausführung', p.execs[0] ? `${fmtDate(p.execs[0].date, { style: 'weekday' })}${p.execs[0].shifted ? ' (verschoben)' : ''}` : '–'], ['Kosten der Anlage', p.inst ? `${fmtPercent(p.inst.ter, { digits: 2 })} p. a.` : '–']];
  return html`<div class="tk-col" style="gap:14px"><${Field} label="Name des Plans"><${Input} value=${w.name} placeholder=${p.draft.name} onInput=${(v) => set({ name: v })} /><//>
    <dl class="tk-svw__dl">${rows.map(([k, v]) => html`<dt>${k}</dt><dd>${v}</dd>`)}</dl>
    ${p.run ? html`<div class="tk-svw__proj" role="status"><span class="tk-sv-meta">Modellrechnung für ${p.years} ${p.years === 1 ? 'Jahr' : 'Jahre'} mit ${pct(p.rate)} Rendite p. a. (Annahme)</span><strong class="tk-num">zwischen ${eur(ctx, p.run.vorsichtig.value)} und ${eur(ctx, p.run.zuversichtlich.value)}</strong><span class="tk-sv-meta">davon eingezahlt ${eur(ctx, p.run.annahme.invested)}. Kein Versprechen, keine Anlageberatung.</span></div>` : null}
    <${TrackerNote} /></div>`;
}

export const WIZ_CSS = `
  .tk-svw { display:flex; flex-direction:column; gap:var(--tk-space-4); min-width:0; }
  .tk-svw__steps { display:flex; gap:6px; flex-wrap:wrap; } .tk-svw__st { display:inline-flex; align-items:center; gap:8px; min-height:36px; padding:0 12px 0 6px; border-radius:var(--tk-radius-pill); border:1px solid var(--tk-c-border); background:var(--tk-c-surface); color:var(--tk-c-text-muted); font:inherit; font-size:var(--tk-fs-sm); cursor:pointer; }
  .tk-svw__st i { width:24px; height:24px; border-radius:50%; display:grid; place-items:center; font-style:normal; font-size:var(--tk-fs-xs); font-weight:var(--tk-fw-bold); background:var(--tk-c-surface3); color:var(--tk-c-text); }
  .tk-svw__st[aria-current="step"] { border-color:var(--tk-c-accent); color:var(--tk-c-text); background:var(--tk-c-accent-soft); } .tk-svw__st[aria-current="step"] i { background:var(--tk-c-accent); color:var(--tk-c-text-on-accent); }
  .tk-svw__st[data-done="true"] i { background:var(--tk-c-success); color:var(--tk-c-bg); }
  .bp-mobile .tk-svw__st span { display:none; } .bp-mobile .tk-svw__st[aria-current="step"] span { display:inline; } .bp-mobile .tk-svw__st { min-height:44px; }
  .tk-svw__chips { display:flex; gap:6px; flex-wrap:wrap; }
  .tk-svw__grid .tk-input, .tk-svw__grid .tk-select, .tk-svw__two .tk-input, .tk-svw__two .tk-select, .tk-svw .tk-input, .tk-svw .tk-select { height:auto; min-height:var(--tk-size-control); padding-block:.3em; }
  .tk-svw__grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(min(100%,max(230px,14em)),1fr)); gap:var(--tk-space-4); }
  .tk-svw__opts { display:flex; flex-direction:column; gap:8px; }
  .tk-svw__opt { all:unset; box-sizing:border-box; display:flex; align-items:center; gap:12px; padding:10px var(--tk-space-3); min-height:56px; border-radius:var(--tk-radius-lg); border:1px solid var(--tk-c-border); background:var(--tk-c-surface); cursor:pointer; min-width:0; }
  .tk-svw__opt:hover { border-color:var(--tk-c-border-strong); } .tk-svw__opt:focus-visible { outline:2px solid var(--tk-c-focus); } .tk-svw__opt[aria-checked="true"] { border-color:var(--tk-c-accent); background:var(--tk-c-accent-soft); }
  .tk-svw__opt strong { display:block; font-weight:var(--tk-fw-semibold); overflow-wrap:anywhere; } .tk-svw__opt small { display:block; font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); } .tk-svw__opt > .icon:last-child { color:var(--tk-c-accent); }
  .tk-svw__badges { display:flex; gap:6px; flex-wrap:wrap; margin-top:6px; }
  .tk-svw__dl { display:grid; grid-template-columns:minmax(0,auto) minmax(0,1fr); gap:0; margin:0; font-size:var(--tk-fs-sm); } .tk-svw__dl dt, .tk-svw__dl dd { margin:0; padding:9px 0; border-bottom:1px solid var(--tk-c-border); } .tk-svw__dl dt { color:var(--tk-c-text-muted); padding-right:16px; } .tk-svw__dl dd { text-align:right; font-weight:var(--tk-fw-medium); overflow-wrap:anywhere; }
  [data-tk-large-text] .tk-svw__dl { grid-template-columns:minmax(0,1fr); } [data-tk-large-text] .tk-svw__dl dt { border-bottom:0; padding-bottom:0; padding-right:0; } [data-tk-large-text] .tk-svw__dl dd { text-align:left; padding-top:2px; overflow-wrap:break-word; }
  .tk-svw__proj { display:flex; flex-direction:column; gap:4px; padding:var(--tk-space-3) var(--tk-space-4); border-radius:var(--tk-radius-lg); background:var(--tk-c-accent-soft); } .tk-svw__proj strong { font-size:var(--tk-fs-xl); overflow-wrap:anywhere; }
  .tk-svw__warn { display:flex; gap:10px; align-items:flex-start; padding:10px var(--tk-space-3); border-radius:var(--tk-radius-md); background:var(--tk-c-warning-soft); font-size:var(--tk-fs-sm); } .tk-svw__warn .icon { color:var(--tk-c-warning); margin-top:2px; }
  .tk-svw__nav { display:flex; gap:var(--tk-space-2); justify-content:space-between; flex-wrap:wrap; align-items:center; }
  .tk-svw__done { display:flex; flex-direction:column; align-items:center; text-align:center; gap:10px; padding:var(--tk-space-6) var(--tk-space-4); }
  .tk-svw__done .icon { color:var(--tk-c-success); }
  .tk-svw__two { display:grid; grid-template-columns:minmax(0,1.5fr) minmax(0,1fr); gap:var(--tk-space-5); align-items:start; } .bp-tablet .tk-svw__two, .bp-mobile .tk-svw__two { grid-template-columns:minmax(0,1fr); }
  .tk-svw__sec { display:flex; flex-direction:column; gap:var(--tk-space-3); padding-bottom:var(--tk-space-5); border-bottom:1px solid var(--tk-c-border); } .tk-svw__sec:last-of-type { border-bottom:0; }
  .tk-svw__sec h4 { margin:0; font-size:var(--tk-fs-md); font-weight:var(--tk-fw-semibold); display:flex; align-items:center; gap:8px; }
  .tk-svw__sec h4 b { width:22px; height:22px; border-radius:50%; background:var(--tk-c-surface3); display:grid; place-items:center; font-size:var(--tk-fs-xs); }
`;
