// Wissensdatenbank: Verteilung der Artikel (Ring) und Lesezeichen als Karten – beide rechnen aus dem Artikelbestand und schweigen, solange es keine Artikel gibt.
import { html } from '../../../lib/html.js';
import { Card, Badge, Icon, toneColor } from '../../ui.js';
import { relDay, stripMd, shorten } from './content-util.js';

export const kbShare = {
  id: 'kb-share',
  name: 'Artikel nach Bereich',
  category: 'Inhalte',
  description: 'Ring mit der Verteilung der veröffentlichten Artikel auf die Bereiche, Legende mit Anzahl. Wird aus dem Artikelbestand berechnet; ohne Artikel erscheint nichts.',
  version: '1.0',
  props: [{ name: 'title', label: 'Titel', type: 'text', default: 'Artikel nach Bereich' }],
  data: [
    { slot: 'articles', label: 'Artikel', default: 'articles', shape: '{id,area,status?}[]', required: true },
    { slot: 'areas', label: 'Bereiche (Icon/Ton)', default: 'areas', shape: '{id,name,tone?}[]', required: false },
  ],
  events: [],
  states: ['empty'],
  flutter: { widget: 'TaktArticleShare', propMap: { title: 'title' }, events: [] },
  css: `
  .tk-kb-share { display:flex; align-items:center; gap:var(--tk-space-5); flex-wrap:wrap; }
  .tk-kb-share__fig { position:relative; width:132px; height:132px; flex:none; }
  .tk-kb-share__num { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; font-size:var(--tk-fs-2xl); font-weight:var(--tk-fw-bold); line-height:1.1; font-variant-numeric:tabular-nums; }
  .tk-kb-share__num small { font-size:var(--tk-fs-xs); font-weight:var(--tk-fw-regular); color:var(--tk-c-text-muted); }
  .tk-kb-share__legend { display:flex; flex-direction:column; gap:8px; flex:1; min-width:min(150px, 100%); }
  .tk-kb-share__legend div { display:flex; align-items:center; gap:8px; font-size:var(--tk-fs-md); min-width:0; } .tk-kb-share__legend i { width:10px; height:10px; border-radius:3px; background:var(--c); flex:none; } .tk-kb-share__legend b { margin-left:auto; font-variant-numeric:tabular-nums; }`,
  example: { data: { articles: [{ id: 'a', area: 'Technik' }, { id: 'b', area: 'Technik' }, { id: 'c', area: 'Persönlich' }], areas: [{ id: 'Technik', name: 'Technik', tone: 'accent' }, { id: 'Persönlich', name: 'Persönlich', tone: 'success' }] } },
  render: ({ props, data }) => {
    const arts = (data.articles || []).filter((a) => a.status !== 'draft');
    if (!arts.length) return null;
    const meta = Object.fromEntries((data.areas || []).map((a) => [a.id, a]));
    const names = [...new Set(arts.map((a) => a.area))], R = 54, C = 2 * Math.PI * R; let acc = 0;
    return html`<${Card} title=${props.title} icon="chart-pie"><div class="tk-kb-share" data-qa="kb-share">
      <div class="tk-kb-share__fig" role="img" aria-label=${`${arts.length} Artikel in ${names.length} Bereichen`}><svg viewBox="0 0 132 132" width="132" height="132" aria-hidden="true"><circle cx="66" cy="66" r=${R} fill="none" stroke="var(--tk-c-surface3)" stroke-width="14" />
        ${names.map((n) => { const share = arts.filter((a) => a.area === n).length / arts.length, off = acc; acc += share; return html`<circle cx="66" cy="66" r=${R} fill="none" stroke=${toneColor((meta[n] || {}).tone)} stroke-width="14" stroke-dasharray=${`${Math.max(0, C * share - 2)} ${C}`} stroke-dashoffset=${-C * off} transform="rotate(-90 66 66)" />`; })}</svg>
        <div class="tk-kb-share__num"><span>${arts.length}</span><small>Artikel</small></div></div>
      <div class="tk-kb-share__legend">${names.map((n) => html`<div style=${`--c:${toneColor((meta[n] || {}).tone)}`}><i></i>${(meta[n] || {}).name || n}<b>${arts.filter((a) => a.area === n).length}</b></div>`)}</div></div><//>`;
  },
};

