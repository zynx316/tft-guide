// Daten & Backup – Export, Import, Server-Backups, Seed-Abgleich, Zurücksetzen, Speicherstatus.
import { html } from '../../lib/html.js';
import { useState, useEffect } from 'preact/hooks';
import { Icon } from '../../lib/icons.js';
import { Card, Btn, Badge, Empty, confirmDialog, openDialog, toast, Field } from '../ui/kit.js';
import { act } from './common.js';
import { actions, exportState, persistence } from '../store.js';
import { inspectImport, SCHEMA_VERSION } from '../../core/schema.js';
import { SEED_VERSION } from '../../seed/index.js';
import { tokensJson } from '../../design-system/tokens.js';
import { tokensToDart } from '../../core/flutter.js';
import { download, fmt } from '../../lib/util.js';

function importDialog(obj, source) {
  const check = inspectImport(obj);
  openDialog({ title: `Import prüfen – ${source}`, body: ({ close }) => html`<div class="wb-col" style="gap:12px">
    ${check.ok ? html`<div class="wb-banner wb-banner--info"><${Icon} name="info" size=${16} /><span>${check.summary.modules} Module · ${check.summary.features} Features · ${check.summary.versions} Versionen · ${check.summary.decisions} Entscheidungen${check.summary.updatedAt ? ` · Stand ${fmt.dateTime(check.summary.updatedAt)}` : ''}</span></div>
      <p class="wb-muted">Der aktuelle Zustand wird <strong>ersetzt</strong>. Vorher wird automatisch eine Sicherung heruntergeladen. Rückgängig mit Strg+Z ist ebenfalls möglich.</p>`
    : html`<div class="wb-banner wb-banner--warn"><${Icon} name="alert-triangle" size=${16} /><span>Ungültige Datei: ${check.errors.join('; ')}</span></div>`}
    <div class="wb-row" style="justify-content:flex-end"><${Btn} onClick=${close}>Abbrechen<//><${Btn} variant="primary" icon="upload" disabled=${!check.ok} data-confirm onClick=${() => {
      download(`takt-workbench-vor-import-${new Date().toISOString().replace(/[:.]/g, '-')}.json`, exportState());
      act(() => actions.importState(obj)); toast('Import abgeschlossen'); close(); }}>Importieren<//></div></div>` });
}

