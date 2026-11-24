// Modul "Ziele" – Seed-Manifest. Referenztag: Di, 24.11.2026 09:30 (ctx.today).
// Wenige, wichtige Ziele über Lebensbereiche (Gesundheit, Finanzen, Business, Persönlich), Wochenfokus mit höchstens drei Zielen.
// Eigentum: goals besitzt nur die Ziel-Definitionen (world/goals.js). Aktuelle Werte werden aus den Welten der Eigentümer abgeleitet
// (Sparziele, Gewichtstrend, Training, Umsatz, Gewohnheiten-Serien, Aufgaben) und nie kopiert; Rechenlogik: library/components/goals/_calc.js.

const ALL_VP = ['desktop', 'notebook', 'tablet', 'mobile'];
// Datenslots der Ziele-Komponenten heißen wie ihr Datenschlüssel: `bind` ist nirgends nötig. Alle Werte außer `goals` und `goalAreas` gehören anderen Modulen (nur lesen).
const demoData = { goals: '@world:goals', areas: '@world:goalAreas', tasks: '@world:tasks', savingsGoals: '@world:savingsGoals', savingsPlans: '@world:savingsPlans', bodySummary: '@world:bodySummary', bodyWeightLog: '@world:bodyWeightLog',
  fitnessProfile: '@world:fitnessProfile', weeklyTraining: '@world:weeklyTraining', fitnessStreak: '@world:fitnessStreak', channels: '@world:channels', habits: '@world:habits' };
const reviewData = { ...demoData, notes: '@world:notes' };

// Gesundheitshinweis (docs/HEALTH_GUIDELINES.md): Körperziele sind Trends, kein medizinischer Rat – jede Variante trägt die Fußnote.
const LEGAL = { id: 'legal', component: 'legal-notice', region: 'footer', props: { kind: 'gesundheit', style: 'footnote' } };
const withLegal = (features) => features.map((f) => (!f.variants?.length ? f : { ...f, variants: f.variants.map((v) => (v.blocks.some((b) => b.component === 'legal-notice') ? v : { ...v, blocks: [...v.blocks, LEGAL] })) }));
// „Rückgängig“ für Erledigt und Archivieren (pushUndo der Ziele-Komponenten, Anzeige hier unten fixiert)
const UNDO = { id: 'undo', component: 'undo-toast', region: 'bottom', props: { demo: false, placement: 'sticky' } };
const hdr = (title, subtitle, extra = {}) => ({ id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'Ziele', title, subtitle, ...extra } });

