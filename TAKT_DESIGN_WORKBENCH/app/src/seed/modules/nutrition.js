// Modul "Ernährung" – Seed-Manifest. Referenztag: Di, 24.11.2026 09:30 (ctx.today).
// Daten kommen aus der gemeinsamen Welt (seed/world/nutrition.js, Schlüssel „nut…“): Tagebuch, Lebensmittel, Rezepte,
// Plan, Einkauf, Wasser, Ziele. Komponenten schreiben in den Weltzustand, sodass sich alle Screens im Launcher ändern.

const ALL_VP = ['desktop', 'notebook', 'tablet', 'mobile'];
/** demoData-Bindungen auf die Welt: D('diary','goals') → { diary: '@world:nutDiary', goals: '@world:nutGoals' } */
const D = (...names) => Object.fromEntries(names.map((n) => [n, `@world:nut${n[0].toUpperCase()}${n.slice(1)}`]));
// Gesundheitshinweis dauerhaft sichtbar (wie in Fitness), nicht eingeklappt: HEALTH_GUIDELINES 1, Pflicht für jede Variante.
const LEGAL = { id: 'legal', component: 'legal-notice', region: 'footer', props: { kind: 'gesundheit', style: 'footnote' } };
/** Hängt den Gesundheitshinweis an jede Variante, die ihn noch nicht trägt (Pflicht für jede Variante, HEALTH 1). */
const withLegal = (f) => ({ ...f, variants: (f.variants || []).map((v) => (v.blocks.some((b) => b.component === 'legal-notice' && b.props?.kind === 'gesundheit') ? v : { ...v, blocks: [...v.blocks, LEGAL] })) });
const hdr = (props) => ({ id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'Ernährung', primaryLabel: '', ...props } });

// ================================================================ Übersicht
const home = {
  id: 'nutrition.home', name: 'Übersicht', group: 'Übersicht', status: 'review',
  purpose: 'Der Einstieg in Ernährung: in unter fünf Sekunden sehen, was heute noch möglich ist, und ohne Umweg erfassen. Kalorien, Makros, Mahlzeiten, Wasser und die nächste geplante Mahlzeit, ruhig und ohne Bewertungsdruck.',
  requirements: [
    { text: 'Kalorien-Bilanz „Ziel − gegessen = übrig“ ist ohne Scrollen sichtbar; über dem Ziel bleibt die Farbe neutral (kein Rot)', type: 'rule', priority: 'must' },
    { text: 'Eiweiß, Kohlenhydrate und Fett mit Gramm und Ziel; Farbe nie allein (Buchstabe E, KH, F)', type: 'info', priority: 'must' },
    { text: 'Mahlzeiten-Timeline mit Summen und „+“ je Mahlzeit; geplante Mahlzeiten stehen gedämpft dabei und lassen sich mit einem Tap übernehmen', type: 'info', priority: 'must' },
    { text: 'Wasserstand mit Ein-Tap-Erfassung (+250 ml) und Rückgängig', type: 'action', priority: 'must' },
    { text: 'Nächste geplante Mahlzeit mit „Wie geplant gegessen“ und Link zum Rezept', type: 'action', priority: 'should' },
    { text: 'Konstruktive Hinweise („Eiweiß: noch 69 g – Skyr passt“), nie wertend, ohne Moralwörter', type: 'rule', priority: 'must' },
    { text: 'Zustände: leerer Tag („Wie gestern?“), kein Ziel gesetzt (führt zum Ziele-Assistenten), Zahlen ausblenden (Gewohnheitsmodus), lädt, Fehler', type: 'state', priority: 'must' },
    { text: 'Gesundheitshinweis „kein medizinischer Rat“ ist erreichbar (legal-notice, Art gesundheit)', type: 'rule', priority: 'must' },
    { text: 'Erststart: eine Einladung mit einer Aktion statt leerer Karten für Verlauf, Nächstes und Mahlzeiten', type: 'state', priority: 'must' },
  ],
  interactions: [
    { trigger: '„Erfassen“ oder „+“ bei einer Mahlzeit antippen', result: 'Mahlzeit erfassen öffnet sich mit vorgewählter Mahlzeit', event: 'meal.add', to: 'nutrition.log' },
    { trigger: 'Wasser-Details antippen', result: 'Wasser-Tracker mit Gefäßen und Verlauf', event: 'water.open', to: 'nutrition.water' },
    { trigger: '„Auswertung“ antippen', result: 'Wochen- und Monatsauswertung öffnet sich', event: 'header.secondary', to: 'nutrition.insights' },
    { trigger: '„Auswertung“ im Wochenverlauf antippen', result: 'Auswertung öffnet sich', event: 'trend.open', to: 'nutrition.insights' },
    { trigger: 'Balken im Wochenverlauf antippen', result: 'Details des Tages erscheinen unter dem Diagramm', event: 'trend.day' },
    { trigger: 'Barcode-Symbol in der Erfassen-Leiste', result: 'Erfassen öffnet mit Scanner', event: 'scan.open', to: 'nutrition.log' },
    { trigger: 'Rezept der nächsten Mahlzeit antippen', result: 'Rezept-Detail öffnet sich', event: 'recipe.open', to: 'nutrition.recipe' },
    { trigger: '„Ziel festlegen“ antippen', result: 'Ziele-Assistent öffnet sich', event: 'goals.open', to: 'nutrition.goals' },
    { trigger: 'Eintrag antippen', result: 'Sheet: Menge ändern, Kopieren, Löschen mit Rückgängig', event: 'entry.open' },
    { trigger: '„Wie geplant gegessen“', result: 'Planpunkt landet im Tagebuch, Bilanz aktualisiert sich', event: 'plan.eat' },
    { trigger: '+250 ml', result: 'Wasser steigt, Rückgängig erscheint', event: 'water.add' },
  ],
  acceptance: [
    'Bei 390 px zeigt der erste Bildschirm „Kalorien übrig“ und eine Erfassen-Aktion, ohne zu scrollen.',
    'Nach „Wie geplant gegessen“ sinkt „übrig“ um die Kalorien des Planpunkts und die Mahlzeit verschwindet aus der geplanten Liste.',
    'Über dem Ziel erscheint kein Rot und keine Warnung, nur der Satz „Der Wochenschnitt zählt“.',
    'Mit leerem Tagebuch zeigt die Seite einen freundlichen Leerzustand mit „Erfassen“ und „Wie gestern“.',
    'Im Erststart (Tagebuch und Verlauf leer) zeigt jede Richtung genau eine Einladung mit der Aktion „Erste Mahlzeit erfassen“ und höchstens eine ruhige Kalorienkarte – keinen Stapel leerer Karten.',
    'Alle Touch-Ziele sind auf Mobile mindestens 36 px hoch, Zahlen nutzen deutsche Formate.',
  ],
  flows: [
    { id: 'fl-erfassen', name: 'Mahlzeit erfassen', steps: [{ featureId: 'nutrition.home', action: 'Erfassen antippen' }, { featureId: 'nutrition.log', action: 'Zuletzt: „+“ bei Skyr' }, { featureId: 'nutrition.home', action: 'Bilanz hat sich geändert' }] },
    { id: 'fl-wasser', name: 'Wasser trinken', steps: [{ featureId: 'nutrition.home', action: '+250 ml antippen' }, { featureId: 'nutrition.water', action: 'Gefäß „Meine Flasche“ wählen' }] },
  ],
  viewports: ALL_VP,
  demoData: { ...D('diary', 'goals', 'plan', 'water', 'foods', 'recipes', 'history') },
  variants: [
    {
      id: 'A', name: 'Bilanz kompakt', direction: 'kompakt',
      concept: 'Eine Zeile Rechnung (Ziel − gegessen = übrig), Makro-Balken und die Mahlzeiten als dichte Liste mit „+“ je Zeile. Wasser, nächste Mahlzeit und Hinweise stehen in der Seitenspalte.',
      description: '+ Alles auf einen Blick, Aktionen direkt in der Zeile, Zahlen exakt  − Wenig Raum für Bilder, Fortschritt nur als Balken',
      layout: { type: 'split' },
      blocks: [
        // Erststart (Tagebuch und Verlauf leer): Kopf ohne „Erfassen“, die Einladung trägt die eine Aktion
        { ...hdr({ title: 'Heute', subtitle: 'Di, 24.11.', primaryLabel: 'Erfassen', primaryEvent: 'meal.add', secondaryLabel: 'Auswertung', secondaryIcon: 'bar-chart-3' }), hideWhenEmpty: ['diary', 'history'] },
        { ...hdr({ title: 'Heute', subtitle: 'Di, 24.11.', primaryLabel: '' }), id: 'hdr0', showWhenEmpty: ['diary', 'history'] },
        { id: 'first', component: 'nut-start-invite', region: 'main', props: { mode: 'compact' } },
        { id: 'strip', component: 'day-strip', region: 'main', props: { quietEmpty: true } },
        { id: 'bal', component: 'calorie-budget', region: 'main', props: { style: 'formula', title: 'Kalorien', quietEmpty: true } },
        { id: 'mac', component: 'macro-summary', region: 'main', props: { mode: 'bars', dense: true, quietEmpty: true } },
        { id: 'tl', component: 'meal-timeline', region: 'main', props: { density: 'compact', quietEmpty: true } },
        { id: 'water', component: 'water-tracker', region: 'aside', props: { style: 'compact', openable: true, quietEmpty: true } },
        { id: 'next', component: 'next-meal-card', region: 'aside', props: { size: 'compact', quietEmpty: true } },
        { id: 'hints', component: 'nutrition-hints', region: 'aside', props: { limit: 2, title: 'Hinweise', quietEmpty: true } },
        LEGAL,
      ],
    },
    {
      id: 'B', name: 'Ringe und Karten', direction: 'visuell',
      concept: 'Großer Kalorienring mit Makro-Ringen, Glas-Raster für Wasser, Wochenbalken und Mahlzeiten als ruhige Karte. Jede Karte trägt eine Botschaft.',
      description: '+ Fortschritt sofort sichtbar, viel Raum, ruhige Gesamtwirkung  − Mehr Scrollen, weniger Detail pro Eintrag',
      layout: { type: 'grid' },
      blocks: [
        { ...hdr({ title: 'Heute', subtitle: 'Di, 24.11.', primaryLabel: 'Erfassen', primaryEvent: 'meal.add' }), hideWhenEmpty: ['diary', 'history'] },
        { ...hdr({ title: 'Heute', subtitle: 'Di, 24.11.', primaryLabel: '' }), id: 'hdr0', showWhenEmpty: ['diary', 'history'] },
        { id: 'strip', component: 'day-strip', region: 'main', span: 12, props: { framed: true, quietEmpty: true } },
        { id: 'first', component: 'nut-start-invite', region: 'main', span: 7, props: { mode: 'hero' } },
        { id: 'bal', component: 'calorie-budget', region: 'main', span: 5, props: { style: 'ring', size: 200, title: 'Kalorien', quietEmpty: true } },
        { id: 'mac', component: 'macro-summary', region: 'main', span: 7, props: { mode: 'rings', title: 'Makros', quietEmpty: true } },
        { id: 'next', component: 'next-meal-card', region: 'main', span: 7, props: { size: 'hero', title: 'Als Nächstes', quietEmpty: true } },
        { id: 'water', component: 'water-tracker', region: 'main', span: 5, props: { style: 'glasses', openable: true, quietEmpty: true } },
        { id: 'week', component: 'kcal-trend', region: 'main', span: 6, props: { range: 'week', linkEvent: true, title: 'Diese Woche', showStats: false, quietEmpty: true } },
        { id: 'tl', component: 'meal-timeline', region: 'main', span: 6, props: { density: 'comfortable', quietEmpty: true } },
        { id: 'hints', component: 'nutrition-hints', region: 'main', span: 12, props: { limit: 3, style: 'cards', title: 'Heute für dich', quietEmpty: true } },
        LEGAL,
      ],
    },
    {
      id: 'C', name: 'Was fehlt noch?', direction: 'fokus',
      concept: 'Die nächste geplante Mahlzeit als Hero, darunter wenige priorisierte Hinweise mit Ein-Tap-Aktion, eine schlanke Bilanz und unten fixiert die Erfassen-Leiste. Kontext statt Zahlenfläche.',
      description: '+ Klare nächste Aktion, wenig Ablenkung, Erfassen immer erreichbar  − Details (Makros, Verlauf) erst auf Nachfrage',
      layout: { type: 'stack', narrow: true },
      blocks: [
        hdr({ title: 'Was fehlt heute noch?', subtitle: 'Di, 24.11.', primaryLabel: '', secondaryLabel: 'Auswertung', secondaryIcon: 'bar-chart-3' }),
        { id: 'first', component: 'nut-start-invite', region: 'main', props: { mode: 'step', title: 'Erste Mahlzeit erfassen', text: 'Danach siehst du hier, was heute noch fehlt – ein Tipp genügt.', ctaLabel: 'Erfassen' } },
        { id: 'next', component: 'next-meal-card', region: 'main', props: { size: 'hero', title: 'Als Nächstes', quietEmpty: true } },
        { id: 'hints', component: 'nutrition-hints', region: 'main', props: { limit: 3, title: 'Für den Rest des Tages', quietEmpty: true } },
        { id: 'bal', component: 'calorie-budget', region: 'main', props: { style: 'bar', title: 'Kalorien', quietEmpty: true } },
        { id: 'water', component: 'water-tracker', region: 'main', props: { style: 'compact', openable: true, quietEmpty: true } },
        { id: 'tl', component: 'meal-timeline', region: 'main', props: { grouping: 'time', density: 'compact', limit: 4, title: 'Heute erfasst', quietEmpty: true } },
        { id: 'bar', component: 'log-bar', region: 'bottom', props: { quietEmpty: true } },
        LEGAL,
      ],
    },
  ],
  selectedVariantId: 'A',
  links: ['nutrition.log', 'nutrition.water', 'nutrition.insights'],
  seedHistory: [{ kind: 'draft', note: 'Drei Richtungen: Bilanz kompakt, Ringe und Karten, Was fehlt noch?' }, { kind: 'review', note: 'Mobil und Desktop in allen Themes geprüft, Überschreitung neutral' }],
};

