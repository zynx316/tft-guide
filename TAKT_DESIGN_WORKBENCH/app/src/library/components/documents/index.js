// Komponentenbereich „documents“: Dokumente & Verträge (Fristen, Ordner, Dokumentliste, Verträge, Garantien, Steuerordner, Ablegen).
// CSS-Präfix tk-dok-, Komponenten-IDs dok-*. Export default Array von Komponenten-Definitionen (siehe library/CONTRACT.md).
import dokDeadlines from './deadlines.js';
import dokFolders from './folders.js';
import dokList from './doc-list.js';
import dokContracts from './contracts.js';
import dokContractDetail from './contract-detail.js';
import dokViewer from './doc-viewer.js';
import dokMeta from './doc-meta.js';
import dokWarranties from './warranties.js';
import dokTaxFolder from './tax-folder.js';
import dokScanIn from './scan-in.js';
import dokSettings from './doc-settings.js';

export default [dokDeadlines, dokFolders, dokList, dokContracts, dokContractDetail, dokViewer, dokMeta, dokWarranties, dokTaxFolder, dokScanIn, dokSettings];
