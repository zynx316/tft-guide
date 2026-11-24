// Beispieldaten für die Komponenten-Galerie: kommen aus der gemeinsamen Finanzwelt (dieselben Zahlen wie im Launcher).
import * as W from '../../../seed/world/finance.js';

export const EX = {
  accounts: W.accounts, transactions: W.transactions, budgets: W.budgets, subscriptions: W.subscriptions, plans: W.savingsPlans,
  categories: W.financeCategories, rules: W.financeRules, events: W.financeEvents, prefs: W.financePrefs, subMeta: W.financeSubMeta,
  months: W.financeMonths, history: W.financeNetWorthHistory, txMeta: W.financeTxMeta,
};
export const ex = (...names) => Object.fromEntries(names.map((n) => [n, EX[n]]));
