// Daten: metric-row, item-list, card-grid, detail-panel, data-table, activity-feed, progress-list
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Card, Badge, Icon, Check, EmptyState, Sparkline, Delta, Progress, Button, toneColor } from '../../ui.js';
import { applyUiFilter, groupBy, toList } from '../../helpers.js';
import { fmt } from '../../../lib/util.js';

export const metricRow = {
  id: 'metric-row',
  name: 'Kennzahlen-Reihe',
  category: 'Daten',
  description: 'KPI-Kacheln mit Wert, Einheit, Trend und optionaler Sparkline. Desktop als Reihe, Mobile als 2er-Raster oder horizontal scrollbar.',
  version: '1.0',
  props: [
    { name: 'columns', label: 'Spalten (Desktop)', type: 'number', default: 4 },
    { name: 'mobileLayout', label: 'Mobile', type: 'select', options: ['grid', 'scroll'], default: 'grid' },
    { name: 'showSpark', label: 'Sparklines', type: 'boolean', default: true },
    { name: 'variant', label: 'Stil', type: 'select', options: ['card', 'plain'], default: 'card' },
  ],
  data: [{ slot: 'metrics', label: 'Kennzahlen', default: 'metrics', shape: '{label,value,unit?,delta?,invert?,icon?,tone?,spark?:number[]}[]', required: true }],
  events: ['metric.open'],
  states: ['empty'],
  css: `
  .tk-metric-row { display:grid; gap:var(--tk-space-3); grid-template-columns:repeat(var(--cols,4), minmax(0,1fr)); }
  .bp-tablet .tk-metric-row { grid-template-columns:repeat(2, minmax(0,1fr)); }
  .bp-mobile .tk-metric-row { grid-template-columns:repeat(2, minmax(0,1fr)); gap:var(--tk-space-2); }
  .bp-mobile .tk-metric-row--scroll { display:flex; overflow-x:auto; scroll-snap-type:x mandatory; scrollbar-width:none; }
  .bp-mobile .tk-metric-row--scroll > * { flex:0 0 46%; scroll-snap-align:start; }
  .tk-metric { display:flex; flex-direction:column; gap:6px; padding:var(--tk-space-4); border-radius:var(--tk-radius-lg); background:var(--tk-c-surface); border:1px solid var(--tk-c-border); min-width:0; cursor:pointer; text-align:left; color:inherit; }
  .tk-metric--plain { background:transparent; border-color:transparent; padding:var(--tk-space-2) 0; }
  .tk-metric__label { display:flex; align-items:center; gap:6px; color:var(--tk-c-text-muted); font-size:var(--tk-fs-sm); min-width:0; }
  .tk-metric__value { font-size:var(--tk-fs-2xl); font-weight:var(--tk-fw-bold); letter-spacing:var(--tk-ls-tight); font-variant-numeric:tabular-nums; line-height:1.1; white-space:nowrap; }
  .tk-metric__value small { font-size:var(--tk-fs-md); font-weight:var(--tk-fw-medium); color:var(--tk-c-text-muted); margin-left:3px; }
  .tk-metric__foot { display:flex; align-items:center; justify-content:space-between; gap:8px; min-height:24px; }
  .bp-mobile .tk-metric { padding:var(--tk-space-3); }
  .bp-mobile .tk-metric__value { font-size:var(--tk-fs-xl); }`,
  example: { data: { metrics: [
    { label: 'Termine heute', value: 6, icon: 'calendar', delta: 2, suffix: '' },
    { label: 'Offene Aufgaben', value: 14, icon: 'list-checks', delta: -12, spark: [18, 17, 17, 15, 16, 14] , invert: true },
    { label: 'Fokuszeit', value: '3,5', unit: 'h', icon: 'timer', delta: 8, spark: [2, 2.5, 3, 2.8, 3.2, 3.5] },
    { label: 'Erledigt (Woche)', value: 23, icon: 'check-check', delta: 15, spark: [3, 5, 4, 6, 2, 3] },
  ] } },
  render: ({ props, data, ctx }) => {
    const ms = data.metrics || [];
    if (!ms.length) return html`<${Card}><${EmptyState} icon="activity" title="Keine Kennzahlen" text="Sobald Daten vorliegen, erscheinen hier die wichtigsten Werte." /><//>`;
    return html`<div class=${`tk-metric-row tk-metric-row--${props.mobileLayout}`} style=${`--cols:${props.columns}`}>
      ${ms.map((m) => html`<button type="button" class=${`tk-metric ${props.variant === 'plain' ? 'tk-metric--plain' : ''}`} onClick=${() => ctx.emit('metric.open', { label: m.label })}>
        <div class="tk-metric__label">${m.icon && html`<span style=${`color:${toneColor(m.tone || 'accent')}`}><${Icon} name=${m.icon} size=${15} /></span>`}<span class="tk-truncate">${m.label}</span></div>
        <div class="tk-metric__value">${m.value}${m.unit && html`<small>${m.unit}</small>`}</div>
        ${(m.delta != null || (props.showSpark && m.spark)) && html`<div class="tk-metric__foot"><${Delta} value=${m.delta} suffix=${m.suffix ?? '%'} invert=${m.invert} />${props.showSpark && m.spark && html`<${Sparkline} values=${m.spark} width=${72} height=${24} tone=${m.tone || 'accent'} />`}</div>`}
      </button>`)}
    </div>`;
  },
};

