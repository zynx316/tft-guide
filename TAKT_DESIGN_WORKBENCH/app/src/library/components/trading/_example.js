// Beispieldaten für die Komponenten-Galerie: dieselben Zahlen wie im Launcher (Welt + Demo-Bestände des Trading-Moduls).
import * as W from '../../../seed/world/finance.js';
import { buildInstruments, SEED } from './_seeddata.js';

let cache = null;
const all = () => (cache ||= {
  positions: W.positions, cash: W.depotCash, history: W.depotHistory, watchlist: W.watchlist, dividends: W.dividends, plans: W.savingsPlans,
  transactions: W.transactions, accounts: W.accounts, allowance: W.taxAllowance, instruments: buildInstruments(),
  alerts: SEED.alerts, orders: SEED.orders, trades: SEED.trades, targets: SEED.targets, benchmark: SEED.benchmark,
});
export const ex = (...names) => Object.fromEntries(names.map((n) => [n, all()[n]]));
