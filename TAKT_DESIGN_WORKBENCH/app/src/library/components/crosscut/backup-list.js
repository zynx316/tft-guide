// Sicherung & Speicher: Speichernutzung je Modul, automatische Sicherungen mit Wiederherstellen, „Alle Daten löschen“ mit doppelter Bestätigung.
import { html } from '../../../lib/html.js';
import { useState, useEffect } from 'preact/hooks';
import { Icon, Button, Card, Switch, Input, Progress, EmptyState } from '../../ui.js';
import { fmtNumber, fmtTime } from '../../../lib/format.js';
import { MODULES, MODULE_SIZES, agoLabel } from './_system.js';
import { XC_CSS } from './_xc-css.js';

const CSS = `
  .tk-xc-bk { display: flex; flex-direction: column; gap: var(--tk-space-4); min-width: 0; }
  .tk-xc-bk__bar { display: flex; height: 14px; border-radius: 7px; overflow: hidden; background: var(--tk-c-surface3); gap: 2px; }
  .tk-xc-bk__bar i { display: block; min-width: 4px; }
  .tk-xc-bk__leg { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: var(--tk-space-1) var(--tk-space-3); margin: 0; padding: 0; list-style: none; font-size: var(--tk-fs-sm); }
  .tk-xc-bk__leg li { display: flex; align-items: center; gap: 6px; min-width: 0; }
  .tk-xc-bk__leg li span:last-child { margin-left: auto; font-variant-numeric: tabular-nums; color: var(--tk-c-text-muted); }
  .tk-xc-bk__sw { width: 10px; height: 10px; border-radius: 3px; flex: none; }
  .tk-xc-bk__item { display: flex; align-items: center; gap: var(--tk-space-3); padding: var(--tk-space-2) var(--tk-space-3); min-height: 56px; border-bottom: 1px solid var(--tk-c-border); min-width: 0; }
  .tk-xc-bk__item:last-child { border-bottom: 0; }
  .tk-xc-bk__danger { display: flex; align-items: center; gap: var(--tk-space-3); flex-wrap: wrap; padding: var(--tk-space-4); border-radius: var(--tk-radius-lg); border: 1px solid var(--tk-c-danger); background: var(--tk-c-surface); }`;