// ============================================================ Mahlzeit erfassen
const GUARD = { text: 'Gesundheits-Leitplanken: Überschreitung nie rot oder alarmierend, keine Moralwörter, Zahlen lassen sich ausblenden, Hinweis „kein medizinischer Rat“ erreichbar', type: 'rule', priority: 'must' };
const log = {
  id: 'nutrition.log', name: 'Mahlzeit erfassen', group: 'Tagebuch', status: 'design',
  purpose: 'Erfassen so schnell, dass man es nicht aufschiebt: höchstens drei Taps über Suche, Zuletzt, Favoriten, Vorlagen, Barcode-Scan (Simulation) oder Schnell-Kalorien. Jeder Eintrag landet sofort im Tagebuch und ändert die Übersicht.',
  requirements: [
    { text: 'Mahlzeit ist per Tageszeit vorgewählt und mit einem Tap änderbar', type: 'rule', priority: 'must' },
    { text: 'Suche mit Sofortergebnissen; Treffer zeigen Menge, kcal und Eiweiß je Portion', type: 'info', priority: 'must' },
    { text: 'Reiter Zuletzt (ohne Eingabe sofort sichtbar), Favoriten, Vorlagen, Alle', type: 'info', priority: 'must' },
    { text: '„+“ in der Zeile trägt die zuletzt genutzte Menge ein (Erfassen → Zuletzt → „+“ = 2 Taps)', type: 'action', priority: 'must' },
    { text: 'Portions-Picker: Portionsgrößen, Stepper mit Dezimalkomma, Schnellwerte, Live-Kalorien und -Makros', type: 'action', priority: 'must' },
    { text: 'Barcode-Scan simuliert: Treffer, nicht gefunden, Kamera verweigert, manuelle EAN mit Prüfziffer', type: 'action', priority: 'should' },
    { text: 'Schnell-Kalorien: nur kcal (optional Name und Makros), höchstens drei Eingaben', type: 'action', priority: 'must' },
    { text: 'Keine Treffer: Aktionen „Eigenes Lebensmittel“ und „Schnell-Kalorien“ statt Sackgasse', type: 'state', priority: 'must' },
    { text: 'Allergene des gewählten Lebensmittels sind im Picker sichtbar („Angaben ohne Gewähr“)', type: 'info', priority: 'should' },
    GUARD,
  ],
  interactions: [
    { trigger: 'Eintippen in die Suche', result: 'Treffer erscheinen sofort', event: 'food.search' },
    { trigger: '„+“ in einer Zeile', result: 'Eintrag mit der letzten Menge, Toast, Bilanz aktualisiert', event: 'portion.confirm' },
    { trigger: 'Zeile antippen', result: 'Portions-Picker öffnet sich', event: 'food.pick' },
    { trigger: 'Demo-Code antippen', result: 'Scan liest den Code, Treffer oder „nicht gefunden“', event: 'scan.result' },
    { trigger: 'Schnell-Kalorien erfassen', result: 'Schätzung landet im Tagebuch', event: 'quickkcal.submit' },
    { trigger: 'Keine Treffer: „Eigenes Lebensmittel“', result: 'Formular für eigenes Lebensmittel öffnet sich', event: 'food.create', to: 'nutrition.foods' },
    { trigger: 'Vorlage antippen', result: 'Alle Zutaten der Vorlage werden erfasst', event: 'template.log' },
  ],
  acceptance: [
    'Zuletzt-Lebensmittel erfassen kostet ab „Erfassen“ genau 2 Taps („+“ in der Zeile).',
    'Barcode: Demo-Code antippen, Portion bestätigen = 2 Taps nach dem Scan.',
    'Eine EAN mit falscher Prüfziffer wird mit freundlichem Hinweis abgelehnt, ein unbekannter Code zeigt „nicht gefunden“ mit Alternativen.',
    'Nach dem Erfassen zeigt die Übersicht die neuen Summen (gemeinsamer Weltzustand).',
    'Eingabefelder haben mindestens 16 px Schrift, alle Touch-Ziele mindestens 36 px.',
  ],
  flows: [{ id: 'fl-schnell', name: 'Mahlzeit in 2 Taps', steps: [{ featureId: 'nutrition.home', action: 'Erfassen' }, { featureId: 'nutrition.log', action: '„+“ bei Skyr' }] }],
  viewports: ALL_VP,
  demoData: { ...D('diary', 'goals', 'plan', 'foods', 'templates') },
  variants: [
    {
      id: 'A', name: 'Suche zuerst', direction: 'kompakt',
      concept: 'Suchfeld, Reiter und dichte Trefferliste mit „+“ in jeder Zeile. Auf dem Desktop steht rechts die Tagessumme, damit der Effekt jedes Eintrags sofort sichtbar ist.',
      description: '+ Schnell für Power-User, jede Zeile erfasst mit einem Tap  − Viele Zeilen, wenig Bildhaftigkeit',
      layout: { type: 'split' },
      blocks: [
        hdr({ title: 'Mahlzeit erfassen', subtitle: 'Suchen, Zuletzt, Favoriten, Vorlagen' }),
        { id: 'fs', component: 'food-search', region: 'main', props: { style: 'list', title: 'Lebensmittel' } },
        { id: 'bal', component: 'calorie-budget', region: 'aside', props: { style: 'formula', title: 'Heute' } },
        { id: 'qk', component: 'quick-kcal', region: 'aside', props: {} },
        { id: 'tl', component: 'meal-timeline', region: 'aside', props: { grouping: 'time', density: 'compact', limit: 4, title: 'Heute erfasst', showPlanned: false } },
      ],
    },
    {
      id: 'B', name: 'Schnellwahl-Kacheln', direction: 'visuell',
      concept: 'Favoriten und Zuletzt als große Kacheln: ein Tap trägt die Standardportion ein, das kleine Regler-Symbol öffnet den Portions-Picker. Die Bilanz schwebt als schmaler Balken darüber.',
      description: '+ Sehr schnell für Gewohnheits-Mahlzeiten, großzügige Touch-Flächen  − Neue Lebensmittel brauchen die Suche',
      layout: { type: 'stack' },
      blocks: [
        hdr({ title: 'Mahlzeit erfassen', subtitle: 'Ein Tap für Gewohntes' }),
        { id: 'bal', component: 'calorie-budget', region: 'main', props: { style: 'bar', title: 'Heute' } },
        { id: 'fs', component: 'food-search', region: 'main', props: { style: 'tiles', title: 'Schnellwahl', tabs: ['Zuletzt', 'Favoriten', 'Vorlagen'] } },
        { id: 'qk', component: 'quick-kcal', region: 'main', props: {} },
      ],
    },
    {
      id: 'C', name: 'Scan zuerst', direction: 'fokus',
      concept: 'Der Sucher steht oben, darunter Zuletzt für die Wiederholer und Schnell-Kalorien für alles ohne Etikett. Gedacht für den Moment direkt vor dem Essen.',
      description: '+ Ideal für Verpacktes und unterwegs  − Weniger geeignet für frische Lebensmittel ohne Code',
      layout: { type: 'stack', narrow: true },
      blocks: [
        hdr({ title: 'Mahlzeit erfassen', subtitle: 'Scannen, zuletzt gegessen oder schätzen' }),
        { id: 'scan', component: 'scan-sim', region: 'main', props: {} },
        { id: 'fs', component: 'food-search', region: 'main', props: { style: 'list', title: 'Oder aus der Liste', tabs: ['Zuletzt', 'Favoriten'], limit: 6 } },
        { id: 'qk', component: 'quick-kcal', region: 'main', props: {} },
      ],
    },
  ],
  selectedVariantId: 'A', links: ['nutrition.home', 'nutrition.foods'],
};

