// Ziele: Monatsrückblick – was sich im Monat bewegt hat (aus den Quellen berechnet), drei Fragen, als Notiz sichern. Ohne Bewertung.
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Card, Button, Icon, EmptyState, Textarea, Ring } from '../../ui.js';
import { fmtWeight, fmtNumber, fmtDate } from '../../../lib/format.js';
import { MONTHS_LONG } from '../../../lib/date.js';
import { money } from '../../helpers.js';
import { GOAL_SLOTS, GL_CSS, useViews, openGoal, StateBadge, AreaTag, hidden, todayIso } from './_goals.js';
import { monthDelta, monthStartIso } from './_calc.js';
import { EXAMPLE } from './_example.js';

/** Veränderung im Monat als ruhiger Satzteil. */
export function deltaText(ctx, v, d) {
  if (!d) return 'Noch kein Vergleich möglich';
  const n = d.value;
  if (d.mode === 'steps') return n ? `${n} ${n === 1 ? 'Schritt' : 'Schritte'} erledigt` : 'Kein Schritt in diesem Monat';
  if (d.mode === 'sessions') return `${n} ${n === 1 ? 'Einheit' : 'Einheiten'} in diesem Monat`;
  if (d.mode === 'window') return `Letzte 30 Tage: ${money(ctx, v.current, { digits: 0 })}`;
  if (!n) return 'Unverändert';
  if (v.kind === 'amount') return `${money(ctx, n, { sign: true, digits: 0 })} seit Monatsbeginn`;
  if (v.kind === 'weight') return hidden(v) ? 'Der Trend hat sich verändert' : `${fmtWeight(n, { sign: true })} im Trend`;
  if (v.kind === 'streak') return `${fmtNumber(n, { digits: 0, sign: true })} Tage Serie`;
  return `${fmtNumber(n, { digits: 0, sign: true })} ${v.unit}`;
}

