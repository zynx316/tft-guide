// Modul "Einkauf & Haushalt" – Seed-Manifest. Referenztag: Di, 24.11.2026 09:30 (ctx.today).
// Daten: gemeinsame Welt (world/shopping.js, Eigentümer: shopping). Die Lebensmittel-Liste ist die Ableitung aus Ernährung (`nutShopping`):
// Abhaken und „Milch“ aus Erfassen wirken in beiden Modulen. Eigene Daten: weitere Listen, Läden mit Gängen, Vorräte, Einkäufe, Haushalt & Wartung.
// Budget wird nur gelesen. Wartungsfristen laufen über core/recurrence.js.

const ALL_VP = ['desktop', 'notebook', 'tablet', 'mobile'];
const D = {
  lists: '@world:shoppingLists', shopping: '@world:nutShopping', plan: '@world:nutPlan', recipes: '@world:nutRecipes', foods: '@world:nutFoods',
  stores: '@world:shoppingStores', pantry: '@world:shoppingPantry', household: '@world:householdTasks', trips: '@world:shoppingTrips',
  tasks: '@world:tasks', templates: '@world:householdTemplates', budgets: '@world:budgets', transactions: '@world:transactions',
};
const hdr = (props) => ({ id: 'hdr', component: 'page-header', region: 'header', props: { eyebrow: 'Einkauf & Haushalt', primaryLabel: '', ...props } });
const blk = (id, component, region, props = {}, extra = {}) => ({ id, component, region, props, ...extra });
const I = (trigger, result, event, to) => ({ trigger, result, event, ...(to ? { to } : {}) });

