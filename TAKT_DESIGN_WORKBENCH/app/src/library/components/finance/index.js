// Komponentenbereich "finance" – Finanzen (Heute, Konten, Buchungen, Erfassen, Budgets, Abos, Cashflow, Vermögen, Kategorien, Privatsphäre).
// Gemeinsame Helfer: _calc.js (Rechnen, rein) · _fin.js (UI-Bausteine, Datenslots, Basis-CSS) · _example.js (Galerie-Daten aus der Welt).
import safeToSpend from './safe-to-spend.js';
import upcomingList from './upcoming-list.js';
import budgetEnvelopes from './budget-envelopes.js';
import subscriptionOverview from './subscription-overview.js';
import monthKpis from './month-kpis.js';
import spendBreakdown from './spend-breakdown.js';
import cashflowBars from './cashflow-bars.js';
import cashflowSankey from './cashflow-sankey.js';
import wealthSplit from './wealth-split.js';
import networthChart from './networth-chart.js';
import financeCheck from './finance-check.js';
import numpadCapture from './numpad-capture.js';
import quickLine from './quick-line.js';
import txList from './tx-list.js';
import txDetail from './tx-detail.js';
import accountList from './account-list.js';
import categoryRules from './category-rules.js';
import privacyPanel from './privacy-panel.js';
import finHints from './fin-hints.js';

export default [...safeToSpend, ...upcomingList, ...budgetEnvelopes, ...subscriptionOverview, ...monthKpis, ...spendBreakdown, ...cashflowBars, ...cashflowSankey, ...wealthSplit, ...networthChart, ...financeCheck,
  ...numpadCapture, ...quickLine, ...txList, ...txDetail, ...accountList, ...categoryRules, ...privacyPanel, ...finHints];
