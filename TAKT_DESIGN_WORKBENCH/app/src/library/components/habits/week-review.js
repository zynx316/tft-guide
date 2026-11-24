// Start / Gewohnheiten: Wochenrückblick – automatisch zusammengestellte Kennzahlen, Highlights und drei Fragen zum Mitnehmen.
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Card, Button, Badge, EmptyState, Icon, Segmented, Textarea, Delta, toneColor } from '../../ui.js';
import { money, percent } from '../../helpers.js';
import { list, todayKey, shift, weekStart, isScheduled, isDone, isPaused, isPerWeek, perWeek, weekCount, streakOf, dayLabel } from './_habits.js';
import { linked } from './_today.js';

const Q = { all: ['Was lief gut?', 'Was hat Zeit gefressen?', 'Worauf liegt der Fokus nächste Woche?'], habits: ['Was hat geholfen?', 'Was war schwer?', 'Eine kleine Änderung für nächste Woche?'] };
const SAMPLE = { stats: [{ key: 'tasks', label: 'Aufgaben erledigt', value: 31, prev: 26, icon: 'list-checks', tone: 'warning' }, { key: 'focus', label: 'Fokuszeit', value: 11.5, unit: 'h', prev: 9.8, icon: 'target', tone: 'success', module: 'calendar' }],
  habits: [{ id: 'a', name: 'Vitamin D', icon: 'pill', tone: 4, rhythm: { type: 'daily' }, since: '2026-09-01', log: { '2026-11-16': 1, '2026-11-17': 1, '2026-11-18': 1, '2026-11-19': 1, '2026-11-21': 1, '2026-11-22': 1 } }],
  finance: { savingsRate: 0.34 }, budgets: [{ id: 'b', label: 'Freizeit', value: 112, target: 150 }, { id: 'c', label: 'Lebensmittel', value: 301, target: 450 }] };

/** Quote einer Gewohnheit in einer Woche (ws = Montag), nur bis heute. */
function weekRate(h, ws, today) {
  if (isPerWeek(h)) return { done: Math.min(weekCount(h, ws), perWeek(h)), due: perWeek(h) };
  let done = 0, due = 0;
  for (let i = 0; i < 7; i++) { const k = shift(ws, i); if (k > today || (h.since && k < h.since) || !isScheduled(h, k) || isPaused(h, k)) continue; due++; if (isDone(h, k)) done++; }
  return { done, due };
}

