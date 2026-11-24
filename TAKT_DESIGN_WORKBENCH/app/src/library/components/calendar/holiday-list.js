// Kalender: Feiertage NRW und Geburtstage als Liste mit Wochentag, Countdown und Schalter „im Kalender anzeigen“.
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Card, Badge, Switch, Segmented, Icon, EmptyState } from '../../ui.js';
import { dayStart, parseDay } from './_cal.js';
import { setSourceVisible } from './_cal-info.js';
import { inDays } from './special-days.js';

const WD = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'], MON = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

export const holidayList = {
  id: 'holiday-list',
  name: 'Feiertage & Geburtstage (Liste)',
  category: 'Kalender',
  description: 'Gesetzliche Feiertage und Brauchtum in NRW sowie Geburtstage aus den Kontakten als Liste mit Wochentag und Countdown. Der Schalter blendet die jeweilige Quelle in allen Kalenderansichten ein oder aus.',
  version: '1.0',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Feiertage & Geburtstage' },
    { name: 'initialTab', label: 'Start-Reiter', type: 'select', options: ['Feiertage', 'Geburtstage'], default: 'Feiertage' },
    { name: 'showPast', label: 'Vergangene zeigen', type: 'boolean', default: false },
  ],
  data: [
    { slot: 'holidays', label: 'Feiertage', default: 'holidays', shape: '{id,name,date,type,eventId?}[]', required: true },
    { slot: 'birthdays', label: 'Geburtstage', default: 'birthdays', shape: '{id,name,date,relation,turns?,eventId?}[]', required: true },
    { slot: 'sources', label: 'Quellen', default: 'sources', shape: '{id,visible}[]', required: false },
    { slot: 'events', label: 'Termine', default: 'events', shape: '{id,source?,hidden?}[]', required: false },
  ],
  events: ['event.open', 'source.toggle', 'tab.change'],
  states: ['empty'],
  css: `
  .tk-cal-hol__bar { display:flex; align-items:center; gap:12px; flex-wrap:wrap; padding:12px 16px; border-bottom:1px solid var(--tk-c-border); }
  .tk-cal-hol__row { display:flex; align-items:center; gap:12px; width:100%; min-height:56px; padding:6px 16px; border:0; border-bottom:1px solid var(--tk-c-border); background:transparent; color:var(--tk-c-text); font:inherit; text-align:left; cursor:pointer; }
  .tk-cal-hol__row:last-child { border-bottom:0; } .tk-cal-hol__row:hover { background:var(--tk-c-surface2); } .tk-cal-hol__row[data-past="true"] { color:var(--tk-c-text-subtle); }
  .tk-cal-hol__row[data-next="true"] { background:var(--tk-c-accent-soft); } .tk-cal-hol__row[data-next="true"] .tk-subtle { color:var(--tk-c-text-muted); }
  .tk-cal-hol__date { width:44px; text-align:center; flex:none; border-radius:var(--tk-radius-md); background:var(--tk-c-surface3); padding:4px 0; line-height:1.15; }
  .tk-cal-hol__date b { display:block; font-size:var(--tk-fs-lg); font-variant-numeric:tabular-nums; } .tk-cal-hol__date small { font-size:var(--tk-fs-xs); text-transform:uppercase; letter-spacing:var(--tk-ls-wide); color:var(--tk-c-text-muted); }
  .bp-mobile .tk-cal-hol__row { min-height:60px; }
  .bp-mobile .tk-cal-hol__bar .tk-switch { width:54px; height:32px; border-radius:16px; } .bp-mobile .tk-cal-hol__bar .tk-switch::after { width:24px; height:24px; top:3px; left:3px; }
  .bp-mobile .tk-cal-hol__bar .tk-switch[aria-checked="true"]::after { transform:translateX(22px); }`,
  example: { data: { holidays: [{ id: 'h1', name: '1. Weihnachtstag', date: '2026-12-25', type: 'gesetzlich' }, { id: 'h2', name: 'Neujahr', date: '2027-01-01', type: 'gesetzlich' }], birthdays: [{ id: 'b1', name: 'Timo', date: '2026-11-28', relation: 'Bruder', turns: 36 }], sources: [{ id: 'holidays', visible: true }, { id: 'birthdays', visible: true }], events: [] } },
  render: function HolidayList({ props, data, setData, ctx }) {
    const [tab, setTab] = useState(props.initialTab);
    const hol = Array.isArray(data.holidays) ? data.holidays : [], bd = Array.isArray(data.birthdays) ? data.birthdays : [];
    const srcId = tab === 'Feiertage' ? 'holidays' : 'birthdays';
    const visible = (Array.isArray(data.sources) ? data.sources : []).find((s) => s.id === srcId)?.visible !== false;
    const today = dayStart(ctx.today), list = (tab === 'Feiertage' ? hol : bd).map((x) => ({ ...x, d: parseDay(x.date), n: Math.round((parseDay(x.date) - today) / 864e5) })).filter((x) => props.showPast || x.n >= 0).sort((a, b) => a.n - b.n);
    const nextId = list.find((x) => x.n >= 0)?.id;
    const toggle = () => { setSourceVisible(setData, srcId, !visible); ctx.emit('source.toggle', { id: srcId, visible: !visible }); ctx.toast(`${tab} ${visible ? 'ausgeblendet' : 'im Kalender angezeigt'}`); };
    return html`<${Card} flush=${true} title=${props.title} icon="party-popper"><div data-qa="holiday-list">
      <div class="tk-cal-hol__bar"><${Segmented} label="Liste" value=${tab} onChange=${(v) => { setTab(v); ctx.emit('tab.change', { tab: v }); }} options=${['Feiertage', 'Geburtstage'].map((v) => ({ value: v, label: v }))} /><span class="tk-grow"></span>
        <span class="tk-row"><span style="font-size:var(--tk-fs-sm)" class="tk-muted">Im Kalender</span><${Switch} checked=${visible} onChange=${toggle} label=${`${tab} im Kalender anzeigen`} /></span></div>
      ${list.length === 0 ? html`<${EmptyState} icon="party-popper" title="Keine Einträge" text=${tab === 'Feiertage' ? 'Es sind keine kommenden Feiertage hinterlegt.' : 'Füge Geburtstage in deinen Kontakten hinzu.'} />`
        : list.map((x) => html`<button type="button" class="tk-cal-hol__row" data-past=${x.n < 0} data-next=${x.id === nextId} onClick=${() => ctx.emit('event.open', { id: x.eventId || x.id })}>
          <span class="tk-cal-hol__date"><b>${x.d.getDate()}</b><small>${MON[x.d.getMonth()]}</small></span>
          <span class="tk-grow"><div class="tk-truncate" style="font-weight:var(--tk-fw-medium)">${tab === 'Feiertage' ? x.name : x.name}</div><div class="tk-subtle tk-truncate" style="font-size:var(--tk-fs-sm)">${WD[x.d.getDay()]}, ${x.d.getDate()}.${x.d.getMonth() + 1}.${x.d.getFullYear() !== ctx.today.getFullYear() ? x.d.getFullYear() : ''} · ${tab === 'Feiertage' ? (x.type === 'gesetzlich' ? 'gesetzlich' : x.type) : `${x.relation}${x.turns ? ` · wird ${x.turns}` : ''}`}</div></span>
          ${x.n >= 0 ? html`<${Badge} tone=${x.id === nextId ? 'accent' : 'neutral'}>${inDays(x.n)}<//>` : html`<${Icon} name="check" size=${16} />`}</button>`)}
    </div><//>`;
  },
};
export default holidayList;
