// Feature-Workspace-Tabs: Übersicht, Anforderungen, Interaktionen, Demo-Daten, Entscheidungen, Historie
import { html } from '../../lib/html.js';
import { useState, useMemo, useCallback } from 'preact/hooks';
import { Icon } from '../../lib/icons.js';
import { Card, Btn, IconBtn, Badge, StatusBadge, Empty, Select, TextInput, Checkbox, Field, openDialog, confirmDialog, promptDialog, toast, useSortable, QaCell } from '../ui/kit.js';
import { act, decisionDialog, decisionStatusLabel, decisionTone, REQUIREMENT_TYPES, PRIORITIES, toneVar } from './common.js';
import { newRoundDialog } from './rounds.js';
import { actions } from '../store.js';
import { FEATURE_STATUSES, statusIndex, UI_STATES } from '../../core/schema.js';
import { diffSnapshots, snapshotOf } from '../../core/versioning.js';
import { buildFeaturePayload } from '../../core/preview-payload.js';
import { getComponent } from '../../library/registry.js';
import { PreviewFrame } from '../ui/preview-frame.js';
import { navigate, featureHref, studioHref } from '../router.js';
import { fmt, uid } from '../../lib/util.js';
import { GatesCard, PinsCard, AcceptanceCard } from './ws-process.js';

const VIEWPORT_GROUPS = [{ id: 'desktop', label: 'Desktop', icon: 'monitor' }, { id: 'notebook', label: 'Notebook', icon: 'laptop' }, { id: 'tablet', label: 'Tablet', icon: 'tablet' }, { id: 'mobile', label: 'Mobile', icon: 'smartphone' }];

function StatusStepper({ status }) {
  const cur = statusIndex(status);
  return html`<div class="wb-col" style="gap:2px">${FEATURE_STATUSES.map((s, i) => html`<div class="wb-row" style=${`gap:10px;padding:5px 0;${i > cur ? 'opacity:.5' : ''}`}>
    <span style=${`width:22px;height:22px;border-radius:50%;display:grid;place-items:center;flex:none;${i < cur ? 'background:var(--wb-success-soft);color:var(--wb-success)' : i === cur ? 'background:var(--wb-accent);color:var(--wb-on-accent)' : 'border:1px solid var(--wb-border-strong);color:var(--wb-subtle)'}`}>
      <${Icon} name=${i < cur ? 'check' : s.icon} size=${12} stroke=${2.5} /></span><span style=${i === cur ? 'font-weight:650' : ''}>${s.label}</span></div>`)}</div>`;
}

