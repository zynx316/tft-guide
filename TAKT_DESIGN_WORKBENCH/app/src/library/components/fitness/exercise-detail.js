// Fitness: Übungs-Detail – Anleitung, Muskeln, häufige Fehler, persönlicher Verlauf und Alternativen.
import { html } from '../../../lib/html.js';
import { Card, Button, Badge, Icon, EmptyState } from '../../ui.js';
import { exerciseSeries, fmtKg, numAuto, dateShort, dayShort, num } from './_calc.js';
import { MuscleDot, FIT_CSS } from './_ui.js';
import { LineChart, CHART_CSS } from './_charts.js';

export const exerciseDetail = {
  id: 'exercise-detail',
  name: 'Übungs-Detail',
  category: 'Fitness',
  description: 'Eine Übung im Detail (ctx.ui.selectedId): Ausführung in Schritten, Muskeln, häufige Fehler, Atmung, Verlauf der geschätzten 1RM aus dem Training und Alternativen. Favorit und „Zum Plan“.',
  version: '1.2',
  props: [
    { name: 'showChart', label: 'Verlauf zeigen', type: 'boolean', default: true },
    { name: 'showAlternatives', label: 'Alternativen zeigen', type: 'boolean', default: true },
  ],
  data: [
    { slot: 'items', label: 'Übungen', default: 'library', shape: '{id,name,muscle,secondary,equipment,type,level,unit,intro,steps,mistakes,breath,alternatives,favorite}[]', required: true },
    { slot: 'history', label: 'Verlauf', default: 'history', shape: 'Einheiten[]' },
  ],
  events: ['exercise.favorite', 'exercise.add-plan', 'exercise.alt', 'exercise.open', 'chart.point'],
  states: ['empty'],
  css: `${CHART_CSS}
  .tk-exd { display:flex; flex-direction:column; gap:var(--tk-space-5); } .tk-exd__top { display:flex; align-items:flex-start; gap:var(--tk-space-3); }
  .tk-exd__cols { display:grid; gap:var(--tk-space-5); grid-template-columns:minmax(0,1fr); } .tk-exd__cols--2 { grid-template-columns:minmax(0,1.1fr) minmax(0,1fr); } /* nach Blockbreite, nicht nach Viewport (Seitenspalte bei 1024–1280 px lief über) */
  .tk-exd__steps { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:10px; counter-reset:s; } .tk-exd__steps li { display:flex; gap:12px; counter-increment:s; line-height:var(--tk-lh-snug); }
  .tk-exd__steps li::before { content:counter(s); width:26px; height:26px; border-radius:50%; background:var(--tk-c-accent-soft); color:var(--tk-c-accent); font-weight:var(--tk-fw-semibold); font-size:var(--tk-fs-sm); display:grid; place-items:center; flex:none; margin-top:-1px; }
  .tk-exd__facts { display:grid; grid-template-columns:repeat(3, minmax(0,1fr)); gap:var(--tk-space-3); } .tk-exd h4 { margin:0 0 8px; font-size:var(--tk-fs-md); font-weight:var(--tk-fw-semibold); }
  .tk-exd__list { margin:0; padding-left:18px; color:var(--tk-c-text-muted); display:flex; flex-direction:column; gap:4px; font-size:var(--tk-fs-sm); }
  .tk-exd__star { border:0; background:none; width:44px; height:44px; color:var(--tk-c-text-subtle); cursor:pointer; display:grid; place-items:center; border-radius:50%; flex:none; } .tk-exd__star[aria-pressed="true"] { color:var(--tk-c-warning); } .tk-exd__star[aria-pressed="true"] svg { fill:currentColor; }
  .tk-exd__alt { display:flex; align-items:center; gap:10px; min-height:48px; width:100%; padding:6px 12px; border-radius:var(--tk-radius-md); border:1px solid var(--tk-c-border); background:var(--tk-c-surface2); color:inherit; cursor:pointer; text-align:left; } .tk-exd__alt:hover { border-color:var(--tk-c-accent); }
  [data-tk-large-text] .tk-exd__facts { grid-template-columns:minmax(0,1fr); }
  [data-tk-large-text] .tk-exd__alt { flex-wrap:wrap; row-gap:4px; } [data-tk-large-text] .tk-exd__alt > .tk-grow { flex:1 1 12ch; } [data-tk-large-text] .tk-exd__alt > .tk-grow.tk-truncate { overflow-wrap:break-word; }`,
  example: { data: { items: [{ id: 'bankdruecken', name: 'Bankdrücken', muscle: 'Brust', secondary: ['Trizeps', 'Schulter'], equipment: 'Langhantel', type: 'Verbund', level: 'Mittel', unit: 'kg', favorite: true,
    intro: 'Die Grundübung für Brust, vordere Schulter und Trizeps.', steps: ['Flach auf die Bank legen, Schulterblätter zusammenziehen.', 'Stange aus dem Rack heben und kontrolliert zur Brust senken.', 'Ohne Schwung nach oben drücken.'], mistakes: ['Gesäß hebt von der Bank ab', 'Ellbogen zu weit seitlich'], breath: 'Beim Absenken einatmen, beim Drücken ausatmen.', alternatives: ['kurzhantel-bankdruecken'] },
    { id: 'kurzhantel-bankdruecken', name: 'Kurzhantel-Bankdrücken', muscle: 'Brust', secondary: [], equipment: 'Kurzhantel', type: 'Verbund', level: 'Anfänger', unit: 'kg', steps: [], mistakes: [], alternatives: [] }], history: [] } },
  render: function ExerciseDetail({ props, data, setData, ctx }) {
    const items = data.items || [];
    const e = items.find((x) => x.id === ctx.ui.selectedId) || items.find((x) => x.favorite) || items[0];
    if (!e) return html`<${Card}><${EmptyState} icon="dumbbell" title="Keine Übung gewählt" text="Wähle in der Übungsliste eine Übung aus." /><//>`;
    const series = exerciseSeries(data.history || [], e.id); const kg = e.unit === 'kg';
    const key = kg ? 'e1rm' : 'reps'; const pts = series.filter((s) => s[key] != null);
    const best = pts.length ? pts.reduce((a, b) => (b[key] > a[key] ? b : a)) : null; const last = series.at(-1);
    const unitTxt = (v) => (kg ? fmtKg(v) : e.unit === 's' ? `${v} s` : `${v} Wdh.`);
    const fav = () => { setData('items', (a) => a.map((x) => (x.id === e.id ? { ...x, favorite: !x.favorite } : x))); ctx.emit('exercise.favorite', { id: e.id, favorite: !e.favorite }); };
    const alts = (e.alternatives || []).map((id) => items.find((x) => x.id === id)).filter(Boolean);
    return html`<${Card} key=${e.id}><div class="tk-exd" data-qa="exercise-detail">
      <div class="tk-exd__top"><div class="tk-grow"><h2 class="tk-h2">${e.name}</h2><div class="tk-fit-chips" style="margin-top:8px"><${Badge} tone="accent">${e.muscle}<//><${Badge}>${e.equipment}<//><${Badge}>${e.type}<//><${Badge}>${e.level}<//></div></div>
        <button type="button" class="tk-exd__star" aria-pressed=${String(!!e.favorite)} aria-label=${e.favorite ? 'Aus Favoriten entfernen' : 'Als Favorit markieren'} onClick=${fav}><${Icon} name="star" size=${22} /></button></div>
      ${e.intro && html`<p class="tk-muted">${e.intro}</p>`}
      <div class="tk-exd__facts"><div class="tk-fit-stat"><span>${kg ? 'Bestwert (1RM)' : 'Bestwert'}</span><strong>${best ? unitTxt(best[key]).replace(' kg', '') : '–'}<small>${best && kg ? ' kg' : ''}</small></strong></div>
        <div class="tk-fit-stat"><span>Letztes Mal</span><strong style="font-size:var(--tk-fs-lg)">${last ? (kg ? `${numAuto(last.kg)} × ${last.reps}` : unitTxt(last.reps)) : '–'}</strong><small>${last ? dayShort(last.date) : 'noch nicht trainiert'}</small></div>
        <div class="tk-fit-stat"><span>Einheiten</span><strong>${series.length}<small> in 8 Wo.</small></strong></div></div>
      <div class=${`tk-exd__cols${ctx.bp === 'desktop' && (ctx.blockWidth || ctx.width || 0) >= 560 ? ' tk-exd__cols--2' : ''}`}><div class="tk-col" style="gap:var(--tk-space-4)">
        <div><h4>Ausführung</h4>${(e.steps || []).length ? html`<ol class="tk-exd__steps">${e.steps.map((s) => html`<li><span>${s}</span></li>`)}</ol>` : html`<span class="tk-muted">Noch keine Anleitung hinterlegt.</span>`}</div>
        ${(e.mistakes || []).length > 0 && html`<div><h4>Häufige Fehler</h4><ul class="tk-exd__list">${e.mistakes.map((m) => html`<li>${m}</li>`)}</ul></div>`}
        ${e.breath && html`<div class="tk-row" style="gap:8px;align-items:flex-start"><span class="tk-subtle"><${Icon} name="wind" size=${16} /></span><span class="tk-muted" style="font-size:var(--tk-fs-sm)">${e.breath}</span></div>`}</div>
      <div class="tk-col" style="gap:var(--tk-space-4)">
        <div><h4>Beteiligte Muskeln</h4><div class="tk-fit-chips"><${MuscleDot} muscle=${e.muscle} />${(e.secondary || []).map((m) => html`<span class="tk-subtle" style="font-size:var(--tk-fs-sm)">· ${m} (indirekt)</span>`)}</div></div>
        ${props.showChart && html`<div><h4>${kg ? 'Verlauf (geschätzte 1RM)' : 'Verlauf'}</h4>${pts.length > 1 ? html`<${LineChart} height=${150} label=${`Verlauf ${e.name}`} labels=${pts.map((p) => dateShort(p.date))} lines=${[{ values: pts.map((p) => p[key]), dots: true, tone: 'accent' }]} fmt=${(v) => num(v, 0)}
          tip=${(i) => html`<span><strong>${dayShort(pts[i].date)}</strong> · ${kg ? `${fmtKg(pts[i].kg)} × ${pts[i].reps} → 1RM ≈ ${fmtKg(pts[i].e1rm)}` : unitTxt(pts[i].reps)}</span>`} onPoint=${(i) => ctx.emit('chart.point', { date: pts[i].date })} />` : html`<span class="tk-muted" style="font-size:var(--tk-fs-sm)">Sobald du die Übung ein paar Mal gemacht hast, erscheint hier dein Verlauf.</span>`}</div>`}
        ${props.showAlternatives && alts.length > 0 && html`<div><h4>Alternativen</h4><div class="tk-col" style="gap:6px">${alts.map((a) => html`<button type="button" class="tk-exd__alt" onClick=${() => { ctx.setUi('selectedId', a.id); ctx.emit('exercise.alt', { id: a.id }); }}><span class="tk-grow tk-truncate" style="font-weight:600">${a.name}</span><${Badge}>${a.equipment}<//><${Icon} name="chevron-right" size=${16} /></button>`)}</div></div>`}
        <${Button} icon="plus" onClick=${() => { ctx.emit('exercise.add-plan', { id: e.id }); ctx.toast(`${e.name} zum Plan hinzugefügt (Demo)`); }}>Zum Plan hinzufügen<//>
      </div></div></div><//>`;
  },
};
export default [exerciseDetail];
