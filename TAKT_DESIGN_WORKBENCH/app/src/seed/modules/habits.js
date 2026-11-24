// Modul "Gewohnheiten" – Seed-Manifest. Referenztag: Di, 24.11.2026 09:30 (ctx.today).
// Eigene Daten (Gewohnheiten, Routinen, Hinweise) – Verläufe werden deterministisch erzeugt (kein Zufall zur Laufzeit).
// Die Daten werden auch vom Start-Modul genutzt (home.js importiert sie).

// --- Datenerzeugung (reines JS, ohne UI-Importe) --------------------------------------------------------------
const pad = (n) => String(n).padStart(2, '0');
const keyOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parse = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
const add = (k, n) => { const d = parse(k); d.setDate(d.getDate() + n); return keyOf(d); };
const wd = (k) => (parse(k).getDay() + 6) % 7;
const END = '2026-11-23', TODAY = '2026-11-24';
const lcg = (seed) => { let s = seed >>> 0; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; };

/** recent: Muster der letzten Tage bis gestern (d = erledigt, p = teilweise, m = verpasst); davor zufällig nach Quote. */
function build({ since, rate, recent = '', days = null, goal = null, seed, partial = 0.08 }) {
  const rnd = lcg(seed), log = {}, start = add(END, -(recent.length - 1));
  for (let k = since; k <= END; k = add(k, 1)) {
    if (days && !days.includes(wd(k))) continue;
    let st;
    if (recent && k >= start) st = recent[Math.round((parse(k) - parse(start)) / 864e5)];
    else { const r = rnd(); st = r < rate ? 'd' : r < rate + partial ? 'p' : 'm'; }
    if (st === 'd') log[k] = goal ? goal.target : 1;
    else if (st === 'p' && goal) log[k] = Math.max(goal.step, Math.floor((goal.target * (0.4 + rnd() * 0.4)) / goal.step) * goal.step);
  }
  return log;
}
/** Krafttraining: 3× pro Woche (Mo/Mi/Fr), die letzten 9 Wochen lückenlos. */
function trainingLog() {
  const rnd = lcg(77), log = {};
  for (let w = '2026-03-02', i = 0; w <= '2026-11-16'; w = add(w, 7), i++) {
    const full = w >= '2026-09-21';
    const n = full ? 3 : rnd() < 0.78 ? 3 : 2;
    [0, 2, 4].slice(0, n).forEach((d) => { log[add(w, d + (rnd() < 0.18 ? 1 : 0))] = 1; });
  }
  log['2026-11-23'] = 1; // Mo: Oberkörper (Push)
  return log;
}

const withToday = (log, v) => ({ ...log, [TODAY]: v });
const W8 = { target: 10, unit: 'Gläser', step: 1 }; // 10 Gläser à 250 ml = 2,5 l (Wasserziel aus Ernährung)
const READ = { target: 20, unit: 'Min.', step: 5 };

export const HABITS = [
  { id: 'h-water', name: 'Wasser trinken', icon: 'droplet', tone: 3, daypart: 'tagsüber', time: '09:00', reminder: true, rhythm: { type: 'daily' }, goal: W8, since: '2026-06-15', link: { module: 'nutrition', label: 'Ernährung' },
    log: withToday(build({ since: '2026-06-15', rate: 0.74, recent: 'dpddmddpdddmddddpdddddd', goal: W8, seed: 11 }), 4), note: 'Ein Glas = 250 ml. Ziel 2,5 Liter.' },
  { id: 'h-vitd', name: 'Vitamin D', icon: 'pill', tone: 4, daypart: 'morgens', time: '07:15', reminder: true, rhythm: { type: 'daily' }, since: '2026-10-01', link: null,
    log: withToday(build({ since: '2026-10-01', rate: 0.96, recent: 'dddddddddddddddddddddddd', seed: 21 }), 1), note: 'Oktober bis März, mit dem Frühstück.' },
  { id: 'h-dehnen', name: 'Dehnen', icon: 'activity', tone: 2, daypart: 'morgens', time: '07:30', reminder: true, rhythm: { type: 'daily' }, since: '2026-08-10', link: null,
    log: build({ since: '2026-08-10', rate: 0.66, recent: 'dmddmdddmddmdddmdmdddmddd', seed: 31 }), note: '10 Minuten: Nacken, Rücken, Hüfte – nach dem Aufstehen.' },
  { id: 'h-plan', name: 'Tagesplanung', icon: 'list-checks', tone: 1, daypart: 'morgens', time: '08:30', reminder: true, rhythm: { type: 'weekdays' }, since: '2026-06-01', link: { module: 'calendar', label: 'Kalender' },
    log: withToday(build({ since: '2026-06-01', rate: 0.86, recent: 'dddddddddddddddddddddddd', days: [0, 1, 2, 3, 4], seed: 41 }), 1), note: 'Top 3 festlegen, Kalender und Aufgaben abgleichen.' },
  { id: 'h-lesen', name: 'Lesen', icon: 'book-open', tone: 5, daypart: 'abends', time: '21:30', reminder: true, rhythm: { type: 'daily' }, goal: READ, since: '2026-07-20', link: null,
    log: build({ since: '2026-07-20', rate: 0.56, recent: 'mdddmpdmdddpmdddmddddmddd', goal: READ, seed: 51 }), note: 'Aktuell: „Die Kunst des guten Handelns“.' },
  { id: 'h-handy', name: 'Kein Handy nach 22 Uhr', icon: 'moon', tone: 6, daypart: 'abends', time: '21:45', reminder: true, rhythm: { type: 'daily' }, since: '2026-09-14', link: null,
    log: build({ since: '2026-09-14', rate: 0.55, recent: 'ddmdmdddmdmmdddmddmdmmdmm', seed: 61 }), note: 'Handy lädt im Flur. Wecker liegt in der Küche.' },
  { id: 'h-training', name: 'Krafttraining', icon: 'dumbbell', tone: 6, daypart: 'abends', time: '18:30', reminder: false, rhythm: { type: 'perWeek', perWeek: 3 }, since: '2026-03-02', link: { module: 'fitness', label: 'Fitness' },
    log: trainingLog(), note: 'Zählt automatisch, sobald ein Training in Fitness abgeschlossen wird.' },
];