export const weekReview = {
  id: 'week-review',
  name: 'Wochenrückblick',
  category: 'Start',
  description: 'Rückblick auf die Woche, automatisch aus den Modulen zusammengestellt: Kennzahlen mit Vergleich zur Vorwoche, Highlights und drei Fragen, die sich als Notiz sichern lassen. Umfang „Alles“ (Aufgaben, Fokuszeit, Training, Gewohnheiten, Budget, Sparquote, Shop) oder „Gewohnheiten“.',
  version: '1.0',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Wochenrückblick' },
    { name: 'scope', label: 'Umfang', type: 'select', options: ['all', 'habits'], default: 'all' },
    { name: 'style', label: 'Stil', type: 'select', options: ['cards', 'list'], default: 'cards' },
    { name: 'showQuestions', label: 'Fragen zeigen', type: 'boolean', default: true },
  ],
  data: [
    { slot: 'stats', label: 'Wochenwerte', default: 'stats', shape: '{key,label,value,unit?,prev?,money?,icon,tone,module?,invert?}[]', required: false },
    { slot: 'habits', label: 'Gewohnheiten', default: 'habits', shape: 'siehe habit-list', required: false },
    { slot: 'finance', label: 'Finanzkennzahlen', default: 'finance', shape: '{savingsRate}', required: false },
    { slot: 'budgets', label: 'Budgets', default: 'budgets', shape: '{id,label,value,target}[]', required: false },
  ],
  events: ['review.open.tasks', 'review.open.calendar', 'review.open.habits', 'review.open.finance', 'review.open.savings', 'review.open.training', 'review.week', 'review.save'],
  states: ['empty'],
  css: `
  .tk-wr__top { display:flex; align-items:center; gap:10px; flex-wrap:wrap; padding:14px 16px 4px; } .tk-wr__top .tk-card__title { flex:1; min-width:120px; }
  .tk-wr__grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(190px, 1fr)); gap:var(--tk-space-3); padding:var(--tk-space-3) var(--tk-space-4) var(--tk-space-4); } .bp-mobile .tk-wr__grid { grid-template-columns:repeat(2, minmax(0, 1fr)); padding:var(--tk-space-3); gap:var(--tk-space-2); }
  .tk-wr__c { display:flex; flex-direction:column; gap:6px; padding:14px; border-radius:var(--tk-radius-lg); border:1px solid var(--tk-c-border); background:var(--tk-c-surface2); text-align:left; color:inherit; font:inherit; cursor:pointer; min-width:0; min-height:44px; } .tk-wr__c:hover { border-color:var(--tk-c-border-strong); }
  .tk-wr__cl { display:flex; align-items:center; gap:6px; font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); min-width:0; } .tk-wr__cv { font-size:var(--tk-fs-2xl); font-weight:var(--tk-fw-bold); letter-spacing:var(--tk-ls-tight); font-variant-numeric:tabular-nums; line-height:1.1; } .tk-wr__cv small { font-size:var(--tk-fs-md); color:var(--tk-c-text-muted); margin-left:3px; } .tk-wr__cs { font-size:var(--tk-fs-xs); color:var(--tk-c-text-subtle); }
  .tk-wr__row { display:flex; align-items:center; gap:12px; width:100%; padding:10px 16px; min-height:52px; border:0; border-top:1px solid var(--tk-c-border); background:none; color:inherit; font:inherit; text-align:left; cursor:pointer; min-width:0; } .tk-wr__row:hover { background:var(--tk-c-surface2); } .tk-wr__row b { font-variant-numeric:tabular-nums; white-space:nowrap; }
  .tk-wr__hl { margin:0 16px 14px; padding:12px 14px; border-radius:var(--tk-radius-md); background:var(--tk-c-accent-soft); display:flex; flex-direction:column; gap:6px; font-size:var(--tk-fs-sm); } .tk-wr__hl b { display:inline-flex; align-items:center; gap:6px; } .tk-wr__hl div { display:flex; gap:8px; align-items:flex-start; }
  .tk-wr__q { padding:4px 16px 16px; display:flex; flex-direction:column; gap:12px; border-top:1px solid var(--tk-c-border); padding-top:14px; } .tk-wr__q label { display:flex; flex-direction:column; gap:6px; font-weight:var(--tk-fw-medium); font-size:var(--tk-fs-sm); } .tk-wr__q .tk-textarea { min-height:64px; }`,
  example: { data: SAMPLE },
  render: function WeekReview({ props, data, ctx }) {
    const [last, setLast] = useState(true), [ans, setAns] = useState(['', '', '']), [saved, setSaved] = useState(false);
    const habits = list(data.habits), stats = Array.isArray(data.stats) ? data.stats : [], bud = Array.isArray(data.budgets) ? data.budgets : [], today = todayKey(ctx);
    const ws = last ? shift(weekStart(today), -7) : weekStart(today), we = last ? shift(ws, 6) : today;
    const range = `${dayLabel(ws)} – ${dayLabel(we)}`;
    const head = html`<div class="tk-wr__top"><h3 class="tk-card__title">${props.title}</h3><${Segmented} label="Woche" value=${last ? 'last' : 'now'} onChange=${(v) => { setLast(v === 'last'); ctx.emit('review.week', { week: v }); }} options=${[{ value: 'last', label: 'Letzte Woche' }, { value: 'now', label: 'Diese Woche' }]} /></div><div class="tk-subtle" style="padding:0 16px 4px;font-size:var(--tk-fs-sm)">${range}</div>`;
    const per = habits.map((h) => ({ h, ...weekRate(h, ws, today), st: streakOf(h, today) }));
    const tot = per.reduce((a, p) => ({ done: a.done + p.done, due: a.due + p.due }), { done: 0, due: 0 });
    if (!stats.length && !habits.length) return html`<${Card} title=${props.title}><${EmptyState} icon="calendar-check" title="Noch kein Rückblick" text="Nach der ersten Woche stellt TAKT hier automatisch zusammen, was gut lief." /><//>`;
    const rate = tot.due ? tot.done / tot.due : 0;
    const cards = [];
    if (props.scope === 'all') {
      stats.forEach((s) => cards.push({ ...s, text: s.money ? money(ctx, s.value, { digits: 0 }) : String(s.value).replace('.', ','), unit: s.money ? '' : s.unit, delta: s.prev ? Math.round(((s.value - s.prev) / s.prev) * 100) : null, open: s.module || s.key }));
      const tk = linked(habits, 'fitness'); if (tk) cards.push({ key: 'training', label: 'Training', text: `${Math.min(weekCount(tk, ws), perWeek(tk))} von ${perWeek(tk)}`, icon: 'dumbbell', tone: 6, sub: 'Wochenziel', open: 'training' });
      cards.push({ key: 'habits', label: 'Gewohnheiten', text: `${Math.round(rate * 100)} %`, icon: 'repeat', tone: 'success', sub: `${tot.done} von ${tot.due} Tagen`, open: 'habits' });
      if (bud.length) { const v = bud.reduce((a, b) => a + b.value, 0), t = bud.reduce((a, b) => a + b.target, 0), worst = [...bud].sort((a, b) => b.value / b.target - a.value / a.target)[0]; cards.push({ key: 'budget', label: 'Budgets (Nov.)', text: percent(ctx, v / t, { sign: false, digits: 0 }), icon: 'wallet', tone: 'accent2', sub: `Enger: ${worst.label}`, open: 'finance' }); }
      if (data.finance?.savingsRate != null) cards.push({ key: 'sparen', label: 'Sparquote (Nov.)', text: percent(ctx, data.finance.savingsRate, { sign: false, digits: 0 }), icon: 'piggy-bank', tone: 3, sub: 'vom Einkommen', open: 'savings' });
    } else {
      const sorted = [...per].filter((p) => p.due).sort((a, b) => b.done / b.due - a.done / a.due), best = sorted[0], low = sorted[sorted.length - 1], long = [...per].sort((a, b) => b.st.current - a.st.current)[0];
      const jk = per.reduce((n, p) => n + [...p.st.jokers].filter((k) => k >= ws && k <= we).length, 0), pz = habits.reduce((n, h) => n + (h.pauses || []).filter((k) => k >= ws && k <= we).length, 0);
      cards.push({ key: 'rate', label: 'Erfüllungsquote', text: `${Math.round(rate * 100)} %`, icon: 'repeat', tone: 'success', sub: `${tot.done} von ${tot.due} Tagen`, open: 'habits' });
      if (best) cards.push({ key: 'best', label: 'Am besten', text: best.h.name, icon: 'trophy', tone: 'accent', sub: `${best.done} von ${best.due}`, open: 'habits', small: true });
      if (low && low !== best) cards.push({ key: 'low', label: 'Braucht Aufmerksamkeit', text: low.h.name, icon: 'leaf', tone: 'info', sub: `${low.done} von ${low.due} – alles gut`, open: 'habits', small: true });
      if (long) cards.push({ key: 'streak', label: 'Längste Serie', text: `${long.st.current}`, unit: long.st.unit, icon: 'flame', tone: 'accent2', sub: long.h.name, open: 'habits' });
      cards.push({ key: 'joker', label: 'Gnadentage genutzt', text: String(jk), icon: 'shield', tone: 'accent', sub: pz ? `${pz} Pausentage` : 'Serien blieben heil', open: 'habits' });
    }
    const hl = []; const long = [...per].sort((a, b) => b.st.current - a.st.current)[0];
    if (long && long.st.current >= 7) hl.push(`${long.h.name}: ${long.st.current} ${long.st.unit} in Folge.`);
    const full = per.filter((p) => p.due && p.done >= p.due); if (full.length) hl.push(`Voll erfüllt: ${full.map((p) => p.h.name).join(', ')}.`);
    const open = (c) => ctx.emit(`review.open.${c.open}`, { id: c.key });
    const save = () => { setSaved(true); ctx.emit('review.save', { answers: ans.filter(Boolean).length }); ctx.toast('Als Notiz im Journal gespeichert'); };
    const body = props.style === 'list'
      ? html`<div style="margin-top:8px">${cards.map((c) => html`<button type="button" class="tk-wr__row" onClick=${() => open(c)}><span style=${`color:${toneColor(c.tone)}`}><${Icon} name=${c.icon} size=${17} /></span><span class="tk-grow tk-truncate">${c.label}</span><span class="tk-subtle tk-truncate" style="font-size:var(--tk-fs-sm);max-width:40%">${c.sub || ''}</span><b>${c.text}${c.unit ? ` ${c.unit}` : ''}</b>${c.delta != null && html`<${Delta} value=${c.delta} />`}</button>`)}</div>`
      : html`<div class="tk-wr__grid">${cards.map((c) => html`<button type="button" class="tk-wr__c" onClick=${() => open(c)}><span class="tk-wr__cl"><span style=${`color:${toneColor(c.tone)}`}><${Icon} name=${c.icon} size=${15} /></span><span class="tk-truncate">${c.label}</span></span>
        <span class="tk-wr__cv" style=${c.small ? 'font-size:var(--tk-fs-lg)' : ''}>${c.text}${c.unit && html`<small>${c.unit}</small>`}</span>${c.delta != null ? html`<span class="tk-row" style="gap:6px"><${Delta} value=${c.delta} /><span class="tk-wr__cs">zur Vorwoche</span></span>` : html`<span class="tk-wr__cs tk-truncate">${c.sub}</span>`}</button>`)}</div>`;
    return html`<${Card} flush>${head}${body}
      ${hl.length > 0 && html`<div class="tk-wr__hl" role="note"><b><${Icon} name="sparkles" size=${14} /> Highlights</b>${hl.map((t) => html`<div><${Icon} name="check" size=${14} /><span>${t}</span></div>`)}</div>`}
      ${props.showQuestions && html`<div class="tk-wr__q">${Q[props.scope].map((q, i) => html`<label>${q}<${Textarea} value=${ans[i]} onInput=${(v) => { setAns((a) => a.map((x, j) => (j === i ? v : x))); setSaved(false); }} placeholder="Ein, zwei Sätze genügen" /></label>`)}
        <div class="tk-row" style="justify-content:space-between;flex-wrap:wrap;gap:8px"><span class="tk-subtle" style="font-size:var(--tk-fs-sm)">${saved ? 'Gespeichert im Journal' : 'Optional – nur für dich'}</span><${Button} variant="primary" icon=${saved ? 'check' : 'save'} onClick=${save} disabled=${saved || !ans.some(Boolean)}>${saved ? 'Gespeichert' : 'Als Notiz sichern'}<//></div></div>`}<//>`;
  },
};
export default weekReview;
