// Kalender: Einstellungen – Wochenstart, Standarddauer, Standard-Erinnerung, Zeitraster, Kalenderwochen.
import { html } from '../../../lib/html.js';
import { Card, Field, Select, Segmented, Switch, EmptyState } from '../../ui.js';

const DURATIONS = [30, 45, 60, 90, 120];
const REMS = ['Keine', 'Zum Beginn', '5 Min. vorher', '15 Min. vorher', '30 Min. vorher', '1 Std. vorher', '1 Tag vorher'];
const hours = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => ({ value: String(a + i), label: `${String(a + i).padStart(2, '0')}:00 Uhr` }));

export const calendarPrefs = {
  id: 'calendar-prefs',
  name: 'Kalender-Einstellungen',
  category: 'Kalender',
  description: 'Grundeinstellungen des Kalenders: Wochenstart, Standarddauer neuer Termine, Standard-Erinnerung, sichtbares Zeitraster und Kalenderwochen. Änderungen werden sofort gespeichert und bestätigt.',
  version: '1.0',
  props: [{ name: 'title', label: 'Titel', type: 'text', default: 'Einstellungen' }],
  data: [{ slot: 'prefs', label: 'Einstellungen', default: 'prefs', shape: '{weekStart,defaultDuration,defaultReminder,gridFrom,gridTo,weekNumbers}', required: true }],
  events: ['prefs.change'],
  states: ['empty'],
  css: `
  .tk-cal-prefs { display:flex; flex-direction:column; gap:var(--tk-space-4); }
  .tk-cal-prefs__grid { display:grid; grid-template-columns:repeat(2, minmax(0,1fr)); gap:var(--tk-space-3); }
  .tk-cal-prefs__sw { display:flex; align-items:center; gap:12px; min-height:44px; } .tk-cal-prefs__sw span:first-child { flex:1; }
  .bp-mobile .tk-cal-prefs__grid { grid-template-columns:minmax(0,1fr); }
  .bp-mobile .tk-cal-prefs__sw .tk-switch { width:54px; height:32px; border-radius:16px; } .bp-mobile .tk-cal-prefs__sw .tk-switch::after { width:24px; height:24px; top:3px; left:3px; }
  .bp-mobile .tk-cal-prefs__sw .tk-switch[aria-checked="true"]::after { transform:translateX(22px); }`,
  example: { data: { prefs: { weekStart: 'Montag', defaultDuration: 60, defaultReminder: '15 Min. vorher', gridFrom: 7, gridTo: 20, weekNumbers: true } } },
  render: ({ props, data, setData, ctx }) => {
    const p = data.prefs && typeof data.prefs === 'object' && !Array.isArray(data.prefs) ? data.prefs : null;
    if (!p || !Object.keys(p).length) return html`<${Card} title=${props.title}><${EmptyState} icon="sliders-horizontal" title="Keine Einstellungen" text="Die Kalender-Einstellungen sind noch nicht angelegt." /><//>`;
    const set = (k, v, label) => { setData('prefs', (o) => ({ ...(o && !Array.isArray(o) ? o : {}), [k]: v })); ctx.emit('prefs.change', { key: k, value: v }); ctx.toast(`${label} gespeichert`); };
    return html`<${Card} title=${props.title} icon="sliders-horizontal"><div class="tk-cal-prefs" data-qa="calendar-prefs">
      <div class="tk-field"><span class="tk-field__label">Wochenstart</span><${Segmented} label="Wochenstart" value=${p.weekStart} onChange=${(v) => set('weekStart', v, 'Wochenstart')} options=${['Montag', 'Sonntag'].map((v) => ({ value: v, label: v }))} /></div>
      <div class="tk-field"><span class="tk-field__label">Standarddauer neuer Termine</span><${Segmented} label="Standarddauer" value=${String(p.defaultDuration)} onChange=${(v) => set('defaultDuration', Number(v), 'Standarddauer')} options=${DURATIONS.map((m) => ({ value: String(m), label: m < 60 ? `${m} Min.` : m === 60 ? '1 Std.' : m === 90 ? '90 Min.' : '2 Std.' }))} /></div>
      <div class="tk-cal-prefs__grid">
        <${Field} label="Standard-Erinnerung"><${Select} value=${p.defaultReminder} onChange=${(v) => set('defaultReminder', v, 'Erinnerung')} options=${REMS} /><//>
        <div></div>
        <${Field} label="Zeitraster ab"><${Select} value=${String(p.gridFrom)} onChange=${(v) => set('gridFrom', Number(v), 'Zeitraster')} options=${hours(0, 10)} /><//>
        <${Field} label="Zeitraster bis"><${Select} value=${String(p.gridTo)} onChange=${(v) => set('gridTo', Number(v), 'Zeitraster')} options=${hours(16, 24)} /><//>
      </div>
      <div class="tk-cal-prefs__sw"><span>Kalenderwochen anzeigen</span><${Switch} checked=${!!p.weekNumbers} onChange=${(v) => set('weekNumbers', v, 'Kalenderwochen')} label="Kalenderwochen anzeigen" /></div>
    </div><//>`;
  },
};
export default calendarPrefs;
