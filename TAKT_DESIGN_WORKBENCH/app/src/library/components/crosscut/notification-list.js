// Mitteilungen: gruppiert nach Zeit, Modul oder Dringlichkeit, mit Erledigt, Schlummern, „Alle gelesen“ und Ruhezeiten-Hinweis.
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Icon, Button, Card, Chip, Badge, EmptyState } from '../../ui.js';
import { collectNotifications, groupNotifications, prio, timeOf } from './_notifications.js';
import { getPrefs, priv, whenLabel } from './_system.js';
import { fmtTime } from '../../../lib/format.js';
import { pushUndo } from './_crosscut.js';
import { XC_CSS, toneIc } from './_xc-css.js';

const SNOOZE = [{ id: '10', label: '10 Min.', min: 10 }, { id: '60', label: '1 Std.', min: 60 }, { id: 'morgen', label: 'Morgen früh', min: 21 * 60 }];
const CSS = `
  .tk-xc-nl { display: flex; flex-direction: column; gap: var(--tk-space-3); min-width: 0; }
  .tk-xc-nl__head { display: flex; align-items: center; gap: var(--tk-space-2); flex-wrap: wrap; }
  .tk-xc-nl__quiet { display: flex; align-items: center; gap: var(--tk-space-3); padding: var(--tk-space-3) var(--tk-space-4); border-radius: var(--tk-radius-lg); background: var(--tk-c-surface2); border: 1px dashed var(--tk-c-border-strong); font-size: var(--tk-fs-sm); color: var(--tk-c-text-muted); min-width: 0; }
  .tk-xc-nl__quiet svg { flex: none; color: var(--tk-c-accent2); }
  .tk-xc-nl__item { position: relative; display: flex; flex-direction: column; border-bottom: 1px solid var(--tk-c-border); min-width: 0; }
  .tk-xc-nl__item:last-child { border-bottom: 0; }
  .tk-xc-nl__line { display: flex; align-items: center; min-width: 0; }
  .tk-xc-nl__line .tk-xc-row { border-bottom: 0; flex: 1 1 auto; }
  .tk-xc-nl .tk-xc-t, .tk-xc-nl .tk-xc-s { white-space: normal; overflow-wrap: anywhere; }
  .tk-xc-nl .tk-xc-t { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .tk-xc-nl--big .tk-xc-t, .tk-xc-nl--big .tk-xc-nl__text { display: block; -webkit-line-clamp: unset; overflow: visible; }
  .tk-xc-nl__dot { width: 8px; height: 8px; border-radius: 50%; background: var(--tk-c-accent); flex: none; }
  .tk-xc-nl__dot--off { background: transparent; }
  .tk-xc-nl__text { white-space: normal; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .tk-xc-nl__acts { display: flex; align-items: center; flex: none; padding-right: var(--tk-space-2); }
  .tk-xc-nl__snooze { display: flex; gap: var(--tk-space-2); flex-wrap: wrap; align-items: center; padding: 0 var(--tk-space-3) var(--tk-space-3) calc(var(--tk-space-3) + 44px + var(--tk-space-3)); font-size: var(--tk-fs-sm); color: var(--tk-c-text-muted); }
  .tk-xc-nl__hero { display: flex; flex-direction: column; gap: var(--tk-space-3); padding: var(--tk-space-5); border-radius: var(--tk-radius-xl); border: 1px solid var(--tk-c-border); background: linear-gradient(160deg, var(--tk-c-danger-soft), var(--tk-c-surface) 62%); min-width: 0; }
  .tk-xc-nl__hero h3 { margin: 0; font-size: var(--tk-fs-xl); line-height: var(--tk-lh-tight); overflow-wrap: anywhere; }
  .tk-xc-nl__hero p { margin: 0; color: var(--tk-c-text-muted); }
  .tk-xc-nl__acts2 { display: flex; gap: var(--tk-space-2); flex-wrap: wrap; }
  .bp-mobile .tk-xc-nl__acts2 .tk-btn { flex: 1 1 140px; justify-content: center; }
  .tk-xc-nl__cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr)); gap: var(--tk-space-3); }
  .tk-xc-nl__card { display: flex; flex-direction: column; min-width: 0; }
  .tk-xc-nl__card header { display: flex; align-items: center; gap: var(--tk-space-3); padding: var(--tk-space-3) var(--tk-space-4); }
  .tk-xc-nl__card header strong { flex: 1 1 auto; min-width: 0; }
  .tk-xc-nl__foot { border: 0; border-top: 1px solid var(--tk-c-border); background: none; color: var(--tk-c-accent); font: inherit; font-size: var(--tk-fs-sm); font-weight: var(--tk-fw-medium); padding: var(--tk-space-3); cursor: pointer; min-height: 44px; }
  .tk-xc-nl__later { display: flex; flex-direction: column; gap: 2px; }`;