// ===================================================================== Wasser
const water = {
  id: 'nutrition.water', name: 'Wasser', group: 'Tagebuch', status: 'review',
  purpose: 'Trinken mit einem Tap erfassen, ohne Druck: Schnelltasten, eigene Gefäße, Tagesverlauf und Woche. Ziel erreicht wird dezent gezeigt.',
  requirements: [
    { text: 'Tagesziel in ml (Standard 2.500) mit Fortschritt als Glas-Raster oder Balken', type: 'info', priority: 'must' },
    { text: 'Schnelltasten +150, +250, +500 ml und eigene Gefäße („Meine Flasche 750 ml“)', type: 'action', priority: 'must' },
    { text: 'Letzten Eintrag per „Rückgängig“ entfernen, einzelne Einträge im Verlauf löschen', type: 'action', priority: 'must' },
    { text: 'Wochenbalken der letzten sieben Tage', type: 'info', priority: 'should' },
    { text: 'Ziel erreicht: dezenter Hinweis ohne laute Animation (reduced-motion respektiert); weit über Ziel: „Das Ziel ist eine Orientierung“', type: 'state', priority: 'must' },
    { text: 'Zielvorschlag +500 ml bei Hitze oder Training nur als Vorschlag (Wetter, Fitness)', type: 'rule', priority: 'could' },
    GUARD,
  ],
  interactions: [
    { trigger: 'Schnelltaste oder Gefäß antippen', result: 'Wasserstand steigt, „Rückgängig“ erscheint', event: 'water.add' },
    { trigger: 'Rückgängig', result: 'Letzter Eintrag verschwindet', event: 'water.undo' },
    { trigger: 'Eintrag im Verlauf entfernen', result: 'Eintrag gelöscht, Summe sinkt', event: 'water.remove' },
    { trigger: 'Eigenes Gefäß anlegen', result: 'Neues Gefäß steht als Chip bereit', event: 'water.vessel' },
  ],
  acceptance: ['+250 ml aktualisiert den Wasserstand in der Übersicht und hier gleichzeitig.', 'Rückgängig entfernt genau den letzten Eintrag.', 'Beim Erreichen des Ziels gibt es keine Animation und keine Farbe außerhalb der Tokens.', 'Alle Schnelltasten sind auf Mobile mindestens 44 px hoch.'],
  viewports: ALL_VP,
  demoData: { ...D('water', 'goals', 'history', 'diary', 'plan', 'foods') },
  variants: [
    {
      id: 'A', name: 'Glas-Raster', direction: 'visuell',
      concept: 'Zehn Gläser füllen sich, Schnelltasten und Gefäße darunter, Wochenbalken am Ende. Der Fortschritt ist ohne Zahlen verständlich.',
      description: '+ Anschaulich, motivierend ohne Druck  − Verlauf einzelner Einträge fehlt',
      layout: { type: 'stack', narrow: true },
      blocks: [hdr({ title: 'Wasser', subtitle: 'Heute, Di 24.11.' }), { id: 'w', component: 'water-tracker', region: 'main', props: { style: 'glasses', showWeek: true } }],
    },
    {
      id: 'B', name: 'Verlauf kompakt', direction: 'kompakt',
      concept: 'Balken, Schnelltasten und die Einträge des Tages als Zeitleiste mit Entfernen-Knopf, darunter die Woche, daneben ein ruhiger Hinweis zur Einordnung. Für alle, die genau nachsehen wollen.',
      description: '+ Jeder Eintrag sichtbar und korrigierbar  − Weniger anschaulich',
      layout: { type: 'split' },
      blocks: [hdr({ title: 'Wasser', subtitle: 'Heute, Di 24.11.' }), { id: 'w', component: 'water-tracker', region: 'main', props: { style: 'timeline', showWeek: true } }, { id: 'hint', component: 'nutrition-hints', region: 'aside', props: { limit: 2, title: 'Zur Einordnung' } }],
    },
    {
      id: 'C', name: 'Ein Tap', direction: 'fokus',
      concept: 'Nur das Nötige: großer Fortschrittsbalken und die Schnelltasten. Ein freundlicher Hinweis erscheint nur, wenn der Tag hinterherhinkt.',
      description: '+ Schnellste Bedienung  − Kein Verlauf',
      layout: { type: 'stack', narrow: true },
      blocks: [hdr({ title: 'Wasser', subtitle: 'Ein Tap genügt' }), { id: 'w', component: 'water-tracker', region: 'main', props: { style: 'bar', showVessels: true } }, { id: 'hint', component: 'nutrition-hints', region: 'main', props: { limit: 1, title: 'Kleiner Hinweis' } }],
    },
  ],
  selectedVariantId: 'A', links: ['nutrition.home'],
};