export const ROUTINES = [
  { id: 'r-morning', name: 'Morgenroutine', icon: 'sunrise', time: '06:45', steps: [
    { id: 'rm1', title: 'Vitamin D nehmen', minutes: 1, habitId: 'h-vitd' },
    { id: 'rm2', title: 'Kaffee ohne Handy', minutes: 5 },
    { id: 'rm3', title: 'Dehnen', minutes: 10, habitId: 'h-dehnen' },
    { id: 'rm4', title: 'Tagesplanung', minutes: 10, habitId: 'h-plan' },
  ], log: { [TODAY]: ['rm2'] } },
  { id: 'r-evening', name: 'Abendroutine', icon: 'moon', time: '21:30', steps: [
    { id: 're1', title: 'Tagesabschluss', minutes: 5 },
    { id: 're2', title: 'Lesen', minutes: 20, habitId: 'h-lesen' },
    { id: 're3', title: 'Handy weglegen', minutes: 1, habitId: 'h-handy' },
    { id: 're4', title: 'Licht aus', minutes: 1 },
  ], log: {} },
];

export const HABIT_HINTS = [
  { id: 'h-dehnen', tone: 'accent', icon: 'activity', title: 'Dehnen steht noch aus', text: 'Zehn Minuten reichen – danach läuft der Tag leichter.', source: 'Gewohnheiten', module: 'habits', actionLabel: 'Ansehen' },
  { id: 'h-water', tone: 'info', icon: 'droplet', title: 'Wasser: ein Glas jetzt', text: 'Bis zum Mittag sind etwa fünf Gläser ein guter Stand.', source: 'Gewohnheiten · Ernährung', module: 'habits', actionLabel: 'Ansehen' },
  { id: 'h-handy', tone: 'accent2', icon: 'moon', title: 'Gnadentag diese Woche noch frei', text: 'Ein verpasster Abend bricht deine Serie nicht – Pause statt Druck.', source: 'Gewohnheiten', module: 'habits', actionLabel: 'Serie ansehen' },
];

const ALL_VP = ['desktop', 'notebook', 'tablet', 'mobile'];
const demoData = { habits: HABITS, routines: ROUTINES, hints: HABIT_HINTS };
const tpl = [
  { id: 'tpl1', title: 'Wasser trinken', subtitle: '10 Gläser, zählt in Ernährung mit', icon: 'droplet', tone: 'info', badge: 'Beliebt', meta: 'täglich' },
  { id: 'tpl2', title: '10 000 Schritte', subtitle: 'Schrittzähler aus Fitness', icon: 'footprints', tone: 'success', badge: 'Fitness', meta: 'täglich' },
  { id: 'tpl3', title: 'Lesen 20 Min.', subtitle: 'Abends, ohne Bildschirm', icon: 'book-open', tone: 'accent2', badge: 'Abend', meta: 'täglich' },
  { id: 'tpl4', title: 'Meditieren 10 Min.', subtitle: 'Morgens vor dem Handy', icon: 'brain', tone: 'accent', badge: 'Morgen', meta: 'täglich' },
];

// Gesundheitshinweis (docs/HEALTH_GUIDELINES.md, P1): jede Variante trägt eine sachliche Fußnote.
const LEGAL = { id: 'legal', component: 'legal-notice', region: 'footer', props: { kind: 'gesundheit', style: 'footnote' } };
const withLegal = (features, only) => features.map((f) => ((only && !only.includes(f.id)) || !f.variants?.length ? f : { ...f, variants: f.variants.map((v) => (v.blocks.some((b) => b.component === 'legal-notice') ? v : { ...v, blocks: [...v.blocks, LEGAL] })) }));

