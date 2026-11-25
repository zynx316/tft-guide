// Kalender: Zeitraster Tag/Woche mit überlappungsfreier Terminanordnung, Jetzt-Linie und Anlegen per Klick.
import { html } from '../../../lib/html.js';
import { Button, Icon, EmptyState } from '../../ui.js';
import {
  addDays, startOfWeek, dayKey, selDate, isoWeek, occurrences, onDay, layoutDay, eventsFiltered, minutesOf, timeStr, hm,
  catColor, openEventDialog, openCreateDialog, WEEKDAYS, monthName, longDay, fullDay, shortDay, EVENT_CSS, bigTextScale,
} from './_cal.js';
import { dueDate, prio } from '../tasks/_tasks.js';
import { toneColor } from '../../ui.js';
import { openEvent, OPEN_MODE_PROP } from './_cal-info.js';

const HH = { compact: 40, comfortable: 56, spacious: 76 };

export const calendarWeek = {
  id: 'calendar-week',
  name: 'Kalender Tag/Woche',
  category: 'Kalender',
  description: 'Zeitraster mit Terminen nach Uhrzeit, Überlappungen nebeneinander, Jetzt-Linie und Anlegen per Klick auf freie Zeit. Mobil: 3-Tage-Raster mit Tagesleiste (bei großer Schrift ein Tag je Raster, Spaltenzahl nach Breite). Reagiert auf ctx.ui.view (Tag/Woche) und selectedDate.',
  version: '1.4',
  props: [
    { name: 'startHour', label: 'Erste Stunde', type: 'number', default: 7 },
    { name: 'endHour', label: 'Letzte Stunde', type: 'number', default: 20 },
    { name: 'density', label: 'Dichte', type: 'select', options: ['compact', 'comfortable', 'spacious'], default: 'comfortable' },
    { name: 'showWeekend', label: 'Wochenende zeigen', type: 'boolean', default: true },
    { name: 'mobileDays', label: 'Tage auf Mobile', type: 'number', default: 3 },
    { name: 'showToolbar', label: 'Navigation zeigen', type: 'boolean', default: true },
    { name: 'showNow', label: 'Jetzt-Linie', type: 'boolean', default: true },
    { name: 'showTasks', label: 'Fällige Aufgaben zeigen', type: 'boolean', default: false },
    { name: 'showLocation', label: 'Ort anzeigen', type: 'boolean', default: false },
    { name: 'view', label: 'Ansicht festlegen', type: 'select', options: ['auto', 'Tag', 'Woche'], default: 'auto' },
    { name: 'respectView', label: 'Ansicht (Tag/Woche) vom Umschalter übernehmen', type: 'boolean', default: true },
    { name: 'respectFilter', label: 'Suche/Filter beachten', type: 'boolean', default: true },
    OPEN_MODE_PROP,
  ],
  data: [
    { slot: 'events', label: 'Termine', default: 'events', shape: '{id,title,start,end,category?,tone?,location?,repeat?,allDay?}[]', required: true },
    { slot: 'tasks', label: 'Aufgaben (optional)', default: 'tasks', shape: '{id,title,due?,priority?,done?}[]', required: false },
  ],
  events: ['event.open', 'event.create', 'event.create.open', 'event.update', 'event.delete', 'calendar.navigate', 'date.select', 'task.open'],
  states: ['empty'],
  css: `${EVENT_CSS}
  .tk-cw { display:flex; flex-direction:column; gap:var(--tk-space-3); min-width:0; }
  .tk-cw__bar { display:flex; align-items:center; gap:var(--tk-space-2); flex-wrap:wrap; }
  .tk-cw__title { font-size:var(--tk-fs-lg); font-weight:var(--tk-fw-semibold); letter-spacing:var(--tk-ls-tight); margin:0 var(--tk-space-2); }
  .tk-cw__title small { font-weight:var(--tk-fw-regular); color:var(--tk-c-text-subtle); font-size:var(--tk-fs-md); margin-left:6px; }
  .tk-cw__frame { background:var(--tk-c-surface); border:1px solid var(--tk-c-border); border-radius:var(--tk-radius-lg); overflow:hidden; min-width:0; }
  .tk-cw__grid { display:grid; grid-template-columns:var(--gutter,44px) repeat(var(--n), minmax(0,1fr)); min-width:0; }
  .tk-cw__head { border-bottom:1px solid var(--tk-c-border); background:var(--tk-c-surface); }
  .tk-cw__dayhead { border:0; border-left:1px solid var(--tk-c-border); background:transparent; color:var(--tk-c-text-muted); padding:8px 4px; display:flex; flex-direction:column; align-items:center; gap:2px; cursor:pointer; font:inherit; min-width:0; }
  .tk-cw__dayhead:hover { background:var(--tk-c-surface2); }
  .tk-cw__dow { font-size:var(--tk-fs-xs); font-weight:var(--tk-fw-semibold); letter-spacing:var(--tk-ls-wide); text-transform:uppercase; }
  .tk-cw__dnum { width:30px; height:30px; display:grid; place-items:center; border-radius:50%; font-size:var(--tk-fs-lg); font-weight:var(--tk-fw-semibold); color:var(--tk-c-text); font-variant-numeric:tabular-nums; }
  .tk-cw__dayhead[data-today="true"] .tk-cw__dnum { background:var(--tk-c-accent); color:var(--tk-c-text-on-accent); }
  .tk-cw__dayhead[data-sel="true"]:not([data-today="true"]) .tk-cw__dnum { box-shadow:inset 0 0 0 2px var(--tk-c-accent); }
  .tk-cw__allday { border-bottom:1px solid var(--tk-c-border); background:var(--tk-c-surface2); }
  .tk-cw__allcell { border-left:1px solid var(--tk-c-border); padding:4px; display:flex; flex-direction:column; gap:3px; min-width:0; min-height:30px; }
  .tk-cw__allchip { display:flex; align-items:center; gap:4px; border:0; text-align:left; font:inherit; font-size:var(--tk-fs-xs); font-weight:var(--tk-fw-medium); padding:3px 6px; border-radius:var(--tk-radius-xs); color:var(--tk-c-text); background:color-mix(in srgb, var(--ec) 24%, var(--tk-c-surface)); border-left:3px solid var(--ec); cursor:pointer; min-width:0; min-height:22px; }
  .tk-cw__allchip--task { background:transparent; border:1px dashed var(--ec); color:var(--tk-c-text-muted); }
  .tk-cw__gutter { position:relative; }
  .tk-cw__hour { position:absolute; right:6px; transform:translateY(-50%); font-size:var(--tk-fs-xs); color:var(--tk-c-text-subtle); font-variant-numeric:tabular-nums; }
  .tk-cw__col { position:relative; border-left:1px solid var(--tk-c-border); cursor:cell; min-width:0;
    background-image:repeating-linear-gradient(to bottom, var(--tk-c-border) 0, var(--tk-c-border) 1px, transparent 1px, transparent var(--hh)),
      repeating-linear-gradient(to bottom, transparent 0, transparent calc(var(--hh) / 2), color-mix(in srgb, var(--tk-c-border) 45%, transparent) calc(var(--hh) / 2), color-mix(in srgb, var(--tk-c-border) 45%, transparent) calc(var(--hh) / 2 + 1px), transparent calc(var(--hh) / 2 + 1px), transparent var(--hh)); }
  .tk-cw__col[data-today="true"] { background-color:color-mix(in srgb, var(--tk-c-accent) 5%, transparent); }
  .tk-cw__ev { position:absolute; border-radius:var(--tk-radius-sm); padding:3px 6px; overflow:hidden; cursor:pointer; text-align:left; border-left:3px solid var(--ec); background:color-mix(in srgb, var(--ec) 22%, var(--tk-c-surface)); color:var(--tk-c-text); font-size:var(--tk-fs-xs); line-height:1.25; box-shadow:0 0 0 1px var(--tk-c-surface); transition:filter var(--tk-motion-fast); }
  .tk-cw__more { position:absolute; display:flex; align-items:center; justify-content:center; gap:3px; border:1px dashed var(--tk-c-border-strong); border-radius:var(--tk-radius-sm); background:var(--tk-c-surface2); color:var(--tk-c-text); font:inherit; font-size:var(--tk-fs-xs); font-weight:var(--tk-fw-semibold); cursor:pointer; padding:0 4px; min-width:0; box-shadow:0 0 0 1px var(--tk-c-surface); }
  .tk-cw__more:hover { background:var(--tk-c-accent-soft); }
  .tk-cw__more:focus-visible { outline:2px solid var(--tk-c-focus); z-index:3; }
  .tk-cw__morerow { display:flex; align-items:center; gap:10px; width:100%; min-height:48px; padding:6px 0; border:0; border-top:1px solid var(--tk-c-border); background:transparent; color:var(--tk-c-text); font:inherit; text-align:left; cursor:pointer; }
  .tk-cw__morerow i { width:4px; align-self:stretch; border-radius:2px; background:var(--ec); flex:none; }
  .tk-cw__morerow time { width:48px; flex:none; font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); font-variant-numeric:tabular-nums; }
  .tk-cw__ev:hover { filter:brightness(1.12); z-index:2; }
  .tk-cw__ev:focus-visible { outline:2px solid var(--tk-c-focus); z-index:3; }
  .tk-cw__ev b { display:block; font-weight:var(--tk-fw-semibold); display:-webkit-box; -webkit-box-orient:vertical; -webkit-line-clamp:var(--tl,2); overflow:hidden; }
  .tk-cw__ev span { display:block; color:var(--tk-c-text-muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; font-variant-numeric:tabular-nums; }
  .tk-cw__ev[data-one="true"] { display:flex; gap:5px; align-items:center; padding-top:0; padding-bottom:0; }
  .tk-cw__ev[data-one="true"] b { display:block; -webkit-line-clamp:unset; white-space:nowrap; text-overflow:ellipsis; overflow:hidden; min-width:0; }
  .tk-cw__ev[data-one="true"] span { flex:none; }
  .tk-cw--spacious .tk-cw__ev { font-size:var(--tk-fs-sm); padding:6px 9px; border-left-width:4px; }
  .tk-cw__now { position:absolute; left:0; right:0; height:0; border-top:2px solid var(--tk-c-danger); z-index:4; pointer-events:none; }
  .tk-cw__now::before { content:''; position:absolute; left:-5px; top:-6px; width:10px; height:10px; border-radius:50%; background:var(--tk-c-danger); }
  .tk-cw__strip { display:grid; grid-template-columns:repeat(7, minmax(0,1fr)); gap:4px; }
  .tk-cw__stripbtn { border:1px solid var(--tk-c-border); background:var(--tk-c-surface); color:var(--tk-c-text-muted); border-radius:var(--tk-radius-md); min-height:48px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:1px; font:inherit; font-size:var(--tk-fs-xs); cursor:pointer; position:relative; }
  .tk-cw__stripbtn b { font-size:var(--tk-fs-md); color:var(--tk-c-text); font-variant-numeric:tabular-nums; }
  .tk-cw__stripbtn[data-in="true"] { background:var(--tk-c-accent-soft); border-color:transparent; }
  .tk-cw__stripbtn[data-today="true"] b { color:var(--tk-c-accent); }
  .tk-cw__stripbtn[data-sel="true"] { border-color:var(--tk-c-accent); }
  .bp-mobile .tk-cw__ev { min-height:32px; }
  .bp-mobile .tk-cw__more { min-height:36px; }
  .bp-mobile .tk-cw__allchip { min-height:32px; }
  .bp-mobile .tk-cw__dayhead { min-height:56px; }
  .bp-tablet .tk-cw__dnum { width:28px; height:28px; font-size:var(--tk-fs-md); }
  [data-tk-large-text] .tk-cw__grid { --gutter:calc(20px * var(--tk-text-scale, 1.5)); }
  [data-tk-large-text] .tk-cw__bar { row-gap:var(--tk-space-2); }
  [data-tk-large-text] .tk-cw__title { flex:1 1 100%; order:-1; margin:0; }
  [data-tk-large-text] .tk-cw__dayhead { padding:8px 2px; }
  [data-tk-large-text] .tk-cw__dnum { width:1.9em; height:1.9em; }
  [data-tk-large-text] .tk-cw__hour { right:4px; }
  [data-tk-large-text] .tk-cw__stripbtn { min-height:0; padding:4px 0; }`,
  example: {
    props: { density: 'comfortable' },
    data: { events: [
      { id: 'a', title: 'Daily Stand-up', start: '2026-11-24T09:45:00', end: '2026-11-24T10:00:00', category: 'Arbeit', tone: 'accent' },
      { id: 'b', title: 'Fokus: Workbench-Review', start: '2026-11-24T10:30:00', end: '2026-11-24T12:00:00', category: 'Fokus', tone: 'success', location: 'Büro' },
      { id: 'c', title: 'Lieferanten-Call Etsy', start: '2026-11-24T11:00:00', end: '2026-11-24T12:00:00', category: 'Sales', tone: 'warning' },
      { id: 'd', title: 'Krafttraining', start: '2026-11-26T18:30:00', end: '2026-11-26T19:30:00', category: 'Fitness', tone: 'info' },
    ] },
  },
  render: function CalendarWeek({ props, data, setData, ctx }) {
    const mobile = ctx.bp === 'mobile';
    const sel = selDate(ctx);
    const view = props.view && props.view !== 'auto' ? props.view : props.respectView ? ctx.ui.view : null;
    const weekDays = props.showWeekend ? 7 : 5;
    const bs = bigTextScale(ctx), big = bs > 1; // große Schrift: weniger Tagesspalten, damit Termintexte lesbar bleiben
    const bw = ctx.blockWidth || ctx.width || 390;
    const n0 = view === 'Tag' ? 1 : mobile ? Math.min(Number(props.mobileDays) || 3, 7) : weekDays;
    const n = big && n0 > 1 ? Math.max(1, Math.min(n0, Math.floor((bw - 16 - 20 * bs) / (100 * bs)))) : n0;
    const cappedBig = big && n0 > 1 && n === 1;
    const first = n === 1 || mobile ? sel : startOfWeek(sel);
    const days = Array.from({ length: n }, (_, i) => addDays(first, i));
    const end = addDays(first, n);
    const todayKey = dayKey(ctx.today);
    const all = Array.isArray(data.events) ? data.events : [];
    const occs = occurrences(eventsFiltered(all, ctx.ui, props.respectFilter), first, end);
    const timed = occs.filter((o) => !o.allDay);
    const allDay = occs.filter((o) => o.allDay);
    const tasks = props.showTasks && Array.isArray(data.tasks) ? data.tasks.filter((t) => t.due && !t.done) : [];
    const hs = big ? 1 + (bs - 1) * 0.6 : 1; // Stundenhöhe wächst mit der Schrift, damit Termine Platz für Text haben
    const hh = Math.round((mobile ? Math.max(HH[props.density] || 56, 64) : HH[props.density] || 56) * hs);
    let s0 = Number(props.startHour), e0 = Number(props.endHour);
    for (const o of timed) { s0 = Math.min(s0, Math.floor(minutesOf(o._s) / 60)); e0 = Math.max(e0, Math.ceil(Math.max(minutesOf(o._e), minutesOf(o._s) + 15) / 60)); }
    e0 = Math.min(24, Math.max(e0, s0 + 1));
    const hours = e0 - s0, H = hours * hh;
    const hasAll = allDay.length || tasks.some((t) => days.some((d) => dayKey(dueDate(t)) === dayKey(d)));
    const nav = (dir) => { const step = n === 1 ? 1 : mobile ? n : 7; const next = dayKey(addDays(sel, dir * step)); ctx.setUi('selectedDate', next); ctx.emit('calendar.navigate', { date: next }); };
    const goToday = () => { ctx.setUi('selectedDate', todayKey); ctx.emit('calendar.navigate', { date: todayKey }); };
    const pick = (d) => { ctx.setUi('selectedDate', dayKey(d)); ctx.emit('date.select', { date: dayKey(d) }); };
    const title = n === 1 ? longDay(first)
      : `${first.getDate()}.${first.getMonth() === days[n - 1].getMonth() ? '' : ` ${monthName(first).slice(0, 3)}.`} – ${days[n - 1].getDate()}. ${monthName(days[n - 1])}`;
    const createAt = (d, e) => {
      if (e.target !== e.currentTarget) return;
      const y = e.offsetY; const m = Math.min(24 * 60 - 60, s0 * 60 + Math.floor(y / hh * 2) * 30);
      openCreateDialog(ctx, setData, { date: dayKey(d), start: hm(m), end: hm(m + 60) });
    };
    // Überlappungen: höchstens so viele Spalten je Tag, dass jeder Block mindestens ~48 px breit bleibt; der Rest wird zu „+N“.
    const maxCols = Math.max(2, Math.min(4, Math.floor(((bw - 44) / n) / (48 * (big ? bs : 1)))));
    const collapse = (list) => {
      const keep = [], chips = []; let cur = null;
      for (const it of list) {
        if (it.cols > maxCols && it.col >= maxCols - 1) { if (cur && it.s < cur.e) { cur.list.push(it); cur.e = Math.max(cur.e, it.e); } else { cur = { s: it.s, e: it.e, list: [it] }; chips.push(cur); } }
        else keep.push(it.cols > maxCols ? { ...it, cols: maxCols } : it);
      }
      return { keep, chips };
    };
    const openMore = (d, c) => ctx.openDialog({ title: `Weitere Termine · ${longDay(d)}`, body: (close) => html`<div role="list">${c.list.map(({ ev }) => html`<button type="button" role="listitem" class="tk-cw__morerow" style=${`--ec:${catColor(ev)}`} onClick=${() => { close(); openEvent(ctx, setData, ev, all, props); }}><i></i><time>${timeStr(ev._s)}</time><span class="tk-grow">${ev.title}</span></button>`)}</div>` });
    const nowMin = minutesOf(ctx.today);
    const showNow = props.showNow && nowMin >= s0 * 60 && nowMin <= e0 * 60;
    const strip = mobile && (n > 1 || cappedBig) ? html`<div class="tk-cw__strip" role="group" aria-label="Woche">${Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(sel), i)).map((d, i) => {
      const k = dayKey(d); const inWin = d >= first && d < end;
      return html`<button type="button" class="tk-cw__stripbtn" data-in=${inWin} data-today=${k === todayKey} data-sel=${k === dayKey(sel)} onClick=${() => pick(d)} aria-label=${`${WEEKDAYS[i]} ${d.getDate()}.`}>${WEEKDAYS[i]}<b>${d.getDate()}</b></button>`;
    })}</div>` : null;

    if (!all.length) return html`<div class="tk-cw"><${EmptyState} icon="calendar" title="Keine Termine" text="Lege deinen ersten Termin an." action=${html`<${Button} variant="primary" icon="plus" onClick=${() => openCreateDialog(ctx, setData, {})}>Termin anlegen<//>`} /></div>`;

    return html`<div class=${`tk-cw tk-cw--${props.density}`}>
      ${props.showToolbar && html`<div class="tk-cw__bar">
        <${Button} variant="ghost" icon="chevron-left" aria-label="Zurück" onClick=${() => nav(-1)} />
        <${Button} onClick=${goToday}>Heute<//>
        <${Button} variant="ghost" icon="chevron-right" aria-label="Weiter" onClick=${() => nav(1)} />
        <h3 class="tk-cw__title tk-grow tk-truncate">${title}${n > 1 && html`<small>KW ${isoWeek(first)}</small>`}</h3>
        <${Button} variant="primary" icon="plus" onClick=${() => openCreateDialog(ctx, setData, { date: dayKey(sel) })} aria-label="Termin anlegen">${mobile ? null : 'Termin'}<//>
      </div>`}
      ${strip}
      <div class="tk-cw__frame" data-qa="calendar-frame">
        <div class="tk-cw__grid tk-cw__head" style=${`--n:${n}`}>
          <div></div>
          ${days.map((d) => { const k = dayKey(d); return html`<button type="button" class="tk-cw__dayhead" data-today=${k === todayKey} data-sel=${k === dayKey(sel) && n > 1} onClick=${() => pick(d)} aria-label=${fullDay(d)}>
            <span class="tk-cw__dow">${WEEKDAYS[(d.getDay() + 6) % 7]}</span><span class="tk-cw__dnum">${d.getDate()}</span></button>`; })}
        </div>
        ${hasAll ? html`<div class="tk-cw__grid tk-cw__allday" style=${`--n:${n}`}>
          <div style="font-size:var(--tk-fs-xs);color:var(--tk-c-text-subtle);padding:6px 4px;text-align:right">${mobile || big ? '' : 'Ganztag'}</div>
          ${days.map((d) => { const k = dayKey(d); const ts = tasks.filter((t) => dayKey(dueDate(t)) === k).sort((a, b) => prio(a).rank - prio(b).rank).slice(0, 2);
            return html`<div class="tk-cw__allcell">
              ${onDay(allDay, d).map((o) => html`<button type="button" class="tk-cw__allchip" style=${`--ec:${catColor(o)}`} onClick=${() => openEvent(ctx, setData, o, all, props)}><span class="tk-truncate">${o.title}</span></button>`)}
              ${ts.map((t) => html`<button type="button" class="tk-cw__allchip tk-cw__allchip--task" style=${`--ec:${toneColor(prio(t).tone)}`} onClick=${() => { ctx.setUi('selectedId', t.id); ctx.emit('task.open', { id: t.id }); }}><${Icon} name="circle" size=${11} /><span class="tk-truncate">${t.title}</span></button>`)}
            </div>`; })}
        </div>` : null}
        <div class="tk-cw__grid" style=${`--n:${n};--hh:${hh}px`}>
          <div class="tk-cw__gutter" style=${`height:${H}px`}>${Array.from({ length: hours }, (_, i) => i > 0 && html`<span class="tk-cw__hour" style=${`top:${i * hh}px`}>${String(s0 + i).padStart(2, '0')}${big ? '' : ':00'}</span>`)}</div>
          ${days.map((d) => { const k = dayKey(d); const { keep: items, chips } = collapse(layoutDay(onDay(timed, d), Math.ceil(((mobile ? 32 : 20) * (big ? bs : 1) + 2) / hh * 60)));
            return html`<div class="tk-cw__col" data-today=${k === todayKey} style=${`height:${H}px`} onClick=${(e) => createAt(d, e)} aria-label=${`Freie Zeit am ${k}`}>
              ${items.map(({ ev, col, cols, s, e }) => { const top = (s - s0 * 60) / 60 * hh; const h = Math.max((mobile ? 32 : 20) * (big ? bs : 1), (e - s) / 60 * hh - 2); const lineH = (props.density === 'spacious' ? 16 : 14) * (big ? bs : 1), padV = props.density === 'spacious' ? 12 : 6; const lines = Math.floor((h - padV) / lineH); const narrow = cols > 1 && n > 4 && ctx.bp !== 'desktop'; const one = lines < 2 || narrow; const tl = Math.max(1, lines - 1);
                return html`<div class="tk-cw__ev" role="button" tabindex="0" data-clip-ok data-one=${one} style=${`--ec:${catColor(ev)};--tl:${tl};top:${top + 1}px;height:${h}px;left:calc(${col} / ${cols} * 100% + 1px);width:calc(100% / ${cols} - 3px)`}
                    onClick=${() => openEvent(ctx, setData, ev, all, props)} onKeyDown=${(k2) => k2.key === 'Enter' && openEvent(ctx, setData, ev, all, props)} aria-label=${`${ev.title}, ${timeStr(ev._s)} bis ${timeStr(ev._e)}`}>
                  ${one ? html`<b>${ev.title}</b>${cols === 1 && html`<span>${timeStr(ev._s)}</span>`}` : html`<b>${ev.title}</b><span>${timeStr(ev._s)}–${timeStr(ev._e)}</span>${(props.showLocation || props.density === 'spacious') && ev.location && lines > 3 && html`<span>${ev.location}</span>`}`}
                </div>`; })}
              ${chips.map((c) => html`<button type="button" class="tk-cw__more" style=${`top:${(c.s - s0 * 60) / 60 * hh + 1}px;height:${Math.max((mobile ? 36 : 28) * (big ? bs : 1), (c.e - c.s) / 60 * hh - 2)}px;left:calc(${maxCols - 1} / ${maxCols} * 100% + 1px);width:calc(100% / ${maxCols} - 3px)`}
                  onClick=${(ev) => { ev.stopPropagation(); openMore(d, c); }} aria-label=${`${c.list.length} weitere Termine am ${shortDay(d)} anzeigen`}>+${c.list.length}</button>`)}
              ${showNow && k === todayKey && html`<div class="tk-cw__now" style=${`top:${(nowMin - s0 * 60) / 60 * hh}px`} aria-hidden="true"></div>`}
            </div>`; })}
        </div>
      </div>
    </div>`;
  },
};

export default calendarWeek;
