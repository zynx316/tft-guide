// ============================================================================
// TAKT DEMO-LAUNCHER – die ganze App als klickbarer Prototyp, in mehreren
// Versionen (Design-Richtungen) nebeneinander auf dem Laptop oder im Vollbild
// auf dem Handy. Bewerten, kommentieren, entscheiden – Ebene für Ebene.
//
//  * Lokal (localhost): liest/schreibt über den Workbench-Store (Entscheidungen direkt).
//  * Im WLAN (Handy): liest den Stand, Feedback geht an /api/feedback (append-only)
//    und erscheint in der Workbench unter „Demo & Entscheidung › Feedback“.
// ============================================================================
import { html, render } from '../lib/html.js';
import { useState, useEffect, useRef, useMemo, useCallback, useLayoutEffect } from 'preact/hooks';
import { Icon } from '../lib/icons.js';
import { Btn, IconBtn, Badge, Seg, Select, OverlayHost, openDialog, toast, openMenu, Field } from '../workbench/ui/kit.js';
import { buildAppPayload, loadStateStandalone } from '../core/preview-payload.js';
import { listVersions, versionCoverage, LEVELS } from '../core/directions.js';
import { THEME_IDS, themes } from '../design-system/tokens.js';
import { LAUNCHER_DEVICES, launcherDevice } from './devices.js';
import { uid, cx } from '../lib/util.js';
import { SCENARIOS } from '../core/world.js';
import { SHELLS } from '../preview/launchpad.js';
import qrcode from '../../vendor/qrcode.module.js';
import { apiFetch, lanPin } from '../lib/api.js';

const LOCAL = ['localhost', '127.0.0.1', '[::1]', ''].includes(location.hostname);
const PREFS_KEY = 'takt-launcher-prefs';
const RATINGS_KEY = 'takt-launcher-ratings';
const QUEUE_KEY = 'takt-launcher-feedback-queue';
const ls = { get: (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } }, set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* noop */ } } };

let store = null; // Workbench-Store (nur lokal)
let fbCtx = {}; // Kontext jedes Feedback-Eintrags (Szenario, Stand-Revision)