export const itemList = {
  id: 'item-list',
  name: 'Liste',
  category: 'Daten',
  description: 'Universelle Liste (Titel, Untertitel, Meta, Badge, optional Checkbox). Respektiert Suche/Filter, wählt Elemente für Master-Detail (ctx.ui.selectedId).',
  version: '1.0',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: '' },
    { name: 'checkable', label: 'Abhakbar', type: 'boolean', default: false },
    { name: 'selectable', label: 'Auswählbar (Master-Detail)', type: 'boolean', default: true },
    { name: 'groupBy', label: 'Gruppieren nach Feld', type: 'text', default: '' },
    { name: 'dense', label: 'Kompakt', type: 'boolean', default: false },
    { name: 'limit', label: 'Max. Einträge (0 = alle)', type: 'number', default: 0 },
    { name: 'respectFilter', label: 'Suche/Filter beachten', type: 'boolean', default: true },
    { name: 'emptyTitle', label: 'Leerzustand Titel', type: 'text', default: 'Keine Einträge' },
  ],
  data: [{ slot: 'items', label: 'Einträge', default: 'items', shape: '{id,title,subtitle?,meta?,badge?,tone?,icon?,done?,group?}[]', required: true }],
  events: ['item.open', 'item.toggle'],
  states: ['empty'],
  css: `
  .tk-item-list__group { padding:10px 16px 6px; font-size:var(--tk-fs-xs); font-weight:var(--tk-fw-semibold); letter-spacing:var(--tk-ls-wide); text-transform:uppercase; color:var(--tk-c-text-subtle); background:var(--tk-c-surface2); border-bottom:1px solid var(--tk-c-border); }
  .tk-item-list .tk-listrow[aria-selected="true"] { background:var(--tk-c-accent-soft); }
  .tk-item-list__icon { width:34px; height:34px; border-radius:10px; display:grid; place-items:center; flex:none; background:var(--tk-c-surface2); }
  .tk-item-list__title { font-weight:var(--tk-fw-medium); }
  .tk-item-list__title[data-done="true"] { text-decoration:line-through; color:var(--tk-c-text-subtle); }
  .tk-item-list__sub { font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); }
  .tk-item-list__meta { font-size:var(--tk-fs-sm); color:var(--tk-c-text-subtle); white-space:nowrap; }
  .tk-item-list--dense .tk-listrow { min-height:40px; padding-top:6px; padding-bottom:6px; }
  .bp-mobile .tk-item-list--dense .tk-listrow { min-height:48px; }`,
  example: { props: { title: 'Notizen', groupBy: 'group' }, data: { items: [
    { id: '1', title: 'Projekt-Kickoff vorbereiten', subtitle: 'Agenda, Teilnehmer, Ziele', meta: 'Heute', badge: 'Arbeit', tone: 'accent', icon: 'briefcase', group: 'Heute' },
    { id: '2', title: 'Arzttermin bestätigen', meta: 'Morgen', badge: 'Privat', tone: 'success', icon: 'heart-pulse', group: 'Morgen' },
    { id: '3', title: 'Steuerunterlagen sortieren', subtitle: 'Belege 2026', meta: 'Fr', badge: 'Finanzen', tone: 'warning', icon: 'receipt', group: 'Diese Woche' },
  ] } },
  render: ({ props, data, setData, ctx }) => {
    let items = applyUiFilter(data.items, ctx.ui, { respect: props.respectFilter });
    if (props.limit > 0) items = items.slice(0, props.limit);
    const toggle = (it) => { setData('items', (all) => all.map((x) => (x.id === it.id ? { ...x, done: !x.done } : x))); ctx.emit('item.toggle', { id: it.id }); };
    const open = (it) => { if (props.selectable) ctx.setUi('selectedId', it.id); ctx.emit('item.open', { id: it.id }); };
    const row = (it) => html`<div class="tk-listrow tk-listrow--interactive" role="button" tabindex="0" aria-selected=${ctx.ui.selectedId === it.id ? 'true' : 'false'}
        onClick=${() => open(it)} onKeyDown=${(e) => e.key === 'Enter' && open(it)}>
      ${props.checkable && html`<${Check} checked=${it.done} onChange=${() => toggle(it)} label=${`${it.title} erledigt`} />`}
      ${!props.checkable && it.icon && html`<span class="tk-item-list__icon" style=${`color:${toneColor(it.tone || 'accent')}`}><${Icon} name=${it.icon} size=${17} /></span>`}
      <div class="tk-grow"><div class="tk-item-list__title tk-truncate" data-done=${it.done ? 'true' : 'false'}>${it.title}</div>
        ${it.subtitle && !props.dense && html`<div class="tk-item-list__sub tk-truncate">${it.subtitle}</div>`}</div>
      ${it.badge && ctx.bp !== 'mobile' && html`<${Badge} tone=${it.tone || 'neutral'}>${it.badge}<//>`}
      ${it.meta && html`<span class="tk-item-list__meta">${it.meta}</span>`}
    </div>`;
    const body = !items.length
      ? html`<${EmptyState} icon="inbox" title=${props.emptyTitle} text=${ctx.ui.query ? `Keine Treffer für „${ctx.ui.query}“.` : 'Lege den ersten Eintrag an.'} />`
      : props.groupBy ? groupBy(items, (i) => i[props.groupBy] ?? 'Ohne').map(([g, list]) => html`<div><div class="tk-item-list__group">${g}</div>${list.map(row)}</div>`) : items.map(row);
    return html`<${Card} flush title=${props.title} class=${`tk-item-list ${props.dense ? 'tk-item-list--dense' : ''}`} actions=${props.title && html`<${Badge}>${items.length}<//>`}>${body}<//>`;
  },
};

