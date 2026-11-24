// Notizen: Editor (Titel, Markdown-Textbereich mit Toolbar, Tags, Autosave-Anzeige)
import { html } from '../../../lib/html.js';
import { useState, useRef, useEffect } from 'preact/hooks';
import { Card, Button, Badge, Icon, Segmented, EmptyState, Select } from '../../ui.js';
import { fmt } from '../../../lib/util.js';
import { isoLocal, relDay, renderMarkdown, toggleTaskLine, wordCount, sortNotes } from './content-util.js';

const TOOLS = [
  { id: 'heading', icon: 'heading', label: 'Überschrift', prefix: '## ' },
  { id: 'bold', icon: 'bold', label: 'Fett', wrap: '**' },
  { id: 'italic', icon: 'italic', label: 'Kursiv', wrap: '*' },
  { id: 'list', icon: 'list', label: 'Liste', prefix: '- ' },
  { id: 'check', icon: 'list-checks', label: 'Checkliste', prefix: '- [ ] ' },
  { id: 'quote', icon: 'quote', label: 'Zitat', prefix: '> ' },
  { id: 'code', icon: 'code', label: 'Code', wrap: '`' },
];

/** Gemeinsame Aktionen auf dem notes-Slot (Editor, Dialog-Editor). */
export function noteActions({ setData, ctx, id, afterRemove }) {
  const patch = (p) => setData('notes', (all) => (all || []).map((n) => (n.id === id ? { ...n, ...p, updated: isoLocal(ctx.today) } : n)));
  return {
    patch,
    pin: (pinned) => { setData('notes', (all) => all.map((n) => (n.id === id ? { ...n, pinned } : n))); ctx.emit('note.pin', { id, pinned }); ctx.toast(pinned ? 'Notiz angeheftet' : 'Anheften aufgehoben'); },
    archive: (archived) => { setData('notes', (all) => all.map((n) => (n.id === id ? { ...n, archived, pinned: archived ? false : n.pinned } : n))); ctx.setUi('selectedId', null); ctx.emit('note.archive', { id, archived }); ctx.toast(archived ? 'Notiz archiviert' : 'Notiz wiederhergestellt'); afterRemove && afterRemove(); },
    remove: (title) => ctx.openDialog({
      title: 'Notiz löschen?',
      body: () => html`<p>„${title || 'Unbenannte Notiz'}“ wird dauerhaft entfernt.</p>`,
      footer: (close) => html`<${Button} onClick=${close}>Abbrechen<//><${Button} variant="danger" icon="trash-2" onClick=${() => { setData('notes', (all) => all.filter((n) => n.id !== id)); ctx.setUi('selectedId', null); ctx.emit('note.delete', { id }); ctx.toast('Notiz gelöscht'); close(); afterRemove && afterRemove(); }}>Löschen<//>`,
    }),
  };
}

