// Dokumente: Vorschau (Attrappe) – Seite mit Platzhalter-Zeilen, Seitenwechsel, Zoom; sensible Dokumente bleiben bis zum Tipp verdeckt.
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Card, Button, Icon, EmptyState } from '../../ui.js';
import { arr, recentFirst, typeIcon, plural } from './_docs.js';
import { pick } from './_example.js';

/** Deterministische Zeilenbreiten (Prozent) aus Titel und Seite – kein Zufall. */
const widths = (seed, n) => { let s = [...seed].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) % 9973, 7); return Array.from({ length: n }, () => { s = (s * 61 + 17) % 9973; return 48 + (s % 50); }); };

export const dokViewer = {
  id: 'dok-viewer',
  name: 'Dokumentvorschau',
  category: 'Dokumente',
  description: 'Vorschau-Attrappe eines Dokuments: Seite mit Platzhalter-Zeilen, Seitenwechsel und Zoom. Sensible Dokumente (Ausweise) sind verdeckt, bis du „Anzeigen“ tippst. Das Dokument kommt aus ctx.ui.selectedId.',
  version: '1.0',
  props: [
    { name: 'showToolbar', label: 'Werkzeugleiste', type: 'boolean', default: true },
    { name: 'hideSensitive', label: 'Sensible Dokumente verdecken', type: 'boolean', default: true },
  ],
  data: [{ slot: 'documents', label: 'Dokumente', default: 'documents', shape: '{id,title,type,pages,format,size,sensitive?}[]', required: true }],
  events: ['doc.share', 'doc.print', 'doc.page', 'scan.start'],
  states: ['empty'],
  flutter: { widget: 'TaktDocumentViewer', propMap: { showToolbar: 'showToolbar', hideSensitive: 'obscureSensitive' }, events: { 'doc.share': 'onShare', 'doc.print': 'onPrint' } },
  css: `
  .tk-dok-vw { display:flex; flex-direction:column; gap:var(--tk-space-3); min-width:0; }
  .tk-dok-vw__bar { display:flex; align-items:center; gap:var(--tk-space-2); flex-wrap:wrap; } .tk-dok-vw__bar .tk-dok-main { text-align:center; min-width:120px; }
  .tk-dok-vw__stage { padding:var(--tk-space-4); border-radius:var(--tk-radius-lg); background:var(--tk-c-surface2); border:1px solid var(--tk-c-border); display:grid; place-items:center; overflow:auto; max-height:640px; }
  .tk-dok-paper { position:relative; width:var(--w,100%); max-width:520px; aspect-ratio:210 / 297; background:var(--tk-c-surface); border:1px solid var(--tk-c-border-strong); border-radius:var(--tk-radius-sm); box-shadow:var(--tk-shadow-md); padding:8% 9%; display:flex; flex-direction:column; gap:3.2%; overflow:hidden; box-sizing:border-box; }
  .tk-dok-paper > i { display:block; height:2.2%; min-height:5px; border-radius:3px; background:var(--tk-c-surface3); flex:none; } .tk-dok-paper > i.t { height:3.6%; background:color-mix(in srgb, var(--tk-c-accent) 45%, var(--tk-c-surface3)); } .tk-dok-paper > i.g { background:transparent; height:1%; }
  .tk-dok-paper__top { display:flex; align-items:center; justify-content:space-between; color:var(--tk-c-text-subtle); font-size:var(--tk-fs-xs); gap:8px; }
  .tk-dok-paper[data-hidden="true"] > :not(.tk-dok-veil) { filter:blur(7px); } .tk-dok-veil { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px; background:color-mix(in srgb, var(--tk-c-surface) 45%, transparent); }`,
  example: { props: {}, data: pick('documents') },
  render: function DokViewer({ props, data, ctx }) {
    const docs = recentFirst(data.documents), d = arr(docs).find((x) => x.id === ctx.ui.selectedId) || docs[0];
    const [page, setPage] = useState(1), [zoom, setZoom] = useState(100), [shown, setShown] = useState(false);
    if (!d) return html`<${Card}><${EmptyState} icon="file-text" title="Kein Dokument gewählt" text="Wähle ein Dokument in der Liste oder scanne ein neues." action=${html`<${Button} variant="primary" icon="scan" onClick=${() => ctx.emit('scan.start')}>Dokument scannen<//>`} /><//>`;
    const n = Math.max(1, d.pages || 1), p = Math.min(page, n), hidden = props.hideSensitive && d.sensitive && !shown;
    const go = (k) => { const next = Math.min(n, Math.max(1, p + k)); setPage(next); ctx.emit('doc.page', { id: d.id, page: next }); };
    const lines = widths(`${d.title}${p}`, 14);
    const act = (ev, text) => () => { ctx.emit(ev, { id: d.id }); ctx.toast(text); };
    return html`<div class="tk-dok-vw">
      ${props.showToolbar && html`<div class="tk-dok-vw__bar" role="toolbar" aria-label="Vorschau">
        <${Button} size="sm" icon="chevron-left" aria-label="Vorherige Seite" disabled=${p <= 1} onClick=${() => go(-1)} /><span class="tk-dok-main tk-dok-sub" aria-live="polite">Seite ${p} von ${n}</span><${Button} size="sm" icon="chevron-right" aria-label="Nächste Seite" disabled=${p >= n} onClick=${() => go(1)} />
        <${Button} size="sm" icon="minus" aria-label="Verkleinern" disabled=${zoom <= 70} onClick=${() => setZoom(zoom - 15)} /><${Button} size="sm" icon="plus" aria-label="Vergrößern" disabled=${zoom >= 130} onClick=${() => setZoom(zoom + 15)} />
        <${Button} size="sm" icon="share-2" onClick=${act('doc.share', 'Teilen ist in der Demo simuliert')}>Teilen<//><${Button} size="sm" icon="printer" onClick=${act('doc.print', 'Drucken ist in der Demo simuliert')}>Drucken<//></div>`}
      <div class="tk-dok-vw__stage"><div class="tk-dok-paper" style=${`--w:${zoom}%`} data-hidden=${hidden ? 'true' : 'false'} role="img" aria-label=${`Vorschau-Attrappe: ${d.title}, Seite ${p} von ${n}`}>
        <div class="tk-dok-paper__top"><span><${Icon} name=${typeIcon(d.type)} size=${14} /> ${d.type}</span><span>${d.format}</span></div><i class="t" style="width:62%"></i><i class="g"></i>
        ${lines.map((w, i) => html`<i style=${`width:${i % 5 === 4 ? 40 : w}%`} class=${i % 5 === 4 ? 'g' : ''}></i>`)}
        ${hidden && html`<div class="tk-dok-veil"><${Icon} name="lock" size=${22} /><span class="tk-dok-sub">Sensibles Dokument</span><${Button} size="sm" icon="eye" onClick=${() => setShown(true)}>Anzeigen<//></div>`}</div></div>
      <p class="tk-dok-fine">Vorschau als Platzhalter · ${d.format}, ${d.size}, ${plural(n, 'Seite', 'Seiten')}</p></div>`;
  },
};
export default dokViewer;
