// Dokumente: Einstellungen – Modulsperre (empfohlen), Speicherort lokal, Erinnerungen und Aufbewahrungsfristen je Ordner (Richtwerte).
import { html } from '../../../lib/html.js';
import { Card, Badge, Icon, Select, Switch } from '../../ui.js';
import { getPrefs } from '../crosscut/_system.js';
import { REMINDER_DAYS } from './_deadlines.js';
import { arr, IconTile } from './_docs.js';
import { pick } from './_example.js';

export const RETENTION = ['Bis zum Ablauf', '3 Jahre nach Vertragsende', 'Ablauf plus 1 Jahr', '8 bis 10 Jahre (Richtwert)', 'Unbegrenzt'];

export const dokSettings = {
  id: 'dok-settings',
  name: 'Einstellungen Dokumente',
  category: 'Dokumente',
  description: 'Modulsperre (empfohlen, weil Ausweise und Verträge liegen), Speicherort „nur auf diesem Gerät“, Erinnerungsstufen 30/14/3 Tage und Aufbewahrungsfristen je Ordner als Richtwerte. Die Sperre wirkt in der Demo über die gemeinsamen Einstellungen.',
  version: '1.1',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Einstellungen' },
    { name: 'showRetention', label: 'Aufbewahrung je Ordner', type: 'boolean', default: true },
  ],
  data: [
    { slot: 'prefs', label: 'Einstellungen der App', default: 'prefs', shape: '{privacy:{sensitive:string[]}}', required: false },
    { slot: 'folders', label: 'Ordner', default: 'folders', shape: '{id,name,icon,tone,retention}[]', required: false },
  ],
  events: ['settings.lock', 'settings.retention'],
  states: ['empty'],
  flutter: { widget: 'TaktDocumentSettings', propMap: { title: 'title', showRetention: 'showRetention' }, events: { 'settings.lock': 'onToggleModuleLock', 'settings.retention': 'onChangeRetention' } },
  css: `
  .tk-dok-set { display:flex; flex-direction:column; gap:var(--tk-space-4); min-width:0; } .tk-dok-setrow { display:flex; align-items:center; gap:12px; min-height:56px; padding:10px var(--tk-space-4); border-bottom:1px solid var(--tk-c-border); flex-wrap:wrap; }
  .tk-dok-setrow:last-child { border-bottom:0; } .tk-dok-setrow .tk-dok-main { flex:1 1 200px; } .tk-dok-setrow .tk-select { flex:1 1 220px; max-width:320px; }`,
  example: { props: {}, data: pick('folders') },
  render: function DokSettings({ props, data, setData, ctx }) {
    const prefs = getPrefs(data.prefs && !Array.isArray(data.prefs) ? data.prefs : {}, ctx), sens = arr(prefs.privacy?.sensitive), locked = sens.includes('documents'), folders = arr(data.folders);
    const toggle = (on) => { ctx.setPrefs && ctx.setPrefs({ privacy: { sensitive: on ? [...sens, 'documents'] : sens.filter((m) => m !== 'documents') } }); ctx.emit('settings.lock', { on }); ctx.toast(on ? 'Modulsperre ist an' : 'Modulsperre ist aus'); };
    const retain = (f, value) => { setData('folders', (l) => arr(l).map((x) => (x.id === f.id ? { ...x, retention: value } : x))); ctx.emit('settings.retention', { id: f.id, value }); ctx.toast(`Aufbewahrung für „${f.name}“ geändert`); };
    return html`<div class="tk-dok-set"><${Card} flush title=${props.title} icon="settings">
      <div class="tk-dok-setrow"><${IconTile} icon="lock" tone=${locked ? 'success' : 'warning'} /><div class="tk-dok-main"><b>Modulsperre</b><span class="tk-dok-sub">Dokumente öffnen erst nach Entsperren. ${locked ? '' : 'Empfohlen, weil hier Ausweise und Verträge liegen. '}In der Demo fragt die Sperre noch nicht nach dem Entsperren.</span></div>${!locked && html`<${Badge} tone="warning">empfohlen<//>`}<${Switch} checked=${locked} onChange=${toggle} label="Modulsperre für Dokumente" /></div>
      <div class="tk-dok-setrow"><${IconTile} icon="home" tone="info" /><div class="tk-dok-main"><b>Speicherort</b><span class="tk-dok-sub">Nur auf diesem Gerät. Dokumente und Texterkennung bleiben lokal, offline voll nutzbar.</span></div><${Badge} tone="success" icon="check">lokal<//></div>
      <div class="tk-dok-setrow"><${IconTile} icon="bell" tone="accent" /><div class="tk-dok-main"><b>Erinnerungen</b><span class="tk-dok-sub">Kündigungsfristen, Garantien und Ablaufdaten melden sich vorher.</span></div><span class="tk-dok-wrap">${REMINDER_DAYS.map((d) => html`<${Badge}>${d} Tage<//>`)}</span></div><//>
      ${props.showRetention && html`<${Card} flush title="Aufbewahrung je Ordner" icon="archive" actions=${html`<${Badge}>Richtwerte<//>`}>${folders.map((f) => html`<div class="tk-dok-setrow"><${IconTile} icon=${f.icon} tone=${f.tone} /><div class="tk-dok-main"><b>${f.name}</b></div>
        <${Select} value=${RETENTION.includes(f.retention) ? f.retention : RETENTION[0]} onChange=${(v) => retain(f, v)} options=${RETENTION} aria-label=${`Aufbewahrung für ${f.name}`} /></div>`)}<//>`}</div>`;
  },
};
export default dokSettings;
