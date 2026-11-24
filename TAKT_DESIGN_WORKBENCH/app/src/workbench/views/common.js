// Gemeinsame View-Bausteine (Dialoge, Status-Pipeline, Aktionsmenüs, QA-Lauf).
import { html } from '../../lib/html.js';
import { useState, useRef, useEffect } from 'preact/hooks';
import { Icon } from '../../lib/icons.js';
import { ICON_NAMES } from '../../lib/icons.js';
import { Btn, Field, Select, TextInput, Badge, openDialog, confirmDialog, promptDialog, toast, openMenu, Checkbox, QaCell } from '../ui/kit.js';
import { actions, getState, tryAction } from '../store.js';
import { FEATURE_STATUSES, MODULE_STATUSES, statusInfo, REQUIREMENT_TYPES, PRIORITIES } from '../../core/schema.js';
import { THEME_IDS, themes } from '../../design-system/tokens.js';
import { DEVICES } from '../../core/devices.js';
import { runQa } from '../qa-runner.js';
import { navigate, featureHref, moduleHref, studioHref } from '../router.js';
import { fmt } from '../../lib/util.js';

export const toneVar = (tone) => (tone && tone !== 'neutral' ? `var(--wb-${tone})` : 'var(--wb-subtle)');
export const act = (fn) => tryAction(fn, (msg, tone, fid) => toast(msg, tone, fid ? { label: 'Neue Arbeitsversion', onClick: () => newWorkingVersionDialog(fid) } : null));

/** Status-Verteilung als gestapelter Balken */
export function StatusPipeline({ features, height = 10, legend }) {
  const total = features.length || 1;
  const counts = FEATURE_STATUSES.map((s) => ({ ...s, n: features.filter((f) => f.status === s.id).length }));
  return html`<div class="wb-col" style="gap:10px">
    <div class="wb-pipe" style=${`height:${height}px`} role="img" aria-label="Statusverteilung">${counts.filter((c) => c.n).map((c) => html`<span title=${`${c.label}: ${c.n}`} style=${`flex:${c.n / total};background:${toneVar(c.tone)}`}></span>`)}</div>
    ${legend && html`<div class="wb-row wb-wrap" style="gap:6px 14px">${counts.map((c) => html`<span class="wb-row wb-small" style="gap:6px"><span class="wb-dot" style=${`color:${toneVar(c.tone)}`}></span><span class="wb-muted">${c.label}</span><strong class="wb-num">${c.n}</strong></span>`)}</div>`}
  </div>`;
}

/** Status-Optionen: Stabile Status nur bei Freigabe; Freigabe selbst nur über „Freigeben“. */
export const statusOptions = (f) => FEATURE_STATUSES.map((s) => {
  const stable = ['released', 'implemented', 'regression_ok'].includes(s.id);
  return { value: s.id, label: s.label + (!f.locked && stable ? ' (nach Freigabe)' : f.locked && !stable ? ' (neue Arbeitsversion)' : ''), disabled: s.id !== f.status && (f.locked ? !stable : stable) };
});

export const moduleProgress = (state, moduleId) => {
  const fs = state.features.filter((f) => f.moduleId === moduleId && !f.archived);
  const done = fs.filter((f) => ['released', 'implemented', 'regression_ok'].includes(f.status)).length;
  return { total: fs.length, done, ratio: fs.length ? done / fs.length : 0, features: fs };
};

// ------------------------------------------------------------ Icon-Wahl ---
function IconPicker({ value, onChange }) {
  const [q, setQ] = useState('');
  const list = ICON_NAMES.filter((n) => n.includes(q.toLowerCase())).slice(0, 84);
  return html`<div class="wb-col" style="gap:6px"><input class="wb-input wb-input--sm" placeholder="Icon suchen …" value=${q} onInput=${(e) => setQ(e.currentTarget.value)} />
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(34px,1fr));gap:4px;max-height:132px;overflow:auto;padding:2px">
      ${list.map((n) => html`<button type="button" class="wb-btn wb-btn--sm wb-btn--icon" aria-pressed=${String(n === value)} title=${n} onClick=${() => onChange(n)}><${Icon} name=${n} size=${16} /></button>`)}</div></div>`;
}

