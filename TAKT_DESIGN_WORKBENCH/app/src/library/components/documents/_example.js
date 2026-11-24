// Beispieldaten für die Komponenten-Galerie: kommen aus der Dokumenten-Welt (gleiche Daten wie in der App).
import * as W from '../../../seed/world/documents.js';
import { receipts } from '../../../seed/world/scans.js';
import { transactions } from '../../../seed/world/finance.js';

export const EX = {
  documents: W.documents, folders: W.documentFolders, contracts: W.contracts, warranties: W.warranties, tax: W.taxFolder, receipts, transactions,
};
export const pick = (...keys) => Object.fromEntries(keys.map((k) => [k, EX[k]]));