export default {
  module: {
    id: 'goals', name: 'Ziele', icon: 'target', status: 'active', area: 'Tag & Organisation', stage: 2, theme: 'graphite', designVersion: '0.2', homeFeatureId: 'goals.home',
    dataSource: 'Abgeleitet aus Fitness (Gewichtstrend, Training), Sparpläne (Sparziele), Sales (Umsatz), Gewohnheiten (Serien) und Aufgaben (nächster Schritt); eigene Ziel-Definitionen lokal',
    offline: 'voll', legal: ['gesundheit'], assumption: true,
    description: 'Wenige, wichtige Ziele sichtbar machen, ein Wochenfokus mit höchstens drei Zielen und Fortschritt, der automatisch aus den Fachmodulen kommt – motivierend, ohne Punkte und ohne Druck.',
    source: 'Workbench V2 (Bauplan 6, goals) – in Phase 1 gegen das TAKT-Modulregister verifizieren',
    infoArchitecture: 'Einstieg „Übersicht“ (Ziele nach Lebensbereich, Wochenfokus, nächster Schritt). Von dort: Ziel antippen → Detail (Warum, Fortschrittsverlauf, Meilensteine, nächster Schritt, Quelle); Quelle antippen → Fachmodul (Fitness, Sparpläne, Sales, Gewohnheiten); „Neues Ziel“ → Assistent; „Fokus ändern“ → Wochenfokus; „Rückblick“ → Monatsrückblick. Der nächste Schritt ist eine Aufgabe aus Aufgaben und lässt sich dort öffnen oder hier erledigen. Verknüpfungen: Fitness, Sparpläne, Sales, Gewohnheiten, Aufgaben, Notizen (Rückblick), Start.',
    docs: [
      '## Leitidee',
      '- Wenige, wichtige Ziele statt langer Listen: zehn Ziele in vier Lebensbereichen sind die Obergrenze der Demo, der Wochenfokus hat höchstens drei.',
      '- Fortschritt kommt automatisch aus den Fachmodulen und wird nicht doppelt erfasst. Ein Sparziel wird nie als eigenes Ziel kopiert: das Ziel verweist auf das Sparziel in Sparpläne und zeigt dessen Wert.',
      '- Motivierend ohne Druck: keine Punkte, kein Ranking, keine Verlustangst. „Etwas hinter dem Plan“ ist eine Information, kein Alarm (nie Warnfarbe). Pausieren statt aufgeben.',
      '- Körper und Gewicht (HEALTH_GUIDELINES): Trend statt Tageswert, neutrale Sprache, Zahlen jederzeit ausblendbar, nie Bewertungsfarbe. Ziele zum Körper tragen den Gesundheitshinweis.',
      '',
      '## Eigentum und Quellen',
      '- goals besitzt: Titel, Warum, Bereich, Zieldatum, Meilensteine, Wochenfokus und die Quelle. Aktuelle Werte sind abgeleitet: Sparziele (`savingsGoals`), Gewichtstrend und Training (`bodySummary`, `weeklyTraining`), Umsatz der letzten 30 Tage (`channels`), Serien (`habits`), Aufgaben (`tasks`).',
      '- Eigene Zähler („12 Bücher 2026“) speichern Monatsstände im Ziel selbst; sie lassen sich mit einer Gewohnheit verknüpfen. Der Verlauf eines Sparziels wird dagegen aus Stand und Sparplänen zurückgerechnet und nicht gespeichert.',
      '',
      '## Offene Fragen',
      '- Dürfen Ziele aus Fachmodulen auch ohne Zutun vorgeschlagen werden (z. B. Zielgewicht aus Fitness)?',
      '- Wochenfokus: Neustart jeden Montag oder fortlaufend, bis du ihn änderst?',
      '- Gehört der Umsatz des Monats in Ziele oder bleibt er nur in Sales (Zahl ohne Druck im Alltag)?',
    ].join('\n'),
    links: ['fitness', 'savings', 'sales', 'habits', 'tasks', 'notes', 'home'],
  },
  features: withLegal([
    // ------------------------------------------------------------------ Übersicht (Startseite)
    {
      id: 'goals.home', name: 'Übersicht', group: 'Übersicht', status: 'design', tier: 1, usage: 'täglich',
      purpose: 'Deine wenigen, wichtigen Ziele auf einen Blick: nach Lebensbereich, dein Wochenfokus mit höchstens drei Zielen und je Ziel der nächste Schritt. Der Fortschritt kommt aus den Fachmodulen.',
      requirements: [
        { text: 'Ziele nach Lebensbereich (Gesundheit, Finanzen, Business, Persönlich) mit Stand, Zustand in Worten und Frist', type: 'info', priority: 'must' },
        { text: 'Wochenfokus mit höchstens drei Zielen; ein weiteres Ziel wird nicht still verworfen, sondern erklärt und zum Tausch angeboten', type: 'rule', priority: 'must' },
        { text: 'Jede Zielkarte zeigt ihre Quelle und führt per Tipp in das Quellmodul (Fitness, Sparpläne, Sales, Gewohnheiten)', type: 'action', priority: 'must' },
        { text: 'Ein Sparziel wird nicht dupliziert: das Ziel verweist auf das Sparziel und zeigt dessen aktuellen Wert', type: 'rule', priority: 'must' },
        { text: 'Gesundheits-Leitplanken: Gewicht als Trend, neutrale Sprache, kein Alarm- oder Bewertungsfarbton, Zahlen ausblendbar', type: 'rule', priority: 'must' },
        { text: 'Zustand „Etwas hinter dem Plan“ ohne Warnfarbe und ohne Verlustwort; pausierte Ziele bleiben sichtbar', type: 'rule', priority: 'must' },
        { text: 'Leerzustand (Erster Start) erklärt die Idee und bietet genau eine erste Aktion: „Erstes Ziel anlegen“', type: 'state', priority: 'must' },
        { text: 'Beträge respektieren den Privatmodus; bei Schrift 200 % und 360 px Breite nichts abgeschnitten', type: 'state', priority: 'should' },
      ],
      interactions: [
        { trigger: 'Ziel antippen', result: 'Detail mit Warum, Verlauf, Meilensteinen, nächstem Schritt und Quelle', event: 'goal.open', to: 'goals.detail' },
        { trigger: '„Neues Ziel“', result: 'Assistent zum Anlegen öffnet sich', event: 'goal.create.open', to: 'goals.create' },
        { trigger: '„Fokus ändern“', result: 'Wochenfokus wählen', event: 'week.open', to: 'goals.week' },
        { trigger: '„Rückblick“', result: 'Monatsrückblick öffnet sich', event: 'header.secondary', to: 'goals.review' },
        { trigger: 'Quelle antippen', result: 'Das Quellmodul öffnet sich (Fitness, Sparpläne, Sales oder Gewohnheiten)', event: 'source.open' },
        { trigger: 'Nächsten Schritt öffnen', result: 'Aufgabe öffnet sich in Aufgaben', event: 'task.open', to: 'tasks.detail' },
        { trigger: 'Schritt „Erledigt“', result: 'Aufgabe ist erledigt, in Aufgaben, Start und Kalender sichtbar', event: 'step.done' },
        { trigger: 'Stern an einem Ziel', result: 'Ziel kommt in den Wochenfokus oder wieder heraus', event: 'focus.toggle' },
        { trigger: '„Rückgängig“ nach „Erledigt“', result: 'Die Aufgabe ist wieder offen, auch in Aufgaben', event: 'step.undo' },
      ],
      acceptance: [
        'Jedes Ziel zeigt Stand, Zustand in Worten, Frist und seine Quelle; ein Tipp auf die Quelle öffnet das Quellmodul.',
        'Der Wochenfokus enthält höchstens drei Ziele; ein viertes lässt sich nur im Tausch setzen und TAKT erklärt, warum.',
        'Das Sparziel „Japan-Reise 2027“ erscheint nur einmal und zeigt den Stand aus Sparpläne (2.150 € von 6.000 €).',
        'Im Privatmodus ist kein Betrag lesbar; bei Schrift 200 % und auf 360 px Breite gibt es keinen horizontalen Überlauf.',
        'Im Erststart-Szenario steht eine Einladung mit genau einer Aktion „Erstes Ziel anlegen“; im Stress-Szenario bleibt der Wochenfokus bei drei Zielen.',
        'Der Gewichtstrend erscheint nie als Tageswert, und „Zahlen ausblenden“ entfernt jede Kilogrammzahl, auch aus Beschriftungen.',
      ],
      flows: [
        { id: 'fl-woche', name: 'Woche starten', steps: [{ featureId: 'goals.home', action: 'Wochenfokus ansehen' }, { featureId: 'goals.home', action: 'Nächsten Schritt „Newsletter planen“ erledigen' }] },
        { id: 'fl-quelle', name: 'Quelle prüfen', steps: [{ featureId: 'goals.home', action: 'Ziel „Japan-Reise 2027“ antippen' }, { featureId: 'goals.detail', action: 'Quelle „Sparziel in Sparpläne“ öffnen' }, { featureId: 'savings.goals', action: 'Sparrate ansehen' }] },
      ],
      viewports: ALL_VP, demoData,
      variants: [
        {
          id: 'A', name: 'Nach Lebensbereich', direction: 'kompakt', concept: 'Alle Ziele in einer dichten Liste, nach Lebensbereich gruppiert; je Zeile Stand, Plan-Markierung, Zustand, Frist, Quelle und Stern für den Wochenfokus. Seitenspalte: der Wochenfokus mit nächstem Schritt.',
          description: '+ Alles auf einmal, Quelle und Fokus in der Zeile  − Auf Mobile lang, der Fokus rutscht unter die Liste',
          layout: { type: 'split' },
          blocks: [
            hdr('Ziele', 'Wenige, wichtige Ziele', { primaryLabel: 'Neues Ziel', primaryEvent: 'goal.create.open', secondaryLabel: 'Rückblick', secondaryIcon: 'calendar-check' }),
            { id: 'focus', component: 'goal-focus', region: 'aside', props: { title: 'Wochenfokus', style: 'strip' } },
            { id: 'areas', component: 'goal-areas', region: 'main', props: { title: 'Alle Ziele', style: 'list', showSource: true, showFocus: true } },
            UNDO,
          ],
        },
        {
          id: 'B', name: 'Wochenfokus im Mittelpunkt', direction: 'visuell', concept: 'Oben die drei Fokus-Ziele als große Karten mit Ring und nächstem Schritt, darunter alle Ziele als Karten je Lebensbereich. Wenig Text, ein Ring pro Ziel, eine Botschaft pro Karte.',
          description: '+ Motivierend, Fortschritt sofort sichtbar  − Weniger Ziele ohne Scrollen sichtbar',
          layout: { type: 'stack' },
          blocks: [
            hdr('Ziele', 'Diese Woche zählen drei Ziele', { primaryLabel: 'Neues Ziel', primaryEvent: 'goal.create.open', secondaryLabel: 'Rückblick', secondaryIcon: 'calendar-check' }),
            { id: 'focus', component: 'goal-focus', region: 'main', props: { title: 'Wochenfokus', style: 'cards' } },
            { id: 'cards', component: 'goal-cards', region: 'main', props: { title: 'Alle Ziele', groupByArea: true, showForecast: false } },
            UNDO,
          ],
        },
        {
          id: 'C', name: 'Nächster Schritt', direction: 'fokus', concept: 'Genau ein nächster Schritt groß mit „Erledigt“ (die dringendste Aufgabe aus dem Wochenfokus), darunter die übrigen Fokus-Ziele als eine Zeile je Ziel und die Lebensbereiche als ruhige Kacheln. Weniger Überblick, mehr Handlung.',
          description: '+ Eine klare Aktion, Aufgabe direkt erledigbar  − Ziele außerhalb des Fokus erst eine Ebene tiefer',
          layout: { type: 'stack', narrow: true },
          blocks: [
            hdr('Ziele', 'Eine Sache nach der anderen', { primaryLabel: 'Neu', primaryEvent: 'goal.create.open', secondaryLabel: 'Rückblick', secondaryIcon: 'calendar-check' }),
            { id: 'steps', component: 'goal-focus', region: 'main', props: { title: 'Dein nächster Schritt', style: 'single' } },
            { id: 'areas', component: 'goal-areas', region: 'main', props: { title: 'Lebensbereiche', style: 'tiles', showSource: false, showFocus: false } },
            UNDO,
          ],
        },
      ],
      selectedVariantId: 'A',
      links: ['goals.detail', 'goals.create', 'goals.week', 'goals.review', 'home.today'],
    },
    // ------------------------------------------------------------------ Ziel (Detail)
    {
      id: 'goals.detail', name: 'Ziel', group: 'Ziele', status: 'design', tier: 2, usage: 'mehrmals pro Woche',
      purpose: 'Ein Ziel im Detail: Warum es dir wichtig ist, Fortschrittsverlauf mit Zielmarke, Meilensteine, der nächste Schritt als verknüpfte Aufgabe und die Quelle des Werts.',
      requirements: [
        { text: 'Warum, Bereich, Zieldatum und Zustand in Worten (Im Plan, Gut dabei, Etwas hinter dem Plan, Pausiert, Erreicht)', type: 'info', priority: 'must' },
        { text: 'Fortschrittsverlauf mit Zielmarke; Gewicht als Trend (Tageswerte blass), Training als Wochenbalken', type: 'info', priority: 'must' },
        { text: 'Meilensteine: Schwellenwerte aus der Quelle, verknüpfte Aufgaben und eigene Häkchen', type: 'info', priority: 'must' },
        { text: 'Nächster Schritt ist eine verknüpfte Aufgabe aus Aufgaben (öffnen oder erledigen) oder ein Hinweis in das Quellmodul', type: 'action', priority: 'must' },
        { text: 'Quelle mit Weg in das Fachmodul; es wird nichts doppelt erfasst', type: 'rule', priority: 'must' },
        { text: 'Prognosen im Konjunktiv mit genannter Annahme (Sparrate ohne Rendite, Trend hält)', type: 'rule', priority: 'must' },
        { text: 'Körperziele: Zahlen ausblenden, ohne Bewertungsfarbe; Pausieren statt Aufgeben', type: 'action', priority: 'should' },
        { text: 'Eigene Zähler: Stand eintragen mit Verlauf', type: 'action', priority: 'should' },
      ],
      interactions: [
        { trigger: 'Aufgabe des nächsten Schritts öffnen', result: 'Aufgaben-Detail öffnet sich', event: 'task.open', to: 'tasks.detail' },
        { trigger: 'Quelle öffnen', result: 'Das Quellmodul öffnet sich', event: 'source.open' },
        { trigger: 'Schritt „Erledigt“', result: 'Aufgabe erledigt, der nächste offene Schritt rückt nach', event: 'step.done' },
        { trigger: 'Ziel per Chip wechseln', result: 'Alle Blöcke zeigen das andere Ziel', event: 'goal.select' },
        { trigger: 'Meilenstein abhaken', result: 'Meilenstein erreicht, Fortschritt aktualisiert sich', event: 'milestone.toggle' },
        { trigger: '„Zahlen ausblenden“', result: 'Kilogrammzahlen verschwinden überall im Feature', event: 'goal.hide' },
        { trigger: '„Pausieren“', result: 'Ziel ruht, Stand bleibt erhalten', event: 'goal.pause' },
        { trigger: '„Archivieren“', result: 'Ziel verschwindet aus den Listen, „Rückgängig“ holt es zurück', event: 'goal.archive' },
        { trigger: '„Rückgängig“ nach „Erledigt“', result: 'Die Aufgabe ist wieder offen, auch in Aufgaben', event: 'step.undo' },
        { trigger: '„Stand eintragen“', result: 'Eigener Zähler und Verlauf aktualisieren sich', event: 'goal.checkin' },
      ],
      acceptance: [
        'Warum, Stand, Frist und Zustand stehen ohne Scrollen im Kopf; der Zustand ist auch ohne Farbe lesbar.',
        'Der Verlauf zeigt eine Zielmarke; beim Gewichtsziel steht der Trend vorn, Tageswerte sind blass.',
        'Der nächste Schritt zeigt die verknüpfte Aufgabe mit Fälligkeit; „Erledigt“ markiert sie auch in Aufgaben.',
        'Die Quelle nennt das Fachmodul und führt per „Im Modul öffnen“ dorthin.',
        'Mit „Zahlen ausblenden“ kommt keine Kilogrammzahl mehr vor, auch nicht in Beschriftungen für Screenreader.',
      ],
      flows: [{ id: 'fl-schritt', name: 'Nächsten Schritt erledigen', steps: [{ featureId: 'goals.home', action: 'Ziel „Black Friday vorbereiten“ antippen' }, { featureId: 'goals.detail', action: 'Schritt „Newsletter planen“ erledigen' }, { featureId: 'goals.detail', action: 'Meilensteine prüfen' }] }],
      viewports: ALL_VP, demoData,
      variants: [
        {
          id: 'A', name: 'Verlauf & Meilensteine', direction: 'kompakt', concept: 'Kopf mit Ring und Prognose, darunter Verlauf und Meilensteine; in der Seitenspalte der nächste Schritt und die Quelle. Ziel per Chip wechselbar.',
          description: '+ Alles zu einem Ziel nebeneinander  − Dichte Seitenspalte auf Tablet',
          layout: { type: 'split' },
          blocks: [
            { id: 'hero', component: 'goal-hero', region: 'main', props: { style: 'ring', showPicker: true, showWhy: true } },
            { id: 'chart', component: 'goal-progress-chart', region: 'main', props: { title: 'Verlauf', height: 190, showCheckin: true } },
            { id: 'ms', component: 'goal-milestones', region: 'main', props: { title: 'Meilensteine' } },
            { id: 'next', component: 'goal-next-step', region: 'aside', props: { title: 'Nächster Schritt', framed: true } },
            { id: 'src', component: 'goal-source', region: 'aside', props: { title: 'Quelle' } },
            UNDO,
          ],
        },
        {
          id: 'B', name: 'Nächster Schritt zuerst', direction: 'fokus', concept: 'Erst der nächste Schritt, dann der Stand: kompakter Kopf, eine klare Aktion, danach Meilensteine, Verlauf und Quelle. Für den Weg von der Wochenübersicht direkt zum Tun.',
          description: '+ Handlungsorientiert, kurz  − Verlauf erst weiter unten',
          layout: { type: 'stack', narrow: true },
          blocks: [
            { id: 'hero', component: 'goal-hero', region: 'main', props: { style: 'compact', showPicker: false, showWhy: true } },
            { id: 'next', component: 'goal-next-step', region: 'main', props: { title: 'Nächster Schritt', framed: true } },
            { id: 'ms', component: 'goal-milestones', region: 'main', props: { title: 'Meilensteine', dense: true } },
            { id: 'chart', component: 'goal-progress-chart', region: 'main', props: { title: 'Verlauf', height: 160, showCheckin: true } },
            { id: 'src', component: 'goal-source', region: 'main', props: { title: 'Quelle' } },
            UNDO,
          ],
        },
      ],
      selectedVariantId: 'A',
      links: ['goals.home', 'goals.review', 'tasks.detail', 'savings.goals', 'fitness.body'],
    },
    // ------------------------------------------------------------------ Ziel anlegen
    {
      id: 'goals.create', name: 'Ziel anlegen', group: 'Ziele', status: 'design', tier: 2, usage: 'selten',
      purpose: 'Ein Ziel in vier einfachen Fragen anlegen: Bereich, woran du den Fortschritt siehst, Zieldatum und Wochenfokus. Ohne Fachbegriffe, mit Quelle statt Doppelerfassung.',
      requirements: [
        { text: 'Frage 1: Bereich und Name; Frage 2: messbar über eine Quelle (Sparziel, Gewichtstrend, Training, Umsatz, Gewohnheit) oder selbst gezählt', type: 'action', priority: 'must' },
        { text: 'Zu einer Quelle gibt es nur ein Ziel; ein Sparziel lässt sich nicht noch einmal als eigenes Ziel anlegen', type: 'rule', priority: 'must' },
        { text: 'Frage 3: Zieldatum mit Schnellwahl (Jahresende, 3 oder 6 Monate, 1 Jahr, eigenes Datum, ohne Datum)', type: 'action', priority: 'must' },
        { text: 'Frage 4: Wochenfokus; ist er voll (drei Ziele), erklärt TAKT es und der Schalter ist aus', type: 'rule', priority: 'must' },
        { text: 'Verständliche Fehlermeldungen am Feld, keine Fachbegriffe wie „KPI“ oder „OKR“', type: 'state', priority: 'should' },
        { text: 'Meilensteine werden automatisch vorgeschlagen (Hälfte, Ziel) und lassen sich später ändern', type: 'info', priority: 'could' },
      ],
      interactions: [
        { trigger: '„Ziel anlegen“', result: 'Ziel erscheint in der Übersicht und öffnet sich im Detail', event: 'goal.create', to: 'goals.detail' },
        { trigger: 'Weiter im Assistenten', result: 'Nächste Frage', event: 'wizard.step' },
        { trigger: 'Ungültige Eingabe', result: 'Fehlermeldung am Feld, kein Fortschritt', event: 'form.invalid' },
      ],
      acceptance: [
        'Ohne Bereich, Quelle oder Namen geht es nicht weiter; die Meldung nennt, was fehlt.',
        'Eine Quelle mit vorhandenem Ziel ist nicht wählbar und sagt „Dazu gibt es schon ein Ziel“.',
        'Nach „Ziel anlegen“ erscheint das Ziel sofort in der Übersicht und im Detail mit Quelle und Frist.',
        'Ist der Wochenfokus voll, lässt sich das neue Ziel nicht hineinschalten und der Grund steht daneben.',
      ],
      flows: [{ id: 'fl-neu', name: 'Sparziel verknüpfen', steps: [{ featureId: 'goals.create', action: 'Bereich „Finanzen“ wählen' }, { featureId: 'goals.create', action: 'Quelle „Altersvorsorge (Depot)“ wählen' }, { featureId: 'goals.detail', action: 'Neues Ziel mit Quelle sehen' }] }],
      viewports: ALL_VP, demoData,
      variants: [
        {
          id: 'A', name: 'Assistent in vier Fragen', direction: 'fokus', concept: 'Eine Frage pro Schritt mit Fortschrittsbalken, große Antworten zum Antippen, am Ende eine Zusammenfassung. Wenig Auswahl auf einmal.',
          description: '+ Geringe Hürde, ideal für Mobile  − Mehr Taps für Erfahrene',
          layout: { type: 'stack', narrow: true },
          blocks: [
            hdr('Neues Ziel', 'Vier kurze Fragen', { primaryLabel: '' }),
            { id: 'wiz', component: 'goal-assistant', region: 'main', props: { style: 'steps', title: 'Ziel anlegen' } },
          ],
        },
        {
          id: 'B', name: 'Alles auf einer Seite', direction: 'kompakt', concept: 'Alle vier Fragen untereinander, ein Button am Ende. Für Geübte, die schnell mehrere Ziele anlegen.',
          description: '+ Schnell, alles sichtbar  − Auf Mobile lang',
          layout: { type: 'stack', narrow: true },
          blocks: [
            hdr('Neues Ziel', 'Alles auf einen Blick', { primaryLabel: '' }),
            { id: 'wiz', component: 'goal-assistant', region: 'main', props: { style: 'sheet', title: 'Ziel anlegen' } },
          ],
        },
      ],
      selectedVariantId: 'A',
      links: ['goals.home', 'savings.goals'],
    },
    // ------------------------------------------------------------------ Wochenfokus
    {
      id: 'goals.week', name: 'Wochenfokus', group: 'Ziele', status: 'design', tier: 2, usage: 'wöchentlich',
      purpose: 'Wähle die höchstens drei Ziele, die diese Woche zählen. Bei mehr erklärt TAKT warum und bietet den Tausch an, statt still abzulehnen.',
      requirements: [
        { text: 'Höchstens drei Ziele im Wochenfokus, sichtbar als Plätze', type: 'rule', priority: 'must' },
        { text: 'Ein viertes Ziel wird erklärt (Aufmerksamkeit verteilt sich) und gegen eines der drei getauscht, nie still verworfen', type: 'rule', priority: 'must' },
        { text: 'Pro Ziel Stand, Bereich und Zustand sichtbar, damit die Wahl begründet ist', type: 'info', priority: 'should' },
        { text: 'Ein Wochenfokus ohne Ziel ist erlaubt (ruhige Woche)', type: 'state', priority: 'should' },
        { text: 'Abschluss führt zurück in die Übersicht', type: 'action', priority: 'must' },
      ],
      interactions: [
        { trigger: 'Ziel in den Fokus schalten', result: 'Platz wird belegt, Zähler aktualisiert sich', event: 'focus.toggle' },
        { trigger: 'Viertes Ziel versuchen', result: 'Erklärung und Tausch-Angebot', event: 'focus.blocked' },
        { trigger: '„Statt …“ wählen', result: 'Ziele tauschen die Plätze', event: 'focus.swap' },
        { trigger: '„Fertig“', result: 'Zurück zur Übersicht mit neuem Fokus', event: 'week.save', to: 'goals.home' },
        { trigger: 'Ohne Ziele: „Erstes Ziel anlegen“', result: 'Assistent öffnet sich', event: 'goal.create.open', to: 'goals.create' },
      ],
      acceptance: [
        'Es lassen sich nie mehr als drei Ziele gleichzeitig in den Fokus schalten.',
        'Beim vierten Versuch erscheint eine Erklärung mit Tausch-Buttons „Statt …“ und „Behalten wie es ist“.',
        'Nach „Fertig“ zeigt die Übersicht genau die gewählten Ziele im Wochenfokus.',
      ],
      viewports: ALL_VP, demoData,
      variants: [
        {
          id: 'A', name: 'Liste mit Schaltern', direction: 'kompakt', concept: 'Alle Ziele als Zeilen mit Schalter, oben ein Zähler „2 von 3 Plätzen belegt“. Schnell, vertraut, ideal auf dem Schreibtisch.',
          description: '+ Alle Ziele sichtbar  − Weniger Gefühl für „drei Plätze“',
          layout: { type: 'stack', narrow: true },
          blocks: [hdr('Wochenfokus', 'Höchstens drei Ziele zählen diese Woche', { primaryLabel: '' }), { id: 'pick', component: 'goal-week-picker', region: 'main', props: { style: 'list', title: 'Wochenfokus' } }],
        },
        {
          id: 'B', name: 'Drei Plätze', direction: 'visuell', concept: 'Drei Plätze als Karten, darunter die weiteren Ziele zum Hineinsetzen. Man sieht, dass es genau drei sind.',
          description: '+ Begrenzung wird greifbar  − Mehr Scrollen bei vielen Zielen',
          layout: { type: 'stack', narrow: true },
          blocks: [hdr('Wochenfokus', 'Drei Plätze, eine Woche', { primaryLabel: '' }), { id: 'pick', component: 'goal-week-picker', region: 'main', props: { style: 'slots', title: 'Wochenfokus' } }],
        },
      ],
      selectedVariantId: 'B',
      links: ['goals.home', 'goals.create'],
    },
    // ------------------------------------------------------------------ Monatsrückblick
    {
      id: 'goals.review', name: 'Monatsrückblick', group: 'Auswertung', status: 'review', tier: 3, usage: 'monatlich',
      purpose: 'Der Monat in Zielen: was sich bewegt hat, aus den Quellen berechnet, dazu drei ruhige Fragen. Ohne Punkte, ohne Bewertung.',
      requirements: [
        { text: 'Veränderung je Ziel im Monat aus den Quellen berechnet (Betrag, Trend, Einheiten, Serie, Schritte)', type: 'info', priority: 'must' },
        { text: 'Zusammenfassung „x von y Zielen sind vorangekommen“, Stillstand neutral als Information', type: 'info', priority: 'must' },
        { text: 'Drei Fragen (Was hat geholfen? Was war schwer? Eine kleine Änderung?) und „Als Notiz sichern“', type: 'action', priority: 'should' },
        { text: 'Gesundheits-Leitplanken: Trend statt Tageswert, keine Wertung', type: 'rule', priority: 'must' },
      ],
      interactions: [
        { trigger: 'Ziel antippen', result: 'Detail des Ziels öffnet sich', event: 'goal.open', to: 'goals.detail' },
        { trigger: '„Als Notiz sichern“', result: 'Rückblick liegt als Notiz in Notizen, zurück zur Übersicht', event: 'review.save', to: 'goals.home' },
      ],
      acceptance: [
        'Alle Veränderungen werden aus den Quellen berechnet, keine festen Zahlen im Bildschirm.',
        'Speichern ist erst möglich, wenn mindestens eine Frage beantwortet ist.',
        'Der gesicherte Rückblick erscheint als Notiz mit dem Etikett „Ziele“.',
      ],
      viewports: ALL_VP, demoData: reviewData,
      variants: [
        {
          id: 'A', name: 'Monat auf einen Blick', direction: 'visuell', concept: 'Ring mit der Zahl der bewegten Ziele, darunter je Ziel die Veränderung im Monat und die drei Fragen zum Mitnehmen.',
          description: '+ Ruhig, erzählend  − Keine Nachträge im Rückblick',
          layout: { type: 'stack', narrow: true },
          blocks: [hdr('Rückblick', 'Dein Monat', { primaryLabel: '' }), { id: 'rev', component: 'goal-review', region: 'main', props: { title: 'Monatsrückblick', showQuestions: true } }],
        },
      ],
      selectedVariantId: 'A',
      links: ['goals.home', 'goals.detail', 'notes.home'],
    },
    // ------------------------------------------------------------------ ohne Variante
    {
      id: 'goals.settings', name: 'Einstellungen', group: 'Einstellungen', status: 'analyzed', tier: 3, usage: 'selten',
      purpose: 'Wochenstart, Erinnerung zum Wochenfokus und Monatsrückblick, Körperziele ausblenden, Ziele archivieren statt löschen.',
      requirements: [
        { text: 'Körperziele dauerhaft ausblenden (Zahlen und Verlauf), unabhängig vom Privatmodus für Beträge', type: 'action', priority: 'must' },
        { text: 'Erinnerung zum Wochenfokus (Montag) und zum Monatsrückblick, ruhig und abschaltbar', type: 'action', priority: 'should' },
        { text: 'Ziele archivieren statt löschen, damit der Verlauf erhalten bleibt', type: 'rule', priority: 'should' },
        { text: 'Wochenstart wählbar (Montag oder Sonntag)', type: 'action', priority: 'could' },
      ],
      interactions: [], viewports: ALL_VP, demoData, variants: [], links: ['goals.home', 'settings.home'],
    },
  ]),
  decisions: [
    { featureId: 'goals.home', title: 'Welche Startseite für Ziele?', question: 'Wie öffnet das Modul Ziele?',
      options: [{ id: 'A', label: 'Nach Lebensbereich', description: 'Dichte Liste, Fokus in der Seitenspalte' }, { id: 'B', label: 'Wochenfokus im Mittelpunkt', description: 'Drei große Karten, dann alle Ziele' }, { id: 'C', label: 'Nächster Schritt', description: 'Pro Fokus-Ziel eine Aktion' }],
      recommendation: { optionId: 'B', reasons: ['Der Wochenfokus macht aus vielen Zielen drei greifbare Aufgaben', 'Ringe zeigen den Fortschritt, ohne zu bewerten', 'Die Liste bleibt über die Bereichs-Gruppierung eine Ebene darunter erreichbar'], confidence: 'mittel', by: 'Claude (Vorschlag)' },
      decision: '', rationale: 'A ist am dichtesten und zeigt jedes Ziel samt Quelle, B stellt den Wochenfokus voran, C reduziert auf die nächste Aktion. Entscheidung nach Test mit zehn Zielen auf dem Handy und im Erststart.', tradeoffs: 'A: schnell, aber lang. B: motivierend, zeigt weniger Ziele auf einmal. C: klare Handlung, der Überblick ist eine Ebene tiefer.', reversibility: 'leicht', status: 'open' },
    { featureId: 'goals.week', title: 'Wochenfokus: höchstens drei Ziele', decision: 'Der Wochenfokus enthält höchstens drei Ziele. Ein viertes wird erklärt und gegen eines der drei getauscht, nie still verworfen.',
      rationale: 'Wenige, wichtige Ziele bleiben greifbar; die Obergrenze ist ein Schutz vor Überforderung und kein Zwang. Ein Wochenfokus ohne Ziel ist erlaubt.', tradeoffs: 'Manche wollen mehr Ziele gleichzeitig. Dafür bleibt jede Woche übersichtlich und der Rückblick vergleichbar.', status: 'decided' },
    { featureId: 'goals.detail', title: 'Sparziele nur verweisen, nie kopieren', decision: 'Ein Ziel mit Quelle Sparziel verweist auf das Sparziel in Sparpläne und zeigt dessen Stand; Ziele zeigen den Wert, ändern ihn aber nicht. Zu einer Quelle gibt es höchstens ein Ziel.',
      rationale: 'Eine Wahrheit je Ding: der Sparstand lebt in Sparpläne, die Rate dort bearbeitet. So gibt es keine zwei Beträge, die auseinanderlaufen.', tradeoffs: 'Ziele können Sparraten nicht direkt ändern. Der Weg führt per Tipp in Sparpläne, dafür bleiben Zahlen konsistent.', status: 'decided' },
    { featureId: 'goals.settings', title: 'Neustart des Wochenfokus: jeden Montag oder fortlaufend?', question: 'Was passiert mit dem Wochenfokus am Montag?',
      options: [{ id: 'weekly', label: 'Jeden Montag neu wählen', description: 'Erinnerung, bisheriger Fokus als Vorschlag' }, { id: 'rolling', label: 'Fortlaufend, bis du ihn änderst', description: 'Kein Eingriff, ändert sich nur bei Bedarf' }],
      recommendation: { optionId: 'weekly', reasons: ['Eine bewusste Wahl pro Woche hält den Fokus lebendig', 'Der bisherige Fokus wird vorgeschlagen, ein Tipp genügt'], confidence: 'niedrig', by: 'Claude (Vorschlag)' },
      decision: '', rationale: 'Ein fester Neustart schafft einen ruhigen Rhythmus, kann aber als Pflicht wirken. Fortlaufend ist bequemer, der Fokus veraltet leichter.', tradeoffs: 'Montag: mehr Rhythmus, ein Tipp pro Woche. Fortlaufend: weniger Aufwand, Gefahr, dass der Fokus nicht mehr passt.', reversibility: 'leicht', status: 'open' },
  ],
};
