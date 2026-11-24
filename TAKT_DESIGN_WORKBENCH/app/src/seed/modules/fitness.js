// Modul "Fitness" – REFERENZMODUL (Konzepte liegen im TAKT-Projekt; hier nur Platzhalter-Abbild)
const rings = [
  { id: 'move', label: 'Bewegung', value: 420, goal: 600, unit: 'kcal', tone: 1, icon: 'flame' },
  { id: 'train', label: 'Training', value: 35, goal: 45, unit: 'min', tone: 2, icon: 'dumbbell' },
  { id: 'steps', label: 'Schritte', value: 8400, goal: 10000, unit: '', tone: 3, icon: 'footprints' },
];
const workout = { id: 'w1', title: 'Oberkörper A', subtitle: 'Heute 18:30 · ca. 55 Min.', exercises: [
  { id: 'e1', name: 'Bankdrücken', muscle: 'Brust', sets: [{ id: 's1', reps: 8, weight: 60, done: true }, { id: 's2', reps: 8, weight: 60, done: true }, { id: 's3', reps: 6, weight: 65 }] },
  { id: 'e2', name: 'Rudern am Kabel', muscle: 'Rücken', sets: [{ id: 's4', reps: 10, weight: 45 }, { id: 's5', reps: 10, weight: 45 }, { id: 's6', reps: 10, weight: 45 }] },
  { id: 'e3', name: 'Schulterdrücken', muscle: 'Schulter', sets: [{ id: 's7', reps: 10, weight: 20 }, { id: 's8', reps: 10, weight: 20 }] },
] };
const metrics = [
  { label: 'Trainings (Woche)', value: '3', unit: '/ 4', icon: 'dumbbell', tone: 'accent', delta: 1, suffix: '' },
  { label: 'Serie', value: 12, unit: 'Tage', icon: 'flame', tone: 'warning', delta: 3, suffix: '' },
  { label: 'Ruhepuls', value: 58, unit: 'bpm', icon: 'heart-pulse', tone: 'success', delta: -2, suffix: '', invert: true, spark: [62, 61, 60, 60, 59, 58] },
  { label: 'Gewicht', value: '78,4', unit: 'kg', icon: 'scale', tone: 'info', delta: -0.6, suffix: ' kg', invert: true, spark: [79.6, 79.3, 79.1, 78.8, 78.6, 78.4] },
];
const week = { labels: ['Mi', 'Do', 'Fr', 'Sa', 'So', 'Mo', 'Di'], series: [{ name: 'Trainingsminuten', values: [50, 0, 45, 60, 0, 40, 35] }] };
const weight = { labels: ['KW 41', 'KW 42', 'KW 43', 'KW 44', 'KW 45', 'KW 46', 'KW 47'], series: [{ name: 'Gewicht (kg)', values: [80.1, 79.8, 79.6, 79.1, 78.9, 78.6, 78.4] }] };
const goals = [
  { id: 'g1', label: 'Trainings pro Woche', value: 3, target: 4, icon: 'dumbbell' },
  { id: 'g2', label: 'Schritte (Tagesschnitt)', value: 8400, target: 10000, icon: 'footprints' },
  { id: 'g3', label: 'Zielgewicht 77 kg', value: 78.4, target: 80.1, icon: 'scale', tone: 'success' },
  { id: 'g4', label: 'Aktive Minuten (Woche)', value: 230, target: 210, icon: 'timer' },
];
const demoData = { rings, workout, metrics, week, weight, goals };
const REF = 'Referenzmodul – maßgebliche Konzepte liegen im TAKT-Projekt (Phase 1: importieren/verknüpfen), Workbench-Stand ist nur Platzhalter-Abbild.';

