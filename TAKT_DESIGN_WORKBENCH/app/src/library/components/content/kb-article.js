// Wissensdatenbank: Artikelansicht (Markdown, Inhaltsverzeichnis, Metadaten, verwandte Artikel, Bearbeiten)
import { html } from '../../../lib/html.js';
import { useState, useRef, useEffect } from 'preact/hooks';
import { Card, Button, Badge, Icon, EmptyState, Textarea } from '../../ui.js';
import { renderMarkdown, mdToc, relDay, wordCount, isoLocal } from './content-util.js';

export const kbArticle = {
  id: 'kb-article',
  name: 'Wissensartikel',
  category: 'Inhalte',
  description: 'Zeigt den gewählten Artikel (ctx.ui.selectedId) mit Markdown-Darstellung, Inhaltsverzeichnis (Desktop), Metadaten und verwandten Artikeln. Optional direkt bearbeitbar.',
  version: '1.0',
  props: [
    { name: 'showToc', label: 'Inhaltsverzeichnis (Desktop)', type: 'boolean', default: true },
    { name: 'showRelated', label: 'Verwandte Artikel', type: 'boolean', default: true },
    { name: 'editable', label: 'Bearbeiten erlauben', type: 'boolean', default: true },
    { name: 'scrollOnSelect', label: 'Beim Wechsel zum Artikel scrollen', type: 'boolean', default: false },
    { name: 'autoSelectFirst', label: 'Ersten automatisch wählen', type: 'boolean', default: true },
    { name: 'placeholder', label: 'Hinweis ohne Auswahl', type: 'text', default: 'Wähle einen Artikel aus der Navigation.' },
  ],
  data: [{ slot: 'articles', label: 'Artikel', default: 'articles', shape: '{id,title,area,category,body,tags?,author?,updated,related?:id[],bookmarked?}[]', required: true }],
  events: ['kb.related', 'kb.toc', 'kb.bookmark', 'kb.edit', 'kb.save', 'kb.open'],
  states: ['empty'],
  css: `
  .tk-md { font-size:var(--tk-fs-md); line-height:1.7; color:var(--tk-c-text); min-width:0; overflow-wrap:anywhere; }
  .tk-md > :first-child { margin-top:0; } .tk-md > :last-child { margin-bottom:0; }
  .tk-md h2 { font-size:var(--tk-fs-xl); font-weight:var(--tk-fw-semibold); letter-spacing:var(--tk-ls-tight); margin:1.6em 0 .5em; scroll-margin-top:72px; }
  .tk-md h3 { font-size:var(--tk-fs-lg); font-weight:var(--tk-fw-semibold); margin:1.4em 0 .4em; scroll-margin-top:72px; }
  .tk-md h4 { font-size:var(--tk-fs-md); font-weight:var(--tk-fw-semibold); margin:1.2em 0 .3em; }
  .tk-md p { margin:.7em 0; color:var(--tk-c-text-muted); }
  .tk-md ul, .tk-md ol { margin:.7em 0; padding-left:1.4em; color:var(--tk-c-text-muted); } .tk-md li { margin:.25em 0; padding-left:.2em; }
  .tk-md strong { color:var(--tk-c-text); font-weight:var(--tk-fw-semibold); }
  .tk-md code { font-family:var(--tk-font-mono); font-size:.88em; padding:.12em .4em; border-radius:var(--tk-radius-xs); background:var(--tk-c-surface3); color:var(--tk-c-text); }
  .tk-md__code { margin:.9em 0; padding:var(--tk-space-3) var(--tk-space-4); border-radius:var(--tk-radius-md); background:var(--tk-c-surface2); border:1px solid var(--tk-c-border); overflow-x:auto; line-height:1.55; max-width:100%; }
  .tk-md__code code { padding:0; background:none; font-size:var(--tk-fs-sm); white-space:pre; }
  .tk-md__tasks { list-style:none; padding-left:0 !important; }
  .tk-md__tasks li { display:flex; gap:12px; align-items:center; padding-left:0; min-height:32px; }
  .tk-md__tasks li[data-done="true"] span { text-decoration:line-through; color:var(--tk-c-text-subtle); }
  .bp-mobile .tk-md__tasks li { min-height:44px; }
  .tk-md__callout { display:flex; gap:10px; margin:1em 0; padding:var(--tk-space-3) var(--tk-space-4); border-radius:var(--tk-radius-md); background:var(--tk-c-surface2); border-left:3px solid var(--tk-c-border-strong); color:var(--tk-c-text-muted); font-size:var(--tk-fs-sm); line-height:1.6; }
  .tk-md__callout-icon { flex:none; margin-top:2px; color:var(--tk-c-text-subtle); }
  .tk-md__callout--info { background:var(--tk-c-info-soft); border-left-color:var(--tk-c-info); } .tk-md__callout--info .tk-md__callout-icon { color:var(--tk-c-info); }
  .tk-md__callout--success { background:var(--tk-c-success-soft); border-left-color:var(--tk-c-success); } .tk-md__callout--success .tk-md__callout-icon { color:var(--tk-c-success); }
  .tk-md__callout--warning { background:var(--tk-c-warning-soft); border-left-color:var(--tk-c-warning); } .tk-md__callout--warning .tk-md__callout-icon { color:var(--tk-c-warning); }
  .tk-md__callout--danger { background:var(--tk-c-danger-soft); border-left-color:var(--tk-c-danger); } .tk-md__callout--danger .tk-md__callout-icon { color:var(--tk-c-danger); }
  .tk-md__callout strong { color:var(--tk-c-text); }
  .tk-kb-article { display:grid; grid-template-columns:minmax(0,1fr); gap:var(--tk-space-6); min-width:0; }
  .bp-desktop .tk-kb-article--toc { grid-template-columns:minmax(0,1fr) 200px; }
  .tk-kb-article__crumb { display:flex; align-items:center; gap:4px; font-size:var(--tk-fs-sm); color:var(--tk-c-text-subtle); flex-wrap:wrap; }
  .tk-kb-article__title { font-size:var(--tk-fs-3xl); font-weight:var(--tk-fw-bold); letter-spacing:var(--tk-ls-tight); line-height:1.15; margin:6px 0 10px; }
  .bp-mobile .tk-kb-article__title { font-size:var(--tk-fs-2xl); }
  .tk-kb-article__meta { display:flex; flex-wrap:wrap; gap:6px 14px; align-items:center; font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); }
  .tk-kb-article__meta span { display:inline-flex; align-items:center; gap:5px; }
  .tk-kb-article__toc { position:sticky; top:72px; align-self:start; display:flex; flex-direction:column; gap:2px; border-left:1px solid var(--tk-c-border); padding-left:var(--tk-space-3); }
  .tk-kb-article__toc button { text-align:left; border:0; background:none; color:var(--tk-c-text-muted); font:inherit; font-size:var(--tk-fs-sm); padding:5px 0; cursor:pointer; }
  .tk-kb-article__toc button:hover { color:var(--tk-c-accent); }
  .tk-kb-article__rel { display:flex; flex-direction:column; margin-top:var(--tk-space-6); border-top:1px solid var(--tk-c-border); padding-top:var(--tk-space-4); gap:4px; }
  .tk-kb-article__rel button { display:flex; align-items:center; gap:10px; text-align:left; border:0; border-radius:var(--tk-radius-sm); background:transparent; color:var(--tk-c-text); font:inherit; padding:8px 8px; min-height:40px; cursor:pointer; }
  .tk-kb-article__rel button:hover { background:var(--tk-c-surface2); }
  .bp-mobile .tk-kb-article__rel button { min-height:48px; }`,
  example: { data: { articles: [
    { id: 'a1', title: 'Git-Workflow im Team', area: 'Technik', category: 'Entwicklung', author: 'Jana', tags: ['Git', 'Team'], updated: '2026-11-20T10:00:00', related: ['a2'],
      body: 'Dieser Leitfaden beschreibt, wie wir **Feature-Branches** nutzen.\n\n## Branches\n- `main` ist immer lauffähig\n- Feature-Branches heißen `feat/<thema>`\n\n> Hinweis: Direkte Pushes auf `main` sind gesperrt.\n\n## Ablauf\n1. Branch anlegen\n2. Änderungen committen\n3. Pull Request öffnen\n\n```\ngit switch -c feat/neues-modul\n```' },
    { id: 'a2', title: 'Backup-Strategie', area: 'Technik', category: 'Betrieb', updated: '2026-11-12T10:00:00', body: '## 3-2-1\nDrei Kopien, zwei Medien, eine extern.' },
  ] } },
  render: ({ props, data, setData, ctx }) => {
    const arts = data.articles || [];
    const [editing, setEditing] = useState(null);
    const root = useRef(null); const first = useRef(true);
    useEffect(() => { if (first.current) { first.current = false; return; } if (props.scrollOnSelect && root.current) root.current.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, [ctx.ui.selectedId]);
    const art = arts.find((a) => a.id === ctx.ui.selectedId) || (props.autoSelectFirst ? arts[0] : null);
    if (!art) return html`<${Card}><${EmptyState} icon="book-open" title=${arts.length ? 'Kein Artikel gewählt' : 'Noch keine Artikel'} text=${arts.length ? props.placeholder : 'Lege den ersten Wissensartikel an.'} /><//>`;
    const toc = props.showToc && ctx.bp === 'desktop' ? mdToc(art.body).filter((h) => h.level >= 2) : [];
    const related = props.showRelated ? (art.related || []).map((id) => arts.find((a) => a.id === id)).filter(Boolean) : [];
    const isEdit = editing && editing.id === art.id;
    const save = () => { setData('articles', (all) => all.map((a) => (a.id === art.id ? { ...a, body: editing.body, updated: isoLocal(ctx.today) } : a))); ctx.emit('kb.save', { id: art.id }); ctx.toast('Artikel gespeichert'); setEditing(null); };
    const mins = Math.max(1, Math.round(wordCount(art.body) / 200));
    return html`<${Card}><div class=${`tk-kb-article ${toc.length ? 'tk-kb-article--toc' : ''}`}>
      <article ref=${root} style="min-width:0;scroll-margin-top:72px">
        <div class="tk-row" style="align-items:flex-start;gap:12px">
          <div class="tk-grow">
            <div class="tk-kb-article__crumb"><span>${art.area}</span><${Icon} name="chevron-right" size=${13} /><span>${art.category}</span></div>
            <h2 class="tk-kb-article__title">${art.title}</h2>
          </div>
          <div class="tk-row" style="gap:2px;flex:none">
            <${Button} variant="ghost" size="sm" icon="bookmark" aria-label=${art.bookmarked ? 'Lesezeichen entfernen' : 'Lesezeichen setzen'} aria-pressed=${art.bookmarked ? 'true' : 'false'} style=${art.bookmarked ? 'color:var(--tk-c-accent)' : ''}
              onClick=${() => { setData('articles', (all) => all.map((a) => (a.id === art.id ? { ...a, bookmarked: !a.bookmarked } : a))); ctx.emit('kb.bookmark', { id: art.id }); ctx.toast(art.bookmarked ? 'Lesezeichen entfernt' : 'Lesezeichen gesetzt'); }} />
            ${props.editable && !isEdit && html`<${Button} variant="ghost" size="sm" icon="pencil" aria-label="Artikel bearbeiten" onClick=${() => { setEditing({ id: art.id, body: art.body }); ctx.emit('kb.edit', { id: art.id }); }} />`}
          </div>
        </div>
        <div class="tk-kb-article__meta">
          <span><${Icon} name="clock" size=${14} />Aktualisiert ${relDay(art.updated, ctx.today).replace('Heute, ', 'heute ')}</span>
          ${art.author && html`<span><${Icon} name="user" size=${14} />${art.author}</span>`}
          <span><${Icon} name="book-open" size=${14} />${mins} Min. Lesezeit</span>
          ${(art.tags || []).map((t) => html`<${Badge}>${t}<//>`)}
        </div>
        <div style="height:var(--tk-space-4)"></div>
        ${isEdit ? html`<div class="tk-col" style="gap:12px">
            <${Textarea} value=${editing.body} onInput=${(v) => setEditing({ ...editing, body: v })} aria-label="Artikeltext (Markdown)" style="min-height:300px;font-family:var(--tk-font-mono);font-size:var(--tk-fs-sm)" />
            <div class="tk-row" style="justify-content:flex-end"><${Button} onClick=${() => setEditing(null)}>Abbrechen<//><${Button} variant="primary" icon="check" onClick=${save}>Speichern<//></div></div>`
          : html`<div class="tk-md">${renderMarkdown(art.body)}</div>`}
        ${related.length > 0 && html`<div class="tk-kb-article__rel"><div class="tk-label">Verwandte Artikel</div>
          ${related.map((r) => html`<button type="button" onClick=${() => { ctx.setUi('selectedId', r.id); ctx.emit('kb.related', { id: r.id }); }}><span class="tk-subtle"><${Icon} name="link-2" size=${15} /></span><span class="tk-grow tk-truncate">${r.title}</span><span class="tk-subtle" style="font-size:var(--tk-fs-xs)">${r.category}</span></button>`)}</div>`}
      </article>
      ${toc.length > 0 && html`<aside class="tk-kb-article__toc" aria-label="Inhaltsverzeichnis"><div class="tk-label" style="margin-bottom:6px">Auf dieser Seite</div>
        ${toc.map((h) => html`<button type="button" style=${h.level > 2 ? 'padding-left:12px' : ''} onClick=${() => { document.getElementById(h.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); ctx.emit('kb.toc', { id: h.id }); }}>${h.text}</button>`)}</aside>`}
    </div><//>`;
  },
};
