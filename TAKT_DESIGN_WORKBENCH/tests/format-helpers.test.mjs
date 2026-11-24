// money() und percent() aus library/helpers.js: dünne Schicht über lib/format.js plus Privatsphäre-Maske.
// Prüft alle Signaturvarianten, die in den Komponenten vorkommen, die gleich breite Maske und das echte Minus.
import './_helpers.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { NB, MINUS } from './_helpers.mjs';
import { fmtMoney, fmtPercent, fmtPP, maskMoney } from '../app/src/lib/format.js';
import { money, percent, MASK_PERCENT } from '../app/src/library/helpers.js';

const ctx = { privacy: false };
const priv = { privacy: true };
const VALUES = [0, 0.004, 0.005, 1, 12.5, -12.5, 999.99, 1234.5, 9999.99, 10000, 12345.67, 999999.9, 1234567.89, 9999999.99, -0.01, -1234567.89];

test('money: ohne Optionen identisch zu fmtMoney (de-DE, geschütztes Leerzeichen)', () => {
  for (const v of VALUES) assert.equal(money(ctx, v), fmtMoney(v), `v=${v}`);
  assert.equal(money(ctx, 1234.5), `1.234,50${NB}€`);
  assert.equal(money(ctx, 1234567.89), `1.234.567,89${NB}€`);
  assert.equal(money(ctx, 9999999.99), `9.999.999,99${NB}€`);
});

test('money: ohne ctx, mit null-ctx und ctx ohne privacy funktioniert gleich', () => {
  assert.equal(money(undefined, 5), `5,00${NB}€`);
  assert.equal(money(null, 5), `5,00${NB}€`);
  assert.equal(money({}, 5), `5,00${NB}€`);
});

test('money: digits 0 und digits 2 (häufigste Aufrufe der Komponenten)', () => {
  assert.equal(money(ctx, 1234.5, { digits: 0 }), `1.235${NB}€`);
  assert.equal(money(ctx, 1234.4, { digits: 0 }), `1.234${NB}€`);
  assert.equal(money(ctx, 1234.5, { digits: 2 }), `1.234,50${NB}€`);
  assert.equal(money(ctx, -1999.5, { digits: 0 }), `${MINUS}2.000${NB}€`);
  for (const v of VALUES) assert.equal(money(ctx, v, { digits: 0 }), fmtMoney(v, { cents: false }), `v=${v}`);
});

test('money: sign:true, auch zusammen mit digits', () => {
  assert.equal(money(ctx, 12.5, { sign: true }), `+12,50${NB}€`);
  assert.equal(money(ctx, -12.5, { sign: true }), `${MINUS}12,50${NB}€`);
  assert.equal(money(ctx, 12.5, { sign: true, digits: 0 }), `+13${NB}€`);
  assert.equal(money(ctx, 0, { sign: true }), `0,00${NB}€`);
  assert.equal(money(ctx, -0.001, { sign: true }), `0,00${NB}€`, 'auf 0 gerundet: kein Vorzeichen');
  assert.equal(money(ctx, 12.5, { sign: false }), `12,50${NB}€`);
  assert.equal(money(ctx, 12.5, { sign: undefined }), `12,50${NB}€`);
});

test('money: cents als Boolean, 0, 2 und „auto“', () => {
  assert.equal(money(ctx, 1234.5, { cents: false }), `1.235${NB}€`);
  assert.equal(money(ctx, 1234.5, { cents: true }), `1.234,50${NB}€`);
  assert.equal(money(ctx, 1234.5, { cents: 0 }), `1.235${NB}€`);
  assert.equal(money(ctx, 1234.5, { cents: 2 }), `1.234,50${NB}€`);
  assert.equal(money(ctx, 1500, { cents: 'auto' }), `1.500${NB}€`);
  assert.equal(money(ctx, 1500.004, { cents: 'auto' }), `1.500${NB}€`);
  assert.equal(money(ctx, 1500.5, { cents: 'auto' }), `1.500,50${NB}€`);
  assert.equal(money(ctx, 1234.5, { cents: false, digits: 2 }), `1.235${NB}€`, 'cents hat Vorrang vor digits');
});

