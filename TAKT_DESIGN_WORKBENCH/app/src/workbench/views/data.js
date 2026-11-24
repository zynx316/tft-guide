// Daten & Backup – Export, Import, Server-Backups, Seed-Abgleich, Zurücksetzen, Speicherstatus.
import { html } from '../../lib/html.js';
import { useState, useEffect } from 'preact/hooks';
import { Icon } from '../../lib/icons.js';
import { Card, Btn, Badge, Empty, confirmDialog, openDialog, toast, Field } from '../ui/kit.js';
import { act } from './common.js';
import { actions, exportState, persistence } from '../store.js';
import { inspectImport, migrate, SCHEMA_VERSION } from '../../core/schema.js';
import { validateState } from '../../core/validate.js';
import { getComponent } from '../../library/registry.js';
import { WORLD } from '../../seed/world/index.js';
import { SEED_VERSION, buildSeedState } from '../../seed/index.js';
import { diffSeed } from '../../core/seedpatch.js';
import { tokensJson } from '../../design-system/tokens.js';
import { tokensToDart } from '../../core/flutter.js';
import { download, fmt } from '../../lib/util.js';

const integrity = (s) => validateState(s, { getComponent, worldKeys: new Set(Object.keys(WORLD)) });
/** Befundliste der Integritätsprüfung (Fehler zuerst, aufklappbar ab 6 Einträgen). */
function IntegrityList({ report }) {
  const items = [...report.errors.map((e) => ({ ...e, tone: 'danger' })), ...report.warnings.map((w) => ({ ...w, tone: 'warning' }))];
  if (!items.length) return html`<div class="wb-row wb-small" style="gap:6px"><${Icon} name="check-circle-2" size=${15} /><span>Keine Auffälligkeiten – alle Verweise stimmen.</span></div>`;
  const row = (x) => html`<div class="wb-listrow wb-small"><${Badge} tone=${x.tone} sq>${x.tone === 'danger' ? 'Fehler' : 'Hinweis'}<//><span class="wb-grow">${x.msg}</span></div>`;
  return html`<div class="wb-col" style="gap:0" data-qa="integrity-list">${items.slice(0, 6).map(row)}${items.length > 6 && html`<details><summary class="wb-small wb-muted" style="cursor:pointer;padding:6px 0">${items.length - 6} weitere anzeigen</summary>${items.slice(6).map(row)}</details>`}</div>`;
}