// ================================================================== Startseite
const home = {
  id: 'shopping.home', name: 'Übersicht', group: 'Übersicht', status: 'design', tier: 1, usage: 'täglich',
  purpose: 'Der Einstieg in Einkauf und Haushalt: welche Listen offene Artikel haben, wann der nächste Einkauf ist, was im Haushalt fällig wird und wie viel Lebensmittel-Budget übrig ist.',
  requirements: [
    { text: 'Listen mit offenen Artikeln: Lebensmittel (aus Ernährung), Drogerie, Baumarkt; Antippen öffnet die Liste', type: 'info', priority: 'must' },
    { text: 'Nächster Einkauf: Tag, Laden, offene Artikel und Laufweg durch die Gänge; „Laden-Modus starten“ ohne Umweg', type: 'action', priority: 'must' },
    { text: 'Haushalt fällig: überfällige und heutige Wartung mit „Erledigt“ in der Zeile, die nächste Fälligkeit ergibt sich aus der Regel', type: 'action', priority: 'must' },
    { text: 'Budget-Rest für Lebensmittel, nur gelesen, identisch mit „Budget übrig“ in Ernährung; Beträge im Privatmodus maskiert', type: 'info', priority: 'must' },
    { text: 'Knappe Vorräte mit „Auf die Liste“; nichts wird doppelt angelegt', type: 'action', priority: 'should' },
    { text: 'Schnell erfassen auf der Startseite (Fokus-Version): „2 l Milch“ landet auf der Lebensmittel-Liste, mit Rückgängig', type: 'action', priority: 'should' },
    { text: 'Erststart: Einladung „Erste Liste füllen“ und Vorschläge für Wartung statt leerer Flächen', type: 'state', priority: 'must' },
    { text: 'Keine zweite Navigationsleiste im Modul (der App-Rahmen navigiert)', type: 'rule', priority: 'must' },
  ],
  interactions: [
    I('Liste antippen', 'Die Liste öffnet sich', 'list.open', 'shopping.list'),
    I('Listen-Chip antippen', 'Die Liste öffnet sich', 'list.select', 'shopping.list'),
    I('„Artikel“ antippen', 'Liste mit Eingabefeld öffnet sich', 'item.add.open', 'shopping.list'),
    I('„Laden-Modus“ antippen', 'Laden-Modus mit großen Flächen öffnet sich', 'header.secondary', 'shopping.store'),
    I('„Laden-Modus starten“ im Einkaufsplan', 'Laden-Modus öffnet sich mit der Liste des Einkaufs', 'trip.start', 'shopping.store'),
    I('Nächsten Einkauf in „Als Nächstes“ antippen', 'Laden-Modus öffnet sich', 'next.trip', 'shopping.store'),
    I('„Alle Wartungsaufgaben“ antippen', 'Haushalt & Wartung öffnet sich', 'hh.open', 'shopping.household'),
    I('„Haushalt ansehen“ antippen', 'Haushalt & Wartung öffnet sich', 'next.open', 'shopping.household'),
    I('„Alle Vorräte“ antippen', 'Vorräte öffnen sich', 'pantry.open', 'shopping.pantry'),
    I('„Budgets in Finanzen“ antippen', 'Budgets in Finanzen öffnen sich', 'budget.open', 'finance.budgets'),
    I('„Aufgabe ansehen“ bei geplanter Wartung', 'Aufgaben-Detail öffnet sich', 'hh.task.open', 'tasks.detail'),
    I('Wartung „Erledigt“ antippen', 'Nächste Fälligkeit wird gesetzt, Rückgängig erscheint', 'hh.done'),
    I('„Auf die Liste“ bei knappem Vorrat', 'Artikel steht auf der passenden Liste, Rückgängig erscheint', 'pantry.refill'),
    I('Schnelleingabe bestätigen', 'Artikel erscheint im richtigen Gang, Rückgängig erscheint', 'item.add'),
  ],
  acceptance: [
    'Bei 390 px stehen Listen mit offenen Artikeln und der nächste Einkauf (Variante A und B) bzw. die erste Handlung (Variante C) ohne Scrollen im sichtbaren Bereich.',
    '„Erledigt“ bei der Waschmaschinen-Pflege setzt die Fälligkeit auf Do, 17.12. und „Rückgängig“ stellt „seit 7 Tagen überfällig“ wieder her.',
    'Die Zahl offener Artikel der Lebensmittel-Liste ist identisch mit der Liste in Ernährung; Abhaken wirkt in beiden Modulen.',
    'Das Lebensmittel-Budget (187,10 € übrig) stimmt mit „Budget übrig“ in Ernährung überein; im Privatmodus steht kein lesbarer Betrag auf der Seite.',
    'Im Szenario „Erster Start“ erscheint eine Einladung mit erster Aktion; im Szenario „Stress-Tag“ gibt es keinen Überlauf bei langen Namen.',
  ],
  flows: [
    { id: 'fl-morgens', name: 'Morgens Fälliges abhaken', steps: [{ featureId: 'shopping.home', action: 'Dunstabzugsfilter „Erledigt“ antippen' }, { featureId: 'shopping.home', action: 'Nächste Fälligkeit in der Rückgängig-Zeile lesen' }] },
    { id: 'fl-einkauf', name: 'Zum Einkauf', steps: [{ featureId: 'shopping.home', action: '„Laden-Modus starten“' }, { featureId: 'shopping.store', action: 'Gang für Gang abhaken' }, { featureId: 'finance.quickadd', action: 'Ausgabe speichern' }] },
  ],
  viewports: ALL_VP, demoData: D,
  variants: [
    {
      id: 'A', name: 'Listen & Fälliges', direction: 'kompakt',
      concept: 'Dichte Zeilen: alle Listen mit Zahl offener Artikel, darunter Wartung mit „Erledigt“ und knappe Vorräte; rechts nächster Einkauf und Budget als kleine Karten.',
      description: '+ Alles auf einem Screen, Zahlen exakt, Aktionen in der Zeile  − Viele Blöcke, auf dem Handy lang',
      layout: { type: 'split' },
      blocks: [hdr({ title: 'Einkauf & Haushalt', subtitle: 'Di, 24.11.', primaryLabel: 'Artikel', primaryEvent: 'item.add.open', secondaryLabel: 'Laden-Modus', secondaryIcon: 'store' }),
        blk('lists', 'shop-lists', 'main', { style: 'rows', title: 'Listen' }), blk('hh', 'shop-household', 'main', { style: 'summary', limit: 3, title: 'Haushalt fällig' }), blk('pantry', 'shop-pantry', 'main', { style: 'low', limit: 3, title: 'Vorräte knapp', allowAdd: false }),
        blk('trip', 'shop-next-trip', 'aside', { size: 'compact' }), blk('budget', 'shop-budget', 'aside', { style: 'compact' })],
    },
    {
      id: 'B', name: 'Karten & Fortschritt', direction: 'visuell',
      concept: 'Große Listenkarten mit Fortschrittsring, der nächste Einkauf als Hero mit Laufweg, Budget als Ring und das Wartungsjahr als Monatsraster.',
      description: '+ Fortschritt sofort sichtbar, eine Botschaft pro Karte  − Weniger Details pro Zeile, mehr Scrollen',
      layout: { type: 'grid' },
      blocks: [hdr({ title: 'Einkauf & Haushalt', subtitle: 'Alles Nötige im Blick', primaryLabel: 'Artikel', primaryEvent: 'item.add.open' }),
        blk('lists', 'shop-lists', 'main', { style: 'cards', title: 'Deine Listen' }, { span: 12, spanTablet: 12 }), blk('trip', 'shop-next-trip', 'main', { size: 'hero' }, { span: 7, spanTablet: 12 }),
        blk('budget', 'shop-budget', 'main', { style: 'ring' }, { span: 5, spanTablet: 12 }), blk('hh', 'shop-household', 'main', { style: 'year', limit: 4, title: 'Haushalt im Jahr' }, { span: 12, spanTablet: 12 }),
        blk('pantry', 'shop-pantry', 'main', { style: 'low', limit: 4, title: 'Vorräte knapp', allowAdd: false }, { span: 12, spanTablet: 12 })],
    },
    {
      id: 'C', name: 'Was steht an?', direction: 'fokus',
      concept: 'Eine priorisierte Handlung zuerst (Wartung, Einkauf oder knapper Vorrat) mit Ein-Tipp-Aktion, darunter die Schnelleingabe und die Listen als Chips.',
      description: '+ Klare nächste Aktion, Erfassen ohne Umweg  − Wenig Überblick über alle Listen und das Budget',
      layout: { type: 'stack', narrow: true },
      blocks: [hdr({ title: 'Was steht an?', subtitle: 'Di, 24.11. · 09:30', secondaryLabel: 'Laden-Modus', secondaryIcon: 'store' }),
        blk('next', 'shop-next-up', 'main', { limit: 4 }), blk('add', 'shop-quick-add', 'main', { title: 'Etwas fehlt?', showTargets: false }), blk('budget', 'shop-budget', 'main', { style: 'compact', framed: false }), blk('lists', 'shop-lists', 'main', { style: 'chips', allowCreate: false })],
    },
  ],
  selectedVariantId: 'A',
  links: ['shopping.list', 'shopping.store', 'shopping.household', 'shopping.pantry', 'finance.budgets', 'tasks.detail', 'nutrition.shopping'],
};

