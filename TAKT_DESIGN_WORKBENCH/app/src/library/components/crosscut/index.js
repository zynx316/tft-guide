// Querschnitt-Komponenten (modulübergreifend). Weitere Dateien hier ergänzen und unten exportieren.
import legal from './legal-notice.js';
import offlineBanner from './offline-banner.js';
import syncStatus from './sync-status.js';
import permissionCard from './permission-card.js';
import recurrencePicker from './recurrence-picker.js';
import undoToast from './undo-toast.js';
import linkChips from './link-chips.js';
import firstrunCard from './firstrun-card.js';

export { pushUndo } from './_crosscut.js';
export default [...legal, offlineBanner, syncStatus, permissionCard, recurrencePicker, undoToast, linkChips, firstrunCard];
