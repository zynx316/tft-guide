// Notizen: Verteilung der abgelegten Notizen auf Tags (Ring) – rechnet live aus dem Notizbestand und schweigt, solange nichts abgelegt ist.
import { html } from '../../../lib/html.js';
import { Card, toneColor } from '../../ui.js';

export const noteShare = {
  id: 'note-share',
  name: 'Notizen nach Tag',
  category: 'Inhalte',
  description: 'Ring mit der Verteilung der abgelegten Notizen (ohne Eingang und Archiv) auf ihre Tags, Legende mit Anzahl. Rechnet live aus dem Notizbestand, sortiert die Fächer des Eingangs also sofort mit; ohne getaggte Notizen erscheint nichts.',
  version: '1.0',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Notizen nach Tag' },
    { name: 'limit', label: 'Max. Tags', type: 'number', default: 6 },
  ],
  data: [{ slot: 'notes', label: 'Notizen', default: 'notes', shape: '{id,tags?,inbox?,archived?}[]', required: true }],
  events: [],
  states: ['empty'],
  flutter: { widget: 'TaktNoteShare', propMap: { title: 'title', limit: 'limit' }, events: [] },
  css: `
  .tk-note-share { display:flex; align-items:center; gap:var(--tk-space-5); flex-wrap:wrap; }
  .tk-note-share__fig { position:relative; width:132px; height:132px; flex:none; }
  .tk-note-share__num { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; font-size:var(--tk-fs-2xl); font-weight:var(--tk-fw-bold); line-height:1.1; font-variant-numeric:tabular-nums; }
  .tk-note-share__num small { font-size:var(--tk-fs-xs); font-weight:var(--tk-fw-regular); color:var(--tk-c-text-muted); }
  .tk-note-share__legend { display:flex; flex-direction:column; gap:8px; flex:1; min-width:min(150px, 100%); }
  .tk-note-share__legend div { display:flex; align-items:center; gap:8px; font-size:var(--tk-fs-md); min-width:0; overflow-wrap:anywhere; } .tk-note-share__legend i { width:10px; height:10px; border-radius:3px; background:var(--c); flex:none; } .tk-note-share__legend b { margin-left:auto; font-variant-numeric:tabular-nums; }`,
  example: { data: { notes: [{ id: 'n1', tags: ['Arbeit'] }, { id: 'n2', tags: ['Arbeit', 'Ideen'] }, { id: 'n3', tags: ['Privat'] }] } },
  render: ({ props, data }) => {
    const live = (data.notes || []).filter((n) => !n.archived && !n.inbox), count = {};
    for (const n of live) for (const t of n.tags || []) count[t] = (count[t] || 0) + 1;
    const rows = Object.entries(count).sort((a, b) => b[1] - a[1]).slice(0, props.limit || 6), sum = rows.reduce((s, r) => s + r[1], 0);
    if (!sum) return null;
    const R = 54, C = 2 * Math.PI * R; let acc = 0;
    return html`<${Card} title=${props.title} icon="chart-pie"><div class="tk-note-share" data-qa="note-share">
      <div class="tk-note-share__fig" role="img" aria-label=${`${live.length} Notizen in ${rows.length} Tags`}><svg viewBox="0 0 132 132" width="132" height="132" aria-hidden="true"><circle cx="66" cy="66" r=${R} fill="none" stroke="var(--tk-c-surface3)" stroke-width="14" />
        ${rows.map(([, v], i) => { const share = v / sum, off = acc; acc += share; return html`<circle cx="66" cy="66" r=${R} fill="none" stroke=${toneColor(1 + (i % 6))} stroke-width="14" stroke-dasharray=${`${Math.max(0, C * share - 2)} ${C}`} stroke-dashoffset=${-C * off} transform="rotate(-90 66 66)" />`; })}</svg>
        <div class="tk-note-share__num"><span>${live.length}</span><small>Notizen</small></div></div>
      <div class="tk-note-share__legend">${rows.map(([t, v], i) => html`<div style=${`--c:${toneColor(1 + (i % 6))}`}><i></i>${t}<b>${v}</b></div>`)}</div></div><//>`;
  },
};
