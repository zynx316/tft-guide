// Kalender: Quellen & Konten – Sichtbarkeit, Sync-Status, Fehler („Neu anmelden“), Standardkalender, Quelle hinzufügen.
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Card, Button, Badge, Switch, Icon, Input, EmptyState, toneColor } from '../../ui.js';
import { timeStr, dayKey } from './_cal.js';
import { sourceOf, setSourceVisible } from './_cal-info.js';

const KINDS = { google: ['Google', 'mail'], microsoft: ['Microsoft 365', 'briefcase'], icloud: ['iCloud', 'cloud'], caldav: ['Nextcloud / CalDAV', 'globe'], ics: ['ICS-Abo per URL', 'link-2'], device: ['Gerätekalender', 'smartphone'], builtin: ['Zusatzkalender', 'flag'], contacts: ['Kontakte', 'gift'] };
const GROUPS = [['Konten', ['google', 'microsoft', 'icloud', 'caldav', 'device']], ['Abos', ['ics']], ['Zusatzkalender', ['builtin', 'contacts']]];
const ADDABLE = ['google', 'microsoft', 'icloud', 'caldav', 'ics', 'device'];

function AddBody({ onPick }) {
  const [name, setName] = useState('');
  return html`<div class="tk-col" style="gap:12px">
    <div class="tk-cal-src__kinds">${ADDABLE.map((k) => html`<button type="button" class="tk-cal-src__kind" onClick=${() => onPick(k, name.trim())}><${Icon} name=${KINDS[k][1]} size=${18} /><span>${KINDS[k][0]}</span></button>`)}</div>
    <label class="tk-field"><span class="tk-field__label">Name (optional)</span><${Input} value=${name} onInput=${setName} placeholder="z. B. Verein" /></label>
    <p class="tk-subtle" style="font-size:var(--tk-fs-sm)">Demo: Die Anmeldung wird simuliert, es werden keine echten Konten verbunden.</p></div>`;
}