// ================================================================== Liste
const list = {
  id: 'shopping.list', name: 'Einkaufsliste', group: 'Einkaufen', status: 'review', tier: 1, usage: 'täglich',
  purpose: 'Eine Liste schnell abarbeiten: nach Gang sortiert, abhaken, Menge ändern, in einer Zeile ergänzen. Rückgängig statt Nachfrage. Die Lebensmittel-Liste ist dieselbe wie in Ernährung.',
  requirements: [
    { text: 'Artikel nach Gängen des Ladens gruppiert; abgehakte Artikel rutschen nach unten und bleiben sichtbar', type: 'info', priority: 'must' },
    { text: 'Abhaken mit einem Tipp (Fläche mindestens 44 px), Menge mit − und + bei eigenen Artikeln', type: 'action', priority: 'must' },
    { text: 'Schnelleingabe in einer Zeile: „2 l Milch“, „Zahnpasta“; Gang und Menge werden erkannt, Rückgängig nach dem Hinzufügen', type: 'action', priority: 'must' },
    { text: 'Lebensmittel-Liste schreibt in dieselben Daten wie Ernährung: Abhaken und „Milch“ aus Erfassen sind in beiden Modulen sichtbar', type: 'rule', priority: 'must' },
    { text: 'Mehrere Listen (Lebensmittel, Drogerie, Baumarkt) mit Wechsel per Chip und „Neue Liste“', type: 'action', priority: 'must' },
    { text: 'Leerzustand mit erster Aktion: Plan übernehmen (Lebensmittel) bzw. ersten Artikel hinzufügen', type: 'state', priority: 'must' },
    { text: 'Abgeleitete Zutaten lassen sich als „Zuhause vorhanden“ markieren (wie in Ernährung), Preisschätzung nur als Schätzung', type: 'action', priority: 'should' },
  ],
  interactions: [
    I('„Laden-Modus“ antippen', 'Laden-Modus mit der Liste öffnet sich', 'list.store', 'shopping.store'),
    I('Kopf-Aktion „Laden-Modus“', 'Laden-Modus öffnet sich', 'header.secondary', 'shopping.store'),
    I('Leer: „Plan übernehmen“', 'Zutaten aus dem Plan übernehmen öffnet sich', 'list.plan', 'shopping.plan-import'),
    I('Artikel abhaken', 'Artikel rutscht nach unten, Fortschritt steigt', 'item.toggle'),
    I('Artikel hinzufügen', 'Artikel erscheint im passenden Gang, Rückgängig erscheint', 'item.add'),
    I('Menge ändern (− / +)', 'Menge am Artikel ändert sich', 'item.qty'),
    I('Artikel entfernen', 'Artikel verschwindet, Rückgängig erscheint', 'item.remove'),
    I('Liste wechseln (Chip)', 'Die gewählte Liste erscheint', 'list.select'),
    I('„Zuhause vorhanden“', 'Zutat wandert in den Vorrat (auch in Ernährung)', 'item.pantry'),
  ],
  acceptance: [
    '„2 l Milch“ in die Schnelleingabe tippen legt „Milch“ mit „2 l“ im Gang „Kühlregal“ an; „Rückgängig“ entfernt den Eintrag.',
    'Ein abgehakter Artikel steht unter den offenen seines Gangs (Varianten B und C: im Abschnitt „Erledigt“) und bleibt lesbar durchgestrichen.',
    'Die Reihenfolge der Gänge folgt dem gewählten Laden (REWE: Kühl- und Tiefkühlware zuletzt).',
    'Ein in Ernährung abgehakter Artikel ist auch hier abgehakt und umgekehrt.',
    'Alle Tippflächen sind mindestens 44 px hoch, bei Schrift 200 % wird nichts abgeschnitten.',
  ],
  flows: [{ id: 'fl-milch', name: 'Milch ergänzen', steps: [{ featureId: 'shopping.list', action: '„2 l Milch“ eintippen, Enter' }, { featureId: 'nutrition.shopping', action: 'Milch steht in der Einkaufsliste von Ernährung' }] }],
  viewports: ALL_VP, demoData: D,
  variants: [
    {
      id: 'A', name: 'Gänge in Zeilen', direction: 'kompakt',
      concept: 'Listenwechsel als Chips, darunter Eingabezeile und die Liste dicht nach Gängen; Antippen des Namens öffnet Menge und Entfernen.',
      description: '+ Schnell und dicht, viele Artikel sichtbar  − Gänge nur als Überschriften',
      layout: { type: 'split' },
      blocks: [hdr({ title: 'Einkaufslisten', subtitle: 'Nach Gang sortiert', secondaryLabel: 'Laden-Modus', secondaryIcon: 'store' }),
        blk('pick', 'shop-lists', 'main', { style: 'chips', allowCreate: true }), blk('list', 'shop-list', 'main', { style: 'rows' }),
        blk('pantry', 'shop-pantry', 'aside', { style: 'low', limit: 3, title: 'Knappe Vorräte', allowAdd: false }), blk('budget', 'shop-budget', 'aside', { style: 'compact' })],
    },
    {
      id: 'B', name: 'Gänge als Karten', direction: 'visuell',
      concept: 'Jeder Gang ist eine eigene Karte mit Zähler, Erledigtes sammelt sich unten; große Fortschrittsanzeige oben.',
      description: '+ Übersichtlich, Gänge sofort greifbar  − Mehr Fläche, weniger Artikel pro Bildschirm',
      layout: { type: 'stack' },
      blocks: [hdr({ title: 'Einkaufslisten', subtitle: 'Gang für Gang', secondaryLabel: 'Laden-Modus', secondaryIcon: 'store' }),
        blk('pick', 'shop-lists', 'main', { style: 'chips', allowCreate: false }), blk('list', 'shop-list', 'main', { style: 'cards' })],
    },
    {
      id: 'C', name: 'Gang für Gang', direction: 'fokus',
      concept: 'Eingabe zuerst, darunter nur der nächste Gang groß; weitere Gänge als Chips zum Wechseln.',
      description: '+ Ruhig, ein Gang im Blick, ideal für den Laden  − Gesamtüberblick nur über die Chips',
      layout: { type: 'stack', narrow: true },
      blocks: [hdr({ title: 'Einkaufen', subtitle: 'Der nächste Gang zuerst', secondaryLabel: 'Laden-Modus', secondaryIcon: 'store' }),
        blk('pick', 'shop-lists', 'main', { style: 'chips', allowCreate: false }), blk('list', 'shop-list', 'main', { style: 'focus' })],
    },
  ],
  selectedVariantId: 'A',
  links: ['shopping.store', 'shopping.plan-import', 'shopping.home', 'nutrition.shopping'],
  seedHistory: [{ kind: 'draft', note: 'Zeilen, Karten, Gang für Gang' }, { kind: 'review', note: 'Abhaken wirkt in Ernährung, Rückgängig geprüft' }],
};

