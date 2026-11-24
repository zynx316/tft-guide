// Suchindex und Befehle der globalen Suche. Der Index entsteht aus den Welt-Sammlungen (kein eigener Datenbestand).
import { fmtDate, fmtTime, fmtNumber } from '../../../lib/format.js';
import { toDate } from '../../../lib/date.js';
import { money } from '../../helpers.js';
import { MODULES, moduleMeta, fold, whenLabel } from './_system.js';

/** Trefferarten in Anzeigereihenfolge. `to` = Ziel-Feature (Event `open:<to>`), `module` = zugehöriges Modul. */
export const GROUPS = [
  { id: 'task', label: 'Aufgaben', icon: 'list-todo', module: 'tasks', to: 'tasks.detail' },
  { id: 'event', label: 'Termine', icon: 'calendar', module: 'calendar', to: 'calendar.event' },
  { id: 'transaction', label: 'Buchungen', icon: 'receipt', module: 'finance', to: 'finance.transaction' },
  { id: 'account', label: 'Konten', icon: 'credit-card', module: 'finance', to: 'finance.accounts' },
  { id: 'plan', label: 'Sparpläne', icon: 'piggy-bank', module: 'savings', to: 'savings.plan' },
  { id: 'position', label: 'Depot', icon: 'candlestick-chart', module: 'trading', to: 'trading.detail' },
  { id: 'recipe', label: 'Rezepte', icon: 'chef-hat', module: 'nutrition', to: 'nutrition.recipe' },
  { id: 'food', label: 'Lebensmittel', icon: 'apple', module: 'nutrition', to: 'nutrition.foods' },
  { id: 'module', label: 'Module', icon: 'layout-grid', module: 'home', to: null },
];
/** Eingrenzung der Suche (Chips): Name, Gruppen. */
export const SCOPES = [
  { id: 'all', label: 'Alle', groups: null }, { id: 'tasks', label: 'Aufgaben', groups: ['task'] }, { id: 'calendar', label: 'Termine', groups: ['event'] },
  { id: 'finance', label: 'Finanzen', groups: ['transaction', 'account'] }, { id: 'savings', label: 'Sparpläne', groups: ['plan'] }, { id: 'trading', label: 'Depot', groups: ['position'] },
  { id: 'nutrition', label: 'Ernährung', groups: ['recipe', 'food'] }, { id: 'module', label: 'Module', groups: ['module'] },
];
export const groupMeta = (id) => GROUPS.find((g) => g.id === id) || GROUPS[GROUPS.length - 1];

/** Befehle: `to` = Feature, das geöffnet wird; ohne `to` wirkt der Befehl an Ort und Stelle (Hinweis). */
export const COMMANDS = [
  { id: 'cmd-task', label: 'Neue Aufgabe', hint: 'Schnell erfassen', icon: 'plus', to: 'system.capture', keys: 'aufgabe neu erstellen todo' },
  { id: 'cmd-event', label: 'Neuer Termin', hint: 'Kalender', icon: 'calendar-plus', to: 'calendar.create', keys: 'termin neu kalender' },
  { id: 'cmd-expense', label: 'Buchung erfassen', hint: 'Finanzen', icon: 'wallet', to: 'finance.quickadd', keys: 'buchung ausgabe einnahme geld' },
  { id: 'cmd-meal', label: 'Mahlzeit erfassen', hint: 'Ernährung', icon: 'utensils', to: 'nutrition.log', keys: 'mahlzeit essen kalorien' },
  { id: 'cmd-theme', label: 'Theme wechseln', hint: 'Darstellung', icon: 'palette', to: 'settings.appearance', keys: 'theme darstellung farbe dunkel hell' },
  { id: 'cmd-privacy', label: 'Privatmodus umschalten', hint: 'Beträge ausblenden', icon: 'eye-off', to: null, keys: 'privat beträge ausblenden verbergen', note: 'Privatmodus umgeschaltet (Demo: Schalter im Launcher)' },
  { id: 'cmd-lock', label: 'App sperren', hint: 'PIN oder Biometrie', icon: 'lock', to: 'system.lock', keys: 'sperre pin sperren sicher' },
  { id: 'cmd-trash', label: 'Papierkorb öffnen', hint: '30 Tage wiederherstellbar', icon: 'trash-2', to: 'system.trash', keys: 'papierkorb gelöscht wiederherstellen' },
  { id: 'cmd-export', label: 'Daten exportieren', hint: 'Export und Backup', icon: 'download', to: 'settings.data', keys: 'export backup sicherung daten' },
  { id: 'cmd-settings', label: 'Einstellungen öffnen', hint: 'Alle Einstellungen', icon: 'settings', to: 'settings.home', keys: 'einstellungen optionen konfiguration' },
];
export const COMMAND_TARGETS = [...new Set(COMMANDS.map((c) => c.to).filter(Boolean))];
export const MODULE_TARGETS = MODULES.map((m) => m.home).filter(Boolean);
/** Alle Ziele, die die Suche öffnen kann (für die Interaktionsliste im Manifest). */
export const SEARCH_TARGETS = [...new Set([...GROUPS.map((g) => g.to).filter(Boolean), ...COMMAND_TARGETS, ...MODULE_TARGETS])];

const arr = (v) => (Array.isArray(v) ? v : []);

