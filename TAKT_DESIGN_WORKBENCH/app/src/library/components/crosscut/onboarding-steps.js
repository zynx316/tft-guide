// Onboarding: Willkommen, Module wählen, Navigation, Darstellung, Datenschutz, Fertig – als Schritte oder auf einer Seite.
import { html } from '../../../lib/html.js';
import { useState } from 'preact/hooks';
import { Icon, Button, Badge, Switch, Segmented, Chip } from '../../ui.js';
import { themes, THEME_IDS } from '../../../design-system/tokens.js';
import { MODULES, getPrefs, isEnabled, moduleMeta, plural } from './_system.js';
import { XC_CSS } from './_xc-css.js';

const STEPS = [{ id: 'welcome', label: 'Willkommen' }, { id: 'modules', label: 'Module' }, { id: 'nav', label: 'Navigation' }, { id: 'theme', label: 'Darstellung' }, { id: 'privacy', label: 'Datenschutz' }, { id: 'done', label: 'Fertig' }];
const PRESETS = [
  { id: 'alltag', label: 'Alltag', ids: ['home', 'calendar', 'tasks', 'habits', 'notes', 'weather', 'settings'] },
  { id: 'gesund', label: 'Alltag & Gesundheit', ids: ['home', 'calendar', 'tasks', 'habits', 'notes', 'weather', 'fitness', 'nutrition', 'settings'] },
  { id: 'geld', label: 'Alltag & Geld', ids: ['home', 'calendar', 'tasks', 'notes', 'weather', 'finance', 'savings', 'trading', 'settings'] },
  { id: 'alles', label: 'Alles', ids: MODULES.map((m) => m.id) },
];
const CSS = `
  .tk-xc-ob { display: flex; flex-direction: column; gap: var(--tk-space-4); min-width: 0; }
  .tk-xc-ob__top { display: flex; align-items: center; gap: var(--tk-space-3); min-width: 0; }
  .tk-xc-ob__dots { display: flex; gap: 6px; flex: 1 1 auto; }
  .tk-xc-ob__dots i { height: 5px; flex: 1; border-radius: 3px; background: var(--tk-c-surface3); }
  .tk-xc-ob__dots i[data-on="true"] { background: var(--tk-c-accent); }
  .tk-xc-ob__hero { display: flex; flex-direction: column; align-items: center; text-align: center; gap: var(--tk-space-3); padding: var(--tk-space-6) var(--tk-space-4); border-radius: var(--tk-radius-xl); background: linear-gradient(180deg, var(--tk-c-accent-soft), var(--tk-c-surface) 70%); border: 1px solid var(--tk-c-border); }
  .tk-xc-ob__logo { width: 72px; height: 72px; border-radius: 22px; display: grid; place-items: center; background: var(--tk-c-accent); color: var(--tk-c-text-on-accent); font-size: 34px; font-weight: var(--tk-fw-bold); box-shadow: var(--tk-shadow-md); }
  .tk-xc-ob__hero h2 { margin: 0; font-size: var(--tk-fs-3xl); line-height: var(--tk-lh-tight); }
  .tk-xc-ob__hero p { margin: 0; max-width: 420px; color: var(--tk-c-text-muted); }
  .tk-xc-ob__pts { display: flex; flex-direction: column; gap: var(--tk-space-3); width: 100%; max-width: 420px; text-align: left; }
  .tk-xc-ob__pts div { display: flex; gap: var(--tk-space-3); align-items: center; }
  .tk-xc-ob__panel { display: flex; flex-direction: column; gap: var(--tk-space-3); padding: var(--tk-space-4); border-radius: var(--tk-radius-xl); border: 1px solid var(--tk-c-border); background: var(--tk-c-surface); min-width: 0; }
  .tk-xc-ob__panel h3 { margin: 0; font-size: var(--tk-fs-xl); }
  .tk-xc-ob__panel > p { margin: 0; color: var(--tk-c-text-muted); font-size: var(--tk-fs-md); }
  .tk-xc-ob__grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 150px), 1fr)); gap: var(--tk-space-2); }
  .tk-xc-ob__mod { display: flex; align-items: center; gap: var(--tk-space-2); min-height: 52px; padding: var(--tk-space-2) var(--tk-space-3); border-radius: var(--tk-radius-lg); border: 1.5px solid var(--tk-c-border); background: var(--tk-c-surface); color: var(--tk-c-text-muted); font: inherit; text-align: left; cursor: pointer; min-width: 0; }
  .tk-xc-ob__mod[aria-pressed="true"] { border-color: var(--tk-c-accent); background: var(--tk-c-accent-soft); color: var(--tk-c-text); }
  .tk-xc-ob__mod span { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: var(--tk-fw-medium); }
  .tk-xc-ob__themes { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--tk-space-2); }
  .tk-xc-ob__theme { display: flex; flex-direction: column; gap: 8px; padding: 8px; border-radius: var(--tk-radius-lg); border: 2px solid var(--tk-c-border); background: var(--tk-c-surface); color: var(--tk-c-text); font: inherit; font-size: var(--tk-fs-sm); font-weight: var(--tk-fw-medium); cursor: pointer; min-width: 0; }
  .tk-xc-ob__theme[aria-checked="true"] { border-color: var(--tk-c-accent); }
  .tk-xc-ob__sw { height: 54px; border-radius: var(--tk-radius-md); background: var(--tk-c-bg); border: 1px solid var(--tk-c-border); display: flex; gap: 4px; align-items: flex-end; padding: 6px; }
  .tk-xc-ob__sw i { flex: 1; border-radius: 3px; background: var(--tk-c-surface3); height: 40%; }
  .tk-xc-ob__sw i:nth-child(2) { background: var(--tk-c-accent); height: 80%; }
  .tk-xc-ob__sw i:nth-child(3) { background: var(--tk-c-accent2); height: 60%; }
  .tk-xc-ob__line { display: flex; align-items: center; gap: var(--tk-space-3); min-height: 56px; min-width: 0; }
  .tk-xc-ob__nav { display: flex; gap: var(--tk-space-2); justify-content: space-between; }
  .bp-mobile .tk-xc-ob__nav .tk-btn { flex: 1 1 0; justify-content: center; }
  .tk-xc-ob__sum { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: var(--tk-space-2); }
  .tk-xc-ob__sum li { display: flex; align-items: center; gap: var(--tk-space-2); min-width: 0; }
  .tk-xc-ob__sum svg { color: var(--tk-c-success); flex: none; }
  .tk-xc-ob__no { padding: 0 var(--tk-space-2); color: var(--tk-c-text-subtle); text-align: center; font-size: var(--tk-fs-sm); }`;