function importDialog(obj, source) {
  const base = inspectImport(obj);
  let rep = null; try { rep = base.ok ? integrity(migrate(JSON.parse(JSON.stringify(obj)))) : null; } catch (e) { base.ok = false; base.errors.push(`Nicht lesbar: ${e.message}`); }
  const check = rep && !rep.ok ? { ...base, ok: false, errors: [...base.errors, `${rep.counts.errors} Integritätsfehler (siehe Liste)`] } : base;
  openDialog({ title: `Import prüfen – ${source}`, body: ({ close }) => html`<div class="wb-col" style="gap:12px">
    ${check.ok ? html`<div class="wb-banner wb-banner--info"><${Icon} name="info" size=${16} /><span>${check.summary.modules} Module · ${check.summary.features} Features · ${check.summary.versions} Versionen · ${check.summary.decisions} Entscheidungen${check.summary.updatedAt ? ` · Stand ${fmt.dateTime(check.summary.updatedAt)}` : ''}</span></div>
      <p class="wb-muted">Der aktuelle Zustand wird <strong>ersetzt</strong>. Vorher wird automatisch eine Sicherung heruntergeladen. Rückgängig mit Strg+Z ist ebenfalls möglich.</p>`
    : html`<div class="wb-banner wb-banner--warn"><${Icon} name="alert-triangle" size=${16} /><span>Ungültige Datei: ${check.errors.join('; ')}</span></div>`}
    ${rep && (rep.counts.errors + rep.counts.warnings) > 0 && html`<div class="wb-card" style="max-height:240px;overflow:auto;padding:4px 12px"><${IntegrityList} report=${rep} /></div>`}
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
          <div class="wb-row wb-between"><span class="wb-muted">Status</span><span>${({ saved: 'Gespeichert', saving: 'Speichert …', dirty: 'Ungespeicherte Änderungen', conflict: 'Konflikt – Kopie im Browser', error: 'Fehler beim Speichern' })[persistence.status] || persistence.status}</span></div>
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
      <${Card} title="Integrität" icon="shield-check" sub="Prüft Verweise: Features ↔ Module, Varianten, Freigaben, Entscheidungen, Runden, Anmerkungen, Navigationsziele, Komponenten, Welt-Schlüssel.">
        ${(() => { const r = integrity(state); return html`<div class="wb-col" style="gap:8px"><div class="wb-row" style="gap:8px"><${Badge} tone=${r.counts.errors ? 'danger' : r.counts.warnings ? 'warning' : 'success'}>${r.counts.errors} Fehler · ${r.counts.warnings} Hinweise<//></div><${IntegrityList} report=${r} /></div>`; })()}<//>
      <${Card} title="Seed & Zurücksetzen" icon="package">
        <p class="wb-small wb-muted">Der Seed (app/src/seed/) ist der Startinhalt. „Seed abgleichen“ ergänzt Neues, aktualisiert nur Features, die du nicht verändert hast (vorher gesichert), und lässt Freigegebenes unberührt (dafür entsteht ein Vorschlag). Aktueller Seed: <span class="wb-mono">${SEED_VERSION}</span>${state.meta.seedVersion && state.meta.seedVersion !== SEED_VERSION ? html` · <strong style="color:var(--wb-warning)">dein Stand: ${state.meta.seedVersion}</strong>` : ''}.</p>
        <div class="wb-row wb-wrap" style="gap:8px;margin-top:10px">
          <${Btn} variant="primary" icon="merge" onClick=${() => seedPatchDialog(state)} data-qa="seed-patch">Seed abgleichen …<//>
          <${Btn} variant="danger" icon="rotate-ccw" onClick=${async () => { if (await confirmDialog({ title: 'Auf Seed zurücksetzen?', text: 'Alle Änderungen gehen verloren (vorher wird automatisch ein Export heruntergeladen; Rückgängig mit Strg+Z möglich).', danger: true, confirmLabel: 'Zurücksetzen' })) { download(`takt-workbench-vor-reset-${Date.now()}.json`, exportState()); act(() => actions.resetToSeed()); toast('Auf Seed zurückgesetzt'); } }}>Zurücksetzen …<//></div><//>
    </div>
  </div>`;
}

/** Vorschau und Auswahl für den Seed-Patch. */
function seedPatchDialog(state) {
  const d = diffSeed(state, buildSeedState());
  openDialog({ title: `Seed ${SEED_VERSION} abgleichen`, size: 'wide', body: ({ close }) => {
    const [ids, setIds] = useState(d.aktualisierbar.map((x) => x.id));
    const toggle = (id, on) => setIds(on ? [...ids, id] : ids.filter((x) => x !== id));
    const group = (title, list, tone, selectable, hint) => html`<div class="wb-col" style="gap:4px"><div class="wb-row"><${Badge} tone=${tone} sq>${list.length}<//><strong>${title}</strong><span class="wb-small wb-muted">${hint}</span></div>
      ${list.length > 0 && html`<div class="wb-card" style="max-height:180px;overflow:auto">${list.map((x) => html`<label class="wb-listrow" style=${selectable ? 'cursor:pointer' : ''}>${selectable ? html`<input type="checkbox" checked=${ids.includes(x.id)} onChange=${(e) => toggle(x.id, e.currentTarget.checked)} style="accent-color:var(--wb-accent)" />` : html`<${Icon} name=${tone === 'info' ? 'lock' : 'plus'} size=${14} />`}
        <span class="wb-grow wb-trunc">${x.label || x.name}</span>${x.variants && html`<span class="wb-xs wb-subtle">Varianten ${x.variants}</span>`}</label>`)}</div>`}</div>`;
    const nothing = !d.neueModule.length && !d.neu.length && !d.aktualisierbar.length && !d.geaendert.length && !d.gesperrt.length;
    return html`<div class="wb-col" style="gap:12px">
      ${nothing ? html`<${Empty} icon="check-check" title="Alles aktuell" text=${`${d.gleich} Features entsprechen dem Seed.`} />` : html`
      ${group('Neue Module', d.neueModule, 'success', false, 'werden ergänzt')}
      ${group('Neue Features', d.neu, 'success', false, 'werden ergänzt')}
      ${group('Aktualisierbar', d.aktualisierbar, 'accent', true, 'von dir unverändert – vorher wird eine Arbeitsversion gesichert')}
      ${group('Von dir geändert', d.geaendert, 'warning', true, 'nur ankreuzen, wenn der Seed-Stand deine Änderung ersetzen soll (Sicherung entsteht)')}
      ${group('Freigegeben (gesperrt)', d.gesperrt, 'info', false, 'bleiben unverändert – je Feature entsteht eine offene Entscheidung „Seed-Vorschlag“')}
      <div class="wb-small wb-subtle">${d.gleich} Features sind bereits auf Seed-Stand.</div>`}
      <div class="wb-row" style="justify-content:flex-end"><${Btn} onClick=${close}>Abbrechen<//>${!nothing && html`<${Btn} variant="primary" icon="merge" data-confirm onClick=${() => {
        const r = act(() => actions.applySeedPatch(ids)); close();
        if (r) toast(`Seed abgeglichen: ${r.modules} Module und ${r.features} Features neu, ${r.updated} aktualisiert${r.proposals ? `, ${r.proposals} Vorschläge` : ''}`); }}>Abgleichen<//>`}</div></div>`;
  } });
}
