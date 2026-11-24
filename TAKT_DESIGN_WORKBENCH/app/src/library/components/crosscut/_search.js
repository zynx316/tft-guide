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
  { id: 'note', label: 'Notizen', icon: 'sticky-note', module: 'notes', to: 'notes.editor' },
  { id: 'article', label: 'Wissen', icon: 'library', module: 'knowledge', to: 'knowledge.article' },
  { id: 'habit', label: 'Gewohnheiten', icon: 'repeat', module: 'habits', to: 'habits.detail' },
  { id: 'order', label: 'Bestellungen', icon: 'package', module: 'sales', to: 'sales.order' },
  { id: 'channel', label: 'Kanäle', icon: 'store', module: 'sales', to: 'sales.channel' },
  { id: 'scan', label: 'Erfassungen', icon: 'scan-text', module: 'picture-to-text', to: 'picture-to-text.result' },
  { id: 'setting', label: 'Einstellungen', icon: 'settings', module: 'settings', to: null },
  { id: 'module', label: 'Module', icon: 'layout-grid', module: 'home', to: null },
];
/** Eingrenzung der Suche (Chips): Name, Gruppen. */
export const SCOPES = [
  { id: 'all', label: 'Alle', groups: null }, { id: 'tasks', label: 'Aufgaben', groups: ['task'] }, { id: 'calendar', label: 'Termine', groups: ['event'] },
  { id: 'finance', label: 'Finanzen', groups: ['transaction', 'account'] }, { id: 'savings', label: 'Sparpläne', groups: ['plan'] }, { id: 'trading', label: 'Depot', groups: ['position'] },
  { id: 'nutrition', label: 'Ernährung', groups: ['recipe', 'food'] }, { id: 'notes', label: 'Notizen', groups: ['note'] }, { id: 'knowledge', label: 'Wissen', groups: ['article'] },
  { id: 'habits', label: 'Gewohnheiten', groups: ['habit'] }, { id: 'sales', label: 'Sales', groups: ['order', 'channel'] }, { id: 'scans', label: 'Scans', groups: ['scan'] }, { id: 'setting', label: 'Einstellungen', groups: ['setting'] }, { id: 'module', label: 'Module', groups: ['module'] },
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
/** Einstellungsseiten als Treffer („Darstellung“, „Datenschutz“, „Über TAKT“ …). */
export const SETTING_ENTRIES = [
  { id: 'set-appearance', title: 'Darstellung & Theme', sub: 'Theme, Dichte, Schriftgröße', to: 'settings.appearance', icon: 'palette', keys: 'dunkel hell farbe schrift größe animation' },
  { id: 'set-region', title: 'Sprache & Region', sub: 'Sprache, Einheiten, Wochenstart', to: 'settings.region', icon: 'languages', keys: 'deutsch einheiten celsius kilometer feiertage' },
  { id: 'set-modules', title: 'Module & Navigation', sub: 'Module ein oder aus, Favoriten der Leiste', to: 'settings.modules', icon: 'layout-grid', keys: 'navigation leiste reihenfolge favoriten' },
  { id: 'set-notify', title: 'Benachrichtigungen', sub: 'Regeln und Ruhezeiten', to: 'settings.notifications', icon: 'bell', keys: 'mitteilungen ruhezeit push erinnerung' },
  { id: 'set-lock', title: 'App-Sperre & Datenschutz', sub: 'PIN, Biometrie, Beträge ausblenden', to: 'system.lock', icon: 'lock', keys: 'privat privatsphäre pin biometrie sicherheit sensibel' },
  { id: 'set-data', title: 'Daten, Export & Backup', sub: 'Sicherung, Export, Speicher', to: 'settings.data', icon: 'cloud-upload', keys: 'sicherung backup export import löschen speicher' },
  { id: 'set-trash', title: 'Papierkorb', sub: '30 Tage wiederherstellbar', to: 'system.trash', icon: 'trash-2', keys: 'gelöscht wiederherstellen' },
  { id: 'set-accounts', title: 'Konten & Sync', sub: 'Verbundene Dienste, Sync-Konflikte', to: 'settings.accounts', icon: 'refresh-cw', keys: 'sync anmeldung konto verbinden konflikt' },
  { id: 'set-help', title: 'Hilfe & Tipps', sub: 'Tipps und Kurzbefehle', to: 'system.help', icon: 'lightbulb', keys: 'anleitung kurzbefehle tastatur' },
  { id: 'set-about', title: 'Über TAKT', sub: 'Version, Lizenzen, Feedback', to: 'settings.about', icon: 'info', keys: 'version lizenz impressum feedback' },
];
export const COMMAND_TARGETS = [...new Set(COMMANDS.map((c) => c.to).filter(Boolean))];
export const MODULE_TARGETS = MODULES.map((m) => m.home).filter(Boolean);
/** Alle Ziele, die die Suche öffnen kann (für die Interaktionsliste im Manifest). */
export const SEARCH_TARGETS = [...new Set([...GROUPS.map((g) => g.to).filter(Boolean), ...COMMAND_TARGETS, ...MODULE_TARGETS, ...SETTING_ENTRIES.map((e) => e.to)])];

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
  // Live-Quellen: entstehen zur Laufzeit (Schnellnotiz, neue Erfassung, neue Bestellung) und sind deshalb sofort auffindbar
  const plain = (t) => String(t || '').replace(/\[[ xX]\]/g, ' ').replace(/[#>*`\[\]_|-]+/g, ' ').replace(/\s+/g, ' ').trim();
  const live = new Set();
  if (Array.isArray(data.notes)) { live.add('note:'); for (const n of data.notes) if (!n.archived) push('note', n.id, n.title || 'Unbenannte Notiz', [n.inbox ? 'Eingang' : (n.tags || []).join(', ') || 'Notiz', plain(n.body).slice(0, 70)].filter(Boolean).join(' · '), { ts: n.updated, extra: `${plain(n.body)} ${(n.tags || []).join(' ')}` }); }
  if (Array.isArray(data.articles)) { live.add('article:'); for (const a of data.articles) push('article', a.id, a.title, `${a.area} › ${a.category}`, { ts: a.updated, extra: `${plain(a.body)} ${(a.tags || []).join(' ')} ${a.author || ''}` }); }
  if (Array.isArray(data.habits)) { live.add('habit:'); for (const h of data.habits) push('habit', h.id, h.name, `${h.daypart || 'Gewohnheit'}${h.time ? ` · ${h.time} Uhr` : ''}`, { icon: h.icon || 'repeat', extra: h.note || '' }); }
  if (Array.isArray(data.orders)) { live.add('order:'); const ST = { new: 'neu', paid: 'bezahlt', shipped: 'versendet', delivered: 'zugestellt' }; for (const o of data.orders) push('order', o.id, `${o.number} ${o.customer}`, `${o.channel} · ${ST[o.status] || o.status}`, { amount: o.total, ts: o.date, extra: `${o.email || ''} ${(o.lines || []).map((l) => l.name).join(' ')}` }); }
  if (Array.isArray(data.channels)) { live.add('channel:'); for (const c of data.channels) push('channel', c.id, c.name, c.error || `${c.orders} Bestellungen in 30 Tagen`, { icon: c.icon || 'store', extra: c.url || '' }); }
  if (Array.isArray(data.captures)) { live.add('scan:'); for (const c of data.captures) push('scan', c.id, c.title, [c.group || 'Erfassung', c.meta].filter(Boolean).join(' · '), { ts: c.created, extra: c.text || '' }); }
  for (const e of SETTING_ENTRIES) out.push({ key: `setting:${e.id}`, group: 'setting', id: e.id, module: 'settings', title: e.title, subtitle: e.sub, extra: e.keys, icon: e.icon, to: e.to });
  for (const m of MODULES) out.push({ key: `module:${m.id}`, group: 'module', id: m.id, module: m.id, title: m.name, subtitle: m.desc, icon: m.icon, to: m.home });
  // Aggregat der Module (Welt-Schlüssel `searchIndex`, sobald vorhanden): { id, type, title, subtitle, module, to }
  for (const s of arr(data.index)) if (s?.to && ![...live].some((p) => String(s.id).startsWith(p)) && !out.some((o) => o.key === `ext:${s.id}` || (o.id === s.id && o.module === s.module))) out.push({ key: `ext:${s.id}`, group: 'ext', id: s.params?.id ?? s.id, module: s.module, title: s.title, subtitle: s.subtitle || s.type, icon: moduleMeta(s.module).icon, to: s.to, ext: true });
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