// ================================================================== Laden-Modus
const store = {
  id: 'shopping.store', name: 'Laden-Modus', group: 'Einkaufen', status: 'design', tier: 1, usage: 'wöchentlich, im Laden',
  purpose: 'Einkaufen mit einer Hand und ohne Netz: große Flächen, Gänge in Laufweg-Reihenfolge, Abgehaktes unten. „Einkauf fertig“ führt zur Ausgabe in Finanzen.',
  requirements: [
    { text: 'Touchziele mindestens 56 px hoch, Name in großer Schrift, ganze Zeile antippbar', type: 'rule', priority: 'must' },
    { text: 'Gänge in der Reihenfolge des gewählten Ladens; abgehakte Artikel gesammelt unten („Im Wagen“)', type: 'info', priority: 'must' },
    { text: 'Funktioniert offline: Hinweis „Die Liste liegt auf deinem Gerät“ bzw. „Offline: Abhaken wird gespeichert und später abgeglichen“', type: 'state', priority: 'must' },
    { text: 'Fortschritt „x offen“ mit Balken; Listenwechsel (Lebensmittel, Drogerie, Baumarkt) mit großen Chips', type: 'info', priority: 'must' },
    { text: '„Einkauf fertig“: erledigte eigene Artikel verlassen die Liste, der Einkauf wird festgehalten, „Schnell erfassen“ in Finanzen öffnet mit Laden, Schätzbetrag, Kategorie und Konto', type: 'action', priority: 'must' },
    { text: 'Variante „Gang für Gang“: nur der aktuelle Gang, „Nächster Gang“ als große Fläche', type: 'action', priority: 'should' },
    { text: 'Variante „Laufweg“: Ring mit Fortschritt, ein Stopp je Gang als Karte, Artikel als Kacheln (mindestens 56 px), fertige Gänge grün', type: 'info', priority: 'should' },
  ],
  interactions: [
    I('„Einkauf fertig“ antippen', 'Einkauf wird abgeschlossen, Schnell erfassen in Finanzen öffnet mit Vorbelegung', 'store.done', 'finance.quickadd'),
    I('Kopf-Aktion „Liste“', 'Einkaufsliste öffnet sich', 'header.secondary', 'shopping.list'),
    I('Artikel antippen', 'Artikel ist abgehakt und rutscht in „Im Wagen“', 'item.toggle'),
    I('Liste wechseln', 'Gewählte Liste erscheint mit den Gängen ihres Ladens', 'store.switch'),
    I('Leer: „Artikel erfassen“', 'Einkaufsliste mit Eingabefeld öffnet sich', 'store.exit', 'shopping.list'),
  ],
  acceptance: [
    'Jede Artikelzeile, jeder Listen-Chip und „Einkauf fertig“ sind mindestens 56 px hoch (gemessen bei 390 px Breite).',
    'Ein abgehakter Artikel steht sofort im Abschnitt „Im Wagen“ am Ende; erneutes Antippen holt ihn zurück.',
    'Mit „Offline“ zeigt die Seite den Hinweis und bleibt vollständig bedienbar.',
    'Im Laufweg zeigt der Ring „offen“ und „x von y im Wagen“; ein abgehakter Artikel wandert als Chip in seine Gangkarte, ein komplett abgehakter Gang wird grün.',
    '„Einkauf fertig“ öffnet „Schnell erfassen“ mit Laden, Betrag aus der Schätzung, Kategorie „Lebensmittel“ und Girokonto; gebucht wird erst nach „Speichern“ dort.',
  ],
  flows: [{ id: 'fl-laden', name: 'Einkauf abschließen', steps: [{ featureId: 'shopping.store', action: 'Gänge abhaken' }, { featureId: 'shopping.store', action: '„Einkauf fertig“' }, { featureId: 'finance.quickadd', action: 'Betrag prüfen, speichern' }] }],
  viewports: ['mobile', 'tablet', 'desktop'], demoData: D,
  variants: [
    {
      id: 'A', name: 'Alle Gänge', direction: 'kompakt',
      concept: 'Eine lange Liste, Gänge als Überschriften in Laufweg-Reihenfolge, Im-Wagen-Abschnitt unten.',
      description: '+ Überblick über alles, wenig Tipps  − Bei langen Listen viel Scrollen',
      layout: { type: 'stack', narrow: true },
      blocks: [hdr({ title: 'Im Laden', subtitle: 'Offline einsatzbereit', secondaryLabel: 'Liste', secondaryIcon: 'list-checks' }), blk('store', 'shop-store-mode', 'main', { view: 'aisles' })],
    },
    {
      id: 'B', name: 'Gang für Gang', direction: 'fokus',
      concept: 'Nur der aktuelle Gang, darunter „Nächster Gang“ als große Fläche und die übrigen Gänge als Chips.',
      description: '+ Ruhig, kaum Scrollen  − Gesamtübersicht nur über die Chips',
      layout: { type: 'stack', narrow: true },
      blocks: [hdr({ title: 'Im Laden', subtitle: 'Ein Gang nach dem anderen', secondaryLabel: 'Liste', secondaryIcon: 'list-checks' }), blk('store', 'shop-store-mode', 'main', { view: 'walk' })],
    },
    {
      id: 'C', name: 'Laufweg', direction: 'visuell',
      concept: 'Fortschrittsring oben, darunter jeder Gang als Karte mit Stoppnummer; Artikel sind große Kacheln, abgehakte wandern als Chips in die Karte, fertige Gänge färben sich grün. Auf dem Tablet liegen die Gänge nebeneinander.',
      description: '+ Fortschritt und Laufweg sofort sichtbar, Kacheln groß und einhändig tippbar  − Weniger Artikel pro Bildschirm als in der Liste',
      layout: { type: 'stack', narrow: true },
      blocks: [hdr({ title: 'Im Laden', subtitle: 'Dein Weg durch den Markt', secondaryLabel: 'Liste', secondaryIcon: 'list-checks' }), blk('store', 'shop-store-mode', 'main', { view: 'route' })],
    },
  ],
  selectedVariantId: 'A',
  links: ['shopping.list', 'finance.quickadd', 'shopping.home'],
};