test('money: compact (ab 10.000 „Tsd.“/„Mio.“, darunter normal) auch mit digits', () => {
  assert.equal(money(ctx, 12345, { compact: true }), `12,3${NB}Tsd.${NB}€`);
  assert.equal(money(ctx, 9999, { compact: true }), `9.999,00${NB}€`);
  assert.equal(money(ctx, 9999, { compact: true, digits: 0 }), `9.999${NB}€`);
  assert.equal(money(ctx, 15000, { digits: 0, compact: true }), `15,0${NB}Tsd.${NB}€`);
  assert.equal(money(ctx, -1234567, { compact: true, sign: true }), `${MINUS}1,2${NB}Mio.${NB}€`);
  assert.equal(money(ctx, 999999.9, { compact: true }), `1,0${NB}Mio.${NB}€`);
  assert.equal(money(ctx, 15000, { compact: true, digits: 1 }), `15,0${NB}Tsd.${NB}€`, 'compact gilt auch bei digits 1/3');
  assert.equal(money(ctx, 5000, { compact: true, digits: 1 }), `5.000,0${NB}€`);
});

test('money: andere Stellenzahlen (digits 1, 3, 4) behalten Einheit, Minus und Plus', () => {
  assert.equal(money(ctx, 1234.56, { digits: 1 }), `1.234,6${NB}€`);
  assert.equal(money(ctx, 0.5, { digits: 3 }), `0,500${NB}€`);
  assert.equal(money(ctx, -0.12345, { digits: 4 }), `${MINUS}0,1235${NB}€`);
  assert.equal(money(ctx, 2, { digits: 3, sign: true }), `+2,000${NB}€`);
  assert.equal(money(ctx, -0.0001, { digits: 2 }), `0,00${NB}€`);
});

test('money: Währungen, auch in den Zweigen digits ≠ 0/2', () => {
  assert.equal(money(ctx, 10, { currency: 'USD' }), `10,00${NB}$`);
  assert.equal(money(ctx, 10, { currency: 'GBP', digits: 0 }), `10${NB}£`);
  assert.equal(money(ctx, 10.5, { currency: 'CHF', digits: 1 }), `10,5${NB}CHF`);
  assert.equal(money(ctx, 15000, { currency: 'USD', compact: true }), `15,0${NB}Tsd.${NB}$`);
});

test('money: Kurzformen money(ctx, v, 0) und money(ctx, v, true)', () => {
  assert.equal(money(ctx, 1234.5, 0), `1.235${NB}€`);
  assert.equal(money(ctx, 12.5, true), `+12,50${NB}€`);
});

test('money: fehlende und ungültige Werte zeigen „–“, Zahlen als Text werden gelesen', () => {
  for (const v of [null, undefined, NaN, Infinity, 'abc', '']) {
    assert.equal(money(ctx, v), '–', String(v));
    assert.equal(money(ctx, v, { digits: 3 }), '–');
    assert.equal(money(ctx, v, { digits: 0, sign: true }), '–');
  }
  assert.equal(money(ctx, '12.5'), `12,50${NB}€`);
});

test('money: negative Beträge tragen das echte Minus (U+2212), nie den Bindestrich', () => {
  for (const o of [undefined, { digits: 0 }, { digits: 3 }, { sign: true }, { compact: true }, { cents: 'auto' }, { currency: 'USD' }]) {
    for (const v of [-0.6, -5, -1234.5, -1234567.89]) {
      const s = money(ctx, v, o);
      assert.ok(s.startsWith(MINUS), `${s} (${JSON.stringify(o)})`);
      assert.ok(!s.includes('-'), s);
    }
  }
  assert.equal(money(ctx, -1234.5), `${MINUS}1.234,50${NB}€`);
  assert.equal(money(ctx, -0.01), `${MINUS}0,01${NB}€`);
  assert.equal(money(ctx, -0), `0,00${NB}€`);
});