// ------------------------------------------------------------ Feedback ---
async function flushQueue() {
  const q = ls.get(QUEUE_KEY, []); if (!q.length) return;
  const rest = [];
  for (const e of q) { try { const r = await apiFetch('/api/feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(e) }); if (!r.ok) rest.push(e); } catch { rest.push(e); } }
  ls.set(QUEUE_KEY, rest);
}
async function sendFeedback(entry) {
  const e = { id: uid('fb'), device: deviceLabel(), ...fbCtx, ...entry };
  if (store) store.actions.importFeedback([{ ...e, ts: new Date().toISOString() }]);
  try {
    const r = await apiFetch('/api/feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(e) });
    if (r.status === 401) toast(lanPin() ? 'WLAN-PIN ist nicht mehr gültig – QR-Code am Rechner neu scannen. Die Bewertung wird nachgesendet.' : 'WLAN-PIN fehlt – bitte über den QR-Code im Launcher am Rechner öffnen. Die Bewertung wird nachgesendet.');
    if (!r.ok) throw new Error(r.status);
  } catch { ls.set(QUEUE_KEY, [...ls.get(QUEUE_KEY, []), e]); }
  return e;
}
const deviceLabel = () => { const ua = navigator.userAgent; return /Android/.test(ua) ? 'Android' : /iPhone|iPad/.test(ua) ? 'iOS' : /Mac/.test(ua) ? 'Mac' : /Windows/.test(ua) ? 'Windows' : 'Browser'; };

// --------------------------------------------------------------- Rahmen ---
function StatusBar({ device, theme }) {
  if (!device.statusBar) return null;
  const dark = themes[theme]?.scheme !== 'light';
  return html`<div class="ln-status" style=${`height:${device.statusBar}px;color:${dark ? '#fff' : '#111'};background:${themes[theme]?.color.bg}`}>
    <span class="ln-status__time">9:30</span>
    ${device.cutout === 'island' && html`<span class="ln-status__island"></span>`}${device.cutout === 'hole' && html`<span class="ln-status__hole"></span>`}
    <span class="ln-status__icons"><${Icon} name="signal" size=${13} /><${Icon} name="wifi" size=${13} /><span class="ln-batt"><span></span></span></span></div>`;
}

/** Ein Gerät mit der ganzen App in einer Version. */
function DeviceFrame({ device, payload, scale, onRoute, frameRef, bare }) {
  const iframe = useRef(); const last = useRef(null); const [ready, setReady] = useState(false);
  const screenH = device.height - device.statusBar - device.homeBar;
  const push = () => { const w = iframe.current?.contentWindow; if (!w?.__taktPreview || !payload) return; const sig = JSON.stringify(payload); if (sig === last.current) return; last.current = sig; w.__taktPreview.render(payload); };
  useEffect(() => { if (ready) push(); }, [payload, ready]);
  useEffect(() => { if (frameRef) frameRef(iframe.current); }, []);
  useEffect(() => {
    const on = (e) => { if (e.source !== iframe.current?.contentWindow || e.data?.source !== 'takt-preview') return;
      if (e.data.type === 'ready') { setReady(true); last.current = null; push(); }
      if (e.data.type === 'route') onRoute && onRoute(e.data); };
    window.addEventListener('message', on); return () => window.removeEventListener('message', on);
  }, [payload, onRoute]);
  if (bare) return html`<iframe ref=${iframe} class="ln-bare" src="./preview.html" title="TAKT" onLoad=${() => { setReady(true); last.current = null; setTimeout(push, 0); }}></iframe>`;
  const pad = device.group === 'desktop' ? 0 : 11;
  const W = device.width + pad * 2, H = device.height + pad * 2;
  return html`<div class="ln-device" style=${`width:${W * scale}px;height:${H * scale}px`}>
    <div class=${cx('ln-bezel', `ln-bezel--${device.group}`)} style=${`width:${W}px;height:${H}px;transform:scale(${scale});border-radius:${device.radius + pad}px;padding:${pad}px`}>
      <div class="ln-screen" style=${`width:${device.width}px;height:${device.height}px;border-radius:${device.radius}px`}>
        <${StatusBar} device=${device} theme=${payload?.theme} />
        <iframe ref=${iframe} src="./preview.html" title=${`TAKT ${payload?.versionName || ''}`} style=${`width:${device.width}px;height:${screenH}px`}
          onLoad=${() => { setReady(true); last.current = null; setTimeout(push, 0); }}></iframe>
        ${device.homeBar > 0 && html`<div class="ln-homestrip" style=${`height:${device.homeBar}px;background:${themes[payload?.theme]?.color.navBg}`}><span class="ln-homebar" style=${`background:${themes[payload?.theme]?.scheme === 'light' ? '#111' : '#fff'}`}></span></div>`}
        ${!ready && html`<div class="ln-loading">TAKT startet …</div>`}
      </div>
    </div>
  </div>`;
}

// ---------------------------------------------------------- Bewertung ---
const levelTarget = (level, route, state) => {
  if (level === 'app') return { target: 'app', targetName: 'Ganze App' };
  if (level === 'module') { const m = state.modules.find((x) => x.id === route?.moduleId); return { target: route?.moduleId || '', targetName: m?.name || '–' }; }
  const f = state.features.find((x) => x.id === route?.featureId); return { target: route?.featureId || '', targetName: f?.name || '–' };
};

function Stars({ value, onChange, size = 20 }) {
  return html`<div class="ln-stars" role="radiogroup" aria-label="Bewertung">${[1, 2, 3, 4, 5].map((n) => html`<button type="button" role="radio" aria-checked=${String(value === n)} aria-label=${`${n} von 5`} onClick=${() => onChange(value === n ? 0 : n)}
    class=${n <= value ? 'is-on' : ''}><svg width=${size} height=${size} viewBox="0 0 24 24"><path d="M12 2.8l2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.3l-5.6 2.9 1.1-6.3L2.9 9.5l6.3-.9z" /></svg></button>`)}</div>`;
}

function chooseDialog({ state, version, level, route, onDone }) {
  const { target, targetName } = levelTarget(level, route, state);
  const isDirection = version.kind === 'direction';
  openDialog({ title: `„${version.name}“ übernehmen`, size: 'wide', body: ({ close }) => {
    const [why, setWhy] = useState(''); const [tradeoffs, setTradeoffs] = useState(''); const [scope, setScope] = useState(level);
    const t = levelTarget(scope, route, state);
    const cov = isDirection ? versionCoverage(state, version.id, scope === 'module' ? route?.moduleId : null) : null;
    const go = async () => {
      if (LOCAL && store && isDirection) {
        try {
          const res = store.actions.applyDirection(scope, scope === 'app' ? 'app' : t.target, version.directionId, { rationale: why, tradeoffs });
          toast(`Übernommen: ${res.applied.length} Features${res.skippedLocked.length ? ` · ${res.skippedLocked.length} freigegebene unverändert` : ''}${res.missing.length ? ` · ${res.missing.length} ohne Variante dieser Richtung` : ''}`);
        } catch (e) { toast(e.message, 'danger'); return; }
      }
      await sendFeedback({ version: version.id, versionName: version.name, level: scope, target: t.target, targetName: t.targetName, choose: true, comment: [why, tradeoffs && `Nachteile: ${tradeoffs}`].filter(Boolean).join(' · ') });
      if (!LOCAL || !isDirection) toast(LOCAL ? 'Als Entscheidungsvorschlag gespeichert' : 'Entscheidung gesendet – in der Workbench unter „Feedback“ übernehmen');
      close(); onDone && onDone();
    };
    return html`<div class="wb-col" style="gap:14px">
      <${Field} label="Ebene"><${Seg} value=${scope} onChange=${setScope} options=${LEVELS.slice(0, 3).map((l) => ({ value: l.id, label: `${l.label}${l.id === 'feature' ? ` · ${levelTarget('feature', route, state).targetName}` : l.id === 'module' ? ` · ${levelTarget('module', route, state).targetName}` : ''}` }))} /><//>
      <p class="wb-muted">${isDirection ? html`Für <strong>${t.targetName}</strong> wird je Feature die Variante der Richtung <strong>${version.name}</strong> gewählt${cov ? ` (${cov.own} von ${cov.total} Features haben eine eigene Variante)` : ''}. Freigegebene Features bleiben unverändert. Die Entscheidung wird mit Begründung protokolliert.`
        : html`„${version.name}“ ist keine Design-Richtung – die Wahl wird als Entscheidungsvorschlag mit Kommentar in der Workbench abgelegt.`}</p>
      <${Field} label="Warum?"><textarea class="wb-textarea" rows="3" autofocus value=${why} placeholder="z. B. Am Handy am schnellsten erfassbar, beste Übersicht über den Tag" onInput=${(e) => setWhy(e.currentTarget.value)}></textarea><//>
      <${Field} label="Bewusst akzeptierte Nachteile (optional)"><textarea class="wb-textarea" rows="2" value=${tradeoffs} onInput=${(e) => setTradeoffs(e.currentTarget.value)}></textarea><//>
      <div class="wb-row" style="justify-content:flex-end"><${Btn} onClick=${close}>Abbrechen<//><${Btn} variant="primary" icon="check" onClick=${go} data-confirm>${LOCAL && isDirection ? 'Übernehmen' : 'Senden'}<//></div></div>`;
  } });
  return target;
}

function commentDialog({ version, level, route, state }) {
  openDialog({ title: `Kommentar zu „${version.name}“`, body: ({ close }) => {
    const [text, setText] = useState(''); const t = levelTarget(level, route, state);
    return html`<p class="wb-small wb-muted">Bezug: ${LEVELS.find((l) => l.id === level)?.label} · ${t.targetName}</p>
      <textarea class="wb-textarea" rows="4" autofocus value=${text} placeholder="Was fällt auf? Was fehlt? Was ist besser als in den anderen Versionen?" onInput=${(e) => setText(e.currentTarget.value)}></textarea>
      <div class="wb-row" style="justify-content:flex-end"><${Btn} onClick=${close}>Abbrechen<//><${Btn} variant="primary" icon="send" disabled=${!text.trim()} data-confirm
        onClick=${async () => { await sendFeedback({ version: version.id, versionName: version.name, level, target: t.target, targetName: t.targetName, comment: text.trim() }); toast('Kommentar gespeichert'); close(); }}>Speichern<//></div>`;
  } });
}

/** Kriterien für den Versionsvergleich (Bauplan Abschnitt 4) – ohne Gewichtung, 1–5. */
export const LAUNCHER_CRITERIA = [
  { id: 'zeit', label: 'Zeit bis zur Aktion', hint: 'Wie schnell ist das Häufigste erledigt?' },
  { id: 'einhand', label: 'Einhandbedienung', hint: 'Daumen erreicht alles Wichtige' },
  { id: 'uebersicht', label: 'Übersicht', hint: 'Das Wichtige auf einen Blick' },
  { id: 'ruhe', label: 'Ruhe / Dichte', hint: 'Angenehm ruhig, nicht überladen' },
  { id: 'module20', label: 'Trägt 20+ Module', hint: 'Bleibt mit allen Modulen verständlich' },
];

function criteriaDialog({ version, level, route, state, current, onSave }) {
  openDialog({ title: `Kriterien – „${version.name}“`, body: ({ close }) => {
    const [c, setC] = useState({ ...(current || {}) }); const t = levelTarget(level, route, state);
    return html`<p class="wb-small wb-muted">Bezug: ${LEVELS.find((l) => l.id === level)?.label} · ${t.targetName}. 1 = schwach, 5 = sehr gut.</p>
      <div class="wb-col" style="gap:10px;margin:8px 0">${LAUNCHER_CRITERIA.map((k) => html`<div class="wb-row wb-wrap" style="gap:8px"><div class="wb-grow" style="min-width:150px"><strong class="wb-small">${k.label}</strong><div class="wb-xs wb-subtle">${k.hint}</div></div>
        <div class="wb-score" role="radiogroup" aria-label=${k.label}>${[1, 2, 3, 4, 5].map((n) => html`<button type="button" role="radio" aria-checked=${String(c[k.id] === n)} class=${c[k.id] === n ? 'is-on' : ''} style="width:36px;height:36px" onClick=${() => setC({ ...c, [k.id]: c[k.id] === n ? undefined : n })}>${n}</button>`)}</div></div>`)}</div>
      <div class="wb-row" style="justify-content:flex-end"><${Btn} onClick=${close}>Abbrechen<//><${Btn} variant="primary" icon="check" data-confirm onClick=${async () => { await onSave(c); toast('Kriterien gespeichert'); close(); }}>Speichern<//></div>`;
  } });
}

function RatingBar({ state, version, level, route, compact }) {
  const t = levelTarget(level, route, state);
  const key = `${version.id}|${level}|${t.target}`;
  const [ratings, setRatings] = useState(() => ls.get(RATINGS_KEY, {}));
  const r = ratings[key] || { rating: 0, favorite: false };
  const save = async (patch) => {
    const next = { ...r, ...patch }; const all = { ...ls.get(RATINGS_KEY, {}), [key]: next }; ls.set(RATINGS_KEY, all); setRatings(all);
    await sendFeedback({ version: version.id, versionName: version.name, level, target: t.target, targetName: t.targetName, rating: next.rating, favorite: next.favorite, criteria: next.criteria });
  };
  const nCrit = Object.values(r.criteria || {}).filter(Boolean).length;
  return html`<div class=${cx('ln-rate', compact && 'ln-rate--compact')}>
    <${Stars} value=${r.rating} onChange=${(n) => save({ rating: n })} size=${compact ? 22 : 18} />
    <button type="button" class=${cx('ln-fav', r.favorite && 'is-on')} aria-pressed=${String(!!r.favorite)} aria-label="Favorit" onClick=${() => save({ favorite: !r.favorite })}><${Icon} name="heart" size=${18} /></button>
    <button type="button" class=${cx('ln-fav', nCrit > 0 && 'is-on')} aria-label=${`Kriterien bewerten${nCrit ? ` (${nCrit} von 5)` : ''}`} title="Kriterien bewerten" onClick=${() => criteriaDialog({ version, level, route, state, current: r.criteria, onSave: (criteria) => save({ criteria }) })} data-qa="ln-criteria"><${Icon} name="sliders-horizontal" size=${17} /></button>
    <${IconBtn} icon="message-square" label="Kommentar" onClick=${() => commentDialog({ version, level, route, state })} />
    <${Btn} size="sm" variant="primary" icon="check" onClick=${() => chooseDialog({ state, version, level, route })}>${compact ? 'Nehmen' : 'Übernehmen'}<//>
  </div>`;
}

// ------------------------------------------------------------ QR-Code ---
function QrCode({ text, size = 180 }) {
  const svg = useMemo(() => { const q = qrcode(0, 'M'); q.addData(text); q.make(); return q.createSvgTag({ cellSize: 4, margin: 2, scalable: true }); }, [text]);
  return html`<div class="ln-qr" style=${`width:${size}px;height:${size}px`} dangerouslySetInnerHTML=${{ __html: svg }} role="img" aria-label=${`QR-Code für ${text}`}></div>`;
}
async function qrDialog() {
  let info = null; try { info = await (await apiFetch('/api/network')).json(); } catch { /* ohne Server */ }
  const lanBound = info && info.boundTo && !/^(127\.|::1|::ffff:127\.)/.test(info.boundTo);
  openDialog({ title: 'Auf dem Handy öffnen', size: 'wide', body: () => html`<div class="wb-col" style="gap:14px">
    ${!info ? html`<p class="wb-muted">Kein Server erreichbar. Starte die Workbench mit <span class="wb-mono">npm run lan</span>.</p>`
      : !lanBound ? html`<div class="wb-banner wb-banner--warn"><${Icon} name="alert-triangle" size=${16} /><span>Der Server ist nur auf diesem Rechner erreichbar. Für das Handy mit <span class="wb-mono">npm run lan</span> neu starten (gleiches WLAN, ggf. Windows-Firewall für Node erlauben).</span></div>` : null}
    ${info?.lan?.length ? html`<div class="wb-row wb-wrap" style="gap:24px;align-items:flex-start">${info.lan.map((u) => { const link = `${u}/launcher.html${info.pin ? `?k=${info.pin}` : ''}`; return html`<div class="wb-col" style="align-items:center;gap:8px"><${QrCode} text=${link} /><span class="wb-mono wb-small">${link}</span></div>`; })}</div>` : info ? html`<p class="wb-muted">Keine WLAN-Adresse gefunden.</p>` : null}
    <p class="wb-small wb-muted">Auf dem Handy: QR-Code scannen → Launcher öffnet im Vollbild. Über das Browser-Menü „Zum Startbildschirm hinzufügen“ wirkt er wie eine App. Bewertungen und Kommentare vom Handy landen in der Workbench (Demo & Entscheidung › Feedback). Das Handy kann nichts anderes verändern.${info?.pin ? ` Der Link enthält die WLAN-PIN ${info.pin} – ohne sie nimmt der Server von anderen Geräten nichts an (neue PIN bei jedem Start von npm run lan).` : ''}</p></div>` });
}

// ------------------------------------------------------------- Launcher ---
function Launcher({ initialState }) {
  const [state, setState] = useState(initialState);
  useEffect(() => (store ? store.subscribe((s) => setState(s)) : undefined), []);
  const versions = useMemo(() => listVersions(state), [state.directions]);
  const prefs0 = ls.get(PREFS_KEY, {});
  const [selected, setSelected] = useState(() => (prefs0.selected || versions.filter((v) => v.kind === 'direction').map((v) => v.id)).filter((id) => versions.some((v) => v.id === id)).slice(0, 4));
  const [deviceId, setDeviceId] = useState(prefs0.deviceId || 'iphone-15');
  const [landscape, setLandscape] = useState(!!prefs0.landscape);
  const [themeMode, setThemeMode] = useState(prefs0.themeMode || 'version');
  const [coupled, setCoupled] = useState(prefs0.coupled ?? true);
  const [level, setLevel] = useState(prefs0.level || 'feature');
  const [privacy, setPrivacy] = useState(!!prefs0.privacy);
  const [scenario, setScenario] = useState(prefs0.scenario || 'alltag');
  const [offline, setOffline] = useState(!!prefs0.offline);
  const [textScale, setTextScale] = useState(prefs0.textScale || 1);
  const [shellMode, setShellMode] = useState(prefs0.shellMode || 'version');
  const [resetKey, setResetKey] = useState(0); // „Demo zurücksetzen“: neue Revision → Welt und Verlauf frisch
  const live = !navigator.webdriver; // in automatisierten Tests bleibt die Uhr fest (deterministische Screenshots)
  fbCtx = { scenario, stateRev: state.meta?.rev || 0, env: [offline && 'offline', privacy && 'privacy', textScale !== 1 && `schrift-${Math.round(textScale * 100)}`].filter(Boolean).join(',') || undefined };
  const [present, setPresent] = useState(false);
  const [mobileIdx, setMobileIdx] = useState(0);
  const [routes, setRoutes] = useState({});
  const [vw, setVw] = useState(window.innerWidth); const [vh, setVh] = useState(window.innerHeight);
  const frames = useRef({});
  const mobile = vw < 760;
  useEffect(() => { const on = () => { setVw(window.innerWidth); setVh(window.innerHeight); }; window.addEventListener('resize', on); return () => window.removeEventListener('resize', on); }, []);
  useEffect(() => { ls.set(PREFS_KEY, { selected, deviceId, landscape, themeMode, coupled, level, privacy, scenario, offline, textScale, shellMode }); }, [selected, deviceId, landscape, themeMode, coupled, level, privacy, scenario, offline, textScale, shellMode]);
  useEffect(() => { flushQueue(); }, []);

  const baseDevice = launcherDevice(deviceId);
  // Querformat: Breite/Höhe tauschen; Statusleiste schmaler, Kamera-Aussparung entfällt (liegt seitlich)
  const canRotate = baseDevice.group !== 'desktop';
  const device = landscape && canRotate ? { ...baseDevice, width: baseDevice.height, height: baseDevice.width, statusBar: Math.min(baseDevice.statusBar, 24), homeBar: Math.min(baseDevice.homeBar, 10), cutout: 'none' } : baseDevice;
  const shown = mobile ? [versions.find((v) => v.id === selected[mobileIdx % Math.max(1, selected.length)]) || versions[0]] : selected.map((id) => versions.find((v) => v.id === id)).filter(Boolean);
  const payloads = useMemo(() => Object.fromEntries(shown.map((v) => [v.id, buildAppPayload(state, v.id, { theme: themeMode === 'version' ? undefined : themeMode, revision: 1 + resetKey, privacy, scenario, env: { offline, scale: textScale }, shell: shellMode === 'version' ? undefined : shellMode, live })])), [state, shown.map((v) => v.id).join(), themeMode, privacy, scenario, offline, textScale, shellMode, resetKey]);

  // Handy: Android-/Browser-Zurück geht in der App eine Ebene zurück statt den Launcher zu verlassen.
  const depthRef = useRef(1);
  useEffect(() => {
    if (!mobile) return undefined;
    const onPop = () => { const el = Object.values(frames.current).find(Boolean); if (depthRef.current > 1 && el?.contentWindow?.__taktPreview?.back) el.contentWindow.__taktPreview.back(); };
    window.addEventListener('popstate', onPop); return () => window.removeEventListener('popstate', onPop);
  }, [mobile]);

  const onRoute = useCallback((vid) => (r) => {
    if (mobile) { if ((r.depth || 1) > depthRef.current) history.pushState({ takt: r.depth }, ''); depthRef.current = r.depth || 1; }
    setRoutes((rs) => ({ ...rs, [vid]: r }));
    // Gekoppelt werden nur Wechsel, die der Nutzer in diesem Rahmen ausgelöst hat – keine Startrouten, keine
    // rahmenspezifischen Seiten (Launchpad) und keine selbst weitergereichten Navigationen (kein Pingpong).
    if (coupled && !r.initial && !r.external && !r.shellPage) for (const [id, el] of Object.entries(frames.current)) if (id !== vid && el?.contentWindow?.__taktPreview?.navigate) el.contentWindow.__taktPreview.navigate(r.featureId);
  }, [coupled, mobile]);

  useEffect(() => {
    const on = (e) => {
      if (/input|textarea|select/i.test(document.activeElement?.tagName || '')) return;
      if (e.key === 'p' || e.key === 'P') setPresent((x) => !x);
      if (mobile && e.key === 'ArrowRight') setMobileIdx((i) => i + 1);
      if (mobile && e.key === 'ArrowLeft') setMobileIdx((i) => (i - 1 + selected.length) % selected.length);
      if (e.key === 'Escape') setPresent(false);
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      // 1–4: Version wählen (Handy) bzw. ein-/ausblenden (Laptop) · T: Theme durchschalten · B: Beträge ausblenden
      const n = Number(e.key);
      if (n >= 1 && n <= 4) {
        if (mobile) { if (n <= selected.length) setMobileIdx(n - 1); return; }
        const keyed = [...versions.filter((x) => x.kind === 'direction'), versions.find((x) => x.id === 'mix')].filter(Boolean); // 1–3 Richtungen, 4 Meine Auswahl
        const v = keyed[n - 1]; if (!v) return;
        const pos = (id) => versions.findIndex((x) => x.id === id);
        setSelected((s) => (s.includes(v.id) ? (s.length > 1 ? s.filter((x) => x !== v.id) : s) : [...s, v.id].sort((a, c) => pos(a) - pos(c)).slice(-4)));
        toast(`${v.name}: ${selected.includes(v.id) ? (selected.length > 1 ? 'ausgeblendet' : 'bleibt sichtbar (mindestens eine Version)') : 'eingeblendet'}`);
      }
      if (e.key === 't' || e.key === 'T') setThemeMode((m) => { const all = ['version', ...THEME_IDS]; const next = all[(all.indexOf(m) + 1) % all.length]; toast(next === 'version' ? 'Theme: je Version' : `Theme: ${themes[next]?.label || next}`); return next; });
      if ((e.key === 'r' || e.key === 'R') && !mobile) setLandscape((x) => { toast(x ? 'Hochformat' : 'Querformat'); return !x; });
      if (e.key === 'b' || e.key === 'B') setPrivacy((x) => { toast(x ? 'Beträge sichtbar' : 'Beträge ausgeblendet'); return !x; });
    };
    window.addEventListener('keydown', on); return () => window.removeEventListener('keydown', on);
  }, [mobile, selected, versions]);

  const toggleVersion = (id) => setSelected((s) => (s.includes(id) ? (s.length > 1 ? s.filter((x) => x !== id) : s) : [...s, id].slice(-4)));
  const routeText = (vid) => { const r = routes[vid]; if (r?.shellPage) return 'Übersicht (Launchpad)'; const f = state.features.find((x) => x.id === r?.featureId); const m = state.modules.find((x) => x.id === r?.moduleId); return f ? `${m?.name} › ${f.name}` : 'Start'; };

  // ---- Handy: Vollbild + schwebender Versionsschalter ----
  if (mobile) {
    const v = shown[0]; const n = selected.length;
    const sheet = () => openDialog({ title: 'Version & Bewertung', body: ({ close }) => html`<div class="wb-col" style="gap:12px">
      <div class="wb-col" style="gap:6px">${versions.map((x) => html`<button type="button" class=${cx('ln-vrow', x.id === v.id && 'is-active')} onClick=${() => { if (!selected.includes(x.id)) setSelected([...selected, x.id].slice(-4)); setMobileIdx(Math.max(0, [...selected, x.id].slice(-4).indexOf(x.id))); close(); }}>
        <span class="ln-vrow__icon"><${Icon} name=${x.icon} size=${18} /></span><span class="wb-grow"><strong>${x.name}</strong><span class="wb-small wb-muted" style="display:block">${x.claim}</span></span>${x.id === v.id && html`<${Icon} name="check" size=${18} />`}</button>`)}</div>
      <div class="wb-label">Bewerten · ${LEVELS.find((l) => l.id === level)?.label}</div>
      <${Seg} value=${level} onChange=${setLevel} options=${LEVELS.slice(0, 3).map((l) => ({ value: l.id, label: l.label }))} />
      <${RatingBar} state=${state} version=${v} level=${level} route=${routes[v.id]} compact />
      <div class="wb-label">Szenario & Umgebung</div>
      <${Seg} value=${scenario} onChange=${(x) => { setScenario(x); close(); }} options=${SCENARIOS.map((x) => ({ value: x.id, label: x.label, icon: x.icon, title: x.hint }))} label="Szenario" />
      <div class="wb-row wb-wrap" style="gap:8px">
        <${Btn} icon=${privacy ? 'eye' : 'eye-off'} onClick=${() => { setPrivacy(!privacy); close(); }}>${privacy ? 'Beträge zeigen' : 'Beträge ausblenden'}<//>
        <${Btn} icon="wifi-off" pressed=${offline} onClick=${() => { setOffline(!offline); close(); }}>${offline ? 'Online' : 'Offline'}<//>
        <${Select} value=${String(textScale)} onChange=${(x) => { setTextScale(Number(x)); close(); }} options=${[{ value: '1', label: 'Schrift 100 %' }, { value: '1.3', label: 'Schrift 130 %' }, { value: '2', label: 'Schrift 200 %' }]} aria-label="Schriftgröße" />
        <${Btn} icon="rotate-ccw" onClick=${() => { setResetKey((k) => k + 1); close(); toast('Demo zurückgesetzt'); }}>Demo zurücksetzen<//></div></div>` });
    return html`<div class="ln-mobile">
      <${DeviceFrame} key=${v.id} bare device=${device} payload=${payloads[v.id]} onRoute=${onRoute(v.id)} frameRef=${(el) => { frames.current[v.id] = el; }} />
      <div class="ln-fab">
        ${n > 1 && html`<button type="button" aria-label="Vorherige Version" onClick=${() => setMobileIdx((i) => (i - 1 + n) % n)}><${Icon} name="chevron-left" size=${18} /></button>`}
        <button type="button" class="ln-fab__name" onClick=${sheet} aria-label="Version wählen und bewerten"><${Icon} name=${v.icon} size=${15} /><span>${v.name}</span></button>
        ${n > 1 && html`<button type="button" aria-label="Nächste Version" onClick=${() => setMobileIdx((i) => (i + 1) % n)}><${Icon} name="chevron-right" size=${18} /></button>`}
      </div><${OverlayHost} /></div>`;
  }

  // ---- Laptop: Versionen nebeneinander ----
  const headerH = present ? 0 : 112, footerH = present ? 12 : 118;
  const pad = device.group === 'desktop' ? 0 : 22;
  const availW = (vw - 48 - (shown.length - 1) * 28) / shown.length, availH = vh - headerH - footerH - 36;
  const scale = Math.min(1, availW / (device.width + pad), availH / (device.height + pad));
  return html`<div class=${cx('ln', present && 'ln--present')}>
    ${!present && html`<header class="ln-head">
      <div class="ln-head__row">
        <div class="ln-brand"><span class="wb-brand__logo">T</span><div><div class="ln-brand__name">TAKT Demo-Launcher</div><div class="wb-xs wb-subtle">${state.meta.project} · ${Object.keys(payloads[shown[0]?.id]?.features || {}).length} Screens · ${state.modules.filter((m) => !m.archived).length} Module</div></div></div>
        <div class="ln-versions" role="group" aria-label="Versionen">${versions.map((v) => { const cov = versionCoverage(state, v.id); const on = selected.includes(v.id);
          return html`<button type="button" class=${cx('ln-vchip', on && 'is-on')} aria-pressed=${String(on)} onClick=${() => toggleVersion(v.id)} title=${`${v.claim}${v.kind === 'direction' ? ` · ${cov.own}/${cov.total} Features mit eigener Variante` : ''}`} data-version=${v.id}>
            <${Icon} name=${v.icon} size=${15} /><span>${v.name}</span>${v.kind === 'direction' && html`<span class=${cx('ln-vchip__cov', cov.ratio < 0.6 && 'is-low')} title=${cov.ratio < 0.6 ? 'Unter 60 % eigene Varianten – Vergleich nur eingeschränkt aussagekräftig' : ''}>${Math.round(cov.ratio * 100)} %</span>`}</button>`; })}</div>
        <span class="wb-grow"></span>
        <${Btn} size="sm" icon="smartphone" onClick=${qrDialog}>Aufs Handy<//>
        ${LOCAL && html`<a class="wb-btn wb-btn--sm" href="./#/decide"><${Icon} name="layout-dashboard" size=${14} />Workbench<//>`}
      </div>
      <div class="ln-head__row ln-head__row--tools">
        <${Select} size="sm" style="width:auto" value=${deviceId} onChange=${setDeviceId} options=${LAUNCHER_DEVICES.map((d) => ({ value: d.id, label: `${d.label} · ${d.width}×${d.height}` }))} aria-label="Gerät" />
        ${canRotate && html`<${IconBtn} icon="rotate-cw" label=${landscape ? 'Hochformat (R)' : 'Querformat (R)'} pressed=${landscape} onClick=${() => setLandscape(!landscape)} data-qa="ln-rotate" />`}
        <${Select} size="sm" style="width:auto" value=${themeMode} onChange=${setThemeMode} options=${[{ value: 'version', label: 'Theme: je Version' }, ...THEME_IDS.map((t) => ({ value: t, label: `Theme: ${themes[t].label}` }))]} aria-label="Theme" />
        <${Select} size="sm" style="width:auto" value=${shellMode} onChange=${setShellMode} options=${[{ value: 'version', label: 'Rahmen: je Version' }, ...SHELLS.map((x) => ({ value: x.id, label: `Rahmen: ${x.label}` }))]} aria-label="App-Rahmen" title="App-Rahmen (Navigation) – unabhängig von der Richtung vergleichen" data-qa="ln-shell" />
        <${Btn} size="sm" icon="link-2" pressed=${coupled} onClick=${() => setCoupled(!coupled)} title="Navigation in allen Versionen gleichzeitig">Gekoppelt<//>
        <${Btn} size="sm" icon=${privacy ? 'eye-off' : 'eye'} pressed=${privacy} onClick=${() => setPrivacy(!privacy)} title="Beträge ausblenden (Privatsphäre-Modus)">Beträge<//>
        <${Select} size="sm" style="width:auto" value=${scenario} onChange=${setScenario} options=${SCENARIOS.map((x) => ({ value: x.id, label: `Szenario: ${x.label}` }))} aria-label="Szenario" title=${SCENARIOS.find((x) => x.id === scenario)?.hint} data-qa="ln-scenario" />
        <${Btn} size="sm" icon="wifi-off" pressed=${offline} onClick=${() => setOffline(!offline)} title="Offline-Zustand simulieren" data-qa="ln-offline">Offline<//>
        <${Select} size="sm" style="width:auto" value=${String(textScale)} onChange=${(x) => setTextScale(Number(x))} options=${[{ value: '1', label: 'Schrift 100 %' }, { value: '1.3', label: 'Schrift 130 %' }, { value: '2', label: 'Schrift 200 %' }]} aria-label="Schriftgröße" data-qa="ln-scale" />
        <span class="wb-small wb-muted" style="margin-left:8px">Bewerten auf Ebene</span>
        <${Seg} value=${level} onChange=${setLevel} options=${LEVELS.slice(0, 3).map((l) => ({ value: l.id, label: l.label }))} />
        <span class="wb-grow"></span>
        <${Btn} size="sm" icon="rotate-ccw" onClick=${() => { setResetKey((k) => k + 1); toast('Demo zurückgesetzt – Daten und Verlauf frisch'); }} title="Alle Eingaben der Demo verwerfen (Datenwelt und Navigation neu)" data-qa="ln-reset">Demo zurücksetzen<//>
        <${Btn} size="sm" icon="maximize-2" onClick=${() => setPresent(true)} title="Präsentation (P) · Tasten: 1–3 Kompakt/Visuell/Fokus, 4 Meine Auswahl ein/aus, T Theme, R drehen, B Beträge ausblenden">Präsentation<//>
      </div>
    </header>`}
    ${present && html`<button type="button" class="ln-exit" onClick=${() => setPresent(false)}><${Icon} name="minimize-2" size=${15} />Präsentation beenden (Esc)</button>`}
    <main class="ln-stage">${shown.map((v) => { const cov = v.kind === 'direction' ? versionCoverage(state, v.id) : null; return html`<section class="ln-col" key=${v.id} data-launcher-version=${v.id}>
      ${!present && html`<div class="ln-col__head"><span class=${`ln-dot ln-dot--${v.tone}`}><${Icon} name=${v.icon} size=${14} /></span><strong>${v.name}</strong><span class="wb-small wb-muted wb-trunc">${v.claim}</span></div>`}
      <${DeviceFrame} device=${device} payload=${payloads[v.id]} scale=${scale} onRoute=${onRoute(v.id)} frameRef=${(el) => { frames.current[v.id] = el; }} />
      ${!present && html`<div class="ln-col__foot"><div class="wb-row wb-small" style="gap:6px;justify-content:center"><${Icon} name="map-pin" size=${13} /><span class="wb-trunc">${routeText(v.id)}</span>${cov && html`<${Badge} sq title="Features mit eigener Variante dieser Richtung">${cov.own}/${cov.total}<//>`}</div>
        <${RatingBar} state=${state} version=${v} level=${level} route=${routes[v.id]} /></div>`}
    </section>`; })}</main>
    <${OverlayHost} />
  </div>`;
}

// ----------------------------------------------------------------- Start ---
async function boot() {
  const root = document.getElementById('ln-root');
  try {
    let state;
    if (LOCAL) { store = await import('../workbench/store.js'); state = await store.initStore(); }
    else state = await loadStateStandalone();
    document.documentElement.setAttribute('data-wb-theme', 'dark');
    render(html`<${Launcher} initialState=${state} />`, root);
    document.body.dataset.ready = 'true';
  } catch (e) { console.error(e); root.innerHTML = `<div style="padding:32px;font-family:system-ui;color:#eee">Launcher konnte nicht starten: ${e.message}</div>`; }
  if ('serviceWorker' in navigator && window.isSecureContext) navigator.serviceWorker.register('./sw.js').catch(() => {});
}
boot();
