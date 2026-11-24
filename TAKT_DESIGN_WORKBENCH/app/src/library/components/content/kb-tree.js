// Wissensdatenbank: hierarchische Navigation Bereiche > Kategorien > Artikel
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Card, Badge, Icon, EmptyState, toneColor } from '../../ui.js';
import { applyUiFilter, groupBy } from '../../helpers.js';

export const kbTree = {
  id: 'kb-tree',
  name: 'Wissensbaum',
  category: 'Inhalte',
  description: 'Hierarchische Navigation (Bereiche › Kategorien › Artikel), auf-/zuklappbar. Aktiver Artikel = ctx.ui.selectedId. Beachtet die Suche (klappt Treffer auf).',
  version: '1.0',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Wissensbasis' },
    { name: 'showCounts', label: 'Artikelanzahl', type: 'boolean', default: true },
    { name: 'expandAll', label: 'Alles aufgeklappt starten', type: 'boolean', default: false },
    { name: 'bare', label: 'Ohne Karte (für Seitenleiste)', type: 'boolean', default: false },
  ],
  data: [
    { slot: 'articles', label: 'Artikel', default: 'articles', shape: '{id,title,area,category,tags?,body,updated}[]', required: true },
    { slot: 'areas', label: 'Bereiche (Icon/Ton)', default: 'areas', shape: '{id,name,icon?,tone?}[]', required: false },
  ],
  events: ['kb.open', 'kb.toggle'],
  states: ['empty'],
  css: `
  .tk-kb-tree { display:flex; flex-direction:column; gap:2px; padding:var(--tk-space-2); min-width:0; }
  .tk-kb-tree__row { display:flex; align-items:center; gap:8px; width:100%; min-height:38px; padding:0 10px; border:0; border-radius:var(--tk-radius-sm); background:transparent; color:var(--tk-c-text-muted); font:inherit; font-size:var(--tk-fs-md); cursor:pointer; text-align:left; min-width:0; }
  .tk-kb-tree__row:hover { background:var(--tk-c-surface2); color:var(--tk-c-text); }
  .tk-kb-tree__row--area { font-weight:var(--tk-fw-semibold); color:var(--tk-c-text); min-height:42px; }
  .tk-kb-tree__row--cat { padding-left:34px; font-weight:var(--tk-fw-medium); min-height:34px; }
  .tk-kb-tree__row--art { padding-left:58px; min-height:34px; font-size:var(--tk-fs-sm); }
  .tk-kb-tree__row[aria-current="true"] { background:var(--tk-c-accent-soft); color:var(--tk-c-text); font-weight:var(--tk-fw-semibold); box-shadow:inset 3px 0 0 var(--tk-c-accent); }
  .tk-kb-tree__chev { transition:transform var(--tk-motion-fast); flex:none; color:var(--tk-c-text-subtle); }
  .tk-kb-tree__row[aria-expanded="true"] > .tk-kb-tree__chev { transform:rotate(90deg); }
  .tk-kb-tree__count { margin-left:auto; font-size:var(--tk-fs-xs); color:var(--tk-c-text-subtle); font-variant-numeric:tabular-nums; }
  .tk-kb-tree__icon { width:26px; height:26px; border-radius:8px; display:grid; place-items:center; flex:none; }
  .bp-mobile .tk-kb-tree__row { min-height:44px; }
  .bp-mobile .tk-kb-tree__row--cat, .bp-mobile .tk-kb-tree__row--art { min-height:44px; }`,
  example: { data: { areas: [{ id: 'Technik', name: 'Technik', icon: 'laptop', tone: 'accent' }, { id: 'Persönlich', name: 'Persönlich', icon: 'heart-pulse', tone: 'success' }], articles: [
    { id: 'a1', title: 'Git-Workflow im Team', area: 'Technik', category: 'Entwicklung', body: '', updated: '2026-11-20T10:00:00' },
    { id: 'a2', title: 'Backup-Strategie', area: 'Technik', category: 'Betrieb', body: '', updated: '2026-11-12T10:00:00' },
    { id: 'a3', title: 'Wochenplanung (GTD)', area: 'Persönlich', category: 'Produktivität', body: '', updated: '2026-11-05T10:00:00' },
  ] } },
  render: ({ props, data, ctx }) => {
    const arts = data.articles || [];
    const areaMeta = Object.fromEntries((data.areas || []).map((a) => [a.id, a]));
    const q = (ctx.ui.query || '').trim();
    const shown = applyUiFilter(arts, ctx.ui, { searchFields: ['title', 'body'] });
    const activeId = ctx.ui.selectedId ?? arts[0]?.id;
    const active = arts.find((a) => a.id === activeId);
    const [open, setOpen] = useState(() => new Set(props.expandAll ? [...arts.map((a) => `a:${a.area}`), ...arts.map((a) => `c:${a.area}/${a.category}`)] : [`a:${active?.area}`, `c:${active?.area}/${active?.category}`]));
    const isOpen = (k) => q || open.has(k);
    const toggle = (k, label) => { setOpen((s) => { const n = new Set(s); n.has(k) ? n.delete(k) : n.add(k); return n; }); ctx.emit('kb.toggle', { node: label }); };
    const body = !shown.length
      ? html`<${EmptyState} icon="library" title=${q ? 'Keine Treffer' : 'Noch keine Artikel'} text=${q ? `Zu „${q}“ gibt es keine Artikel.` : 'Lege den ersten Artikel an.'} />`
      : html`<nav class="tk-kb-tree" aria-label="Wissensbaum">${groupBy(shown, (a) => a.area).map(([area, inArea]) => {
        const meta = areaMeta[area] || {}; const ak = `a:${area}`;
        return html`<div>
          <button type="button" class="tk-kb-tree__row tk-kb-tree__row--area" aria-expanded=${isOpen(ak) ? 'true' : 'false'} onClick=${() => toggle(ak, area)}>
            <span class="tk-kb-tree__chev"><${Icon} name="chevron-right" size=${15} /></span>
            <span class="tk-kb-tree__icon" style=${`background:color-mix(in srgb, ${toneColor(meta.tone)} 16%, transparent);color:${toneColor(meta.tone)}`}><${Icon} name=${meta.icon || 'folder'} size=${15} /></span>
            <span class="tk-truncate">${meta.name || area}</span>${props.showCounts && html`<span class="tk-kb-tree__count">${inArea.length}</span>`}</button>
          ${isOpen(ak) && groupBy(inArea, (a) => a.category).map(([cat, list]) => { const ck = `c:${area}/${cat}`; return html`<div>
            <button type="button" class="tk-kb-tree__row tk-kb-tree__row--cat" aria-expanded=${isOpen(ck) ? 'true' : 'false'} onClick=${() => toggle(ck, cat)}>
              <span class="tk-kb-tree__chev"><${Icon} name="chevron-right" size=${14} /></span><span class="tk-truncate">${cat}</span>${props.showCounts && html`<span class="tk-kb-tree__count">${list.length}</span>`}</button>
            ${isOpen(ck) && list.map((a) => html`<button type="button" class="tk-kb-tree__row tk-kb-tree__row--art" aria-current=${a.id === activeId ? 'true' : 'false'} onClick=${() => { ctx.setUi('selectedId', a.id); ctx.emit('kb.open', { id: a.id }); }}>
              <${Icon} name="file-text" size=${14} /><span class="tk-truncate">${a.title}</span></button>`)}</div>`; })}</div>`; })}</nav>`;
    return props.bare ? body : html`<${Card} flush title=${props.title} icon="library" actions=${html`<${Badge}>${shown.length}<//>`}>${body}<//>`;
  },
};
