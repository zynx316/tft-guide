// Domaenen-Komponenten "content": Notizen, Wissensdatenbank, Picture to Text (Kategorie "Inhalte") und Wetter (Kategorie "Wetter").
import { noteList } from './note-list.js';
import { noteEditor } from './note-editor.js';
import { kbTree } from './kb-tree.js';
import { kbArticle } from './kb-article.js';
import { capturePanel } from './capture-panel.js';
import { ocrResult } from './ocr-result.js';
import { weatherNow } from './weather-now.js';
import { weatherHourly } from './weather-hourly.js';
import { weatherDaily } from './weather-daily.js';
import { weatherAlerts } from './weather-alerts.js';

export default [noteList, noteEditor, kbTree, kbArticle, capturePanel, ocrResult, weatherNow, weatherHourly, weatherDaily, weatherAlerts];
