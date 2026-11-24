// Ernährung – reine Berechnungen (ohne UI, auch von Node und der Welt-Datei nutzbar).
// Nährwerte, Tages-/Wochensummen, Bedarfsrechner mit Sicherheits-Stopps, Hinweise.
import { isoDay } from '../../../lib/util.js';
import { fmtNumber } from '../../../lib/format.js';

export const MEALS = [
  { id: 'breakfast', label: 'Frühstück', icon: 'coffee', short: 'Früh' },
  { id: 'lunch', label: 'Mittag', icon: 'utensils', short: 'Mittag' },
  { id: 'dinner', label: 'Abend', icon: 'moon', short: 'Abend' },
  { id: 'snack', label: 'Snacks', icon: 'apple', short: 'Snack' },
];
export const mealInfo = (id) => MEALS.find((m) => m.id === id) || MEALS[3];

export const NUTRIENT_KEYS = ['kcal', 'protein', 'carbs', 'fat', 'fiber', 'sugar', 'salt'];
export const MACROS = [
  { id: 'protein', label: 'Eiweiß', short: 'E', color: 'var(--tk-chart-1)', kcalPerG: 4 },
  { id: 'carbs', label: 'Kohlenhydrate', short: 'KH', color: 'var(--tk-chart-3)', kcalPerG: 4 },
  { id: 'fat', label: 'Fett', short: 'F', color: 'var(--tk-chart-4)', kcalPerG: 9 },
];

export const r1 = (n) => Math.round((Number(n) || 0) * 10) / 10;
export const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
/** Deutsche Zahl: num(1234.5, 1) → „1.234,5“ */
export const num = (n, d = 0) => fmtNumber(Number(n) || 0, { digits: d });
export const kcalStr = (n) => `${num(Math.round(n))} kcal`;
export const gStr = (n, d = 0) => `${num(n, d)} g`;

// ------------------------------------------------------------------ Datum
export const WD = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
export const WD_LONG = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
export const dayOf = (iso) => new Date(`${iso}T12:00:00`);
export const shiftDay = (iso, n) => isoDay(new Date(dayOf(iso).getTime() + n * 86400000));
export const todayIso = (ctx) => isoDay(ctx.today);
export const wdOf = (iso) => WD[dayOf(iso).getDay()];
/** „Di, 24.11.“ */
export const dayLabel = (iso) => { const d = dayOf(iso); return `${WD[d.getDay()]}, ${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.`; };
export const dayShort = (iso) => `${String(dayOf(iso).getDate()).padStart(2, '0')}.${String(dayOf(iso).getMonth() + 1).padStart(2, '0')}.`;
export const hhmm = (d) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
/** Aktuell betrachteter Tag der Übersicht (ctx.ui.day, sonst heute). */
export const viewDay = (ctx) => ctx.ui?.day || todayIso(ctx);

/** Passende Mahlzeit zur Tageszeit (Vorauswahl beim Erfassen). */
export function suggestMeal(ctx) {
  const h = ctx.today.getHours() + ctx.today.getMinutes() / 60;
  return h < 9 ? 'breakfast' : h < 11 ? 'snack' : h < 14 ? 'lunch' : h < 17 ? 'snack' : 'dinner';
}

// -------------------------------------------------------------- Nährwerte
/** Nährwerte eines Lebensmittels (je 100 g hinterlegt) für eine Menge in Gramm. */
export function per(food, grams) {
  const k = (Number(grams) || 0) / 100;
  return {
    kcal: Math.round(food.kcal * k), protein: r1(food.protein * k), carbs: r1(food.carbs * k), fat: r1(food.fat * k),
    fiber: r1((food.fiber || 0) * k), sugar: r1((food.sugar || 0) * k), salt: r2((food.salt || 0) * k), satFat: r1((food.satFat || 0) * k),
  };
}
export const kj = (kcal) => Math.round(kcal * 4.184);
/** Prüft, ob kcal und Makros zusammenpassen (Atwater: 4/4/9, Ballaststoffe ≈ 2). Rückgabe: Abweichung 0..1 */
export function plausibility({ kcal, protein, carbs, fat, fiber = 0 }) {
  const calc = 4 * protein + 4 * carbs + 9 * fat + 2 * fiber;
  if (!kcal && !calc) return 0;
  return Math.abs(calc - kcal) / Math.max(kcal, calc, 1);
}

