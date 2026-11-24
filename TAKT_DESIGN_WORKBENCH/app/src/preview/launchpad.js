// ============================================================================
// App-Rahmen (Shells) für den App-Modus (Demo-Launcher) – Bauplan Abschnitt 4:
//  * tabs      – untere Leiste mit 4 Favoriten + „Mehr“ (Standard „Kompakt“)
//  * launchpad – Start ist ein Raster aller Module mit Live-Kennzahlen (Standard „Visuell“)
//  * fokus     – „Heute“, zentraler Erfassen-Knopf, Module per Blatt (Standard „Fokus“)
// Kennzahlen kommen aus der gemeinsamen Datenwelt. Vertrag für neue Module: Welt-Export
// `<modulCamelCase>Summary = { kpis: [{ label, value }] }` – die erste Kennzahl erscheint auf der Kachel.
// ============================================================================
import { html } from '../lib/html.js';
import { useState } from 'preact/hooks';
import { Icon } from '../lib/icons.js';

export const SHELLS = [
  { id: 'tabs', label: 'Tab-Leiste', hint: '4 Favoriten + Mehr' },
  { id: 'launchpad', label: 'Launchpad', hint: 'Start = Raster aller Module mit Kennzahlen' },
  { id: 'fokus', label: 'Fokus', hint: 'Heute, zentraler Erfassen-Knopf, Module per Blatt' },
];
export const SHELL_BY_DIRECTION = { kompakt: 'tabs', visuell: 'launchpad', fokus: 'fokus' };
export const LAUNCHPAD = 'shell:launchpad';

const camel = (id) => id.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
const day = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const num = (v) => new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 }).format(v);

/** Erste Kennzahl eines Moduls aus der Welt (Adapter für vorhandene Welt-Dateien + allgemeiner Vertrag). */
export function moduleKpi(world, moduleId, today, privacy) {
  const t = day(today);
  const money = (v) => (privacy ? '•••• €' : `${num(v)} €`);
  try {
    const generic = world[`${camel(moduleId)}Summary`]?.kpis?.[0];
    if (generic) {
      const value = privacy && /€|\d[\d.,]*\s*(EUR|USD)/.test(`${generic.value}${generic.unit || ''}`) ? '••••' : `${generic.value}${generic.unit ? ` ${generic.unit}` : ''}`;
      return `${value} ${generic.label}`.trim();
    }
    switch (moduleId) {
      case 'home': { const n = (world.tasks || []).filter((x) => !x.done && String(x.due || '').slice(0, 10) <= t).length; return `${n} fällig heute`; }
      case 'calendar': { const n = (world.events || []).filter((e) => String(e.start || '').startsWith(t)).length; return `${n} Termine heute`; }
      case 'tasks': { const n = (world.tasks || []).filter((x) => !x.done).length; return `${n} offen`; }
      case 'finance': return world.financeSummary ? `${money(world.financeSummary.netWorth)} Vermögen` : null;
      case 'savings': { const p = world.savingsPlans; return Array.isArray(p) ? `${p.length} Sparpläne` : null; }
      case 'fitness': { const fs = world.fitnessSummary; if (!fs) return null; if (!fs.nextWorkoutDay || fs.nextWorkoutDay === '–') return 'Noch kein Programm'; return fs.todayKind === 'rest' ? `Ruhetag · nächstes Training ${fs.nextWorkoutDay}` : 'Training heute'; }
      case 'nutrition': return world.nutSummary ? `${num(world.nutSummary.leftKcal)} kcal übrig` : null;
      case 'weather': { const h = (world.wxActive?.hours || []).find((x) => String(x.time).startsWith(`${t}T09`)); return h ? `${Math.round(h.temp)} °C ${world.wxActive.name || ''}`.trim() : null; }
      default: return null;
    }
  } catch { return null; }
}

/** Startraster aller Module (Shell „Launchpad“). */
export function Launchpad({ modules, world, today, privacy, onOpen }) {
  const areas = [...new Set(modules.map((m) => m.area || 'Weitere'))];
  const first = String(world?.persona?.name || '').split(' ')[0];
  const h = today.getHours();
  return html`<div class="tk-screen tk-launchpad" data-qa="launchpad">
    <h1 class="tk-h1">${h < 11 ? 'Guten Morgen' : h < 18 ? 'Hallo' : 'Guten Abend'}${first ? `, ${first}` : ''}</h1>
    <p class="tk-muted" style="margin:4px 0 var(--tk-space-4)">${new Intl.DateTimeFormat('de-DE', { weekday: 'long', day: 'numeric', month: 'long' }).format(today)}</p>
    ${areas.map((a) => html`<div class="tk-label" style="margin:var(--tk-space-3) 0 var(--tk-space-2)">${a}</div>
      <div class="tk-lpgrid">${modules.filter((m) => (m.area || 'Weitere') === a).map((m) => { const kpi = moduleKpi(world || {}, m.id, today, privacy); return html`<button type="button" class="tk-lptile" onClick=${() => onOpen(m.id)} data-launchpad-module=${m.id}>
        <span class="tk-lptile__icon"><${Icon} name=${m.icon} size=${22} /></span><strong class="tk-truncate">${m.name}</strong>${kpi && html`<span class="tk-lptile__kpi tk-truncate">${kpi}</span>`}</button>`; })}</div>`)}
  </div>`;
}