export const cardGrid = {
  id: 'card-grid',
  name: 'Kartenraster',
  category: 'Daten',
  description: 'Raster aus Inhaltskarten (Notizen, Artikel, Kanäle …) mit Icon/Farbfeld, Text-Auszug und Tags. Spaltenzahl responsiv.',
  version: '1.0',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: '' },
    { name: 'minWidth', label: 'Min. Kartenbreite (px)', type: 'number', default: 240 },
    { name: 'showExcerpt', label: 'Textauszug', type: 'boolean', default: true },
    { name: 'cover', label: 'Farbfeld oben', type: 'boolean', default: false },
    { name: 'respectFilter', label: 'Suche/Filter beachten', type: 'boolean', default: true },
  ],
  data: [{ slot: 'items', label: 'Karten', default: 'items', shape: '{id,title,text?,tags?,icon?,tone?,meta?,pinned?}[]', required: true }],
  events: ['card.open'],
  states: ['empty'],
  css: `
  .tk-card-grid { display:grid; gap:var(--tk-space-3); grid-template-columns:repeat(auto-fill, minmax(min(100%, var(--minw,240px)), 1fr)); }
  .tk-card-grid__card { display:flex; flex-direction:column; gap:8px; text-align:left; color:inherit; padding:0; overflow:hidden; }
  .tk-card-grid__cover { height:64px; display:grid; place-items:center; }
  .tk-card-grid__inner { padding:var(--tk-space-4); display:flex; flex-direction:column; gap:8px; min-width:0; }
  .tk-card-grid__title { font-weight:var(--tk-fw-semibold); display:flex; gap:8px; align-items:center; min-width:0; }
  .tk-card-grid__text { font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden; }
  .tk-card-grid__tags { display:flex; gap:6px; flex-wrap:wrap; }`,
  example: { props: { title: 'Zuletzt bearbeitet' }, data: { items: [
    { id: 'a', title: 'Ideen TAKT V2', text: 'Modulweise Entwicklung, Workbench als Designarbeitsplatz, Freigabeprozess …', tags: ['Projekt'], icon: 'lightbulb', tone: 'warning', meta: 'vor 2 Std.' },
    { id: 'b', title: 'Einkaufsliste', text: 'Hafermilch, Tomaten, Basilikum, Kaffee', tags: ['Privat'], icon: 'shopping-cart', tone: 'success', meta: 'gestern' },
    { id: 'c', title: 'Meeting-Notizen Sales', text: 'Q4-Ziele, neue Kanäle, Preisstrategie für Marktplätze', tags: ['Arbeit', 'Sales'], icon: 'users', tone: 'accent', meta: 'Mo' },
  ] } },
  render: ({ props, data, ctx }) => {
    const items = applyUiFilter(data.items, ctx.ui, { respect: props.respectFilter });
    const grid = !items.length ? html`<${Card}><${EmptyState} icon="layout-grid" title="Keine Inhalte" text=${ctx.ui.query ? `Keine Treffer für „${ctx.ui.query}“.` : 'Hier erscheinen deine Inhalte.'} /><//>`
      : html`<div class="tk-card-grid" style=${`--minw:${props.minWidth}px`}>
        ${items.map((it) => html`<button type="button" class="tk-card tk-card--interactive tk-card-grid__card" onClick=${() => { ctx.setUi('selectedId', it.id); ctx.emit('card.open', { id: it.id }); }}
            style=${ctx.ui.selectedId === it.id ? 'border-color:var(--tk-c-accent)' : ''}>
          ${props.cover && html`<div class="tk-card-grid__cover" style=${`background:color-mix(in srgb, ${toneColor(it.tone)} 16%, transparent);color:${toneColor(it.tone)}`}><${Icon} name=${it.icon || 'file-text'} size=${24} /></div>`}
          <div class="tk-card-grid__inner">
            <div class="tk-card-grid__title">${!props.cover && it.icon && html`<span style=${`color:${toneColor(it.tone)}`}><${Icon} name=${it.icon} size=${16} /></span>`}<span class="tk-truncate">${it.title}</span>${it.pinned && html`<span class="tk-subtle"><${Icon} name="pin" size=${13} /></span>`}</div>
            ${props.showExcerpt && it.text && html`<div class="tk-card-grid__text">${it.text}</div>`}
            <div class="tk-row" style="justify-content:space-between"><div class="tk-card-grid__tags">${(it.tags || []).map((t) => html`<${Badge}>${t}<//>`)}</div>${it.meta && html`<span class="tk-subtle" style="font-size:var(--tk-fs-xs);white-space:nowrap">${it.meta}</span>`}</div>
          </div></button>`)}</div>`;
    return props.title ? html`<div class="tk-col" style="gap:12px"><div class="tk-h3">${props.title}</div>${grid}</div>` : grid;
  },
};