let eidSeq = 0;
/** Neue ID: bevorzugt ctx.newId (deterministisch je Vorschau-Sitzung), sonst ein eigener Zähler – nie Zufall oder Uhrzeit. */
export const eid = (p = 'e', ctx) => (ctx && typeof ctx.newId === 'function' ? ctx.newId(p) : `${p}~${(++eidSeq).toString(36)}`);

export function entryFromFood(food, grams, { meal, date, time, source = 'search', amount, ctx } = {}) {
  return { id: eid('e', ctx), date, meal, time: time || null, foodId: food.id, name: food.name, amount: amount || `${num(grams)} ${food.unit === 'ml' ? 'ml' : 'g'}`, grams, unit: food.unit === 'ml' ? 'ml' : 'g', ...per(food, grams), source };
}
export function entryQuick({ name, kcal, protein = 0, carbs = 0, fat = 0, meal, date, time, ctx }) {
  return { id: eid('e', ctx), date, meal, time: time || null, foodId: null, name: name || 'Schnell erfasst', amount: 'Schätzung', grams: null, kcal: Math.round(kcal), protein: r1(protein), carbs: r1(carbs), fat: r1(fat), fiber: 0, sugar: 0, salt: 0, source: 'quick' };
}

export const dayEntries = (diary, iso) => (Array.isArray(diary) ? diary : []).filter((e) => e.date === iso);
export function totals(entries = []) {
  const t = { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, salt: 0, count: entries.length };
  for (const e of entries) for (const k of NUTRIENT_KEYS) t[k] += Number(e[k]) || 0;
  return { ...t, kcal: Math.round(t.kcal), protein: r1(t.protein), carbs: r1(t.carbs), fat: r1(t.fat), fiber: r1(t.fiber), sugar: r1(t.sugar), salt: r2(t.salt) };
}
/** Kalorien aus Makros (Anteile am Gesamt-kcal in %). */
export function macroShare(t) {
  const k = { protein: 4 * t.protein, carbs: 4 * t.carbs, fat: 9 * t.fat };
  const sum = k.protein + k.carbs + k.fat || 1;
  return { protein: k.protein / sum, carbs: k.carbs / sum, fat: k.fat / sum };
}

// ------------------------------------------------------------------ Ziele
export const DEFAULT_GOALS = { kcal: 2400, protein: 140, carbs: 291, fat: 75, fiber: 30, water: 2500 };
export const hasGoal = (g) => !!(g && g.kcal > 0);
/** Tagesziel inkl. optionalem Trainingstag-Zuschlag (nur wenn aktiviert). */
export function goalForDay(goals, iso) {
  if (!hasGoal(goals)) return null;
  const train = goals.trainingDays?.includes(wdOf(iso)) && goals.trainingBonus && goals.useTrainingBonus;
  return { ...goals, kcal: goals.kcal + (train ? goals.trainingBonus : 0), isTrainingDay: !!goals.trainingDays?.includes(wdOf(iso)) };
}