export const goalReview = {
  id: 'goal-review',
  name: 'Monatsrückblick',
  category: 'Ziele',
  description: 'Was sich in diesem Monat bei deinen Zielen bewegt hat, aus den Quellen berechnet (Beträge, Trend, Training, Serien, Schritte), dazu drei ruhige Fragen und „Als Notiz sichern“. Keine Punkte, keine Wertung: Stillstand ist eine Information, kein Fehler.',
  version: '1.1',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Monatsrückblick' },
    { name: 'showQuestions', label: 'Fragen zum Mitnehmen', type: 'boolean', default: true },
  ],
  data: [...GOAL_SLOTS, { slot: 'notes', label: 'Notizen (Rückblick sichern)', default: 'notes', shape: '{id,title,body,tags,updated}[]' }],
  events: ['goal.open', 'review.save'],
  states: ['empty'],
  flutter: { widget: 'TaktGoalReview', propMap: { title: 'title', showQuestions: 'showQuestions' }, events: { 'goal.open': 'onOpenGoal', 'review.save': 'onSave' } },
  css: `${GL_CSS}
  .tk-gl-rv__ti { margin:0; font-size:var(--tk-fs-lg); letter-spacing:var(--tk-ls-tight); overflow-wrap:anywhere; }
  [data-tk-large-text] .tk-gl-rv__row { grid-template-columns:minmax(0,1fr); justify-items:start; } [data-tk-large-text] .tk-gl-rv__d { overflow-wrap:anywhere; }
  .tk-gl-rv { display:flex; flex-direction:column; gap:var(--tk-space-4); } .tk-gl-rv__sum { display:flex; gap:16px; align-items:center; flex-wrap:wrap; padding:16px; border-radius:var(--tk-radius-lg); background:var(--tk-c-surface2); border:1px solid var(--tk-c-border); }
  .tk-gl-rv__sum > div:last-child { flex:1 1 200px; min-width:0; } .tk-gl-rv__sum h3 { margin:0; font-size:var(--tk-fs-xl); letter-spacing:var(--tk-ls-tight); overflow-wrap:break-word; hyphens:auto; } .tk-gl-rv__sum p { margin:4px 0 0; color:var(--tk-c-text-muted); font-size:var(--tk-fs-sm); }
  .tk-gl-rv__row { all:unset; box-sizing:border-box; display:grid; grid-template-columns:minmax(0,1fr) auto; gap:4px 12px; align-items:center; padding:10px 4px; min-height:60px; border-bottom:1px solid var(--tk-c-border); cursor:pointer; width:100%; min-width:0; } .tk-gl-rv__row:last-child { border-bottom:0; } .tk-gl-rv__row:focus-visible { outline:2px solid var(--tk-c-focus); outline-offset:-2px; }
  .tk-gl-rv__b { grid-column:1 / -1; min-width:0; display:flex; flex-direction:column; gap:2px; } .tk-gl-rv__b b { font-weight:var(--tk-fw-medium); overflow-wrap:anywhere; } .tk-gl-rv__d { text-align:left; overflow-wrap:anywhere; font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); min-width:0; font-variant-numeric:tabular-nums; }
  .tk-gl-rv__q { display:flex; flex-direction:column; gap:6px; } .tk-gl-rv__q label { font-weight:var(--tk-fw-medium); font-size:var(--tk-fs-sm); } .tk-gl-rv__act { display:flex; justify-content:flex-end; gap:8px; flex-wrap:wrap; } .bp-mobile .tk-gl-rv__act .tk-btn { min-height:44px; }
`,
  example: { data: EXAMPLE },
  render: function GoalReview({ props, data, setData, ctx }) {
    const { views, today } = useViews(data, ctx);
    const [ans, setAns] = useState(['', '', '']);
    const [saved, setSaved] = useState(false);
    if (!views.length) return html`<${Card} title=${props.title}><${EmptyState} icon="calendar-check" title="Noch nichts zum Zurückblicken" text="Sobald du Ziele hast, zeigt dir TAKT hier am Monatsende, was sich bewegt hat." action=${html`<${Button} variant="primary" icon="plus" onClick=${() => ctx.emit('goal.create.open')}>Erstes Ziel anlegen<//>`} /><//>`;
    const ms = monthStartIso(today), month = `${MONTHS_LONG[Number(ms.slice(5, 7)) - 1]} ${ms.slice(0, 4)}`;
    const rows = views.map((v) => ({ v, d: monthDelta(v, ms) }));
    const moved = rows.filter((r) => r.d && (r.d.mode === 'diff' || r.d.mode === 'window' ? r.d.value !== 0 : r.d.value > 0)).length;
    const reached = views.reduce((s, v) => s + v.milestones.filter((m) => m.done && m.doneAt && m.doneAt >= ms).length, 0);
    const Q = ['Was hat geholfen?', 'Was war schwer?', 'Eine kleine Änderung für den nächsten Monat?'];
    const canSave = ans.some((a) => a.trim());
    const save = () => {
      const body = [`# ${props.title} ${month}`, '', ...rows.map(({ v, d }) => `- ${v.title}: ${deltaText({ ...ctx, privacy: false }, v, d)}`), '', ...Q.flatMap((q, i) => (ans[i].trim() ? [`**${q}**`, ans[i].trim(), ''] : []))].join('\n');
      setData('notes', (xs) => [{ id: ctx.newId('n'), title: `Zielrückblick ${month}`, body, tags: ['Ziele'], pinned: false, updated: `${todayIso(ctx)}T${String(ctx.today.getHours()).padStart(2, '0')}:${String(ctx.today.getMinutes()).padStart(2, '0')}:00` }, ...(Array.isArray(xs) ? xs : [])]);
      ctx.emit('review.save', { month }); ctx.toast('Rückblick als Notiz gesichert'); setSaved(true);
    };
    return html`<${Card}><div class="tk-gl-rv"><h3 class="tk-gl-rv__ti">${props.title} · ${month}</h3>
      <div class="tk-gl-rv__sum"><${Ring} value=${views.length ? moved / views.length : 0} size=${72} stroke=${8} tone="accent" label=${`${moved} von ${views.length} Zielen bewegt`}><span class="tk-gl-num" style="font-weight:600">${moved}/${views.length}</span><//>
        <div><h3>${moved} von ${views.length} Zielen sind vorangekommen</h3><p>${reached ? `${reached} ${reached === 1 ? 'Meilenstein' : 'Meilensteine'} erreicht. ` : ''}Der Monat ist noch nicht zu Ende, der Stand ist von ${fmtDate(ctx.today, { style: 'weekday' })}</p></div></div>
      <div>${rows.map(({ v, d }) => html`<button type="button" class="tk-gl-rv__row" onClick=${() => openGoal(ctx, v)} aria-label=${`${v.title}: ${deltaText(ctx, v, d)}. Öffnen`}><span class="tk-gl-rv__b"><${AreaTag} v=${v} /><b>${v.title}</b></span><span class="tk-gl-rv__d">${deltaText(ctx, v, d)}</span><${StateBadge} v=${v} /></button>`)}</div>
      ${props.showQuestions && html`<div class="tk-gl-rv__q">${Q.map((q, i) => html`<label for=${`rv-q${i}`}>${q}</label><${Textarea} id=${`rv-q${i}`} rows="2" value=${ans[i]} placeholder="optional, ein bis zwei Sätze" onInput=${(val) => { setSaved(false); setAns((a) => a.map((x, j) => (j === i ? val : x))); }} />`)}</div>`}
      <div class="tk-gl-rv__act">${saved && html`<span class="tk-gl-note" style="align-self:center"><${Icon} name="check" size=${14} /> Gesichert</span>`}<${Button} variant="primary" icon="notebook-pen" onClick=${save} disabled=${props.showQuestions && !canSave}>Als Notiz sichern<//></div></div><//>`;
  },
};
export default goalReview;
