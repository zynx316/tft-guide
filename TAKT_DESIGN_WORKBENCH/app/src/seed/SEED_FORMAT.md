# Seed-Manifest-Format (ein Modul je Datei)

```js
export default {
  module: {
    id: 'calendar', name: 'Kalender', icon: 'calendar',          // icon: Name aus lib/icon-data.js
    description: 'Ein Satz zum Zweck des Moduls.',
    status: 'active',              // concept | active | released | reference
    theme: 'graphite', designVersion: '0.2', isReference: false,
    source: 'Auftrag 2026-11 (in Phase 1 gegen Modulregister verifizieren)',
    infoArchitecture: 'Textuelle IA: Hauptansichten, Navigation, Hierarchie.',
    docs: 'Freitext/Markdown: Hintergrund, Annahmen, offene Fragen.',
    links: ['tasks'],              // verknüpfte Module (IDs)
    homeFeatureId: 'calendar.home', // Modul-Startseite (Ebene 1) – Einstieg im Demo-Launcher
  },
  features: [{
    id: 'calendar.week',           // <modul>.<feature> – stabil, nie umbenennen
    name: 'Wochenansicht', group: 'Ansichten',
    purpose: 'Wozu dient das Feature?',
    status: 'design',              // siehe FEATURE_STATUSES in core/schema.js
    requirements: [{ text: '…', type: 'info|action|state|rule', priority: 'must|should|could' }],
    interactions: [{ trigger: 'Tippen auf Termin', result: 'Detail-Dialog öffnet', event: 'event.open' }],
    viewports: ['desktop', 'notebook', 'tablet', 'mobile'],
    demoData: { events: [ … ], tasks: [ … ] },   // Schlüssel werden von block.bind referenziert
    variants: [{
      id: 'A', name: 'Kompakt', direction: 'kompakt',   // Design-Richtung: kompakt | visuell | fokus (Version im Demo-Launcher)
      concept: 'Kernidee in 1–2 Sätzen (Hierarchie, Bedienkonzept).',
      description: 'Stärken / Schwächen.',
      layout: { type: 'sidebar' },   // stack | split | sidebar | grid | tabs  (+ narrow, even, asideFirstOnMobile, panelLabel, masterDetail, backLabel)
      blocks: [
        { id: 'hdr', component: 'page-header', region: 'header', props: { title: 'Woche' } },
        { id: 'cal', component: 'calendar-week', region: 'main', bind: { events: 'events' }, props: { density: 'compact' } },
        { id: 'mini', component: 'mini-month', region: 'panel', hideOn: ['mobile'] },
        // grid: span (1–12), spanTablet;  tabs: tab: 'Reitername'
        // sidebar + layout.masterDetail: true → Mobile: erst Region panel (Liste), nach Auswahl (ctx.ui.selectedId) main mit „Zurück“;
        //   Tablet/Desktop unverändert; backLabel = Text des Zurück-Buttons; Detail-Komponenten rendern in der Liste nicht (autoSelectFirst wirkt nur breit)
      ],
    }],
    selectedVariantId: 'B',
    links: ['tasks.overview'],
    seedHistory: [{ kind: 'draft', note: 'Erster Entwurf' }, { kind: 'review' }, { kind: 'release', note: 'Freigabe' }], // optional (Demo)
  }],
  decisions: [{ featureId: 'calendar.week', title: '…', decision: '…', rationale: '…', tradeoffs: '…', status: 'decided|open' }],
};
```

Regeln: Varianten müssen sich **strukturell** unterscheiden (Layout-Typ, Informationshierarchie,
Komponentenwahl, Bedienkonzept) – nicht nur in Props/Farben. Demo-Daten deutsch, realistisch,
Datumswerte rund um den Referenztag **Di, 24.11.2026 09:30** (`ctx.today`).

## Ebenen & Versionen (seit Schema v2)
- **Richtung je Variante** (`direction`): `kompakt` (dicht, Listen/Tabellen), `visuell` (Karten, Diagramme, Raum),
  `fokus` (nächste Aktion, Kontext, Hinweise). Der Demo-Launcher zeigt je Richtung die passende Variante jedes Features –
  ohne passende Variante fällt er auf die bevorzugte Variante zurück. **Ziel:** Modul-Startseite und Kern-Features in allen drei Richtungen.
- **Modul-Startseite** (`module.homeFeatureId`): Einstieg beim Tippen auf das Modul. Empfohlen: eigenes Feature „Übersicht“ (Gruppe „Übersicht“).
- **Navigation** (`interaction.to`): Interaktionen mit Ziel-Feature werden im Launcher zu echten Links (z. B. Liste → Detail).
  Das Event muss von einer Komponente der Variante ausgelöst werden.
- **Akzeptanzkriterien** (`acceptance`) und **Abläufe** (`flows`) ergänzen die Anforderungen.

### Navigation je Variante (optional)
`variant.nav = [{ event: 'item.open', to: 'notes.editor' }]` gilt nur für diese Variante und hat Vorrang vor den
Feature-Regeln (`interactions[].to`). Sinnvoll, wenn z. B. eine Master-Detail-Variante das Detail selbst anzeigt
(kein Sprung), eine Listen-Variante dagegen navigiert. Alternativ kann eine Komponente das Ziel im Event mitgeben:
`ctx.emit('tile.open', { to: 'finance.budgets' })` bzw. `{ to: 'module:finance' }`.
