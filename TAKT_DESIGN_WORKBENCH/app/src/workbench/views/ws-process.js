// ============================================================================
// Prozess-Bausteine im Feature-Arbeitsbereich: Gates (DoR/DoD), Design-Tiefe,
// Akzeptanzkriterien, Anmerkungen (Pins) und Scorecard für den Variantenvergleich.
// ============================================================================
import { html } from '../../lib/html.js';
import { useState } from 'preact/hooks';
import { Icon } from '../../lib/icons.js';
import { Card, Btn, IconBtn, Badge, Select, TextInput, Empty, QaCell } from '../ui/kit.js';
import { act } from './common.js';
import { actions } from '../store.js';
import { featureReady, featureDone, gateSummary, tierOf, TIERS, SCORE_CRITERIA, weightedScore } from '../../core/process.js';
import { GateList } from './app-level.js';
import { fmt, uid, cx } from '../../lib/util.js';

export function GatesCard({ state, feature: f }) {
  const [open, setOpen] = useState(null);
  const ready = featureReady(state, f), done = featureDone(state, f);
  const gr = gateSummary(ready), gd = gateSummary(done);
  return html`<${Card} title="Gates" icon="clipboard-check" sub="Bereit zum Gestalten (DoR) · Fertig zur Freigabe (DoD)">
    <div class="wb-col" style="gap:8px">
      <div class="wb-row"><span class="wb-grow">Design-Tiefe</span>
        <${Select} size="sm" style="width:auto" value=${String(f.tier || '')} onChange=${(v) => act(() => actions.setTier(f.id, v || null))} data-qa="tier-select"
          options=${[{ value: '', label: `Automatisch (Tier ${tierOf(f)})` }, ...TIERS.map((t) => ({ value: String(t.id), label: t.label }))]} aria-label="Design-Tiefe" /></div>
      <div class="wb-small wb-muted">${TIERS.find((t) => t.id === tierOf(f))?.hint}</div>
      <button type="button" class="wb-listrow is-click" style="border:1px solid var(--wb-border);border-radius:8px" onClick=${() => setOpen(open === 'r' ? null : 'r')} aria-expanded=${String(open === 'r')}>
        <span class="wb-grow" style="text-align:left">Bereit (Definition of Ready)</span><${Badge} tone=${gr.ok ? 'success' : 'warning'} sq>${gr.passed}/${gr.total}<//><${Icon} name=${open === 'r' ? 'chevron-up' : 'chevron-down'} size=${14} /></button>
      ${open === 'r' && html`<${GateList} checks=${ready} />`}
      <button type="button" class="wb-listrow is-click" style="border:1px solid var(--wb-border);border-radius:8px" onClick=${() => setOpen(open === 'd' ? null : 'd')} aria-expanded=${String(open === 'd')}>
        <span class="wb-grow" style="text-align:left">Fertig (Definition of Done)</span><${Badge} tone=${gd.ok ? 'success' : null} sq>${gd.passed}/${gd.total}<//><${Icon} name=${open === 'd' ? 'chevron-up' : 'chevron-down'} size=${14} /></button>
      ${open === 'd' && html`<${GateList} checks=${done} />`}
    </div><//>`;
}

export function AcceptanceCard({ feature: f }) {
  const list = f.acceptance || [];
  const [draft, setDraft] = useState('');
  const save = (next) => act(() => actions.setAcceptance(f.id, next));
  const add = () => { const t = draft.trim(); if (!t) return; save([...list, { id: uid('ac'), text: t }]); setDraft(''); };
  return html`<${Card} title=${`Akzeptanzkriterien (${list.length})`} icon="check-check" sub="Prüfbar formuliert: „Gegeben … wenn … dann …“ – werden in Flutter zu Widget-Tests.">
    ${!list.length && html`<div class="wb-small wb-subtle" style="margin-bottom:8px">Noch keine. Mindestens ein Kriterium ist Teil der Definition of Ready.</div>`}
    <div class="wb-col" style="gap:4px">${list.map((a, i) => html`<div class="wb-row" data-acceptance=${a.id}><span class="wb-badge wb-badge--sq">AK${i + 1}</span>
      <${TextInput} size="sm" class="wb-input--ghost wb-grow" value=${a.text} disabled=${f.locked} onCommit=${(v) => save(list.map((x) => (x.id === a.id ? { ...x, text: v } : x)))} aria-label=${`Akzeptanzkriterium ${i + 1}`} />
      <${IconBtn} icon="trash-2" label="Entfernen" disabled=${f.locked} onClick=${() => save(list.filter((x) => x.id !== a.id))} /></div>`)}</div>
    ${!f.locked && html`<div class="wb-row" style="margin-top:8px"><input class="wb-input wb-input--sm wb-grow" placeholder="Gegeben … wenn … dann … (Enter)" value=${draft} onInput=${(e) => setDraft(e.currentTarget.value)} onKeyDown=${(e) => e.key === 'Enter' && add()} data-qa="acceptance-input" />
      <${Btn} size="sm" icon="plus" onClick=${add}>Hinzufügen<//></div>`}<//>`;
}

