// Ziele: gemeinsame UI-Helfer (Datenslots, Texte, kleine Bausteine, CSS). Rechenlogik steht in _calc.js.
import { html } from '../../../lib/html.js';
import { isoDay } from '../../../lib/util.js';
import { fmtWeight, fmtNumber, fmtDate, NBSP } from '../../../lib/format.js';
import { MONTHS_LONG } from '../../../lib/date.js';
import { Icon, Badge, toneColor } from '../../ui.js';
import { money } from '../../helpers.js';
import { sourcesOf, deriveAll, AREAS, STATE_TONE, diffDays, toggleFocus } from './_calc.js';

export const GOAL_SLOTS = [
  { slot: 'goals', label: 'Ziele', default: 'goals', shape: '{id,title,why,area,since,due?,focus?,source,milestones[],snapshots?,measure?}[]', required: true },
  { slot: 'areas', label: 'Lebensbereiche', default: 'areas', shape: '{id,name,icon,tone}[]' },
  { slot: 'tasks', label: 'Aufgaben (Quelle)', default: 'tasks', shape: '{id,title,due?,done?,status?}[]' },
  { slot: 'savingsGoals', label: 'Sparziele (Quelle)', default: 'savingsGoals', shape: '{id,current,target,due,monthly,paused?}[]' },
  { slot: 'savingsPlans', label: 'Sparpläne (Quelle, für Prognose und Verlauf)', default: 'savingsPlans', shape: '{id,goalId,monthly,active,startDate,intervalMonths,expectedReturnPa?}[]' },
  { slot: 'bodySummary', label: 'Körper-Zusammenfassung (Quelle)', default: 'bodySummary', shape: '{startKg,goalKg,trendKg,…}' },
  { slot: 'bodyWeightLog', label: 'Gewichtsverlauf (Quelle)', default: 'bodyWeightLog', shape: '{date,kg}[]' },
  { slot: 'fitnessProfile', label: 'Fitness-Profil (Quelle)', default: 'fitnessProfile', shape: '{weeklyGoal,…}' },
  { slot: 'weeklyTraining', label: 'Trainingswochen (Quelle)', default: 'weeklyTraining', shape: '{week,sessions,goal,current}[]' },
  { slot: 'fitnessStreak', label: 'Trainingsserie (Quelle)', default: 'fitnessStreak', shape: '{weeks,jokersLeft}' },
  { slot: 'channels', label: 'Verkaufskanäle (Quelle)', default: 'channels', shape: '{id,revenue,trend[]}[]' },
  { slot: 'habits', label: 'Gewohnheiten (Quelle)', default: 'habits', shape: '{id,log,since,rhythm,goal?}[]' },
];
export const todayIso = (ctx) => isoDay(ctx.today);
export function useViews(data, ctx) {
  const today = todayIso(ctx), src = sourcesOf(data, today);
  const raw = Array.isArray(data.goals) ? data.goals : [];
  // „Werte ausblenden“ aus Fitness gilt app-weit (prefs.health.hideWeight, wie fitness/_ui.js weightHidden) auch für Körperziele hier.
  const hideWeight = !!(ctx.world?.get?.('prefs')?.health?.hideWeight ?? ctx.ui?.hideWeight);
  const views = deriveAll(raw, src).map((v) => (v.kind === 'weight' && hideWeight && !v.numbersHidden ? { ...v, numbersHidden: true } : v));
  return { today, src, raw, areas: src.areas, views };
}
export const setGoals = (setData, fn) => setData('goals', (xs) => fn(Array.isArray(xs) ? xs : []));
export const patchGoal = (setData, id, patch) => setGoals(setData, (xs) => xs.map((g) => (g.id === id ? { ...g, ...(typeof patch === 'function' ? patch(g) : patch) } : g)));