const CAPTURE_TYPES = [
  { id: 'task', label: 'Aufgabe', icon: 'list-checks' }, { id: 'event', label: 'Termin', icon: 'calendar' },
  { id: 'note', label: 'Notiz', icon: 'sticky-note' }, { id: 'expense', label: 'Ausgabe', icon: 'wallet' },
];
/** Einfache Erkennung wie im Bauplan (system.capture): „-12,50 Rewe“ = Ausgabe, „morgen 14 Uhr …“ = Termin, „!…“ = Aufgabe hoch. */
export function guessCaptureType(text) {
  if (/^\s*[-−]\s*\d/.test(text) || /\d+,\d{2}\s*€?/.test(text)) return 'expense';
  if (/\b(\d{1,2}(:\d{2})?\s*uhr|morgen|übermorgen|montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag)\b/i.test(text)) return 'event';
  return 'task';
}

/** Erfassen-Blatt (Shell „Fokus“): schreibt Aufgaben direkt in die gemeinsame Welt. */
export function CaptureSheet({ close, world, today, toast, emit }) {
  const [text, setText] = useState(''); const [type, setType] = useState(null);
  const eff = type || (text ? guessCaptureType(text) : 'task');
  const save = () => {
    const t = text.trim(); if (!t) return;
    if (eff === 'task' && world) world.setData('tasks', (list) => [{ id: `t-neu-${(list || []).length + 1}`, title: t.replace(/^!\s*/, ''), due: day(today), priority: t.startsWith('!') ? 'hoch' : 'mittel', status: 'Offen', category: 'Eingang', subtasks: [] }, ...(list || [])]);
    if (eff === 'note' && world) world.setData('notes', (list) => [{ id: `n-neu-${(list || []).length + 1}`, title: t.slice(0, 60), body: t, inbox: true, updated: `${day(today)}T09:30:00`, tags: [] }, ...(Array.isArray(list) ? list : [])]);
    if (eff === 'event' && world) {
      const tm = t.match(/(\d{1,2})(?::(\d{2}))?\s*uhr/i); const tomorrow = /morgen/i.test(t) && !/übermorgen/i.test(t);
      const d = new Date(today); if (tomorrow) d.setDate(d.getDate() + 1);
      const hh = String(tm ? Number(tm[1]) : 9).padStart(2, '0'), mm = tm?.[2] || '00';
      const title = t.replace(/\b(morgen|heute)\b/ig, '').replace(/\d{1,2}(:\d{2})?\s*uhr/i, '').trim() || 'Termin';
      world.setData('events', (list) => [{ id: `e-neu-${(list || []).length + 1}`, title, start: `${day(d)}T${hh}:${mm}:00`, end: `${day(d)}T${String(Number(hh) + 1).padStart(2, '0')}:${mm}:00`, category: 'Privat', tone: 'accent' }, ...(Array.isArray(list) ? list : [])]);
    }
    if (eff === 'expense' && world) {
      // „-12,50 Rewe“ → Ausgabe vom Girokonto (Finanzen rechnen live aus der Welt: Frei verfügbar, Budgets, Saldo)
      const m = t.match(/[-−]?\s*(\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?|\d+(?:[.,]\d{1,2})?)\s*€?/);
      const amount = m ? Number(m[1].replace(/\./g, '').replace(',', '.')) : 0;
      const title = t.replace(m ? m[0] : '', '').trim() || 'Ausgabe';
      if (amount > 0) {
        world.setData('transactions', (list) => [{ id: `tx-neu-${(list || []).length + 1}`, date: `${day(today)}T${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}:00`, title, category: 'Unkategorisiert', amount: -amount, account: 'acc-giro', type: 'expense', icon: 'receipt' }, ...(list || [])]);
        world.setData('accounts', (list) => (list || []).map((a) => (a.id === 'acc-giro' ? { ...a, balance: Math.round((a.balance - amount) * 100) / 100 } : a)));
      }
    }
    emit('capture.add', { type: eff, text: t });
    toast(`Erfasst als ${CAPTURE_TYPES.find((c) => c.id === eff).label}${{ task: ' – erscheint in Aufgaben und Heute', expense: ' – gebucht vom Girokonto', note: ' – im Notizen-Eingang', event: ' – im Kalender' }[eff] || ''}`);
    close();
  };
  return html`<div class="tk-col" style="gap:var(--tk-space-3)">
    <input class="tk-input" autofocus placeholder="z. B. Angebot an Müller schicken · morgen 14 Uhr Zahnarzt · -12,50 Rewe" value=${text} onInput=${(e) => setText(e.currentTarget.value)} onKeyDown=${(e) => e.key === 'Enter' && save()} aria-label="Erfassen" data-qa="capture-input" />
    <div class="tk-row" style="gap:var(--tk-space-2);flex-wrap:wrap" role="group" aria-label="Art">${CAPTURE_TYPES.map((c) => html`<button type="button" aria-pressed=${String(eff === c.id)} class="tk-chip" onClick=${() => setType(c.id)}><${Icon} name=${c.icon} size=${14} />${c.label}</button>`)}</div>
    <p class="tk-muted" style="font-size:var(--tk-fs-sm)">${type ? 'Art manuell gewählt.' : 'Art wird erkannt – bei Bedarf antippen.'}</p>
    <button type="button" class="tk-btn tk-btn--primary" onClick=${save} disabled=${!text.trim()} data-qa="capture-save"><${Icon} name="check" size=${16} />Erfassen</button></div>`;
}
