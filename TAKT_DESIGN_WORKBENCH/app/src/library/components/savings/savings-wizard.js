// Sparpläne: Assistent „Sparplan anlegen“ – Ziel → Betrag & Rhythmus → Anlage → Übersicht (Schritte) oder alles auf einer Seite mit Live-Übersicht.
import { html } from '../../../lib/html.js';
import { Card, Button, Icon } from '../../ui.js';
import { arr, obj, todayOf, SV_CSS, sid } from './_savings.js';
import { STEPS, defaults, validate, preview, instruments, StepGoal, StepAmount, StepInstrument, StepReview, WIZ_CSS } from './_wizard.js';

export const savingsWizard = {
  id: 'savings-wizard',
  name: 'Sparplan-Assistent',
  category: 'Sparpläne',
  description: 'Sparplan anlegen in vier Schritten (Ziel, Betrag und Rhythmus, Anlage, Übersicht) mit Prüfung vor „Weiter“ und Modellrechnung – oder alle Abschnitte auf einer Seite mit Live-Übersicht. Speichert in die gemeinsamen Sparpläne (und legt bei Bedarf ein Ziel an). Der Plan wird nicht von TAKT ausgeführt.',
  version: '1.1',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Sparplan anlegen' },
    { name: 'mode', label: 'Ablauf', type: 'select', options: ['steps', 'single'], default: 'steps' },
  ],
  data: [
    { slot: 'plans', label: 'Sparpläne', default: 'plans', shape: '{id,name,monthly,day,active}[]', required: true },
    { slot: 'goals', label: 'Sparziele', default: 'goals', shape: '{id,name,target,current,due,monthly}[]' },
    { slot: 'positions', label: 'Positionen', default: 'positions', shape: '{id,name,isin,type}[]' },
    { slot: 'accounts', label: 'Konten', default: 'accounts', shape: '{id,name,type,balance}[]' },
  ],
  events: ['wizard.step', 'plan.created', 'form.invalid', 'plan.open', 'plans.open'],
  states: [],
  css: `${SV_CSS}${WIZ_CSS}`,
  example: { data: { plans: [], goals: [{ id: 'g1', name: 'Japan-Reise 2027', target: 6000, current: 2150, due: '2027-09-01', monthly: 0, icon: 'plane', tone: 5 }], positions: [], accounts: [{ id: 'acc-giro', type: 'giro', name: 'Girokonto', balance: 3842.17 }, { id: 'acc-tg', type: 'savings', name: 'Tagesgeld', balance: 9500, interestPa: 0.025 }] } },
  render: function SavingsWizard({ props, data, setData, ctx }) {
    const today = todayOf(ctx), base = defaults(ctx, data, today), w = { ...base, ...obj(ctx.ui.wiz) };
    const set = (patch) => ctx.setUi('wiz', { ...obj(ctx.ui.wiz), ...patch });
    const p = preview(w, ctx, data, today);
    const errs = (s) => (w.tried[s] ? validate(w, s, ctx, data, today) : {});
    const go = (step) => { set({ step }); ctx.emit('wizard.step', { step }); };
    const next = () => { const e = validate(w, w.step, ctx, data, today); if (Object.keys(e).length) { set({ tried: { ...w.tried, [w.step]: true } }); ctx.emit('form.invalid', { step: w.step, fields: Object.keys(e) }); return; } go(w.step + 1); };
    const save = () => {
      const bad = [0, 1, 2].find((s) => Object.keys(validate(w, s, ctx, data, today)).length);
      if (bad != null) { set({ tried: { 0: true, 1: true, 2: true }, ...(props.mode === 'steps' ? { step: bad } : {}) }); ctx.emit('form.invalid', { step: bad }); return; }
      const inst = p.inst, plans = arr(data.plans);
      const goalId = w.goalMode === 'existing' ? w.goalId : w.goalMode === 'new' ? sid('g-', ctx) : null;
      const plan = { id: sid('sp-', ctx), name: w.name.trim() || p.draft.name, ...(inst.positionId ? { positionId: inst.positionId } : inst.accountId ? { accountId: inst.accountId } : { instrumentName: inst.name, instrumentShort: inst.short }), isin: inst.isin, monthly: p.monthly, day: w.day, intervalMonths: w.interval, startDate: w.startDate, active: true, dynamicPa: w.dynamicPa,
        expectedReturnPa: w.ratePa ?? inst.ratePa, goalId, tone: (plans.length % 6) + 1, fromAccount: w.fromAccount };
      setData('plans', (l) => [...arr(l), plan]);
      if (w.goalMode === 'new') setData('goals', (l) => [...arr(l), { id: goalId, name: w.newGoal.name.trim(), target: w.newGoal.target, current: 0, icon: 'target', tone: plan.tone, due: w.newGoal.due, monthly: p.monthly }]);
      else if (w.goalMode === 'existing') setData('goals', (l) => arr(l).map((g) => (g.id === goalId ? { ...g, monthly: (g.monthly || 0) + p.monthly, paused: false } : g)));
      set({ done: { id: plan.id, name: plan.name } }); ctx.toast('Sparplan gespeichert.'); ctx.emit('plan.created', { id: plan.id });
    };
    if (w.done) return html`<${Card}><div class="tk-svw__done"><${Icon} name="check-circle-2" size=${40} /><h3 class="tk-h2">${w.done.name} ist angelegt</h3><p class="tk-muted" style="max-width:420px">Trag den Plan bei deinem Broker oder deiner Bank ein. TAKT erinnert dich an jede Ausführung und gleicht ab.</p>
      <div class="tk-sv-btnrow" style="justify-content:center"><${Button} variant="primary" icon="arrow-right" onClick=${() => ctx.emit('plan.open', { id: w.done.id })}>Zum Sparplan<//><${Button} onClick=${() => ctx.setUi('wiz', {})}>Weiteren anlegen<//></div></div><//>`;
    const body = [(e) => html`<${StepGoal} w=${w} set=${set} e=${e} data=${data} ctx=${ctx} />`, (e) => html`<${StepAmount} w=${w} set=${set} e=${e} data=${data} ctx=${ctx} p=${p} />`, (e) => html`<${StepInstrument} w=${w} set=${set} e=${e} data=${data} ctx=${ctx} />`, () => html`<${StepReview} w=${w} set=${set} ctx=${ctx} data=${data} p=${p} today=${today} />`];
    const sub = ['Wofür sparst du?', 'Wie viel, wie oft?', 'Wohin soll das Geld?', 'Stimmt alles?'];
    if (props.mode === 'single') {
      const e = { ...errs(0), ...errs(1), ...errs(2) };
      return html`<div class="tk-svw__two"><${Card} title=${props.title} icon="piggy-bank"><div class="tk-svw">${[0, 1, 2].map((i) => html`<section class="tk-svw__sec" aria-label=${STEPS[i]}><h4><b>${i + 1}</b>${sub[i]}</h4>${body[i](e)}</section>`)}</div><//>
        <${Card} title="Übersicht" icon="clipboard-check"><div class="tk-svw">${body[3]()}<${Button} variant="primary" icon="check" onClick=${save}>Sparplan speichern<//>${Object.keys(e).length > 0 && html`<p class="tk-field__error" role="alert">Bitte prüfe die markierten Felder.</p>`}</div><//></div>`;
    }
    const last = w.step === STEPS.length - 1, e = errs(w.step);
    return html`<${Card} title=${props.title} icon="piggy-bank"><div class="tk-svw">
      <nav class="tk-svw__steps" aria-label="Schritte">${STEPS.map((n, i) => html`<button type="button" class="tk-svw__st" aria-current=${i === w.step ? 'step' : undefined} data-done=${i < w.step ? 'true' : undefined} disabled=${i > w.step} onClick=${() => go(i)}><i>${i < w.step ? '✓' : i + 1}</i><span>${n}</span></button>`)}</nav>
      <h3 class="tk-h3">${sub[w.step]}</h3>${body[w.step](e)}
      <div class="tk-svw__nav"><${Button} variant="ghost" icon="arrow-left" disabled=${w.step === 0} onClick=${() => go(w.step - 1)}>Zurück<//>${last ? html`<${Button} variant="primary" icon="check" onClick=${save}>Sparplan speichern<//>` : html`<${Button} variant="primary" iconRight="arrow-right" onClick=${next}>Weiter<//>`}</div></div><//>`;
  },
};
export default [savingsWizard];
