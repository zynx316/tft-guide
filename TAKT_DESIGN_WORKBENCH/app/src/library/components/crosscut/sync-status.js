// Sync-Status als Chip: synchronisiert / wartet (n) / Fehler mit Aktion.
import { html } from '../../../lib/html.js';
import { useEffect } from 'preact/hooks';
import { Icon } from '../../ui.js';
import { fmtTime } from '../../../lib/format.js';
import { useSynced, minutesBefore, SPIN_CSS } from './_crosscut.js';

const ST = {
  synced: { icon: 'check-circle-2', tone: 'success' },
  pending: { icon: 'cloud-upload', tone: 'warning' },
  syncing: { icon: 'refresh-cw', tone: 'info', spin: true },
  error: { icon: 'alert-triangle', tone: 'danger' },
  offline: { icon: 'wifi-off', tone: 'warning' },
};

export const syncStatus = {
  id: 'sync-status',
  name: 'Sync-Status',
  category: 'Querschnitt',
  description: 'Kleiner Chip für den Abgleichstand: synchronisiert (mit Uhrzeit), wartet (n Änderungen), Fehler mit „Erneut versuchen“. Tippen löst den Abgleich aus.',
  version: '1.0',
  props: [
    { name: 'status', label: 'Status', type: 'select', options: ['synced', 'pending', 'syncing', 'error', 'offline'], default: 'synced' },
    { name: 'count', label: 'Wartende Änderungen', type: 'number', default: 3 },
    { name: 'minutesAgo', label: 'Letzter Abgleich vor (Minuten)', type: 'number', default: 15 },
    { name: 'showTime', label: 'Uhrzeit zeigen', type: 'boolean', default: true },
  ],
  data: [],
  events: ['sync.now', 'sync.retry', 'sync.info'],
  states: [],
  flutter: {
    widget: 'TaktSyncChip',
    propMap: { status: 'status', count: 'pendingCount', minutesAgo: 'lastSyncAgo', showTime: 'showTime' },
    events: { 'sync.now': 'onSyncNow', 'sync.retry': 'onRetry', 'sync.info': 'onTap' },
  },
  a11y: { role: 'button', nameFrom: 'Status und Aktion' },
  css: `
  .tk-sync { display: inline-flex; align-items: center; gap: 6px; max-width: 100%; min-height: 32px; padding: 4px 12px; border-radius: var(--tk-radius-pill); border: 1px solid transparent; font: inherit; font-size: var(--tk-fs-sm); font-weight: var(--tk-fw-medium); cursor: pointer; }
  .tk-sync--success { background: var(--tk-c-success-soft); color: var(--tk-c-success); }
  .tk-sync--warning { background: var(--tk-c-warning-soft); color: var(--tk-c-warning); }
  .tk-sync--danger { background: var(--tk-c-danger-soft); color: var(--tk-c-danger); }
  .tk-sync--info { background: var(--tk-c-info-soft); color: var(--tk-c-info); }
  .tk-sync:hover { border-color: currentColor; }
  .tk-sync__label { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .tk-sync__time { opacity: .85; font-variant-numeric: tabular-nums; }
  .bp-mobile .tk-sync { min-height: var(--tk-size-touch); padding: 0 16px; }${SPIN_CSS}`,
  example: { props: { status: 'pending', count: 3 } },
  render: function SyncStatus({ props, ctx }) {
    const base = ctx.env?.offline && props.status === 'synced' ? 'offline' : props.status;
    const [status, setStatus] = useSynced(base);
    useEffect(() => { if (status !== 'syncing') return undefined; const t = setTimeout(() => { setStatus('synced'); ctx.toast('Alles synchronisiert'); }, 1400); return () => clearTimeout(t); }, [status]);
    const st = ST[status] || ST.synced;
    const n = Number(props.count) || 0;
    const time = fmtTime(minutesBefore(ctx.today, Number(props.minutesAgo) || 0));
    const label = { synced: 'Synchronisiert', pending: `Wartet (${n})`, syncing: 'Synchronisiere …', error: 'Sync-Fehler · Erneut versuchen', offline: `Offline${n ? ` · wartet (${n})` : ''}` }[status];
    const act = () => {
      if (status === 'syncing') return;
      if (status === 'error') { ctx.emit('sync.retry'); setStatus('syncing'); }
      else if (status === 'pending') { ctx.emit('sync.now', { pending: n }); setStatus('syncing'); }
      else { ctx.emit('sync.info', { status }); ctx.toast(status === 'offline' ? 'Offline – Änderungen werden später abgeglichen' : `Zuletzt synchronisiert um ${time}`); }
    };
    return html`<button type="button" class=${`tk-sync tk-sync--${st.tone}`} onClick=${act} aria-label=${`Sync-Status: ${label}`}>
      <span class=${st.spin ? 'tk-cc-spin' : ''} style="display:inline-flex"><${Icon} name=${st.icon} size=${15} /></span>
      <span class="tk-sync__label">${label}</span>${status === 'synced' && props.showTime && html`<span class="tk-sync__time">· ${time}</span>`}</button>`;
  },
};
export default syncStatus;
