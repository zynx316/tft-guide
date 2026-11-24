// Papierkorb: gelöschte Einträge aller Module, 30 Tage wiederherstellbar, endgültig löschen mit Bestätigung.
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Icon, Button, Card, Chip, Badge, EmptyState } from '../../ui.js';
import { toDate } from '../../../lib/date.js';
import { moduleMeta, plural, agoLabel, priv } from './_system.js';
import { pushUndo } from './_crosscut.js';
import { XC_CSS } from './_xc-css.js';

const CSS = `
  .tk-xc-tr { display: flex; flex-direction: column; gap: var(--tk-space-3); min-width: 0; }
  .tk-xc-tr__head { display: flex; align-items: center; gap: var(--tk-space-2); flex-wrap: wrap; }
  .tk-xc-tr__item { display: flex; align-items: center; gap: var(--tk-space-3); padding: var(--tk-space-2) var(--tk-space-3); min-height: 60px; border-bottom: 1px solid var(--tk-c-border); min-width: 0; }
  .tk-xc-tr__item:last-child { border-bottom: 0; }
  .tk-xc-tr__left { display: flex; align-items: center; gap: 4px; color: var(--tk-c-warning); }
  .tk-xc-tr__acts { display: flex; align-items: center; gap: 2px; flex: none; }
  .tk-xc-tr__info { display: flex; align-items: flex-start; gap: var(--tk-space-3); padding: var(--tk-space-3) var(--tk-space-4); border-radius: var(--tk-radius-lg); background: var(--tk-c-info-soft); font-size: var(--tk-fs-sm); color: var(--tk-c-text); }
  .tk-xc-tr__info svg { flex: none; color: var(--tk-c-info); margin-top: 2px; }
  .bp-mobile .tk-xc-tr__item { flex-wrap: wrap; }
  .bp-mobile .tk-xc-tr__acts { width: 100%; justify-content: flex-end; }`;

