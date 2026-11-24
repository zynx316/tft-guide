// Domänen-Komponenten "content": Notizen, Wissensdatenbank, Picture to Text (Kategorie "Inhalte") und Wetter (Kategorie "Wetter").
// Jede Komponente ist genau hier registriert (nicht über andere Bereiche) – doppelte IDs prüft tests/core-registry.test.mjs.
import { noteList, noteChecklists, noteInbox } from './note-list.js';
import { noteEditor, noteFocus } from './note-editor.js';
import { kbTree, kbAreas } from './kb-tree.js';
import { kbArticle, kbNext } from './kb-article.js';
import { capturePanel, captureLauncher, docScanner } from './capture-panel.js';
import { ocrResult, receiptReview, businessCard } from './ocr-result.js';
import { kpiTiles } from './kpi-tiles.js';
import { countList } from './count-list.js';
import { weatherNow } from './weather-now.js';
import { weatherHourly } from './weather-hourly.js';
import { weatherDaily } from './weather-daily.js';
import { weatherAlerts } from './weather-alerts.js';

export default [
  noteList, noteChecklists, noteInbox, noteEditor, noteFocus,
  kbTree, kbAreas, kbArticle, kbNext,
  capturePanel, captureLauncher, docScanner,
  ocrResult, receiptReview, businessCard, countList, kpiTiles,
  weatherNow, weatherHourly, weatherDaily, weatherAlerts,
];