// --------------------------------------------------------- Modul-Dialog ---
export function moduleDialog(existing) {
  openDialog({
    title: existing ? `Modul bearbeiten – ${existing.name}` : 'Neues Modul',
    body: ({ close }) => {
      const [m, setM] = useState(existing ? { ...existing } : { name: '', icon: 'box', description: '', status: 'concept', theme: 'graphite', isReference: false });
      const [err, setErr] = useState('');
      const save = () => {
        if (!m.name.trim()) return setErr('Name ist erforderlich');
        if (existing) act(() => actions.updateModule(existing.id, { name: m.name.trim(), icon: m.icon, description: m.description, status: m.status, theme: m.theme, isReference: m.isReference }, `Modul „${m.name}“ bearbeitet`));
        else { const id = act(() => actions.addModule({ ...m, name: m.name.trim() })); if (id) { toast(`Modul „${m.name}“ angelegt`); navigate(moduleHref(id)); } }
        close();
      };
      return html`<div class="wb-col" style="gap:14px">
        <div class="wb-grid wb-grid-2"><${Field} label="Name *" error=${err}><input class="wb-input" autofocus value=${m.name} onInput=${(e) => { setM({ ...m, name: e.currentTarget.value }); setErr(''); }} onKeyDown=${(e) => e.key === 'Enter' && save()} /><//>
          <${Field} label="Status"><${Select} value=${m.status} onChange=${(v) => setM({ ...m, status: v })} options=${MODULE_STATUSES.map((s) => ({ value: s.id, label: s.label }))} /><//></div>
        <${Field} label="Beschreibung"><textarea class="wb-textarea" rows="2" value=${m.description} onInput=${(e) => setM({ ...m, description: e.currentTarget.value })}></textarea><//>
        <div class="wb-grid wb-grid-2"><${Field} label="Standard-Theme"><${Select} value=${m.theme} onChange=${(v) => setM({ ...m, theme: v })} options=${THEME_IDS.map((t) => ({ value: t, label: themes[t].label }))} /><//>
          <${Field} label="Art"><${Checkbox} checked=${m.isReference} onChange=${(v) => setM({ ...m, isReference: v })} label="Referenzmodul (bereits separat konzipiert)" /><//></div>
        <${Field} label=${html`Icon <span class="wb-row" style="gap:4px;color:var(--wb-accent)"><${Icon} name=${m.icon} size=${15} />${m.icon}</span>`}><${IconPicker} value=${m.icon} onChange=${(v) => setM({ ...m, icon: v })} /><//>
        <div class="wb-row" style="justify-content:flex-end"><${Btn} onClick=${close}>Abbrechen<//><${Btn} variant="primary" icon="check" onClick=${save} data-confirm>${existing ? 'Speichern' : 'Modul anlegen'}<//></div>
      </div>`;
    },
  });
}

// ------------------------------------------------------- Feature-Dialog ---
export function newFeatureDialog(moduleId) {
  const st = getState();
  openDialog({
    title: 'Neues Feature',
    body: ({ close }) => {
      const mods = st.modules.filter((m) => !m.archived);
      const [f, setF] = useState({ moduleId: moduleId || mods[0]?.id, name: '', group: '', purpose: '', status: 'not_analyzed' });
      const groups = [...new Set(st.features.filter((x) => x.moduleId === f.moduleId).map((x) => x.group))];
      const [err, setErr] = useState('');
      const save = (open) => {
        if (!f.name.trim()) return setErr('Name ist erforderlich');
        const id = act(() => actions.addFeature(f.moduleId, { ...f, name: f.name.trim(), group: f.group.trim() || 'Allgemein' }));
        close(); if (id) { toast(`Feature „${f.name}“ angelegt`); if (open) navigate(featureHref(id)); }
      };
      return html`<div class="wb-col" style="gap:14px">
        <div class="wb-grid wb-grid-2"><${Field} label="Modul"><${Select} value=${f.moduleId} onChange=${(v) => setF({ ...f, moduleId: v })} options=${mods.map((m) => ({ value: m.id, label: m.name }))} /><//>
          <${Field} label="Name *" error=${err}><input class="wb-input" autofocus value=${f.name} placeholder="z. B. Wochenansicht" onInput=${(e) => { setF({ ...f, name: e.currentTarget.value }); setErr(''); }} onKeyDown=${(e) => e.key === 'Enter' && save(true)} /><//></div>
        <div class="wb-grid wb-grid-2"><${Field} label="Gruppe" hint=${groups.length ? `Vorhanden: ${groups.join(', ')}` : ''}><input class="wb-input" list="wb-groups" value=${f.group} placeholder="z. B. Ansichten" onInput=${(e) => setF({ ...f, group: e.currentTarget.value })} /><datalist id="wb-groups">${groups.map((g) => html`<option value=${g} />`)}</datalist><//>
          <${Field} label="Status"><${Select} value=${f.status} onChange=${(v) => setF({ ...f, status: v })} options=${FEATURE_STATUSES.slice(0, 4).map((s) => ({ value: s.id, label: s.label }))} /><//></div>
        <${Field} label="Zweck" hint="Wozu dient das Feature? Ein bis zwei Sätze."><textarea class="wb-textarea" rows="2" value=${f.purpose} onInput=${(e) => setF({ ...f, purpose: e.currentTarget.value })}></textarea><//>
        <div class="wb-row" style="justify-content:flex-end"><${Btn} onClick=${close}>Abbrechen<//><${Btn} onClick=${() => save(false)}>Anlegen<//><${Btn} variant="primary" icon="arrow-right" onClick=${() => save(true)} data-confirm>Anlegen & öffnen<//></div>
      </div>`;
    },
  });
}