export const notificationList = {
  id: 'notification-list',
  name: 'Mitteilungsliste',
  category: 'Querschnitt',
  description: 'Alle Mitteilungen der App an einem Ort: nach Zeit, Modul oder Dringlichkeit gruppiert, mit Erledigt, Schlummern und „Alle gelesen“. Aufgaben und Termine werden live aus der Datenwelt abgeleitet, Ruhezeiten erscheinen als Hinweis.',
  version: '1.1',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Mitteilungen' },
    { name: 'groupBy', label: 'Gruppieren nach', type: 'select', options: ['time', 'module', 'priority'], default: 'time' },
    { name: 'layout', label: 'Darstellung', type: 'select', options: ['list', 'cards', 'focus'], default: 'list' },
    { name: 'showFilters', label: 'Filter-Chips', type: 'boolean', default: true },
    { name: 'showQuiet', label: 'Ruhezeiten-Hinweis', type: 'boolean', default: true },
    { name: 'limit', label: 'Max. je Gruppe (0 = alle)', type: 'number', default: 0 },
  ],
  data: [
    { slot: 'tasks', label: 'Aufgaben (Quelle)', default: 'tasks', shape: 'Welt: tasks', required: false },
    { slot: 'events', label: 'Termine (Quelle)', default: 'events', shape: 'Welt: events', required: false },
    { slot: 'items', label: 'Mitteilungen der Module', default: 'notifications', shape: '{id,title,text,module,tone,priority,time,to,params?}[]', required: false },
    { slot: 'extra', label: 'Mitteilungen Finanzen', default: 'financeNotifications', shape: 'wie items', required: false },
    { slot: 'prefs', label: 'Einstellungen', default: 'prefs', shape: 'Welt: prefs', required: false },
  ],
  events: ['notification.open', 'notification.read', 'notification.readall', 'notification.done', 'notification.snooze', 'notification.filter', 'notification.rules'],
  states: ['empty'],
  flutter: { widget: 'TaktNotificationList', propMap: { groupBy: 'groupBy', layout: 'layout', showQuiet: 'showQuietHours' }, events: { 'notification.open': 'onOpen', 'notification.done': 'onDismiss', 'notification.snooze': 'onSnooze' } },
  a11y: { role: 'list', nameFrom: 'Titel' },
  css: XC_CSS + CSS,
  example: { props: {}, data: { tasks: [{ id: 't1', title: 'Angebot Müller GmbH finalisieren', due: '2026-11-24T14:00:00', priority: 'hoch', status: 'In Arbeit' }, { id: 't2', title: 'Rechnung Fotograf prüfen', due: '2026-11-23', priority: 'mittel', status: 'Offen' }], events: [], items: [
    { id: 'n1', module: 'weather', tone: 'warning', priority: 'wichtig', time: '2026-11-24T08:52:00', title: 'Böen-Warnung ab 14:00 Uhr', text: 'Stufe 2, bis 72 km/h bis 23:00 Uhr.', to: 'weather.alerts' },
    { id: 'n2', module: 'savings', tone: 'info', priority: 'normal', time: '2026-11-23T18:00:00', title: 'Sparplan-Ausführung am 01.12.', text: '575 € werden bei deinem Broker ausgeführt.', to: 'savings.calendar' }] } },
  render: function NotificationList({ props, data, setData, ctx }) {
    const [st, setSt] = useState({});           // id → { read, gone, until }
    const [filter, setFilter] = useState('alle');
    const [menu, setMenu] = useState(null);
    const prefs = getPrefs(data.prefs, ctx);
    const all = collectNotifications(data, ctx).map((n) => (ctx.privacy ? { ...n, title: priv(ctx, n.title) } : n));
    const patch = (id, p) => setSt((s) => ({ ...s, [id]: { ...s[id], ...p } }));
    const unread = (n) => !st[n.id]?.read && (+ctx.today - +new Date(n.time)) < 16 * 3600000 && n.priority !== 'leise';
    const live = all.filter((n) => !st[n.id]?.gone && !st[n.id]?.until);
    const later = all.filter((n) => st[n.id]?.until && !st[n.id]?.gone);
    const shown = live.filter((n) => filter === 'alle' || (filter === 'wichtig' && n.priority === 'wichtig') || (filter === 'neu' && unread(n)));
    const nUnread = live.filter(unread).length;
    const open = (n) => { patch(n.id, { read: true }); ctx.emit('notification.open', { id: n.params?.id ?? n.id, module: n.module }); if (n.to) ctx.emit(`open:${n.to}`, { id: n.params?.id ?? n.id }); };
    const done = (n) => {
      const isTask = n.id.startsWith('d-due-'), tid = n.params?.id;
      if (isTask) setData('tasks', (l) => (Array.isArray(l) ? l : []).map((t) => (t.id === tid ? { ...t, done: true, status: 'Erledigt' } : t)));
      patch(n.id, { gone: true }); ctx.emit('notification.done', { id: n.id });
      pushUndo(ctx, { text: isTask ? 'Aufgabe erledigt' : 'Mitteilung entfernt', restore: () => { patch(n.id, { gone: false }); if (isTask) setData('tasks', (l) => (Array.isArray(l) ? l : []).map((t) => (t.id === tid ? { ...t, done: false, status: 'In Arbeit' } : t))); } });
    };
    const snooze = (n, s) => { const t = new Date(+ctx.today + s.min * 60000); const until = s.id === 'morgen' ? 'morgen 07:00' : fmtTime(t); patch(n.id, { until }); setMenu(null); ctx.emit('notification.snooze', { id: n.id, for: s.id }); ctx.toast(`Schlummert bis ${until}`); };
    const readAll = () => { setSt((s) => ({ ...s, ...Object.fromEntries(live.map((n) => [n.id, { ...s[n.id], read: true }])) })); ctx.emit('notification.readall', { count: nUnread }); };

    if (ctx.state === 'empty' || !all.length || (live.length === 0 && later.length === 0)) {
      return html`<${EmptyState} icon="bell" title="Keine Mitteilungen" text="Hinweise zu Terminen, Aufgaben und Fristen erscheinen hier." action=${html`<${Button} size="sm" icon="sliders-horizontal" onClick=${() => { ctx.emit('notification.rules'); ctx.emit('open:settings.notifications'); }}>Regeln anpassen<//>`} />`;
    }
    const compact = props.layout !== 'cards';
    const item = (n) => html`<div class="tk-xc-nl__item" key=${n.id} data-notification=${n.id}>
      <div class="tk-xc-nl__line">
        <button type="button" class="tk-xc-row" onClick=${() => open(n)} aria-label=${`${n.title}. ${priv(ctx, n.text)}`}>
          <span class=${`tk-xc-nl__dot${unread(n) ? '' : ' tk-xc-nl__dot--off'}`} aria-hidden="true"></span>
          <span class=${`tk-xc-ic${toneIc(n.tone)}`}><${Icon} name=${n.meta.icon} size=${18} /></span>
          <span class="tk-xc-main"><span class="tk-xc-t" style=${unread(n) ? 'font-weight:var(--tk-fw-semibold)' : ''}>${n.title}</span><span class="tk-xc-s tk-xc-nl__text">${priv(ctx, n.text)}</span>
            <span class="tk-xc-s">${n.meta.name} · ${whenLabel(ctx, n.time, { time: false }) === 'heute' ? timeOf(n) : whenLabel(ctx, n.time)}${n.priority === 'wichtig' ? ' · wichtig' : ''}</span></span></button>
        <div class="tk-xc-nl__acts"><button type="button" class="tk-xc-iconbtn" aria-label=${`${n.title}: schlummern`} aria-expanded=${menu === n.id ? 'true' : 'false'} onClick=${() => setMenu(menu === n.id ? null : n.id)}><${Icon} name="alarm-clock" size=${17} /></button>
          <button type="button" class="tk-xc-iconbtn" aria-label=${`${n.title}: erledigt`} onClick=${() => done(n)}><${Icon} name="check" size=${18} /></button></div></div>
      ${menu === n.id && html`<div class="tk-xc-nl__snooze" role="group" aria-label="Schlummern für">Schlummern:${SNOOZE.map((s) => html`<${Chip} onClick=${() => snooze(n, s)}>${s.label}<//>`)}</div>`}</div>`;
    const lim = Number(props.limit) || 0;
    const groups = groupNotifications(shown, props.groupBy, ctx).map((g) => ({ ...g, more: lim && g.items.length > lim ? g.items.length - lim : 0, items: lim ? g.items.slice(0, lim) : g.items }));

    const top = props.layout === 'focus' ? live.filter((n) => n.priority === 'wichtig' && unread(n))[0] : null;
    const hero = top && html`<section class="tk-xc-nl__hero" aria-label="Jetzt wichtig" data-qa="notification-hero"><${Badge} icon="alert-circle">Jetzt wichtig<//>
      <div class="tk-row" style="align-items:flex-start;gap:var(--tk-space-3)"><span class=${`tk-xc-ic${toneIc(top.tone)}`} style="width:44px;height:44px"><${Icon} name=${top.meta.icon} size=${22} /></span><div class="tk-grow"><h3>${top.title}</h3><p>${priv(ctx, top.text)}</p></div></div>
      <div class="tk-xc-nl__acts2"><${Button} variant="primary" iconRight="arrow-right" onClick=${() => open(top)}>Öffnen<//><${Button} icon="alarm-clock" onClick=${() => snooze(top, SNOOZE[1])}>In 1 Std.<//></div></section>`;

    const body = props.layout === 'cards'
      ? html`<div class="tk-xc-nl__cards">${groupNotifications(shown, 'module', ctx).map((g) => { const m = g.items[0].meta; return html`<${Card} flush key=${g.label}><div class="tk-xc-nl__card"><header><span class="tk-xc-ic"><${Icon} name=${m.icon} size=${18} /></span><strong class="tk-truncate">${g.label}</strong><${Badge} tone="accent">${g.items.length}<//></header>
          ${g.items.slice(0, 3).map(item)}<button type="button" class="tk-xc-nl__foot" onClick=${() => { ctx.emit('notification.open', { module: m.id }); if (m.home) ctx.emit(`open:${m.home}`); }}>${m.name} öffnen</button></div><//>`; })}</div>`
      : groups.map((g) => html`<div key=${g.label}><div class="tk-xc-sec">${g.label}<span class="tk-xc-sec__n">${g.items.length + g.more}</span></div><${Card} flush>${g.items.map(item)}<//></div>`);

    return html`<div class=${`tk-xc-nl${(ctx.env?.scale || 1) > 1 ? ' tk-xc-nl--big' : ''}`} data-qa="notification-list">
      <div class="tk-xc-nl__head"><h2 class="tk-h3 tk-grow">${props.title}</h2>${nUnread > 0 && html`<${Badge} tone="accent">${nUnread} neu<//>`}
        <${Button} size="sm" variant="ghost" icon="check-check" disabled=${nUnread === 0} onClick=${readAll}>Alle gelesen<//></div>
      ${props.showFilters && html`<div class="tk-xc-chips" data-scroll-x role="group" aria-label="Filter">${[['alle', 'Alle'], ['wichtig', 'Wichtig'], ['neu', 'Ungelesen']].map(([id, l]) => html`<${Chip} active=${filter === id} onClick=${() => { setFilter(id); ctx.emit('notification.filter', { filter: id }); }}>${l}<//>`)}</div>`}
      ${props.showQuiet && prefs.quietHours.on && html`<div class="tk-xc-nl__quiet" data-qa="quiet-hint"><${Icon} name="moon-star" size=${18} /><span class="tk-grow">Ruhezeit ${prefs.quietHours.from}–${prefs.quietHours.to}: ${prefs.quietHours.allowImportant ? 'nur Wichtiges kommt durch' : 'alles bleibt leise'}.</span>
        <button type="button" class="tk-xc-link" onClick=${() => { ctx.emit('notification.rules'); ctx.emit('open:settings.notifications'); }}>Regeln</button></div>`}
      ${hero}
      ${shown.length === 0 ? html`<${EmptyState} icon="check-circle-2" title="Nichts in dieser Ansicht" text="Wechsle den Filter, um alles zu sehen." action=${html`<${Button} size="sm" onClick=${() => setFilter('alle')}>Alle anzeigen<//>`} />` : (top ? groupNotifications(shown.filter((n) => n.id !== top.id), props.groupBy === 'time' ? 'priority' : props.groupBy, ctx).map((g) => html`<div key=${g.label}><div class="tk-xc-sec">${g.label}<span class="tk-xc-sec__n">${g.items.length}</span></div><${Card} flush>${g.items.map(item)}<//></div>`) : body)}
      ${later.length > 0 && html`<div><div class="tk-xc-sec"><${Icon} name="alarm-clock" size=${14} />Schlummert<span class="tk-xc-sec__n">${later.length}</span></div><${Card} flush>${later.map((n) => html`<div class="tk-xc-nl__item" key=${n.id}><div class="tk-xc-nl__line"><div class="tk-xc-row" style="cursor:default"><span class="tk-xc-ic tk-xc-ic--neutral"><${Icon} name=${n.meta.icon} size=${18} /></span><span class="tk-xc-main"><span class="tk-xc-t">${n.title}</span><span class="tk-xc-s">Kommt wieder: ${st[n.id].until}</span></span></div>
          <div class="tk-xc-nl__acts"><${Button} size="sm" variant="ghost" onClick=${() => patch(n.id, { until: null })}>Jetzt<//></div></div></div>`)}<//></div>`}
    </div>`;
  },
};
export default notificationList;