export const detailPanel = {
  id: 'detail-panel',
  name: 'Detailansicht',
  category: 'Daten',
  description: 'Zeigt das in ctx.ui.selectedId gewählte Element (Master-Detail). Felder frei konfigurierbar, Aktionen Bearbeiten/Löschen.',
  version: '1.0',
  props: [
    { name: 'fields', label: 'Felder (key:Label)', type: 'list', default: ['subtitle:Beschreibung', 'meta:Zeitpunkt', 'badge:Kategorie'] },
    { name: 'placeholder', label: 'Hinweis ohne Auswahl', type: 'text', default: 'Wähle links einen Eintrag aus.' },
    { name: 'autoSelectFirst', label: 'Ersten automatisch wählen', type: 'boolean', default: true },
    { name: 'allowDelete', label: 'Löschen erlauben', type: 'boolean', default: true },
  ],
  data: [{ slot: 'items', label: 'Einträge', default: 'items', shape: 'wie Liste', required: true }],
  events: ['detail.edit', 'detail.delete'],
  states: ['empty'],
  css: `
  .tk-detail__title { font-size:var(--tk-fs-xl); font-weight:var(--tk-fw-semibold); letter-spacing:var(--tk-ls-tight); }
  .tk-detail__fields { display:grid; grid-template-columns:minmax(90px, auto) 1fr; gap:10px 16px; margin-top:var(--tk-space-4); font-size:var(--tk-fs-sm); }
  .tk-detail__fields dt { color:var(--tk-c-text-subtle); } .tk-detail__fields dd { margin:0; min-width:0; overflow-wrap:anywhere; }
  .tk-detail__text { margin-top:var(--tk-space-4); color:var(--tk-c-text-muted); line-height:var(--tk-lh-normal); white-space:pre-wrap; }`,
  example: { data: { items: [{ id: '1', title: 'Projekt-Kickoff vorbereiten', subtitle: 'Agenda, Teilnehmer, Ziele', meta: 'Heute, 14:00', badge: 'Arbeit', text: 'Raum reservieren und Unterlagen vorab verschicken.' }] } },
  render: ({ props, data, setData, ctx }) => {
    const items = data.items || [];
    const sel = items.find((i) => i.id === ctx.ui.selectedId) || (props.autoSelectFirst ? items[0] : null);
    if (!sel) return html`<${Card}><${EmptyState} icon="panel-right" title="Nichts ausgewählt" text=${props.placeholder} /><//>`;
    const fields = toList(props.fields).map((f) => f.split(':'));
    const del = () => ctx.openDialog({
      title: 'Eintrag löschen?',
      body: () => html`<p>„${sel.title}“ wird entfernt. Dies kann in der Vorschau nicht rückgängig gemacht werden.</p>`,
      footer: (close) => html`<${Button} onClick=${close}>Abbrechen<//><${Button} variant="danger" icon="trash-2" onClick=${() => { setData('items', (all) => all.filter((x) => x.id !== sel.id)); ctx.setUi('selectedId', null); ctx.emit('detail.delete', { id: sel.id }); ctx.toast('Gelöscht'); close(); }}>Löschen<//>`,
    });
    return html`<${Card} actions=${html`<div class="tk-row"><${Button} size="sm" icon="pencil" variant="ghost" aria-label="Bearbeiten" onClick=${() => { ctx.emit('detail.edit', { id: sel.id }); ctx.toast('Bearbeiten'); }} />${props.allowDelete && html`<${Button} size="sm" icon="trash-2" variant="ghost" aria-label="Löschen" onClick=${del} />`}</div>`} title=" ">
      <div class="tk-detail__title">${sel.title}</div>
      <dl class="tk-detail__fields">${fields.filter(([k]) => sel[k] != null && sel[k] !== '').map(([k, l]) => html`<dt>${l || k}</dt><dd>${String(sel[k])}</dd>`)}</dl>
      ${sel.text && html`<div class="tk-detail__text">${sel.text}</div>`}
    <//>`;
  },
};