export const onboardingSteps = {
  id: 'onboarding-steps',
  name: 'Onboarding',
  category: 'Querschnitt',
  description: 'Erststart in sechs kurzen Schritten: Willkommen, Module wählen (mit Vorlagen), Favoriten für die Navigation, Theme, Datenschutz und Zusammenfassung. Als Schritt-für-Schritt-Ablauf oder als eine Seite. Am Ende geht es zu „Start“.',
  version: '1.0',
  props: [
    { name: 'flow', label: 'Ablauf', type: 'select', options: ['steps', 'single'], default: 'steps' },
    { name: 'startStep', label: 'Startschritt (Vorschau, 0–5)', type: 'number', default: 0 },
    { name: 'allowSkip', label: 'Überspringen', type: 'boolean', default: true },
  ],
  data: [{ slot: 'prefs', label: 'Einstellungen', default: 'prefs', shape: 'Welt: prefs', required: false }],
  events: ['onboarding.step', 'onboarding.preset', 'onboarding.module', 'onboarding.favorite', 'onboarding.theme', 'onboarding.privacy', 'onboarding.done', 'onboarding.skip'],
  states: ['empty'],
  flutter: { widget: 'TaktOnboarding', propMap: { flow: 'layout', allowSkip: 'skippable' }, events: { 'onboarding.done': 'onFinished', 'onboarding.skip': 'onSkipped' } },
  a11y: { role: 'group', nameFrom: 'Willkommen' },
  css: XC_CSS + CSS,
  example: { props: { startStep: 1 }, data: { prefs: {} } },
  render: function OnboardingSteps({ props, data, setData, ctx }) {
    const [step, setStep] = useState(Math.max(0, Math.min(5, Number(props.startStep) || 0)));
    const [sample, setSample] = useState('sample');
    const [preset, setPreset] = useState('alles');
    const prefs = getPrefs(data.prefs);
    const save = (next) => setData('prefs', { ...prefs, ...next });
    const active = MODULES.filter((m) => isEnabled(prefs, m.id));
    const favs = prefs.favorites.filter((id) => isEnabled(prefs, id));
    const single = props.flow === 'single';
    const go = (n) => { setStep(n); ctx.emit('onboarding.step', { step: STEPS[n].id }); };
    const applyPreset = (p) => { setPreset(p.id); save({ enabled: Object.fromEntries(MODULES.filter((m) => !p.ids.includes(m.id)).map((m) => [m.id, false])), favorites: prefs.favorites.filter((id) => p.ids.includes(id)) }); ctx.emit('onboarding.preset', { preset: p.id }); };
    const toggleMod = (m) => { if (m.locked) { ctx.toast(`${m.name} bleibt immer aktiv`); return; } const on = !isEnabled(prefs, m.id); setPreset(null); save({ enabled: { ...prefs.enabled, [m.id]: on }, favorites: on ? prefs.favorites : prefs.favorites.filter((x) => x !== m.id) }); ctx.emit('onboarding.module', { id: m.id, on }); };
    const toggleFav = (id) => { const has = favs.includes(id); if (!has && favs.length >= 4) { ctx.toast('Höchstens 4 Favoriten. Entferne zuerst einen.'); return; } save({ favorites: has ? favs.filter((x) => x !== id) : [...favs, id] }); ctx.emit('onboarding.favorite', { id, on: !has }); };
    const finish = () => { ctx.emit('onboarding.done', { sample: sample === 'sample', modules: active.length }); ctx.emit('open:home.today'); };
    const skip = () => { ctx.emit('onboarding.skip'); ctx.emit('open:home.today'); };

    const sec = {
      welcome: () => html`<div class="tk-xc-ob__hero"><span class="tk-xc-ob__logo" aria-hidden="true">T</span><h2>Willkommen bei TAKT</h2><p>Termine, Aufgaben, Geld, Training und Ernährung an einem Ort. Ruhig, schnell und auf deinem Gerät.</p>
        <div class="tk-xc-ob__pts">${[['shield-check', 'Deine Daten bleiben auf dem Gerät'], ['zap', 'Erfassen in einem Satz'], ['layout-grid', 'Nur die Module, die du brauchst']].map(([i, t]) => html`<div><span class="tk-xc-ic"><${Icon} name=${i} size=${18} /></span><span class="tk-xc-t" style="white-space:normal">${t}</span></div>`)}</div></div>`,
      modules: () => html`<div class="tk-xc-ob__panel"><h3>Welche Module brauchst du?</h3><p>Wähle eine Vorlage und passe sie an. Das lässt sich jederzeit in den Einstellungen ändern.</p>
        <div class="tk-xc-chips" data-scroll-x role="group" aria-label="Vorlage">${PRESETS.map((p) => html`<${Chip} active=${preset === p.id} onClick=${() => applyPreset(p)}>${p.label}<//>`)}</div>
        <div class="tk-xc-ob__grid">${MODULES.map((m) => html`<button type="button" class="tk-xc-ob__mod" key=${m.id} aria-pressed=${isEnabled(prefs, m.id) ? 'true' : 'false'} onClick=${() => toggleMod(m)}><${Icon} name=${m.icon} size=${18} /><span>${m.name}</span></button>`)}</div>
        <span class="tk-xc-s">${plural(active.length, 'Modul', 'Module')} aktiv</span></div>`,
      nav: () => html`<div class="tk-xc-ob__panel"><h3>Deine Favoriten</h3><p>Bis zu vier Module stehen in der Leiste unten, der Rest liegt unter „Mehr“.</p>
        <div class="tk-xc-ob__grid">${active.filter((m) => m.id !== 'settings').map((m) => html`<button type="button" class="tk-xc-ob__mod" key=${m.id} aria-pressed=${favs.includes(m.id) ? 'true' : 'false'} onClick=${() => toggleFav(m.id)}><${Icon} name=${favs.includes(m.id) ? 'star' : m.icon} size=${18} /><span>${m.name}</span></button>`)}</div>
        <span class="tk-xc-s">${favs.length} von 4 gewählt${favs.length ? `: ${favs.map((id) => moduleMeta(id).name).join(', ')}` : ''}</span></div>`,
      theme: () => html`<div class="tk-xc-ob__panel"><h3>Wie soll TAKT aussehen?</h3><p>Themes ändern nur die Farben. Du kannst jederzeit wechseln.</p>
        <div class="tk-xc-ob__themes" role="radiogroup" aria-label="Theme">${THEME_IDS.map((id) => html`<button type="button" class="tk-xc-ob__theme" role="radio" aria-checked=${prefs.theme === id ? 'true' : 'false'} key=${id} onClick=${() => { save({ theme: id }); ctx.emit('onboarding.theme', { theme: id }); }}>
          <span class="tk-xc-ob__sw" data-tk-theme=${id} aria-hidden="true"><i></i><i></i><i></i></span>${themes[id].label}</button>`)}</div></div>`,
      privacy: () => html`<div class="tk-xc-ob__panel"><h3>Datenschutz</h3><p>Alle Daten bleiben lokal. Berechtigungen fragt TAKT erst, wenn du sie brauchst.</p>
        ${[['lock', 'App-Sperre', 'PIN oder Biometrie beim Öffnen', prefs.privacy.lock, (v) => save({ privacy: { ...prefs.privacy, lock: v } })],
          ['eye-off', 'Beträge ausblenden', 'Geldbeträge zeigen „••••“, bis du sie antippst', prefs.privacy.hideAmounts, (v) => save({ privacy: { ...prefs.privacy, hideAmounts: v } })],
          ['bell', 'Mitteilungen', 'Erinnerungen an Termine und Fristen, du wählst je Modul', prefs.notify.on, (v) => save({ notify: { ...prefs.notify, on: v } })]].map(([i, t, s, v, fn]) => html`<div class="tk-xc-ob__line" key=${t}><span class="tk-xc-ic"><${Icon} name=${i} size=${18} /></span><span class="tk-xc-main"><span class="tk-xc-t">${t}</span><span class="tk-xc-s" style="white-space:normal">${s}</span></span><${Switch} checked=${!!v} label=${t} onChange=${(x) => { fn(x); ctx.emit('onboarding.privacy', { id: t, on: x }); }} /></div>`)}
        <p class="tk-xc-s" style="white-space:normal"><${Icon} name="map-pin" size=${14} /> Standort fürs Wetter und Kamera für Scans fragt TAKT erst beim ersten Gebrauch.</p></div>`,
      done: () => html`<div class="tk-xc-ob__panel"><h3>Alles bereit</h3>
        <ul class="tk-xc-ob__sum"><li><${Icon} name="check-circle-2" size=${18} />${plural(active.length, 'Modul', 'Module')} aktiv</li><li><${Icon} name="check-circle-2" size=${18} />Favoriten: ${favs.map((id) => moduleMeta(id).name).join(', ') || 'keine'}</li>
          <li><${Icon} name="check-circle-2" size=${18} />Theme ${themes[prefs.theme]?.label || 'Graphite'}</li><li><${Icon} name="check-circle-2" size=${18} />App-Sperre ${prefs.privacy.lock ? 'an' : 'aus'}</li></ul>
        <${Segmented} label="Start" value=${sample} onChange=${setSample} options=${[{ value: 'sample', label: 'Mit Beispieldaten' }, { value: 'empty', label: 'Leer starten' }]} />
        <p class="tk-xc-s" style="white-space:normal">${sample === 'sample' ? 'Beispiel-Termine und -Aufgaben zeigen, wie TAKT aussieht. Du löschst sie mit einem Tipp.' : 'Du startest ohne Einträge. Das erste Erfassen dauert einen Satz.'}</p>
        <${Button} variant="primary" icon="check" onClick=${finish} data-qa="onboarding-done">TAKT öffnen<//></div>`,
    };
    const head = html`<div class="tk-xc-ob__top"><div class="tk-xc-ob__dots" role="progressbar" aria-label="Fortschritt" aria-valuemin="1" aria-valuemax=${STEPS.length} aria-valuenow=${single ? STEPS.length : step + 1}>${STEPS.map((s, i) => html`<i key=${s.id} data-on=${single || i <= step ? 'true' : 'false'}></i>`)}</div>
      ${!single && html`<span class="tk-xc-s tk-num">${step + 1} von ${STEPS.length}</span>`}${props.allowSkip && step < STEPS.length - 1 && html`<button type="button" class="tk-xc-link" onClick=${skip}>Überspringen</button>`}</div>`;
    if (single) return html`<div class="tk-xc-ob" data-qa="onboarding">${head}${STEPS.slice(1).map((s, i) => html`<section key=${s.id} aria-label=${s.label}>${i === 0 && sec.welcome()}${sec[s.id]()}</section>`)}</div>`;
    const id = STEPS[step].id;
    return html`<div class="tk-xc-ob" data-qa="onboarding">${head}${sec[id]()}
      ${id !== 'done' && html`<div class="tk-xc-ob__nav">${step > 0 ? html`<${Button} icon="arrow-left" onClick=${() => go(step - 1)}>Zurück<//>` : html`<span></span>`}<${Button} variant="primary" iconRight="arrow-right" onClick=${() => go(step + 1)} data-qa="onboarding-next">${id === 'welcome' ? 'Los geht’s' : 'Weiter'}<//></div>`}
      ${id === 'done' && html`<div class="tk-xc-ob__nav"><${Button} icon="arrow-left" onClick=${() => go(step - 1)}>Zurück<//><span></span></div>`}</div>`;
  },
};
export default onboardingSteps;
