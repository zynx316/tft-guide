// Datenexport: Umfang, Format, Ziel (auch verschlüsselt) – mit Fortschritt und Ergebnis. Simuliert, erzeugt keine Datei.
import { html } from '../../../lib/html.js';
import { useState, useEffect } from 'preact/hooks';
import { Icon, Button, Chip, Segmented, Input, Progress, Card } from '../../ui.js';
import { fmtNumber } from '../../../lib/format.js';
import { isoDay } from '../../../lib/util.js';
import { MODULES, MODULE_SIZES } from './_system.js';
import { XC_CSS } from './_xc-css.js';

const FORMATS = [
  { id: 'json', label: 'JSON', hint: 'Vollständig, zum Wiederherstellen', icon: 'file-json', factor: 1 },
  { id: 'csv', label: 'CSV', hint: 'Tabellen je Modul, für Excel', icon: 'file-spreadsheet', factor: 0.7 },
  { id: 'ics', label: 'ICS', hint: 'Nur Termine, für andere Kalender', icon: 'calendar', factor: 0.1, only: ['calendar'] },
  { id: 'md', label: 'Markdown', hint: 'Notizen und Wissen als Text', icon: 'file-text', factor: 0.3, only: ['notes', 'knowledge'] },
];
const CSS = `
  .tk-xc-exp { display: flex; flex-direction: column; gap: var(--tk-space-4); padding: var(--tk-space-4); min-width: 0; }
  .tk-xc-exp h4 { margin: 0 0 var(--tk-space-2); font-size: var(--tk-fs-sm); color: var(--tk-c-text-muted); font-weight: var(--tk-fw-semibold); }
  .tk-xc-exp__fmt { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: var(--tk-space-2); }
  .tk-xc-exp__opt { display: flex; align-items: center; gap: var(--tk-space-2); min-height: 56px; padding: var(--tk-space-2) var(--tk-space-3); border-radius: var(--tk-radius-lg); border: 1.5px solid var(--tk-c-border); background: var(--tk-c-surface); color: var(--tk-c-text); font: inherit; text-align: left; cursor: pointer; min-width: 0; }
  .tk-xc-exp__opt[aria-pressed="true"] { border-color: var(--tk-c-accent); background: var(--tk-c-accent-soft); }
  .tk-xc-exp__sum { display: flex; align-items: center; gap: var(--tk-space-3); flex-wrap: wrap; justify-content: space-between; padding-top: var(--tk-space-3); border-top: 1px solid var(--tk-c-border); }
  .tk-xc-exp__done { display: flex; flex-direction: column; align-items: center; gap: var(--tk-space-3); text-align: center; padding: var(--tk-space-4) 0; }
  .tk-xc-exp__done > span { width: 56px; height: 56px; border-radius: 50%; display: grid; place-items: center; background: var(--tk-c-success-soft); color: var(--tk-c-success); }`;