// ------------------------------------------------------ Feature-Menü ---
export function featureMenu(e, f, state) {
  const mods = state.modules.filter((m) => !m.archived && m.id !== f.moduleId);
  openMenu(e, [
    { label: 'Öffnen', icon: 'arrow-right', onClick: () => navigate(featureHref(f.id)) },
    { label: 'Im Design Studio', icon: 'palette', onClick: () => navigate(studioHref(f.id)) },
    { sep: true },
    { label: 'Umbenennen', icon: 'pencil', onClick: async () => { const n = await promptDialog({ title: 'Feature umbenennen', label: 'Name', value: f.name }); if (n) act(() => actions.updateFeature(f.id, { name: n }, `Umbenannt in „${n}“`)); } },
    { label: 'Duplizieren', icon: 'copy', onClick: () => { const id = act(() => actions.duplicateFeature(f.id)); if (id) toast('Feature dupliziert', null, { label: 'Öffnen', onClick: () => navigate(featureHref(id)) }); } },
    { label: 'In anderes Modul verschieben …', icon: 'move', disabled: !mods.length, onClick: () => moveFeatureDialog(f, mods) },
    { label: 'Mit anderem Feature zusammenführen …', icon: 'merge', onClick: () => mergeDialog(f, state) },
    { sep: true },
    f.archived ? { label: 'Wiederherstellen', icon: 'archive-restore', onClick: () => act(() => actions.archiveFeature(f.id, false)) } : { label: 'Archivieren', icon: 'archive', onClick: () => { act(() => actions.archiveFeature(f.id, true)); toast('Feature archiviert', null, { label: 'Rückgängig', onClick: () => actions.archiveFeature(f.id, false) }); } },
    { label: 'Löschen …', icon: 'trash-2', danger: true, onClick: async () => { if (await confirmDialog({ title: f.locked ? 'Freigegebenes Feature löschen?' : 'Feature löschen?', text: `${f.locked ? `ACHTUNG: „${f.name}“ ist freigegeben (v${f.version}). ` : ''}„${f.name}“ inkl. Varianten und Demo-Daten wird entfernt. Versionen und Entscheidungen bleiben in der Historie erhalten. Rückgängig mit Strg+Z.`, confirmLabel: f.locked ? 'Trotzdem löschen' : 'Löschen', danger: true })) { act(() => actions.deleteFeature(f.id, { force: f.locked })); toast('Feature gelöscht'); } } },
  ]);
}

function moveFeatureDialog(f, mods) {
  openDialog({ title: `„${f.name}“ verschieben`, body: ({ close }) => {
    const [to, setTo] = useState(mods[0]?.id);
    return html`<${Field} label="Ziel-Modul"><${Select} value=${to} onChange=${setTo} options=${mods.map((m) => ({ value: m.id, label: m.name }))} /><//>
      <div class="wb-row" style="justify-content:flex-end"><${Btn} onClick=${close}>Abbrechen<//><${Btn} variant="primary" data-confirm onClick=${() => { act(() => actions.moveFeature(f.id, to)); toast('Feature verschoben'); close(); }}>Verschieben<//></div>`;
  } });
}

