// Gewohnheiten: Tagesliste zum Abhaken – Zeilen (dicht), Karten (Ringe) oder „Als Nächstes“ (eine Aktion).
import { html } from '../../../lib/html.js';
import { Card, Button, Check, EmptyState, Icon, Badge, toneColor } from '../../ui.js';
import { useState } from 'preact/hooks';
import {
  list, todayKey, isDue, isDone, countOn, target, setCount, streakOf, weekDots, rhythmLabel, goalLabel, progressOf, DAYPARTS, hourOf,
  Ring, Streak, Bar, HABIT_CSS, calm, tapLabel,
} from './_habits.js';

const EXAMPLE = (() => {
  const log = (n, k) => Object.fromEntries(Array.from({ length: n }, (_, i) => [`2026-11-${String(23 - i).padStart(2, '0')}`, k]));
  return [
    { id: 'a', name: 'Wasser trinken', icon: 'droplet', tone: 3, daypart: 'morgens', rhythm: { type: 'daily' }, goal: { target: 8, unit: 'Gläser', step: 1 }, since: '2026-09-01', log: { ...log(6, 8), '2026-11-24': 3 } },
    { id: 'b', name: 'Dehnen', icon: 'activity', tone: 2, daypart: 'morgens', time: '07:30', rhythm: { type: 'daily' }, since: '2026-09-01', log: log(3, 1) },
    { id: 'c', name: 'Lesen', icon: 'book-open', tone: 5, daypart: 'abends', rhythm: { type: 'daily' }, goal: { target: 20, unit: 'Min.', step: 5 }, since: '2026-09-01', log: log(2, 20) },
  ];
})();