export function DataView({ state }) {
  const [backups, setBackups] = useState(null);
  const [err, setErr] = useState('');
  const loadBackups = async () => { try { const r = await fetch('/api/backups', { cache: 'no-store' }); if (!r.ok) throw new Error(`HTTP ${r.status}`); setBackups(await r.json()); } catch (e) { setBackups([]); setErr(persistence.server ? e.message : 'Kein Server – Backups nur über Export.'); } };
  useEffect(() => { loadBackups(); }, []);
  const size = new Blob([JSON.stringify(state)]).size;
  const onFile = (e) => { const file = e.currentTarget.files[0]; e.currentTarget.value = ''; if (!file) return; file.text().then((t) => { try { importDialog(JSON.parse(t), file.name); } catch (x) { toast(`Keine gültige JSON-Datei: ${x.message}`, 'danger'); } }); };
  const restore = async (name) => { try { const r = await fetch(`/api/backups/${encodeURIComponent(name)}`); importDialog(await r.json(), name); } catch (e) { toast(e.message, 'danger'); } };
  const backupNow = async () => { try { const r = await fetch('/api/backups', { method: 'POST' }); const j = await r.json(); toast(j.name ? `Backup ${j.name}` : 'Noch keine Datei zum Sichern'); loadBackups(); } catch (e) { toast(e.message, 'danger'); } };

  return html`<div class="wb-page">
    <div><h1 class="wb-h1">Daten & Backup</h1><p class="wb-muted" style="margin-top:4px">Die Workbench ist nicht an eine einzelne Datei gebunden: Export/Import, automatische Server-Backups und Browser-Speicher als Rückfallebene.</p></div>
    <div class="wb-grid wb-grid-3">
      <${Card} title="Speicherort" icon="save">
        <div class="wb-col wb-small" style="gap:6px">
          <div class="wb-row wb-between"><span class="wb-muted">Modus</span><${Badge} tone=${persistence.mode === 'file' ? 'success' : 'warning'}>${persistence.mode === 'file' ? 'Datei (data/workbench.json)' : 'Nur Browser-Speicher'}<//></div>
          <div class="wb-row wb-between"><span class="wb-muted">Status</span><span>${persistence.status}</span></div>
          <div class="wb-row wb-between"><span class="wb-muted">Zuletzt gespeichert</span><span class="wb-num">${persistence.lastSaved ? fmt.dateTime(persistence.lastSaved) : '–'}</span></div>
          <div class="wb-row wb-between"><span class="wb-muted">Größe</span><span class="wb-num">${(size / 1024).toFixed(0)} KB</span></div>
          <div class="wb-row wb-between"><span class="wb-muted">Schema / Seed</span><span class="wb-num">v${SCHEMA_VERSION} · ${state.meta.seedVersion || '–'}</span></div>
          ${persistence.error && html`<div class="wb-field__error">${persistence.error}</div>`}
          ${persistence.mode !== 'file' && html`<div class="wb-subtle">Für Dateispeicherung mit <span class="wb-mono">npm start</span> starten.</div>`}</div><//>
      <${Card} title="Export" icon="download">
        <p class="wb-small wb-muted">Vollständiger Stand (Module, Features, Varianten, Versionen, Entscheidungen, QA, Einstellungen) als JSON – für Backup, Weitergabe oder Übertragung auf einen anderen Rechner.</p>
        <div class="wb-col" style="gap:8px;margin-top:10px"><${Btn} variant="primary" icon="download" onClick=${() => download(`takt-workbench-${new Date().toISOString().slice(0, 10)}.json`, exportState())}>Workbench exportieren<//>
          <${Btn} icon="swatch-book" onClick=${() => download('takt-design-tokens.json', JSON.stringify(tokensJson(), null, 2))}>Design-Tokens exportieren (JSON)<//>
          <${Btn} icon="code" onClick=${() => download('takt_tokens.dart', tokensToDart(), 'text/plain')}>Flutter-Tokens exportieren (Dart)<//></div><//>
      <${Card} title="Import" icon="upload">
        <p class="wb-small wb-muted">Export-Datei einlesen. Vor dem Ersetzen wird geprüft und automatisch eine Sicherung des aktuellen Stands heruntergeladen.</p>
        <label class="wb-btn" style="margin-top:10px;width:100%"><${Icon} name="upload" size=${16} />Datei wählen …<input type="file" accept="application/json,.json" style="display:none" onChange=${onFile} data-qa="import-input" /></label><//>
    </div>
    <div class="wb-grid wb-grid-2">
      <${Card} title="Server-Backups" icon="history" sub="Automatisch höchstens alle 10 Minuten beim Speichern, die letzten 40 bleiben erhalten (data/backups/)." actions=${html`<div class="wb-row"><${Btn} size="sm" icon="refresh-cw" onClick=${loadBackups}>Aktualisieren<//><${Btn} size="sm" icon="save" disabled=${!persistence.server} onClick=${backupNow}>Jetzt sichern<//></div>`}>
        ${err && html`<div class="wb-small wb-subtle">${err}</div>`}
        ${backups && !backups.length && !err && html`<div class="wb-small wb-subtle">Noch keine Backups.</div>`}
        ${backups?.length > 0 && html`<div class="wb-col" style="gap:0;margin:-8px -16px -16px;max-height:300px;overflow:auto">${backups.map((b) => html`<div class="wb-listrow"><${Icon} name="file-json" size=${15} /><span class="wb-grow wb-mono wb-trunc">${b.name}</span><span class="wb-small wb-subtle wb-num">${(b.size / 1024).toFixed(0)} KB</span>
          <${Btn} size="sm" variant="ghost" icon="rotate-ccw" onClick=${() => restore(b.name)}>Wiederherstellen<//></div>`)}</div>`}<//>
      <${Card} title="Seed & Zurücksetzen" icon="package">
        <p class="wb-small wb-muted">Der Seed (app/src/seed/) ist der Startinhalt. Neue Module/Features, die später im Seed ergänzt werden (z. B. nach der Phase-1-Analyse), lassen sich übernehmen, ohne bestehende Arbeit zu verändern. Aktueller Seed: <span class="wb-mono">${SEED_VERSION}</span>.</p>
        <div class="wb-row wb-wrap" style="gap:8px;margin-top:10px">
          <${Btn} icon="merge" onClick=${() => { const added = act(() => actions.mergeSeed()); if (added) toast(added.modules.length + added.features.length ? `Übernommen: ${added.modules.length} Module, ${added.features.length} Features` : 'Nichts Neues im Seed'); }}>Neue Seed-Inhalte übernehmen<//>
          <${Btn} variant="danger" icon="rotate-ccw" onClick=${async () => { if (await confirmDialog({ title: 'Auf Seed zurücksetzen?', text: 'Alle Änderungen gehen verloren (vorher wird automatisch ein Export heruntergeladen; Rückgängig mit Strg+Z möglich).', danger: true, confirmLabel: 'Zurücksetzen' })) { download(`takt-workbench-vor-reset-${Date.now()}.json`, exportState()); act(() => actions.resetToSeed()); toast('Auf Seed zurückgesetzt'); } }}>Zurücksetzen …<//></div><//>
    </div>
  </div>`;
}