export const backupList = {
  id: 'backup-list',
  name: 'Sicherung & Speicher',
  category: 'Querschnitt',
  description: 'Speichernutzung je Modul als Balken mit Zahlen, die letzten automatischen Sicherungen mit „Wiederherstellen“, „Jetzt sichern“ mit Fortschritt und „Alle Daten löschen“ mit doppelter Bestätigung (Eingabe von LÖSCHEN).',
  version: '1.0',
  props: [
    { name: 'showStorage', label: 'Speicheranzeige', type: 'boolean', default: true },
    { name: 'showDanger', label: '„Alle Daten löschen“', type: 'boolean', default: true },
    { name: 'limit', label: 'Sicherungen (Anzahl)', type: 'number', default: 5 },
  ],
  data: [{ slot: 'backups', label: 'Sicherungen', default: 'backups', shape: '{id,at,size,kind}[]', required: true }],
  events: ['backup.now', 'backup.done', 'backup.restore', 'backup.auto', 'data.wipe'],
  states: ['empty'],
  flutter: { widget: 'TaktBackupList', propMap: { showStorage: 'showStorage', limit: 'maxBackups' }, events: { 'backup.now': 'onBackupNow', 'backup.restore': 'onRestore', 'data.wipe': 'onWipe' } },
  a11y: { role: 'list', nameFrom: 'Sicherungen' },
  css: XC_CSS + CSS,
  example: { props: {}, data: { backups: [{ id: 'b1', at: '2026-11-24T03:00:00', size: 6.9, kind: 'auto' }, { id: 'b2', at: '2026-11-23T03:00:00', size: 6.8, kind: 'auto' }] } },
  render: function BackupList({ props, data, setData, ctx }) {
    const [auto, setAuto] = useState(true);
    const [run, setRun] = useState(null);
    const list = (Array.isArray(data.backups) ? data.backups : []).slice(0, Number(props.limit) || 5);
    useEffect(() => { if (run == null) return undefined; const t = setTimeout(() => {
      if (run >= 100) { setData('backups', (l) => [{ id: `b-neu-${(Array.isArray(l) ? l.length : 0) + 1}`, at: `2026-11-24T${fmtTime(ctx.today)}:00`, size: total, kind: 'manual' }, ...(Array.isArray(l) ? l : [])]); setRun(null); ctx.emit('backup.done'); ctx.toast('Sicherung erstellt'); } else setRun(run + 25); }, 350); return () => clearTimeout(t); }, [run]);
    const rows = MODULES.filter((m) => MODULE_SIZES[m.id] != null).map((m) => ({ ...m, mb: MODULE_SIZES[m.id] })).sort((a, b) => b.mb - a.mb);
    const total = rows.reduce((s, r) => s + r.mb, 0);
    const top = rows.slice(0, 5), rest = rows.slice(5).reduce((s, r) => s + r.mb, 0);
    const parts = [...top.map((r, i) => ({ label: r.name, mb: r.mb, c: i + 1 })), { label: 'Andere', mb: rest, c: 6 }];
    const restore = (b) => ctx.openDialog({ title: 'Sicherung wiederherstellen?', body: () => html`<p style="margin:0">Der Stand von ${agoLabel(ctx, b.at).toLowerCase()} ersetzt die aktuellen Daten. Vorher legt TAKT eine Sicherung des jetzigen Stands an.</p>`, footer: (close) => html`<${Button} onClick=${close}>Abbrechen<//><${Button} variant="primary" icon="archive-restore" onClick=${() => { close(); ctx.emit('backup.restore', { id: b.id }); ctx.toast('Wiederhergestellt'); }}>Wiederherstellen<//>` });
    const wipe = () => ctx.openDialog({ title: 'Alle Daten löschen?', body: () => html`<${WipeBody} />`, footer: null });
    return html`<div class="tk-xc-bk" data-qa="backup-list">
      ${props.showStorage && html`<${Card} title="Speicher" icon="archive"><div class="tk-xc-stack"><div class="tk-row" style="justify-content:space-between"><strong class="tk-num">${fmtNumber(total, { unit: 'MB', digits: 1 })}</strong><span class="tk-xc-s">belegt auf diesem Gerät</span></div>
        <div class="tk-xc-bk__bar" role="img" aria-label=${`Speicher je Modul: ${parts.map((p) => `${p.label} ${fmtNumber(p.mb, { unit: 'MB', digits: 1 })}`).join(', ')}`}>${parts.map((p) => html`<i style=${`flex:${p.mb} 1 0;background:var(--tk-chart-${p.c})`}></i>`)}</div>
        <ul class="tk-xc-bk__leg">${parts.map((p) => html`<li><span class="tk-xc-bk__sw" style=${`background:var(--tk-chart-${p.c})`}></span><span class="tk-truncate">${p.label}</span><span>${fmtNumber(p.mb, { unit: 'MB', digits: 1 })}</span></li>`)}</ul></div><//>`}
      <${Card} title="Sicherungen" icon="cloud-upload" actions=${html`<${Button} size="sm" icon="cloud-upload" disabled=${run != null} onClick=${() => { ctx.emit('backup.now'); setRun(0); }}>Jetzt sichern<//>`}>
        <div class="tk-xc-stack"><div class="tk-row" style="gap:var(--tk-space-3)"><span class="tk-xc-main"><span class="tk-xc-t">Automatisch sichern</span><span class="tk-xc-s">Jede Nacht um 03:00 Uhr, die letzten 7 bleiben</span></span><${Switch} checked=${auto} label="Automatisch sichern" onChange=${(v) => { setAuto(v); ctx.emit('backup.auto', { on: v }); }} /></div>
          ${run != null && html`<div role="status" class="tk-xc-stack"><span class="tk-xc-s">Sicherung wird erstellt … ${run} %</span><${Progress} value=${run / 100} /></div>`}</div>
        ${list.length ? html`<div style="margin:var(--tk-space-3) calc(var(--tk-space-4) * -1) calc(var(--tk-space-4) * -1);border-top:1px solid var(--tk-c-border)">${list.map((b) => html`<div class="tk-xc-bk__item" key=${b.id}><span class="tk-xc-ic ${b.kind === 'auto' ? '' : 'tk-xc-ic--success'}"><${Icon} name=${b.kind === 'auto' ? 'history' : 'save'} size=${18} /></span>
          <span class="tk-xc-main"><span class="tk-xc-t">${agoLabel(ctx, b.at)}</span><span class="tk-xc-s">${b.kind === 'auto' ? 'Automatisch' : 'Von dir'} · ${fmtNumber(b.size, { unit: 'MB', digits: 1 })}</span></span>
          <${Button} size="sm" icon="archive-restore" onClick=${() => restore(b)} aria-label=${`Sicherung ${agoLabel(ctx, b.at)} wiederherstellen`}>Wiederherstellen<//></div>`)}</div>`
          : html`<${EmptyState} icon="cloud-upload" title="Noch keine Sicherung" text="Lege jetzt die erste Sicherung an." />`}<//>
      ${props.showDanger && html`<div class="tk-xc-bk__danger"><span class="tk-xc-main" style="flex-basis:200px"><span class="tk-xc-t" style="white-space:normal">Alle Daten löschen</span><span class="tk-xc-s" style="white-space:normal">Entfernt alles von diesem Gerät. Das lässt sich nicht rückgängig machen.</span></span><${Button} variant="danger" icon="trash-2" onClick=${wipe}>Alle Daten löschen<//></div>`}
    </div>`;
    function WipeBody() {
      const [t, setT] = useState('');
      return html`<div class="tk-xc-stack"><p style="margin:0">Alle Aufgaben, Termine, Notizen, Buchungen und Einstellungen werden endgültig gelöscht. Tippe zur Bestätigung <strong>LÖSCHEN</strong>.</p><${Input} value=${t} onInput=${setT} aria-label="Zur Bestätigung LÖSCHEN eingeben" placeholder="LÖSCHEN" />
        <${Button} variant="danger" icon="trash-2" disabled=${t.trim() !== 'LÖSCHEN'} onClick=${() => { ctx.emit('data.wipe'); ctx.toast('Löschen ist in der Demo deaktiviert'); }}>Endgültig löschen<//></div>`;
    }
  },
};
export default backupList;