const PIN_KINDS = [{ value: 'mangel', label: 'Mangel' }, { value: 'idee', label: 'Idee' }, { value: 'frage', label: 'Frage' }, { value: 'änderung', label: 'Änderung' }];

export function PinsCard({ state, feature: f }) {
  const pins = (state.pins || []).filter((p) => p.featureId === f.id);
  const [show, setShow] = useState('offen');
  const [draft, setDraft] = useState({ text: '', kind: 'mangel', severity: 'soll', variantId: f.selectedVariantId || '' });
  const list = pins.filter((p) => show === 'alle' || p.status === show);
  const add = () => { if (!draft.text.trim()) return; act(() => actions.addPin({ featureId: f.id, ...draft, text: draft.text.trim(), variantId: draft.variantId || null })); setDraft({ ...draft, text: '' }); };
  return html`<${Card} title=${`Anmerkungen (${pins.filter((p) => p.status === 'offen').length} offen)`} icon="flag" sub="Mängel, Ideen, Fragen – auch an freigegebenen Features (Beobachtung). Muss-Anmerkungen blockieren die Freigabe."
    actions=${html`<${Select} size="sm" style="width:auto" value=${show} onChange=${setShow} options=${[{ value: 'offen', label: 'Offen' }, { value: 'erledigt', label: 'Erledigt' }, { value: 'alle', label: 'Alle' }]} aria-label="Filter Anmerkungen" />`}>
    ${!list.length && html`<div class="wb-small wb-subtle">Keine ${show === 'alle' ? '' : show + 'en '}Anmerkungen.</div>`}
    <div class="wb-col" style="gap:0;margin:0 -16px">${list.map((p) => html`<div class="wb-listrow" data-pin=${p.id}>
      <input type="checkbox" checked=${p.status === 'erledigt'} onChange=${(e) => actions.updatePin(p.id, { status: e.currentTarget.checked ? 'erledigt' : 'offen' })} aria-label="Erledigt" style="accent-color:var(--wb-accent)" />
      <${Badge} tone=${p.severity === 'muss' ? 'danger' : null} sq>${p.severity}<//><${Badge} outline sq>${p.kind}<//>
      <span class=${cx('wb-grow', p.status === 'erledigt' && 'wb-muted')} style=${p.status === 'erledigt' ? 'text-decoration:line-through' : ''}>${p.text}${p.variantId ? html` <span class="wb-subtle wb-small">(Variante ${p.variantId})</span>` : ''}</span>
      <span class="wb-xs wb-subtle">${p.doneIn ? `erledigt in ${p.doneIn}` : fmt.relative(p.createdAt)}</span>
      <${IconBtn} icon="trash-2" label="Löschen" onClick=${() => actions.deletePin(p.id)} /></div>`)}</div>
    <div class="wb-row wb-wrap" style="gap:6px;margin-top:10px">
      <${Select} size="sm" style="width:auto" value=${draft.kind} onChange=${(v) => setDraft({ ...draft, kind: v })} options=${PIN_KINDS} aria-label="Art" />
      <${Select} size="sm" style="width:auto" value=${draft.severity} onChange=${(v) => setDraft({ ...draft, severity: v })} options=${[{ value: 'muss', label: 'Muss' }, { value: 'soll', label: 'Soll' }, { value: 'kann', label: 'Kann' }]} aria-label="Gewicht" />
      ${f.variants.length > 1 && html`<${Select} size="sm" style="width:auto" value=${draft.variantId} onChange=${(v) => setDraft({ ...draft, variantId: v })} options=${[{ value: '', label: 'alle Varianten' }, ...f.variants.map((v) => ({ value: v.id, label: `Variante ${v.id}` }))]} aria-label="Variante" />`}
      <input class="wb-input wb-input--sm wb-grow" style="min-width:180px" placeholder="Anmerkung … (Enter)" value=${draft.text} onInput=${(e) => setDraft({ ...draft, text: e.currentTarget.value })} onKeyDown=${(e) => e.key === 'Enter' && add()} data-qa="pin-input" />
      <${Btn} size="sm" icon="plus" onClick=${add}>Notieren<//></div><//>`;
}