export const ACTIVITY = [
  { id: 'sitzend', label: 'Überwiegend sitzend', f: 1.2, example: 'Büro, kaum Sport' },
  { id: 'leicht', label: 'Leicht aktiv', f: 1.375, example: '1–2 Trainings pro Woche' },
  { id: 'aktiv', label: 'Aktiv', f: 1.55, example: '3–4 Trainings pro Woche' },
  { id: 'sehr', label: 'Sehr aktiv', f: 1.725, example: '5–6 Trainings oder körperliche Arbeit' },
];
export const GOAL_TYPES = [
  { id: 'abnehmen', label: 'Abnehmen', icon: 'trending-down', text: 'Sanftes Defizit, Muskeln erhalten' },
  { id: 'halten', label: 'Gewicht halten', icon: 'scale', text: 'Bedarf decken, Energie halten' },
  { id: 'aufbauen', label: 'Aufbauen', icon: 'biceps-flexed', text: 'Kleiner Überschuss für Muskelaufbau' },
  { id: 'gesund', label: 'Gesund essen ohne Zahlen', icon: 'leaf', text: 'Gewohnheiten statt Kalorien' },
];
/** Grundumsatz nach Mifflin-St-Jeor. sex: m | f | x (keine Angabe = Mittelwert). */
export function bmr({ sex = 'm', age, heightCm, weightKg }) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return Math.round(base + (sex === 'm' ? 5 : sex === 'f' ? -161 : -78));
}
export const actFactor = (id) => (ACTIVITY.find((a) => a.id === id) || ACTIVITY[1]).f;
export const tdee = (p) => Math.round(bmr(p) * actFactor(p.activity));
export const KCAL_FLOOR = { m: 1500, f: 1200, x: 1350 };
export const kcalPerKg = 7700;
/** Zielmenge und Sicherheits-Stopps. goalType: abnehmen | halten | aufbauen; pace in kg/Woche (Defizit bzw. Überschuss). */
export function planTarget(p, goalType, pace) {
  const b = bmr(p), t = tdee(p);
  const floor = Math.max(b, KCAL_FLOOR[p.sex] || 1350);
  const maxPace = Math.round(p.weightKg * 0.01 * 100) / 100; // höchstens ca. 1 % Körpergewicht pro Woche
  let target = t, blocked = null, note = null;
  if (goalType === 'abnehmen') {
    if (p.age < 18) { blocked = 'minor'; note = 'Unter 18 Jahren bietet TAKT keine Defizit-Ziele an. Sprich mit einer Ärztin oder einem Arzt.'; }
    else {
      const cap = Math.min(maxPace, 0.75);
      target = Math.round((t - (Math.min(pace, cap) * kcalPerKg) / 7) / 10) * 10;
      if (pace > cap) { blocked = 'pace'; note = `Mehr als ${num(Math.min(maxPace, 0.75), 2)} kg pro Woche ist zu schnell. Das Tempo wurde begrenzt.`; }
      if (target < floor) { blocked = 'floor'; note = `Das Ziel liegt unter deinem Grundumsatz (${num(b)} kcal) bzw. der Untergrenze. TAKT setzt es auf ${num(Math.ceil(floor / 10) * 10)} kcal.`; target = Math.ceil(floor / 10) * 10; }
    }
  } else if (goalType === 'aufbauen') target = Math.round((t + (pace * kcalPerKg) / 7) / 10) * 10;
  else target = Math.round(t / 10) * 10;
  return { bmr: b, tdee: t, floor: Math.ceil(floor / 10) * 10, maxPace, target, deficit: t - target, blocked, note };
}
export const MACRO_PRESETS = [
  { id: 'ausgewogen', label: 'Ausgewogen', protein: 1.4, fatShare: 0.3, text: '1,4 g Eiweiß pro kg, 30 % Fett' },
  { id: 'eiweiss', label: 'Eiweißbetont', protein: 1.8, fatShare: 0.28, text: '1,8 g Eiweiß pro kg, 28 % Fett' },
  { id: 'ausdauer', label: 'Kohlenhydratbetont', protein: 1.3, fatShare: 0.25, text: '1,3 g Eiweiß pro kg, 25 % Fett' },
];
export function macrosFor(kcal, weightKg, preset) {
  const protein = Math.round(weightKg * preset.protein);
  const fat = Math.round((kcal * preset.fatShare) / 9);
  const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4));
  return { protein, fat, carbs };
}

// -------------------------------------------------------------- Auswertung
export const inCorridor = (kcal, goal, tol = 0.1) => goal > 0 && kcal >= goal * (1 - tol) && kcal <= goal * (1 + tol);
export const avg = (list, key) => (list.length ? list.reduce((a, x) => a + (Number(x[key]) || 0), 0) / list.length : 0);
/** Tageszeile für die Auswertung. */
export function daySummary(diary, iso) { const es = dayEntries(diary, iso); return { date: iso, logged: es.length > 0, ...totals(es) }; }

// ------------------------------------------------------------------ EAN-13
export function eanCheckDigit(d12) { let s = 0; for (let i = 0; i < 12; i++) s += Number(d12[i]) * (i % 2 ? 3 : 1); return (10 - (s % 10)) % 10; }
export const ean13 = (d12) => `${d12}${eanCheckDigit(d12)}`;
export const eanValid = (code) => /^\d{13}$/.test(code) && eanCheckDigit(code.slice(0, 12)) === Number(code[12]);

// ------------------------------------------------------------------ Hinweise
/**
 * Konstruktive Tageshinweise (nie wertend). Rückgabe nach Priorität sortiert.
 * in: { goals, entries, plan (heutige Planpunkte offen), water, foods, today, nextTraining }
 */
