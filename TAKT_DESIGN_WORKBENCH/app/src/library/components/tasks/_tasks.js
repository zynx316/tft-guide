// Gemeinsame Aufgaben-Helfer: Fälligkeit relativ zu ctx.today, Priorität, Status, Filter, Erledigen.
import { html } from '../../../lib/html.js';
import { Icon, Badge, toneColor } from '../../ui.js';
import { applyUiFilter } from '../../helpers.js';

export const PRIORITY = {
  hoch: { label: 'Hoch', tone: 'danger', rank: 0 },
  mittel: { label: 'Mittel', tone: 'warning', rank: 1 },
  niedrig: { label: 'Niedrig', tone: 'neutral', rank: 2 },
};
export const STATUSES = ['Offen', 'In Arbeit', 'Review', 'Erledigt'];
export const TASK_REPEATS = ['Keine', 'Täglich', 'Werktags', 'Wöchentlich', 'Monatlich'];
export const prio = (t) => PRIORITY[t.priority] || PRIORITY.mittel;
export const GROUP_ORDER = ['Überfällig', 'Heute', 'Morgen', 'Nächste 7 Tage', 'Später', 'Ohne Datum', 'Erledigt'];

const pad = (n) => String(n).padStart(2, '0');
export const dueDate = (t) => (t.due ? new Date(/^\d{4}-\d\d-\d\d$/.test(t.due) ? `${t.due}T00:00:00` : t.due) : null);
const hasTime = (t) => t.due && t.due.length > 10 && !/T00:00(:00)?$/.test(t.due);
export const dayDiff = (a, b) => { const x = new Date(a); x.setHours(0, 0, 0, 0); const y = new Date(b); y.setHours(0, 0, 0, 0); return Math.round((x - y) / 864e5); };
const WD = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

/** { text, tone, diff, group, overdue } – Fälligkeit relativ zu "heute" */
export function dueInfo(t, today) {
  const d = dueDate(t);
  if (!d) return { text: 'Ohne Datum', tone: 'neutral', diff: null, group: 'Ohne Datum', overdue: false };
  const diff = dayDiff(d, today);
  const time = hasTime(t) ? ` · ${pad(d.getHours())}:${pad(d.getMinutes())}` : '';
  const overdue = !t.done && diff < 0;
  if (t.done) return { text: `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.`, tone: 'neutral', diff, group: 'Erledigt', overdue: false };
  if (diff < 0) return { text: diff === -1 ? 'Gestern fällig' : `Seit ${-diff} Tagen überfällig`, tone: 'danger', diff, group: 'Überfällig', overdue };
  if (diff === 0) return { text: `Heute${time}`, tone: 'warning', diff, group: 'Heute', overdue: false };
  if (diff === 1) return { text: `Morgen${time}`, tone: 'accent', diff, group: 'Morgen', overdue: false };
  if (diff <= 7) return { text: `${WD[d.getDay()]}, ${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${time}`, tone: 'neutral', diff, group: 'Nächste 7 Tage', overdue: false };
  return { text: `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.`, tone: 'neutral', diff, group: 'Später', overdue: false };
}

export function filterTasks(items, ui = {}, today = new Date()) {
  const list = Array.isArray(items) ? items : [];
  const lf = String(ui.filter || '').toLowerCase();
  let base = list, rest = ui;
  if (['heute', 'überfällig', 'diese woche'].includes(lf)) {
    base = list.filter((t) => { const i = dueInfo(t, today); return !t.done && (lf === 'heute' ? i.diff === 0 : lf === 'überfällig' ? i.overdue : i.diff != null && i.diff >= 0 && i.diff <= 7); });
    rest = { ...ui, filter: null };
  } else if (lf && list.some((t) => String(t.project || '').toLowerCase() === lf)) {
    base = list.filter((t) => String(t.project || '').toLowerCase() === lf); rest = { ...ui, filter: null };
  }
  return applyUiFilter(base, rest, { searchFields: ['title', 'project', 'note', 'category'] });
}