test('money: nach der Zahl steht nur geschütztes Leerzeichen, nie ein normales', () => {
  for (const v of VALUES) for (const o of [undefined, { digits: 0 }, { compact: true }, { digits: 3 }]) {
    const s = money(ctx, v, o);
    assert.ok(!/ /.test(s), `normales Leerzeichen in „${s}“`);
    assert.ok(s.includes(NB), s);
  }
});

test('Privatsphäre: Betrags-Maske ist immer dieselbe Zeichenkette, gleich breit und ohne Rückschluss auf den Wert', () => {
  const expected = `••••${NB}€`;
  const masks = new Set();
  for (const v of VALUES.concat([null, undefined, NaN])) for (const o of [undefined, { digits: 0 }, { sign: true }, { compact: true }, { digits: 3 }, { cents: 'auto' }]) {
    const s = money(priv, v, o);
    masks.add(s);
    assert.ok(!/\d/.test(s), `Ziffer in „${s}“`);
  }
  assert.deepEqual([...masks], [expected]);
  assert.equal(money(priv, 5), maskMoney(fmtMoney(5)));
  assert.equal(money(priv, -1234567.89).length, money(priv, 0.01).length);
});

test('Privatsphäre: Maske behält die Währung, ändert sie aber nicht mit dem Wert', () => {
  assert.equal(money(priv, 5, { currency: 'USD' }), `••••${NB}$`);
  assert.equal(money(priv, 1e9, { currency: 'USD', compact: true }), `••••${NB}$`);
  assert.equal(money(priv, 5, { currency: 'CHF' }), `••••${NB}CHF`);
});

test('Privatsphäre: privacy=false und fehlendes privacy zeigen Beträge', () => {
  assert.equal(money({ privacy: false }, 5), `5,00${NB}€`);
  assert.equal(money({ privacy: 0 }, 5), `5,00${NB}€`);
});

test('percent: Standard mit Vorzeichen und einer Nachkommastelle (wie bisher)', () => {
  assert.equal(percent(ctx, 0.032), `+3,2${NB}%`);
  assert.equal(percent(ctx, -0.032), `${MINUS}3,2${NB}%`);
  assert.equal(percent(ctx, 0), `0,0${NB}%`);
  assert.equal(percent(ctx, 1.5), `+150,0${NB}%`);
  assert.equal(percent(ctx, 0.145), `+14,5${NB}%`);
});

test('percent: sign:false, digits und Kurzform mit Zahl', () => {
  assert.equal(percent(ctx, 0.032, { sign: false }), `3,2${NB}%`);
  assert.equal(percent(ctx, -0.032, { sign: false }), `${MINUS}3,2${NB}%`);
  assert.equal(percent(ctx, 0.07, { sign: false, digits: 0 }), `7${NB}%`);
  assert.equal(percent(ctx, 0.0526, { digits: 2 }), `+5,26${NB}%`);
  assert.equal(percent(ctx, 0.145, { digits: 0, sign: false }), `15${NB}%`);
  assert.equal(percent(ctx, 0.05, 0), `+5${NB}%`);
  for (const v of [0.01, 0.2, 1.234]) assert.equal(percent(ctx, v, { sign: false }), fmtPercent(v));
});

test('percent: auf 0 gerundete Werte tragen kein Vorzeichen, negative das echte Minus', () => {
  assert.equal(percent(ctx, -0.00001), `0,0${NB}%`);
  assert.equal(percent(ctx, 0.00001), `0,0${NB}%`);
  for (const v of [-0.001, -0.5, -12]) {
    const s = percent(ctx, v);
    assert.ok(s.startsWith(MINUS) && !s.includes('-'), s);
  }
});

