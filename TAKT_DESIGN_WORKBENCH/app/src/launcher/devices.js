// Geräte für den Demo-Launcher (CSS-Viewport-Größen gängiger Geräte, Stand 2026).
// statusBar = Höhe der simulierten Statusleiste im Rahmen; das Iframe bekommt die restliche Höhe.
export const LAUNCHER_DEVICES = [
  { id: 'iphone-15', label: 'iPhone 15', width: 393, height: 852, statusBar: 47, homeBar: 21, radius: 52, cutout: 'island', group: 'phone' },
  { id: 'pixel-8', label: 'Pixel 8', width: 412, height: 915, statusBar: 32, homeBar: 16, radius: 44, cutout: 'hole', group: 'phone' },
  { id: 'galaxy-s', label: 'Galaxy (kompakt)', width: 360, height: 780, statusBar: 28, homeBar: 14, radius: 38, cutout: 'hole', group: 'phone' },
  { id: 'iphone-se', label: 'iPhone SE', width: 375, height: 667, statusBar: 20, homeBar: 0, radius: 36, cutout: 'none', group: 'phone' },
  { id: 'fold', label: 'Foldable (offen)', width: 674, height: 841, statusBar: 28, homeBar: 14, radius: 30, cutout: 'hole', group: 'tablet' },
  { id: 'tablet', label: 'Tablet 11″', width: 834, height: 1194, statusBar: 24, homeBar: 14, radius: 30, cutout: 'none', group: 'tablet' },
  { id: 'laptop', label: 'Laptop', width: 1440, height: 900, statusBar: 0, homeBar: 0, radius: 12, cutout: 'none', group: 'desktop' },
];
export const launcherDevice = (id) => LAUNCHER_DEVICES.find((d) => d.id === id) || LAUNCHER_DEVICES[0];
