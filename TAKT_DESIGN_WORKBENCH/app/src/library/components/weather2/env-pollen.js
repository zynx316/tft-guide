// Wetter: Pollenflug (wx-pollen)
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Card, Badge, Button, Icon, Segmented } from '../../ui.js';
import { placeOf, settingsOf, dayName, NoPlace, SLOT_PLACE, SLOT_SETTINGS, EX, toneVar, softVar, hm } from './_weather2.js';

export const POLLEN_LEVEL = [{ label: 'Keine', tone: 'success' }, { label: 'Gering', tone: 'info' }, { label: 'Mäßig', tone: 'warning' }, { label: 'Stark', tone: 'danger' }];
const MONTHS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

export const wxPollen = {
  id: 'wx-pollen',
  name: 'Pollenflug',
  category: 'Wetter',
  description: 'Pollenbelastung für heute bis übermorgen (Hasel, Erle, Birke, Gräser, Roggen, Beifuß, Ambrosia) auf vier Stufen, „Meine Allergene“ zum Umschalten, Saisonkalender und Erklärung der Stufen. Mit Demo-Schalter „Frühling“, weil im November kaum Pollen fliegen. Gesundheitshinweis ohne medizinischen Rat.',
  version: '1.0',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Pollenflug' },
    { name: 'showSeason', label: 'Saisonkalender', type: 'boolean', default: true },
    { name: 'showDemoSwitch', label: 'Demo-Umschalter Frühling', type: 'boolean', default: true },
    { name: 'dense', label: 'Kompakt', type: 'boolean', default: false },
  ],
  data: [SLOT_PLACE, SLOT_SETTINGS],
  events: ['weather.pollen.allergen', 'weather.pollen.day', 'weather.env.info'],
  states: ['empty'],
  css: `
  .tk-wxp__row { display:grid; grid-template-columns:minmax(80px, 1.1fr) minmax(0, 2fr) 72px; align-items:center; gap:var(--tk-space-3); min-height:44px; padding:4px 0; border-bottom:1px solid var(--tk-c-border); }
  .tk-wxp__row:last-child { border-bottom:0; }
  .tk-wxp__meter { display:grid; grid-template-columns:repeat(3, 1fr); gap:3px; } .tk-wxp__meter i { height:8px; border-radius:3px; background:var(--tk-c-surface3); }
  .tk-wxp__sum { display:flex; gap:10px; align-items:flex-start; padding:var(--tk-space-3) var(--tk-space-4); border-radius:var(--tk-radius-md); margin-bottom:var(--tk-space-3); font-size:var(--tk-fs-md); line-height:1.4; }
  .tk-wxp__season { display:grid; grid-template-columns:72px repeat(12, minmax(0,1fr)); gap:3px; align-items:center; font-size:var(--tk-fs-xs); color:var(--tk-c-text-muted); }
  .tk-wxp__season i { height:10px; border-radius:2px; background:var(--tk-c-surface3); } .tk-wxp__season i[data-on="true"] { background:var(--tk-c-warning); } .tk-wxp__season span[data-now="true"] { color:var(--tk-c-text); font-weight:var(--tk-fw-bold); }
  .bp-mobile .tk-wxp__season { grid-template-columns:60px repeat(12, minmax(0,1fr)); } .bp-mobile .tk-wxp__row { grid-template-columns:minmax(70px, 1fr) minmax(0, 1.6fr) 64px; gap:var(--tk-space-2); }`,
  example: { data: { place: EX.place, settings: EX.settings } },
  render: ({ props, data, setData, ctx }) => {
    const [day, setDay] = useState(0);
    const [spring, setSpring] = useState(false);
    const place = placeOf(data);
    if (!place?.pollen) return html`<${NoPlace} icon="flower-2" title="Keine Pollendaten" text="Für diesen Ort liegen keine Pollendaten vor." />`;
    const S = settingsOf(data), P = place.pollen, mine = S.allergens || [];
    const lv = (t) => (spring ? P.demo.levels[t.id]?.[day] ?? 0 : t.levels[day]);
    const types = P.types.map((t) => ({ ...t, lvl: lv(t), mine: mine.includes(t.id) })).sort((a, b) => b.lvl - a.lvl || Number(b.mine) - Number(a.mine));
    const hit = types.filter((t) => t.mine && t.lvl >= 1), worst = Math.max(0, ...hit.map((t) => t.lvl));
    const tone = worst >= 2 ? 'warning' : worst === 1 ? 'info' : 'success';
    const month = ctx.today.getMonth() + 1, next = [...P.types].map((t) => ({ t, in: ((t.season[0] - month + 12) % 12) })).filter((x) => x.in > 0).sort((a, b) => a.in - b.in)[0];
    const toggle = (id) => { setData('settings', (s) => { const cur = (s && s.allergens) || []; return { ...(s && !Array.isArray(s) ? s : {}), allergens: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id] }; }); ctx.emit('weather.pollen.allergen', { id }); };
    const info = () => { ctx.emit('weather.env.info', { topic: 'pollen' }); ctx.openDialog({ title: 'Was bedeuten die Stufen?', body: () => html`<div class="tk-col" style="gap:10px">${POLLEN_LEVEL.map((l, i) => html`<div class="tk-row" style="gap:10px;align-items:flex-start"><${Badge} tone=${l.tone}>Stufe ${i}<//><span><strong>${l.label}</strong> – ${['kein Pollenflug, keine Beschwerden zu erwarten', 'wenige Pollen, nur sehr empfindliche Personen reagieren', 'deutliche Belastung, Beschwerden bei vielen Allergikern', 'hohe Belastung, auch weniger empfindliche Personen reagieren'][i]}</span></div>`)}
      <p class="tk-subtle" style="margin:0;font-size:var(--tk-fs-sm)">Richtwerte aus dem Pollenflug-Gefahrenindex, kein medizinischer Rat. Bei Beschwerden ärztlich abklären.</p></div>` }); };
    return html`<${Card} title=${props.title} icon="flower-2" actions=${html`<${Button} size="sm" variant="ghost" icon="info" aria-label="Stufen erklärt" onClick=${info} />`}>
      <div class="tk-wxp__sum" style=${`background:${softVar(tone)}`}><span style=${`color:${toneVar(tone)};display:inline-flex;margin-top:1px`}><${Icon} name=${worst ? 'alert-triangle' : 'check-circle-2'} size=${18} /></span>
        <span>${worst ? html`<strong>${hit.filter((t) => t.lvl === worst).map((t) => t.name).join(', ')}: ${POLLEN_LEVEL[worst].label.toLowerCase()}.</strong> Mitteilung ab Stufe 2 aktiv.` : html`<strong>Keine Belastung für deine Allergene</strong> (${mine.map((id) => P.types.find((t) => t.id === id)?.name).filter(Boolean).join(', ') || 'keine gewählt'}). ${!spring && next ? `Nächste Saison: ${next.t.name} ab ${['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'][next.t.season[0] - 1]}.` : ''}`}</span></div>
      <div class="tk-row" style="gap:var(--tk-space-3);flex-wrap:wrap;margin-bottom:var(--tk-space-2)"><${Segmented} label="Tag" value=${day} onChange=${(v) => { setDay(v); ctx.emit('weather.pollen.day', { day: v }); }} options=${P.dates.map((d, i) => ({ value: i, label: dayName(d, ctx.today) }))} />
        ${props.showDemoSwitch && html`<${Segmented} label="Datenstand" value=${spring ? 'spring' : 'now'} onChange=${(v) => setSpring(v === 'spring')} options=${[{ value: 'now', label: 'November' }, { value: 'spring', label: 'Frühling (Demo)' }]} />`}</div>
      <div role="list">${types.map((t) => html`<div class="tk-wxp__row" role="listitem"><span style="display:flex;align-items:center;gap:8px;min-width:0"><span style="color:var(--tk-c-text-muted);display:inline-flex"><${Icon} name=${t.icon} size=${16} /></span><span class="tk-truncate" style=${t.mine ? 'font-weight:var(--tk-fw-semibold)' : ''}>${t.name}</span>${t.mine && html`<span style="color:var(--tk-c-accent);display:inline-flex" title="Meine Allergene"><${Icon} name="star" size=${13} /></span>`}</span>
        <span class="tk-wxp__meter" role="img" aria-label=${`${t.name}: ${POLLEN_LEVEL[t.lvl].label}`}>${[1, 2, 3].map((i) => html`<i style=${t.lvl >= i ? `background:${toneVar(POLLEN_LEVEL[t.lvl].tone)}` : ''}></i>`)}</span>
        <span style=${`text-align:right;font-size:var(--tk-fs-sm);color:${t.lvl ? toneVar(POLLEN_LEVEL[t.lvl].tone) : 'var(--tk-c-text-muted)'};font-weight:var(--tk-fw-semibold)`}>${POLLEN_LEVEL[t.lvl].label}</span></div>`)}</div>
      <div style="margin-top:var(--tk-space-4)"><div class="tk-label" style="margin-bottom:8px">Meine Allergene</div><div class="tk-row" style="flex-wrap:wrap;gap:6px">${P.types.map((t) => html`<button type="button" class="tk-chip" aria-pressed=${mine.includes(t.id) ? 'true' : 'false'} onClick=${() => toggle(t.id)}>${t.name}</button>`)}</div></div>
      ${props.showSeason && !props.dense && html`<div style="margin-top:var(--tk-space-4)"><div class="tk-label" style="margin-bottom:8px">Saisonkalender</div><div class="tk-wxp__season" role="img" aria-label="Saisonkalender der Pollenarten"><span></span>${MONTHS.map((m, i) => html`<span data-now=${i + 1 === month ? 'true' : 'false'} style="text-align:center">${m}</span>`)}
        ${P.types.map((t) => html`<span class="tk-truncate">${t.name}</span>${MONTHS.map((_, i) => html`<i data-on=${i + 1 >= t.season[0] && i + 1 <= t.season[1] ? 'true' : 'false'}></i>`)}`)}</div></div>`}
      <div class="tk-subtle" style="font-size:var(--tk-fs-xs);margin-top:var(--tk-space-3)">${P.region} · Stand ${hm(P.updated)} Uhr · ${P.source}</div><//>`;
  },
};
export default [wxPollen];