// ================================================================== Vorräte
const pantry = {
  id: 'shopping.pantry', name: 'Vorräte', group: 'Zuhause', status: 'design', tier: 3, usage: 'wöchentlich',
  purpose: 'Sehen, was zuhause knapp wird, und es mit einem Tipp auf die Liste setzen – ohne Dopplung und im Gleichschritt mit „Zuhause vorhanden“ in Ernährung.',
  requirements: [
    { text: 'Stufen „Reicht“, „Fast leer“, „Leer“ je Artikel; knappe Artikel stehen oben', type: 'info', priority: 'must' },
    { text: '„Auf die Liste“ legt den Artikel auf die passende Liste; steht er schon dort, zeigt die Zeile „steht auf der Liste“', type: 'action', priority: 'must' },
    { text: 'Lebensmittel halten „Zuhause vorhanden“ in Ernährung im Gleichschritt (eine Wahrheit)', type: 'rule', priority: 'must' },
    { text: 'Vorrat anlegen in einer Zeile; Leerzustand erklärt den Nutzen', type: 'state', priority: 'should' },
    { text: 'Später: Verbrauch aus Tagebuch und Plan schätzen (Skizze)', type: 'info', priority: 'could' },
  ],
  interactions: [I('Stufe wählen', 'Stufe ändert sich, „Zuhause vorhanden“ in Ernährung folgt', 'pantry.level'), I('„Auf die Liste“', 'Artikel steht auf der Liste, Rückgängig erscheint', 'pantry.refill'), I('Kopf-Aktion „Einkaufsliste“', 'Einkaufsliste öffnet sich', 'header.secondary', 'shopping.list')],
  acceptance: [
    '„Fast leer“ bei Butter und „Auf die Liste“ zeigt „steht auf der Liste“ (Butter ist durch den Plan schon auf der Lebensmittel-Liste, kein zweiter Eintrag).',
    '„Kaffeebohnen“ auf die Liste legt genau einen Eintrag „Kaffeebohnen, 1 kg“ an; „Rückgängig“ entfernt ihn.',
    '„Reicht“ bei einem Lebensmittel setzt es in Ernährung auf „Zuhause vorhanden“.',
  ],
  flows: [],
  viewports: ALL_VP, demoData: D,
  variants: [{
    id: 'A', name: 'Vorräte nach Stufe', direction: 'kompakt',
    concept: 'Knappes zuerst mit „Auf die Liste“, darunter alles, was reicht; Stufe je Zeile umschaltbar.',
    description: '+ Klar und schnell  − Keine Verbrauchsprognose',
    layout: { type: 'stack', narrow: true },
    blocks: [hdr({ title: 'Vorräte', subtitle: 'Was zuhause knapp wird', secondaryLabel: 'Liste', secondaryIcon: 'list-checks' }), blk('pantry', 'shop-pantry', 'main', { style: 'list', framed: false })],
  }],
  selectedVariantId: 'A', links: ['shopping.list', 'nutrition.shopping'],
};

