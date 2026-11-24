// Picture to Text: Erkennungsergebnis mit Konfidenz-Markierung, Bildvorschau (gestaltet), Aktionen
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Card, Button, Badge, Icon, Segmented, EmptyState } from '../../ui.js';
import { isoLocal, wordCount } from './content-util.js';

const clean = (w) => w.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');

function Preview({ cap }) {
  const lines = cap.text.split('\n'); const max = Math.max(...lines.map((l) => l.length), 1);
  const flagged = (l) => (cap.uncertain || []).some((u) => l.includes(u.word));
  return html`<div class="tk-ocr__img" role="img" aria-label=${`Vorschau des erfassten Bildes: ${cap.title}`}>
    <span class="tk-ocr__corner tk-ocr__corner--tl"></span><span class="tk-ocr__corner tk-ocr__corner--tr"></span><span class="tk-ocr__corner tk-ocr__corner--bl"></span><span class="tk-ocr__corner tk-ocr__corner--br"></span>
    <div class="tk-ocr__page">${lines.map((l, i) => html`<i data-flag=${flagged(l) ? 'true' : 'false'} style=${`width:${Math.max(24, Math.round((l.length / max) * 100))}%;${i === 0 ? 'height:9px;' : ''}`}></i>`)}</div>
  </div>`;
}