function mergeDialog(f, state) {
  const others = state.features.filter((x) => x.id !== f.id && !x.archived);
  openDialog({ title: `„${f.name}“ zusammenführen`, body: ({ close }) => {
    const [src, setSrc] = useState(others.find((x) => x.moduleId === f.moduleId)?.id || others[0]?.id);
    return html`<p class="wb-muted wb-small">Anforderungen, Interaktionen, Varianten und Demo-Daten des gewählten Features werden in <strong>${f.name}</strong> übernommen. Das Quell-Feature wird archiviert (nicht gelöscht).</p>
      <${Field} label="Quelle (wird übernommen)"><${Select} value=${src} onChange=${setSrc} options=${others.map((x) => ({ value: x.id, label: `${state.modules.find((m) => m.id === x.moduleId)?.name} › ${x.name}` }))} /><//>
      <div class="wb-row" style="justify-content:flex-end"><${Btn} onClick=${close}>Abbrechen<//><${Btn} variant="primary" icon="merge" data-confirm onClick=${() => { act(() => actions.mergeFeatures(f.id, src)); toast('Zusammengeführt'); close(); }}>Zusammenführen<//></div>`;
  } });
}

export function newWorkingVersionDialog(featureId) {
  const f = getState().features.find((x) => x.id === featureId);
  promptDialog({ title: `Neue Arbeitsversion – ${f.name}`, label: 'Grund der Änderung', hint: `Der freigegebene Stand v${f.version} bleibt unverändert in der Historie. Danach wird v${f.version.split('.')[0]}.1 bearbeitet.`, placeholder: 'z. B. Feedback vom Gerätetest einarbeiten', confirmLabel: 'Arbeitsversion anlegen' })
    .then((reason) => { if (reason !== null) { act(() => actions.newWorkingVersion(featureId, reason)); toast('Neue Arbeitsversion angelegt – Feature ist wieder bearbeitbar'); } });
}

// ---------------------------------------------------- Entscheidungsdialog ---
export function decisionDialog({ existing, featureId, moduleId, preset } = {}) {
  openDialog({
    title: existing ? 'Entscheidung bearbeiten' : 'Entscheidung dokumentieren', size: 'wide',
    body: ({ close }) => {
      const [d, setD] = useState(existing ? { ...existing } : { title: '', decision: '', rationale: '', tradeoffs: '', alternatives: '', status: 'decided', featureId, moduleId, ...preset });
      const set = (k) => (e) => setD({ ...d, [k]: e.currentTarget.value });
      const save = () => {
        if (!d.title.trim()) return toast('Titel fehlt', 'danger');
        if (existing) act(() => actions.updateDecision(existing.id, d)); else act(() => actions.addDecision(d));
        toast('Entscheidung gespeichert'); close();
      };
      return html`<div class="wb-col" style="gap:12px">
        <div class="wb-grid" style="grid-template-columns:1fr 180px"><${Field} label="Frage / Titel *"><input class="wb-input" autofocus value=${d.title} onInput=${set('title')} placeholder="z. B. Welche Variante für die Wochenansicht?" /><//>
          <${Field} label="Status"><${Select} value=${d.status} onChange=${(v) => setD({ ...d, status: v })} options=${[{ value: 'open', label: 'Offen' }, { value: 'decided', label: 'Entschieden' }, { value: 'superseded', label: 'Überholt' }]} /><//></div>
        <${Field} label="Entscheidung"><textarea class="wb-textarea" rows="2" value=${d.decision} onInput=${set('decision')} placeholder="Was wurde entschieden?"></textarea><//>
        <${Field} label="Begründung"><textarea class="wb-textarea" rows="3" value=${d.rationale} onInput=${set('rationale')} placeholder="Warum? Welche Anforderungen/Tests sprechen dafür?"></textarea><//>
        <div class="wb-grid wb-grid-2"><${Field} label="Bewusst akzeptierte Nachteile"><textarea class="wb-textarea" rows="2" value=${d.tradeoffs} onInput=${set('tradeoffs')}></textarea><//>
          <${Field} label="Verworfene Alternativen"><textarea class="wb-textarea" rows="2" value=${d.alternatives} onInput=${set('alternatives')}></textarea><//></div>
        <div class="wb-row" style="justify-content:flex-end"><${Btn} onClick=${close}>Abbrechen<//><${Btn} variant="primary" icon="gavel" onClick=${save} data-confirm>Speichern<//></div>
      </div>`;
    },
  });
}