// ================================================================== Haushalt & Wartung
const household = {
  id: 'shopping.household', name: 'Haushalt & Wartung', group: 'Zuhause', status: 'design', tier: 2, usage: 'wöchentlich',
  purpose: 'Wiederkehrende Aufgaben im Haushalt nicht vergessen: Rauchmelder, Heizkörper, Waschmaschine, Dunstabzug, Kühlschrank. Abhaken setzt die nächste Fälligkeit, auf Wunsch wird eine Aufgabe geplant.',
  requirements: [
    { text: 'Zustände überfällig, heute, bald (bis 14 Tage), später; sortiert nach Dringlichkeit, mit Klartext der Regel („alle 3 Monate am 24.“)', type: 'info', priority: 'must' },
    { text: '„Erledigt“ setzt die nächste Fälligkeit aus der Wiederholungsregel (core/recurrence.js) und nennt sie; Rückgängig stellt den alten Stand her', type: 'action', priority: 'must' },
    { text: '„Als Aufgabe planen“ legt eine Aufgabe in Aufgaben an (Fälligkeit, Dauer, Priorität nach Dringlichkeit); danach „Aufgabe ansehen“', type: 'action', priority: 'must' },
    { text: 'Regeln: Kalender (jährlich am 1.12., monatlich am 17.) und nach Erledigung (180 Tage)', type: 'rule', priority: 'must' },
    { text: 'Material zur Wartung (Batterien, Filtermatte) steht auf den Listen und wird an der Aufgabe gezählt', type: 'info', priority: 'should' },
    { text: 'Erststart: Vorschläge zum Übernehmen statt leerer Liste', type: 'state', priority: 'must' },
    { text: 'Jahresansicht mit Monatsraster (Variante B): Termine auch ohne Farbe lesbar', type: 'info', priority: 'should' },
  ],
  interactions: [
    I('„Als Aufgabe planen“', 'Aufgabe entsteht in Aufgaben, Hinweis mit Fälligkeit', 'hh.plan'),
    I('„Aufgabe ansehen“', 'Aufgaben-Detail öffnet sich', 'hh.task.open', 'tasks.detail'),
    I('„Erledigt“ antippen', 'Nächste Fälligkeit wird gesetzt, Rückgängig erscheint', 'hh.done'),
    I('Vorschlag „Übernehmen“', 'Wartungsaufgabe wird angelegt', 'hh.adopt'),
    I('Liste im Seitenbereich antippen', 'Einkaufsliste öffnet sich (Material besorgen)', 'list.open', 'shopping.list'),
  ],
  acceptance: [
    '„Waschmaschine: 90-Grad-Pflegewäsche“ steht als „seit 7 Tagen überfällig“ ganz oben; „Erledigt“ setzt die Fälligkeit auf Do, 17.12.',
    '„Dunstabzugsfilter reinigen“ (alle 3 Monate am 24.) ist heute fällig, die Filtermatte steht auf der Liste Baumarkt.',
    '„Als Aufgabe planen“ erzeugt eine Aufgabe „Waschmaschine: 90-Grad-Pflegewäsche“ mit Priorität hoch und Fälligkeit heute.',
    '„Wasserhähne entkalken“ (180 Tage nach Erledigung) wird nach „Erledigt“ am 24.11. am 23.05.2027 fällig.',
  ],
  flows: [{ id: 'fl-wartung', name: 'Wartung planen', steps: [{ featureId: 'shopping.household', action: '„Als Aufgabe planen“ bei der Waschmaschine' }, { featureId: 'tasks.detail', action: 'Aufgabe ansehen' }] }],
  viewports: ALL_VP, demoData: D,
  variants: [
    {
      id: 'A', name: 'Liste nach Dringlichkeit', direction: 'kompakt',
      concept: 'Zeilen mit Zustand, Regeltext, Material und zwei Aktionen; im Seitenbereich die Listen für das Material.',
      description: '+ Alles zu einer Aufgabe in einer Zeile  − Wenig Gefühl für das Jahr',
      layout: { type: 'split' },
      blocks: [hdr({ title: 'Haushalt & Wartung', subtitle: 'Was fällig wird' }), blk('hh', 'shop-household', 'main', { style: 'list', framed: false }), blk('lists', 'shop-lists', 'aside', { style: 'rows', title: 'Material besorgen', allowCreate: false })],
    },
    {
      id: 'B', name: 'Jahresübersicht', direction: 'visuell',
      concept: 'Die nächste Aufgabe groß, darunter je Aufgabe ein Monatsraster der nächsten 12 Monate.',
      description: '+ Rhythmus auf einen Blick  − Details und Notizen eine Ebene tiefer',
      layout: { type: 'stack' },
      blocks: [hdr({ title: 'Haushalt & Wartung', subtitle: 'Die nächsten 12 Monate' }), blk('hh', 'shop-household', 'main', { style: 'year', framed: false })],
    },
  ],
  selectedVariantId: 'A', links: ['tasks.detail', 'shopping.list', 'shopping.home'],
};

// ================================================================== Plan übernehmen
const planImport = {
  id: 'shopping.plan-import', name: 'Zutaten aus dem Plan', group: 'Einkaufen', status: 'design', tier: 3, usage: 'wöchentlich',
  purpose: 'Zutaten aus dem Ernährungsplan auf die Lebensmittel-Liste übernehmen: gleiche Zutaten zusammengefasst, Vorräte abgezogen, manuelle Doppelte zusammengeführt.',
  requirements: [
    { text: 'Zeitraum 3 oder 7 Tage; Vorschau zeigt Zutaten gesamt, aus dem Vorrat abgezogene und zusammengeführte Doppelte', type: 'info', priority: 'must' },
    { text: 'Weitere Rezepte mit Portionen zusätzlich einkaufen', type: 'action', priority: 'should' },
    { text: 'Übernehmen schreibt in dieselben Daten wie die Liste in Ernährung (Zeitraum, zusätzliche Rezepte)', type: 'rule', priority: 'must' },
    { text: 'Ohne Plan: Einladung mit „Wochenplan öffnen“', type: 'state', priority: 'must' },
  ],
  interactions: [I('„Auf die Liste übernehmen“', 'Liste ist aktualisiert und öffnet sich', 'plan.apply', 'shopping.list'), I('Leer: „Wochenplan öffnen“', 'Wochenplan in Ernährung öffnet sich', 'plan.open', 'nutrition.plan'), I('Zeitraum wählen', 'Vorschau rechnet neu', 'plan.range')],
  acceptance: ['Bei 7 statt 3 Tagen steigt die Zahl der Zutaten in der Vorschau, bevor etwas übernommen wird.', 'Honig, Olivenöl, Haferflocken und Reis werden als „im Vorrat“ nicht gezählt.', 'Ein manuell eingetragener Artikel, den der Plan ohnehin liefert, wird beim Übernehmen zusammengeführt.'],
  flows: [],
  viewports: ALL_VP, demoData: D,
  variants: [{
    id: 'A', name: 'Vorschau & Übernehmen', direction: 'kompakt',
    concept: 'Zeitraum wählen, Vorschau prüfen, ein Knopf übernimmt alles.',
    description: '+ Transparent  − Ein Schritt mehr als automatisch',
    layout: { type: 'stack', narrow: true },
    blocks: [hdr({ title: 'Aus dem Plan', subtitle: 'Zutaten aus Ernährung' }), blk('imp', 'shop-plan-import', 'main', { framed: false })],
  }],
  selectedVariantId: 'A', links: ['shopping.list', 'nutrition.plan'],
};