export function buildHints({ goals, entries, plannedToday = [], waterMl = 0, foods = [], hour = 9.5, trainingTomorrow = false, viewIsToday = true }) {
  const out = [];
  if (!hasGoal(goals)) return [{ id: 'nogoal', tone: 'info', icon: 'target', title: 'Noch kein Ziel gesetzt', text: 'Mit dem Assistenten legst du Kalorien- und Eiweißziel in drei Schritten fest.', action: { label: 'Ziel festlegen', event: 'goals.open' } }];
  const t = totals(entries);
  const planned = totals(plannedToday);
  const left = goals.kcal - t.kcal;
  const protLeft = Math.max(0, Math.round(goals.protein - t.protein));
  if (left < -goals.kcal * 0.05 && viewIsToday) out.push({ id: 'over', tone: 'info', icon: 'sparkles', title: 'Heute etwas über dem Ziel', text: 'Kein Problem – der Wochenschnitt zählt, nicht ein einzelner Tag.' });
  if (protLeft > 15) {
    const pick = [...foods].filter((f) => f.fav && f.protein >= 10 && f.kcal < 160).sort((a, b) => b.protein / b.kcal - a.protein / a.kcal)[0] || foods.find((f) => f.protein >= 10);
    const portion = pick ? [...(pick.portions || [])].filter((p) => (pick.kcal * p.g) / 100 <= 260).sort((a, b) => b.g - a.g)[0] || pick.portions?.[0] : null;
    const gain = pick && portion ? Math.round((pick.protein * portion.g) / 100) : 0;
    out.push({ id: 'protein', tone: 'accent', icon: 'beef', title: `Eiweiß: noch ${protLeft} g`, text: pick && gain ? `${pick.name} (${portion.g} ${pick.unit === 'ml' ? 'ml' : 'g'}) bringt ${gain} g – passt gut.` : 'Quark, Skyr oder Hüttenkäse sind unkomplizierte Quellen.', action: pick ? { label: `${pick.name.split(' ')[0]} erfassen`, event: 'hint.log', foodId: pick.id, grams: portion?.g || 100 } : null });
  }
  if (viewIsToday && planned.count) out.push({ id: 'plan', tone: 'success', icon: 'calendar-check', title: `Noch geplant: ${num(planned.kcal)} kcal`, text: `Mit dem Plan landest du bei etwa ${num(t.kcal + planned.kcal)} kcal – ${t.kcal + planned.kcal <= goals.kcal * 1.05 ? 'das passt zum Ziel' : 'etwas über dem Ziel, das ist in Ordnung'}.` });
  const expected = Math.min(1, Math.max(0.15, (hour - 6) / 14));
  if (viewIsToday && waterMl < goals.water * expected * 0.7) out.push({ id: 'water', tone: 'info', icon: 'droplets', title: 'Zeit für ein Glas Wasser', text: `${num(waterMl)} von ${num(goals.water)} ml – ein Glas (250 ml) reicht für den Anfang.`, action: { label: '+250 ml', event: 'hint.water', ml: 250 } });
  if (trainingTomorrow) out.push({ id: 'training', tone: 'accent', icon: 'dumbbell', title: 'Morgen ist Trainingstag', text: 'Plane Kohlenhydrate vor dem Training ein, zum Beispiel Haferflocken mit Banane.' });
  if (t.fiber < goals.fiber * 0.4 && hour > 12) out.push({ id: 'fiber', tone: 'neutral', icon: 'leaf', title: 'Ballaststoffe', text: 'Gemüse, Haferflocken oder Vollkornbrot bringen sie unkompliziert dazu.' });
  return out;
}

// ------------------------------------------------------------ Tagesansicht
/** Alles Wichtige für den betrachteten Tag (Ziel, Summen, Rest, geplante Punkte). */
export function dayView(ctx, { goals, diary, plan } = {}) {
  const iso = viewDay(ctx), isToday = iso === todayIso(ctx);
  const goal = goalForDay(goals, iso);
  const entries = dayEntries(diary, iso);
  const t = totals(entries);
  const plannedItems = isToday ? (Array.isArray(plan) ? plan : []).filter((p) => p.date === iso && p.status === 'planned') : [];
  const planned = totals(plannedItems.map((p) => ({ kcal: p.kcal, protein: p.protein, carbs: p.carbs, fat: p.fat })));
  const left = goal ? goal.kcal - t.kcal : 0;
  return { iso, isToday, goal, entries, t, left, plannedItems, planned, over: !!goal && left < -goal.kcal * 0.03, reached: !!goal && Math.abs(left) <= goal.kcal * 0.03 };
}
