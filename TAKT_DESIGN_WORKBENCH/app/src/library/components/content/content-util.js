// Gemeinsame Helfer der Inhalts-Komponenten (Notizen, Wissensdatenbank, OCR): Datum, Markdown-Mini-Renderer.
// Keine Komponente – wird nur von den Dateien in diesem Ordner importiert.
import { html } from '../../../lib/html.js';
import { Check, Icon } from '../../ui.js';
import { fmt, slug } from '../../../lib/util.js';

const pad = (n) => String(n).padStart(2, '0');
/** Lokaler ISO-String ohne Zeitzone (passt zum Format der Demo-Daten). */
export const isoLocal = (d) => { const x = new Date(d); return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}T${pad(x.getHours())}:${pad(x.getMinutes())}:${pad(x.getSeconds())}`; };
const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };

/** Datum relativ zu "jetzt" (ctx.today): "Heute, 07:40", "Gestern", "Fr.", "12.11." */
export function relDay(iso, today) {
  if (!iso) return '';
  const days = Math.round((startOfDay(today) - startOfDay(iso)) / 864e5);
  if (days === 0) return `Heute, ${fmt.time(iso)}`;
  if (days === 1) return 'Gestern';
  if (days === -1) return 'Morgen';
  if (days > 1 && days < 7) return fmt.weekdayLong(iso);
  return fmt.dateShort(iso);
}

/** Markdown -> Klartext-Auszug. */
export const stripMd = (s = '') => String(s).replace(/```[\s\S]*?```/g, ' ').split('\n')
  .map((l) => l.replace(/^#{1,6}\s*/, '').replace(/^\s*[-*]\s+\[[ xX]\]\s*/, '').replace(/^\s*(?:[-*]|\d+\.)\s+/, '').replace(/^>\s*/, '').replace(/[*`]/g, '').trim())
  .filter(Boolean).join(' · ');

export const wordCount = (s = '') => (String(s).trim() ? String(s).trim().split(/\s+/).length : 0);

/** Sortierung für Notizen: angeheftet zuerst, dann zuletzt bearbeitet. */
export const sortNotes = (list) => list.slice().sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || String(b.updated).localeCompare(String(a.updated)));

/** Inhaltsverzeichnis aus Markdown (Ebenen 1–3). */
export function mdToc(md = '') {
  const out = []; let fence = false;
  for (const line of String(md).split('\n')) {
    if (/^```/.test(line)) { fence = !fence; continue; }
    const m = !fence && /^(#{1,3})\s+(.+)$/.exec(line);
    if (m) out.push({ level: m[1].length, text: m[2].trim(), id: `h-${slug(m[2])}` });
  }
  return out;
}

function inline(s) {
  const out = []; const re = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*\s][^*]*\*)/g; let last = 0, m;
  while ((m = re.exec(s))) {
    if (m.index > last) out.push(s.slice(last, m.index));
    const t = m[0];
    out.push(t[0] === '`' ? html`<code>${t.slice(1, -1)}</code>` : t.startsWith('**') ? html`<strong>${t.slice(2, -2)}</strong>` : html`<em>${t.slice(1, -1)}</em>`);
    last = m.index + t.length;
  }
  if (last < s.length) out.push(s.slice(last));
  return out;
}

const CALLOUTS = { hinweis: ['info', 'info'], tipp: ['success', 'sparkles'], warnung: ['warning', 'alert-triangle'], wichtig: ['danger', 'alert-circle'] };

/**
 * Sehr kleiner Markdown-Renderer: Überschriften, Absätze, Listen, Checklisten, Zitate/Hinweise, Codeblöcke.
 * onToggle(zeilenIndex) wird für Checklistenpunkte aufgerufen (macht sie interaktiv).
 * Styles: .tk-md (definiert in kb-article.js).
 */
export function renderMarkdown(md = '', { onToggle } = {}) {
  const lines = String(md).split('\n'); const out = []; let i = 0; let para = [];
  const flush = () => { if (para.length) { out.push(html`<p>${inline(para.join(' '))}</p>`); para = []; } };
  while (i < lines.length) {
    const line = lines[i];
    if (/^```/.test(line)) {
      flush(); const code = []; i++;
      while (i < lines.length && !/^```/.test(lines[i])) code.push(lines[i++]);
      i++; out.push(html`<pre class="tk-md__code" tabindex="0"><code>${code.join('\n')}</code></pre>`); continue;
    }
    const h = /^(#{1,3})\s+(.+)$/.exec(line);
    if (h) { flush(); const Tag = h[1].length <= 2 ? 'h2' : 'h3'; out.push(html`<${Tag} id=${`h-${slug(h[2])}`}>${inline(h[2])}<//>`); i++; continue; }
    if (/^\s*[-*]\s+\[[ xX]\]\s/.test(line)) {
      flush(); const items = [];
      while (i < lines.length && /^\s*[-*]\s+\[[ xX]\]\s/.test(lines[i])) { const m = /^\s*[-*]\s+\[([ xX])\]\s+(.*)$/.exec(lines[i]); items.push({ idx: i, done: m[1] !== ' ', text: m[2] }); i++; }
      out.push(html`<ul class="tk-md__tasks">${items.map((t) => html`<li data-done=${t.done ? 'true' : 'false'}><${Check} checked=${t.done} label=${t.text} onChange=${() => onToggle && onToggle(t.idx)} /><span>${inline(t.text)}</span></li>`)}</ul>`); continue;
    }
    if (/^\s*[-*]\s+/.test(line)) {
      flush(); const items = [];
      while (i < lines.length && /^\s*[-*]\s+(?!\[[ xX]\])/.test(lines[i])) items.push(lines[i++].replace(/^\s*[-*]\s+/, ''));
      out.push(html`<ul>${items.map((t) => html`<li>${inline(t)}</li>`)}</ul>`); continue;
    }
    if (/^\s*\d+\.\s+/.test(line)) {
      flush(); const items = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*\d+\.\s+/, ''));
      out.push(html`<ol>${items.map((t) => html`<li>${inline(t)}</li>`)}</ol>`); continue;
    }
    if (/^>\s?/.test(line)) {
      flush(); const q = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) q.push(lines[i++].replace(/^>\s?/, ''));
      const txt = q.join(' '); const k = /^\**(Hinweis|Tipp|Warnung|Wichtig)\**:?\**\s*/i.exec(txt);
      const [tone, icon] = k ? CALLOUTS[k[1].toLowerCase()] : ['neutral', 'quote'];
      out.push(html`<div class=${`tk-md__callout tk-md__callout--${tone}`}><span class="tk-md__callout-icon"><${Icon} name=${icon} size=${16} /></span><div>${k && html`<strong>${k[1]}:</strong> `}${inline(k ? txt.slice(k[0].length) : txt)}</div></div>`); continue;
    }
    if (!line.trim()) { flush(); i++; continue; }
    para.push(line.trim()); i++;
  }
  flush();
  return out;
}

/** Schaltet die Checkliste in Zeile idx um. */
export const toggleTaskLine = (body, idx) => String(body).split('\n').map((l, i) => (i === idx ? l.replace(/\[( |x|X)\]/, (m, c) => (c === ' ' ? '[x]' : '[ ]')) : l)).join('\n');