test('percent: Prozentpunkte (pp:true) heißen „PP“, nie „%“', () => {
  assert.equal(percent(ctx, 0.012, { pp: true }), `+1,2${NB}PP`);
  assert.equal(percent(ctx, -0.025, { pp: true }), `${MINUS}2,5${NB}PP`);
  assert.equal(percent(ctx, 0.01, { pp: true, digits: 0, sign: false }), `1${NB}PP`);
  assert.equal(percent(ctx, 0.012, { pp: true }), fmtPP(0.012));
});

test('percent: fehlende Werte zeigen „–“', () => {
  for (const v of [null, undefined, NaN, 'abc']) assert.equal(percent(ctx, v), '–');
  assert.equal(percent(ctx, '0.05'), `+5,0${NB}%`);
});

test('Privatsphäre: Prozent-Maske ist konstant „•• %“ mit geschütztem Leerzeichen', () => {
  const masks = new Set();
  for (const v of [0, 0.5, -0.032, 12, null, NaN]) for (const o of [undefined, { sign: false }, { digits: 0 }, 2]) masks.add(percent(priv, v, o));
  assert.deepEqual([...masks], [`••${NB}%`]);
  assert.equal(MASK_PERCENT, `••${NB}%`);
  assert.equal(percent(priv, 0.012, { pp: true }), `••${NB}PP`);
});

test('Maske von Betrag und Prozent hat keine normalen Leerzeichen (kein Umbruch zwischen Punkten und Einheit)', () => {
  for (const s of [money(priv, 1), percent(priv, 1), percent(priv, 1, { pp: true })]) assert.ok(!/ /.test(s), s);
});

test('Rückwärtskompatibilität: alle Optionsschlüssel in money()/percent()-Aufrufen der Komponenten werden unterstützt', () => {
  const MONEY_KEYS = new Set(['sign', 'digits', 'cents', 'compact', 'currency']);
  const PERCENT_KEYS = new Set(['sign', 'digits', 'pp']);
  const root = path.resolve(import.meta.dirname, '../app/src/library/components');
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith('.js') ? [path.join(d, e.name)] : []));
  const unknown = [];
  let calls = 0;
  for (const f of walk(root)) {
    const src = fs.readFileSync(f, 'utf8');
    // Aufruf mit Optionsobjekt als drittem Argument: money(ctx, <Ausdruck>, { … })
    for (const m of src.matchAll(/\b(money|percent)\(\s*[\w.]+\s*,\s*((?:[^(){},]|\([^()]*\))+),\s*\{([^{}]*)\}\s*\)/g)) {
      calls += 1;
      const allowed = m[1] === 'money' ? MONEY_KEYS : PERCENT_KEYS;
      let depth = 0, piece = '';
      const pieces = [];
      for (const ch of m[3]) { if ('([{'.includes(ch)) depth += 1; if (')]}'.includes(ch)) depth -= 1; if (ch === ',' && depth === 0) { pieces.push(piece); piece = ''; } else piece += ch; }
      pieces.push(piece);
      for (const p of pieces) {
        const k = /^\s*(\.\.\.)?([A-Za-z_]\w*)/.exec(p);
        if (k && !k[1] && !allowed.has(k[2])) unknown.push(`${path.relative(root, f)}: ${m[1]}(…, { ${k[2]} … })`);
      }
    }
  }
  assert.ok(calls >= 20, `nur ${calls} Aufrufe mit Optionen gefunden – Suchmuster prüfen`);
  assert.deepEqual(unknown, []);
});

test('helpers.js enthält keine eigene Zahlenformatierung mehr (Intl, toLocale*) und keine eingebauten Zeichenketten für Maske', () => {
  const src = fs.readFileSync(path.resolve(import.meta.dirname, '../app/src/library/helpers.js'), 'utf8').replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
  assert.ok(!/Intl\./.test(src) && !/toLocale/.test(src));
  assert.ok(/from '\.\.\/lib\/format\.js'/.test(src));
});
