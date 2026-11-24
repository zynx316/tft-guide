// Wissensdatenbank: Artikel als Kapitelkarten – Titelbild mit Lesefortschritt, jedes Kapitel (## Überschrift) als aufklappbare Karte, verwandte Artikel als Karten.
import { html } from '../../../lib/html.js';
import { useState, useEffect } from 'preact/hooks';
import { Card, Button, Badge, Icon, EmptyState, Textarea, Ring, toneColor } from '../../ui.js';
import { renderMarkdown, relDay, isoLocal, readMinutes, stripMd, tagTone, ArticleCreateButton, shorten } from './content-util.js';

/** Zerlegt Markdown in Einleitung und Kapitel (## Überschrift), Codeblöcke bleiben unberührt. */
export function splitChapters(md = '') {
  const lead = []; const chapters = []; let fence = false;
  for (const line of String(md).split('\n')) {
    if (/^```/.test(line)) fence = !fence;
    const h = !fence && /^##\s+(.+)$/.exec(line);
    if (h) { chapters.push({ title: h[1].trim(), lines: [] }); continue; }
    (chapters.length ? chapters[chapters.length - 1].lines : lead).push(line);
  }
  return { lead: lead.join('\n').trim(), chapters: chapters.map((c) => ({ title: c.title, body: c.lines.join('\n').trim() })) };
}

export const kbStory = {
  id: 'kb-story',
  name: 'Artikel als Kapitelkarten',
  category: 'Inhalte',
  description: 'Artikel visuell aufbereitet: farbiges Titelbild mit Lesefortschritt (Ring), die Einleitung als Lead, jedes Kapitel als aufklappbare Karte mit Vorschau, verwandte Artikel als Karten. Auswahl über ctx.ui.selectedId, Lesezeichen und Bearbeiten wie in der Artikelansicht.',
  version: '1.3',
  props: [
    { name: 'editable', label: 'Bearbeiten erlauben', type: 'boolean', default: true },
    { name: 'showRelated', label: 'Verwandte Artikel', type: 'boolean', default: true },
    { name: 'placeholder', label: 'Hinweis ohne Auswahl', type: 'text', default: 'Wähle einen Artikel aus.' },
  ],
  data: [{ slot: 'articles', label: 'Artikel', default: 'articles', shape: '{id,title,area,category,body,tags?,author?,updated,related?:id[],bookmarked?,readProgress?}[]', required: true }],
  events: ['kb.related', 'kb.bookmark', 'kb.edit', 'kb.save', 'kb.open', 'kb.chapter', 'kb.create'],
  states: ['empty'],
  flutter: { widget: 'TaktArticleStory', propMap: { editable: 'editable', showRelated: 'showRelated' }, events: ['kb.related', 'kb.bookmark', 'kb.edit', 'kb.save', 'kb.chapter'] },
  css: `
  .tk-kb-story { display:flex; flex-direction:column; gap:var(--tk-space-4); min-width:0; }
  .tk-kb-story__hero { display:flex; flex-direction:column; gap:var(--tk-space-3); padding:var(--tk-space-6) var(--tk-space-5); border-radius:var(--tk-radius-xl); border:1px solid var(--tk-c-border); background:linear-gradient(150deg, color-mix(in srgb, var(--tone) 38%, var(--tk-c-surface)), var(--tk-c-surface) 80%); min-width:0; }
  .tk-kb-story__top { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; }
  .tk-kb-story__crumb { display:flex; align-items:center; gap:4px; flex-wrap:wrap; font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); }
  .tk-kb-story__title { margin:0; font-size:var(--tk-fs-3xl); font-weight:var(--tk-fw-bold); letter-spacing:var(--tk-ls-tight); line-height:1.15; overflow-wrap:anywhere; }
  .bp-mobile .tk-kb-story__title { font-size:var(--tk-fs-2xl); }
  .tk-kb-story__facts { display:flex; align-items:center; gap:var(--tk-space-4); flex-wrap:wrap; }
  .tk-kb-story__meta { display:flex; flex-wrap:wrap; gap:6px 14px; font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); flex:1; min-width:0; }
  .tk-kb-story__meta span { display:inline-flex; align-items:center; gap:5px; }
  .tk-kb-story__lead { font-size:var(--tk-fs-lg); line-height:1.6; color:var(--tk-c-text); padding:0 var(--tk-space-2); }
  .tk-kb-story__dots { display:flex; gap:6px; } .tk-kb-story__dots i { flex:1; height:6px; border-radius:3px; background:var(--tk-c-surface3); } .tk-kb-story__dots i[data-seen="1"] { background:var(--tk-c-accent); }
  .tk-kb-story__chap { border:1px solid var(--tk-c-border); border-radius:var(--tk-radius-lg); background:var(--tk-c-surface); min-width:0; }
  .tk-kb-story__chap[data-open="true"] { border-color:var(--tk-c-accent); }
  .tk-kb-story__head { display:flex; align-items:center; gap:12px; width:100%; min-height:64px; padding:var(--tk-space-3) var(--tk-space-4); border:0; background:none; color:inherit; font:inherit; text-align:left; cursor:pointer; }
  .tk-kb-story__no { width:36px; height:36px; border-radius:50%; flex:none; display:grid; place-items:center; background:var(--tk-c-accent-soft); color:var(--tk-c-accent); font-weight:var(--tk-fw-bold); font-variant-numeric:tabular-nums; }
  .tk-kb-story__head strong { display:block; font-size:var(--tk-fs-lg); font-weight:var(--tk-fw-semibold); overflow-wrap:anywhere; }
  .tk-kb-story__head small { display:block; color:var(--tk-c-text-muted); font-size:var(--tk-fs-sm); overflow-wrap:anywhere; }
  .tk-kb-story__body { padding:0 var(--tk-space-5) var(--tk-space-4); }
  .tk-kb-story__rel { display:grid; grid-template-columns:repeat(auto-fill, minmax(min(100%, 220px), 1fr)); gap:var(--tk-space-3); }
  .tk-kb-story__card { display:flex; flex-direction:column; gap:6px; min-height:96px; padding:var(--tk-space-4); border:1px solid var(--tk-c-border); border-top:4px solid var(--tone); border-radius:var(--tk-radius-lg); background:var(--tk-c-surface); color:inherit; font:inherit; text-align:left; cursor:pointer; }
  .tk-kb-story__card:hover, .tk-kb-story__card:focus-visible { border-color:var(--tk-c-accent); }
  .tk-kb-story__card span { font-weight:var(--tk-fw-semibold); overflow-wrap:anywhere; } .tk-kb-story__card small { color:var(--tk-c-text-subtle); font-size:var(--tk-fs-sm); }`,
  example: { data: { articles: [
    { id: 'a1', title: 'Git-Workflow im Team', area: 'Technik', category: 'Entwicklung', author: 'Jana', tags: ['Git'], updated: '2026-11-20T10:00:00', related: ['a2'], readProgress: 0.5,
      body: 'Dieser Leitfaden beschreibt, wie wir **Feature-Branches** nutzen.\n\n## Branches\n- `main` ist immer lauffähig\n- Feature-Branches heißen `feat/<thema>`\n\n## Ablauf\n1. Branch anlegen\n2. Pull Request öffnen' },
    { id: 'a2', title: 'Backup-Strategie', area: 'Technik', category: 'Betrieb', updated: '2026-11-12T10:00:00', body: '## 3-2-1\nDrei Kopien, zwei Medien, eine extern.' },
  ] } },
  render: function KbStory({ props, data, setData, ctx }) {
    const arts = data.articles || [];
    const [seen, setSeen] = useState({}), [open, setOpen] = useState({}), [editing, setEditing] = useState(null);
    const art = arts.find((a) => a.id === ctx.ui.selectedId) || arts[0];
    useEffect(() => { if (art && art.fresh && props.editable) setEditing({ id: art.id, body: art.body }); }, [art && art.id]);   // neuer Artikel: direkt im Editor
    if (!art) return html`<${Card}><${EmptyState} icon="book-open" title="Noch keine Artikel" text="Lege den ersten Wissensartikel an." action=${html`<${ArticleCreateButton} ctx=${ctx} setData=${setData} here />`} /><//>`;
    const { lead, chapters } = splitChapters(art.body), key = (i) => `${art.id}:${i}`;
    const isOpen = (i) => (open[key(i)] ?? i === 0), done = (i) => !!seen[key(i)] || isOpen(i) || i < Math.round((art.readProgress || 0) * chapters.length), seenCount = chapters.filter((_, i) => done(i)).length;
    const progress = chapters.length ? seenCount / chapters.length : (art.readProgress || 0);
    const toggle = (i) => { const next = !isOpen(i); setOpen((o) => ({ ...o, [key(i)]: next })); if (next) setSeen((s) => ({ ...s, [key(i)]: true })); ctx.emit('kb.chapter', { id: art.id, chapter: i + 1 }); };
    const related = props.showRelated ? (art.related || []).map((id) => arts.find((a) => a.id === id)).filter(Boolean) : [];
    const patchArt = (p) => setData('articles', (all) => all.map((a) => (a.id === art.id ? { ...a, ...p } : a)));
    const save = () => { const h1 = /^#\s+(.+)$/m.exec(editing.body); patchArt({ body: editing.body, updated: isoLocal(ctx.today), ...(art.fresh ? { fresh: false, title: h1 ? h1[1].trim() : art.title } : {}) }); ctx.emit('kb.save', { id: art.id }); ctx.toast('Artikel gespeichert'); setEditing(null); };
    const isEdit = editing && editing.id === art.id;
    return html`<div class="tk-kb-story" data-qa="kb-story"><div class="tk-kb-story__hero" style=${`--tone:${toneColor(tagTone(art.area))}`}>
        <div class="tk-kb-story__top"><div class="tk-kb-story__crumb"><span>${art.area}</span><${Icon} name="chevron-right" size=${13} /><span>${art.category}</span></div>
          <div class="tk-row" style="gap:2px;flex:none"><${Button} variant="ghost" size="sm" icon="bookmark" aria-label=${art.bookmarked ? 'Lesezeichen entfernen' : 'Lesezeichen setzen'} aria-pressed=${art.bookmarked ? 'true' : 'false'} style=${art.bookmarked ? 'color:var(--tk-c-accent)' : ''} onClick=${() => { patchArt({ bookmarked: !art.bookmarked }); ctx.emit('kb.bookmark', { id: art.id }); ctx.toast(art.bookmarked ? 'Lesezeichen entfernt' : 'Lesezeichen gesetzt'); }} />
            ${props.editable && !isEdit && html`<${Button} variant="ghost" size="sm" icon="pencil" aria-label="Artikel bearbeiten" onClick=${() => { setEditing({ id: art.id, body: art.body }); ctx.emit('kb.edit', { id: art.id }); }} />`}</div></div>
        <h2 class="tk-kb-story__title">${art.title}</h2>
        <div class="tk-kb-story__facts"><${Ring} value=${progress} max=${1} size=${76} stroke=${8} tone=${progress >= 1 ? 'success' : 'accent'} label=${`${Math.round(progress * 100)} % gelesen`}><b style="font-size:var(--tk-fs-sm);white-space:nowrap">${Math.round(progress * 100)} %</b><//>
          <div class="tk-kb-story__meta"><span><${Icon} name="book-open" size=${14} />${readMinutes(art.body)} Min. Lesezeit</span><span><${Icon} name="clock" size=${14} />Aktualisiert ${relDay(art.updated, ctx.today).replace('Heute, ', 'heute ')}</span>${art.author && html`<span><${Icon} name="user" size=${14} />${art.author}</span>`}${(art.tags || []).map((t) => html`<${Badge}>${t}<//>`)}</div></div>
        ${chapters.length > 1 && html`<div class="tk-kb-story__dots" aria-hidden="true">${chapters.map((_, i) => html`<i data-seen=${done(i) ? '1' : '0'}></i>`)}</div>`}</div>
      ${isEdit ? html`<${Card}><div class="tk-col" style="gap:12px"><${Textarea} value=${editing.body} onInput=${(v) => setEditing({ ...editing, body: v })} aria-label="Artikeltext (Markdown)" style="min-height:300px;font-family:var(--tk-font-mono);font-size:var(--tk-fs-sm)" /><div class="tk-row" style="justify-content:flex-end"><${Button} onClick=${() => setEditing(null)}>Abbrechen<//><${Button} variant="primary" icon="check" onClick=${save}>Speichern<//></div></div><//>`
      : html`${lead && html`<div class="tk-kb-story__lead tk-md">${renderMarkdown(lead)}</div>`}
        ${chapters.map((c, i) => html`<div class="tk-kb-story__chap" data-open=${isOpen(i) ? 'true' : 'false'}><button type="button" class="tk-kb-story__head" aria-expanded=${isOpen(i) ? 'true' : 'false'} onClick=${() => toggle(i)}><span class="tk-kb-story__no">${i + 1}</span>
          <span class="tk-grow" style="min-width:0"><strong>${c.title}</strong>${!isOpen(i) && html`<small>${shorten(stripMd(c.body))}</small>`}</span><${Icon} name=${isOpen(i) ? 'chevron-up' : 'chevron-down'} size=${18} /></button>
          ${isOpen(i) && html`<div class="tk-kb-story__body tk-md">${renderMarkdown(c.body)}</div>`}</div>`)}`}
      ${related.length > 0 && !isEdit && html`<div><div class="tk-label" style="margin-bottom:var(--tk-space-3)">Weiterlesen</div><div class="tk-kb-story__rel">${related.map((r) => html`<button type="button" class="tk-kb-story__card" style=${`--tone:${toneColor(tagTone(r.area))}`} onClick=${() => { ctx.setUi('selectedId', r.id); ctx.emit('kb.related', { id: r.id }); }}><small>${r.area} › ${r.category}</small><span>${r.title}</span><small>${readMinutes(r.body)} Min. Lesezeit</small></button>`)}</div></div>`}</div>`;
  },
};
