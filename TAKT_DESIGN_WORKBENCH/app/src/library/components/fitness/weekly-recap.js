// Fitness: Wochenrückblick in drei Zeilen – geschafft, gelernt, Vorschlag für nächste Woche (Karte oder geführte Schritte).
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Card, Badge, Button, Icon, EmptyState } from '../../ui.js';
import { FIT_CSS } from './_ui.js';

const STEPS = [{ id: 'done', label: 'Geschafft', icon: 'check-circle-2', tone: 'success' }, { id: 'learned', label: 'Gelernt', icon: 'lightbulb', tone: 'warning' }, { id: 'next', label: 'Nächste Woche', icon: 'arrow-right', tone: 'accent' }];

export const weeklyRecap = {
  id: 'weekly-recap',
  name: 'Wochenrückblick',
  category: 'Fitness',
  description: 'Rückblick auf die letzte Woche in drei Zeilen (geschafft, gelernt, Vorschlag). Als Karte oder als geführter Assistent in drei Schritten. Wohlwollend und konkret, ohne Vorwürfe.',
  version: '1.1',
  props: [
    { name: 'style', label: 'Darstellung', type: 'select', options: ['card', 'steps'], default: 'card' },
    { name: 'title', label: 'Titel', type: 'text', default: 'Wochenrückblick' },
  ],
  data: [{ slot: 'recap', label: 'Rückblick', default: 'recap', shape: '{week,range,done:string[],learned,next}', required: true }],
  events: ['recap.open', 'recap.apply', 'recap.step'],
  states: ['empty'],
  css: `
  .tk-rc { display:flex; flex-direction:column; gap:var(--tk-space-4); } .tk-rc__sec { display:flex; gap:var(--tk-space-3); align-items:flex-start; } .tk-rc__ico { width:36px; height:36px; border-radius:12px; display:grid; place-items:center; flex:none; }
  .tk-rc__list { margin:6px 0 0; padding:0; list-style:none; display:flex; flex-direction:column; gap:6px; } .tk-rc__list li { display:flex; gap:8px; align-items:flex-start; } .tk-rc__dots { display:flex; gap:6px; } .tk-rc__dots i { width:24px; height:6px; border-radius:3px; background:var(--tk-c-surface3); display:block; } .tk-rc__dots i[data-on="true"] { background:var(--tk-c-accent); }
  .tk-rc__big { font-size:var(--tk-fs-xl); line-height:1.3; font-weight:var(--tk-fw-semibold); letter-spacing:var(--tk-ls-tight); }`,
  example: { data: { recap: { week: 'KW 47', range: '16.–22.11.', done: ['3 von 3 Einheiten – Wochenziel erreicht', '24,8 t Volumen', '2 Läufe, 15,5 km'], learned: 'Bankdrücken: 60 kg × 10 bei allen Sätzen – die Obergrenze ist erreicht.', next: 'Bankdrücken auf 62,5 kg erhöhen und bei 8 Wiederholungen beginnen.' } } },
  render: function WeeklyRecap({ props, data, ctx }) {
    const r = data.recap; const [i, setI] = useState(0); const [applied, setApplied] = useState(false);
    if (!r || !r.done || (!r.done.length && !r.learned && !r.next)) return html`<${Card} title=${props.title}><${EmptyState} icon="calendar-check" title="Noch kein Rückblick" text="Am Sonntagabend fasst TAKT die Woche in drei Zeilen zusammen." /><//>`;
    const apply = () => { setApplied(true); ctx.emit('recap.apply', { week: r.week }); ctx.toast('Vorschlag für die nächste Woche übernommen'); };
    const sec = (s) => html`<div class="tk-rc__sec"><span class="tk-rc__ico" style=${`background:var(--tk-c-${s.tone}-soft);color:var(--tk-c-${s.tone})`}><${Icon} name=${s.icon} size=${18} /></span><div class="tk-grow"><div class="tk-label">${s.label}</div>
      ${s.id === 'done' ? html`<ul class="tk-rc__list">${r.done.map((d) => html`<li><${Icon} name="check" size=${16} /><span>${d}</span></li>`)}</ul>` : html`<p style="margin-top:6px">${r[s.id]}</p>`}</div></div>`;
    const head = html`<${Badge}>${r.week} · ${r.range}<//>`;
    if (props.style === 'steps') { const s = STEPS[i]; return html`<${Card} title=${props.title} actions=${head}><div class="tk-rc" data-qa="weekly-recap"><div class="tk-rc__dots" aria-hidden="true">${STEPS.map((_, k) => html`<i data-on=${String(k <= i)}></i>`)}</div>
      <div class="tk-rc__sec"><span class="tk-rc__ico" style=${`background:var(--tk-c-${s.tone}-soft);color:var(--tk-c-${s.tone})`}><${Icon} name=${s.icon} size=${18} /></span><div class="tk-grow"><div class="tk-label">${i + 1} von 3 · ${s.label}</div>
        ${s.id === 'done' ? html`<ul class="tk-rc__list" style="margin-top:10px">${r.done.map((d) => html`<li class="tk-rc__big"><span>${d}</span></li>`)}</ul>` : html`<p class="tk-rc__big" style="margin-top:10px">${r[s.id]}</p>`}</div></div>
      <div class="tk-row" style="justify-content:space-between;gap:8px"><${Button} icon="arrow-left" disabled=${i === 0} onClick=${() => setI(i - 1)}>Zurück<//>${i < 2 ? html`<${Button} variant="primary" iconRight="arrow-right" onClick=${() => { setI(i + 1); ctx.emit('recap.step', { step: i + 1 }); }}>Weiter<//>` : html`<${Button} variant="primary" icon="check" disabled=${applied} onClick=${apply}>${applied ? 'Übernommen' : 'Übernehmen'}<//>`}</div></div><//>`; }
    return html`<${Card} title=${props.title} icon="calendar-check" actions=${head}><div class="tk-rc" data-qa="weekly-recap">${STEPS.map(sec)}<${Button} variant="primary" icon="check" disabled=${applied} onClick=${apply}>${applied ? 'Vorschlag übernommen' : 'Vorschlag übernehmen'}<//></div><//>`;
  },
};
export default [weeklyRecap];