export const kbMarks = {
  id: 'kb-marks',
  name: 'Lesezeichen-Karten',
  category: 'Inhalte',
  description: 'Artikel mit Lesezeichen als Karten mit Bereichsfarbe, Auszug und Änderungsdatum. Antippen öffnet den Artikel; ohne Lesezeichen erscheint nichts.',
  version: '1.1',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Lesezeichen' },
    { name: 'minWidth', label: 'Min. Kartenbreite (px)', type: 'number', default: 220 },
  ],
  data: [
    { slot: 'articles', label: 'Artikel', default: 'articles', shape: '{id,title,area,category,body,bookmarked?,updated,status?}[]', required: true },
    { slot: 'areas', label: 'Bereiche (Icon/Ton)', default: 'areas', shape: '{id,name,icon?,tone?}[]', required: false },
  ],
  events: ['card.open'],
  states: ['empty'],
  flutter: { widget: 'TaktArticleMarks', propMap: { title: 'title' }, events: { 'card.open': 'onOpen' } },
  css: `
  .tk-kb-marks { display:grid; gap:var(--tk-space-3); grid-template-columns:repeat(auto-fill, minmax(min(100%, var(--minw,220px)), 1fr)); }
  .tk-kb-marks__card { display:flex; flex-direction:column; text-align:left; padding:0; overflow:hidden; color:inherit; font:inherit; min-width:0; }
  .tk-kb-marks__cover { height:64px; display:grid; place-items:center; }
  .tk-kb-marks__in { padding:var(--tk-space-4); display:flex; flex-direction:column; gap:6px; min-width:0; }
  .tk-kb-marks__in strong { font-weight:var(--tk-fw-semibold); overflow-wrap:anywhere; }
  .tk-kb-marks__in span { font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden; }
  [data-tk-large-text] .tk-kb-marks__in span { display:block; overflow:visible; }`,
  example: { data: { areas: [{ id: 'Technik', name: 'Technik', icon: 'laptop', tone: 'accent' }], articles: [{ id: 'a1', title: 'Git-Workflow im Team', area: 'Technik', category: 'Entwicklung', body: 'Feature-Branches nutzen.', bookmarked: true, updated: '2026-11-20T10:00:00' }] } },
  render: ({ props, data, ctx }) => {
    const list = (data.articles || []).filter((a) => a.status !== 'draft' && a.bookmarked);
    if (!list.length) return null;
    const meta = Object.fromEntries((data.areas || []).map((a) => [a.id, a]));
    return html`<div class="tk-col" style="gap:12px"><div class="tk-h3">${props.title} <${Badge}>${list.length}<//></div><div class="tk-kb-marks" style=${`--minw:${props.minWidth}px`}>${list.map((a) => { const m = meta[a.area] || {};
      return html`<button type="button" class="tk-card tk-card--interactive tk-kb-marks__card" onClick=${() => { ctx.setUi('selectedId', a.id); ctx.emit('card.open', { id: a.id }); }}>
        <div class="tk-kb-marks__cover" style=${`background:color-mix(in srgb, ${toneColor(m.tone)} 16%, transparent);color:${toneColor(m.tone)}`}><${Icon} name=${m.icon || 'file-text'} size=${24} /></div>
        <div class="tk-kb-marks__in"><strong>${a.title}</strong><span>${shorten(stripMd(a.body), 140)}</span><span class="tk-subtle" style="font-size:var(--tk-fs-xs)">${a.area} · ${relDay(a.updated, ctx.today).replace('Heute, ', 'heute ')}</span></div></button>`; })}</div></div>`;
  },
};
