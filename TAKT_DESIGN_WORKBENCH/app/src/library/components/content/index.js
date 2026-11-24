// Domänen-Komponenten "content": Notizen, Wissensdatenbank, Picture to Text (Kategorie "Inhalte") und Wetter (Kategorie "Wetter").
// Jede Komponente ist genau hier registriert (nicht über andere Bereiche) – doppelte IDs prüft tests/core-registry.test.mjs.
import { noteList, noteChecklists, noteInbox } from './note-list.js';
import { noteBoard } from './note-board.js';
import { noteShare } from './note-share.js';
import { noteEditor, noteFocus } from './note-editor.js';
import { kbTree, kbAreas } from './kb-tree.js';
import { kbArticle, kbNext } from './kb-article.js';
import { kbStory } from './kb-story.js';
import { kbShare, kbMarks } from './kb-overview.js';
import { capturePanel, captureLauncher, docScanner } from './capture-panel.js';
import { ocrResult, receiptReview, businessCard } from './ocr-result.js';
import { receiptSlip } from './receipt-slip.js';
import { kpiTiles } from './kpi-tiles.js';
import { countList } from './count-list.js';
import { weatherNow } from './weather-now.js';
import { weatherHourly } from './weather-hourly.js';
import { weatherDaily } from './weather-daily.js';
import { weatherAlerts } from './weather-alerts.js';

export default [
  noteList, noteChecklists, noteInbox, noteBoard, noteShare, noteEditor, noteFocus,
  kbTree, kbAreas, kbArticle, kbNext, kbStory, kbShare, kbMarks,
  capturePanel, captureLauncher, docScanner,
  ocrResult, receiptReview, receiptSlip, businessCard, countList, kpiTiles,
  weatherNow, weatherHourly, weatherDaily, weatherAlerts,
];