/** Scorecard: manuelle 1–5-Bewertung je Kriterium (gewichtet nach Leitbild) + automatische Kennzahlen. */
export function Scorecard({ state, feature: f, variants, stats }) {
  const scores = state.scores?.[f.id] || {};
  const totals = Object.fromEntries(variants.map((v) => [v.id, weightedScore(state, f.id, v.id)]));
  const best = variants.reduce((b, v) => (totals[v.id] != null && (b == null || totals[v.id] > totals[b]) ? v.id : b), null);
  const qa = state.qa.latest[f.id];
  const w = state.app?.weights || {};
  return html`<${Card} title="Scorecard" icon="scale" sub=${html`Bewerten statt Bauchgefühl · Gewichte aus dem <a href="#/app/leitbild">Leitbild</a> · 5 = sehr gut`}>
    <div style="overflow-x:auto"><table class="wb-table" data-qa="scorecard"><thead><tr><th>Kriterium</th><th class="wb-num">Gewicht</th>${variants.map((v) => html`<th>${v.id} – ${v.name}</th>`)}</tr></thead><tbody>
      ${SCORE_CRITERIA.map((c) => html`<tr><td title=${c.hint}>${c.label}<div class="wb-xs wb-subtle">${c.hint}</div></td><td class="wb-num">${w[c.id] ?? 1}</td>
        ${variants.map((v) => html`<td><div class="wb-score" role="radiogroup" aria-label=${`${c.label} ${v.id}`}>${[1, 2, 3, 4, 5].map((n) => html`<button type="button" role="radio" aria-checked=${String(scores[v.id]?.[c.id] === n)} class=${cx(scores[v.id]?.[c.id] === n && 'is-on')}
          onClick=${() => actions.setScore(f.id, v.id, c.id, scores[v.id]?.[c.id] === n ? null : n)}>${n}</button>`)}</div></td>`)}</tr>`)}
      <tr><td class="wb-muted">Automatisch: Blöcke / Komponenten</td><td></td>${variants.map((v) => html`<td class="wb-num wb-small">${stats[v.id].blocks} / ${stats[v.id].comps.length}</td>`)}</tr>
      <tr><td class="wb-muted">Automatisch: QA (letzter Lauf)</td><td></td>${variants.map((v) => { const rs = (qa?.results || []).filter((r) => r.variantId === v.id); const st = !rs.length ? null : rs.some((r) => r.status === 'fail') ? 'fail' : rs.some((r) => r.status === 'warn') ? 'warn' : 'pass';
        return html`<td>${st ? html`<span class="wb-row" style="gap:6px"><${QaCell} status=${st} /><span class="wb-xs wb-subtle">${rs.length} Prüfungen</span></span>` : html`<span class="wb-subtle wb-small">nicht geprüft</span>`}</td>`; })}</tr>
      <tr><td><strong>Gewichteter Score</strong></td><td></td>${variants.map((v) => html`<td><strong class="wb-num" style="font-size:16px">${totals[v.id] ?? '–'}</strong>${best === v.id && variants.length > 1 && html` <${Badge} tone="accent" icon="sparkles" sq>vorn<//>`}</td>`)}</tr>
    </tbody></table></div>
    ${!Object.keys(scores).length && html`<${Empty} icon="scale" title="Noch nicht bewertet" text="Tipp: erst alle Varianten im Launcher bedienen, dann je Kriterium 1–5 vergeben. Bei Gleichstand entscheidet die Empfehlung oder die Richtung der App." />`}<//>`;
}