// ------------------------------------------------------------- Übersicht ---
export function OverviewTab({ state, feature: f }) {
  const lockedMsg = f.locked;
  const payload = useMemo(() => (f.variants.length ? buildFeaturePayload(state, f.id, f.selectedVariantId, { theme: state.settings.previewTheme }) : null), [state, f.id, f.selectedVariantId]);
  const others = state.features.filter((x) => x.id !== f.id && !x.archived && !(f.links || []).includes(x.id));
  const setLinks = (links) => act(() => actions.updateFeature(f.id, { links }, 'Verknüpfungen geändert'));
  const sel = f.variants.find((v) => v.id === f.selectedVariantId);
  return html`<div class="wb-grid" style="grid-template-columns:minmax(0,1fr) 340px;align-items:start">
    <div class="wb-col" style="gap:14px">
      <${Card} title="Zweck" icon="target"><${TextInput} multiline rows="3" value=${f.purpose} disabled=${lockedMsg} onCommit=${(v) => act(() => actions.updateFeature(f.id, { purpose: v }, 'Zweck bearbeitet'))} placeholder="Wozu dient das Feature? Welches Problem löst es?" /><//>
      <div class="wb-grid wb-grid-2">
        <${Card} title="Ziel-Viewports" icon="monitor">
          <div class="wb-col" style="gap:8px">${VIEWPORT_GROUPS.map((v) => html`<${Checkbox} label=${html`<span class="wb-row" style="gap:6px"><${Icon} name=${v.icon} size=${14} />${v.label}</span>`} checked=${f.viewports.includes(v.id)} disabled=${lockedMsg}
            onChange=${(on) => act(() => actions.updateFeature(f.id, { viewports: on ? [...f.viewports, v.id] : f.viewports.filter((x) => x !== v.id) }, 'Viewports geändert'))} />`)}</div><//>
        <${Card} title="Zustände" icon="layers">
          <div class="wb-col" style="gap:8px">${UI_STATES.map((s) => html`<${Checkbox} label=${s.label} checked=${f.states.includes(s.id)} disabled=${lockedMsg}
            onChange=${(on) => act(() => actions.updateFeature(f.id, { states: on ? [...f.states, s.id] : f.states.filter((x) => x !== s.id) }, 'Zustände geändert'))} />`)}</div>
          <div class="wb-small wb-subtle" style="margin-top:8px">Alle Zustände sind in der Vorschau über „Zustand“ prüfbar.</div><//>
      </div>
      <${Card} title="Verknüpfte Features" icon="link-2" sub="z. B. Kalender › Aufgabenintegration ↔ Aufgaben › Fälligkeit">
        <div class="wb-row wb-wrap" style="gap:8px">${(f.links || []).map((id) => { const x = state.features.find((y) => y.id === id); return html`<span class="wb-badge wb-badge--outline" style="height:28px;padding:0 4px 0 10px">
          <a href=${featureHref(id)}>${x ? `${state.modules.find((mm) => mm.id === x.moduleId)?.name} › ${x.name}` : id}</a><${IconBtn} icon="x" label="Entfernen" onClick=${() => setLinks(f.links.filter((l) => l !== id))} /></span>`; })}
          <${Select} size="sm" style="width:auto;max-width:280px" value="" onChange=${(v) => v && setLinks([...(f.links || []), v])} options=${[{ value: '', label: '+ Feature verknüpfen' }, ...others.map((x) => ({ value: x.id, label: `${state.modules.find((mm) => mm.id === x.moduleId)?.name} › ${x.name}` }))]} /></div><//>
      <div class="wb-grid wb-grid-2">
        <${Card} title="Referenzen" icon="bookmark" actions=${html`<${Btn} size="sm" icon="plus" disabled=${lockedMsg} onClick=${async () => { const label = await promptDialog({ title: 'Referenz hinzufügen', label: 'Bezeichnung + optional Pfad/URL (durch „|“ getrennt)', placeholder: 'Flutter-Screen | lib/modules/calendar/week_view.dart' }); if (label) { const [l, href] = label.split('|').map((s) => s.trim()); act(() => actions.updateFeature(f.id, { references: [...(f.references || []), { label: l, href: href || '' }] }, 'Referenz hinzugefügt')); } }}>Neu<//>`}>
          ${(f.references || []).length ? html`<div class="wb-col" style="gap:6px">${f.references.map((r, i) => html`<div class="wb-row"><${Icon} name="file-text" size=${14} /><span class="wb-grow wb-trunc">${r.label}${r.href && html` <span class="wb-mono wb-subtle">${r.href}</span>`}</span>
            <${IconBtn} icon="x" label="Entfernen" disabled=${lockedMsg} onClick=${() => act(() => actions.updateFeature(f.id, { references: f.references.filter((_, k) => k !== i) }, 'Referenz entfernt'))} /></div>`)}</div>`
          : html`<div class="wb-small wb-subtle">Code-Stellen, frühere HTML-Prototypen, Konzepte (Phase 1).</div>`}<//>
        <${Card} title="Notizen" icon="sticky-note"><${TextInput} multiline rows="4" value=${f.notes} onCommit=${(v) => act(() => actions.updateFeature(f.id, { notes: v }, 'Notiz bearbeitet'))} placeholder="Offene Punkte, Ideen …" /><//>
      </div>
      <${PinsCard} state=${state} feature=${f} />
    </div>
    <div class="wb-col" style="gap:14px">
      <${Card} title="Fortschritt"><${StatusStepper} status=${f.status} /><//>
      <${GatesCard} state=${state} feature=${f} />
      <${Card} title=${sel ? `Bevorzugt: ${sel.id} – ${sel.name}` : 'Noch kein Design'} icon="palette" actions=${html`<a class="wb-small" href=${studioHref(f.id)}>Studio</a>`}>
        ${payload ? html`<div class="wb-canvas" style="border-radius:10px;padding:14px 6px"><${PreviewFrame} payload=${payload} device="mobile" maxHeight=${440} showMeta=${false} /></div>
          <p class="wb-small wb-muted" style="margin-top:10px">${sel.concept}</p>`
        : html`<${Empty} icon="palette" title="Keine Variante" text="Lege im Design Studio die erste Variante an." action=${html`<${Btn} variant="primary" icon="plus" disabled=${lockedMsg} onClick=${() => { const id = act(() => actions.addVariant(f.id, {})); if (id) navigate(studioHref(f.id, id)); }}>Variante anlegen<//>`} />`}<//>
      <${Card} title="Gerätetest (echtes Smartphone)" icon="smartphone">
        ${f.realDevice ? html`<div class="wb-row"><${QaCell} status=${f.realDevice.ok ? 'pass' : 'fail'} /><span>${fmt.dateTime(f.realDevice.at)}</span></div><p class="wb-small wb-muted" style="margin-top:6px">${f.realDevice.note}</p>`
          : html`<p class="wb-small wb-muted">Nur an Meilensteinen nötig: erste Freigabe eines Moduls, große Responsive-Änderungen, Modulfreigabe, finaler Gesamtcheck.</p>`}
        <${Btn} size="sm" icon="clipboard-check" style="margin-top:10px" onClick=${() => deviceCheckDialog(f)}>Gerätetest dokumentieren<//><//>
    </div>
  </div>`;
}

export function deviceCheckDialog(f) {
  openDialog({ title: `Gerätetest – ${f.name}`, body: ({ close }) => {
    const [ok, setOk] = useState(true); const [note, setNote] = useState(''); const [device, setDevice] = useState('');
    return html`<${Field} label="Gerät / Browser"><input class="wb-input" value=${device} placeholder="z. B. Pixel 8, Chrome 131" onInput=${(e) => setDevice(e.currentTarget.value)} /><//>
      <${Field} label="Ergebnis"><${Select} value=${ok ? 'ok' : 'nok'} onChange=${(v) => setOk(v === 'ok')} options=${[{ value: 'ok', label: 'Bestanden' }, { value: 'nok', label: 'Mängel gefunden' }]} /><//>
      <${Field} label="Beobachtungen"><textarea class="wb-textarea" rows="3" value=${note} onInput=${(e) => setNote(e.currentTarget.value)}></textarea><//>
      <div class="wb-row" style="justify-content:flex-end"><${Btn} onClick=${close}>Abbrechen<//><${Btn} variant="primary" data-confirm onClick=${() => { act(() => actions.setRealDevice(f.id, { ok, note: [device, note].filter(Boolean).join(' – ') })); toast('Gerätetest dokumentiert'); close(); }}>Speichern<//></div>`;
  } });
}