/** Das eigentliche Formular – wird im Editor-Block und im Dialog (Raster-Variante) genutzt. */
export function NoteForm({ note, actions, props, ctx, switcher }) {
  const ta = useRef(null);
  const timer = useRef(null);
  const [mode, setMode] = useState(props.startMode === 'preview' ? 'preview' : 'edit');
  const [saving, setSaving] = useState(false);
  const [tag, setTag] = useState('');
  const focus = props.focusMode;
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => { const el = ta.current; if (el) { el.style.height = 'auto'; el.style.height = `${Math.max(el.scrollHeight + 2, focus ? 360 : 240)}px`; } }, [note.body, mode, ctx.bp]);

  const change = (p) => {
    const first = !timer.current;
    actions.patch(p); setSaving(true); clearTimeout(timer.current);
    if (first) ctx.emit('note.edit', { id: note.id });
    timer.current = setTimeout(() => { setSaving(false); timer.current = null; ctx.emit('note.autosave', { id: note.id }); }, 700);
  };
  const format = (tool) => {
    const el = ta.current; if (!el) return;
    const s = el.selectionStart, e = el.selectionEnd, v = note.body || '';
    let next, a, b;
    if (tool.wrap) { const sel = v.slice(s, e) || 'Text'; next = v.slice(0, s) + tool.wrap + sel + tool.wrap + v.slice(e); a = s + tool.wrap.length; b = a + sel.length; }
    else {
      const ls = v.lastIndexOf('\n', s - 1) + 1; const le = v.indexOf('\n', ls) < 0 ? v.length : v.indexOf('\n', ls);
      const line = v.slice(ls, le); const m = /^(?:- \[[ xX]\] |- |> |#{1,6} |\d+\. )/.exec(line);
      const rest = m ? line.slice(m[0].length) : line; const removing = m && m[0] === tool.prefix;
      const nl = (removing ? '' : tool.prefix) + rest; next = v.slice(0, ls) + nl + v.slice(le);
      a = b = ls + nl.length; if (!rest) a = b = ls + nl.length;
    }
    change({ body: next }); ctx.emit('note.format', { tool: tool.id });
    setTimeout(() => { el.focus(); el.setSelectionRange(a, b); }, 0);
  };
  const addTag = () => { const t = tag.trim().replace(/^#/, ''); if (!t || (note.tags || []).includes(t)) { setTag(''); return; } change({ tags: [...(note.tags || []), t] }); ctx.emit('note.tag.add', { tag: t }); setTag(''); };
  const dropTag = (t) => { change({ tags: (note.tags || []).filter((x) => x !== t) }); ctx.emit('note.tag.remove', { tag: t }); };
  const words = wordCount(note.body);

  return html`<div class=${`tk-note-editor ${focus ? 'tk-note-editor--focus' : ''}`}>
    <div class="tk-note-editor__bar">
      <span class="tk-note-editor__save" data-saving=${saving ? 'true' : 'false'} aria-live="polite"><${Icon} name=${saving ? 'loader-2' : 'check'} size=${14} />${saving ? 'Speichert …' : 'Gespeichert'}</span>
      <span class="tk-grow"></span>
      ${props.allowPreview && html`<${Segmented} label="Modus" value=${mode} onChange=${(m) => { setMode(m); ctx.emit('note.preview', { mode: m }); }} options=${[{ value: 'edit', label: 'Schreiben' }, { value: 'preview', label: 'Vorschau' }]} />`}
      <${Button} variant="ghost" size="sm" icon="pin" aria-label=${note.pinned ? 'Anheften aufheben' : 'Anheften'} aria-pressed=${note.pinned ? 'true' : 'false'} style=${note.pinned ? 'color:var(--tk-c-accent)' : ''} onClick=${() => actions.pin(!note.pinned)} />
      <${Button} variant="ghost" size="sm" icon=${note.archived ? 'archive-restore' : 'archive'} aria-label=${note.archived ? 'Wiederherstellen' : 'Archivieren'} onClick=${() => actions.archive(!note.archived)} />
      <${Button} variant="ghost" size="sm" icon="trash-2" aria-label="Löschen" onClick=${() => actions.remove(note.title)} />
    </div>
    ${switcher}
    <input class="tk-note-editor__title" value=${note.title || ''} placeholder="Titel" aria-label="Titel der Notiz" onInput=${(e) => change({ title: e.currentTarget.value })} />
    ${props.showTags && html`<div class="tk-note-editor__tags">
      ${(note.tags || []).map((t) => html`<button type="button" class="tk-note-editor__tag" aria-label=${`Tag ${t} entfernen`} onClick=${() => dropTag(t)}>#${t}<${Icon} name="x" size=${12} /></button>`)}
      <input class="tk-note-editor__taginput" value=${tag} placeholder="+ Tag" aria-label="Tag hinzufügen" onInput=${(e) => setTag(e.currentTarget.value)} onKeyDown=${(e) => e.key === 'Enter' && addTag()} onBlur=${addTag} />
    </div>`}
    ${mode === 'edit' && props.showToolbar && html`<div class="tk-note-editor__toolbar" data-scroll-x role="toolbar" aria-label="Formatierung">
      ${TOOLS.map((t) => html`<${Button} variant="ghost" size="sm" icon=${t.icon} aria-label=${t.label} title=${t.label} onMouseDown=${(e) => e.preventDefault()} onClick=${() => format(t)} />`)}
    </div>`}
    ${mode === 'edit'
      ? html`<textarea ref=${ta} class="tk-textarea tk-note-editor__body" value=${note.body || ''} placeholder="Schreib los … Markdown wird unterstützt." aria-label="Inhalt der Notiz" onInput=${(e) => change({ body: e.currentTarget.value })}></textarea>`
      : html`<div class="tk-md tk-note-editor__preview">${(note.body || '').trim() ? renderMarkdown(note.body, { onToggle: (idx) => { change({ body: toggleTaskLine(note.body, idx) }); ctx.emit('note.checklist.toggle', { id: note.id }); } }) : html`<p class="tk-subtle">Noch kein Inhalt.</p>`}</div>`}
    <div class="tk-note-editor__foot"><span>${words} ${words === 1 ? 'Wort' : 'Wörter'}</span><span>Bearbeitet ${relDay(note.updated, ctx.today).replace('Heute, ', 'heute ')}</span></div>
  </div>`;
}

export const noteEditor = {
  id: 'note-editor',
  name: 'Notiz-Editor',
  category: 'Inhalte',
  description: 'Bearbeitet die gewählte Notiz (ctx.ui.selectedId): Titel, Markdown-Textbereich mit Formatierungsleiste, Tags, Anheften/Archivieren/Löschen, Autosave-Anzeige und Vorschau mit abhakbaren Checklisten.',
  version: '1.0',
  props: [
    { name: 'showToolbar', label: 'Formatierungsleiste', type: 'boolean', default: true },
    { name: 'showTags', label: 'Tags', type: 'boolean', default: true },
    { name: 'allowPreview', label: 'Vorschau-Umschalter', type: 'boolean', default: true },
    { name: 'startMode', label: 'Startmodus', type: 'select', options: ['edit', 'preview'], default: 'edit' },
    { name: 'focusMode', label: 'Fokus-Modus (große Schrift, ruhig)', type: 'boolean', default: false },
    { name: 'noteSwitcher', label: 'Notiz-Wechsler anzeigen', type: 'boolean', default: false },
  ],
  data: [{ slot: 'notes', label: 'Notizen', default: 'notes', shape: '{id,title,body,tags?,pinned?,archived?,updated}[]', required: true }],
  events: ['note.edit', 'note.autosave', 'note.format', 'note.tag.add', 'note.tag.remove', 'note.pin', 'note.archive', 'note.delete', 'note.preview', 'note.checklist.toggle', 'note.create', 'note.open'],
  states: ['empty'],
  css: `
  .tk-note-editor { display:flex; flex-direction:column; gap:var(--tk-space-3); min-width:0; }
  .tk-note-editor__bar { display:flex; align-items:center; gap:var(--tk-space-2); flex-wrap:wrap; min-width:0; }
  .tk-note-editor__save { display:inline-flex; align-items:center; gap:6px; font-size:var(--tk-fs-sm); color:var(--tk-c-text-subtle); }
  .tk-note-editor__save[data-saving="false"] svg { color:var(--tk-c-success); }
  .tk-note-editor__save[data-saving="true"] svg { animation:tk-note-spin 1s linear infinite; }
  @keyframes tk-note-spin { to { transform:rotate(360deg); } }
  .tk-note-editor__title { width:100%; border:0; outline:0; background:transparent; color:var(--tk-c-text); font:inherit; font-size:var(--tk-fs-2xl); font-weight:var(--tk-fw-bold); letter-spacing:var(--tk-ls-tight); padding:4px 0; min-height:40px; }
  .tk-note-editor__title::placeholder { color:var(--tk-c-text-subtle); }
  .tk-note-editor__tags { display:flex; flex-wrap:wrap; gap:var(--tk-space-2); align-items:center; }
  .tk-note-editor__tag { display:inline-flex; align-items:center; gap:4px; height:28px; padding:0 10px; border-radius:var(--tk-radius-pill); border:0; background:var(--tk-c-accent-soft); color:var(--tk-c-text); font-size:var(--tk-fs-sm); font-weight:var(--tk-fw-medium); cursor:pointer; }
  .tk-note-editor__taginput { width:92px; height:28px; border:1px dashed var(--tk-c-border-strong); border-radius:var(--tk-radius-pill); background:transparent; color:var(--tk-c-text); padding:0 10px; font:inherit; font-size:var(--tk-fs-sm); outline:0; }
  .tk-note-editor__taginput:focus { border-color:var(--tk-c-accent); }
  .tk-note-editor__toolbar { display:flex; gap:2px; padding:4px; border-radius:var(--tk-radius-md); background:var(--tk-c-surface2); border:1px solid var(--tk-c-border); overflow-x:auto; scrollbar-width:none; max-width:100%; }
  .tk-note-editor__body { width:100%; min-height:240px; resize:none; overflow:hidden; font-size:var(--tk-fs-md); line-height:1.65; background:var(--tk-c-surface); }
  .tk-note-editor__preview { min-height:240px; padding:var(--tk-space-3); border-radius:var(--tk-radius-md); border:1px solid var(--tk-c-border); background:var(--tk-c-surface); }
  .tk-note-editor__foot { display:flex; justify-content:space-between; gap:12px; font-size:var(--tk-fs-xs); color:var(--tk-c-text-subtle); }
  .tk-note-editor--focus { max-width:720px; margin:0 auto; width:100%; gap:var(--tk-space-4); }
  .tk-note-editor--focus .tk-note-editor__title { font-size:var(--tk-fs-3xl); }
  .tk-note-editor--focus .tk-note-editor__body { font-size:var(--tk-fs-lg); line-height:1.75; border-color:transparent; background:transparent; padding-left:0; padding-right:0; }
  .tk-note-editor--focus .tk-note-editor__body:focus { box-shadow:none; }
  .bp-mobile .tk-note-editor__bar .tk-seg { order:5; flex:1 0 100%; } .bp-mobile .tk-note-editor__bar .tk-seg button { flex:1; justify-content:center; }
  .bp-mobile .tk-note-editor__body { font-size:16px; }
  .bp-mobile .tk-note-editor__tag, .bp-mobile .tk-note-editor__taginput { height:36px; }
  .bp-mobile .tk-note-editor__title { font-size:var(--tk-fs-xl); }`,
  example: { data: { notes: [{ id: 'n1', title: 'Ideen TAKT V2', body: '## Fokus\n- Modulweise Entwicklung\n- Workbench als Designarbeitsplatz\n\n## To-do\n- [x] Tokens abstimmen\n- [ ] Kalender-Varianten prüfen', tags: ['Projekt', 'Ideen'], pinned: true, updated: '2026-11-24T07:40:00' }] } },
  render: ({ props, data, setData, ctx }) => {
    const all = data.notes || [];
    const live = sortNotes(all.filter((n) => !n.archived));
    const note = all.find((n) => n.id === ctx.ui.selectedId) || live[0];
    if (!note) return html`<${Card}><${EmptyState} icon="notebook-pen" title="Keine Notiz ausgewählt" text="Lege eine neue Notiz an oder wähle eine aus der Liste."
      action=${html`<${Button} variant="primary" icon="plus" onClick=${() => { const id = `n${all.length + 1}x`; setData('notes', (a) => [{ id, title: '', body: '', tags: [], updated: isoLocal(ctx.today) }, ...a]); ctx.setUi('selectedId', id); ctx.emit('note.create', { id }); }}>Neue Notiz<//>`} /><//>`;
    const actions = noteActions({ setData, ctx, id: note.id });
    const switcher = props.noteSwitcher && html`<div class="tk-row" style="gap:8px"><span class="tk-subtle"><${Icon} name="sticky-note" size=${16} /></span>
      <${Select} aria-label="Notiz wechseln" value=${note.id} options=${live.map((n) => ({ value: n.id, label: n.title || 'Unbenannte Notiz' }))} onChange=${(v) => { ctx.setUi('selectedId', v); ctx.emit('note.open', { id: v }); }} /></div>`;
    const form = html`<${NoteForm} key=${note.id} note=${note} actions=${actions} props=${props} ctx=${ctx} switcher=${switcher} />`;
    return props.focusMode ? form : html`<${Card}>${form}<//>`;
  },
};