export const trashList = {
  id: 'trash-list',
  name: 'Papierkorb',
  category: 'Querschnitt',
  description: 'Alles Gelöschte an einem Ort: wiederherstellen, einzeln endgültig löschen oder den Papierkorb leeren. Zeigt die Restzeit (30 Tage) und warnt, wenn etwas bald verschwindet. Aufgaben und Termine kehren in die Datenwelt zurück.',
  version: '1.0',
  props: [
    { name: 'retention', label: 'Aufbewahrung (Tage)', type: 'number', default: 30 },
    { name: 'groupBy', label: 'Gruppieren nach', type: 'select', options: ['age', 'module'], default: 'age' },
    { name: 'showInfo', label: 'Hinweis zur Aufbewahrung', type: 'boolean', default: true },
  ],
  data: [
    { slot: 'trash', label: 'Gelöschte Einträge', default: 'trash', shape: '{id,title,module,kind,deletedAt,detail?,payload?}[]', required: true },
    { slot: 'tasks', label: 'Aufgaben (Ziel)', default: 'tasks', shape: 'Welt: tasks', required: false },
    { slot: 'events', label: 'Termine (Ziel)', default: 'events', shape: 'Welt: events', required: false },
  ],
  events: ['trash.restore', 'trash.delete', 'trash.empty', 'trash.filter', 'trash.undo'],
  states: ['empty'],
  flutter: { widget: 'TaktTrashList', propMap: { retention: 'retentionDays', groupBy: 'groupBy' }, events: { 'trash.restore': 'onRestore', 'trash.delete': 'onDeleteForever', 'trash.empty': 'onEmpty' } },
  a11y: { role: 'list', nameFrom: 'Papierkorb' },
  css: XC_CSS + CSS,
  example: { props: {}, data: { trash: [{ id: 'x1', title: 'Newsletter-Entwurf Winter', module: 'notes', kind: 'note', deletedAt: '2026-11-22T10:00:00' }, { id: 'x2', title: 'Zahnreinigung (alt)', module: 'calendar', kind: 'event', deletedAt: '2026-11-02T10:00:00' }], tasks: [], events: [] } },
  render: function TrashList({ props, data, setData, ctx }) {
    const [filter, setFilter] = useState('alle');
    const all = (Array.isArray(data.trash) ? data.trash : []).map((t) => ({ ...t, meta: moduleMeta(t.module), left: Math.max(0, (Number(props.retention) || 30) - Math.floor((+ctx.today - +toDate(t.deletedAt)) / 86400000)) }));
    const modules = [...new Set(all.map((t) => t.module))];
    const shown = all.filter((t) => filter === 'alle' || t.module === filter).sort((a, b) => a.left - b.left);
    const put = (t) => setData('trash', (l) => [t, ...(Array.isArray(l) ? l : []).filter((x) => x.id !== t.id)]);
    const drop = (id) => setData('trash', (l) => (Array.isArray(l) ? l : []).filter((x) => x.id !== id));
    const restore = (t) => {
      const slot = t.kind === 'task' ? 'tasks' : t.kind === 'event' ? 'events' : null;
      if (slot && t.payload) setData(slot, (l) => [t.payload, ...(Array.isArray(l) ? l : []).filter((x) => x.id !== t.payload.id)]);
      drop(t.id); ctx.emit('trash.restore', { id: t.id, module: t.module });
      const { meta, left, ...raw } = t;
      pushUndo(ctx, { text: `„${t.title}“ wiederhergestellt`, restore: () => { if (slot && t.payload) setData(slot, (l) => (Array.isArray(l) ? l : []).filter((x) => x.id !== t.payload.id)); put(raw); ctx.emit('trash.undo', { id: t.id }); } });
    };
    const confirm = (title, text, label, run) => ctx.openDialog({ title, body: () => html`<p style="margin:0">${text}</p>`, footer: (close) => html`<${Button} onClick=${close}>Abbrechen<//><${Button} variant="danger" icon="trash-2" onClick=${() => { run(); close(); }}>${label}<//>` });
    const forever = (t) => confirm('Endgültig löschen?', `„${t.title}“ wird endgültig gelöscht. Das lässt sich nicht rückgängig machen.`, 'Endgültig löschen', () => { drop(t.id); ctx.emit('trash.delete', { id: t.id }); ctx.toast('Endgültig gelöscht'); });
    const empty = () => confirm('Papierkorb leeren?', `${plural(all.length, 'Eintrag wird', 'Einträge werden')} endgültig gelöscht. Das lässt sich nicht rückgängig machen.`, 'Papierkorb leeren', () => { setData('trash', []); ctx.emit('trash.empty', { count: all.length }); ctx.toast('Papierkorb geleert'); });

    if (!all.length) return html`<${EmptyState} icon="trash-2" title="Papierkorb ist leer" text="Gelöschte Einträge bleiben hier 30 Tage wiederherstellbar." />`;
    const groups = props.groupBy === 'module'
      ? modules.map((m) => ({ label: moduleMeta(m).name, items: shown.filter((t) => t.module === m) })).filter((g) => g.items.length)
      : [{ label: 'Läuft bald ab', items: shown.filter((t) => t.left <= 7) }, { label: 'Zuletzt gelöscht', items: shown.filter((t) => t.left > 7) }].filter((g) => g.items.length);
    const row = (t) => html`<div class="tk-xc-tr__item" key=${t.id} data-trash=${t.id}>
      <span class="tk-xc-ic tk-xc-ic--neutral"><${Icon} name=${t.meta.icon} size=${18} /></span>
      <span class="tk-xc-main"><span class="tk-xc-t">${t.title}</span><span class="tk-xc-s">${t.meta.name} · gelöscht ${agoLabel(ctx, t.deletedAt).toLowerCase()}${t.detail ? ` · ${priv(ctx, t.detail)}` : ''}</span></span>
      ${t.left <= 7 ? html`<span class="tk-xc-tr__left"><${Badge} tone="warning" icon="hourglass">noch ${plural(t.left, 'Tag', 'Tage')}<//></span>` : html`<span class="tk-xc-end">noch ${t.left} Tage</span>`}
      <span class="tk-xc-tr__acts"><${Button} size="sm" icon="archive-restore" onClick=${() => restore(t)} aria-label=${`${t.title} wiederherstellen`}>Wiederherstellen<//>
        <button type="button" class="tk-xc-iconbtn" aria-label=${`${t.title} endgültig löschen`} onClick=${() => forever(t)}><${Icon} name="trash-2" size=${17} /></button></span></div>`;
    return html`<div class="tk-xc-tr" data-qa="trash-list">
      <div class="tk-xc-tr__head"><span class="tk-xc-t tk-grow">${plural(all.length, 'Eintrag', 'Einträge')}</span><${Button} size="sm" variant="ghost" icon="trash-2" onClick=${empty}>Papierkorb leeren<//></div>
      ${modules.length > 1 && html`<div class="tk-xc-chips" data-scroll-x role="group" aria-label="Modul filtern"><${Chip} active=${filter === 'alle'} onClick=${() => setFilter('alle')}>Alle<//>${modules.map((m) => html`<${Chip} key=${m} active=${filter === m} onClick=${() => { setFilter(m); ctx.emit('trash.filter', { module: m }); }}>${moduleMeta(m).name}<//>`)}</div>`}
      ${props.showInfo && html`<div class="tk-xc-tr__info"><${Icon} name="info" size=${16} /><span>Gelöschtes bleibt ${props.retention} Tage im Papierkorb und wird danach endgültig entfernt.</span></div>`}
      ${groups.map((g) => html`<div key=${g.label}><div class="tk-xc-sec">${g.label}<span class="tk-xc-sec__n">${g.items.length}</span></div><${Card} flush>${g.items.map(row)}<//></div>`)}
    </div>`;
  },
};
export default trashList;