export const sortTasks = (a, b) => (a.done - b.done) || (prio(a).rank - prio(b).rank) || String(a.due || '9').localeCompare(String(b.due || '9'));
export const subProgress = (t) => { const s = t.subtasks || []; return { done: s.filter((x) => x.done).length, total: s.length }; };

/** Nächste Fälligkeit bei Wiederholung */
export function nextDue(t) {
  const d = dueDate(t); if (!d || !t.repeat || t.repeat === 'Keine') return null;
  const n = new Date(d);
  if (t.repeat === 'Täglich') n.setDate(n.getDate() + 1);
  else if (t.repeat === 'Werktags') { do n.setDate(n.getDate() + 1); while (n.getDay() % 6 === 0); }
  else if (t.repeat === 'Wöchentlich') n.setDate(n.getDate() + 7);
  else if (t.repeat === 'Monatlich') n.setMonth(n.getMonth() + 1);
  const date = `${n.getFullYear()}-${pad(n.getMonth() + 1)}-${pad(n.getDate())}`;
  return hasTime(t) ? `${date}T${pad(n.getHours())}:${pad(n.getMinutes())}:00` : date;
}

/** Aufgabe abhaken/öffnen (Wiederholungen springen zur nächsten Fälligkeit). Liefert Toast-Text. */
export function toggleTask(ctx, setData, t) {
  const nd = !t.done && nextDue(t);
  setData('tasks', (all) => all.map((x) => {
    if (x.id !== t.id) return x;
    if (nd) return { ...x, due: nd, subtasks: (x.subtasks || []).map((s) => ({ ...s, done: false })) };
    return { ...x, done: !x.done, status: !x.done ? 'Erledigt' : 'Offen' };
  }));
  ctx.emit('task.toggle', { id: t.id, done: nd ? false : !t.done });
  if (nd) ctx.toast(`„${t.title}“ erledigt – nächste Fälligkeit ${dueInfo({ ...t, due: nd }, ctx.today).text}`);
}

export const PrioFlag = ({ t, label }) => {
  const p = prio(t);
  return html`<span class="tk-prio" style=${`color:${toneColor(p.tone)}`} title=${`Priorität ${p.label}`} aria-label=${`Priorität ${p.label}`}><${Icon} name="flag" size=${14} />${label && html`<span>${p.label}</span>`}</span>`;
};
export const DueText = ({ t, today }) => { const i = dueInfo(t, today); return html`<span class="tk-due" data-tone=${i.tone}>${i.overdue && html`<${Icon} name="alert-circle" size=${13} />`}${i.text}</span>`; };
export const SubCount = ({ t }) => { const p = subProgress(t); return p.total ? html`<span class="tk-subcount" title="Unteraufgaben"><${Icon} name="list-checks" size=${13} />${p.done}/${p.total}</span>` : null; };
export const RepeatIcon = ({ t }) => (t.repeat && t.repeat !== 'Keine' ? html`<span class="tk-subcount" title=${`Wiederholung: ${t.repeat}`}><${Icon} name="repeat" size=${13} /></span>` : null);
export { Badge };

export const TASK_CSS = `
.tk-prio { display:inline-flex; align-items:center; gap:4px; font-size:var(--tk-fs-xs); font-weight:var(--tk-fw-semibold); flex:none; }
.tk-due { display:inline-flex; align-items:center; gap:3px; font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); white-space:nowrap; font-variant-numeric:tabular-nums; }
.tk-due[data-tone="danger"] { color:var(--tk-c-danger); font-weight:var(--tk-fw-semibold); }
.tk-due[data-tone="warning"] { color:var(--tk-c-warning); font-weight:var(--tk-fw-semibold); }
.tk-due[data-tone="accent"] { color:var(--tk-c-accent); }
.tk-subcount { display:inline-flex; align-items:center; gap:3px; font-size:var(--tk-fs-sm); color:var(--tk-c-text-subtle); font-variant-numeric:tabular-nums; white-space:nowrap; }
`;
