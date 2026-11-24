// Querschnitt-Komponenten (modulübergreifend). Weitere Dateien hier ergänzen und unten exportieren.
import legal from './legal-notice.js';
import offlineBanner from './offline-banner.js';
import syncStatus from './sync-status.js';
import permissionCard from './permission-card.js';
import recurrencePicker from './recurrence-picker.js';
import undoToast from './undo-toast.js';
import linkChips from './link-chips.js';
import firstrunCard from './firstrun-card.js';
// TAKT Kern und Einstellungen
import globalSearch from './global-search.js';
import notificationList from './notification-list.js';
import captureField from './capture-field.js';
import onboardingSteps from './onboarding-steps.js';
import trashList from './trash-list.js';
import pinField from './pin-field.js';
import stateCards from './state-cards.js';
import settingsList from './settings-list.js';
import moduleToggleList from './module-toggle-list.js';
import themePicker from './theme-picker.js';
import quietHours from './quiet-hours.js';
import setupChecklist from './setup-checklist.js';
import exportWizard from './export-wizard.js';
import backupList from './backup-list.js';

export { pushUndo } from './_crosscut.js';
export default [...legal, offlineBanner, syncStatus, permissionCard, recurrencePicker, undoToast, linkChips, firstrunCard,
  globalSearch, notificationList, captureField, onboardingSteps, trashList, pinField, ...stateCards,
  settingsList, moduleToggleList, themePicker, quietHours, setupChecklist, exportWizard, backupList];
