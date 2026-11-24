// Globale Suche: Treffer aus allen Modulen (Termine, Aufgaben, Buchungen, Konten, Sparpläne …) plus Befehle.
import { html } from '../../../lib/html.js';
import { useState, useMemo } from 'preact/hooks';
import { Icon, Button, Card, Chip, EmptyState, Badge } from '../../ui.js';
import { buildIndex, runSearch, matchCommands, COMMANDS, SCOPES } from './_search.js';
import { ResultRow, CommandRow, Field, GS_CSS } from './_search-ui.js';
import { XC_CSS } from './_xc-css.js';
import { MODULES, moduleMeta } from './_system.js';

const SUGGEST = ['Müller', 'Rewe', 'Sparplan', 'Jana', 'Skyr'];
const SOURCES = ['events', 'tasks', 'transactions', 'accounts', 'savingsPlans', 'positions', 'nutRecipes', 'nutFoods', 'notes', 'articles', 'habits', 'orders', 'channels', 'captures'];

export const globalSearch = {
  id: 'global-search',
  name: 'Globale Suche',
  category: 'Querschnitt',
  description: 'Eine Suche über alle Module: Aufgaben, Termine, Buchungen, Konten, Sparpläne, Depot, Rezepte und Module, dazu Befehle wie „Neue Aufgabe“. Drei Darstellungen: gruppierte Liste, Karten mit Vorschlägen und Befehlspalette mit Tastatur.',
  version: '1.1',
  props: [
    { name: 'mode', label: 'Darstellung', type: 'select', options: ['list', 'cards', 'palette'], default: 'list' },
    { name: 'placeholder', label: 'Platzhalter', type: 'text', default: 'Suchen oder Befehl eingeben' },
    { name: 'initialQuery', label: 'Startbegriff (Vorschau)', type: 'text', default: '' },
    { name: 'limitPerGroup', label: 'Treffer je Gruppe', type: 'number', default: 4 },
    { name: 'showCommands', label: 'Befehle zeigen', type: 'boolean', default: true },
    { name: 'showScopes', label: 'Filter-Chips', type: 'boolean', default: true },
  ],
  data: [
    ...SOURCES.map((s) => ({ slot: s, label: s, default: s, shape: 'Welt-Sammlung', required: false })),
    { slot: 'index', label: 'Suchindex der Module (optional)', default: 'searchIndex', shape: '{id,type,title,subtitle?,module,to,params?}[]', required: false },
    { slot: 'recents', label: 'Zuletzt gesucht', default: 'recents', shape: 'string[]', required: false },
  ],
  events: ['search.input', 'search.scope', 'search.open', 'search.recent', 'search.clear', 'command.run', 'command.capture'],
  states: ['empty'],
  flutter: { widget: 'TaktGlobalSearch', propMap: { mode: 'layout', placeholder: 'hint', limitPerGroup: 'groupLimit', showCommands: 'showCommands' }, events: { 'search.open': 'onOpenResult', 'command.run': 'onCommand' } },
  a11y: { role: 'search', nameFrom: 'Suchfeld' },
  css: XC_CSS + GS_CSS,
  example: { props: { initialQuery: 'm' }, data: { tasks: [{ id: 't1', title: 'Angebot Müller GmbH finalisieren', due: '2026-11-24T14:00:00', project: 'Vertrieb' }, { id: 't9', title: 'Miete prüfen', due: '2026-11-30', project: 'Privat' }], events: [{ id: 'e5', title: 'Mittag mit Jana', start: '2026-11-24T12:30:00', end: '2026-11-24T13:30:00', location: 'Café Moll' }], recents: ['Müller', 'Rewe'] } },
  render: function GlobalSearch({ props, data, setData, ctx }) {
    const [q, setQ] = useState(ctx.ui?.gsQuery ?? (props.initialQuery || ''));
    const [scope, setScope] = useState(ctx.ui?.gsScope || 'all');
    const [open, setOpen] = useState({});
    const [active, setActive] = useState(0);
    const index = useMemo(() => buildIndex(data, ctx), [data, ctx.today, ctx.privacy]);
    const dataCount = index.filter((e) => ['task', 'event', 'transaction', 'account', 'plan', 'note', 'article', 'habit', 'order', 'scan'].includes(e.group)).length;
    const sc = SCOPES.find((s) => s.id === scope) || SCOPES[0];
    const res = useMemo(() => (q.trim() ? runSearch(index, q, sc.groups) : { groups: [], total: 0 }), [index, q, scope]);
    const cmds = props.showCommands ? (scope === 'all' ? matchCommands(q) : []) : [];
    const recents = (Array.isArray(data.recents) ? data.recents : []).slice(0, 6);
    const remember = (t) => { const s = String(t || '').trim(); if (s) setData('recents', (l) => [s, ...(Array.isArray(l) ? l : []).filter((x) => x !== s)].slice(0, 8)); };
    const input = (v) => { setQ(v); setActive(0); ctx.setUi('gsQuery', v); ctx.emit('search.input', { length: v.length }); };
    const openIt = (it) => { remember(q); ctx.emit('search.open', { id: it.id, group: it.group }); if (it.to) ctx.emit(`open:${it.to}`, it.group === 'module' || it.group === 'setting' ? undefined : { id: it.id }); };
    const runCmd = (c) => { ctx.emit('command.run', { id: c.id }); if (c.to) ctx.emit(`open:${c.to}`); else ctx.toast(c.note || c.label); };
    const capture = () => { ctx.emit('command.capture', { text: q }); ctx.emit('open:system.capture'); };

    const empty = html`<${EmptyState} icon="search" title=${`Keine Treffer für „${q.trim()}“`} text="Prüfe die Schreibweise oder suche in allen Modulen."
      action=${html`<div class="tk-xc-wrap" style="justify-content:center">${scope !== 'all' && html`<${Button} size="sm" icon="layers" onClick=${() => setScope('all')}>In allen Modulen suchen<//>`}<${Button} size="sm" icon="plus" onClick=${capture}>Als Aufgabe erfassen<//></div>`} />`;
    const chips = props.showScopes && html`<div class="tk-xc-chips" data-scroll-x role="group" aria-label="Suchbereich">${SCOPES.map((s) => {
      const n = q.trim() ? runSearch(index, q, s.groups).total : null;
      return html`<${Chip} active=${scope === s.id} count=${n || undefined} onClick=${() => { setScope(s.id); ctx.setUi('gsScope', s.id); ctx.emit('search.scope', { scope: s.id }); }}>${s.label}<//>`; })}</div>`;
    const recentChips = recents.length > 0 && html`<div class="tk-xc-stack"><div class="tk-xc-sec">Zuletzt gesucht<button type="button" class="tk-xc-link tk-xc-sec__n" onClick=${() => { setData('recents', []); ctx.emit('search.clear'); }}>Verlauf löschen</button></div>
      <div class="tk-xc-wrap">${recents.map((r) => html`<${Chip} icon="history" onClick=${() => { input(r); ctx.emit('search.recent', { q: r }); }}>${r}<//>`)}</div></div>`;
    const firstRun = dataCount === 0 && html`<div class="tk-xc-gs__hint"><${Icon} name="info" size=${18} /><span>Noch nichts erfasst. Sobald du Aufgaben, Termine oder Buchungen anlegst, findest du sie hier.</span><${Button} size="sm" variant="primary" icon="plus" onClick=${() => ctx.emit('open:system.capture')}>Erfassen<//></div>`;
    const group = (g) => { const lim = Number(props.limitPerGroup) || 4, all = open[g.id], items = all ? g.items : g.items.slice(0, lim);
      return html`<div key=${g.id}><div class="tk-xc-sec"><${Icon} name=${g.icon} size=${14} />${g.label}<span class="tk-xc-sec__n">${g.items.length}</span></div>
        <${Card} flush><div role="listbox" aria-label=${g.label}>${items.map((it) => html`<${ResultRow} key=${it.key} it=${it} q=${q} ctx=${ctx} onOpen=${openIt} />`)}</div>
        ${g.items.length > lim && html`<button type="button" class="tk-xc-link tk-xc-gs__more" onClick=${() => setOpen({ ...open, [g.id]: !all })}>${all ? 'Weniger anzeigen' : `Alle ${g.items.length} anzeigen`}</button>`}<//></div>`; };

    // ------------------------------------------------------------ Befehlspalette (Fokus)
    if (props.mode === 'palette') {
      const flat = [...(q.trim() ? [{ cap: true }] : []), ...cmds.slice(0, q.trim() ? 4 : 6).map((c) => ({ c })), ...res.groups.flatMap((g) => g.items.slice(0, 3)).slice(0, 8).map((it) => ({ it }))];
      const run = (x) => (x.cap ? capture() : x.c ? runCmd(x.c) : openIt(x.it));
      const onKey = (e) => { if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(flat.length - 1, a + 1)); } else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); } else if (e.key === 'Enter' && flat[active]) run(flat[active]); else if (e.key === 'Escape') input(''); };
      let n = -1; const sel = () => { n += 1; return n === active; };
      return html`<div class="tk-xc-gs" data-qa="global-search">
        <${Field} value=${q} onInput=${input} onKey=${onKey} placeholder=${props.placeholder} lead="command" />
        ${firstRun}
        <${Card} flush><div role="listbox" aria-label="Aktionen und Treffer">
          ${q.trim() && html`<button type="button" class="tk-xc-row" role="option" aria-selected=${sel() ? 'true' : 'false'} onClick=${capture} data-command="capture"><span class="tk-xc-ic tk-xc-ic--success"><${Icon} name="plus" size=${18} /></span><span class="tk-xc-main"><span class="tk-xc-t">„${q.trim()}“ erfassen</span><span class="tk-xc-s">Als Aufgabe, Termin oder Buchung erkannt</span></span><${Badge} tone="success">Erfassen<//></button>`}
          ${!q.trim() && html`<div class="tk-xc-sec" style="padding-inline:var(--tk-space-3)">Vorschläge</div>`}
          ${cmds.slice(0, q.trim() ? 4 : 6).map((c) => html`<${CommandRow} key=${c.id} c=${c} q=${q} onRun=${runCmd} selected=${sel()} />`)}
          ${res.groups.length > 0 && html`<div class="tk-xc-sec" style="padding-inline:var(--tk-space-3)">Treffer</div>`}
          ${res.groups.flatMap((g) => g.items.slice(0, 3)).slice(0, 8).map((it) => html`<${ResultRow} key=${it.key} it=${it} q=${q} ctx=${ctx} onOpen=${openIt} selected=${sel()} />`)}
          ${q.trim() && !res.total && !cmds.length && html`<div style="padding:var(--tk-space-4)">${empty}</div>`}</div><//>
        ${!q.trim() && recentChips}
        <div class="tk-xc-gs__foot"><span><span class="tk-xc-kbd">↑</span><span class="tk-xc-kbd">↓</span> wählen</span><span><span class="tk-xc-kbd">↵</span> öffnen</span><span><span class="tk-xc-kbd">Esc</span> leeren</span></div></div>`;
    }

    // ------------------------------------------------------------ Karten und Vorschläge (Visuell)
    if (props.mode === 'cards') {
      const top = res.groups[0]?.items[0];
      const today = [index.find((e) => e.group === 'event'), index.find((e) => e.group === 'task' && !e.done), index.find((e) => e.group === 'transaction')].filter(Boolean);
      return html`<div class="tk-xc-gs" data-qa="global-search">
        <${Field} value=${q} onInput=${input} placeholder=${props.placeholder} big=${true} />
        ${chips}${firstRun}
        ${!q.trim() ? html`
          ${today.length > 0 && html`<div class="tk-xc-sec">Gerade relevant</div><div class="tk-xc-gs__cards">${today.map((it) => html`<button type="button" class="tk-xc-gs__card" onClick=${() => openIt(it)} key=${it.key}><span class="tk-xc-ic"><${Icon} name=${it.icon} size=${18} /></span><span class="tk-xc-t">${it.title}</span><span class="tk-xc-s">${it.subtitle}</span></button>`)}</div>`}
          <div class="tk-xc-sec">Direkt zu</div><div class="tk-xc-gs__tiles">${MODULES.filter((m) => m.id !== 'settings' && m.id !== 'system').slice(0, 12).map((m) => html`<button type="button" class="tk-xc-gs__tile" key=${m.id} onClick=${() => { ctx.emit('search.open', { id: m.id, group: 'module' }); ctx.emit(`open:${m.home}`); }}><span class="tk-xc-ic"><${Icon} name=${m.icon} size=${20} /></span><span>${m.name}</span></button>`)}</div>
          ${recentChips}`
        : !res.total ? empty : html`
          ${top && html`<button type="button" class="tk-xc-gs__hero" onClick=${() => openIt(top)} data-qa="top-hit"><span class="tk-xc-ic"><${Icon} name=${top.icon} size=${24} /></span><span class="tk-xc-main"><span class="tk-xc-s">Bester Treffer · ${moduleMeta(top.module).name}</span><span class="tk-xc-t">${top.title}</span><span class="tk-xc-s">${top.subtitle}</span></span><${Icon} name="arrow-right" size=${20} /></button>`}
          ${res.groups.map((g) => html`<div key=${g.id}><div class="tk-xc-sec"><${Icon} name=${g.icon} size=${14} />${g.label}<span class="tk-xc-sec__n">${g.items.length}</span></div>
            <div class="tk-xc-gs__cards">${g.items.slice(0, Number(props.limitPerGroup) || 4).map((it) => html`<button type="button" class="tk-xc-gs__card" key=${it.key} onClick=${() => openIt(it)}><span class="tk-xc-ic"><${Icon} name=${it.icon} size=${18} /></span><span class="tk-xc-t">${it.title}</span><span class="tk-xc-s">${it.subtitle}</span></button>`)}</div></div>`)}`}
      </div>`;
    }

    // ------------------------------------------------------------ Gruppierte Liste (Kompakt)
    return html`<div class="tk-xc-gs" data-qa="global-search">
      <${Field} value=${q} onInput=${input} placeholder=${props.placeholder} />
      ${chips}${firstRun}
      ${!q.trim() ? html`${recentChips}
        <div class="tk-xc-stack"><div class="tk-xc-sec">Befehle</div><${Card} flush><div role="listbox" aria-label="Befehle">${COMMANDS.slice(0, 5).map((c) => html`<${CommandRow} key=${c.id} c=${c} q="" onRun=${runCmd} />`)}</div><//></div>
        <div class="tk-xc-stack"><div class="tk-xc-sec">Vorschläge</div><div class="tk-xc-wrap">${SUGGEST.map((s) => html`<${Chip} icon="search" onClick=${() => input(s)}>${s}<//>`)}</div></div>`
      : html`${cmds.length > 0 && html`<div><div class="tk-xc-sec"><${Icon} name="command" size=${14} />Befehle<span class="tk-xc-sec__n">${cmds.length}</span></div><${Card} flush>${cmds.slice(0, 3).map((c) => html`<${CommandRow} key=${c.id} c=${c} q=${q} onRun=${runCmd} />`)}<//></div>`}
        ${res.groups.map(group)}${!res.total && !cmds.length && empty}`}
    </div>`;
  },
};
export default globalSearch;