/** Index aus den gebundenen Sammlungen. Jeder Eintrag: { key, group, module, title, subtitle, meta, icon, to, id, ts }. */
export function buildIndex(data, ctx) {
  const out = [];
  const push = (group, id, title, subtitle, extra = {}) => { const g = groupMeta(group); out.push({ key: `${group}:${id}`, group, id, module: g.module, title: String(title || ''), subtitle, icon: g.icon, to: g.to, ...extra }); };
  for (const t of arr(data.tasks)) push('task', t.id, t.title, `${t.project || 'Aufgabe'}${t.due ? ` · fällig ${whenLabel(ctx, t.due)}` : ''}${t.done ? ' · erledigt' : ''}`, { icon: t.done ? 'check-circle-2' : 'list-todo', ts: t.due, extra: `${t.project || ''} ${t.category || ''}`, done: !!t.done });
  for (const e of arr(data.events)) {
    const s = toDate(e.start), when = e.repeat ? e.repeat : `${fmtDate(s, { style: 'weekday' })}`;
    push('event', e.id, e.title, `${when} · ${fmtTime(s)}–${fmtTime(toDate(e.end))}${e.location ? ` · ${e.location}` : ''}`, { ts: e.start, extra: `${e.category || ''} ${e.location || ''}` });
  }
  for (const t of arr(data.transactions)) push('transaction', t.id, t.title, `${t.category} · ${fmtDate(toDate(t.date), { style: 'weekday' })}`, { amount: t.amount, ts: t.date, extra: t.category, icon: t.icon || 'receipt' });
  for (const a of arr(data.accounts)) push('account', a.id, a.name, `${a.bank || a.type}`, { amount: a.balance, extra: `${a.bank} ${a.type}`, icon: a.icon || 'credit-card' });
  for (const p of arr(data.savingsPlans)) push('plan', p.id, p.name, `${money(ctx, p.monthly)} monatlich am ${p.day}.${p.active === false ? ' · pausiert' : ''}`, { extra: p.isin || '' });
  for (const p of arr(data.positions)) push('position', p.id, p.name, `${p.type} · ${fmtNumber(p.quantity, { digits: 2 })} Stück · ${p.isin}`, { extra: `${p.short} ${p.isin}` });
  for (const r of arr(data.nutRecipes)) push('recipe', r.id, r.title, `${(r.prepMin || 0) + (r.cookMin || 0)} Min. · ${r.subtitle || ''}`, { icon: r.icon || 'chef-hat', extra: (r.tags || []).join(' ') });
  for (const f of arr(data.nutFoods)) push('food', f.id, f.name, `${fmtNumber(f.kcal, { unit: 'kcal' })} je 100 g · ${f.category}`, { extra: `${f.brand || ''} ${(f.tags || []).join(' ')}` });
  for (const m of MODULES) out.push({ key: `module:${m.id}`, group: 'module', id: m.id, module: m.id, title: m.name, subtitle: m.desc, icon: m.icon, to: m.home });
  // Aggregat der Module (Welt-Schlüssel `searchIndex`, sobald vorhanden): { id, type, title, subtitle, module, to }
  for (const s of arr(data.index)) if (s?.to && !out.some((o) => o.key === `ext:${s.id}` || (o.id === s.id && o.module === s.module))) out.push({ key: `ext:${s.id}`, group: 'ext', id: s.params?.id ?? s.id, module: s.module, title: s.title, subtitle: s.subtitle || s.type, icon: moduleMeta(s.module).icon, to: s.to, ext: true });
  return out;
}

/** Trefferwert: Titelanfang > Wortanfang > Teiltreffer im Titel > Untertitel/Zusatz. 0 = kein Treffer. */
export function scoreOf(entry, q) {
  const n = fold(q).trim(); if (!n) return 0;
  const parts = n.split(/\s+/);
  const title = fold(entry.title), rest = fold(`${entry.subtitle || ''} ${entry.extra || ''}`);
  let total = 0;
  for (const w of parts) {
    if (title.startsWith(w)) total += 6;
    else if (title.includes(` ${w}`) || title.includes(`-${w}`)) total += 4;
    else if (title.includes(w)) total += 3;
    else if (rest.includes(w)) total += 1;
    else return 0;
  }
  return total + (entry.done ? -0.5 : 0);
}

/** Suche: { groups: [{ ...Gruppe, items }], total }, beste Gruppe zuerst. `scope` = Liste von Gruppen-IDs (null = alle). */
export function runSearch(index, query, scope = null) {
  const scored = index.filter((e) => !scope || scope.includes(e.group) || (e.ext && scope.includes('ext'))).map((e) => ({ e, s: scoreOf(e, query) })).filter((x) => x.s > 0);
  const byGroup = new Map();
  for (const { e, s } of scored) { const g = e.group; if (!byGroup.has(g)) byGroup.set(g, []); byGroup.get(g).push({ ...e, score: s }); }
  const groups = [...byGroup.entries()].map(([id, items]) => ({ ...(id === 'ext' ? { id, label: 'Weitere Treffer', icon: 'link-2' } : groupMeta(id)), items: items.sort((a, b) => b.score - a.score || String(a.title).localeCompare(b.title, 'de')) }))
    .sort((a, b) => b.items[0].score - a.items[0].score || a.label.localeCompare(b.label, 'de'));
  return { groups, total: scored.length };
}
export function matchCommands(query) {
  const n = fold(query).trim(); if (!n) return COMMANDS;
  return COMMANDS.filter((c) => n.split(/\s+/).every((w) => fold(`${c.label} ${c.hint} ${c.keys}`).includes(w)));
}