export default {
  module: {
    id: 'habits', name: 'Gewohnheiten', icon: 'repeat', status: 'active', area: 'Tag & Organisation', theme: 'graphite', designVersion: '0.2', homeFeatureId: 'habits.home',
    description: 'Kleine Gewohnheiten abhaken, Serien mit Gnadentag, Routinen als Abfolge und ein ruhiger Wochenrückblick – ohne Punkte und ohne Druck.',
    source: 'Workbench V2 (Bauplan Brainstorming 24.11.2026) – in Phase 1 gegen das TAKT-Modulregister verifizieren',
    infoArchitecture: 'Einstieg „Heute“ (Gewohnheiten des Tages, nach Tageszeit, abhaken oder hochzählen). Von dort: Gewohnheit antippen → Detail (Serie, Heatmap, Statistik); „Neue Gewohnheit“ → Anlegen; Routinen (Morgen/Abend); Wochenrückblick. Gewohnheiten sind wiederkehrend und strikt von einmaligen Aufgaben getrennt. Verknüpfungen: Fitness (Training zählt), Ernährung (Wasser), Kalender (Tagesplanung), Start (Kachel und Tagesabschluss).',
    docs: [
      '## Leitidee',
      '- Motivation ohne Druck: keine Punkte, kein Ranking, keine Verlustangst. Ein Gnadentag pro Woche (Joker) und Pausentage schützen die Serie.',
      '- Heatmap und Wochenraster sind ohne Farbe lesbar (voll, gestreift, Punkt, „J“ für Gnadentag).',
      '',
      '## Rhythmen',
      '- Täglich, werktags, bestimmte Tage (z. B. Mo/Mi/Fr) und X-mal pro Woche (flexibel). Bei X-mal pro Woche zählt die Serie in Wochen.',
      '- Menge statt Haken: Ziel pro Tag mit Einheit (z. B. 8 Gläser, 20 Min.), Schrittweite für das Hochzählen.',
      '',
      '## Offene Fragen',
      '- Ist Wasser eine Gewohnheit oder gehört der Zähler allein in Ernährung? (Doppelung vermeiden.)',
      '- Erinnerung zu fester Uhrzeit oder in einem Zeitfenster („abends“)?',
    ].join('\n'),
    links: ['home', 'fitness', 'nutrition', 'calendar', 'tasks'],
  },
  features: withLegal([
    // ------------------------------------------------------------------ Heute (Startseite)
    {
      id: 'habits.home', name: 'Heute', group: 'Übersicht', status: 'design',
      purpose: 'Die Gewohnheiten des Tages auf einen Blick: abhaken oder hochzählen, Serien im Blick, Routinen in Reichweite – ruhig und ohne Druck.',
      requirements: [
        { text: 'Gesundheits-Leitplanken 3 (T4, T5): Joker sichtbar, nach einer Unterbrechung „Neustart“ statt Verlustwort, nie Alarmfarbe im Wasser-Kontext', type: 'rule', priority: 'must' },
        { text: 'Gewohnheiten des Tages nach Tageszeit (Morgens, Tagsüber, Abends) mit Fortschritt „x von y“', type: 'info', priority: 'must' },
        { text: 'Abhaken mit einem Tipp; Mengen-Gewohnheiten (Wasser, Lesen) lassen sich mit + und − hochzählen', type: 'action', priority: 'must' },
        { text: 'Serie je Gewohnheit sichtbar, Wochenpunkte zeigen die Woche (auch ohne Farbe lesbar)', type: 'info', priority: 'should' },
        { text: 'Antippen einer Gewohnheit öffnet das Detail, „Neue Gewohnheit“ und Routinen sind erreichbar', type: 'action', priority: 'must' },
        { text: 'Tonalität ohne Druck: Unterbrechungen heißen „Neustart“, der Verlauf bleibt sichtbar; Gnadentag und ruhige Texte', type: 'rule', priority: 'must' },
        { text: 'Leerzustand erklärt die Idee und bietet Vorlagen an; „Heute nichts fällig“ ist ein ruhiger Zustand', type: 'state', priority: 'must' },
      ],
      interactions: [
        { trigger: 'Gewohnheit abhaken', result: 'Haken, Fortschritt und Serie aktualisieren sich', event: 'habit.toggle' },
        { trigger: 'Menge hochzählen (+ / −)', result: 'Zähler und Fortschrittsring ändern sich', event: 'habit.step' },
        { trigger: 'Gewohnheit antippen', result: 'Detail mit Serie, Heatmap und Statistik', event: 'habit.open', to: 'habits.detail' },
        { trigger: '„Gewohnheit anlegen“', result: 'Formular zum Anlegen öffnet sich', event: 'habit.create.open', to: 'habits.create' },
        { trigger: 'Routine öffnen', result: 'Routinen als Abfolge', event: 'routine.open', to: 'habits.routines' },
        { trigger: 'Serie in der Rangliste antippen', result: 'Detail der Gewohnheit', event: 'streak.open', to: 'habits.detail' },
        { trigger: 'Hinweis „Ansehen“', result: 'Detail der betroffenen Gewohnheit', event: 'hint.open.habits', to: 'habits.detail' },
        { trigger: 'Rückblick', result: 'Wochenrückblick öffnet sich', event: 'header.secondary', to: 'habits.review' },
        { trigger: '„Später“ bei der nächsten Gewohnheit', result: 'Nächste Gewohnheit rückt nach, ohne Druck', event: 'habit.snooze' },
      ],
      acceptance: [
        'Jede Gewohnheit des Tages lässt sich mit höchstens einem Tipp abhaken oder um einen Schritt erhöhen.',
        'Nach dem Abhaken ändern sich Haken, „x von y“ und Serie sofort, ohne Seitenwechsel.',
        'Auf 360 px Breite gibt es keinen horizontalen Überlauf und alle Ziele sind mindestens 36 px hoch.',
        'Die Serie zeigt auch ohne Farbe ihren Zustand (Flammen-Zahl, Punktmuster der Woche).',
        'Der Leerzustand nennt mindestens drei Vorlagen und führt zum Anlegen.',
      ],
      flows: [
        { id: 'fl-morgen', name: 'Morgens abhaken', steps: [{ featureId: 'habits.home', action: 'Vitamin D und Dehnen abhaken' }, { featureId: 'habits.home', action: 'Wasser mit „+“ auf 5 Gläser bringen' }] },
        { id: 'fl-detail', name: 'Serie prüfen', steps: [{ featureId: 'habits.home', action: 'Gewohnheit antippen' }, { featureId: 'habits.detail', action: 'Heatmap und Serie ansehen' }] },
      ],
      viewports: ALL_VP, demoData,
      variants: [
        {
          id: 'A', name: 'Liste & Wochenraster', direction: 'kompakt', concept: 'Dichte Tagesliste nach Tageszeit mit Wochenpunkten und Serie in der Zeile, darunter das Wochenraster zum Nachtragen. Seitenspalte: Serien-Rangliste und Routinen als Fortschritt.',
          description: '+ Alles auf einmal, Nachtragen im Raster  − Viele Elemente, auf Mobile lang',
          layout: { type: 'split' },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'Gewohnheiten', title: 'Heute', subtitle: 'Kleine Schritte, die sich summieren', primaryLabel: 'Neu', primaryEvent: 'habit.create.open', secondaryLabel: 'Rückblick', secondaryIcon: 'calendar-check' } },
            { id: 'list', component: 'habit-list', region: 'main', bind: { habits: 'habits' }, props: { title: 'Gewohnheiten heute', style: 'rows', groupBy: 'daypart', showWeek: true, allLabel: '' } },
            { id: 'grid', component: 'habit-week-grid', region: 'main', bind: { habits: 'habits' }, props: { title: 'Wochenraster', editable: true } },
            { id: 'streaks', component: 'streak-panel', region: 'aside', bind: { habits: 'habits' }, props: { mode: 'overview', title: 'Serien', limit: 7 } },
            { id: 'routines', component: 'routine-flow', region: 'aside', bind: { routines: 'routines', habits: 'habits' }, props: { compact: true } },
          ],
        },
        {
          id: 'B', name: 'Ringe & Verlauf', direction: 'visuell', concept: 'Eine Karte je Gewohnheit mit Fortschrittsring und Serie, darunter der Gesamt-Verlauf als Kalender-Heatmap und die Serien-Rangliste. Wenig Text, viel Raum, ein Tipp pro Karte.',
          description: '+ Motivierend, sofort verständlich  − Weniger Gewohnheiten ohne Scrollen sichtbar',
          layout: { type: 'grid' },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'Gewohnheiten', title: 'Heute', subtitle: 'Ein Ring pro Gewohnheit – tippen genügt', primaryLabel: 'Neu', primaryEvent: 'habit.create.open', secondaryLabel: 'Rückblick', secondaryIcon: 'calendar-check' } },
            { id: 'cards', component: 'habit-list', region: 'main', span: 12, spanTablet: 12, bind: { habits: 'habits' }, props: { title: 'Heute', style: 'cards', allLabel: '' } },
            { id: 'heat', component: 'habit-heatmap', region: 'main', span: 7, spanTablet: 12, bind: { habits: 'habits' }, props: { title: 'Dein Verlauf', scope: 'all', mode: 'weeks' } },
            { id: 'streaks', component: 'streak-panel', region: 'main', span: 5, spanTablet: 12, bind: { habits: 'habits' }, props: { mode: 'overview', title: 'Serien', limit: 5 } },
            { id: 'routines', component: 'routine-flow', region: 'main', span: 12, spanTablet: 12, bind: { routines: 'routines', habits: 'habits' }, props: { compact: true } },
          ],
        },
        {
          id: 'C', name: 'Nächste Gewohnheit', direction: 'fokus', concept: 'Eine einzige Aktion zuerst: die passende Gewohnheit für die aktuelle Tageszeit mit großem „Erledigt“. Darunter ruhige Hinweise, Routinen und der Rest als Chips. Erfassen von Wasser ohne Umweg.',
          description: '+ Klare nächste Aktion, wenig Ablenkung  − Weniger Überblick über die ganze Woche',
          layout: { type: 'stack', narrow: true },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { title: 'Jetzt', subtitle: 'Eine Sache nach der anderen', primaryLabel: 'Neu', primaryEvent: 'habit.create.open', secondaryLabel: 'Rückblick', secondaryIcon: 'calendar-check' } },
            { id: 'next', component: 'habit-list', region: 'main', bind: { habits: 'habits' }, props: { title: 'Heute', style: 'next', allLabel: '' } },
            { id: 'hints', component: 'hint-cards', region: 'main', bind: { hints: 'hints' }, props: { title: 'Hinweise', style: 'list', limit: 2, dense: true } },
            { id: 'routines', component: 'routine-flow', region: 'main', bind: { routines: 'routines', habits: 'habits' }, props: { compact: true } },
            { id: 'cap', component: 'quick-capture', region: 'bottom', bind: { habits: 'habits' }, props: { kinds: ['Wasser', 'Notiz'], elevated: true } },
          ],
        },
      ],
      selectedVariantId: 'A',
      links: ['habits.detail', 'habits.create', 'habits.routines', 'habits.review', 'home.today'],
    },
    // ------------------------------------------------------------------ Gewohnheit (Detail)
    {
      id: 'habits.detail', name: 'Gewohnheit', group: 'Gewohnheiten', status: 'design',
      purpose: 'Eine Gewohnheit im Detail: Serie mit Gnadentag, Kalender-Heatmap, Statistik und Wochentags-Muster – verständlich, nicht bewertend.',
      requirements: [
        { text: 'Gesundheits-Leitplanken 3 (T4, T5): Joker sichtbar, nach einer Unterbrechung „Neustart“ statt Verlustwort, nie Alarmfarbe im Wasser-Kontext', type: 'rule', priority: 'must' },
        { text: 'Aktuelle Serie, beste Serie und nächster Meilenstein', type: 'info', priority: 'must' },
        { text: 'Gnadentag: ein verpasster Tag pro Woche bricht die Serie nicht; Status der Woche ist sichtbar', type: 'rule', priority: 'must' },
        { text: 'Kalender-Heatmap (Wochen oder Monat), ohne Farbe lesbar; Tag antippen zeigt Details und erlaubt Nachtragen', type: 'info', priority: 'must' },
        { text: 'Erfüllungsquote 7/30/90 Tage und Wochentags-Muster mit kurzem, freundlichem Fazit', type: 'info', priority: 'should' },
        { text: 'Pausentag einlegen, ohne die Serie zu verlieren', type: 'action', priority: 'should' },
        { text: 'Gewohnheit wechseln ohne Zurück (Chips)', type: 'action', priority: 'could' },
      ],
      interactions: [
        { trigger: 'Gewohnheit per Chip wechseln', result: 'Serie, Heatmap und Statistik zeigen die andere Gewohnheit', event: 'habit.select' },
        { trigger: 'Tag in der Heatmap antippen', result: 'Tagesdetail mit Nachtragen', event: 'heatmap.day' },
        { trigger: '„Heute pausieren“', result: 'Pausentag, Serie bleibt erhalten', event: 'habit.pause' },
        { trigger: 'Ansicht Wochen/Monat', result: 'Heatmap wechselt die Darstellung', event: 'heatmap.mode' },
      ],
      acceptance: [
        'Die Seite zeigt Serie, beste Serie, Quote 30 Tage und Anzahl der Erledigungen ohne Scrollen auf Desktop.',
        'Die Heatmap unterscheidet erledigt, teilweise, verpasst und Gnadentag auch in Graustufen.',
        'Ein Tipp auf „Heute pausieren“ markiert den Tag, die Serie bleibt unverändert.',
        'Der Wochentags-Fazit-Satz nennt den stärksten und den schwersten Tag.',
      ],
      flows: [{ id: 'fl-serie', name: 'Serie nachvollziehen', steps: [{ featureId: 'habits.home', action: 'Gewohnheit antippen' }, { featureId: 'habits.detail', action: 'Heatmap auf Monat stellen, einen Tag antippen' }, { featureId: 'habits.detail', action: 'Wochentags-Muster lesen' }] }],
      viewports: ALL_VP, demoData,
      variants: [
        {
          id: 'A', name: 'Verlauf & Statistik', direction: 'kompakt', concept: 'Serie oben, Monatskalender zum Nachtragen, daneben Statistik mit Quoten und Wochentags-Muster. Gewohnheit per Chip wechselbar.',
          description: '+ Alles zu einer Gewohnheit nebeneinander  − Dichte Seitenspalte',
          layout: { type: 'split' },
          blocks: [
            { id: 'streak', component: 'streak-panel', region: 'main', bind: { habits: 'habits' }, props: { mode: 'selected', showPicker: true, showPause: true } },
            { id: 'heat', component: 'habit-heatmap', region: 'main', bind: { habits: 'habits' }, props: { title: 'Kalender', mode: 'month', scope: 'selected' } },
            { id: 'stats', component: 'habit-insights', region: 'aside', bind: { habits: 'habits' }, props: { title: 'Statistik', scope: 'selected' } },
          ],
        },
        {
          id: 'B', name: 'Heatmap im Mittelpunkt', direction: 'visuell', concept: 'Große Serienanzeige als Held, darunter 26 Wochen als Heatmap, dann Quoten und Wochentags-Balken. Eine Botschaft pro Karte.',
          description: '+ Fortschritt sofort sichtbar, motivierend  − Mehr Scrollen',
          layout: { type: 'stack' },
          blocks: [
            { id: 'streak', component: 'streak-panel', region: 'main', bind: { habits: 'habits' }, props: { mode: 'selected', showPicker: true, showPause: true } },
            { id: 'heat', component: 'habit-heatmap', region: 'main', bind: { habits: 'habits' }, props: { title: 'Verlauf', mode: 'weeks', scope: 'selected' } },
            { id: 'stats', component: 'habit-insights', region: 'main', bind: { habits: 'habits' }, props: { title: 'Statistik', scope: 'selected' } },
          ],
        },
        {
          id: 'C', name: 'Serie & nächster Schritt', direction: 'fokus', concept: 'Nur das Wesentliche: Serie mit Gnadentag und Meilenstein, darunter der Rest des Tages als nächste Aktion. Kein Diagramm-Ballast.',
          description: '+ Schlank, handlungsorientiert  − Wenig Analyse',
          layout: { type: 'stack', narrow: true },
          blocks: [
            { id: 'streak', component: 'streak-panel', region: 'main', bind: { habits: 'habits' }, props: { mode: 'selected', showPicker: true, showPause: true } },
            { id: 'next', component: 'habit-list', region: 'main', bind: { habits: 'habits' }, props: { title: 'Heute', style: 'next', allLabel: 'Alle Gewohnheiten' } },
          ],
        },
      ],
      selectedVariantId: 'A',
      links: ['habits.home', 'habits.review'],
    },
    // ------------------------------------------------------------------ Gewohnheit anlegen
    {
      id: 'habits.create', name: 'Gewohnheit anlegen', group: 'Gewohnheiten', status: 'design',
      purpose: 'Eine neue Gewohnheit in unter einer Minute anlegen: Name, Rhythmus, Erinnerung, Ziel – mit Vorlagen und Vorschau.',
      requirements: [
        { text: 'Pflicht: Name; Rhythmus (täglich, werktags, bestimmte Tage, X-mal pro Woche) und Tageszeit', type: 'rule', priority: 'must' },
        { text: 'Ziel: Abhaken oder Menge zählen (Zielwert, Einheit, Schrittweite)', type: 'action', priority: 'must' },
        { text: 'Erinnerung optional mit Uhrzeit; Gnadentag standardmäßig an', type: 'action', priority: 'should' },
        { text: 'Vorlagen (Wasser, 10 000 Schritte, Lesen …) füllen das Formular vor', type: 'action', priority: 'should' },
        { text: 'Verknüpfung mit Fitness, Ernährung oder Aufgaben, damit Daten automatisch zählen', type: 'action', priority: 'could' },
        { text: 'Verständliche Fehlermeldungen; Vorschau zeigt, wie die Zeile später aussieht', type: 'state', priority: 'should' },
      ],
      interactions: [
        { trigger: 'Gewohnheit anlegen', result: 'Gewohnheit erscheint unter „Heute“, Hinweis „angelegt“', event: 'habit.create', to: 'habits.home' },
        { trigger: 'Ungültige Eingabe', result: 'Fehlermeldung am Feld', event: 'form.invalid' },
        { trigger: 'Vorlage antippen', result: 'Formular wird vorbelegt', event: 'habit.template' },
        { trigger: 'Weiter im geführten Ablauf', result: 'Nächster Schritt', event: 'form.step' },
      ],
      acceptance: [
        'Ohne Namen lässt sich nicht speichern; die Fehlermeldung steht am Feld.',
        'Bei „Bestimmte Tage“ ist mindestens ein Tag Pflicht.',
        'Eine Vorlage füllt Name, Symbol, Tageszeit und Ziel vor; alles bleibt änderbar.',
        'Nach dem Anlegen erscheint die Gewohnheit sofort unter „Heute“.',
      ],
      flows: [{ id: 'fl-neu', name: 'Aus Vorlage anlegen', steps: [{ featureId: 'habits.create', action: 'Vorlage „Lesen 20 Min.“ wählen' }, { featureId: 'habits.create', action: 'Erinnerung 21:30 aktivieren und speichern' }, { featureId: 'habits.home', action: 'Neue Gewohnheit unter „Abends“ sehen' }] }],
      viewports: ALL_VP,
      variants: [
        {
          id: 'A', name: 'Formular mit Vorlagen', direction: 'kompakt', concept: 'Alle Felder auf einer Seite: Vorlagen oben, dann Name, Symbol, Rhythmus, Ziel, Erinnerung – Vorschau direkt darunter.',
          description: '+ Schnell für Geübte, alles sichtbar  − Auf Mobile lang',
          layout: { type: 'stack', narrow: true },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'Gewohnheiten', title: 'Gewohnheit anlegen', subtitle: 'Starte klein – alles lässt sich später ändern', primaryLabel: '' } },
            { id: 'form', component: 'habit-form', region: 'main', bind: { habits: 'habits' }, props: { title: 'Neue Gewohnheit', style: 'form', showTemplates: true, showPreview: true } },
          ],
        },
        {
          id: 'B', name: 'Geführt in 4 Schritten', direction: 'fokus', concept: 'Was – Wie oft – Ziel – Erinnerung, je ein Schritt mit Vorschau. Weniger Auswahl auf einmal, ideal für Mobile.',
          description: '+ Übersichtlich, geringe Hürde  − Mehr Taps für Erfahrene',
          layout: { type: 'stack', narrow: true },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'Gewohnheiten', title: 'Neue Gewohnheit', subtitle: 'In vier kurzen Schritten', primaryLabel: '' } },
            { id: 'form', component: 'habit-form', region: 'main', bind: { habits: 'habits' }, props: { title: 'Schritt für Schritt', style: 'wizard', showTemplates: true, showPreview: true } },
          ],
        },
        {
          id: 'C', name: 'Vorlagen & Vorschau', direction: 'visuell', concept: 'Links das geführte Formular, rechts die Vorlagen-Galerie und die aktuelle Tagesliste, damit man sieht, wo die neue Gewohnheit landet.',
          description: '+ Kontext sichtbar  − Seitenspalte auf Mobile unten',
          layout: { type: 'split' },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'Gewohnheiten', title: 'Gewohnheit anlegen', primaryLabel: '' } },
            { id: 'form', component: 'habit-form', region: 'main', bind: { habits: 'habits' }, props: { title: 'Neue Gewohnheit', style: 'wizard', showTemplates: false, showPreview: true } },
            { id: 'tpl', component: 'item-list', region: 'aside', bind: { items: 'templates' }, props: { title: 'Beliebte Vorlagen', selectable: false, dense: false } },
            { id: 'list', component: 'habit-list', region: 'aside', bind: { habits: 'habits' }, props: { title: 'Heute', style: 'rows', showWeek: false, allLabel: '' } },
          ],
        },
      ],
      selectedVariantId: 'A',
      links: ['habits.home', 'habits.templates'],
      demoData: { ...demoData, templates: tpl },
    },
    // ------------------------------------------------------------------ Routinen
    {
      id: 'habits.routines', name: 'Routinen', group: 'Gewohnheiten', status: 'design',
      purpose: 'Morgen- und Abendroutine als Abfolge von Schritten mit Uhrzeit und Dauer. Schritte können Gewohnheiten sein und zählen dort mit.',
      requirements: [
        { text: 'Routine = geordnete Folge aus Schritten mit Dauer; Startzeit ergibt die Uhrzeit je Schritt', type: 'rule', priority: 'must' },
        { text: 'Schritt abhaken; verknüpfte Gewohnheiten werden gleichzeitig erledigt', type: 'action', priority: 'must' },
        { text: 'Aktueller Schritt ist hervorgehoben; Fortschritt „x von y“', type: 'info', priority: 'must' },
        { text: 'Geführter Modus: ein Schritt nach dem anderen, Überspringen erlaubt', type: 'action', priority: 'should' },
        { text: 'Routine als Kalender-Block planen (später)', type: 'action', priority: 'could' },
        { text: 'Abschluss ruhig bestätigen („Morgenroutine geschafft“)', type: 'state', priority: 'should' },
      ],
      interactions: [
        { trigger: 'Schritt abhaken', result: 'Schritt erledigt, verknüpfte Gewohnheit zählt mit', event: 'routine.step' },
        { trigger: 'Routine abgeschlossen', result: 'Hinweis „geschafft“', event: 'routine.complete' },
        { trigger: 'Weiter nach Abschluss', result: 'Zurück zu „Heute“', event: 'routine.open', to: 'habits.home' },
        { trigger: '„Neu“ im Kopf', result: 'Gewohnheit anlegen', event: 'habit.create.open', to: 'habits.create' },
      ],
      acceptance: [
        'Jeder Schritt zeigt Uhrzeit und Dauer; die Gesamtdauer steht im Kopf der Routine.',
        'Das Abhaken eines Schritts mit Gewohnheit erscheint sofort auch unter „Heute“.',
        'Im geführten Modus lässt sich ein Schritt überspringen, ohne die Routine zu blockieren.',
        'Nach dem letzten Schritt erscheint eine ruhige Bestätigung statt einer Punkteanzeige.',
      ],
      flows: [{ id: 'fl-routine', name: 'Morgenroutine durchgehen', steps: [{ featureId: 'habits.routines', action: 'Geführten Modus starten' }, { featureId: 'habits.routines', action: 'Dehnen und Tagesplanung abschließen' }, { featureId: 'habits.home', action: 'Fortschritt unter „Heute“ sehen' }] }],
      viewports: ALL_VP, demoData,
      variants: [
        {
          id: 'A', name: 'Listen', direction: 'kompakt', concept: 'Beide Routinen als Karten mit nummerierten Schritten, Uhrzeit und Dauer; rechts Serien-Überblick.',
          description: '+ Schnell abzuhaken  − Weniger Gefühl für den zeitlichen Ablauf',
          layout: { type: 'split' },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'Gewohnheiten', title: 'Routinen', subtitle: 'Morgens und abends in fester Reihenfolge', primaryLabel: 'Neu', primaryEvent: 'habit.create.open' } },
            { id: 'flow', component: 'routine-flow', region: 'main', bind: { routines: 'routines', habits: 'habits' }, props: { style: 'list' } },
            { id: 'streaks', component: 'streak-panel', region: 'aside', bind: { habits: 'habits' }, props: { mode: 'overview', title: 'Serien', limit: 5 } },
          ],
        },
        {
          id: 'B', name: 'Zeitstrahl', direction: 'visuell', concept: 'Jede Routine als vertikaler Zeitstrahl mit Uhrzeiten und Punkten – man sieht den Ablauf des Morgens und Abends.',
          description: '+ Ablauf und Dauer sofort verständlich  − Mehr Höhe je Schritt',
          layout: { type: 'stack', narrow: true },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'Gewohnheiten', title: 'Routinen', subtitle: 'Dein Tag als Abfolge', primaryLabel: 'Neu', primaryEvent: 'habit.create.open' } },
            { id: 'flow', component: 'routine-flow', region: 'main', bind: { routines: 'routines', habits: 'habits' }, props: { style: 'timeline' } },
          ],
        },
        {
          id: 'C', name: 'Geführt', direction: 'fokus', concept: 'Die Morgenroutine Schritt für Schritt, ein großer Schritt mit „Erledigt – weiter“. Die Abendroutine bleibt als kompakte Zeile darunter.',
          description: '+ Kein Nachdenken, nächste Aktion klar  − Nur eine Routine zur Zeit im Blick',
          layout: { type: 'stack', narrow: true },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { title: 'Los geht’s', subtitle: 'Ein Schritt nach dem anderen', primaryLabel: '' } },
            { id: 'guide', component: 'routine-flow', region: 'main', bind: { routines: 'routines', habits: 'habits' }, props: { style: 'guided', routineId: 'r-morning' } },
            { id: 'eve', component: 'routine-flow', region: 'main', bind: { routines: 'routines', habits: 'habits' }, props: { compact: true, routineId: 'r-evening' } },
          ],
        },
      ],
      selectedVariantId: 'B',
      links: ['habits.home', 'calendar.recurrence'],
    },
    // ------------------------------------------------------------------ Wochenrückblick
    {
      id: 'habits.review', name: 'Wochenrückblick', group: 'Auswertung', status: 'review',
      purpose: 'Die Woche in Gewohnheiten rückblickend sehen: was gelang, was war schwer, was ändert sich – in zwei Minuten und ohne Bewertung.',
      requirements: [
        { text: 'Gesundheits-Leitplanken 3 (T4, T5): Joker sichtbar, nach einer Unterbrechung „Neustart“ statt Verlustwort, nie Alarmfarbe im Wasser-Kontext', type: 'rule', priority: 'must' },
        { text: 'Erfüllungsquote der gewählten Woche (letzte oder laufende) mit „x von y Tagen“', type: 'info', priority: 'must' },
        { text: 'Am besten / Braucht Liebe, längste Serie, genutzte Gnadentage und Pausentage', type: 'info', priority: 'should' },
        { text: 'Wochenraster zum Nachtragen verpasster Tage', type: 'action', priority: 'must' },
        { text: 'Drei Fragen (Was hat geholfen? Was war schwer? Eine kleine Änderung?) und Speichern als Notiz', type: 'action', priority: 'should' },
        { text: 'Freundliche, neutrale Formulierungen ohne Bewertung („Neustart“, „braucht Aufmerksamkeit“)', type: 'rule', priority: 'must' },
      ],
      interactions: [
        { trigger: 'Woche wechseln (letzte/diese)', result: 'Kennzahlen berechnen sich neu', event: 'review.week' },
        { trigger: 'Kennzahl antippen', result: 'Zurück zu den Gewohnheiten', event: 'review.open.habits', to: 'habits.home' },
        { trigger: 'Als Notiz sichern', result: 'Rückblick gespeichert', event: 'review.save' },
        { trigger: 'Tag im Raster antippen', result: 'Tag wird nachgetragen oder zurückgenommen', event: 'habit.toggle' },
      ],
      acceptance: [
        'Alle Kennzahlen werden aus den Gewohnheitsdaten berechnet (keine festen Zahlen im Bildschirm).',
        'Die Quote der gewählten Woche stimmt mit dem Wochenraster überein.',
        'Das Speichern ist erst möglich, wenn mindestens eine Frage beantwortet ist.',
      ],
      viewports: ALL_VP, demoData,
      variants: [
        {
          id: 'A', name: 'Raster & Liste', direction: 'kompakt', concept: 'Wochenraster der letzten Woche mit Nachtragen, daneben die Kennzahlen als Liste und die Quote je Gewohnheit.',
          description: '+ Dicht, Nachtragen direkt möglich  − Weniger Erzählung',
          layout: { type: 'split' },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'Gewohnheiten', title: 'Wochenrückblick', subtitle: 'Letzte Woche im Überblick', primaryLabel: '' } },
            { id: 'grid', component: 'habit-week-grid', region: 'main', bind: { habits: 'habits' }, props: { title: 'Letzte Woche', startOffset: 1, editable: true } },
            { id: 'rev', component: 'week-review', region: 'aside', bind: { habits: 'habits' }, props: { scope: 'habits', style: 'list', title: 'Kennzahlen', showQuestions: false } },
            { id: 'ins', component: 'habit-insights', region: 'main', bind: { habits: 'habits' }, props: { title: 'Vergleich', scope: 'all' } },
          ],
        },
        {
          id: 'B', name: 'Karten & Verlauf', direction: 'visuell', concept: 'Kennzahlen als Karten, darunter der Gesamtverlauf als Heatmap und die Fragen zum Mitnehmen.',
          description: '+ Erzählend, ruhig  − Nachtragen nur im Raster einen Klick weiter',
          layout: { type: 'stack' },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'Gewohnheiten', title: 'Wochenrückblick', subtitle: 'Was lief gut – ohne Bewertung', primaryLabel: '' } },
            { id: 'rev', component: 'week-review', region: 'main', bind: { habits: 'habits' }, props: { scope: 'habits', style: 'cards', title: 'Deine Woche', showQuestions: true } },
            { id: 'heat', component: 'habit-heatmap', region: 'main', bind: { habits: 'habits' }, props: { title: 'Verlauf', scope: 'all', mode: 'weeks' } },
          ],
        },
        {
          id: 'C', name: 'Rückblick-Ritual', direction: 'fokus', concept: 'Erst die drei Fragen, dann bei Bedarf Nachtragen: ein kurzes Ritual für Sonntagabend.',
          description: '+ In zwei Minuten erledigt  − Weniger Zahlen auf einen Blick',
          layout: { type: 'stack', narrow: true },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { title: 'Wochenrückblick', subtitle: 'Zwei Minuten für dich', primaryLabel: '' } },
            { id: 'rev', component: 'week-review', region: 'main', bind: { habits: 'habits' }, props: { scope: 'habits', style: 'list', title: 'Rückblick', showQuestions: true } },
          ],
        },
      ],
      selectedVariantId: 'B',
      seedHistory: [{ kind: 'draft', note: 'Erster Entwurf mit drei Richtungen' }, { kind: 'review', note: 'Zur Prüfung: Tonalität ohne Druck' }],
    },
    // ------------------------------------------------------------------ Pause & Gnadentag
    {
      id: 'habits.pause', name: 'Pause & Gnadentag', group: 'Gewohnheiten', status: 'design',
      purpose: 'Erklärt und steuert, wie Serien geschützt werden: ein Gnadentag pro Woche, Pausentage bei Krankheit oder Reise.',
      requirements: [
        { text: 'Gnadentag: einmal pro Kalenderwoche wird ein verpasster Tag verziehen (pro Gewohnheit abschaltbar)', type: 'rule', priority: 'must' },
        { text: 'Pausentag: neutral, weder erledigt noch verpasst', type: 'rule', priority: 'must' },
        { text: 'Status der Woche je Gewohnheit sichtbar', type: 'info', priority: 'should' },
      ],
      interactions: [{ trigger: '„Heute pausieren“', result: 'Pausentag eingetragen', event: 'habit.pause' }],
      viewports: ALL_VP, demoData,
      variants: [
        {
          id: 'A', name: 'Erklärt & steuerbar', direction: 'fokus', concept: 'Serien-Anzeige mit Pause-Aktion und ein kurzer Hinweis, wie Gnadentag und Pause funktionieren.',
          description: '+ Klar und beruhigend  − Nur eine Gewohnheit zur Zeit',
          layout: { type: 'stack', narrow: true },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'Gewohnheiten', title: 'Pause & Gnadentag', subtitle: 'Serien ohne Druck', primaryLabel: '' } },
            { id: 'note', component: 'notice-banner', region: 'main', props: { tone: 'info', title: 'So funktioniert der Gnadentag', text: 'Pro Woche darf ein geplanter Tag ausfallen, ohne dass die Serie endet. Pausentage (Krankheit, Reise) zählen weder als erledigt noch als verpasst.', dismissible: false } },
            { id: 'streak', component: 'streak-panel', region: 'main', bind: { habits: 'habits' }, props: { mode: 'selected', showPicker: true, showPause: true } },
          ],
        },
      ],
      selectedVariantId: 'A',
    },
    // ------------------------------------------------------------------ ohne Variante
    {
      id: 'habits.templates', name: 'Vorlagen', group: 'Gewohnheiten', status: 'analyzed',
      purpose: 'Eine kleine Bibliothek sinnvoller Gewohnheiten (Wasser, Schritte, Lesen, Dehnen, Meditieren) als Startpunkt – auch für den Leerzustand.',
      requirements: [
        { text: 'Vorlagen nach Lebensbereich (Gesundheit, Fokus, Abend) mit sinnvollen Standardwerten', type: 'info', priority: 'should' },
        { text: 'Vorlage übernehmen füllt das Anlegen-Formular vor', type: 'action', priority: 'must' },
      ],
      interactions: [], viewports: ALL_VP, demoData, variants: [], links: ['habits.create'],
    },
    {
      id: 'habits.integrations', name: 'Verknüpfungen', group: 'Gewohnheiten', status: 'analyzed',
      purpose: 'Daten anderer Module zählen automatisch: Training aus Fitness, Wasser aus Ernährung, erledigte Aufgabe aus Aufgaben.',
      requirements: [
        { text: 'Fitness: abgeschlossenes Training erfüllt „Krafttraining“ am selben Tag', type: 'rule', priority: 'must' },
        { text: 'Ernährung: Wasser-Tracker füllt die Wasser-Gewohnheit (eine Quelle, keine Doppelerfassung)', type: 'rule', priority: 'must' },
        { text: 'Aufgaben: wiederkehrende Aufgabe („Belege hochladen“) kann als Gewohnheit gelten', type: 'action', priority: 'could' },
      ],
      interactions: [], viewports: ALL_VP, demoData, variants: [], links: ['habits.home'],
    },
    {
      id: 'habits.reminders', name: 'Erinnerungen', group: 'Einstellungen', status: 'not_analyzed',
      purpose: 'Ruhige Erinnerungen zur gewünschten Zeit, mit „Später“ und ohne Mahnton.',
      requirements: [
        { text: 'Erinnerung je Gewohnheit zu fester Uhrzeit oder im Zeitfenster (offen)', type: 'rule', priority: 'must' },
        { text: 'Benachrichtigungskanal „Gewohnheiten“ einzeln stummschaltbar', type: 'rule', priority: 'should' },
      ],
      interactions: [], viewports: ALL_VP, demoData, variants: [],
    },
    {
      id: 'habits.settings', name: 'Einstellungen', group: 'Einstellungen', status: 'not_analyzed',
      purpose: 'Wochenstart, Gnadentag an/aus, Archivieren statt Löschen, Datenexport.',
      requirements: [
        { text: 'Gnadentag global und je Gewohnheit schaltbar', type: 'action', priority: 'should' },
        { text: 'Archivieren statt Löschen, damit der Verlauf erhalten bleibt', type: 'rule', priority: 'should' },
      ],
      interactions: [], viewports: ALL_VP, demoData, variants: [],
    },
  ]),
  decisions: [
    { featureId: 'habits.detail', title: 'Gnadentag: ein verpasster Tag pro Woche', decision: 'Pro Kalenderwoche verzeiht ein Gnadentag einen verpassten, geplanten Tag. Pausentage sind neutral. Beides ist pro Gewohnheit abschaltbar.', rationale: 'Harte Serien erzeugen Frust und Abbrüche. Der Gnadentag hält die Motivation, ohne die Serie zu verwässern.', tradeoffs: 'Serien sind weniger „rein“. Dafür weniger Abbrüche nach einem Ausrutscher.', status: 'decided' },
    { featureId: 'habits.home', title: 'Wasser: Gewohnheit oder nur Ernährung?', decision: '', rationale: 'Wasser trinken ist die häufigste Gewohnheit, der Zähler existiert aber auch in Ernährung. Eine Quelle der Wahrheit nötig: entweder zählt Ernährung und die Gewohnheit liest mit, oder die Gewohnheit ist führend.', tradeoffs: 'Führend in Ernährung: keine Doppelerfassung, Gewohnheit abhängig vom Modul. Führend in Gewohnheiten: eigenständig, aber Daten doppelt.', status: 'open' },
    { featureId: 'habits.reminders', title: 'Erinnerung zur Uhrzeit oder im Zeitfenster?', decision: '', rationale: 'Feste Uhrzeiten sind präzise, aber starr. Zeitfenster („abends“) passen besser zum Alltag, brauchen aber eine gute Auslösung (z. B. nach Kalenderlücke).', tradeoffs: 'Uhrzeit: einfach, kann stören. Zeitfenster: flexibel, komplexer in der Umsetzung (Android-Benachrichtigung).', status: 'open' },
    { featureId: 'habits.home', title: 'Heatmap und Raster ohne Farbe lesbar', decision: 'Zustände werden zusätzlich durch Füllung, Streifen, Punkt und „J“ unterschieden; im Monatskalender stehen Tageszahlen und Symbole.', rationale: 'Barrierefreiheit und Druckbarkeit. Farbe allein reicht nicht (Kontrast-Audit der Workbench).', tradeoffs: 'Etwas mehr Gestaltungsaufwand in der Komponente.', status: 'decided' },
  ],
};
