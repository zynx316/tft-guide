// Modul "Einstellungen" – Annahme (jede App besitzt Einstellungen), in Phase 1 verifizieren
export default {
  module: {
    id: 'settings', name: 'Einstellungen', icon: 'settings', status: 'concept', theme: 'graphite', designVersion: '0.1',
    description: 'Darstellung (Themes Graphite/Horizon/Intensiv), Module ein-/ausblenden, Konten, Datenexport.',
    source: 'Annahme der Workbench – in Phase 1 gegen das TAKT-Modulregister verifizieren',
    infoArchitecture: 'Gruppen: Darstellung · Module · Konten & Sync · Daten & Backup · Über TAKT',
    docs: 'Theme-Wahl ist global und darf die Informationsarchitektur nicht verändern (Regel aus dem Designsystem).',
    links: [],
  },
  features: [
    {
      id: 'settings.appearance', name: 'Darstellung & Theme', group: 'Darstellung', status: 'analyzed',
      purpose: 'Theme, Dichte und Startmodul wählen; Vorschau der Wirkung vor dem Übernehmen.',
      requirements: [
        { text: 'Theme-Auswahl Graphite (Standard), Horizon, Intensiv', type: 'action', priority: 'must' },
        { text: 'Startmodul festlegen', type: 'action', priority: 'should' },
        { text: 'Änderungen sofort sichtbar, Speichern bestätigt', type: 'state', priority: 'must' },
      ],
      interactions: [
        { trigger: 'Formular speichern', result: 'Bestätigung (Toast)', event: 'form.submit' },
        { trigger: 'Pflichtfeld leer', result: 'Fehlermeldung am Feld', event: 'form.invalid' },
      ],
      demoData: { settings: [] },
      variants: [
        {
          id: 'A', name: 'Formular', concept: 'Klassisches Einstellungsformular in einer Spalte.',
          layout: { type: 'stack', narrow: true },
          blocks: [
            { id: 'hdr', component: 'page-header', region: 'header', props: { title: 'Darstellung', subtitle: 'Theme und Startbildschirm', primaryLabel: '' } },
            { id: 'form', component: 'form-card', region: 'main', bind: { target: 'settings' }, props: { title: 'Darstellung', columns: 1, submitLabel: 'Übernehmen', fields: ['theme*:Theme:select:Graphite|Horizon|Intensiv', 'start:Startmodul:select:Start|Kalender|Aufgaben|Notizen', 'density:Dichte:select:Komfortabel|Kompakt'] } },
          ],
        },
      ],
    },
  ],
};