// =============================================== Lebensmittel & Nährwerte
const foods = {
  id: 'nutrition.foods', name: 'Lebensmittel & Nährwerte', group: 'Wissen', status: 'design',
  purpose: 'Nachschlagen, vergleichen und eigene Lebensmittel pflegen: Datenbank mit Suche und Filtern, Nährwert-Tabelle nach EU-Muster, eigenes Lebensmittel mit Plausibilitätsprüfung.',
  requirements: [
    { text: 'Liste mit Suche und Filtern (Favoriten, Eigene, Marken, Kategorie) und Sortierung', type: 'info', priority: 'must' },
    { text: 'Nährwert-Tabelle nach EU-Muster (kJ/kcal, Fett, davon gesättigt, Kohlenhydrate, davon Zucker, Ballaststoffe, Eiweiß, Salz) mit Umschalter je 100 g / je Portion', type: 'info', priority: 'must' },
    { text: 'Allergene (14 EU-Hauptallergene) als Chips, Quellenangabe, Hinweis „Angaben ohne Gewähr, Etikett prüfen“', type: 'rule', priority: 'must' },
    { text: 'Eigenes Lebensmittel anlegen mit Portionsangabe; Warnung, wenn Makros und kcal mehr als ca. 20 % auseinanderliegen; Duplikat-Hinweis', type: 'action', priority: 'must' },
    { text: 'Zahlen im deutschen Format (Dezimalkomma)', type: 'rule', priority: 'must' },
    { text: 'Datenquelle der produktiven App ist offen (siehe Entscheidung); Demo nutzt eigene Richtwerte', type: 'rule', priority: 'should' },
    GUARD,
  ],
  interactions: [
    { trigger: 'Lebensmittel in der Liste antippen', result: 'Nährwert-Tabelle zeigt es an', event: 'food.open' },
    { trigger: 'Umschalter je 100 g / je Portion', result: 'Tabelle rechnet um', event: 'nutrient.basis' },
    { trigger: 'Eigenes Lebensmittel speichern', result: 'Eintrag erscheint in der Liste', event: 'food.create' },
    { trigger: 'Stern antippen', result: 'Favorit gesetzt', event: 'food.favorite' },
  ],
  acceptance: ['Nährwert-Tabelle rechnet 100 g und Portion korrekt um (Skyr 250 g = 158 kcal).', 'Ein eigenes Lebensmittel mit 900 kcal bei 10 g Fett löst die Plausibilitäts-Warnung aus.', 'Allergene sind sichtbar, der Quellenhinweis steht unter der Tabelle.'],
  viewports: ALL_VP,
  demoData: { ...D('foods', 'diary') },
  variants: [
    {
      id: 'A', name: 'Tabelle und Detail', direction: 'kompakt',
      concept: 'Dichte Tabelle mit Nährwerten je 100 g links, rechts die EU-Nährwert-Tabelle des gewählten Lebensmittels. Eigenes Lebensmittel als Dialog-Aktion im Kopf.',
      description: '+ Vergleichen auf einen Blick, Tabelle sortierbar  − Auf Mobile untereinander',
      layout: { type: 'split' },
      blocks: [hdr({ title: 'Lebensmittel', subtitle: '46 Einträge · Werte je 100 g' }), { id: 'list', component: 'food-list', region: 'main', props: { style: 'auto', dense: true, title: 'Datenbank' } }, { id: 'nt', component: 'nutrition-table', region: 'aside', props: { defaultFood: 'f-skyr' } }],
    },
    {
      id: 'B', name: 'Reiter', direction: 'visuell',
      concept: 'Drei ruhige Reiter: Suchen als Liste, Nährwerte des gewählten Lebensmittels und Eigenes anlegen. Eine Sache pro Ansicht.',
      description: '+ Aufgeräumt, gut für Mobile  − Mehr Taps zum Vergleichen',
      layout: { type: 'tabs' },
      blocks: [
        hdr({ title: 'Lebensmittel', subtitle: 'Suchen, nachschlagen, anlegen' }),
        { id: 'list', component: 'food-list', region: 'main', tab: 'Suchen', props: { style: 'list', title: 'Suchen' } },
        { id: 'nt', component: 'nutrition-table', region: 'main', tab: 'Nährwerte', props: { defaultFood: 'f-skyr' } },
        { id: 'form', component: 'food-form', region: 'main', tab: 'Eigenes', props: {} },
      ],
    },
  ],
  selectedVariantId: 'A', links: ['nutrition.log'],
};

// ============================================================= Rezepte
const recipes = {
  id: 'nutrition.recipes', name: 'Rezepte', group: 'Wissen', status: 'design',
  purpose: 'Rezepte finden und mit einem Tap ins Tagebuch, in den Plan oder auf die Einkaufsliste übernehmen. Nährwerte je Portion werden aus den Zutaten berechnet.',
  requirements: [
    { text: 'Rezeptkarten mit Zeit, kcal und Eiweiß je Portion; Liste als Alternative', type: 'info', priority: 'must' },
    { text: 'Suche und Filter: Mahlzeit, Zubereitungszeit, Tags (vegetarisch, vegan, proteinreich, Meal-Prep, schnell)', type: 'action', priority: 'must' },
    { text: 'Antippen öffnet das Rezept-Detail', type: 'action', priority: 'must' },
    { text: 'Favoriten per Stern', type: 'action', priority: 'should' },
    { text: 'Keine Treffer: Filter lockern statt leerer Fläche; keine Rezepte: „Rezept anlegen“', type: 'state', priority: 'must' },
    GUARD,
  ],
  interactions: [
    { trigger: 'Rezeptkarte antippen', result: 'Rezept-Detail öffnet sich', event: 'recipe.open', to: 'nutrition.recipe' },
    { trigger: 'Stern antippen', result: 'Rezept ist Favorit', event: 'recipe.favorite' },
  ],
  acceptance: ['Filter „bis 15 Min.“ blendet alle längeren Rezepte aus.', 'Antippen einer Karte öffnet das Detail des richtigen Rezepts.', 'Auf Mobile ist die Kartenliste einspaltig ohne horizontales Scrollen.'],
  flows: [{ id: 'fl-rezept', name: 'Rezept zur Einkaufsliste', steps: [{ featureId: 'nutrition.recipes', action: 'Lachs mit Ofengemüse öffnen' }, { featureId: 'nutrition.recipe', action: 'Zutaten zur Einkaufsliste' }, { featureId: 'nutrition.shopping', action: 'Liste prüfen' }] }],
  viewports: ALL_VP,
  demoData: { ...D('recipes', 'foods') },
  variants: [
    {
      id: 'A', name: 'Kartenraster', direction: 'visuell',
      concept: 'Große Rezeptkarten mit Farbfläche, Zeit, Kalorien und Eiweiß; Filter-Chips darüber.',
      description: '+ Einladend, schnell zu überblicken  − Weniger Rezepte pro Bildschirm',
      layout: { type: 'stack' },
      blocks: [hdr({ title: 'Rezepte', subtitle: '8 eigene Rezepte', primaryLabel: 'Neu', primaryEvent: 'recipe.create' }), { id: 'rl', component: 'recipe-list', region: 'main', props: { style: 'grid' } }],
    },
    {
      id: 'B', name: 'Kompakte Liste', direction: 'kompakt',
      concept: 'Schmale Liste mit Zeit und kcal rechts, Filter in einer Seitenleiste; ideal bei vielen Rezepten.',
      description: '+ Viele Rezepte auf einmal  − Weniger Appetit-Anreiz',
      layout: { type: 'sidebar', panelLabel: 'Suche & Filter' },
      blocks: [hdr({ title: 'Rezepte', subtitle: 'Suchen und filtern', primaryLabel: 'Neu', primaryEvent: 'recipe.create' }), { id: 'rl', component: 'recipe-list', region: 'main', props: { style: 'list', showFilters: true } }],
    },
  ],
  selectedVariantId: 'A', links: ['nutrition.recipe', 'nutrition.plan'],
};

