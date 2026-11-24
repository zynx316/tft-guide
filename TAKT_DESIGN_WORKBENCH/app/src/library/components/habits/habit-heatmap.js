// Gewohnheiten: Kalender-Heatmap – Wochenraster (viele Wochen) oder Monatskalender mit Tagesdetail. Lesbar ohne Farbe (Muster, Symbole, Zahlen).
import { html } from '../../../lib/html.js';
import { Card, Button, EmptyState, Icon, Segmented, toneColor, Badge } from '../../ui.js';
import {
  list, todayKey, shift, weekStart, wdOf, parseKey, WD, MONTHS, dayLabel, dayStatus, streakOf, isDone, countOn, target, setCount, isDue, isPaused,
  rateOf, HABIT_CSS,
} from './_habits.js';

const STATE_TEXT = { done: 'erledigt', partial: 'teilweise', missed: 'verpasst', joker: 'Gnadentag', pause: 'Pause', rest: 'nicht geplant', open: 'offen', future: 'kommt noch', none: 'vor Beginn' };
const sampleLog = (() => { const o = {}; for (let i = 1; i <= 80; i++) { const d = new Date(2026, 10, 24 - i); if ((i * 7 + (i % 5)) % 9 > 1) o[`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`] = 1; } return o; })();

export const habitHeatmap = {
  id: 'habit-heatmap',
  name: 'Gewohnheits-Heatmap',
  category: 'Gewohnheiten',
  description: 'Kalender-Heatmap einer Gewohnheit (oder aller): Wochenraster der letzten Wochen oder Monatskalender mit Tagesdetail und Nachtragen. Ohne Farbe lesbar: voll = erledigt, gestreift = teilweise, Punkt = verpasst, J = Gnadentag.',
  version: '1.0',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Verlauf' },
    { name: 'mode', label: 'Ansicht', type: 'select', options: ['weeks', 'month'], default: 'weeks' },
    { name: 'scope', label: 'Umfang', type: 'select', options: ['selected', 'all'], default: 'selected' },
    { name: 'weeks', label: 'Wochen (0 = je nach Breite)', type: 'number', default: 0 },
    { name: 'allowSwitch', label: 'Ansicht umschaltbar', type: 'boolean', default: true },
  ],
  data: [{ slot: 'habits', label: 'Gewohnheiten', default: 'habits', shape: 'siehe habit-list', required: true }],
  events: ['heatmap.day', 'habit.toggle', 'heatmap.mode'],
  states: ['empty'],
  css: `${HABIT_CSS}
  .tk-hm { padding:0 16px 14px; } .tk-hm__head { display:flex; align-items:center; gap:10px; flex-wrap:wrap; padding:14px 16px 10px; } .tk-hm__head .tk-card__title { flex:1; min-width:120px; }
  .tk-hm__weeks { display:grid; grid-template-columns:22px 1fr; gap:6px; } .tk-hm__dl { display:grid; grid-template-rows:repeat(7, 1fr); gap:3px; padding-top:18px; font-size:10px; color:var(--tk-c-text-subtle); }
  .tk-hm__dl span { display:flex; align-items:center; } .tk-hm__cols { display:grid; grid-template-columns:repeat(var(--n), minmax(0, 1fr)); gap:3px; }
  .tk-hm__col { display:grid; grid-template-rows:14px repeat(7, 1fr); gap:3px; min-width:0; } .tk-hm__ml { font-size:10px; color:var(--tk-c-text-subtle); height:14px; white-space:nowrap; overflow:visible; }
  .tk-hm__c { aspect-ratio:1; max-height:26px; border-radius:5px; border:1px solid var(--tk-c-border); display:grid; place-items:center; font-size:10px; font-weight:var(--tk-fw-semibold); color:var(--tk-c-text-subtle); min-width:0; }
  .tk-hm__c[data-s="done"] { background:var(--hc); border-color:var(--hc); } .tk-hm__c[data-s="partial"] { background:repeating-linear-gradient(135deg, color-mix(in srgb, var(--hc) 55%, transparent) 0 3px, transparent 3px 6px); border-color:var(--hc); }
  .tk-hm__c[data-s="missed"]::after { content:''; width:4px; height:4px; border-radius:50%; background:var(--tk-c-text-subtle); opacity:.7; } .tk-hm__c[data-s="joker"] { border:1.5px dashed var(--tk-c-accent2); color:var(--tk-c-text-muted); }
  .tk-hm__c[data-s="rest"], .tk-hm__c[data-s="none"], .tk-hm__c[data-s="future"] { border-color:transparent; background:color-mix(in srgb, var(--tk-c-text-subtle) 8%, transparent); } .tk-hm__c[data-s="pause"] { border-style:dotted; }
  .tk-hm__c[data-today="true"] { outline:2px solid var(--tk-c-accent); outline-offset:1px; } .tk-hm__c[data-l="1"] { background:color-mix(in srgb, var(--hc) 28%, transparent); } .tk-hm__c[data-l="2"] { background:color-mix(in srgb, var(--hc) 55%, transparent); } .tk-hm__c[data-l="3"] { background:color-mix(in srgb, var(--hc) 80%, transparent); } .tk-hm__c[data-l="4"] { background:var(--hc); }
  .tk-hm__sum { margin-top:12px; font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); display:flex; gap:8px 16px; flex-wrap:wrap; align-items:center; } .tk-hm__legend { display:flex; gap:12px; flex-wrap:wrap; font-size:var(--tk-fs-xs); color:var(--tk-c-text-subtle); margin-top:8px; } .tk-hm__legend span { display:inline-flex; align-items:center; gap:5px; } .tk-hm__legend .tk-hm__c { width:14px; height:14px; border-radius:4px; max-height:none; aspect-ratio:auto; }
  .tk-hm__mnav { display:flex; align-items:center; gap:4px; } .tk-hm__mt { min-width:112px; text-align:center; font-weight:var(--tk-fw-semibold); font-size:var(--tk-fs-sm); }
  .tk-hm__mgrid { display:grid; grid-template-columns:repeat(7, minmax(0, 1fr)); gap:4px; } .tk-hm__mh { text-align:center; font-size:var(--tk-fs-xs); color:var(--tk-c-text-subtle); font-weight:var(--tk-fw-semibold); padding-bottom:2px; }
  .tk-hm__d { aspect-ratio:auto; min-height:44px; max-height:none; max-width:none; flex-direction:column; gap:1px; cursor:pointer; font:inherit; background:none; color:var(--tk-c-text); border-radius:10px; padding:2px; } .tk-hm__d .tk-hm__c { width:100%; }
  .tk-hm__d b { font-size:var(--tk-fs-sm); font-weight:var(--tk-fw-semibold); } .tk-hm__d[data-s="done"], .tk-hm__d[data-s="partial"] { color:var(--tk-c-text); }
  .tk-hm__d[data-s="done"] { background:color-mix(in srgb, var(--hc) 24%, transparent); border-color:var(--hc); } .tk-hm__d[data-s="partial"] { background:repeating-linear-gradient(135deg, color-mix(in srgb, var(--hc) 22%, transparent) 0 4px, transparent 4px 8px); border-color:var(--hc); }
  .tk-hm__d[data-s="future"], .tk-hm__d[data-s="none"] { opacity:.45; cursor:default; } .tk-hm__d[data-sel="true"] { box-shadow:0 0 0 2px var(--tk-c-accent); } .tk-hm__d small { font-size:10px; line-height:1; color:var(--tk-c-text-muted); }
  .tk-hm__det { margin-top:12px; padding:12px 14px; border-radius:var(--tk-radius-md); background:var(--tk-c-surface2); border:1px solid var(--tk-c-border); display:flex; align-items:center; gap:12px; flex-wrap:wrap; } .tk-hm__det > div { flex:1; min-width:140px; }
  .bp-mobile .tk-hm { padding:0 12px 12px; } .bp-mobile .tk-hm__head { padding:12px 12px 8px; } .bp-mobile .tk-hm__d { min-height:46px; }`,
  example: { data: { habits: [{ id: 'a', name: 'Vitamin D', icon: 'pill', tone: 4, daypart: 'morgens', rhythm: { type: 'daily' }, since: '2026-08-10', log: sampleLog }] } },
  render: function HabitHeatmap({ props, data, setData, ctx }) {
    const all = list(data.habits), today = todayKey(ctx);
    const mode = ctx.ui[`hm-${ctx.block?.id}`] || props.mode;
    const setMode = (m) => { ctx.setUi(`hm-${ctx.block?.id}`, m); ctx.emit('heatmap.mode', { mode: m }); };
    const sel = props.scope === 'all' ? null : (all.find((h) => h.id === ctx.ui.selectedId) || all[0]);
    const head = (extra) => html`<div class="tk-hm__head"><h3 class="tk-card__title">${props.title}${sel ? ` · ${sel.name}` : ''}</h3>${extra}
      ${props.allowSwitch && html`<${Segmented} label="Heatmap-Ansicht" value=${mode} onChange=${setMode} options=${[{ value: 'weeks', label: 'Wochen' }, { value: 'month', label: 'Monat' }]} />`}</div>`;
    if (!all.length) return html`<${Card} flush>${head(null)}<${EmptyState} icon="calendar-days" title="Noch kein Verlauf" text="Sobald du Gewohnheiten abhakst, entsteht hier dein Kalender." /><//>`;
    const hc = sel ? toneColor(sel.tone || 1) : 'var(--tk-c-success)';
    const jokers = sel ? streakOf(sel, today).jokers : null;
    // Tageszelle: Status (einzeln) oder Stufe 0–4 (alle)
    const cell = (k) => {
      if (sel) return { s: dayStatus(sel, k, today, jokers), l: null, text: `${dayLabel(k)}: ${STATE_TEXT[dayStatus(sel, k, today, jokers)]}${sel.goal && countOn(sel, k) ? ` (${countOn(sel, k)}/${target(sel)} ${sel.goal.unit})` : ''}` };
      if (k > today) return { s: 'future', l: null, text: `${dayLabel(k)}: kommt noch` };
      const due = all.filter((h) => (!h.since || k >= h.since) && isDue(h, k)); const dn = due.filter((h) => isDone(h, k)).length;
      const l = !due.length ? null : dn === 0 ? 0 : Math.max(1, Math.ceil((dn / due.length) * 4));
      return { s: l == null ? 'rest' : 'lvl', l, r: due.length ? dn / due.length : 0, text: `${dayLabel(k)}: ${due.length ? `${dn} von ${due.length} erledigt` : 'nichts fällig'}` };
    };
    const legend = sel ? html`<div class="tk-hm__legend" aria-label="Legende"><span><i class="tk-hm__c" data-s="done"></i>erledigt</span><span><i class="tk-hm__c" data-s="partial"></i>teilweise</span><span><i class="tk-hm__c" data-s="missed"></i>verpasst</span><span><i class="tk-hm__c" data-s="joker">J</i>Gnadentag</span><span><i class="tk-hm__c" data-s="rest"></i>nicht geplant</span></div>`
      : html`<div class="tk-hm__legend"><span>weniger</span>${[0, 1, 2, 3, 4].map((l) => html`<span><i class="tk-hm__c" data-s="lvl" data-l=${l}></i></span>`)}<span>mehr erledigt</span></div>`;

    if (mode === 'month') {
      const [y, m] = (ctx.ui.hmMonth || today.slice(0, 7)).split('-').map(Number);
      const first = `${y}-${String(m).padStart(2, '0')}-01`, dim = new Date(y, m, 0).getDate();
      const goM = (d) => { const nd = new Date(y, m - 1 + d, 1); ctx.setUi('hmMonth', `${nd.getFullYear()}-${String(nd.getMonth() + 1).padStart(2, '0')}`); };
      const days = Array.from({ length: dim }, (_, i) => shift(first, i)); const selDay = ctx.ui.hmDay && days.includes(ctx.ui.hmDay) ? ctx.ui.hmDay : null;
      const c = selDay ? cell(selDay) : null;
      const toggle = () => { if (!sel) return; const was = isDone(sel, selDay); setCount(setData, sel.id, selDay, was ? 0 : target(sel)); ctx.emit('habit.toggle', { id: sel.id, date: selDay, done: !was }); };
      return html`<${Card} flush>${head(html`<div class="tk-hm__mnav"><${Button} size="sm" variant="ghost" icon="chevron-left" aria-label="Vorheriger Monat" onClick=${() => goM(-1)} /><span class="tk-hm__mt">${MONTHS[m - 1]} ${y}</span><${Button} size="sm" variant="ghost" icon="chevron-right" aria-label="Nächster Monat" onClick=${() => goM(1)} /></div>`)}
        <div class="tk-hm" style=${`--hc:${hc}`}><div class="tk-hm__mgrid">${WD.map((d) => html`<div class="tk-hm__mh">${d}</div>`)}
          ${Array.from({ length: wdOf(first) }, () => html`<div></div>`)}
          ${days.map((k) => { const cc = cell(k); const day = parseKey(k).getDate();
            return html`<button type="button" class="tk-hm__c tk-hm__d" data-s=${cc.s} data-l=${cc.l ?? undefined} data-today=${k === today} data-sel=${k === selDay} aria-label=${cc.text} aria-pressed=${k === selDay} disabled=${k > today}
              onClick=${() => { ctx.setUi('hmDay', k); ctx.emit('heatmap.day', { date: k }); }}><b>${day}</b><small aria-hidden="true">${cc.s === 'done' ? '✓' : cc.s === 'partial' ? '½' : cc.s === 'missed' ? '·' : cc.s === 'joker' ? 'J' : cc.s === 'lvl' ? `${cc.l}` : ''}</small></button>`; })}</div>
          ${c ? html`<div class="tk-hm__det"><div><strong>${dayLabel(selDay)}</strong><div class="tk-muted" style="font-size:var(--tk-fs-sm)">${c.text.split(': ')[1]}</div></div>
            ${sel && !isPaused(sel, selDay) && html`<${Button} size="sm" icon=${isDone(sel, selDay) ? 'rotate-ccw' : 'check'} onClick=${toggle}>${isDone(sel, selDay) ? 'Rückgängig' : 'Nachtragen'}<//>`}</div>` : html`<p class="tk-hm__sum">Tippe einen Tag für Details.</p>`}
          ${legend}</div><//>`;
    }
    const n = props.weeks > 0 ? props.weeks : ctx.bp === 'mobile' ? 13 : ctx.bp === 'tablet' ? 20 : 26;
    const ws0 = shift(weekStart(today), -7 * (n - 1));
    const cols = Array.from({ length: n }, (_, w) => shift(ws0, w * 7));
    let done = 0, due = 0, sumR = 0;
    cols.forEach((s) => { for (let i = 0; i < 7; i++) { const k = shift(s, i); if (k > today) continue; const cc = cell(k); if (sel) { if (['done', 'partial', 'missed', 'joker'].includes(cc.s)) { due++; if (cc.s === 'done') done++; } } else if (cc.s === 'lvl') { due++; sumR += cc.r; } } });
    const monthOf = (s) => (parseKey(s).getDate() <= 7 ? MONTHS[parseKey(s).getMonth()].slice(0, 3) : '');
    return html`<${Card} flush>${head(null)}<div class="tk-hm" style=${`--hc:${hc}`}><div class="tk-hm__weeks"><div class="tk-hm__dl" aria-hidden="true">${['Mo', '', 'Mi', '', 'Fr', '', 'So'].map((d) => html`<span>${d}</span>`)}</div>
      <div class="tk-hm__cols" style=${`--n:${n}`} role="img" aria-label=${`Kalender der letzten ${n} Wochen: ${done} von ${due} Tagen erledigt`}>${cols.map((s) => html`<div class="tk-hm__col"><div class="tk-hm__ml">${monthOf(s)}</div>
        ${Array.from({ length: 7 }, (_, i) => { const k = shift(s, i); const cc = cell(k); return html`<div class="tk-hm__c" data-s=${cc.s} data-l=${cc.l ?? undefined} data-today=${k === today} title=${cc.text}>${cc.s === 'joker' ? 'J' : ''}</div>`; })}</div>`)}</div></div>
      <div class="tk-hm__sum">${sel ? html`<span><strong>${done}</strong> von ${due} Tagen${due ? ` (${Math.round((done / due) * 100)} %)` : ''} in ${n} Wochen</span>` : html`<span>Im Schnitt <strong>${due ? Math.round((sumR / due) * 100) : 0} %</strong> der fälligen Gewohnheiten pro Tag · ${n} Wochen</span>`}${sel && html`<${Badge} tone="success">${Math.round(rateOf(sel, today, 30) * 100)} % in 30 Tagen<//>`}</div>${legend}</div><//>`;
  },
};
export default habitHeatmap;