export const calendarSources = {
  id: 'calendar-sources',
  name: 'Kalenderquellen',
  category: 'Kalender',
  description: 'Alle Kalender nach Konten, Abos und Zusatzkalendern mit Farbe, Terminzahl, Sync-Status und Schalter für die Sichtbarkeit. Ausblenden wirkt sofort in allen Kalenderansichten. Fehler zeigen „Neu anmelden“, fehlende Berechtigung „Zugriff erlauben“.',
  version: '1.0',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Kalender & Konten' },
    { name: 'showCounts', label: 'Terminzahl', type: 'boolean', default: true },
    { name: 'groups', label: 'Gruppen zeigen', type: 'boolean', default: true },
  ],
  data: [
    { slot: 'sources', label: 'Quellen', default: 'sources', shape: '{id,name,kind,account,tone,visible,status,lastSync?,error?,isDefault?}[]', required: true },
    { slot: 'events', label: 'Termine', default: 'events', shape: '{id,category?,source?,hidden?}[]', required: false },
  ],
  events: ['source.toggle', 'source.add', 'source.reauth', 'source.sync', 'source.default'],
  states: ['empty'],
  css: `
  .tk-cal-src__row { display:flex; gap:12px; align-items:flex-start; padding:12px 16px; border-bottom:1px solid var(--tk-c-border); min-width:0; }
  .tk-cal-src__row:last-child { border-bottom:0; }
  .tk-cal-src__sw { width:14px; height:14px; border-radius:5px; background:var(--sc); flex:none; margin-top:4px; }
  .tk-cal-src__status { display:flex; align-items:center; gap:6px; flex-wrap:wrap; font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); margin-top:4px; }
  .tk-cal-src__status[data-s="error"] { color:var(--tk-c-danger); } .tk-cal-src__status[data-s="permission"] { color:var(--tk-c-warning); }
  .tk-cal-src__row[data-off="true"] .tk-cal-src__name { color:var(--tk-c-text-subtle); }
  .tk-cal-src__group { padding:10px 16px 6px; background:var(--tk-c-surface2); border-bottom:1px solid var(--tk-c-border); }
  .tk-cal-src__switch { flex:none; margin-top:2px; }
  .tk-cal-src__kinds { display:grid; grid-template-columns:repeat(2, minmax(0,1fr)); gap:8px; }
  .tk-cal-src__kind { display:flex; align-items:center; gap:10px; min-height:52px; padding:0 14px; border:1px solid var(--tk-c-border); border-radius:var(--tk-radius-md); background:var(--tk-c-surface); color:var(--tk-c-text); font:inherit; cursor:pointer; text-align:left; }
  .tk-cal-src__kind:hover { border-color:var(--tk-c-accent); }
  .bp-mobile .tk-cal-src__switch .tk-switch { width:54px; height:32px; border-radius:16px; } .bp-mobile .tk-cal-src__switch .tk-switch::after { width:24px; height:24px; top:3px; left:3px; }
  .bp-mobile .tk-cal-src__switch .tk-switch[aria-checked="true"]::after { transform:translateX(22px); }`,
  example: { data: { sources: [
    { id: 'personal', name: 'Jonas · Persönlich', kind: 'google', account: 'Google-Konto', tone: 'accent', visible: true, isDefault: true, status: 'ok', lastSync: '2026-11-24T09:12:00' },
    { id: 'etsy', name: 'Etsy-Versandfristen', kind: 'ics', account: 'ICS-Abo per URL', tone: 'success', visible: true, status: 'error', error: 'Anmeldung abgelaufen.', lastSync: '2026-11-22T06:00:00' },
  ], events: [{ id: 'a', category: 'Fitness' }] } },
  render: function CalendarSources({ props, data, setData, ctx }) {
    const sources = Array.isArray(data.sources) ? data.sources : [], events = Array.isArray(data.events) ? data.events : [];
    const count = (id) => events.filter((e) => sourceOf(e) === id).length;
    const upd = (id, patch) => setData('sources', (all) => all.map((s) => (s.id === id ? { ...s, ...patch } : s)));
    const nowIso = `${dayKey(ctx.today)}T${timeStr(ctx.today)}:00`;
    const toggle = (s) => { setSourceVisible(setData, s.id, !s.visible); ctx.emit('source.toggle', { id: s.id, visible: !s.visible }); ctx.toast(`${s.name} ${s.visible ? 'ausgeblendet' : 'eingeblendet'}`); };
    const reauth = (s) => { upd(s.id, { status: 'ok', error: undefined, lastSync: nowIso, visible: true, ...(s.status === 'permission' ? {} : {}) }); if (!s.visible) setSourceVisible(setData, s.id, true); ctx.emit('source.reauth', { id: s.id }); ctx.toast(s.status === 'permission' ? 'Zugriff erlaubt' : `${s.name}: erneut angemeldet`); };
    const sync = () => { setData('sources', (all) => all.map((s) => (s.status === 'ok' && s.kind !== 'builtin' && s.kind !== 'contacts' ? { ...s, lastSync: nowIso } : s))); ctx.emit('source.sync'); ctx.toast('Alle Quellen synchronisiert'); };
    const setDefault = (s) => { setData('sources', (all) => all.map((x) => ({ ...x, isDefault: x.id === s.id }))); ctx.emit('source.default', { id: s.id }); ctx.toast(`${s.name} ist jetzt Standardkalender`); };
    const addDialog = () => ctx.openDialog({ title: 'Kalender hinzufügen', body: (close) => html`<${AddBody} onPick=${(k, name) => { const id = `src${Date.now().toString(36)}`; const nm = name || KINDS[k][0]; setData('sources', (all) => [...all, { id, name: nm, kind: k, account: KINDS[k][0], tone: 'info', visible: true, status: 'ok', lastSync: nowIso }]); ctx.emit('source.add', { id, kind: k }); ctx.toast(`${nm} hinzugefügt`); close(); }} />` });
    if (!sources.length) return html`<${Card} title=${props.title}><${EmptyState} icon="calendar-plus" title="Noch kein Kalender verbunden" text="Verbinde ein Konto oder abonniere einen Kalender." action=${html`<${Button} variant="primary" icon="plus" onClick=${addDialog}>Kalender hinzufügen<//>`} /><//>`;
    const row = (s) => { const k = KINDS[s.kind] || KINDS.ics; return html`<div class="tk-cal-src__row" data-off=${!s.visible} style=${`--sc:${toneColor(s.tone)}`}>
      <span class="tk-cal-src__sw" aria-hidden="true"></span>
      <div class="tk-grow"><div class="tk-row" style="flex-wrap:wrap"><b class="tk-cal-src__name tk-truncate">${s.name}</b>${s.isDefault && html`<${Badge} tone="accent">Standard<//>`}</div>
        <div class="tk-subtle" style="font-size:var(--tk-fs-sm)">${s.account}${props.showCounts && s.status === 'ok' ? ` · ${count(s.id)} Termine` : ''}</div>
        <div class="tk-cal-src__status" data-s=${s.status}>${s.status === 'ok' ? html`<${Icon} name="check-circle-2" size=${14} />Synchronisiert${s.lastSync ? ` ${timeStr(s.lastSync)} Uhr` : ''}` : s.status === 'error' ? html`<${Icon} name="alert-triangle" size=${14} /><span>${s.error}</span><${Button} size="sm" onClick=${() => reauth(s)}>Neu anmelden<//>` : html`<${Icon} name="lock" size=${14} /><span>Zugriff auf ${k[0]} fehlt</span><${Button} size="sm" onClick=${() => reauth(s)}>Zugriff erlauben<//>`}
          ${s.status === 'ok' && !s.isDefault && !s.readonly && ['google', 'microsoft', 'icloud'].includes(s.kind) && html`<${Button} size="sm" variant="ghost" onClick=${() => setDefault(s)}>Als Standard<//>`}</div></div>
      <span class="tk-cal-src__switch"><${Switch} checked=${s.visible} onChange=${() => toggle(s)} label=${`${s.name} anzeigen`} /></span></div>`; };
    return html`<${Card} flush=${true} title=${props.title} icon="layers" actions=${html`<span class="tk-row"><${Button} size="sm" icon="refresh-cw" aria-label="Alle Quellen synchronisieren" onClick=${sync}>${ctx.bp === 'mobile' ? null : 'Sync'}<//><${Button} size="sm" variant="primary" icon="plus" aria-label="Kalender hinzufügen" onClick=${addDialog}>${ctx.bp === 'mobile' ? null : 'Hinzufügen'}<//></span>`}><div data-qa="calendar-sources">
      ${props.groups ? GROUPS.map(([g, kinds]) => { const list = sources.filter((s) => kinds.includes(s.kind)); return list.length ? html`<div><div class="tk-cal-src__group tk-label">${g}</div>${list.map(row)}</div>` : null; }) : sources.map(row)}</div><//>`;
  },
};
export default calendarSources;