// --------------------------------------------------------- QA-Lauf-Dialog ---
/** Startet einen QA-Lauf mit sichtbarem Prüf-Frame und Fortschritt. jobs: [{featureId, variantId?}] */
export function qaRunDialog({ jobs, title = 'QA-Prüflauf', devices, scope }) {
  const st = getState();
  openDialog({
    title, size: 'wide',
    body: ({ close }) => {
      const host = useRef(); const ctrl = useRef(new AbortController());
      const [p, setP] = useState({ index: 0, total: 0, label: 'Vorbereitung …' });
      const [res, setRes] = useState(null);
      useEffect(() => {
        runQa({ state: st, jobs, devices: devices || st.settings.qaViewports, themes: st.settings.qaThemes, states: st.settings.qaStates, host: host.current, onProgress: setP, signal: ctrl.current.signal, scope: scope || 'manuell' })
          .then((run) => { setRes(run); if (run.results.length) actions.recordQaRun(run); })
          .catch((e) => toast(`QA-Lauf fehlgeschlagen: ${e.message}`, 'danger'));
        return () => ctrl.current.abort();
      }, []);
      const pct = p.total ? Math.round((p.index / p.total) * 100) : 0;
      return html`<div class="wb-grid" style="grid-template-columns:minmax(0,1fr) 380px;align-items:start">
        <div class="wb-col" style="gap:12px">
          ${!res ? html`<div class="wb-col" style="gap:8px"><div class="wb-row wb-between"><strong>${p.index} / ${p.total} Prüfungen</strong><span class="wb-num wb-muted">${pct} %</span></div>
            <div class="wb-bar"><span style=${`width:${pct}%;background:var(--wb-accent)`}></span></div><div class="wb-small wb-muted wb-trunc">${p.label}</div>
            <div class="wb-small wb-subtle">Je Feature × Viewport × Theme × Zustand wird die Vorschau gerendert und automatisch geprüft (Rendering, Blöcke, Überlauf, abgeschnittene Inhalte, Touch-Ziele, Kontrast, Bilder).</div></div>`
          : html`<div class="wb-col" style="gap:10px"><div class="wb-row" style="gap:10px"><${QaCell} status=${res.status} /><strong>${res.aborted ? 'Abgebrochen' : 'Abgeschlossen'}</strong>
              <${Badge} tone="success">${res.counts.pass} bestanden<//><${Badge} tone="warning">${res.counts.warn} Warnungen<//><${Badge} tone="danger">${res.counts.fail} Fehler<//></div>
            <div style="max-height:320px;overflow:auto" class="wb-card"><table class="wb-table"><thead><tr><th>Feature</th><th>Var.</th><th>Viewport</th><th>Theme</th><th>Status</th><th>Auffällig</th></tr></thead>
              <tbody>${res.results.map((r) => html`<tr><td class="wb-trunc" style="max-width:180px">${st.features.find((f) => f.id === r.featureId)?.name}</td><td>${r.variantId}</td><td>${r.viewport}</td><td>${r.theme}${r.state !== 'default' ? ` · ${r.state}` : ''}</td><td><${QaCell} status=${r.status} /></td>
                <td class="wb-small wb-muted">${r.checks.filter((c) => c.status !== 'pass').map((c) => c.name).join(', ') || '–'}</td></tr>`)}</tbody></table></div></div>`}
        </div>
        <div class="wb-col" style="align-items:center;gap:6px"><div class="wb-label">Prüf-Vorschau</div><div ref=${host} class="wb-frame__box" style="width:360px;height:240px"></div></div>
      </div>`;
    },
    footer: (close) => html`<${Btn} onClick=${close}>Schließen<//>`,
  });
}

export const devicesLabel = (ids) => ids.map((id) => DEVICES.find((d) => d.id === id)?.label || id).join(', ');
export { REQUIREMENT_TYPES, PRIORITIES, statusInfo, fmt };