export const dataTable = {
  id: 'data-table',
  name: 'Tabelle',
  category: 'Daten',
  description: 'Sortierbare Tabelle. Spalten per "key:Label:typ" (typ: text|number|currency|percent|date|badge|spark). Mobile: wird zu Karten-Liste (keine horizontale Scrollbar).',
  version: '1.0',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: '' },
    { name: 'columns', label: 'Spalten', type: 'list', default: ['title:Name:text', 'value:Wert:number'] },
    { name: 'mobile', label: 'Mobile-Darstellung', type: 'select', options: ['cards', 'compact'], default: 'cards' },
    { name: 'respectFilter', label: 'Suche/Filter beachten', type: 'boolean', default: true },
  ],
  data: [{ slot: 'rows', label: 'Zeilen', default: 'rows', shape: '{id, …spalten}[]', required: true }],
  events: ['row.open', 'table.sort'],
  states: ['empty'],
  css: `
  .tk-table { width:100%; border-collapse:collapse; font-size:var(--tk-fs-sm); }
  .tk-table th { text-align:left; font-weight:var(--tk-fw-semibold); color:var(--tk-c-text-subtle); font-size:var(--tk-fs-xs); letter-spacing:var(--tk-ls-wide); text-transform:uppercase; padding:10px 16px; border-bottom:1px solid var(--tk-c-border); white-space:nowrap; cursor:pointer; user-select:none; }
  .tk-table td { padding:11px 16px; border-bottom:1px solid var(--tk-c-border); white-space:nowrap; }
  .tk-table tr:last-child td { border-bottom:0; }
  .tk-table tbody tr { cursor:pointer; } .tk-table tbody tr:hover { background:var(--tk-c-surface2); }
  .tk-table tbody tr[aria-selected="true"] { background:var(--tk-c-accent-soft); }
  .tk-table td.num, .tk-table th.num { text-align:right; font-variant-numeric:tabular-nums; }
  .tk-table-wrap { overflow-x:auto; }
  .tk-table-cards .tk-listrow { align-items:flex-start; }
  .tk-table-cards__kv { display:flex; flex-wrap:wrap; gap:4px 14px; font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); margin-top:4px; }`,
  example: { props: { title: 'Watchlist', columns: ['title:Titel:text', 'price:Kurs:currency', 'change:Veränderung:percent', 'trend:Verlauf:spark'] }, data: { rows: [
    { id: 'a', title: 'MSCI World ETF', price: 98.42, change: 0.0123, trend: [94, 95, 97, 96, 98, 98.4] },
    { id: 'b', title: 'Apple', price: 212.1, change: -0.0081, trend: [220, 218, 215, 214, 213, 212] },
    { id: 'c', title: 'Bitcoin', price: 84120, change: 0.0312, trend: [78, 79, 81, 80, 83, 84] },
  ] } },
  render: ({ props, data, ctx }) => {
    const cols = toList(props.columns).map((c) => { const [key, label, type = 'text'] = c.split(':'); return { key, label: label || key, type }; });
    const [sort, setSort] = useState(null);
    let rows = applyUiFilter(data.rows, ctx.ui, { respect: props.respectFilter, searchFields: cols.map((c) => c.key) });
    if (sort) rows = [...rows].sort((a, b) => { const x = a[sort.key], y = b[sort.key]; return (x > y ? 1 : x < y ? -1 : 0) * sort.dir; });
    const cell = (r, c) => {
      const v = r[c.key];
      if (v == null) return '–';
      switch (c.type) {
        case 'number': return fmt.number(v, Number.isInteger(v) ? 0 : 2);
        case 'currency': return fmt.currency(v);
        case 'percent': return html`<span style=${`color:var(--tk-c-${v >= 0 ? 'success' : 'danger'});font-weight:600`}>${v > 0 ? '+' : ''}${fmt.percent(v)}</span>`;
        case 'date': return fmt.date(v);
        case 'badge': return html`<${Badge} tone=${r.tone || 'neutral'}>${v}<//>`;
        case 'spark': return html`<${Sparkline} values=${v} width=${80} height=${22} tone=${v[v.length - 1] >= v[0] ? 'success' : 'danger'} />`;
        default: return String(v);
      }
    };
    const num = (c) => ['number', 'currency', 'percent'].includes(c.type);
    const open = (r) => { ctx.setUi('selectedId', r.id); ctx.emit('row.open', { id: r.id }); };
    if (!rows.length) return html`<${Card} title=${props.title}><${EmptyState} icon="rows-3" title="Keine Daten" text=${ctx.ui.query ? `Keine Treffer für „${ctx.ui.query}“.` : 'Noch keine Einträge vorhanden.'} /><//>`;
    if (ctx.bp === 'mobile' && props.mobile === 'cards') {
      const [first, ...rest] = cols;
      return html`<${Card} flush title=${props.title} class="tk-table-cards">${rows.map((r) => html`<div class="tk-listrow tk-listrow--interactive" onClick=${() => open(r)}>
        <div class="tk-grow"><div style="font-weight:600" class="tk-truncate">${cell(r, first)}</div>
        <div class="tk-table-cards__kv">${rest.map((c) => html`<span>${c.type !== 'spark' && html`<span class="tk-subtle">${c.label}: </span>`}${cell(r, c)}</span>`)}</div></div></div>`)}<//>`;
    }
    return html`<${Card} flush title=${props.title}><div class="tk-table-wrap"><table class="tk-table">
      <thead><tr>${cols.map((c) => html`<th class=${num(c) ? 'num' : ''} onClick=${() => { const s = { key: c.key, dir: sort?.key === c.key ? -sort.dir : 1 }; setSort(s); ctx.emit('table.sort', s); }}>
        ${c.label}${sort?.key === c.key ? (sort.dir > 0 ? ' ↑' : ' ↓') : ''}</th>`)}</tr></thead>
      <tbody>${rows.map((r) => html`<tr aria-selected=${ctx.ui.selectedId === r.id ? 'true' : 'false'} onClick=${() => open(r)}>${cols.map((c) => html`<td class=${num(c) ? 'num' : ''}>${cell(r, c)}</td>`)}</tr>`)}</tbody>
    </table></div><//>`;
  },
};