// ================================================================== Einstellungen
const settings = {
  id: 'shopping.settings', name: 'Läden & Gänge', group: 'Einstellungen', status: 'design', tier: 3, usage: 'selten',
  purpose: 'Läden mit der Reihenfolge der Gänge festlegen und entscheiden, welche Listen mit dem Haushalt geteilt werden. Der Abgleich selbst ist eine offene Grundsatzfrage (Sync).',
  requirements: [
    { text: 'Gänge je Laden umsortieren; Wirkung sofort in Liste und Laden-Modus', type: 'action', priority: 'must' },
    { text: 'Teilen je Liste als Absicht; Hinweis, dass der Abgleich noch offen ist', type: 'rule', priority: 'must' },
    { text: 'Laden anlegen, Gänge hinzufügen und umbenennen', type: 'action', priority: 'could' },
  ],
  interactions: [I('Gang nach oben oder unten', 'Reihenfolge ändert sich', 'store.aisle.move'), I('Teilen umschalten', 'Liste ist als geteilt markiert', 'list.share')],
  acceptance: ['Wird „Kühlregal“ bei REWE nach oben geschoben, steht der Gang in Liste und Laden-Modus früher.', 'Der Hinweis „Abgleich offen“ ist sichtbar, solange die Sync-Frage nicht entschieden ist.'],
  flows: [],
  viewports: ALL_VP, demoData: D,
  variants: [{
    id: 'A', name: 'Läden und Teilen', direction: 'kompakt',
    concept: 'Läden aufklappen, Gänge mit Pfeilen sortieren; darunter Teilen je Liste.',
    description: '+ Einfach und ohne Ziehen  − Pfeile statt Greifen',
    layout: { type: 'stack', narrow: true },
    blocks: [hdr({ title: 'Läden & Gänge', subtitle: 'So läufst du durch den Laden' }), blk('stores', 'shop-stores', 'main', {})],
  }],
  selectedVariantId: 'A', links: ['shopping.store', 'shopping.list'],
};