export const exportWizard = {
  id: 'export-wizard',
  name: 'Export-Assistent',
  category: 'Querschnitt',
  description: 'Daten als Datei mitnehmen: Umfang (alles oder einzelne Module), Format (JSON, CSV, ICS, Markdown) und Ziel (speichern, teilen, verschlüsselt) mit geschätzter Größe, Fortschritt und Ergebnis. Der Export ist simuliert.',
  version: '1.0',
  props: [{ name: 'title', label: 'Titel', type: 'text', default: 'Daten exportieren' }],
  data: [],
  events: ['export.scope', 'export.format', 'export.target', 'export.start', 'export.done', 'export.share', 'export.again'],
  states: [],
  flutter: { widget: 'TaktExportWizard', propMap: { title: 'title' }, events: { 'export.start': 'onExport', 'export.share': 'onShare' } },
  a11y: { role: 'group', nameFrom: 'Titel' },
  css: XC_CSS + CSS,
  example: { props: {} },
  render: function ExportWizard({ props, ctx }) {
    const [scope, setScope] = useState('alles');
    const [mods, setMods] = useState(['calendar', 'tasks']);
    const [fmt, setFmt] = useState('json');
    const [target, setTarget] = useState('datei');
    const [pw, setPw] = useState('');
    const [run, setRun] = useState(null);        // null | 0..100 | 'done'
    useEffect(() => { if (typeof run !== 'number') return undefined; const t = setTimeout(() => { if (run >= 100) { setRun('done'); ctx.emit('export.done'); } else setRun(Math.min(100, run + 20)); }, 380); return () => clearTimeout(t); }, [run]);
    const f = FORMATS.find((x) => x.id === fmt);
    const pool = MODULES.filter((m) => MODULE_SIZES[m.id] != null && (!f.only || f.only.includes(m.id)));
    const ids = scope === 'alles' ? pool.map((m) => m.id) : pool.map((m) => m.id).filter((id) => mods.includes(id));
    const size = ids.reduce((s, id) => s + MODULE_SIZES[id], 0) * f.factor;
    const needPw = target === 'verschluesselt' && pw.length < 8;
    const name = `takt-export-${isoDay(ctx.today)}.${target === 'verschluesselt' ? 'takt' : fmt === 'json' ? 'json' : 'zip'}`;
    if (run === 'done') return html`<${Card} title=${props.title} icon="download"><div class="tk-xc-exp__done" data-qa="export-done"><span><${Icon} name="check" size=${28} /></span><strong>Export fertig</strong><p class="tk-xc-s" style="margin:0">${name} · ${fmtNumber(size, { unit: 'MB', digits: 1 })}</p>
      <div class="tk-row" style="gap:var(--tk-space-2);flex-wrap:wrap;justify-content:center"><${Button} variant="primary" icon="share-2" onClick=${() => { ctx.emit('export.share'); ctx.toast('Teilen-Blatt geöffnet (Demo)'); }}>Teilen<//><${Button} onClick=${() => { setRun(null); ctx.emit('export.again'); }}>Neuer Export<//></div></div><//>`;
    return html`<${Card} title=${props.title} icon="download"><div class="tk-xc-exp" style="padding:0" data-qa="export-wizard">
      <div><h4>Umfang</h4><${Segmented} label="Umfang" value=${scope} onChange=${(v) => { setScope(v); ctx.emit('export.scope', { scope: v }); }} options=${[{ value: 'alles', label: 'Alles' }, { value: 'module', label: 'Module wählen' }]} />
        ${scope === 'module' && html`<div class="tk-xc-wrap" style="margin-top:var(--tk-space-2)">${pool.map((m) => html`<${Chip} key=${m.id} icon=${m.icon} active=${mods.includes(m.id)} onClick=${() => setMods(mods.includes(m.id) ? mods.filter((x) => x !== m.id) : [...mods, m.id])}>${m.name}<//>`)}</div>`}</div>
      <div><h4>Format</h4><div class="tk-xc-exp__fmt" role="group" aria-label="Format">${FORMATS.map((x) => html`<button type="button" class="tk-xc-exp__opt" key=${x.id} aria-pressed=${fmt === x.id ? 'true' : 'false'} onClick=${() => { setFmt(x.id); ctx.emit('export.format', { format: x.id }); }}><${Icon} name=${x.icon} size=${20} /><span class="tk-xc-main"><span class="tk-xc-t">${x.label}</span><span class="tk-xc-s" style="white-space:normal">${x.hint}</span></span></button>`)}</div></div>
      <div><h4>Ziel</h4><${Segmented} label="Ziel" value=${target} onChange=${(v) => { setTarget(v); ctx.emit('export.target', { target: v }); }} options=${[{ value: 'datei', label: 'Datei' }, { value: 'teilen', label: 'Teilen' }, { value: 'verschluesselt', label: 'Verschlüsselt', icon: 'lock' }]} />
        ${target === 'verschluesselt' && html`<div style="margin-top:var(--tk-space-2)"><${Input} type="password" value=${pw} onInput=${setPw} placeholder="Passwort, mindestens 8 Zeichen" aria-label="Passwort für den Export" autocomplete="new-password" /></div>`}</div>
      ${typeof run === 'number' ? html`<div class="tk-xc-stack" role="status" aria-live="polite"><span class="tk-xc-s">Export wird erstellt … ${run} %</span><${Progress} value=${run / 100} /></div>`
        : html`<div class="tk-xc-exp__sum"><span class="tk-xc-s">${ids.length} ${ids.length === 1 ? 'Modul' : 'Module'} · ca. ${fmtNumber(size, { unit: 'MB', digits: 1 })}</span>
          <${Button} variant="primary" icon="download" disabled=${ids.length === 0 || needPw} onClick=${() => { ctx.emit('export.start', { format: fmt, target, modules: ids.length }); setRun(0); }}>Export erstellen<//></div>
          ${needPw && html`<span class="tk-xc-s" style="white-space:normal">Für den verschlüsselten Export brauchst du ein Passwort mit mindestens 8 Zeichen.</span>`}`}
    </div><//>`;
  },
};
export default exportWizard;