// ------------------------------------------------------------------ Texte
const monthYear = (iso) => { const [y, m] = iso.split('-').map(Number); return `${MONTHS_LONG[m - 1]} ${y}`; };
const eur = (ctx, x) => money(ctx, x, { digits: 0 });
export const hidden = (v) => !!v.numbersHidden;
/** Große Zahl (Ring, Kopf). */
export function bigValue(ctx, v) {
  if (hidden(v)) return `${Math.round(v.progress * 100)}${NBSP}%`;
  if (v.kind === 'amount') return eur(ctx, v.current);
  if (v.kind === 'weight') return fmtWeight(v.current);
  if (v.kind === 'weekly' || v.kind === 'checklist') return `${v.current}/${v.target}`;
  return fmtNumber(v.current, { digits: 0 });
}
/** Zeile „x von y“. */
export function valueLine(ctx, v) {
  if (hidden(v)) return 'Trend zeigt in Richtung Ziel';
  if (v.kind === 'amount') return `${eur(ctx, v.current)} von ${eur(ctx, v.target)}`;
  if (v.kind === 'weight') return `${fmtWeight(v.current)} Trend · Ziel ${fmtWeight(v.target)}`;
  if (v.kind === 'weekly') return `${v.current} von ${v.target} diese Woche`;
  if (v.kind === 'checklist') return `${v.current} von ${v.target} Schritten`;
  if (v.kind === 'streak') return `${v.current} von ${v.target} Tagen`;
  return `${fmtNumber(v.current, { digits: 0 })} von ${fmtNumber(v.target, { digits: 0 })} ${v.unit}`.trim();
}
export const valueOf = (ctx, v, x) => (v.kind === 'amount' ? eur(ctx, x) : v.kind === 'weight' ? (hidden(v) ? '•••' : fmtWeight(x)) : fmtNumber(x, { digits: v.kind === 'weight' ? 1 : 0 }));
/** Frist als Satzteil („bis 27.11.2026 · in 3 Tagen“). */
export function dueLine(v) {
  if (!v.due) return v.rolling ? 'laufend, letzte 30 Tage' : 'laufend';
  const n = v.daysLeft;
  const rel = n == null ? '' : n === 0 ? 'heute' : n === 1 ? 'morgen' : n > 1 ? `noch ${n} Tage` : `seit ${-n} Tagen`;
  return `bis ${fmtDate(v.due)}${rel && v.state !== 'done' ? ` · ${rel}` : ''}`;
}
/** Ein ruhiger Satz zum Stand: Konjunktiv bei Prognosen, Annahme genannt, keine Wertung. */
export function forecastLine(ctx, v) {
  if (v.state === 'done') return 'Ziel erreicht.';
  if (v.kind === 'weight') return hidden(v) ? 'Die Zahlen sind ausgeblendet. Der Trend wird weiter verfolgt.' : `Der Trend sinkt um etwa ${fmtNumber(v.perWeek ?? 0, { digits: 1 })} kg pro Woche. Bei diesem Tempo wäre das Ziel etwa im ${v.eta ? monthYear(v.eta) : '–'} erreicht (Annahme: der Trend hält).`;
  if (v.kind === 'weekly') return `Serie: ${v.streakWeeks} Wochen in Folge${v.jokersLeft ? ', ein Pausenjoker ist übrig' : ''}. Die laufende Woche zählt erst am Sonntag.`;
  if (v.kind === 'checklist') { const open = v.target - v.current; return open ? `${open} ${open === 1 ? 'Schritt' : 'Schritte'} offen${v.due ? ` bis ${fmtDate(v.due)}` : ''}.` : 'Alle Schritte erledigt.'; }
  if (v.kind === 'streak') return `Noch ${v.remaining} Tage bis ${v.target}. Ein ausgelassener Tag beendet nur die Serie, nicht den Verlauf.`;
  if (v.kind === 'amount' && v.rolling) return `Noch ${eur(ctx, v.remaining)} bis zum Monatsziel (Umsatz der letzten 30 Tage).`;
  if (v.kind === 'amount' && v.paused) return `Der Sparplan ruht${v.resume ? ` bis ${fmtDate(v.resume)}` : ''}. Der Stand bleibt erhalten.`;
  if (v.kind === 'amount' && v.eta) return `Bei der aktuellen Sparrate von ${eur(ctx, v.monthly)} pro Monat wäre das Ziel etwa im ${monthYear(v.eta)} erreicht${v.state === 'behind' && v.due ? `. Geplant ist ${fmtDate(v.due)}` : ''}. Ohne Rendite gerechnet.`;
  if (v.kind === 'amount') return v.needed ? `Mit etwa ${eur(ctx, v.needed)} pro Monat wäre das Ziel bis ${fmtDate(v.due)} erreichbar (ohne Rendite gerechnet). Aktuell gibt es keine Sparrate.` : 'Noch keine Sparrate eingetragen.';
  if (v.kind === 'count') return v.eta && v.state !== 'ahead' ? `Im bisherigen Tempo wäre das Ziel etwa im ${monthYear(v.eta)} erreicht${v.due ? `, geplant ist ${fmtDate(v.due)}` : ''}.` : `Noch ${fmtNumber(v.remaining, { digits: 0 })} ${v.unit}${v.due ? ` bis ${fmtDate(v.due)}` : ''}.`;
  return '';
}
export const nextTitle = (ctx, n) => (!n ? '' : n.amount ? `${n.title}: etwa ${eur(ctx, n.amount)} pro Monat` : n.title);

// ------------------------------------------------------------------ Navigation
export const openGoal = (ctx, v) => { ctx.setUi('selectedId', v.id); ctx.emit('goal.open', { id: v.id }); };
export const openSource = (ctx, v) => { const s = v.source; ctx.emit('source.open', { id: s.ref || s.link?.ref || v.id, to: s.link?.to || s.to }); };