const recipe = {
  id: 'nutrition.recipe', name: 'Rezept-Detail', group: 'Wissen', status: 'review',
  purpose: 'Ein Rezept lesen, auf die gewünschte Portionszahl skalieren, Nährwerte je Portion prüfen, kochen (Schritt für Schritt) und in Tagebuch, Plan oder Einkaufsliste übernehmen.',
  requirements: [
    { text: 'Portionen per Stepper skalieren: Zutatenmengen ändern sich, Nährwerte je Portion bleiben gleich, Gesamt wird mitgerechnet', type: 'rule', priority: 'must' },
    { text: 'Nährwerte je Portion (kcal, Eiweiß, Kohlenhydrate, Fett) aus den Zutaten berechnet; Allergene aggregiert', type: 'info', priority: 'must' },
    { text: 'Aktionen: Ins Tagebuch (Mahlzeit und Portionen wählbar), In den Plan (Tag und Mahlzeit), Zutaten zur Einkaufsliste, Favorit', type: 'action', priority: 'must' },
    { text: 'Kochmodus: ein Schritt pro Ansicht, große Schrift, Zutaten aufklappbar, Timer bei Schritten mit Zeit', type: 'action', priority: 'should' },
    { text: 'Schritte mit Zeitangabe zeigen eine Zeit-Marke', type: 'info', priority: 'should' },
    GUARD,
  ],
  interactions: [
    { trigger: 'Zutaten zur Einkaufsliste', result: 'Zutaten (skaliert) landen in der Einkaufsliste, diese öffnet sich', event: 'recipe.shop', to: 'nutrition.shopping' },
    { trigger: 'Ins Tagebuch', result: 'Dialog: Portionen und Mahlzeit, dann Eintrag', event: 'recipe.log' },
    { trigger: 'In den Plan', result: 'Dialog: Tag und Mahlzeit, dann Planpunkt', event: 'recipe.plan' },
    { trigger: 'Kochmodus', result: 'Schritt-für-Schritt-Ansicht', event: 'recipe.cook' },
    { trigger: 'Portionen ändern', result: 'Mengen skalieren', event: 'recipe.servings' },
  ],
  acceptance: ['Von 2 auf 4 Portionen verdoppeln sich alle Zutatenmengen, die Nährwerte je Portion bleiben gleich.', '„Zutaten zur Einkaufsliste“ übernimmt die skalierten Mengen und öffnet die Einkaufsliste.', 'Der Kochmodus ist bei 390 px ohne Überlauf bedienbar, jeder Schritt füllt einen Bildschirm.'],
  viewports: ALL_VP,
  demoData: { ...D('recipes', 'foods', 'diary', 'plan', 'shopping', 'goals') },
  variants: [
    {
      id: 'A', name: 'Rezept vollständig', direction: 'visuell',
      concept: 'Kopf mit Farbfläche und Aktionen, darunter Zutaten und Zubereitung. Alles auf einer Seite, der Kochmodus ersetzt die Ansicht.',
      description: '+ Alles im Blick, wenig Taps  − Auf Mobile lang',
      layout: { type: 'stack' },
      blocks: [{ id: 'rd', component: 'recipe-detail', region: 'main', props: {} }],
    },
    {
      id: 'B', name: 'Passt es in den Tag?', direction: 'fokus',
      concept: 'Neben dem Rezept zeigt eine Seitenspalte, wie es in die heutige Bilanz passt (Kalorien, Makros) und welche Hinweise gelten.',
      description: '+ Entscheidungshilfe „soll ich das kochen?“  − Mehr Bausteine',
      layout: { type: 'split' },
      blocks: [{ id: 'rd', component: 'recipe-detail', region: 'main', props: {} }, { id: 'bal', component: 'calorie-budget', region: 'aside', props: { style: 'bar', title: 'Heute noch übrig' } }, { id: 'mac', component: 'macro-summary', region: 'aside', props: { mode: 'bars', dense: true, title: 'Makros heute' } }, { id: 'hints', component: 'nutrition-hints', region: 'aside', props: { limit: 2 } }],
    },
  ],
  selectedVariantId: 'A', links: ['nutrition.recipes', 'nutrition.shopping', 'nutrition.plan'],
};

// ============================================================= Wochenplan
const plan = {
  id: 'nutrition.plan', name: 'Wochenplan', group: 'Planung', status: 'design',
  purpose: 'Mahlzeiten vorausplanen, damit Erfassen zum Abhaken wird: Raster Mo bis So, Tagessummen gegen das Ziel, Verbindung zu Rezepten, Einkauf und Kalender.',
  requirements: [
    { text: 'Raster Mo bis So × Frühstück, Mittag, Abend, Snack (Desktop), Tagesliste mit Tagesleiste (Mobil)', type: 'info', priority: 'must' },
    { text: 'Slot füllen aus Rezepten, Zuletzt, „Reste“ und „Auswärts“ (mit Kalorienschätzung)', type: 'action', priority: 'must' },
    { text: 'Tagessummen kcal und Eiweiß gegen das Ziel, neutral dargestellt', type: 'info', priority: 'must' },
    { text: 'Verschieben und Entfernen über das Menü des Eintrags', type: 'action', priority: 'must' },
    { text: '„Wie geplant gegessen“ übernimmt einen Planpunkt mit einem Tap ins Tagebuch (nur für heute und früher)', type: 'action', priority: 'must' },
    { text: 'Woche kopieren; Planänderungen wirken sofort auf die Einkaufsliste', type: 'action', priority: 'should' },
    { text: 'Mittag „auswärts“ ist mit dem Kalendertermin verknüpfbar (z. B. Mittag mit Jana)', type: 'rule', priority: 'could' },
    GUARD,
  ],
  interactions: [
    { trigger: 'Eintrag antippen → „Rezept öffnen“', result: 'Rezept-Detail öffnet sich', event: 'recipe.open', to: 'nutrition.recipe' },
    { trigger: '„Einkaufsliste“ im Kopf', result: 'Einkaufsliste für die geplanten Tage öffnet sich', event: 'header.secondary', to: 'nutrition.shopping' },
    { trigger: '„+“ in einem Slot', result: 'Auswahl: Rezepte, Zuletzt, Reste, Auswärts', event: 'plan.slot' },
    { trigger: 'Mahlzeit wählen', result: 'Planpunkt gesetzt, Tagessumme aktualisiert', event: 'plan.set' },
    { trigger: 'Verschieben', result: 'Neuer Tag und Mahlzeit', event: 'plan.move' },
    { trigger: 'Woche kopieren', result: 'Nächste Woche enthält denselben Plan', event: 'plan.copyweek' },
  ],
  acceptance: ['Rezept in einen Slot setzen aktualisiert die Tagessumme und die Einkaufsliste.', '„Wie geplant gegessen“ schreibt in das Tagebuch und markiert den Planpunkt als gegessen.', 'Mobil ist der Plan ohne horizontales Scrollen bedienbar.'],
  viewports: ALL_VP,
  demoData: { ...D('plan', 'recipes', 'foods', 'goals', 'diary') },
  variants: [
    {
      id: 'A', name: 'Wochenraster', direction: 'kompakt',
      concept: 'Ganze Woche als Raster mit Tagessummen am Fuß; auf kleinen Bildschirmen wird daraus eine Tagesliste mit Tagesleiste.',
      description: '+ Woche auf einen Blick, schnelles Umplanen  − Zellen sind klein',
      layout: { type: 'stack' },
      blocks: [hdr({ title: 'Wochenplan', subtitle: 'KW 48 · 23.–29. November', secondaryLabel: 'Einkaufsliste', secondaryIcon: 'shopping-cart' }), { id: 'wp', component: 'week-planner', region: 'main', props: { view: 'auto', framed: false } }, LEGAL],
    },
    {
      id: 'B', name: 'Tag im Fokus', direction: 'fokus',
      concept: 'Immer die Tagesansicht mit Tagesleiste; rechts die nächste Mahlzeit und das Tagesbudget, damit Planen und Erfassen zusammenpassen.',
      description: '+ Ruhig, passend zum Tagesgeschäft  − Wochenüberblick nur über die Tagesleiste',
      layout: { type: 'split' },
      blocks: [hdr({ title: 'Wochenplan', subtitle: 'Heute und die nächsten Tage', secondaryLabel: 'Einkaufsliste', secondaryIcon: 'shopping-cart' }), { id: 'wp', component: 'week-planner', region: 'main', props: { view: 'day', title: 'Plan' } }, { id: 'next', component: 'next-meal-card', region: 'aside', props: { size: 'hero' } }, { id: 'bal', component: 'calorie-budget', region: 'aside', props: { style: 'bar', title: 'Heute' } }],
    },
  ],
  selectedVariantId: 'A', links: ['nutrition.recipe', 'nutrition.shopping', 'nutrition.home'],
};