export const ocrResult = {
  id: 'ocr-result',
  name: 'Erkennungsergebnis',
  category: 'Inhalte',
  description: 'Erkannter Text der gewählten Erfassung (ctx.ui.selectedId) mit Markierung unsicherer Wörter (Tippen übernimmt den Korrekturvorschlag), Sprache, Konfidenz, Bildvorschau und Aktionen Kopieren / Als Notiz speichern / Teilen.',
  version: '1.0',
  props: [
    { name: 'showImage', label: 'Bildvorschau', type: 'boolean', default: true },
    { name: 'showConfidence', label: 'Unsichere Wörter markieren', type: 'boolean', default: true },
    { name: 'allowEdit', label: 'Text bearbeiten erlauben', type: 'boolean', default: true },
  ],
  data: [
    { slot: 'captures', label: 'Erfassungen', default: 'captures', shape: '{id,title,text,lang,confidence,uncertain?:{word,alt,conf}[],source?}[]', required: true },
    { slot: 'notes', label: 'Notizen (Ziel für „Als Notiz“)', default: 'notes', shape: 'Notiz-Array', required: false },
  ],
  events: ['ocr.copy', 'ocr.save-note', 'ocr.share', 'ocr.correct', 'ocr.edit'],
  states: ['empty'],
  css: `
  .tk-ocr { display:grid; grid-template-columns:minmax(0,1fr); gap:var(--tk-space-5); min-width:0; }
  .bp-desktop .tk-ocr--img { grid-template-columns:220px minmax(0,1fr); }
  .tk-ocr__img { position:relative; padding:18px; border-radius:var(--tk-radius-lg); background:var(--tk-c-surface3); display:grid; place-items:center; min-height:200px; }
  .tk-ocr__page { width:100%; max-width:200px; min-height:150px; padding:16px 14px; border-radius:var(--tk-radius-sm); background:var(--tk-c-surface); box-shadow:var(--tk-shadow-md); display:flex; flex-direction:column; gap:9px; transform:rotate(-1.2deg); }
  .tk-ocr__page i { display:block; height:6px; border-radius:3px; background:var(--tk-c-border-strong); }
  .tk-ocr__page i[data-flag="true"] { background:var(--tk-c-warning); }
  .tk-ocr__corner { position:absolute; width:16px; height:16px; border:2px solid var(--tk-c-accent); }
  .tk-ocr__corner--tl { top:8px; left:8px; border-right:0; border-bottom:0; border-top-left-radius:6px; }
  .tk-ocr__corner--tr { top:8px; right:8px; border-left:0; border-bottom:0; border-top-right-radius:6px; }
  .tk-ocr__corner--bl { bottom:8px; left:8px; border-right:0; border-top:0; border-bottom-left-radius:6px; }
  .tk-ocr__corner--br { bottom:8px; right:8px; border-left:0; border-top:0; border-bottom-right-radius:6px; }
  .bp-mobile .tk-ocr__img { min-height:150px; }
  .tk-ocr__text { padding:var(--tk-space-4); border-radius:var(--tk-radius-md); border:1px solid var(--tk-c-border); background:var(--tk-c-surface2); font-size:var(--tk-fs-md); line-height:2; white-space:pre-wrap; overflow-wrap:anywhere; min-height:140px; }
  .tk-ocr__word { display:inline-block; padding:0 4px; margin:0 -1px; border:0; border-bottom:2px dashed var(--tk-c-warning); border-radius:4px 4px 0 0; background:var(--tk-c-warning-soft); color:var(--tk-c-text); font:inherit; line-height:1.5; cursor:pointer; }
  .tk-ocr__word:hover { background:var(--tk-c-warning); color:var(--tk-c-bg); }
  .bp-mobile .tk-ocr__word { min-height:36px; padding:6px 6px; line-height:1.3; }
  .tk-ocr__meta { display:flex; flex-wrap:wrap; gap:6px; align-items:center; }
  .tk-ocr__actions { display:flex; gap:var(--tk-space-2); flex-wrap:wrap; }
  .bp-mobile .tk-ocr__actions .tk-btn { flex:1 1 40%; }
  .tk-ocr__legend { font-size:var(--tk-fs-sm); color:var(--tk-c-text-subtle); display:flex; align-items:center; gap:6px; }`,
  example: { data: { notes: [], captures: [{ id: 'c1', title: 'Whiteboard Sprint-Planung', text: 'Sprint 23 – Planung\nZiel: Workbench-Beta\nOffen: Kaiender-Varianten\nDemo am Freitag 14:00', lang: 'Deutsch', confidence: 0.93, uncertain: [{ word: 'Kaiender-Varianten', alt: 'Kalender-Varianten', conf: 0.58 }] }] } },
  render: ({ props, data, setData, ctx }) => {
    const [mode, setMode] = useState('view');
    const [saved, setSaved] = useState(null);
    const caps = data.captures || [];
    const cap = caps.find((c) => c.id === ctx.ui.selectedId) || caps[0];
    if (!cap) return html`<${Card}><${EmptyState} icon="scan-text" title="Noch kein Text erkannt" text="Erfasse ein Bild – der erkannte Text erscheint hier." /><//>`;
    const unsure = cap.uncertain || [];
    const conf = Math.round(cap.confidence * 100);
    const copy = () => { try { navigator.clipboard?.writeText(cap.text); } catch { /* Vorschau */ } ctx.emit('ocr.copy', { id: cap.id }); ctx.toast('Text kopiert'); };
    const toNote = () => {
      const id = `n${Date.now().toString(36)}`;
      setData('notes', (a) => [{ id, title: cap.title, body: `${cap.text.split('\n').join('\n\n')}`, tags: ['OCR'], updated: isoLocal(ctx.today) }, ...(Array.isArray(a) ? a : [])]);
      setSaved(cap.id); ctx.emit('ocr.save-note', { id: cap.id }); ctx.toast('Als Notiz gespeichert');
    };
    const share = () => { ctx.emit('ocr.share', { id: cap.id }); ctx.openDialog({ title: 'Text teilen',
      body: (close) => html`<div class="tk-col" style="gap:8px">${[['mail', 'Per E-Mail senden'], ['file-text', 'Als Textdatei (.txt) sichern'], ['link-2', 'Link zum Ergebnis kopieren']].map(([ic, l]) => html`<${Button} icon=${ic} style="justify-content:flex-start" onClick=${() => { ctx.toast(l); close(); }}>${l}<//>`)}</div>` }); };
    const fix = (u) => { setData('captures', (all) => all.map((c) => (c.id === cap.id ? { ...c, text: c.text.replace(u.word, u.alt), uncertain: (c.uncertain || []).filter((x) => x.word !== u.word) } : c))); ctx.emit('ocr.correct', { word: u.word, alt: u.alt }); ctx.toast(`„${u.word}“ → „${u.alt}“`); };
    const renderLine = (line) => line.split(/(\s+)/).map((tok) => { const u = props.showConfidence && unsure.find((x) => clean(tok) === clean(x.word) && tok.trim()); return u ? html`<button type="button" class="tk-ocr__word" title=${`Unsicher (${Math.round(u.conf * 100)} %) – tippen für „${u.alt}“`} aria-label=${`Unsicheres Wort ${tok}, Vorschlag ${u.alt}`} onClick=${() => fix(u)}>${tok}</button>` : tok; });
    const words = wordCount(cap.text);

    return html`<${Card} title=${cap.title} icon="scan-text" actions=${props.allowEdit && html`<${Segmented} label="Textmodus" value=${mode} onChange=${(m) => { setMode(m); ctx.emit('ocr.edit', { mode: m }); }} options=${[{ value: 'view', label: 'Ansicht' }, { value: 'edit', label: 'Bearbeiten' }]} />`}>
      <div class=${`tk-ocr ${props.showImage ? 'tk-ocr--img' : ''}`}>
        ${props.showImage && html`<${Preview} cap=${cap} />`}
        <div class="tk-col" style="gap:14px">
          <div class="tk-ocr__meta">
            <${Badge} icon="languages">${cap.lang}<//>
            <${Badge}><span class="tk-dot" style=${`color:var(--tk-c-${cap.confidence > 0.9 ? 'success' : 'warning'})`}></span>Konfidenz ${conf} %<//>
            <${Badge}>${words} ${words === 1 ? 'Wort' : 'Wörter'}<//>
            ${unsure.length > 0 && props.showConfidence && html`<${Badge} icon="alert-triangle">${unsure.length} unsicher<//>`}
          </div>
          ${mode === 'edit'
            ? html`<textarea class="tk-textarea" style="min-height:180px;line-height:1.7" aria-label="Erkannten Text bearbeiten" value=${cap.text} onInput=${(e) => { const v = e.currentTarget.value; setData('captures', (all) => all.map((c) => (c.id === cap.id ? { ...c, text: v } : c))); }}></textarea>`
            : html`<div class="tk-ocr__text">${cap.text.split('\n').map((l, i, a) => html`<span>${renderLine(l)}${i < a.length - 1 ? '\n' : ''}</span>`)}</div>`}
          ${unsure.length > 0 && props.showConfidence && mode === 'view' && html`<div class="tk-ocr__legend"><${Icon} name="info" size=${14} />Markierte Wörter sind unsicher – antippen, um den Vorschlag zu übernehmen.</div>`}
          <div class="tk-ocr__actions">
            <${Button} icon="copy" onClick=${copy}>Kopieren<//>
            <${Button} variant="primary" icon=${saved === cap.id ? 'check' : 'notebook-pen'} onClick=${toNote} disabled=${saved === cap.id}>${saved === cap.id ? 'Als Notiz gespeichert' : 'Als Notiz speichern'}<//>
            <${Button} icon="send" onClick=${share}>Teilen<//>
          </div>
        </div>
      </div><//>`;
  },
};