// ------------------------------------------------------------------ Bausteine
export const StateBadge = ({ v }) => html`<${Badge} tone=${STATE_TONE[v.state] === 'accent2' ? 'neutral' : STATE_TONE[v.state]} dot=${true}>${v.stateLabel}<//>`;
export const AreaTag = ({ v }) => html`<span class="tk-gl-area" style=${`--gc:${toneColor(v.areaTone)}`}><${Icon} name=${v.areaIcon} size=${13} />${v.areaName}</span>`;
/** Quelle: Chip, der in das Quellmodul führt. */
export function SourceChip({ v, ctx, label }) {
  const s = v.source;
  return html`<button type="button" class="tk-gl-src" onClick=${(e) => { e.stopPropagation(); openSource(ctx, v); }} aria-label=${`Quelle: ${s.label}. Öffnen`}><${Icon} name="link-2" size=${12} /><span style="min-width:0;overflow-wrap:anywhere;text-align:left">${label || s.label}</span><${Icon} name="chevron-right" size=${12} /></button>`;
}
export const Bar = ({ value = 0, color = 'var(--tk-c-accent)' }) => html`<div class="tk-gl-bar" role="progressbar" aria-valuenow=${Math.round(Math.max(0, Math.min(1, value)) * 100)} aria-valuemin="0" aria-valuemax="100"><span style=${`width:${Math.max(0, Math.min(1, value)) * 100}%;background:${color}`}></span></div>`;
/** Zielmarke: Fortschrittsbalken mit Markierung, wo der Plan heute stünde. */
export const PlanBar = ({ v }) => html`<div class="tk-gl-planbar"><${Bar} value=${v.progress} color=${toneColor(v.areaTone)} />${v.expected != null && v.state !== 'done' && html`<i style=${`left:${Math.round(v.expected * 100)}%`} title="Hier stünde der Plan heute" aria-hidden="true"></i>`}</div>`;
export { toneColor, AREAS, diffDays };

// ------------------------------------------------------------------ Wochenfokus
export function toggleFocusUi(ctx, setData, raw, id) {
  const r = toggleFocus(raw, id);
  if (r.blocked) { ctx.toast(r.blocked.reason); ctx.emit('focus.blocked', { id }); return r; }
  setGoals(setData, () => r.goals);
  const on = !!r.goals.find((x) => x.id === id)?.focus;
  ctx.emit('focus.toggle', { id, focus: on }); ctx.toast(on ? 'Im Wochenfokus' : 'Aus dem Wochenfokus genommen');
  return r;
}
export const FocusBtn = ({ v, onToggle }) => html`<button type="button" class="tk-gl-fbtn" data-on=${!!v.focus} aria-pressed=${!!v.focus} aria-label=${v.focus ? `${v.title}: aus dem Wochenfokus nehmen` : `${v.title}: in den Wochenfokus`} title=${v.focus ? 'Im Wochenfokus' : 'In den Wochenfokus'} onClick=${(e) => { e.stopPropagation(); onToggle(v); }}><${Icon} name="star" size=${17} /></button>`;

export const GL_CSS = `
.tk-gl-fbtn { flex:none; width:40px; height:40px; display:grid; place-items:center; border:0; border-radius:50%; background:none; color:var(--tk-c-text-subtle); cursor:pointer; }
.tk-gl-fbtn:hover { background:var(--tk-c-surface2); color:var(--tk-c-text); } .tk-gl-fbtn[data-on="true"] { color:var(--tk-c-accent2); } .tk-gl-fbtn[data-on="true"] svg { fill:currentColor; fill-opacity:.25; }
.tk-gl-fbtn:focus-visible { outline:2px solid var(--tk-c-focus); } .bp-mobile .tk-gl-fbtn { width:44px; height:44px; }
.tk-gl-area { display:inline-flex; align-items:center; gap:5px; font-size:var(--tk-fs-xs); font-weight:var(--tk-fw-semibold); letter-spacing:var(--tk-ls-wide); text-transform:uppercase; color:var(--tk-c-text-muted); } .tk-gl-area svg { color:var(--gc, var(--tk-c-text-subtle)); }
.tk-gl-src { display:inline-flex; align-items:center; gap:5px; max-width:100%; min-height:32px; padding:4px 8px 4px 10px; border:1px solid var(--tk-c-border); border-radius:var(--tk-radius-md); background:var(--tk-c-surface); color:var(--tk-c-text-muted); font:inherit; font-size:var(--tk-fs-xs); cursor:pointer; min-width:0; }
.tk-gl-src:hover { border-color:var(--tk-c-border-strong); color:var(--tk-c-text); } .tk-gl-src:focus-visible { outline:2px solid var(--tk-c-focus); outline-offset:1px; }
.bp-mobile .tk-gl-src { min-height:44px; padding:0 12px; }
.tk-gl-bar { height:8px; border-radius:var(--tk-radius-pill); background:var(--tk-c-surface3); overflow:hidden; } .tk-gl-bar > span { display:block; height:100%; border-radius:inherit; min-width:2px; }
.tk-gl-planbar { position:relative; } .tk-gl-planbar > i { position:absolute; top:-3px; bottom:-3px; width:2px; margin-left:-1px; border-radius:1px; background:var(--tk-c-text-subtle); opacity:.7; }
.tk-gl-num { font-variant-numeric:tabular-nums; }
.tk-gl-note { font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); line-height:var(--tk-lh-snug); }
`;