export const activityFeed = {
  id: 'activity-feed',
  name: 'Aktivitäts-Verlauf',
  category: 'Daten',
  description: 'Chronologische Zeitleiste von Ereignissen (Änderungen, Verlauf, Log).',
  version: '1.0',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Verlauf' },
    { name: 'limit', label: 'Max. Einträge', type: 'number', default: 6 },
  ],
  data: [{ slot: 'events', label: 'Ereignisse', default: 'activity', shape: '{id,title,time,icon?,tone?,text?}[]', required: true }],
  events: ['activity.open'],
  states: ['empty'],
  css: `
  .tk-feed { display:flex; flex-direction:column; }
  .tk-feed__item { display:flex; gap:12px; position:relative; padding-bottom:16px; min-width:0; }
  .tk-feed__item:not(:last-child)::before { content:''; position:absolute; left:13px; top:30px; bottom:2px; width:2px; background:var(--tk-c-border); }
  .tk-feed__dot { width:28px; height:28px; border-radius:9px; display:grid; place-items:center; flex:none; background:var(--tk-c-surface2); }
  .tk-feed__time { font-size:var(--tk-fs-xs); color:var(--tk-c-text-subtle); }`,
  example: { data: { events: [
    { id: '1', title: 'Rechnung #2041 bezahlt', time: '2026-11-24T08:12', icon: 'check', tone: 'success' },
    { id: '2', title: 'Neues Angebot erstellt', time: '2026-11-23T16:40', icon: 'file-text', tone: 'accent', text: 'Kunde Müller GmbH' },
    { id: '3', title: 'Kanal Etsy synchronisiert', time: '2026-11-23T09:05', icon: 'refresh-cw', tone: 'info' },
  ] } },
  render: ({ props, data, ctx }) => {
    const ev = (data.events || []).slice(0, props.limit || 99);
    return html`<${Card} title=${props.title}>${!ev.length ? html`<${EmptyState} icon="history" title="Noch kein Verlauf" />` : html`<div class="tk-feed">
      ${ev.map((e) => html`<div class="tk-feed__item" onClick=${() => ctx.emit('activity.open', { id: e.id })}>
        <span class="tk-feed__dot" style=${`color:${toneColor(e.tone || 'accent')}`}><${Icon} name=${e.icon || 'circle-dot'} size=${15} /></span>
        <div class="tk-grow"><div style="font-weight:500">${e.title}</div>${e.text && html`<div class="tk-muted" style="font-size:var(--tk-fs-sm)">${e.text}</div>`}
        <div class="tk-feed__time">${e.time ? fmt.relative(e.time, ctx.today) : ''}</div></div></div>`)}</div>`}<//>`;
  },
};

