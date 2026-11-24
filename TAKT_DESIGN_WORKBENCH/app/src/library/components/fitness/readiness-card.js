// Fitness: Erholung – nachvollziehbare Faktoren (Schlaf, Ruhepuls, Muskelkater, Energie, Stress, Belastung) und eine Tagesempfehlung mit Begründung.
import { html } from '../../../lib/html.js';
import { Card, Badge, Icon, Button, EmptyState } from '../../ui.js';
import { isoDay } from '../../../lib/util.js';
import { recoveryFactors, recoveryAdvice, CHECKIN_SCALES } from './_calc.js';
import { FIT_CSS } from './_ui.js';

const LEVEL = { good: { tone: 'success', icon: 'check-circle-2' }, ok: { tone: 'neutral', icon: 'circle' }, low: { tone: 'warning', icon: 'alert-triangle' } };
const ROWS = [['energy', 'Energie'], ['soreness', 'Muskelkater'], ['stress', 'Stress']];

export const readinessCard = {
  id: 'readiness-card',
  name: 'Erholung & Check-in',
  category: 'Fitness',
  description: 'Tagesempfehlung mit sichtbaren Faktoren statt undurchsichtiger Zahl: Schlaf, Ruhepuls, Muskelkater, Energie, Stress und Belastung. Check-in in 3 Taps; die Empfehlung nennt immer ihre Gründe. Orientierung, keine medizinische Diagnose.',
  version: '1.2',
  props: [
    { name: 'quietEmpty', label: 'Ohne Daten nichts anzeigen (Erststart)', type: 'boolean', default: false },
    { name: 'layout', label: 'Darstellung', type: 'select', options: ['card', 'decision'], default: 'card' },
    { name: 'openEvent', label: 'Event für „Details“ (leer = kein Knopf)', type: 'text', default: '' },
    { name: 'showFactors', label: 'Faktoren zeigen', type: 'boolean', default: true },
    { name: 'showCheckin', label: 'Check-in zeigen', type: 'boolean', default: true },
    { name: 'title', label: 'Titel', type: 'text', default: 'Erholung heute' },
  ],
  data: [
    { slot: 'sleep', label: 'Schlaf', default: 'sleep', shape: '{date,hours,restingHr,quality}[]', required: true },
    { slot: 'checkins', label: 'Check-ins', default: 'checkins', shape: '{date,energy,soreness,stress}[]' },
    { slot: 'history', label: 'Verlauf', default: 'history', shape: 'Einheiten[]' },
    { slot: 'today', label: 'Heute', default: 'today', shape: '{kind,nextName}' },
  ],
  events: ['recovery.checkin', 'recovery.explain', 'plan.open', 'recovery.open'],
  states: ['empty'],
  css: `
  .tk-rd { display:flex; flex-direction:column; gap:var(--tk-space-4); } .tk-rd__answer { display:flex; gap:var(--tk-space-3); align-items:flex-start; padding:var(--tk-space-4); border-radius:var(--tk-radius-lg); border:1px solid var(--tk-c-border); background:var(--tk-c-surface2); }
  .tk-rd__answer[data-tone="success"] { background:var(--tk-c-success-soft); } .tk-rd__answer[data-tone="warning"] { background:var(--tk-c-warning-soft); } .tk-rd__answer[data-tone="info"] { background:var(--tk-c-info-soft); }
  .tk-rd__ico { width:44px; height:44px; border-radius:14px; display:grid; place-items:center; background:var(--tk-c-surface); flex:none; } .tk-rd--decision .tk-rd__answer { flex-direction:column; align-items:flex-start; padding:var(--tk-space-5); } .tk-rd--decision .tk-rd__t { font-size:var(--tk-fs-2xl); }
  .tk-rd__t { font-size:var(--tk-fs-xl); font-weight:var(--tk-fw-bold); letter-spacing:var(--tk-ls-tight); line-height:1.2; } .tk-rd__fac { display:grid; grid-template-columns:repeat(2, minmax(0,1fr)); gap:var(--tk-space-2); } .bp-mobile .tk-rd__fac { grid-template-columns:minmax(0,1fr); }
  .tk-rd__f { display:flex; align-items:center; gap:10px; padding:8px 10px; border-radius:var(--tk-radius-md); border:1px solid var(--tk-c-border); min-width:0; } .tk-rd__f strong { display:block; font-size:var(--tk-fs-md); } .tk-rd__f small { color:var(--tk-c-text-subtle); font-size:var(--tk-fs-xs); }
  .tk-rd__ci { display:flex; flex-direction:column; gap:6px; } .tk-rd__scale { display:grid; grid-template-columns:repeat(5, minmax(0,1fr)); gap:6px; } .tk-rd__scale button { min-height:44px; border-radius:var(--tk-radius-md); border:1px solid var(--tk-c-border); background:var(--tk-c-surface2); color:var(--tk-c-text-muted); cursor:pointer; font-size:var(--tk-fs-xs); padding:0 2px; }
  .tk-rd__scale button[aria-checked="true"] { background:var(--tk-c-accent-soft); border-color:var(--tk-c-accent); color:var(--tk-c-accent); font-weight:var(--tk-fw-semibold); }
  [data-tk-large-text] .tk-rd__scale { grid-template-columns:repeat(3, minmax(0,1fr)); } [data-tk-large-text] .tk-rd__scale button { hyphens:manual; overflow-wrap:normal; }`,
  example: { data: { sleep: [{ date: '2026-11-22', hours: 8.3, restingHr: 56, quality: 5 }, { date: '2026-11-23', hours: 7.2, restingHr: 57, quality: 4 }, { date: '2026-11-24', hours: 6.9, restingHr: 58, quality: 3 }], checkins: [{ date: '2026-11-23', energy: 4, soreness: 3, stress: 3 }], history: [{ id: 'h', date: '2026-11-23', volume: 12053 }], today: { kind: 'rest', nextName: 'Oberkörper A' } } },
  render: function ReadinessCard({ props, data, setData, ctx }) {
    const sleep = data.sleep || []; const today = isoDay(ctx.today);
    if (!sleep.length && props.quietEmpty) return null;
    if (!sleep.length) return html`<${Card} title=${props.title}><${EmptyState} icon="bed" title="Noch keine Schlafdaten" text="Trage deinen Schlaf ein oder verbinde eine Quelle – dann erscheinen hier deine Faktoren." /><//>`;
    const { factors, checkedIn } = recoveryFactors({ sleep, checkins: data.checkins || [], history: data.history || [], todayIso: today });
    const adv = recoveryAdvice(factors, { restDay: data.today?.kind !== 'strength', nextName: data.today?.nextName || 'Dein nächstes Training' });
    const cur = (data.checkins || []).find((c) => c.date === today) || { date: today, energy: null, soreness: null, stress: null };
    const set = (k, v) => { const next = { ...cur, [k]: v }; for (const [kk] of ROWS) if (next[kk] == null) next[kk] = { energy: 3, soreness: 2, stress: 2 }[kk]; setData('checkins', (a) => [...(Array.isArray(a) ? a.filter((x) => x.date !== today) : []), next]); ctx.emit('recovery.checkin', { [k]: v }); };
    const explain = () => { ctx.emit('recovery.explain'); ctx.openDialog({ title: 'So kommt die Empfehlung zustande', body: () => html`<div class="tk-col" style="gap:8px"><p>Jeder Faktor wird einzeln bewertet: Schlaf (Ziel 7,5 Std.), Ruhepuls gegenüber deinem 2-Wochen-Schnitt, Muskelkater, Energie und Stress aus dem Check-in sowie die Belastung der letzten 7 Tage. Zwei oder mehr auffällige Faktoren führen zu „eher leicht“.</p><p class="tk-muted">Orientierung auf Basis deiner Eingaben, keine medizinische Diagnose. Bei anhaltend erhöhtem Ruhepuls oder Beschwerden bitte ärztlich abklären.</p></div>`, footer: (close) => html`<${Button} variant="primary" onClick=${close}>Verstanden<//>` }); };
    return html`<${Card} title=${props.layout === 'decision' ? undefined : props.title} icon=${props.layout === 'decision' ? undefined : 'bed'}><div class=${`tk-rd tk-rd--${props.layout}`} data-qa="readiness">
      <div class="tk-rd__answer" data-tone=${adv.tone}><span class="tk-rd__ico" style=${`color:var(--tk-c-${adv.tone})`}><${Icon} name=${adv.level === 'go' ? 'battery-full' : adv.level === 'ease' ? 'sun-medium' : 'moon'} size=${24} /></span>
        <div class="tk-grow"><div class="tk-label" style="margin-bottom:4px;color:var(--tk-c-text-muted)">${props.layout === 'decision' ? 'Heute trainieren?' : 'Empfehlung'}</div><div class="tk-rd__t">${adv.title}</div><p class="tk-muted" style="margin-top:6px;font-size:var(--tk-fs-sm)">${adv.text}</p></div></div>
      ${props.showFactors && html`<div class="tk-rd__fac">${factors.map((f) => html`<div class="tk-rd__f"><span style=${`color:var(--tk-c-${LEVEL[f.level].tone === 'neutral' ? 'text-subtle' : LEVEL[f.level].tone})`}><${Icon} name=${LEVEL[f.level].icon} size=${18} /></span><div class="tk-grow" style="min-width:0"><strong class="tk-truncate">${f.label}: ${f.value}</strong><small>${f.note}</small></div></div>`)}</div>`}
      ${props.showCheckin && html`<div class="tk-rd__ci"><div class="tk-row"><span class="tk-label tk-grow">Check-in ${checkedIn ? '· erledigt' : '· 3 Taps'}</span>${checkedIn && html`<${Badge} tone="success" icon="check">Heute eingetragen<//>`}</div>
        ${ROWS.map(([k, l]) => html`<div class="tk-col" style="gap:4px" role="radiogroup" aria-label=${l}><span style="font-size:var(--tk-fs-sm);font-weight:600">${l}</span><div class="tk-rd__scale">${CHECKIN_SCALES[k].map((txt, i) => html`<button type="button" role="radio" aria-checked=${String(cur[k] === i + 1)} aria-label=${`${l}: ${txt}`} onClick=${() => set(k, i + 1)}>${txt}</button>`)}</div></div>`)}</div>`}
      <div class="tk-row" style="gap:8px;flex-wrap:wrap"><span class="tk-subtle tk-grow" style="font-size:var(--tk-fs-xs)">Orientierung, keine medizinische Diagnose.</span>${props.openEvent && html`<${Button} size="sm" icon="bed" onClick=${() => ctx.emit(props.openEvent)}>Details<//>`}${props.layout === 'decision' && html`<${Button} size="sm" icon="calendar-days" onClick=${() => ctx.emit('plan.open')}>Plan<//>`}<${Button} size="sm" icon="info" onClick=${explain}>Warum?<//></div></div><//>`;
  },
};
export default [readinessCard];
