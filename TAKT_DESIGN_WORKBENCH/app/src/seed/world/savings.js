// Gemeinsame Datenwelt: Sparpläne – Kennzahlen, Hinweise, Suche, Mitteilungen.
// Die Daten selbst (savingsPlans, savingsGoals, savingsMonthlyTotal) stehen bis zum Umzug (Befund B9) in finance.js, die Schlüsselnamen bleiben.
// Alles hier ist aus diesen Daten abgeleitet. Sparpläne findet die globale Suche direkt aus der Sammlung `savingsPlans`; `savingsSearch` nennt die Sparziele.
import { savingsPlans, savingsGoals, savingsMonthlyTotal, accounts } from './finance.js';
import { eur, triple, TODAY, addDay, r2 } from './_util.js';

const giro = accounts.find((a) => a.type === 'giro');
const dd = (iso) => `${iso.slice(8, 10)}.${iso.slice(5, 7)}.`;
/** Nächste Ausführung eines monatlichen Plans nach dem Referenztag (Tag im Monat, nur einfache Monatsrhythmen). */
const nextRun = (p) => { const day = String(p.day).padStart(2, '0'); const thisMonth = `${TODAY.slice(0, 8)}${day}`; if (thisMonth > TODAY) return thisMonth; const d = new Date(`${TODAY.slice(0, 8)}01T12:00:00`); d.setMonth(d.getMonth() + (p.intervalMonths || 1)); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${day}`; };

function savingsSummaryOf(plans, total) {
  const active = plans.filter((p) => p.active);
  const next = active.map(nextRun).sort()[0];
  return { kpis: plans.length ? [
    { label: 'Sparpläne aktiv', value: `${active.length} von ${plans.length}`, icon: 'piggy-bank', tone: 'accent', to: 'savings.home' },
    { label: 'Sparrate/Monat', value: eur(total), icon: 'repeat', tone: 'success', to: 'savings.plans' },
    { label: 'Nächste Ausführung', value: next ? dd(next) : '–', icon: 'calendar-clock', tone: 'info', to: 'savings.calendar' },
  ] : [{ label: 'Sparpläne', value: 0, icon: 'piggy-bank', tone: 'neutral', to: 'savings.create' }] };
}
export const savingsSummary = savingsSummaryOf(savingsPlans, savingsMonthlyTotal);

const nextAll = savingsPlans.filter((p) => p.active).map(nextRun).sort()[0];
const dueThen = savingsPlans.filter((p) => p.active && nextRun(p) === nextAll).reduce((s, p) => s + p.monthly, 0);
export const savingsHints = [
  { id: 'h-sav-next', text: `Am ${dd(nextAll)} werden Sparpläne über ${eur(dueThen)} ausgeführt. Das Girokonto (${eur(giro.balance)}) deckt die Raten.`, source: 'savingsPlans', module: 'savings', tone: 'info', to: 'savings.calendar' },
  ...savingsPlans.filter((p) => !p.active && p.pausedUntil).map((p) => ({ id: `h-sav-pause-${p.id}`, text: `„${p.name}“ ist bis ${p.pausedUntil.slice(8, 10)}.${p.pausedUntil.slice(5, 7)}.${p.pausedUntil.slice(0, 4)} pausiert.`, source: `savingsPlans[${p.id}]`, module: 'savings', tone: 'neutral', to: 'savings.plan', carry: { selectedId: p.id } })),
];
export const savingsSearch = savingsGoals.map((g) => ({ id: `goal:${g.id}`, type: 'Sparziel', title: g.name, subtitle: `${eur(g.current)} von ${eur(g.target)}`, module: 'savings', to: 'savings.goals', params: { id: g.id } }));
export const savingsNotifications = [
  { id: 'n-sav', title: `Sparpläne werden am ${dd(nextAll)} ausgeführt`, text: `Raten über ${eur(dueThen)}. Das Girokonto deckt die Raten.`, module: 'savings', tone: 'info', priority: 'normal', time: `${addDay(TODAY, -1)}T18:00:00`, to: 'savings.calendar' },
];

export const scenarios = {
  erststart: { savingsSummary: savingsSummaryOf([], 0), savingsHints: [], savingsSearch: [], savingsNotifications: [] },
  stress: (() => { const plans = triple(savingsPlans); return { savingsSummary: savingsSummaryOf(plans, r2(plans.filter((p) => p.active).reduce((s, p) => s + p.monthly, 0))) }; })(),
};
