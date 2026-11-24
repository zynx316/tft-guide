// Ernährung: Barcode-Scan-Simulation – Sucherrahmen, Demo-Codes, manuelle EAN mit Prüfziffer, Treffer/nicht gefunden/Kamera verweigert.
import { html } from '../../../lib/html.js';
import { useState, useEffect } from 'preact/hooks';
import { Card, Button, Icon, Chip, Input, Field, EmptyState } from '../../ui.js';
import { eanValid, num } from './_calc.js';
import { PortionForm, PF_CSS, useLogMeal } from './_portion.js';
import { NU_CSS, LBL_CSS, arr, labelNote } from './_ui.js';

const UNKNOWN = '4099999999993';

export const scanSim = {
  id: 'scan-sim',
  name: 'Barcode-Scan (Simulation)',
  category: 'Ernährung',
  description: 'Simuliert den Barcode-Scanner: Sucherrahmen mit Scanlinie (bei reduzierter Bewegung statisch), Demo-Codes zum Antippen, manuelle EAN-Eingabe mit Prüfziffer und die Zustände Treffer, nicht gefunden und Kamera verweigert.',
  version: '1.1',
  props: [
    { name: 'title', label: 'Titel', type: 'text', default: 'Barcode scannen' },
    { name: 'startMode', label: 'Startzustand', type: 'select', options: ['idle', 'denied'], default: 'idle' },
    { name: 'framed', label: 'In Karte', type: 'boolean', default: true },
  ],
  data: [
    { slot: 'foods', label: 'Lebensmittel', default: 'foods', shape: '{id,name,barcode?,portions[]}[]', required: true },
    { slot: 'diary', label: 'Tagebuch', default: 'diary', shape: 'Einträge', required: true },
  ],
  events: ['scan.start', 'scan.result', 'scan.manual', 'scan.denied', 'food.create', 'quick.open', 'portion.confirm'],
  states: ['empty'],
  css: `${NU_CSS}${PF_CSS}${LBL_CSS}
  .tk-nscan-wrap { display:flex; flex-direction:column; gap:var(--tk-space-3); min-width:0; }
  .tk-nscan { display:flex; flex-direction:column; gap:var(--tk-space-3); min-width:0; }
  .tk-nscan__view { position:relative; aspect-ratio:16/10; max-height:240px; border-radius:var(--tk-radius-lg); background:linear-gradient(160deg, var(--tk-c-surface3), var(--tk-c-surface2)); border:1px solid var(--tk-c-border); display:grid; place-items:center; overflow:hidden; }
  .tk-nscan__frame { position:relative; width:62%; height:56%; } .tk-nscan__frame::before, .tk-nscan__frame::after { content:''; position:absolute; inset:0; border:3px solid var(--tk-c-accent); border-radius:10px; mask:linear-gradient(#000 0 0) top left/22px 22px no-repeat, linear-gradient(#000 0 0) top right/22px 22px no-repeat, linear-gradient(#000 0 0) bottom left/22px 22px no-repeat, linear-gradient(#000 0 0) bottom right/22px 22px no-repeat; }
  .tk-nscan__line { position:absolute; left:6%; right:6%; height:2px; background:var(--tk-c-accent); box-shadow:0 0 12px var(--tk-c-accent); top:50%; animation:tk-nscan-scan 1.8s ease-in-out infinite alternate; }
  @keyframes tk-nscan-scan { from { top:12%; } to { top:88%; } } @media (prefers-reduced-motion: reduce) { .tk-nscan__line { animation:none; } }
  .tk-nscan__hint { position:absolute; bottom:10px; left:0; right:0; text-align:center; font-size:var(--tk-nfs-sm); color:var(--tk-c-text-muted); padding:0 12px; }
  .tk-nscan__torch { position:absolute; top:8px; right:8px; }
  .tk-nscan__chips { display:flex; gap:6px; flex-wrap:wrap; }
  .tk-nscan__manual { display:flex; gap:8px; align-items:flex-end; } .tk-nscan__manual > label { flex:1; min-width:0; }
  .tk-nscan__result { padding:var(--tk-space-3); border-radius:var(--tk-radius-md); border:1px solid var(--tk-c-border); background:var(--tk-c-surface2); }`,
  example: { data: {
    foods: [{ id: 'f-skyr', name: 'Skyr natur', brand: 'Arla', kcal: 63, protein: 11, carbs: 4, fat: 0.2, unit: 'g', barcode: '5710001000115', portions: [{ label: 'Becher (150 g)', g: 150 }] }, { id: 'f-haferflocken', name: 'Haferflocken zart', brand: 'Kölln', kcal: 372, protein: 13.5, carbs: 58.7, fat: 7, unit: 'g', barcode: '4001006000614', portions: [{ label: 'Portion (50 g)', g: 50 }] }],
    diary: [],
  } },
  render: function ScanSim({ props, data, setData, ctx }) {
    const foods = arr(data.foods), withCode = foods.filter((f) => f.barcode);
    const [mode, setMode] = useState(props.startMode === 'denied' ? 'denied' : 'idle');
    const [found, setFound] = useState(null);
    const [code, setCode] = useState('');
    const [manual, setManual] = useState('');
    const [err, setErr] = useState('');
    const [torch, setTorch] = useState(false);
    const [meal] = useLogMeal(ctx);
    useEffect(() => { if (mode !== 'scanning') return undefined; const t = setTimeout(() => finish(code), 650); return () => clearTimeout(t); }, [mode, code]);
    const finish = (c) => { const f = foods.find((x) => x.barcode === c); setFound(f || null); setMode(f ? 'found' : 'notfound'); ctx.emit('scan.result', { code: c, found: !!f }); };
    const scan = (c) => { setCode(c); setErr(''); setMode('scanning'); ctx.emit('scan.start', { code: c }); };
    const submit = () => { const c = manual.replace(/\s/g, ''); ctx.emit('scan.manual', { code: c }); if (!eanValid(c)) { setErr(/^\d{13}$/.test(c) ? 'Die Prüfziffer stimmt nicht. Bitte Ziffern noch einmal prüfen.' : 'Eine EAN hat 13 Ziffern.'); return; } setErr(''); setCode(c); finish(c); };
    const reset = () => { setMode('idle'); setFound(null); setCode(''); setManual(''); setErr(''); };
    const wrap = (b) => (props.framed ? html`<${Card} title=${props.title} icon="scan-barcode">${b}<//>` : b);

    const manualRow = html`<div class="tk-nscan__manual"><${Field} label="EAN eingeben" error=${err}><${Input} value=${manual} onInput=${setManual} inputmode="numeric" placeholder="13 Ziffern" maxlength="13" invalid=${!!err} /><//><${Button} onClick=${submit}>Suchen<//></div>`;
    let body;
    if (mode === 'found' && found) body = html`<div class="tk-nscan"><div class="tk-nscan__result"><${PortionForm} food=${found} ctx=${ctx} setData=${setData} meal=${meal} onDone=${reset} compact /></div><${Button} variant="ghost" icon="scan-line" onClick=${reset}>Weiteren Code scannen<//></div>`;
    else if (mode === 'notfound') body = html`<${EmptyState} icon="search" title="Produkt nicht gefunden" text=${`Der Code ${code} ist nicht in der Datenbank. Lege das Produkt an oder schätze die Kalorien.`} action=${html`<div class="tk-nu-btnrow" style="justify-content:center"><${Button} variant="primary" size="sm" icon="plus" onClick=${() => ctx.emit('food.create', { barcode: code })}>Eigenes Lebensmittel<//><${Button} size="sm" icon="zap" onClick=${() => ctx.emit('quick.open')}>Schnell-Kalorien<//><${Button} size="sm" variant="ghost" onClick=${reset}>Erneut scannen<//></div>`} />`;
    else if (mode === 'denied') body = html`<div class="tk-nscan"><${EmptyState} icon="camera" title="Kamera nicht erlaubt" text="TAKT braucht die Kamera nur zum Scannen. Du kannst sie in den Systemeinstellungen erlauben oder die Nummer unter dem Strichcode eintippen." action=${html`<${Button} size="sm" onClick=${() => { ctx.emit('scan.denied'); ctx.toast('In Einstellungen: Kamera erlauben (Simulation)'); }}>Einstellungen öffnen<//>`} />${manualRow}<${Button} variant="ghost" size="sm" onClick=${reset}>Kamera-Ansicht zeigen<//></div>`;
    else body = html`<div class="tk-nscan"><div class="tk-nscan__view" role="img" aria-label="Sucher: Barcode in den Rahmen halten"><div class="tk-nscan__frame">${mode === 'scanning' ? null : html`<div class="tk-nscan__line"></div>`}</div>
        <${Button} variant="ghost" size="sm" icon="zap" class="tk-nscan__torch" aria-pressed=${String(torch)} aria-label="Taschenlampe" onClick=${() => setTorch(!torch)}>${torch ? 'An' : 'Aus'}<//>
        <div class="tk-nscan__hint">${mode === 'scanning' ? 'Code wird gelesen …' : 'Barcode in den Rahmen halten (Simulation)'}</div></div>
      <div><div class="tk-nu-meta" style="margin-bottom:6px">Demo-Codes antippen</div><div class="tk-nscan__chips">${withCode.slice(0, 5).map((f) => html`<${Chip} icon="barcode" onClick=${() => scan(f.barcode)}>${f.brand || f.name}<//>`)}<${Chip} icon="circle-help" onClick=${() => scan(UNKNOWN)}>Unbekannter Code<//><${Chip} icon="camera" onClick=${() => { setMode('denied'); ctx.emit('scan.denied'); }}>Kamera verweigert<//></div></div>${manualRow}</div>`;
    return wrap(html`<div class="tk-nscan-wrap">${body}${labelNote()}</div>`);
  },
};
export default [scanSim];