export default {
  module: {
    id: 'fitness', name: 'Fitness', icon: 'dumbbell', status: 'reference', theme: 'graphite', designVersion: '0.1', isReference: true,
    description: 'Training, Aktivität und Körperwerte – Referenzmodul für Kennzahlen, Ringe und Fortschrittsdarstellung im Designsystem.',
    source: 'Referenzmodul aus dem TAKT-Projekt (Konzept liegt beim Auftraggeber) – hier nur Abbild, nicht auditiert',
    infoArchitecture: 'Trainingsübersicht (Ringe, heutiges Workout, Wochenkennzahlen) → Workout-Plan → Fortschritt & Ziele → Körperwerte.',
    docs: `${REF}\n\nDient dem Designsystem als Referenz für Kennzahlen, Ringe/Diagramme und Fortschrittsanzeigen. Die Features hier sind bewusst knapp gehalten und werden nicht neu auditiert.`,
    links: ['home', 'calendar'],
  },
  features: [
    {
      id: 'fitness.overview', name: 'Trainingsübersicht', group: 'Übersicht', status: 'design',
      purpose: 'Tagesstand der Aktivität und das heutige Workout auf einen Blick; Sätze direkt abhaken.',
      requirements: [
        { text: 'Aktivitätsringe für Bewegung, Training und Schritte mit Wert und Ziel', type: 'info', priority: 'must' },
        { text: 'Heutiges Workout mit abhakbaren Sätzen und Fortschritt', type: 'action', priority: 'must' },
        { text: 'Wochenkennzahlen (Trainings, Serie, Ruhepuls, Gewicht)', type: 'info', priority: 'should' },
        { text: 'Ohne Workout: Leerzustand mit Vorschlag', type: 'state', priority: 'should' },
      ],
      interactions: [
        { trigger: 'Ring antippen', result: 'Detailwert in der Mitte', event: 'ring.open' },
        { trigger: 'Satz abhaken', result: 'Satz grün, Fortschritt steigt, Pausenhinweis', event: 'workout.set-toggle' },
        { trigger: 'Training beenden', result: 'Zusammenfassungsdialog', event: 'workout.finish' },
      ],
      viewports: ['desktop', 'notebook', 'tablet', 'mobile'],
      demoData,
      variants: [{
        id: 'A', name: 'Ringe + Workout', concept: 'Oben Ringe und heutiges Workout nebeneinander, darunter Wochenkennzahlen und Trainingsminuten.',
        description: '+ Motivierend, alles Wichtige sichtbar  − Placeholder-Stand',
        layout: { type: 'grid' },
        blocks: [
          { id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'Dienstag, 24. November', title: 'Training', subtitle: 'Referenzmodul – Platzhalter-Abbild', primaryLabel: 'Workout starten', primaryIcon: 'play' } },
          { id: 'rings', component: 'activity-rings', region: 'main', span: 5, bind: { rings: 'rings' }, props: { title: 'Heute', size: 160, layout: 'stacked' } },
          { id: 'wo', component: 'workout-card', region: 'main', span: 7, bind: { workout: 'workout' } },
          { id: 'kpi', component: 'metric-row', region: 'main', span: 12, bind: { metrics: 'metrics' } },
          { id: 'week', component: 'chart', region: 'main', span: 12, bind: { series: 'week' }, props: { title: 'Trainingsminuten – 7 Tage', type: 'bar', height: 160, showLegend: false } },
        ],
      }],
      selectedVariantId: 'A',
    },
    {
      id: 'fitness.plan', name: 'Workout-Plan', group: 'Training', status: 'analyzed',
      purpose: 'Trainingspläne mit Übungen, Sätzen und Wochenrhythmus verwalten.',
      requirements: [
        { text: 'Plan mit Trainingstagen und Übungen je Tag', type: 'info', priority: 'must' },
        { text: 'Übungen mit Sätzen, Wiederholungen und Gewicht bearbeiten', type: 'action', priority: 'must' },
        { text: 'Plan mit Kalender verknüpfen (Termine)', type: 'rule', priority: 'could' },
      ],
      interactions: [{ trigger: 'Trainingstag antippen', result: 'Workout wird geöffnet', event: 'item.open' }],
      viewports: ['desktop', 'mobile'],
    },
    {
      id: 'fitness.progress', name: 'Fortschritt & Ziele', group: 'Auswertung', status: 'design',
      purpose: 'Ziele und Entwicklung über Wochen sehen und Motivation behalten.',
      requirements: [
        { text: 'Zielfortschritt als Balken (Trainings, Schritte, Gewicht, aktive Minuten)', type: 'info', priority: 'must' },
        { text: 'Gewichtsverlauf als Linie', type: 'info', priority: 'should' },
        { text: 'Überschrittene Ziele werden hervorgehoben', type: 'state', priority: 'could' },
      ],
      interactions: [{ trigger: 'Ziel antippen', result: 'Detail/Verlauf', event: 'progress.open' }, { trigger: 'Datenpunkt antippen', result: 'Tooltip mit Wert', event: 'chart.point' }],
      viewports: ['desktop', 'tablet', 'mobile'],
      demoData,
      variants: [{
        id: 'A', name: 'Ziele + Verlauf', concept: 'Ziele als Fortschrittsliste neben dem Gewichtsverlauf.',
        description: '+ Klar und kompakt  − Placeholder-Stand',
        layout: { type: 'split' },
        blocks: [
          { id: 'hdr', component: 'page-header', region: 'header', props: { title: 'Fortschritt', subtitle: 'Referenzmodul – Platzhalter-Abbild', primaryLabel: 'Ziel hinzufügen' } },
          { id: 'goals', component: 'progress-list', region: 'main', bind: { items: 'goals' }, props: { title: 'Wochenziele' } },
          { id: 'w', component: 'chart', region: 'aside', bind: { series: 'weight' }, props: { title: 'Gewicht (kg)', type: 'line', height: 190, showLegend: false } },
        ],
      }],
      selectedVariantId: 'A',
    },
    {
      id: 'fitness.body', name: 'Körperwerte', group: 'Auswertung', status: 'analyzed',
      purpose: 'Gewicht, Körperfett, Ruhepuls und Umfänge erfassen und im Zeitverlauf vergleichen.',
      requirements: [
        { text: 'Messwerte schnell erfassen (Gewicht, Körperfett, Puls)', type: 'action', priority: 'must' },
        { text: 'Verlauf je Messwert als Diagramm', type: 'info', priority: 'must' },
        { text: 'Import aus Wage/Health-App optional', type: 'action', priority: 'could' },
      ],
      interactions: [{ trigger: 'Wert erfassen', result: 'Eintrag im Verlauf', event: 'quickadd.submit' }],
      viewports: ['desktop', 'mobile'],
    },
  ],
  decisions: [
    { featureId: 'fitness.overview', title: 'Konzept aus dem TAKT-Projekt übernehmen', decision: '', rationale: 'Das maßgebliche Fitness-Konzept liegt beim Auftraggeber. In Phase 1 importieren/verknüpfen; die Workbench-Entwürfe sind nur Platzhalter für das Designsystem.', status: 'open' },
  ],
};