// -------------------------------------------------------- Anforderungen ---
export function RequirementsTab({ state, feature: f }) {
  const [sel, setSel] = useState([]);
  const [draft, setDraft] = useState({ text: '', type: 'info', priority: 'must' });
  const list = f.requirements;
  const save = (next, label) => act(() => actions.setList(f.id, 'requirements', next, label));
  const upd = (id, patch) => save(list.map((r) => (r.id === id ? { ...r, ...patch } : r)), 'Anforderung bearbeitet');
  const { itemProps } = useSortable(list.map((r) => r.id), (ids) => save(ids.map((id) => list.find((r) => r.id === id)), 'Anforderungen sortiert'));
  const add = () => { if (!draft.text.trim()) return; save([...list, { ...draft, text: draft.text.trim(), id: uid('r') }], 'Anforderung hinzugefügt'); setDraft({ ...draft, text: '' }); };
  const split = async () => { const name = await promptDialog({ title: 'Feature aufteilen', label: `Name des neuen Features (${sel.length} Anforderungen werden verschoben)`, placeholder: 'z. B. Wiederholungen' }); if (name) { const id = act(() => actions.splitFeature(f.id, sel, name)); setSel([]); if (id) toast(`„${name}“ angelegt`, null, { label: 'Öffnen', onClick: () => navigate(featureHref(id)) }); } };
  const byType = REQUIREMENT_TYPES.map((t) => ({ ...t, n: list.filter((r) => r.type === t.id).length }));
  return html`<div class="wb-col" style="gap:14px">
    <div class="wb-row wb-wrap" style="gap:10px">${byType.map((t) => html`<${Badge} icon=${t.icon}>${t.label}: ${t.n}<//>`)}<span class="wb-grow"></span>
      ${sel.length > 0 && html`<span class="wb-small wb-muted">${sel.length} ausgewählt</span><${Btn} size="sm" icon="split" disabled=${f.locked} onClick=${split}>In neues Feature auslagern<//><${Btn} size="sm" variant="ghost" onClick=${() => setSel([])}>Auswahl aufheben<//>`}</div>
    <${Card}>
      ${!list.length && html`<${Empty} icon="list-todo" title="Noch keine Anforderungen" text="Was muss das Feature können? Welche Informationen müssen sichtbar sein, welche Aktionen möglich, welche Zustände gibt es?" />`}
      <div class="wb-col" style="gap:0">${list.map((r) => { const ip = itemProps(r.id); return html`<div ...${ip} class="wb-listrow" style=${ip['data-drop'] ? 'box-shadow:inset 0 2px 0 var(--wb-accent)' : ''} data-req=${r.id}>
        <input type="checkbox" checked=${sel.includes(r.id)} onChange=${(e) => setSel(e.currentTarget.checked ? [...sel, r.id] : sel.filter((x) => x !== r.id))} aria-label="Auswählen" style="accent-color:var(--wb-accent)" />
        <span class="wb-subtle" style="cursor:grab"><${Icon} name="grip-vertical" size=${14} /></span>
        <${Select} size="sm" style="width:118px;flex:none" value=${r.type} disabled=${f.locked} onChange=${(v) => upd(r.id, { type: v })} options=${REQUIREMENT_TYPES.map((t) => ({ value: t.id, label: t.label }))} aria-label="Typ" />
        <${TextInput} size="sm" class="wb-input--ghost wb-grow" value=${r.text} disabled=${f.locked} onCommit=${(v) => upd(r.id, { text: v })} aria-label="Anforderung" />
        <${Select} size="sm" style="width:86px;flex:none" value=${r.priority} disabled=${f.locked} onChange=${(v) => upd(r.id, { priority: v })} options=${PRIORITIES.map((p) => ({ value: p.id, label: p.label }))} aria-label="Priorität" />
        <${IconBtn} icon="trash-2" label="Entfernen" disabled=${f.locked} onClick=${() => save(list.filter((x) => x.id !== r.id), 'Anforderung entfernt')} /></div>`; })}</div>
      ${!f.locked && html`<div class="wb-row" style="padding:10px 14px;border-top:1px solid var(--wb-border);background:var(--wb-panel-2);border-radius:0 0 12px 12px">
        <${Select} size="sm" style="width:118px;flex:none" value=${draft.type} onChange=${(v) => setDraft({ ...draft, type: v })} options=${REQUIREMENT_TYPES.map((t) => ({ value: t.id, label: t.label }))} aria-label="Typ neu" />
        <input class="wb-input wb-input--sm wb-grow" placeholder="Neue Anforderung … (Enter)" value=${draft.text} onInput=${(e) => setDraft({ ...draft, text: e.currentTarget.value })} onKeyDown=${(e) => e.key === 'Enter' && add()} data-qa="req-input" />
        <${Select} size="sm" style="width:86px;flex:none" value=${draft.priority} onChange=${(v) => setDraft({ ...draft, priority: v })} options=${PRIORITIES.map((p) => ({ value: p.id, label: p.label }))} aria-label="Priorität neu" />
        <${Btn} size="sm" variant="primary" icon="plus" onClick=${add}>Hinzufügen<//></div>`}
    <//>
    <${AcceptanceCard} feature=${f} />
  </div>`;
}

// --------------------------------------------------------- Interaktionen ---
export function InteractionsTab({ state, feature: f }) {
  const [log, setLog] = useState([]);
  const [device, setDevice] = useState('mobile');
  const list = f.interactions;
  const save = (next, label) => act(() => actions.setList(f.id, 'interactions', next, label));
  const upd = (id, patch) => save(list.map((x) => (x.id === id ? { ...x, ...patch } : x)), 'Interaktion bearbeitet');
  const payload = useMemo(() => (f.variants.length ? buildFeaturePayload(state, f.id, f.selectedVariantId, { theme: state.settings.previewTheme }) : null), [f.selectedVariantId, f.variants, f.demoData, state.settings.previewTheme]);
  const known = useMemo(() => { const set = new Set(); for (const v of f.variants) for (const b of v.blocks) for (const e of getComponent(b.component)?.events || []) set.add(e); return [...set]; }, [f.variants]);
  const onInteraction = useCallback((msg) => {
    if (msg.type !== 'interaction' && msg.type !== 'render-error') return;
    const ev = msg.type === 'render-error' ? 'render-error' : msg.event;
    setLog((l) => [{ id: Math.random(), ev, detail: msg.detail || msg.message, ts: new Date() }, ...l].slice(0, 60));
    if (list.some((i) => i.event === ev)) actions.markInteractionSeen(f.id, ev);
  }, [list]);
  const seen = new Set(log.map((l) => l.ev));
  const seenAt = state.qa.seen?.[f.id] || {};
  const covered = list.filter((i) => i.event && (seen.has(i.event) || seenAt[i.event])).length;
  return html`<div class="wb-grid" style="grid-template-columns:minmax(0,1fr) 420px;align-items:start">
    <div class="wb-col" style="gap:14px">
      <div class="wb-row"><${Badge} tone=${covered === list.length && list.length ? 'success' : 'warning'}>${covered}/${list.length} Interaktionen in der Vorschau ausgelöst<//><span class="wb-grow"></span>
        <${Btn} size="sm" icon="plus" disabled=${f.locked} onClick=${() => save([...list, { id: uid('i'), trigger: '', result: '', event: '' }], 'Interaktion hinzugefügt')}>Interaktion<//></div>
      <${Card}>${!list.length ? html`<${Empty} icon="zap" title="Keine Interaktionen" text="Beschreibe Auslöser und erwartetes Ergebnis. Mit Event-Namen verknüpft, wird die Abdeckung beim Bedienen der Vorschau automatisch erkannt." />`
        : html`<table class="wb-table"><thead><tr><th>Auslöser</th><th>Erwartetes Ergebnis</th><th>Event</th><th title="Navigation im Demo-Launcher">führt zu</th><th title="In Vorschau ausgelöst">✓</th><th></th></tr></thead><tbody>
          ${list.map((i) => html`<tr><td><${TextInput} size="sm" class="wb-input--ghost" value=${i.trigger} disabled=${f.locked} placeholder="z. B. Tippen auf Termin" onCommit=${(v) => upd(i.id, { trigger: v })} /></td>
            <td><${TextInput} size="sm" class="wb-input--ghost" value=${i.result} disabled=${f.locked} placeholder="Ergebnis" onCommit=${(v) => upd(i.id, { result: v })} /></td>
            <td style="width:170px"><${TextInput} size="sm" class="wb-mono" value=${i.event} disabled=${f.locked} list="wb-events" placeholder="event.name" onCommit=${(v) => upd(i.id, { event: v })} /></td>
            <td style="width:170px"><${Select} size="sm" value=${i.to || ''} disabled=${f.locked} onChange=${(v) => upd(i.id, { to: v })} aria-label="Navigationsziel"
              options=${[{ value: '', label: '–' }, ...state.features.filter((x) => !x.archived && x.id !== f.id).sort((a, b) => (a.moduleId === f.moduleId ? -1 : 0) - (b.moduleId === f.moduleId ? -1 : 0)).map((x) => ({ value: x.id, label: `${x.moduleId === f.moduleId ? '' : `${state.modules.find((m) => m.id === x.moduleId)?.name} › `}${x.name}` }))]} /></td>
            <td style="width:34px">${i.event && (seen.has(i.event) || seenAt[i.event]) ? html`<span style="color:var(--wb-success)" title=${seenAt[i.event] ? `zuletzt ${fmt.dateTime(seenAt[i.event])}` : ''}><${Icon} name="check-circle-2" size=${16} /></span>` : html`<span class="wb-subtle">–</span>`}</td>
            <td style="width:36px"><${IconBtn} icon="trash-2" label="Entfernen" disabled=${f.locked} onClick=${() => save(list.filter((x) => x.id !== i.id), 'Interaktion entfernt')} /></td></tr>`)}</tbody></table>`}
        <datalist id="wb-events">${known.map((e) => html`<option value=${e} />`)}</datalist><//>
      <div class="wb-small wb-subtle">Verfügbare Events der verwendeten Komponenten: <span class="wb-mono">${known.join(', ') || '—'}</span></div>
    </div>
    <div class="wb-col" style="gap:10px;position:sticky;top:0">
      <div class="wb-row"><strong class="wb-grow">Live-Vorschau</strong><${Select} size="sm" style="width:auto" value=${device} onChange=${setDevice} options=${[{ value: 'mobile', label: 'Smartphone' }, { value: 'tablet', label: 'Tablet' }, { value: 'desktop', label: 'Desktop' }]} /></div>
      ${payload ? html`<div class="wb-canvas" style="border-radius:12px;padding:12px 6px;border:1px solid var(--wb-border)"><${PreviewFrame} payload=${payload} device=${device} maxHeight=${520} onInteraction=${onInteraction} /></div>` : html`<${Card}><${Empty} title="Keine Variante" /><//>`}
      <${Card} title="Interaktions-Log" actions=${log.length > 0 && html`<${Btn} size="sm" variant="ghost" onClick=${() => setLog([])}>Leeren<//>`}>
        <div style="max-height:220px;overflow:auto;margin:-8px -16px -16px">${!log.length ? html`<div class="wb-small wb-subtle" style="padding:10px 16px">Bediene die Vorschau – Ereignisse erscheinen hier.</div>`
          : log.map((l) => html`<div class="wb-log__row"><span class="wb-num wb-subtle">${l.ts.toLocaleTimeString('de-DE')}</span><span class="wb-mono" style=${list.some((i) => i.event === l.ev) ? 'color:var(--wb-success)' : ''}>${l.ev}</span>
            <span class="wb-grow wb-trunc wb-subtle wb-small">${l.detail ? JSON.stringify(l.detail) : ''}</span>
            ${!list.some((i) => i.event === l.ev) && !f.locked && html`<${Btn} size="sm" variant="ghost" onClick=${() => save([...list, { id: uid('i'), trigger: '', result: '', event: l.ev }], `Interaktion ${l.ev} übernommen`)}>übernehmen<//>`}</div>`)}</div><//>
    </div>
  </div>`;
}

// ------------------------------------------------------------- Demo-Daten ---
export function DataTab({ state, feature: f }) {
  const keys = Object.keys(f.demoData || {});
  const [key, setKey] = useState(keys[0] || null);
  const [text, setText] = useState(key ? JSON.stringify(f.demoData[key], null, 2) : '');
  const [err, setErr] = useState('');
  const open = (k) => { setKey(k); setText(JSON.stringify(f.demoData[k], null, 2)); setErr(''); };
  const usedBy = (k) => f.variants.flatMap((v) => v.blocks.filter((b) => Object.values(b.bind || {}).includes(k)).map((b) => `${v.id}:${b.id}`));
  const save = () => { try { const v = JSON.parse(text); act(() => actions.setDemoData(f.id, key, v)); setErr(''); toast(`„${key}“ gespeichert – Vorschauen aktualisiert`); } catch (e) { setErr(`Ungültiges JSON: ${e.message}`); } };
  const addKey = async () => { const k = await promptDialog({ title: 'Neuer Datensatz', label: 'Schlüssel (z. B. events, tasks)', placeholder: 'items' }); if (k) { act(() => actions.setDemoData(f.id, k, [])); setKey(k); setText('[]'); } };
  const describe = (v) => (Array.isArray(v) ? `${v.length} Einträge` : v && typeof v === 'object' ? `Objekt · ${Object.keys(v).length} Felder` : typeof v);
  return html`<div class="wb-grid" style="grid-template-columns:280px minmax(0,1fr);align-items:start">
    <${Card} title="Datensätze" actions=${html`<${Btn} size="sm" icon="plus" disabled=${f.locked} onClick=${addKey}>Neu<//>`}>
      <div class="wb-col" style="gap:0;margin:-8px -16px -16px">${!keys.length && html`<div class="wb-small wb-subtle" style="padding:12px 16px">Keine Demo-Daten.</div>`}
        ${keys.map((k) => html`<div class=${`wb-listrow is-click ${k === key ? 'is-active' : ''}`} onClick=${() => open(k)}><${Icon} name="file-json" size=${15} /><div class="wb-grow"><div class="wb-mono">${k}</div>
          <div class="wb-xs wb-subtle">${describe(f.demoData[k])} · ${usedBy(k).length ? `gebunden: ${usedBy(k).join(', ')}` : 'ungebunden'}</div></div></div>`)}</div><//>
    ${key ? html`<${Card} title=${html`Datensatz <span class="wb-mono">${key}</span>`} actions=${html`<div class="wb-row">
        <${Btn} size="sm" icon="trash-2" variant="ghost" disabled=${f.locked} onClick=${async () => { if (await confirmDialog({ title: `„${key}“ entfernen?`, text: 'Blöcke, die diesen Schlüssel binden, zeigen danach den Leerzustand.', danger: true, confirmLabel: 'Entfernen' })) { act(() => actions.deleteDemoData(f.id, key)); setKey(null); } }}>Entfernen<//>
        <${Btn} size="sm" variant="primary" icon="save" disabled=${f.locked} onClick=${save}>Speichern<//></div>`}>
      <textarea class="wb-textarea wb-mono" style="min-height:420px" spellcheck="false" value=${text} aria-invalid=${err ? 'true' : undefined} disabled=${f.locked}
        onInput=${(e) => { setText(e.currentTarget.value); try { JSON.parse(e.currentTarget.value); setErr(''); } catch (x) { setErr(x.message); } }}
        onKeyDown=${(e) => { if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); save(); } }}></textarea>
      <div class="wb-row" style="margin-top:8px">${err ? html`<span class="wb-field__error">${err}</span>` : html`<span class="wb-small wb-subtle">Gültiges JSON · Strg+S speichert · Datumswerte relativ zum Referenztag 24.11.2026 09:30</span>`}</div><//>`
    : html`<${Card}><${Empty} icon="file-json" title="Datensatz wählen" text="Demo-Daten gehören zum Feature und werden von Blöcken per Schlüssel gebunden." /><//>`}
  </div>`;
}

// --------------------------------------------------------- Entscheidungen ---
export function DecisionsTab({ state, feature: f }) {
  const list = state.decisions.filter((d) => d.featureId === f.id);
  return html`<div class="wb-col" style="gap:14px">
    <div class="wb-row"><p class="wb-muted wb-grow">Warum wurde eine Variante gewählt? Welche Nachteile wurden bewusst akzeptiert? Entscheidungen werden bei der Freigabe mit der Version verknüpft.</p>
      <${Btn} icon="timer" onClick=${() => newRoundDialog(state, `module:${f.moduleId}`)}>Runde fürs Modul<//>
      <${Btn} variant="primary" icon="plus" onClick=${() => decisionDialog({ featureId: f.id, moduleId: f.moduleId })}>Entscheidung<//></div>
    ${!list.length ? html`<${Card}><${Empty} icon="gavel" title="Noch keine Entscheidungen" text="Tipp: Im Tab „Vergleich“ eine Variante bevorzugen – die Begründung wird automatisch als Entscheidung dokumentiert." /><//>`
    : list.map((d) => html`<${Card} title=${d.title} actions=${html`<div class="wb-row"><${Badge} tone=${decisionTone(d.status)}>${decisionStatusLabel(d.status)}<//>
        <${IconBtn} icon="pencil" label="Bearbeiten" onClick=${() => decisionDialog({ existing: d })} /><${IconBtn} icon="trash-2" label="Löschen" onClick=${async () => { if (await confirmDialog({ title: 'Entscheidung löschen?', text: d.title, danger: true, confirmLabel: 'Löschen' })) act(() => actions.deleteDecision(d.id)); }} /></div>`}>
      <div class="wb-grid wb-grid-2" style="gap:12px 20px">
        ${[['Entscheidung', d.decision], ['Begründung', d.rationale], ['Akzeptierte Nachteile', d.tradeoffs], ['Alternativen', d.alternatives]].filter(([, v]) => v).map(([l, v]) => html`<div><div class="wb-label" style="margin-bottom:4px">${l}</div><div style="white-space:pre-wrap">${v}</div></div>`)}</div>
      <div class="wb-small wb-subtle" style="margin-top:10px">Angelegt ${fmt.dateTime(d.createdAt)}${d.decidedAt ? ` · entschieden ${fmt.dateTime(d.decidedAt)}` : ''}</div><//>`)}
  </div>`;
}

// --------------------------------------------------------------- Historie ---
function snapshotPreviewDialog(state, f, v) {
  const snapF = { ...f, ...v.snapshot };
  const st = { ...state, features: state.features.map((x) => (x.id === f.id ? snapF : x)) };
  const payload = buildFeaturePayload(st, f.id, v.snapshot.selectedVariantId, { theme: state.settings.previewTheme });
  openDialog({ title: `${f.name} – v${v.version} (${{ draft: 'Entwurf', review: 'Prüfversion', release: 'Freigabe' }[v.kind]})`, size: 'xl',
    body: () => html`<div class="wb-grid" style="grid-template-columns:minmax(0,1fr) 300px;align-items:start"><div class="wb-canvas" style="border-radius:12px;padding:14px"><div class="wb-row" style="gap:20px;align-items:flex-start;justify-content:center">
      <div style="flex:2;min-width:0"><${PreviewFrame} payload=${payload} device="desktop" maxHeight=${460} /></div><div style="flex:1;min-width:0"><${PreviewFrame} payload=${payload} device="mobile" maxHeight=${460} /></div></div></div>
      <div class="wb-col"><div class="wb-label">Snapshot</div><div class="wb-small">Variante ${v.snapshot.selectedVariantId} · ${v.snapshot.variants.length} Varianten · ${v.snapshot.requirements.length} Anforderungen · ${v.snapshot.interactions.length} Interaktionen</div>
      ${v.qa && html`<div class="wb-label" style="margin-top:10px">QA bei Freigabe</div><div class="wb-row wb-wrap" style="gap:4px">${v.qa.results.map((r) => html`<span title=${`${r.viewport} ${r.theme}`}><${QaCell} status=${r.status} /></span>`)}</div>`}
      ${v.note && html`<div class="wb-label" style="margin-top:10px">Notiz</div><div class="wb-small">${v.note}</div>`}</div></div>` });
}

export function HistoryTab({ state, feature: f }) {
  const versions = state.versions.filter((v) => v.featureId === f.id);
  const events = state.history.filter((h) => h.featureId === f.id).slice(0, 80);
  const current = snapshotOf(f);
  const showDiff = (v) => { const d = diffSnapshots(v.snapshot, current); openDialog({ title: `Unterschiede v${v.version} → aktueller Stand v${f.version}`, body: () => (d.length ? html`<div class="wb-col" style="gap:0">${d.map((x) => html`<div class="wb-check-item"><${Badge} sq>${x.area}<//><span>${x.text}</span></div>`)}</div>` : html`<${Empty} icon="check" title="Keine Unterschiede" />`) }); };
  return html`<div class="wb-grid" style="grid-template-columns:minmax(0,1.2fr) minmax(0,1fr);align-items:start">
    <${Card} title="Versionen" icon="git-branch" sub=${`Arbeitsstand: v${f.version}${f.locked ? ' (gesperrt)' : ''}`} actions=${!f.locked && html`<${Btn} size="sm" icon="save" onClick=${async () => { const note = await promptDialog({ title: `Version v${f.version} sichern`, label: 'Notiz (optional)', placeholder: 'Was hat sich geändert?' }); if (note !== null) { act(() => actions.saveVersion(f.id, note)); toast('Version gesichert'); } }}>Version sichern<//>`}>
      ${!versions.length ? html`<${Empty} icon="git-commit-horizontal" title="Noch keine Versionen" text="„Version sichern“ friert den aktuellen Stand ein. Die Freigabe erzeugt eine Hauptversion (v1.0)." />`
      : html`<div class="wb-col" style="gap:0;margin:-8px -16px -16px">${versions.map((v) => html`<div class="wb-listrow" data-version=${v.version}>
        <span style=${`width:30px;height:30px;border-radius:9px;display:grid;place-items:center;flex:none;background:var(--wb-${v.kind === 'release' ? 'success' : v.kind === 'review' ? 'warning' : 'panel-3'}${v.kind === 'draft' ? '' : '-soft'});color:${v.kind === 'release' ? 'var(--wb-success)' : v.kind === 'review' ? 'var(--wb-warning)' : 'var(--wb-muted)'}`}>
          <${Icon} name=${v.kind === 'release' ? 'badge-check' : v.kind === 'review' ? 'eye' : 'git-commit-horizontal'} size=${15} /></span>
        <div class="wb-grow"><div class="wb-row" style="gap:8px"><strong class="wb-num">v${v.version}</strong><span class="wb-small wb-muted">${{ draft: 'Entwurf', review: 'Prüfversion', release: 'Freigabe' }[v.kind]}</span>${f.releasedVersionId === v.id && html`<${Badge} tone="success" sq>aktuell freigegeben<//>`}</div>
          <div class="wb-small wb-subtle wb-trunc">${fmt.dateTime(v.createdAt)}${v.note ? ` · ${v.note}` : ''}</div></div>
        <${Btn} size="sm" variant="ghost" icon="eye" onClick=${() => snapshotPreviewDialog(state, f, v)}>Ansehen<//>
        <${Btn} size="sm" variant="ghost" icon="git-compare" onClick=${() => showDiff(v)}>Diff<//>
        <${Btn} size="sm" variant="ghost" icon="rotate-ccw" disabled=${f.locked} title=${f.locked ? 'Erst neue Arbeitsversion anlegen' : 'Diesen Stand wiederherstellen'} onClick=${async () => { if (await confirmDialog({ title: `v${v.version} wiederherstellen?`, text: 'Der aktuelle Arbeitsstand wird durch den Snapshot ersetzt (Rückgängig mit Strg+Z). Tipp: vorher „Version sichern“.', confirmLabel: 'Wiederherstellen' })) { act(() => actions.restoreVersion(v.id)); toast(`v${v.version} wiederhergestellt`); } }}>Zurück<//></div>`)}</div>`}<//>
    <${Card} title="Änderungsprotokoll" icon="history">
      ${!events.length ? html`<div class="wb-small wb-subtle">Noch keine Änderungen protokolliert.</div>` : html`<div class="wb-col" style="gap:0;margin:-6px 0">${events.map((h) => html`<div class="wb-row" style="padding:6px 0;border-bottom:1px solid var(--wb-border);gap:10px">
        <span class="wb-xs wb-subtle wb-num" style="width:104px;flex:none">${fmt.dateTime(h.ts)}</span><span class="wb-small wb-grow">${h.summary}</span></div>`)}</div>`}<//>
  </div>`;
}