// ====================================================== Einkaufsliste
const shopping = {
  id: 'nutrition.shopping', name: 'Einkaufsliste', group: 'Planung', status: 'design',
  purpose: 'Vom Plan in zwei Taps zur Liste, im Laden ohne Suchen abhaken: Zutaten werden summiert, mit dem Vorrat abgeglichen und nach Gängen sortiert.',
  requirements: [
    { text: 'Zeitraum wählbar (3 oder 7 Tage); gleiche Zutaten werden summiert (zweimal 100 g Haferflocken = 200 g)', type: 'rule', priority: 'must' },
    { text: 'Vorrat-Abgleich: „Zuhause vorhanden“ nimmt Zutaten von der Liste, „Doch kaufen“ holt sie zurück', type: 'action', priority: 'must' },
    { text: 'Gruppierung nach Gängen (Obst & Gemüse, Kühlregal, Trockenwaren, Tiefkühl, Getränke, Sonstiges)', type: 'info', priority: 'must' },
    { text: 'Abhaken mit großen Touch-Flächen; Erledigtes rutscht nach unten', type: 'action', priority: 'must' },
    { text: 'Manuelle Zusätze per Eingabezeile', type: 'action', priority: 'should' },
    { text: 'Preisschätzung in Euro mit Bezug zum Lebensmittel-Budget aus Finanzen (nur Schätzung)', type: 'info', priority: 'should' },
    { text: 'Export als Aufgabe „Einkaufen“ mit Fälligkeit; Laden-Modus mit großer Schrift', type: 'action', priority: 'should' },
    { text: 'Leer: „Plan erstellen“ führt in den Wochenplan', type: 'state', priority: 'must' },
  ],
  interactions: [
    { trigger: 'Zutat abhaken', result: 'Eintrag rutscht nach unten, Fortschritt steigt', event: 'shop.toggle' },
    { trigger: 'Haus-Symbol („zuhause vorhanden“)', result: 'Zutat wechselt in den Vorrat', event: 'shop.pantry' },
    { trigger: 'Zeitraum 3 / 7 Tage', result: 'Liste rechnet neu', event: 'shop.range' },
    { trigger: 'Als Aufgabe anlegen', result: 'Aufgabe „Einkaufen“ mit Fälligkeit entsteht', event: 'shop.export' },
    { trigger: 'Leer: „Plan erstellen“', result: 'Wochenplan öffnet sich', event: 'shop.plan', to: 'nutrition.plan' },
    { trigger: 'Eigenen Eintrag hinzufügen', result: 'Eintrag in „Sonstiges“', event: 'shop.add' },
  ],
  acceptance: ['Aus einem 3-Tage-Plan entsteht eine summierte Liste, Zutaten aus dem Vorrat fehlen darin.', 'Abhaken verschiebt Einträge nach unten; Export erzeugt eine Aufgabe mit Fälligkeit.', 'Touch-Ziele mindestens 44 px, Laden-Modus ist in Horizon gut lesbar.'],
  viewports: ALL_VP,
  demoData: { ...D('plan', 'recipes', 'foods', 'shopping'), tasks: '@world:tasks' },
  variants: [
    {
      id: 'A', name: 'Liste nach Gängen', direction: 'kompakt',
      concept: 'Eine Spalte nach Gängen mit Abhaken, Vorrat und Preisschätzung; Laden-Modus für große Schrift.',
      description: '+ Im Laden sofort nutzbar  − Plan nicht sichtbar',
      layout: { type: 'stack', narrow: true },
      blocks: [hdr({ title: 'Einkaufsliste', subtitle: 'Aus deinem Wochenplan' }), { id: 'sl', component: 'shopping-list', region: 'main', props: { framed: false } }],
    },
    {
      id: 'B', name: 'Plan neben der Liste', direction: 'visuell',
      concept: 'Links die Liste, rechts der Tagesplan, damit man sieht, wofür man einkauft und kurz umplanen kann.',
      description: '+ Zusammenhang sichtbar, Planänderung wirkt sofort  − Mehr Fläche nötig',
      layout: { type: 'split' },
      blocks: [hdr({ title: 'Einkaufsliste', subtitle: 'Zutaten für die nächsten Tage' }), { id: 'sl', component: 'shopping-list', region: 'main', props: {} }, { id: 'wp', component: 'week-planner', region: 'aside', props: { view: 'day', title: 'Dein Plan' }, hideOn: ['mobile'] }],
    },
  ],
  selectedVariantId: 'A', links: ['nutrition.plan', 'nutrition.recipe'],
};

// ============================================================ Ziele & Bedarf
const goals = {
  id: 'nutrition.goals', name: 'Ziele & Bedarf', group: 'Ziele & Auswertung', status: 'design',
  purpose: 'Ein nachvollziehbares, sicheres Kalorien- und Makroziel finden: Assistent in vier Schritten mit Herleitung und Sicherheits-Stopps. Das Körperprofil wird auch von Fitness genutzt.',
  requirements: [
    { text: 'Vier Schritte: Ziel (Abnehmen, Halten, Aufbauen, „Gesund essen ohne Zahlen“) → Körperdaten → Aktivität → Ergebnis', type: 'info', priority: 'must' },
    { text: 'Ergebnis zeigt Grundumsatz (Mifflin-St-Jeor), Gesamtumsatz, empfohlenes Ziel als Spanne und die aufklappbare Herleitung jeder Zahl', type: 'info', priority: 'must' },
    { text: 'Sicherheits-Stopp: kein Ziel unter dem Grundumsatz bzw. der Untergrenze; Abnehmtempo höchstens ca. 1 % Körpergewicht pro Woche', type: 'rule', priority: 'must' },
    { text: 'Unter 18 Jahren keine Defizit-Ziele; Hinweis auf ärztlichen Rat bei Schwangerschaft, Stillzeit und Vorerkrankungen', type: 'rule', priority: 'must' },
    { text: 'Tempo-Regler, Makro-Presets (Eiweiß pro kg, Mindestfett), Trainingstag-Zuschlag nur als Vorschlag', type: 'action', priority: 'should' },
    { text: 'Aktivitätskalorien werden nicht zusätzlich als Essensbudget angerechnet (Standard aus)', type: 'rule', priority: 'must' },
    { text: 'Gewohnheitsmodus: Zahlen ausblenden', type: 'action', priority: 'should' },
    GUARD,
  ],
  interactions: [
    { trigger: 'Weiter / Zurück', result: 'Nächster Schritt des Assistenten', event: 'goals.step' },
    { trigger: 'Tempo-Regler bewegen', result: 'Ziel und Dauer rechnen neu', event: 'goals.pace' },
    { trigger: '„Ziel übernehmen“', result: 'Ziel gespeichert, Übersicht öffnet sich', event: 'goals.apply', to: 'nutrition.home' },
    { trigger: 'Ziel unter Grundumsatz', result: 'Sicherheits-Stopp, Ziel wird angehoben', event: 'goals.blocked' },
  ],
  acceptance: ['Mit 182 cm, 78,4 kg, 38 Jahren und „aktiv“ ergibt sich ein Grundumsatz von 1.737 kcal und ein Gesamtumsatz von 2.692 kcal.', 'Ein Defizit, das unter den Grundumsatz führt, wird auf die Untergrenze angehoben und erklärt.', 'Unter 18 Jahren ist „Abnehmen“ nicht wählbar.', 'Jeder Schritt ist bei 390 px ohne Scrollen bedienbar; die Herleitung ist aufklappbar.'],
  flows: [{ id: 'fl-ziel', name: 'Ziel festlegen', steps: [{ featureId: 'nutrition.goals', action: 'Vier Schritte durchlaufen' }, { featureId: 'nutrition.home', action: 'Neue Bilanz sehen' }] }],
  viewports: ALL_VP,
  demoData: { ...D('goals', 'profile', 'diary', 'plan') },
  variants: [
    {
      id: 'A', name: 'Assistent', direction: 'kompakt',
      concept: 'Ein schmaler Assistent, ein Schritt pro Ansicht, Herleitung aufklappbar, Hinweis darunter.',
      description: '+ Klar, wenig Ablenkung  − Wirkung auf die Übersicht erst nach Übernahme sichtbar',
      layout: { type: 'stack', narrow: true },
      blocks: [hdr({ title: 'Ziele & Bedarf', subtitle: 'In vier Schritten zu deinem Richtwert' }), { id: 'gw', component: 'goal-wizard', region: 'main', props: { startStep: 4 } }, LEGAL],
    },
    {
      id: 'B', name: 'Assistent mit Vorschau', direction: 'fokus',
      concept: 'Der Assistent links, rechts die heutige Bilanz und Makros, damit man sieht, was das neue Ziel für heute bedeutet.',
      description: '+ Unmittelbare Wirkung sichtbar  − Auf Mobile untereinander',
      layout: { type: 'split' },
      blocks: [hdr({ title: 'Ziele & Bedarf', subtitle: 'Richtwert mit Vorschau' }), { id: 'gw', component: 'goal-wizard', region: 'main', props: { startStep: 1 } }, { id: 'bal', component: 'calorie-budget', region: 'aside', props: { style: 'bar', title: 'Heute mit diesem Ziel' } }, { id: 'mac', component: 'macro-summary', region: 'aside', props: { mode: 'bars', dense: true } }, LEGAL],
    },
  ],
  selectedVariantId: 'A', links: ['nutrition.home', 'fitness.body'],
};

