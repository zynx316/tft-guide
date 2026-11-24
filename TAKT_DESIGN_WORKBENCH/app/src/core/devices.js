// Geräteprofile für Vorschau und QA. Neue Profile einfach ergänzen –
// Workbench, Multi-Viewport-Ansicht und CLI-QA lesen diese Liste.
export const DEVICES = [
  { id: 'desktop', label: 'Desktop', width: 1440, height: 900, icon: 'monitor', group: 'desktop', required: true },
  { id: 'notebook', label: 'Notebook', width: 1280, height: 800, icon: 'laptop', group: 'desktop', required: true },
  { id: 'tablet-l', label: 'Tablet quer', width: 1024, height: 768, icon: 'tablet', group: 'tablet', required: true },
  { id: 'tablet', label: 'Tablet', width: 768, height: 1024, icon: 'tablet', group: 'tablet', required: true },
  { id: 'mobile', label: 'Smartphone', width: 390, height: 844, icon: 'smartphone', group: 'mobile', required: true },
  { id: 'mobile-s', label: 'Android kompakt', width: 360, height: 780, icon: 'smartphone', group: 'mobile', required: false, note: 'Kleinste gängige Android-Breite – deckt Überläufe früh auf.' },
];
export const deviceById = (id) => DEVICES.find((d) => d.id === id) || DEVICES[0];
/** Feature-Viewport-Gruppen -> Geräte (Feature.viewports nutzt desktop|notebook|tablet|mobile). */
export const devicesForFeature = (f) => DEVICES.filter((d) => (f?.viewports || []).some((v) => v === d.id || v === d.group));