export default {
  module: {
    id: 'shopping', name: 'Einkauf & Haushalt', icon: 'shopping-basket', status: 'active', area: 'Tag & Organisation', theme: 'graphite', designVersion: '0.1', stage: 3, assumption: true,
    homeFeatureId: 'shopping.home', dataSource: 'Lokal auf dem Gerät; Lebensmittel-Liste aus Ernährung (nutShopping), Budget aus Finanzen (nur gelesen)', offline: 'Pflicht: im Laden ohne Netz',
    description: 'Einkaufslisten schnell abarbeiten (im Laden einhändig, nach Gang), Vorräte im Blick behalten und wiederkehrende Haushaltsaufgaben nicht vergessen.',
    source: 'Auftrag 2026-11 (Bauplan 6, Modulkatalog), in Phase 1 gegen das Modulregister verifizieren',
    infoArchitecture: 'Einstieg „Übersicht“ (Listen mit offenen Artikeln, nächster Einkauf, Haushalt fällig, Budget-Rest). Von dort: Einkaufsliste (nach Gang, Schnelleingabe) → Laden-Modus (große Flächen, offline) → „Einkauf fertig“ → Schnell erfassen in Finanzen. Vorräte („fast leer“ → Liste), Haushalt & Wartung (fällig, abhaken, als Aufgabe planen → Aufgaben), Zutaten aus dem Ernährungsplan, Läden & Gänge. Keine zweite Modul-Navigation: der App-Rahmen navigiert.',
    docs: [
      '## Leitidee',
      '- Im Laden zählt jeder Tipp: große Flächen (mindestens 56 px), Gänge in Laufweg-Reihenfolge, Erledigtes unten, alles ohne Netz.',
      '- Eine Wahrheit: Die Lebensmittel-Liste wird in Ernährung aus Wochenplan, Rezepten und Vorrat erzeugt (`nutShopping`). Einkauf liest und schreibt dieselben Daten, damit Abhaken überall wirkt und „Erfassen › Milch“ dort erscheint.',
      '- Eigene Daten: weitere Listen (Drogerie, Baumarkt), Läden mit Gängen, Vorräte, Einkäufe, Haushalt & Wartung mit Regeln aus core/recurrence.js.',
      '- Budget nur lesen: Ernährung (`foodBudgetLeft`) und Finanzen (Budget „Lebensmittel“) liefern die Zahl; Einkauf zeigt sie, ändert sie nie.',
      '',
      '## Offene Fragen',
      '- Eigentum der Lebensmittel-Liste: bleibt sie in Ernährung abgeleitet oder wandert sie nach Einkauf (Ernährung liefert Zutaten per Verknüpfung)?',
      '- Teilen mit dem Haushalt: lokal im WLAN, Konto oder nur Export? Hängt an der Sync-Grundsatzfrage der App.',
      '- Wartung nach festem Termin oder nach Erledigung? Sicherheit (Rauchmelder) und Pflege (Filter) ticken verschieden.',
      '- Ausgabe nach „Einkauf fertig“: Schätzung vorbelegen oder Kassenbon scannen (Picture to Text)?',
    ].join('\n'),
    links: ['nutrition', 'finance', 'tasks', 'habits', 'calendar', 'picture-to-text'],
  },
  features: [home, list, store, pantry, household, planImport, settings],
  decisions: [
    {
      featureId: 'shopping.list', title: 'Wem gehört die Lebensmittel-Liste?', status: 'open',
      question: 'Bleibt die Lebensmittel-Liste in Ernährung (abgeleitet aus Plan und Rezepten) oder wird sie Eigentum von Einkauf?',
      options: [
        { id: 'nutrition', label: 'Bleibt in Ernährung (heute)', description: 'Einkauf liest und schreibt `nutShopping`; keine Migration, aber zwei Module pflegen eine Liste.' },
        { id: 'shopping', label: 'Wandert nach Einkauf', description: 'Einkauf besitzt die Liste; Ernährung liefert Zutaten per Verknüpfung (`carry`). Saubere Eigentümerschaft laut Bauplan 5.13.' },
        { id: 'both', label: 'Zwei getrennte Listen', description: 'Ernährung behält ihre Liste, Einkauf hat eine eigene; Gefahr von Dopplungen.' },
      ],
      recommendation: { optionId: 'shopping', reasons: ['Bauplan 5.13 nennt Einkauf als Eigentümer der Einkaufsliste', 'Abhaken, Läden und Gänge gehören zum Einkaufen, nicht zum Kochen', 'Ernährung bleibt Quelle der Zutaten und verliert nichts'], confidence: 'mittel', by: 'Claude (Vorschlag)' },
      reversibility: 'aufwendig', consequences: 'Schlüssel `nutShopping` würde zu `shoppingLists` umziehen (Schlüssel bleiben bis dahin), Ernährung braucht eine Verknüpfung „Zutaten zur Liste“.',
      decision: '', rationale: 'Bis zur Entscheidung gilt Variante „bleibt in Ernährung“, damit nichts doppelt gepflegt wird.', tradeoffs: 'Heute: keine Migration, aber geteilte Verantwortung. Umzug: klare Eigentümerschaft, einmaliger Aufwand.', assumption: true,
    },
    {
      featureId: 'shopping.settings', title: 'Teilen mit dem Haushalt: wie läuft der Abgleich?', status: 'open',
      question: 'Wie sieht Jana die geteilten Listen, ohne dass TAKT einen eigenen Server braucht?',
      options: [
        { id: 'local', label: 'Lokal im WLAN', description: 'Direkter Abgleich der Geräte im Heimnetz; kein Konto, aber nur zuhause.' },
        { id: 'account', label: 'Konto und Cloud', description: 'Abgleich überall, auch im Laden; braucht Konto, Hosting und Datenschutz-Konzept.' },
        { id: 'export', label: 'Nur Export (Text, Link)', description: 'Liste als Text teilen; kein Abgleich, kein Aufwand.' },
      ],
      recommendation: { optionId: 'export', reasons: ['Nutzen sofort ohne Server', 'Der Abgleich hängt an der App-Grundsatzfrage zu Sync', 'Später auf Konto erweiterbar'], confidence: 'niedrig', by: 'Claude (Vorschlag)' },
      reversibility: 'leicht', consequences: 'Der Schalter „Teilen“ in den Einstellungen bleibt bis dahin eine Absicht.',
      decision: '', rationale: 'Im Laden fehlt oft das Netz; ein Abgleich, der Netz braucht, hilft dort wenig.', tradeoffs: 'Export: einfach, aber ohne Live-Abgleich. Konto: bequem, aber teuer.', assumption: true,
    },
    {
      featureId: 'shopping.household', title: 'Wartung nach festem Termin oder nach Erledigung?', status: 'open',
      question: 'Wie wird die nächste Fälligkeit berechnet?',
      options: [
        { id: 'both', label: 'Je Aufgabe wählbar', description: 'Sicherheit (Rauchmelder) nach Kalender, Pflege (Filter, Wasserhähne) nach Erledigung.' },
        { id: 'calendar', label: 'Immer nach Kalender', description: 'Vorhersehbar, aber nach Verspätung entsteht ein enger Abstand.' },
        { id: 'afterDone', label: 'Immer nach Erledigung', description: 'Gleichmäßiger Abstand, aber der Termin wandert.' },
      ],
      recommendation: { optionId: 'both', reasons: ['Beides ist in core/recurrence.js getestet', 'Passt zu echten Rhythmen im Haushalt'], confidence: 'hoch', by: 'Claude (Vorschlag)' },
      reversibility: 'leicht', consequences: 'Im Formular „Wartung anlegen“ (noch nicht entworfen) braucht es die Wahl „Nach Kalender / nach Erledigung“.',
      decision: '', rationale: 'Die Demo-Daten nutzen beide Arten.', tradeoffs: 'Mehr Auswahl im Formular, dafür passende Fristen.', assumption: true,
    },
    {
      featureId: 'shopping.store', title: 'Laden-Modus: Touchziele und Reihenfolge', status: 'decided',
      decision: 'Alle Tippflächen im Laden-Modus sind mindestens 56 px hoch, die ganze Zeile ist antippbar, Gänge folgen dem Laufweg des Ladens und Abgehaktes steht gesammelt unten.',
      rationale: 'Einhändige Bedienung, oft mit Handschuhen oder Tasche in der anderen Hand. Auf Basis der Persona-Kontexte „Küche und Laden“ und der Vorgabe des Auftrags.',
      tradeoffs: 'Weniger Artikel pro Bildschirm als in der normalen Liste.', assumption: true,
    },
  ],
};