// ============================================================= Auswertung
const insights = {
  id: 'nutrition.insights', name: 'Auswertung', group: 'Ziele & Auswertung', status: 'design',
  purpose: 'Muster erkennen, nicht bewerten: Wochen- und Monatsverlauf, Durchschnitte nur über erfasste Tage, Makro-Verteilung, häufigste Lebensmittel, Ballaststoffe/Zucker/Salz und der Gewichtstrend daneben.',
  requirements: [
    { text: 'Woche und Monat mit Durchschnitt kcal und Eiweiß sowie „Tage im Zielkorridor (±10 %)“ statt Tages-Streak', type: 'info', priority: 'must' },
    { text: 'Nicht erfasste Tage zählen nicht als 0 kcal und gehen nicht in den Durchschnitt ein; unter drei erfassten Tagen: „Noch zu wenig Daten“', type: 'rule', priority: 'must' },
    { text: 'Makro-Verteilung, Top-5-Lebensmittel nach Kalorien oder Eiweiß, Ballaststoffe/Zucker/Salz gegen Orientierungswerte', type: 'info', priority: 'should' },
    { text: 'Gewichtstrend neben Kalorien, neutral dargestellt (Wochentrend statt Tageswert)', type: 'info', priority: 'should' },
    { text: 'Heute (läuft noch) wird gekennzeichnet und nicht in Durchschnitte eingerechnet', type: 'rule', priority: 'must' },
    { text: 'Keine Bewertungswörter („verloren“, „versagt“), keine Rotfärbung', type: 'rule', priority: 'must' },
    { text: 'Export (CSV für Arzt oder Coach) ist als spätere Erweiterung vorgesehen', type: 'action', priority: 'could' },
    GUARD,
  ],
  interactions: [
    { trigger: 'Tag im Verlauf antippen', result: 'Details des Tages unter dem Diagramm', event: 'trend.day' },
    { trigger: 'Woche / Monat', result: 'Zeitraum wechselt', event: 'trend.range' },
    { trigger: 'Sortierung der Top-Lebensmittel', result: 'Nach Kalorien oder Eiweiß', event: 'stats.basis' },
  ],
  acceptance: ['Der Durchschnitt wird über erfasste Tage berechnet: bei sieben Tagen mit einer Lücke und dem laufenden heutigen Tag über fünf Tage.', 'Unter drei erfassten Tagen erscheint der Hinweis statt Zahlen.', 'Der Verlauf nutzt keine Rottöne, auch nicht für Tage über dem Ziel.'],
  viewports: ALL_VP,
  demoData: { ...D('history', 'diary', 'goals', 'profile', 'foods', 'water', 'plan') },
  variants: [
    {
      id: 'A', name: 'Analyse kompakt', direction: 'kompakt',
      concept: 'Verlauf mit Umschalter Woche/Monat und Kennzahlen, daneben Top-Lebensmittel, Makro-Verteilung, Mikronährstoffe und Gewicht als dichte Spalte.',
      description: '+ Viel Information, vergleichbar  − Zahlenlastig',
      layout: { type: 'split' },
      blocks: [hdr({ title: 'Auswertung', subtitle: 'Nur erfasste Tage zählen' }), { id: 'trend', component: 'kcal-trend', region: 'main', props: { range: 'week', switcher: true, title: 'Kalorien-Verlauf' } }, { id: 'top', component: 'nutrition-stats', region: 'main', props: { mode: 'top' } }, { id: 'mac', component: 'nutrition-stats', region: 'aside', props: { mode: 'macros' } }, { id: 'mic', component: 'nutrition-stats', region: 'aside', props: { mode: 'micro' } }, { id: 'wt', component: 'nutrition-stats', region: 'aside', props: { mode: 'weight' } }, LEGAL],
    },
    {
      id: 'B', name: 'Karten', direction: 'visuell',
      concept: 'Vier ruhige Karten: Wochenverlauf, Makro-Verteilung, Gewichtstrend und Ballaststoffe. Jede Karte erzählt eine Sache.',
      description: '+ Gut lesbar, entspannt  − Weniger Detail',
      layout: { type: 'grid' },
      blocks: [hdr({ title: 'Auswertung', subtitle: 'Muster erkennen, nicht bewerten' }), { id: 'trend', component: 'kcal-trend', region: 'main', span: 12, props: { range: 'month', switcher: true, height: 170 } }, { id: 'mac', component: 'nutrition-stats', region: 'main', span: 6, props: { mode: 'macros' } }, { id: 'wt', component: 'nutrition-stats', region: 'main', span: 6, props: { mode: 'weight' } }, { id: 'mic', component: 'nutrition-stats', region: 'main', span: 6, props: { mode: 'micro' } }, { id: 'top', component: 'nutrition-stats', region: 'main', span: 6, props: { mode: 'top' } }, LEGAL],
    },
    {
      id: 'C', name: 'Was fällt auf?', direction: 'fokus',
      concept: 'Zuerst ein bis zwei freundliche Beobachtungen, dann der Wochenverlauf und der Gewichtstrend. Alles andere auf Nachfrage.',
      description: '+ Verständliche Botschaft  − Weniger Rohdaten',
      layout: { type: 'stack', narrow: true },
      blocks: [hdr({ title: 'Auswertung', subtitle: 'Die Woche in Kürze' }), { id: 'hints', component: 'nutrition-hints', region: 'main', props: { limit: 2, title: 'Was fällt auf?' } }, { id: 'trend', component: 'kcal-trend', region: 'main', props: { range: 'week' } }, { id: 'wt', component: 'nutrition-stats', region: 'main', props: { mode: 'weight' } }, LEGAL],
    },
  ],
  selectedVariantId: 'A', links: ['nutrition.home'],
};

