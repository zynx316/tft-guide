// Trading: Marktstatus – Börse geöffnet oder geschlossen, Datenstand der Kurse (fiktiv), Offline-Hinweis.
import { html } from '../../../lib/html.js';
import { Icon } from '../../ui.js';
import { fmtDate, fmtTime } from '../../../lib/format.js';
import { marketState } from './_calc.js';
import { TXT } from './_text.js';
import { TRD_CSS } from './_trd.js';

export const trdMarketStatus = {
  id: 'trd-market-status',
  name: 'Marktstatus',
  category: 'Trading',
  description: 'Eine Zeile mit Börsenstatus (Annahme: Xetra-Zeiten Mo bis Fr 09:00 bis 17:30) und dem Datenstand der fiktiven Kurse. Offline zeigt sie den Stand der letzten Aktualisierung.',
  version: '1.0',
  props: [{ name: 'compact', label: 'Kompakt', type: 'boolean', default: false }],
  data: [],
  events: [],
  states: ['empty', 'loading', 'error'],
  css: `${TRD_CSS}
  .tk-trd-ms { display:flex; align-items:center; gap:8px 14px; flex-wrap:wrap; font-size:var(--tk-fs-sm); color:var(--tk-c-text-muted); } .tk-trd-ms i { width:8px; height:8px; border-radius:50%; display:inline-block; margin-right:6px; }`,
  example: { props: {} },
  render: function TrdMarketStatus({ props, ctx }) {
    const m = marketState(ctx.now ? ctx.now() : ctx.today), off = !!ctx.env?.offline;
    return html`<div class="tk-trd-ms" role="status"><span><i style=${`background:var(--tk-c-${m.open ? 'success' : 'text-subtle'})`}></i>${m.open ? `Börse geöffnet bis ${m.closesAt} Uhr` : `Börse geschlossen · öffnet ${fmtDate(m.next, { style: 'weekday' })} um ${fmtTime(m.next)} Uhr`}</span>
      <span><${Icon} name=${off ? 'wifi-off' : 'clock'} size=${13} /> ${off ? 'Offline: letzter Stand 09:15, fiktiv' : TXT.stand}</span>${!props.compact && html`<span>Krypto handelt rund um die Uhr</span>`}</div>`;
  },
};
export default [trdMarketStatus];
