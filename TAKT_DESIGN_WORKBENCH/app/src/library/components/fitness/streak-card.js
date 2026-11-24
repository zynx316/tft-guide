// Fitness: Wochenserie mit Joker – zählt Wochen mit erreichtem Wochenziel statt einzelner Tage; Aussetzer bestrafen nichts.
import { html } from '../../../lib/html.js';
import { Card, Badge, Button, Icon, Progress, EmptyState } from '../../ui.js';
import { FIT_CSS, Toggle } from './_ui.js';

export const streakCard = {
  id: 'streak-card',
  name: 'Serie & Wochenziel',
  category: 'Fitness',
  description: 'Wochenserie (Wochen mit erreichtem Wochenziel) mit Pausenjoker und Urlaubs-/Krank-Modus, dazu das Wochenziel dieser Woche. Wohlwollende Sprache: eine unterbrochene Serie ist ein Neustart, der Verlauf bleibt.',
  version: '1.0',
  props: [
    { name: 'layout', label: 'Darstellung', type: 'select', options: ['card', 'compact'], default: 'card' },
    { name: 'title', label: 'Titel', type: 'text', default: 'Deine Serie' },
  ],
  data: [{ slot: 'streak', label: 'Serie', default: 'streak', shape: '{weeks,best,jokersLeft,jokersPerQuarter,paused,history:[{week,label,state}],current:{sessions,goal}}', required: true }],
  events: ['joker.use', 'streak.pause', 'goal.open'],
  states: ['empty'],
  css: `
  .tk-sk { display:flex; flex-direction:column; gap:var(--tk-space-4); } .tk-sk__top { display:flex; align-items:center; gap:var(--tk-space-4); } .tk-sk__flame { width:56px; height:56px; border-radius:18px; display:grid; place-items:center; background:var(--tk-c-warning-soft); color:var(--tk-c-warning); flex:none; }
  .tk-sk__pips { display:grid; grid-template-columns:repeat(12, minmax(0,1fr)); gap:5px; } .tk-sk__pips span { height:10px; border-radius:3px; background:var(--tk-c-success); } .tk-sk__pips span[data-s="joker"] { background:repeating-linear-gradient(135deg, var(--tk-c-success) 0 3px, var(--tk-c-surface3) 3px 6px); } .tk-sk__pips span[data-s="open"] { background:var(--tk-c-surface3); outline:1.5px solid var(--tk-c-accent); outline-offset:0; }
  .tk-sk__week { display:flex; gap:8px; } .tk-sk__week i { flex:1; height:12px; border-radius:6px; background:var(--tk-c-surface3); display:block; } .tk-sk__week i[data-on="true"] { background:var(--tk-c-accent); }
  .tk-sk--compact { flex-direction:row; align-items:center; gap:var(--tk-space-3); } .bp-mobile .tk-sk .tk-btn { min-height:44px; }`,
  example: { data: { streak: { weeks: 12, best: 12, jokersLeft: 1, jokersPerQuarter: 2, paused: false, history: Array.from({ length: 12 }, (_, i) => ({ week: `w${i}`, label: `KW ${36 + i}`, state: i === 10 ? 'joker' : 'done' })), current: { sessions: 1, goal: 3 } } } },
  render: function StreakCard({ props, data, setData, ctx }) {
    const s = data.streak;
    if (!s || !s.history) return html`<${Card} title=${props.title}><${EmptyState} icon="flame" title="Noch keine Serie" text="Erreiche dein Wochenziel – die erste Woche startet die Serie." /><//>`;
    const cur = s.current || { sessions: 0, goal: 3 }; const reached = cur.sessions >= cur.goal; const broken = s.weeks === 0 && s.best > 0;
    const useJoker = () => { setData('streak', (x) => ({ ...x, jokersLeft: Math.max(0, x.jokersLeft - 1), current: { ...x.current, joker: true } })); ctx.emit('joker.use', {}); ctx.toast('Joker eingesetzt – deine Serie bleibt bestehen'); };
    const pause = (on) => { setData('streak', (x) => ({ ...x, paused: on })); ctx.emit('streak.pause', { paused: on }); };
    const week = html`<div class="tk-col" style="gap:6px"><div class="tk-row" style="justify-content:space-between;font-size:var(--tk-fs-sm)"><span class="tk-muted">Diese Woche</span><span class="tk-num" style="font-weight:600">${cur.sessions} von ${cur.goal} Einheiten${cur.joker ? ' · Joker' : ''}</span></div><div class="tk-sk__week" role="img" aria-label=${`${cur.sessions} von ${cur.goal} Einheiten`}>${Array.from({ length: cur.goal }, (_, i) => html`<i data-on=${String(i < cur.sessions)}></i>`)}</div></div>`;
    if (props.layout === 'compact') return html`<${Card}><div class="tk-sk tk-sk--compact"><span class="tk-sk__flame" style="width:44px;height:44px"><${Icon} name="flame" size=${22} /></span><div class="tk-grow"><div style="font-weight:700;font-size:var(--tk-fs-lg)">${s.weeks} Wochen in Folge</div><div class="tk-muted" style="font-size:var(--tk-fs-sm)">${cur.sessions} von ${cur.goal} Einheiten diese Woche</div></div><${Progress} value=${cur.sessions / cur.goal} /></div><//>`;
    return html`<${Card} title=${props.title} icon="flame" actions=${s.paused && html`<${Badge} tone="info" icon="pause">Serie pausiert<//>`}><div class="tk-sk" data-qa="streak-card">
      <div class="tk-sk__top"><span class="tk-sk__flame"><${Icon} name="flame" size=${28} /></span><div class="tk-grow"><div class="tk-fit-big">${s.weeks}<small class="tk-muted" style="font-size:var(--tk-fs-lg);font-weight:500"> Wochen</small></div>
        <div class="tk-muted" style="font-size:var(--tk-fs-sm)">${broken ? `Neustart – deine ${s.best} Wochen bleiben im Verlauf.` : `in Folge mit erreichtem Wochenziel · Bestwert ${s.best}`}</div></div></div>
      <div class="tk-sk__pips" role="img" aria-label=${`Verlauf der letzten ${s.history.length} Wochen`}>${s.history.map((h) => html`<span data-s=${h.state} title=${`${h.label}: ${h.state === 'joker' ? 'Joker' : 'erreicht'}`}></span>`)}</div>${week}
      <div class="tk-row" style="gap:10px;flex-wrap:wrap;justify-content:space-between"><span class="tk-muted" style="font-size:var(--tk-fs-sm)"><${Icon} name="shield" size=${14} /> Joker: ${s.jokersLeft} von ${s.jokersPerQuarter} im Quartal frei</span>
        <${Button} size="sm" disabled=${s.jokersLeft < 1 || reached || cur.joker} onClick=${useJoker}>Joker einsetzen<//></div>
      <${Toggle} checked=${!!s.paused} label="Urlaub oder krank – Serie einfrieren" onChange=${pause} /></div><//>`;
  },
};
export default [streakCard];