// ==================================================== Ideen ohne Design
const templates = {
  id: 'nutrition.templates', name: 'Vorlagen & Favoriten', group: 'Tagebuch', status: 'not_analyzed',
  purpose: 'Häufige Mahlzeiten als Vorlage speichern („Meine Skyr-Bowl“, „Shake nach dem Training“) und mit einem Tap erfassen. Ergänzt Zuletzt und Favoriten im Erfassen-Screen.',
  requirements: [
    { text: 'Aktuelle Auswahl oder einen Tag als Vorlage speichern, benennen und löschen', type: 'action', priority: 'must' },
    { text: 'Vorlage mit einem Tap in die gewählte Mahlzeit erfassen (alle Zutaten)', type: 'action', priority: 'must' },
    { text: '„Wie gestern“ und „Mahlzeit kopieren“ als Schnellaktionen', type: 'action', priority: 'should' },
  ],
  interactions: [], viewports: ALL_VP, demoData: {}, variants: [], links: ['nutrition.log'],
};
const habit = {
  id: 'nutrition.habit', name: 'Gewohnheitsmodus', group: 'Ziele & Auswertung', status: 'analyzed',
  purpose: 'Option „Zahlen ausblenden“ für essstörungssensible Nutzung: nur Mahlzeiten, Wasser und Training bleiben sichtbar, Kalorien und Gramm verschwinden aus allen Ernährungs-Screens.',
  requirements: [
    { text: 'Ein Schalter in den Einstellungen oder im Ziele-Assistenten („Gesund essen ohne Zahlen“) blendet alle kcal- und g-Werte aus', type: 'rule', priority: 'must' },
    { text: 'Statt Zahlen erscheinen qualitative Rückmeldungen („gut im Rahmen“), nie Bewertungen', type: 'rule', priority: 'must' },
    { text: 'Intern bleibt ein Richtwert erhalten, damit Planung und Hinweise weiter funktionieren', type: 'info', priority: 'should' },
    { text: 'Bereits umgesetzt in calorie-budget und macro-summary (goals.showNumbers = false); weitere Komponenten folgen', type: 'info', priority: 'should' },
  ],
  interactions: [], viewports: ['mobile', 'tablet'], demoData: {}, variants: [], links: ['nutrition.goals', 'settings.appearance'],
};

export default {
  module: {
    id: 'nutrition', name: 'Ernährung', icon: 'salad', area: 'Gesundheit', legal: ['gesundheit'], status: 'active', theme: 'graphite', designVersion: '0.2',
    description: 'Mahlzeiten in zwei bis drei Taps erfassen, Kalorien und Makros ohne Druck im Blick behalten, Rezepte, Wochenplan und Einkaufsliste verbinden.',
    source: 'Workbench V2 (Bauplan Brainstorming 24.11.2026); Abgleich mit dem echten TAKT-Konzept in Phase 1',
    infoArchitecture: 'Einstieg „Übersicht“ (Heute). Erfassen ist die zentrale Primäraktion und von jedem Screen erreichbar (Primärbutton, „+“ je Mahlzeit, Erfassen-Leiste). Modulnavigation: Übersicht · Plan · Rezepte · Einkauf · Auswertung, Rest unter „Mehr“. Gruppen: Übersicht, Tagebuch (Erfassen, Wasser, Vorlagen), Wissen (Lebensmittel, Rezepte, Rezept-Detail), Planung (Wochenplan, Einkaufsliste), Ziele und Auswertung (Ziele & Bedarf, Auswertung, Gewohnheitsmodus). Wege: Übersicht → Erfassen / Wasser / Auswertung · Rezepte → Rezept · Plan → Rezept → Einkaufsliste.',
    docs: [
      '## Begriffe',
      'Mahlzeit (Frühstück, Mittag, Abend, Snacks), Eintrag (ein Lebensmittel oder Rezept mit Menge), Portion, Tagebuch (alle Einträge eines Tages), Vorlage (gespeicherte Mahlzeit).',
      '',
      '## Datenwelt',
      'Alle Screens teilen den Weltzustand (seed/world/nutrition.js): Tagebuch (7 Tage), Lebensmittel (46), Rezepte (8), Wochenplan, Einkauf, Wasser, Ziele und Profil. Beispiel: „+“ bei Skyr im Erfassen-Screen ändert sofort Bilanz, Makros und Hinweise der Übersicht. Summen werden aus den Einträgen berechnet, nicht gepflegt.',
      '',
      '## Gesundheits-Leitplanken (verbindlich)',
      '- Kein Medizinprodukt: Bedarfsrechner sind Orientierung, Hinweis „kein medizinischer Rat“ über legal-notice (Art gesundheit).',
      '- Kalorienziel nie unter dem Grundumsatz bzw. einer Untergrenze, Abnehmtempo höchstens ca. 1 % Körpergewicht pro Woche, unter 18 keine Defizit-Ziele. Orientierungswerte sind vor der Übernahme gegen DGE und ärztliche Quellen zu prüfen.',
      '- Tonalität: Überschreitung nie rot oder alarmierend („Heute etwas über dem Ziel – der Wochenschnitt zählt“), keine Moralwörter, Wochen- statt Tagesbewertung, Aktivitätskalorien nicht als zusätzliches Budget.',
      '- Gewohnheitsmodus ohne Zahlen, Allergene mit „Angaben ohne Gewähr“, Gesundheitsdaten lokal (Art. 9 DSGVO).',
      '',
      '## Offene Fragen',
      '- Welche Lebensmittel-Datenquelle ist produktiv zulässig (Lizenz, Pflege)?',
      '- Wie wird das Körperprofil mit Fitness geteilt (Gewicht, Größe, Aktivität)?',
      '- Foto-Eintrag und Nährwert-Etikett per Picture-to-Text sind bewusst noch nicht gebaut.',
    ].join('\n'),
    links: ['fitness', 'calendar', 'tasks', 'finance', 'weather', 'home', 'settings'],
    homeFeatureId: 'nutrition.home',
  },
  features: [home, log, water, foods, recipes, recipe, plan, shopping, goals, insights, templates, habit].map(withLegal),
  decisions: [
    { featureId: 'nutrition.home', title: 'Ernährung als eigenes Modul oder Teil von Fitness?', decision: 'Eigenes Modul. Körperprofil (Gewicht, Größe, Aktivität) und Gewichtstrend werden gemeinsam mit Fitness genutzt.', rationale: 'Ernährung wird täglich mehrfach mit eiligen Fingern benutzt und hat einen eigenen Erfassungsfluss; Fitness hat Trainingseinheiten und Fortschritt.', tradeoffs: 'Zwei Module mit gemeinsamer Datenbasis brauchen sauberen Datenvertrag (Welt-Schlüssel nutProfile).', status: 'decided', decidedAt: '2026-11-24T09:00:00' },
    { featureId: 'nutrition.goals', title: 'Aktivitätskalorien im Essensbudget anrechnen?', decision: 'Standardmäßig nicht. Aktivität wird als Information gezeigt, die Anrechnung bleibt eine bewusste Option.', rationale: 'Aktivitätskalorien sind Schätzungen; automatische Anrechnung kann zu zu geringer Zufuhr führen (Leitplanke).', tradeoffs: 'Weniger „Belohnungsgefühl“ nach dem Training, dafür ruhigere und sicherere Bilanz.', status: 'decided', decidedAt: '2026-11-24T09:10:00' },
    { featureId: 'nutrition.foods', title: 'Welche Lebensmittel-Datenquelle nutzt die echte App?', decision: '', rationale: 'Open Food Facts (ODbL, Namensnennung, Community-Daten), BLS (lizenzpflichtig), eigene Pflege (hoher Aufwand) oder Mischform. Die Demo nutzt eigene, plausible Richtwerte.', tradeoffs: 'Qualität und Abdeckung gegen Lizenzkosten und Pflegeaufwand; Marken-Barcodes gibt es praktisch nur über Open Food Facts.', alternatives: 'Open Food Facts + lokale Eigenpflege; BLS für Grundnahrungsmittel; reine Eigenpflege.', status: 'open' },
    { featureId: 'nutrition.water', title: 'Wasser als eigenes Feature oder nur Baustein der Übersicht?', decision: 'Beides: Baustein in der Übersicht für den Ein-Tap-Fall, eigenes Feature für Gefäße, Verlauf und Woche.', rationale: 'Der häufigste Fall (+250 ml) braucht keinen Screenwechsel, Details sind selten.', tradeoffs: 'Komponente muss in mehreren Darstellungen funktionieren (Raster, Balken, kompakt, Zeitleiste).', status: 'decided', decidedAt: '2026-11-24T09:20:00' },
    { featureId: 'nutrition.habit', title: 'Gewohnheitsmodus beim Onboarding anbieten oder nur in den Einstellungen?', decision: '', rationale: 'Frühes Angebot erreicht Betroffene besser, kann aber andere irritieren. Empfehlung: neutral formulierte Frage im Ziele-Assistenten („Gesund essen ohne Zahlen“).', tradeoffs: 'Sichtbarkeit gegen Aufdringlichkeit.', status: 'open' },
  ],
};