export const habitList = {
  id: 'habit-list',
  name: 'Gewohnheitsliste',
  category: 'Gewohnheiten',
  description: 'Gewohnheiten des Tages zum Abhaken oder Hochzählen, mit Serie, Wochenpunkten und ruhigem Fortschritt. Stile: Zeilen (dicht), Karten (Ringe) und „Als Nächstes“ (eine klare Aktion).',
  version: '1.0',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Gewohnheiten heute' },
    { name: 'style', label: 'Stil', type: 'select', options: ['rows', 'cards', 'next'], default: 'rows' },
    { name: 'groupBy', label: 'Gruppieren', type: 'select', options: ['daypart', 'none'], default: 'daypart' },
    { name: 'showWeek', label: 'Wochenpunkte', type: 'boolean', default: true },
    { name: 'showStreak', label: 'Serie zeigen', type: 'boolean', default: true },
    { name: 'limit', label: 'Max. Einträge (0 = alle)', type: 'number', default: 0 },
    { name: 'allLabel', label: 'Link „Alle“ (leer = aus)', type: 'text', default: 'Alle Gewohnheiten' },
  ],
  data: [{ slot: 'habits', label: 'Gewohnheiten', default: 'habits', shape: '{id,name,icon,tone,daypart,rhythm,goal?,log,since,time?}[]', required: true }],
  events: ['habit.toggle', 'habit.step', 'habit.open', 'habit.all', 'habit.snooze', 'habit.create.open'],
  states: ['empty'],
  css: `${HABIT_CSS}
  .tk-hl__head { display:flex; align-items:center; gap:12px; padding:14px 16px 12px; border-bottom:1px solid var(--tk-c-border); }
  .tk-hl__head > div { flex:1; min-width:0; } .tk-hl__sum { font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); margin-top:2px; }
  .tk-hl__group { display:flex; align-items:center; gap:6px; padding:9px 16px 6px; font-size:var(--tk-fs-xs); font-weight:var(--tk-fw-semibold); letter-spacing:var(--tk-ls-wide); text-transform:uppercase; color:var(--tk-c-text-subtle); background:var(--tk-c-surface2); border-bottom:1px solid var(--tk-c-border); }
  .tk-hl__row { display:flex; align-items:center; gap:12px; padding:8px 16px; min-height:60px; border-bottom:1px solid var(--tk-c-border); min-width:0; }
  .tk-hl__row:last-child { border-bottom:0; } .tk-hl__ic { width:34px; height:34px; border-radius:10px; display:grid; place-items:center; flex:none; background:color-mix(in srgb, var(--hc) 15%, transparent); color:var(--hc); }
  .tk-hl__main { flex:1; min-width:0; text-align:left; background:none; border:0; padding:0; color:inherit; font:inherit; cursor:pointer; display:block; }
  .tk-hl__name { font-weight:var(--tk-fw-medium); } .tk-hl__row[data-done="true"] .tk-hl__name { color:var(--tk-c-text-muted); text-decoration:line-through; text-decoration-color:var(--tk-c-text-subtle); }
  .tk-hl__sub { font-size:var(--tk-fs-sm); color:var(--tk-c-text-subtle); display:flex; gap:2px 10px; align-items:center; flex-wrap:wrap; min-width:0; } .tk-hl__sub > span { display:inline-flex; align-items:center; gap:4px; min-width:0; }
  .tk-hl__qty { display:flex; align-items:center; gap:6px; } .tk-hl__qty .tk-btn--icon { width:36px; height:36px; } .bp-mobile .tk-hl__qty .tk-btn--icon { width:40px; height:40px; }
  .tk-hl__cnt { min-width:44px; text-align:center; font-weight:var(--tk-fw-semibold); font-variant-numeric:tabular-nums; font-size:var(--tk-fs-sm); }
  .tk-hl__foot { display:flex; justify-content:space-between; align-items:center; gap:8px; padding:8px 12px 8px 16px; border-top:1px solid var(--tk-c-border); color:var(--tk-c-text-subtle); font-size:var(--tk-fs-sm); }
  .tk-hl__cards { display:grid; grid-template-columns:repeat(auto-fit, minmax(150px, 1fr)); gap:var(--tk-space-3); padding:var(--tk-space-3); }
  .tk-hl__card { display:flex; flex-direction:column; align-items:center; gap:8px; padding:16px 12px 12px; border-radius:var(--tk-radius-lg); border:1px solid var(--tk-c-border); background:var(--tk-c-surface2); text-align:center; min-width:0; }
  .tk-hl__card[data-done="true"] { border-color:color-mix(in srgb, var(--tk-c-success) 45%, var(--tk-c-border)); }
  .tk-hl__ringbtn { border:0; background:none; padding:0; cursor:pointer; border-radius:50%; color:var(--hc); min-width:44px; min-height:44px; display:grid; place-items:center; }
  .tk-hl__card .tk-hl__name { font-size:var(--tk-fs-md); width:100%; } .tk-hl__card .tk-hl__sub { justify-content:center; }
  .tk-hl__hero { display:flex; flex-direction:column; gap:14px; padding:20px 18px; background:linear-gradient(135deg, color-mix(in srgb, var(--hc) 14%, transparent), transparent 75%); border-bottom:1px solid var(--tk-c-border); }
  .tk-hl__hero .tk-hl__ic { width:52px; height:52px; border-radius:16px; } .tk-hl__eyebrow { font-size:var(--tk-fs-xs); font-weight:var(--tk-fw-semibold); letter-spacing:var(--tk-ls-wide); text-transform:uppercase; color:var(--tk-c-accent); }
  .tk-hl__hero h3 { font-size:var(--tk-fs-xl); letter-spacing:var(--tk-ls-tight); margin:2px 0 0; } .tk-hl__acts { display:flex; gap:8px; flex-wrap:wrap; }
  .tk-hl__chips { display:flex; gap:8px; flex-wrap:wrap; padding:12px 16px 14px; } .tk-hl__chip { display:inline-flex; align-items:center; gap:6px; min-height:36px; padding:0 12px; border-radius:var(--tk-radius-pill); border:1px solid var(--tk-c-border); background:var(--tk-c-surface); color:var(--tk-c-text); font:inherit; font-size:var(--tk-fs-sm); cursor:pointer; }
  .tk-hl__chip[data-done="true"] { color:var(--tk-c-text-muted); border-style:dashed; } .tk-hl__chip:hover { border-color:var(--tk-c-border-strong); }
  .bp-mobile .tk-hl__name.tk-truncate { white-space:normal; line-height:1.25; } .bp-mobile .tk-hl__row { min-height:64px; padding:8px 12px; gap:10px; } .bp-mobile .tk-hl__week { display:none; } .bp-mobile .tk-hl__chip { min-height:40px; }`,
  example: { data: { habits: EXAMPLE } },
  render: function HabitList({ props, data, setData, ctx }) {
    const all = list(data.habits), today = todayKey(ctx);
    const [snoozed, setSnoozed] = useState([]);
    const due = all.filter((h) => isDue(h, today)), rest = all.length - due.length;
    const { done } = progressOf(all, today);
    if (!all.length) return html`<${Card} title=${props.title}><${EmptyState} icon="repeat" title="Noch keine Gewohnheiten" text="Beginne klein: Wasser trinken, 10 Minuten dehnen oder 20 Minuten lesen." action=${html`<${Button} variant="primary" icon="plus" onClick=${() => ctx.emit('habit.create.open')}>Gewohnheit anlegen<//>`} /><//>`;

    const bump = (h, dir) => { const st = h.goal.step || 1; const n = Math.max(0, countOn(h, today) + dir * st); setCount(setData, h.id, today, n); ctx.emit('habit.step', { id: h.id, count: n }); if (n >= target(h) && dir > 0) ctx.toast(`${h.name}: Ziel erreicht`); };
    const toggle = (h) => { const was = isDone(h, today); setCount(setData, h.id, today, was ? 0 : target(h)); ctx.emit('habit.toggle', { id: h.id, done: !was }); if (!was) ctx.toast(`${h.name} erledigt`); };
    const open = (h) => ctx.emit('habit.open', { id: h.id });
    const sub = (h) => html`<span class="tk-hl__sub">${h.time && html`<span><${Icon} name="clock" size=${12} /> ${h.time}</span>`}<span class="tk-truncate">${h.goal ? goalLabel(h) : rhythmLabel(h)}</span>${h.link && html`<span class="tk-truncate"><${Icon} name="link-2" size=${12} /> ${h.link.label || h.link.module}</span>`}</span>`;
    const control = (h) => (h.goal ? html`<div class="tk-hl__qty">
        <${Button} variant="ghost" size="sm" icon="minus" aria-label=${`${h.name}: eins weniger`} onClick=${() => bump(h, -1)} disabled=${countOn(h, today) <= 0} />
        <span class="tk-hl__cnt" aria-live="polite">${countOn(h, today)}/${target(h)}</span>
        <${Button} variant=${isDone(h, today) ? 'default' : 'primary'} size="sm" icon="plus" aria-label=${`${h.name}: eins mehr`} onClick=${() => bump(h, 1)} /></div>`
      : html`<${Check} checked=${isDone(h, today)} onChange=${() => toggle(h)} label=${tapLabel(h)} />`);
    const row = (h) => { const st = props.showStreak ? streakOf(h, today) : null; const hc = toneColor(h.tone || 1);
      return html`<div class="tk-hl__row" data-done=${isDone(h, today)} style=${`--hc:${hc}`}>
        <span class="tk-hl__ic"><${Icon} name=${h.icon || 'repeat'} size=${17} /></span>
        <button type="button" class="tk-hl__main" onClick=${() => open(h)} aria-label=${`${h.name} öffnen`}><div class="tk-hl__name tk-truncate">${h.name}</div>${sub(h)}</button>
        ${props.showWeek && html`<span class="tk-hl__week tk-hb-dots" role="img" aria-label="Diese Woche">${weekDots(h, today).map((d) => html`<span class="tk-hb-dot" data-s=${d.s} data-today=${d.today} title=${d.k}></span>`)}</span>`}
        ${st && html`<${Streak} n=${st.current} unit=${st.unit} />`}${control(h)}</div>`; };

    const shown = props.limit > 0 ? due.slice(0, props.limit) : due;
    const head = html`<div class="tk-hl__head"><${Ring} value=${due.length ? done / due.length : 0} size=${44} color="var(--tk-c-success)" label=${`${done} von ${due.length} erledigt`}>${done}/${due.length}<//>
      <div><div class="tk-card__title">${props.title}</div><div class="tk-hl__sum">${calm(done, due.length)}</div></div></div>`;
    const foot = (props.allLabel || rest > 0) && html`<div class="tk-hl__foot"><span>${rest > 0 ? `${rest} weitere heute nicht fällig` : ''}</span>${props.allLabel && html`<${Button} size="sm" variant="ghost" iconRight="chevron-right" onClick=${() => ctx.emit('habit.all')}>${props.allLabel}<//>`}</div>`;
    if (!due.length) return html`<${Card} flush>${head}<${EmptyState} icon="leaf" title="Heute nichts fällig" text="Ruhetag – deine Serien laufen weiter." />${foot}<//>`;

    if (props.style === 'next') {
      const hr = hourOf(ctx), cur = hr < 11 ? 'morgens' : hr < 17 ? 'tagsüber' : 'abends';
      const open0 = due.filter((h) => !isDone(h, today) && !snoozed.includes(h.id));
      const nxt = open0.find((h) => h.daypart === cur) || open0[0];
      const others = due.filter((h) => h !== nxt);
      return html`<${Card} flush>${head}
        ${nxt ? html`<div class="tk-hl__hero" style=${`--hc:${toneColor(nxt.tone || 1)}`}>
          <div class="tk-row" style="gap:14px;align-items:center"><span class="tk-hl__ic"><${Icon} name=${nxt.icon || 'repeat'} size=${24} /></span>
            <div class="tk-grow"><div class="tk-hl__eyebrow">Jetzt passend</div><h3 class="tk-truncate">${nxt.name}</h3>${sub(nxt)}</div></div>
          ${nxt.goal ? html`<div><${Bar} value=${countOn(nxt, today) / target(nxt)} color="var(--tk-c-success)" /><div class="tk-hl__sum">${countOn(nxt, today)} von ${goalLabel(nxt)} heute</div></div>` : null}
          <div class="tk-hl__acts">${nxt.goal ? html`<${Button} variant="primary" icon="plus" onClick=${() => bump(nxt, 1)}>+ ${nxt.goal.step || 1} ${nxt.goal.unit}<//>` : null}
            <${Button} variant=${nxt.goal ? 'default' : 'primary'} icon="check" onClick=${() => toggle(nxt)}>${nxt.goal ? 'Ziel erreicht' : 'Erledigt'}<//>
            <${Button} variant="ghost" icon="clock" onClick=${() => { setSnoozed((s) => [...s, nxt.id]); ctx.emit('habit.snooze', { id: nxt.id }); ctx.toast('Später erinnern – ohne Druck'); }}>Später<//>
            <${Button} variant="ghost" iconRight="chevron-right" onClick=${() => open(nxt)}>Details<//></div></div>`
          : html`<${EmptyState} icon="sparkles" title="Alles erledigt" text="Für heute ist nichts mehr offen. Schön gemacht." />`}
        ${others.length > 0 && html`<div class="tk-hl__chips" role="group" aria-label="Weitere Gewohnheiten">${others.map((h) => html`<button type="button" class="tk-hl__chip" data-done=${isDone(h, today)} onClick=${() => (h.goal ? open(h) : toggle(h))} aria-pressed=${isDone(h, today)}>
          <${Icon} name=${isDone(h, today) ? 'check' : h.icon || 'repeat'} size=${14} />${h.name}${h.goal && html`<span class="tk-subtle tk-num">${countOn(h, today)}/${target(h)}</span>`}</button>`)}</div>`}${foot}<//>`;
    }
    if (props.style === 'cards') return html`<${Card} flush>${head}<div class="tk-hl__cards">${shown.map((h) => { const st = streakOf(h, today); const v = countOn(h, today) / target(h);
      return html`<div class="tk-hl__card" data-done=${isDone(h, today)} style=${`--hc:${toneColor(h.tone || 1)}`}>
        <button type="button" class="tk-hl__ringbtn" aria-label=${h.goal ? `${h.name}: eins mehr` : tapLabel(h)} onClick=${() => (h.goal ? bump(h, 1) : toggle(h))}>
          <${Ring} value=${isDone(h, today) ? 1 : v} size=${64} stroke=${6} color=${isDone(h, today) ? 'var(--tk-c-success)' : toneColor(h.tone || 1)}><${Icon} name=${isDone(h, today) ? 'check' : h.icon || 'repeat'} size=${22} /><//></button>
        <button type="button" class="tk-hl__main" style="text-align:center" onClick=${() => open(h)}><div class="tk-hl__name tk-truncate">${h.name}</div>
          <div class="tk-hl__sub">${h.goal ? `${countOn(h, today)}/${target(h)} ${h.goal.unit}` : rhythmLabel(h)}</div></button>
        <${Streak} n=${st.current} unit=${st.unit} /><span class="tk-subtle" style="font-size:var(--tk-fs-xs)">${st.current > 0 ? `${st.unit} in Folge` : 'bereit für einen Neustart'}</span></div>`; })}</div>${foot}<//>`;

    const groups = props.groupBy === 'daypart' ? DAYPARTS.map((d) => ({ d, items: shown.filter((h) => (h.daypart || 'tagsüber') === d.id) })).filter((g) => g.items.length) : [{ d: null, items: shown }];
    return html`<${Card} flush>${head}${groups.map((g) => html`<div>${g.d && html`<div class="tk-hl__group"><${Icon} name=${g.d.icon} size=${13} />${g.d.label}<${Badge}>${g.items.filter((h) => isDone(h, today)).length}/${g.items.length}<//></div>`}${g.items.map(row)}</div>`)}${foot}<//>`;
  },
};
export default habitList;