export const progressList = {
  id: 'progress-list',
  name: 'Fortschrittsliste',
  category: 'Daten',
  description: 'Beschriftete Fortschrittsbalken (Budgets, Ziele, Kapazitäten) mit Ist/Soll und Warnfarbe bei Überschreitung.',
  version: '1.0',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Fortschritt' },
    { name: 'unit', label: 'Einheit', type: 'text', default: '' },
    { name: 'format', label: 'Format', type: 'select', options: ['number', 'currency', 'percent'], default: 'number' },
  ],
  data: [{ slot: 'items', label: 'Positionen', default: 'goals', shape: '{id,label,value,target,icon?,tone?}[]', required: true }],
  events: ['progress.open'],
  states: ['empty'],
  css: `.tk-progress-list { display:flex; flex-direction:column; gap:14px; } .tk-progress-list__row { display:flex; flex-direction:column; gap:6px; cursor:pointer; } .tk-progress-list__top { display:flex; align-items:center; gap:8px; font-size:var(--tk-fs-sm); min-width:0; }`,
  example: { props: { title: 'Budgets November', format: 'currency' }, data: { items: [
    { id: 'a', label: 'Lebensmittel', value: 412, target: 500, icon: 'utensils' },
    { id: 'b', label: 'Freizeit', value: 236, target: 200, icon: 'party-popper' },
    { id: 'c', label: 'Mobilität', value: 88, target: 150, icon: 'car' },
  ] } },
  render: ({ props, data, ctx }) => {
    const f = (v) => (props.format === 'currency' ? fmt.currency(v) : props.format === 'percent' ? fmt.percent(v) : `${fmt.number(v)}${props.unit ? ' ' + props.unit : ''}`);
    const items = data.items || [];
    return html`<${Card} title=${props.title}>${!items.length ? html`<${EmptyState} icon="target" title="Keine Ziele" />` : html`<div class="tk-progress-list">
      ${items.map((it) => { const r = it.target ? it.value / it.target : 0; const over = r > 1; return html`<div class="tk-progress-list__row" onClick=${() => ctx.emit('progress.open', { id: it.id })}>
        <div class="tk-progress-list__top">${it.icon && html`<span class="tk-subtle"><${Icon} name=${it.icon} size=${15} /></span>`}<span class="tk-grow tk-truncate" style="font-weight:500">${it.label}</span>
          <span class="tk-num" style=${over ? 'color:var(--tk-c-danger);font-weight:600' : ''}>${f(it.value)}</span><span class="tk-subtle tk-num">/ ${f(it.target)}</span></div>
        <${Progress} value=${Math.min(r, 1)} tone=${over ? 'danger' : r > 0.85 ? 'warning' : it.tone} /></div>`; })}</div>`}<//>`;
  },
};

export default [metricRow, itemList, cardGrid, detailPanel, dataTable, activityFeed, progressList];
