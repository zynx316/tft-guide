// ============================================================================
// Gemeinsame FINANZWELT der Persona – EINE Quelle für Finanzen, Sparpläne, Trading, Start.
// Rechnerisch konsistent: Depotwert = Summe der Positionen, Kontostand „Depot“ = Depotwert,
// Budget-Ist = Summe der Buchungen je Kategorie im November, Sparpläne = Umbuchungen (keine Ausgaben).
// Alle Kurse/Werte sind FIKTIV (Demo). Referenztag: Di, 24.11.2026 09:30.
// Binden per '@world:<schlüssel>' in demoData oder importieren.
// ============================================================================
import { r2, eur, triple } from './_util.js';

// --- Depot -----------------------------------------------------------------
export const positions = [
  { id: 'p-allworld', name: 'Vanguard FTSE All-World (Acc)', short: 'All-World', type: 'ETF', isin: 'IE00BK5BQT80', quantity: 152.31, buyPrice: 96.10, price: 118.42, prevClose: 117.66, currency: 'EUR', ter: 0.0022, distribution: 'thesaurierend', region: 'Welt', sector: 'Breit gestreut', savingsPlanId: 'sp-allworld', tone: 1, spark: [109.8, 111.2, 112.9, 114.1, 113.0, 115.6, 116.4, 117.1, 116.2, 117.66, 118.42] },
  { id: 'p-em', name: 'iShares Core MSCI EM IMI (Acc)', short: 'Emerging Markets', type: 'ETF', isin: 'IE00BKM4GZ66', quantity: 121.04, buyPrice: 29.40, price: 33.85, prevClose: 34.02, currency: 'EUR', ter: 0.0018, distribution: 'thesaurierend', region: 'Schwellenländer', sector: 'Breit gestreut', savingsPlanId: 'sp-em', tone: 2, spark: [31.2, 31.9, 32.4, 32.1, 33.0, 33.6, 33.4, 34.1, 33.9, 34.02, 33.85] },
  { id: 'p-tech', name: 'Xtrackers MSCI World Information Technology', short: 'World IT', type: 'ETF', isin: 'IE00BM67HT60', quantity: 40.18, buyPrice: 61.30, price: 82.10, prevClose: 81.20, currency: 'EUR', ter: 0.0025, distribution: 'thesaurierend', region: 'Welt', sector: 'Technologie', savingsPlanId: 'sp-tech', tone: 4, spark: [72.4, 74.1, 76.9, 75.2, 78.4, 79.9, 80.3, 79.1, 80.8, 81.20, 82.10] },
  { id: 'p-allianz', name: 'Allianz SE', short: 'Allianz', type: 'Aktie', isin: 'DE0008404005', quantity: 6, buyPrice: 228.40, price: 286.40, prevClose: 284.90, currency: 'EUR', distribution: 'ausschüttend', region: 'Deutschland', sector: 'Versicherung', tone: 3, spark: [268, 271, 275, 279, 277, 281, 283, 282, 285, 284.9, 286.4] },
  { id: 'p-apple', name: 'Apple Inc.', short: 'Apple', type: 'Aktie', isin: 'US0378331005', quantity: 8, buyPrice: 158.20, price: 212.10, prevClose: 214.30, currency: 'EUR', distribution: 'ausschüttend', region: 'USA', sector: 'Technologie', tone: 5, spark: [205, 208, 211, 216, 219, 217, 215, 213, 214, 214.3, 212.1] },
].map((p) => ({ ...p, value: r2(p.quantity * p.price), cost: r2(p.quantity * p.buyPrice), gain: r2(p.quantity * (p.price - p.buyPrice)), gainPct: (p.price - p.buyPrice) / p.buyPrice, dayChangePct: (p.price - p.prevClose) / p.prevClose }));

export const depotCash = 1250.00; // Verrechnungskonto Depot
export const depotValue = r2(positions.reduce((s, p) => s + p.value, 0) + depotCash);
export const depotHistory = { labels: ['Dez', 'Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov'], series: [{ name: 'Depotwert', values: [21480, 22350, 22910, 22640, 23580, 24420, 24910, 25560, 25240, 26480, 27120, Math.round(depotValue)] }, { name: 'Eingezahlt', values: [18900, 19325, 19750, 20175, 20600, 21025, 21450, 21875, 22300, 22725, 23150, 23575] }] };

// --- Konten ------------------------------------------------------------------
export const accounts = [
  { id: 'acc-giro', name: 'Girokonto', bank: 'Sparkasse Bielefeld', type: 'giro', iban: 'DE12 4805 0161 •••• •••• 21', balance: 3842.17, icon: 'credit-card', tone: 1, spark: [2950, 3410, 4120, 3880, 3620, 3842.17] },
  { id: 'acc-business', name: 'Geschäftskonto', bank: 'Kontist', type: 'business', iban: 'DE89 1101 0101 •••• •••• 07', balance: 12480.55, icon: 'briefcase', tone: 2, spark: [10240, 11080, 11920, 12610, 11980, 12480.55] },
  { id: 'acc-tagesgeld', name: 'Tagesgeld (Notgroschen)', bank: 'Trade Republic', type: 'savings', interestPa: 0.025, balance: 9500.00, icon: 'piggy-bank', tone: 3, spark: [8600, 8780, 8960, 9140, 9320, 9500] },
  { id: 'acc-kreditkarte', name: 'Kreditkarte', bank: 'Sparkasse Bielefeld', type: 'credit', limit: 3000, balance: -412.30, icon: 'credit-card', tone: 6, spark: [-120, -380, -265, -510, -298, -412.3] },
  { id: 'acc-depot', name: 'Depot', bank: 'Trade Republic', type: 'depot', balance: depotValue, icon: 'candlestick-chart', tone: 4, spark: [24420, 24910, 25560, 25240, 26480, 27120, depotValue] },
];
export const netWorth = r2(accounts.reduce((s, a) => s + a.balance, 0));

// --- Buchungen (November 2026, Auszug) – type: income | expense | transfer ---
export const transactions = [
  { id: 't1', date: '2026-11-24T08:12:00', title: 'REWE Markt Bielefeld', category: 'Lebensmittel', amount: -38.47, account: 'acc-giro', type: 'expense', icon: 'shopping-cart' },
  { id: 't2', date: '2026-11-23T19:30:00', title: 'Restaurant Glück & Seligkeit', category: 'Restaurants', amount: -64.80, account: 'acc-kreditkarte', type: 'expense', icon: 'utensils' },
  { id: 't3', date: '2026-11-23T10:05:00', title: 'Etsy Auszahlung', category: 'Einnahmen Shop', amount: 812.40, account: 'acc-business', type: 'income', icon: 'store' },
  { id: 't4', date: '2026-11-22T15:44:00', title: 'dm-drogerie markt', category: 'Haushalt', amount: -23.15, account: 'acc-giro', type: 'expense', icon: 'shopping-basket' },
  { id: 't5', date: '2026-11-21T09:00:00', title: 'Shopify Auszahlung', category: 'Einnahmen Shop', amount: 2140.00, account: 'acc-business', type: 'income', icon: 'store' },
  { id: 't6', date: '2026-11-20T18:10:00', title: 'Aral Tankstelle', category: 'Mobilität', amount: -71.20, account: 'acc-kreditkarte', type: 'expense', icon: 'car' },
  { id: 't7', date: '2026-11-18T12:00:00', title: 'Kino Lichtwerk', category: 'Freizeit', amount: -24.00, account: 'acc-giro', type: 'expense', icon: 'ticket' },
  { id: 't8', date: '2026-11-17T08:30:00', title: 'Edeka Center', category: 'Lebensmittel', amount: -96.31, account: 'acc-giro', type: 'expense', icon: 'shopping-cart' },
  { id: 't9', date: '2026-11-16T14:22:00', title: 'Thalia Bücher', category: 'Freizeit', amount: -42.50, account: 'acc-kreditkarte', type: 'expense', icon: 'book-open' },
  { id: 't10', date: '2026-11-16T07:00:00', title: 'Sparplan EM IMI', category: 'Sparen', amount: -75.00, account: 'acc-giro', type: 'transfer', to: 'acc-depot', icon: 'piggy-bank' },
  { id: 't11', date: '2026-11-14T11:40:00', title: 'Wochenmarkt Siegfriedplatz', category: 'Lebensmittel', amount: -31.60, account: 'acc-giro', type: 'expense', icon: 'carrot' },
  { id: 't12', date: '2026-11-12T19:00:00', title: 'Konzert Ringlokschuppen', category: 'Freizeit', amount: -98.00, account: 'acc-kreditkarte', type: 'expense', icon: 'party-popper' },
  { id: 't13', date: '2026-11-10T09:15:00', title: 'REWE Markt Bielefeld', category: 'Lebensmittel', amount: -84.12, account: 'acc-giro', type: 'expense', icon: 'shopping-cart' },
  { id: 't14', date: '2026-11-08T13:00:00', title: 'Bäckerei Krause', category: 'Lebensmittel', amount: -12.40, account: 'acc-giro', type: 'expense', icon: 'croissant' },
  { id: 't15', date: '2026-11-05T10:00:00', title: 'Fitnessstudio FitX', category: 'Gesundheit', amount: -39.90, account: 'acc-giro', type: 'expense', subscriptionId: 'sub-fitx', icon: 'dumbbell' },
  // Privatentnahme: beide Seiten sind eine Umbuchung (Geschäftskonto → Girokonto), zählt weder als Einnahme noch als Ausgabe (Befund B3).
  { id: 't16', date: '2026-11-03T08:00:00', title: 'Privatentnahme', category: 'Umbuchung', amount: 4200.00, account: 'acc-giro', type: 'transfer', from: 'acc-business', icon: 'banknote' },
  { id: 't17', date: '2026-11-03T08:05:00', title: 'Privatentnahme (Geschäftskonto)', category: 'Umbuchung', amount: -4200.00, account: 'acc-business', type: 'transfer', to: 'acc-giro', icon: 'arrow-left-right' },
  { id: 't18', date: '2026-11-02T07:00:00', title: 'Sparplan All-World', category: 'Sparen', amount: -300.00, account: 'acc-giro', type: 'transfer', to: 'acc-depot', icon: 'piggy-bank' },
  { id: 't19', date: '2026-11-02T07:00:00', title: 'Sparplan World IT', category: 'Sparen', amount: -50.00, account: 'acc-giro', type: 'transfer', to: 'acc-depot', icon: 'piggy-bank' },
  { id: 't20', date: '2026-11-02T07:05:00', title: 'Dauerauftrag Notgroschen', category: 'Sparen', amount: -150.00, account: 'acc-giro', type: 'transfer', to: 'acc-tagesgeld', icon: 'piggy-bank' },
  { id: 't21', date: '2026-11-01T06:00:00', title: 'Miete Wohnung', category: 'Wohnen', amount: -1150.00, account: 'acc-giro', type: 'expense', subscriptionId: 'sub-miete', icon: 'home' },
  { id: 't22', date: '2026-11-01T06:10:00', title: 'Stadtwerke Bielefeld (Strom)', category: 'Wohnen', amount: -95.00, account: 'acc-giro', type: 'expense', subscriptionId: 'sub-strom', icon: 'zap' },
  { id: 't23', date: '2026-11-01T06:20:00', title: 'Netflix', category: 'Abos', amount: -13.99, account: 'acc-kreditkarte', type: 'expense', subscriptionId: 'sub-netflix', icon: 'monitor' },
  { id: 't24', date: '2026-11-01T06:21:00', title: 'Spotify', category: 'Abos', amount: -10.99, account: 'acc-kreditkarte', type: 'expense', subscriptionId: 'sub-spotify', icon: 'mic' },
  { id: 't25', date: '2026-11-01T06:30:00', title: 'Telekom Mobilfunk', category: 'Abos', amount: -24.99, account: 'acc-giro', type: 'expense', subscriptionId: 'sub-handy', icon: 'smartphone' },
  { id: 't26', date: '2026-11-01T06:40:00', title: 'HUK-Coburg Kfz', category: 'Versicherungen', amount: -54.10, account: 'acc-giro', type: 'expense', subscriptionId: 'sub-kfz', icon: 'shield' },
];

// --- Budgets (Ist = Summe der Ausgaben im November je Kategorie) ---------
const spent = (cat) => r2(-transactions.filter((t) => t.type === 'expense' && t.category === cat).reduce((s, t) => s + t.amount, 0));
export const budgets = [
  { id: 'b-food', label: 'Lebensmittel', category: 'Lebensmittel', target: 450, icon: 'shopping-cart' },
  { id: 'b-fun', label: 'Freizeit', category: 'Freizeit', target: 150, icon: 'party-popper' },
  { id: 'b-rest', label: 'Restaurants', category: 'Restaurants', target: 120, icon: 'utensils' },
  { id: 'b-mob', label: 'Mobilität', category: 'Mobilität', target: 150, icon: 'car' },
  { id: 'b-home', label: 'Haushalt', category: 'Haushalt', target: 80, icon: 'shopping-basket' },
].map((b) => ({ ...b, value: spent(b.category) }));

// --- Abos & Fixkosten ----------------------------------------------------
export const subscriptions = [
  { id: 'sub-miete', name: 'Miete Wohnung', amount: 1150.00, interval: 'monatlich', day: 1, category: 'Wohnen', icon: 'home', cancelable: false },
  { id: 'sub-strom', name: 'Strom (Stadtwerke)', amount: 95.00, interval: 'monatlich', day: 1, category: 'Wohnen', icon: 'zap', cancelable: true, noticeDays: 14 },
  { id: 'sub-kfz', name: 'Kfz-Versicherung', amount: 54.10, interval: 'monatlich', day: 1, category: 'Versicherungen', icon: 'shield', cancelable: true, renewal: '2027-01-01' },
  { id: 'sub-fitx', name: 'Fitnessstudio FitX', amount: 39.90, interval: 'monatlich', day: 5, category: 'Gesundheit', icon: 'dumbbell', cancelable: true, noticeDays: 28 },
  { id: 'sub-handy', name: 'Telekom Mobilfunk', amount: 24.99, interval: 'monatlich', day: 1, category: 'Abos', icon: 'smartphone', cancelable: true, renewal: '2027-03-15' },
  { id: 'sub-netflix', name: 'Netflix Standard', amount: 13.99, interval: 'monatlich', day: 1, category: 'Abos', icon: 'monitor', cancelable: true, lastUsedDays: 34 },
  { id: 'sub-spotify', name: 'Spotify Premium', amount: 10.99, interval: 'monatlich', day: 1, category: 'Abos', icon: 'mic', cancelable: true, lastUsedDays: 0 },
  { id: 'sub-adobe', name: 'Adobe Creative Cloud', amount: 66.45, interval: 'monatlich', day: 9, category: 'Business', icon: 'palette', cancelable: true, business: true },
  { id: 'sub-icloud', name: 'iCloud+ 200 GB', amount: 2.99, interval: 'monatlich', day: 12, category: 'Abos', icon: 'cloud', cancelable: true },
];
export const fixedCostsMonthly = r2(subscriptions.filter((s) => !s.business).reduce((s, x) => s + x.amount, 0));

// --- Sparpläne & Sparziele ------------------------------------------------
export const savingsPlans = [
  { id: 'sp-allworld', name: 'All-World Sparplan', positionId: 'p-allworld', isin: 'IE00BK5BQT80', monthly: 300, day: 1, intervalMonths: 1, startDate: '2021-03-01', active: true, dynamicPa: 0.03, expectedReturnPa: 0.06, goalId: 'g-rente', tone: 1 },
  { id: 'sp-em', name: 'Emerging Markets', positionId: 'p-em', isin: 'IE00BKM4GZ66', monthly: 75, day: 15, intervalMonths: 1, startDate: '2022-01-15', active: true, dynamicPa: 0, expectedReturnPa: 0.06, goalId: 'g-rente', tone: 2 },
  { id: 'sp-tech', name: 'World IT', positionId: 'p-tech', isin: 'IE00BM67HT60', monthly: 50, day: 1, intervalMonths: 1, startDate: '2023-06-01', active: true, dynamicPa: 0, expectedReturnPa: 0.07, goalId: 'g-rente', tone: 4 },
  { id: 'sp-tagesgeld', name: 'Notgroschen (Dauerauftrag)', accountId: 'acc-tagesgeld', monthly: 150, day: 1, intervalMonths: 1, startDate: '2024-01-01', active: true, dynamicPa: 0, expectedReturnPa: 0.025, goalId: 'g-notgroschen', tone: 3 },
  { id: 'sp-ebike', name: 'E-Bike', accountId: 'acc-tagesgeld', monthly: 100, day: 15, intervalMonths: 1, startDate: '2026-03-15', active: false, pausedUntil: '2027-01-15', dynamicPa: 0, expectedReturnPa: 0.025, goalId: 'g-ebike', tone: 5 },
];
export const savingsMonthlyTotal = r2(savingsPlans.filter((p) => p.active).reduce((s, p) => s + p.monthly, 0));
const planRate = (goalId) => savingsPlans.filter((p) => p.goalId === goalId).reduce((x, p) => x + p.monthly, 0);
const tagesgeld = accounts.find((a) => a.type === 'savings').balance;
/** Sparziele: `monthly` = Summe der Raten der Pläne mit dieser goalId (auch pausierte), `current` aus Konto bzw. Depot (Invariante W6). */
export const savingsGoals = [
  { id: 'g-notgroschen', name: 'Notgroschen (6 Monatsausgaben)', target: 15000, current: tagesgeld, icon: 'shield', tone: 3, due: '2029-12-31' },
  { id: 'g-japan', name: 'Japan-Reise 2027', target: 6000, current: 2150, icon: 'plane', tone: 5, due: '2027-09-01' },
  { id: 'g-ebike', name: 'Neues E-Bike', target: 3500, current: 1200, icon: 'bike', tone: 2, due: '2027-06-01', paused: true },
  { id: 'g-rente', name: 'Altersvorsorge (Depot)', target: 250000, current: depotValue, icon: 'landmark', tone: 1, due: '2054-12-31' },
].map((g) => ({ ...g, monthly: planRate(g.id) }));

// --- Watchlist & Dividenden (fiktive Kurse) ------------------------------
export const watchlist = [
  { id: 'w-msci', title: 'iShares Core MSCI World', type: 'ETF', price: 98.42, change: 0.0062, trend: [94.1, 95.2, 96.8, 96.1, 97.9, 98.42], alert: { above: 100 } },
  { id: 'w-sap', title: 'SAP SE', type: 'Aktie', price: 231.55, change: -0.0114, trend: [240, 238, 236, 233, 234, 231.55] },
  { id: 'w-nvidia', title: 'NVIDIA', type: 'Aktie', price: 128.30, change: 0.0231, trend: [118, 121, 119, 124, 126, 128.3], alert: { below: 115 } },
  { id: 'w-gold', title: 'Gold (ETC)', type: 'Rohstoff', price: 79.85, change: 0.0041, trend: [76.2, 77.1, 78.4, 78.9, 79.5, 79.85] },
  { id: 'w-btc', title: 'Bitcoin', type: 'Krypto', price: 84120, change: 0.0312, trend: [78200, 79400, 81300, 80100, 83000, 84120] },
];
export const dividends = [
  { id: 'd1', positionId: 'p-allianz', title: 'Allianz SE', exDate: '2027-05-07', payDate: '2027-05-11', perShare: 15.40, quantity: 6, amount: r2(15.40 * 6), status: 'erwartet' },
  { id: 'd2', positionId: 'p-apple', title: 'Apple Inc.', exDate: '2026-11-10', payDate: '2026-11-13', perShare: 0.24, quantity: 8, amount: r2(0.24 * 8), status: 'gezahlt' },
  { id: 'd3', positionId: 'p-apple', title: 'Apple Inc.', exDate: '2027-02-09', payDate: '2027-02-12', perShare: 0.24, quantity: 8, amount: r2(0.24 * 8), status: 'erwartet' },
];
export const taxAllowance = { total: 1000, used: 312.40, bank: 'Trade Republic', stand: '24.11.2026' };

/**
 * Kennzahlen für Übersichten (abgeleitet – nicht von Hand pflegen). `kpis` speist die Kachel im Launchpad (erste Kennzahl).
 * Gesamtsicht: Umbuchungen (auch die Privatentnahme) zählen weder als Einnahme noch als Ausgabe (Invariante W4).
 */
export function summaryOfFinance({ tx, budgetList, net, depot, fixed, savingsTotal }) {
  const nov = tx.filter((t) => t.date.startsWith('2026-11'));
  const income = r2(nov.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0));
  const expenses = r2(-nov.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0));
  const saved = r2(-nov.filter((t) => t.type === 'transfer' && t.category === 'Sparen').reduce((s, t) => s + t.amount, 0));
  const inPlan = budgetList.filter((b) => b.value <= b.target).length;
  const rate = income ? (income - expenses) / income : 0;
  return {
    netWorth: net, depotValue: depot, income, expenses, saved, savingsRate: rate, fixedCostsMonthly: fixed, savingsMonthlyTotal: savingsTotal,
    kpis: budgetList.length || tx.length ? [
      { label: 'Budgets im Plan', value: `${inPlan} von ${budgetList.length}`, icon: 'wallet', tone: inPlan === budgetList.length ? 'success' : 'warning', to: 'finance.budgets' },
      { label: 'Sparquote Nov.', value: String(Math.round(rate * 100)), unit: '%', icon: 'piggy-bank', tone: 'accent', to: 'finance.cashflow' },
      { label: 'gespart im November', value: String(Math.round(saved)), unit: '€', icon: 'piggy-bank', tone: 'accent', to: 'savings.home' },
      { label: 'Vermögen', value: String(Math.round(net)), unit: '€', icon: 'landmark', tone: 'info', to: 'finance.networth' },
    ] : [{ label: 'Konten verbunden', value: 0, icon: 'wallet', tone: 'neutral', to: 'finance.accounts' }],
  };
}
export const financeSummary = summaryOfFinance({ tx: transactions, budgetList: budgets, net: netWorth, depot: depotValue, fixed: fixedCostsMonthly, savingsTotal: savingsMonthlyTotal });

// ============================================================================
// ERWEITERUNGEN Finanzen (Ausbau des Moduls). Nur ergänzt – bestehende Schlüssel bleiben unverändert.
// Eigentümer: finance. Sparpläne/Trading lesen die obigen Schlüssel; diese hier sind Finanzen-intern.
// ============================================================================

// --- Kategorien (feste Taxonomie, kind: fix | variabel | sparen | einkommen | umbuchung) ---------------------
export const financeCategories = [
  { id: 'Lebensmittel', label: 'Lebensmittel', icon: 'shopping-cart', tone: 2, kind: 'variabel' },
  { id: 'Restaurants', label: 'Restaurants', icon: 'utensils', tone: 3, kind: 'variabel' },
  { id: 'Haushalt', label: 'Haushalt', icon: 'shopping-basket', tone: 5, kind: 'variabel' },
  { id: 'Freizeit', label: 'Freizeit', icon: 'party-popper', tone: 4, kind: 'variabel' },
  { id: 'Mobilität', label: 'Mobilität', icon: 'car', tone: 1, kind: 'variabel' },
  { id: 'Gesundheit', label: 'Gesundheit', icon: 'heart-pulse', tone: 6, kind: 'fix' },
  { id: 'Wohnen', label: 'Wohnen', icon: 'home', tone: 1, kind: 'fix' },
  { id: 'Versicherungen', label: 'Versicherungen', icon: 'shield', tone: 5, kind: 'fix' },
  { id: 'Abos', label: 'Abos', icon: 'repeat', tone: 4, kind: 'fix' },
  { id: 'Sonstiges', label: 'Sonstiges', icon: 'tag', tone: 'neutral', kind: 'variabel' },
  { id: 'Einnahmen Shop', label: 'Einnahmen Shop', icon: 'store', tone: 'success', kind: 'einkommen' },
  { id: 'Einnahmen', label: 'Sonstige Einnahmen', icon: 'banknote', tone: 'success', kind: 'einkommen' },
  { id: 'Sparen', label: 'Sparen', icon: 'piggy-bank', tone: 'accent', kind: 'sparen' },
  { id: 'Umbuchung', label: 'Umbuchung', icon: 'arrow-left-right', tone: 'neutral', kind: 'umbuchung' },
];

// --- Regeln: „Wenn der Titel X enthält, dann Kategorie Y“ (Treffer werden aus den Buchungen berechnet) ---------
export const financeRules = [
  { id: 'r-rewe', match: 'rewe', category: 'Lebensmittel', active: true },
  { id: 'r-edeka', match: 'edeka', category: 'Lebensmittel', active: true },
  { id: 'r-markt', match: 'wochenmarkt', category: 'Lebensmittel', active: true },
  { id: 'r-aral', match: 'aral', category: 'Mobilität', active: true },
  { id: 'r-dm', match: 'dm-drogerie', category: 'Haushalt', active: true },
  { id: 'r-kino', match: 'kino', category: 'Freizeit', active: true },
  { id: 'r-etsy', match: 'etsy', category: 'Einnahmen Shop', active: true },
  { id: 'r-shopify', match: 'shopify', category: 'Einnahmen Shop', active: true },
  { id: 'r-netflix', match: 'netflix', category: 'Abos', active: true },
  { id: 'r-spotify', match: 'spotify', category: 'Abos', active: false },
  { id: 'r-sparplan', match: 'sparplan', category: 'Sparen', active: true },
  { id: 'r-cafe', match: 'café', category: 'Restaurants', active: true },
  { id: 'r-restaurant', match: 'restaurant', category: 'Restaurants', active: true },
  { id: 'r-baecker', match: 'bäckerei', category: 'Lebensmittel', active: true },
].map((r) => ({ ...r, hits: transactions.filter((t) => t.title.toLowerCase().includes(r.match)).length }));

// --- Zusatzangaben zu Buchungen (Notiz, Beleg) – Buchungen selbst bleiben unverändert ----------------------------
export const financeTxMeta = {
  t8: { note: 'Wocheneinkauf plus Zutaten für die Grillfeier am Samstag', receipt: 'edeka-17-11.jpg' },
  t12: { note: 'Zwei Karten, Jana kommt mit', receipt: 'ringlokschuppen-tickets.pdf' },
  t5: { note: 'Auszahlung KW 47', receipt: 'shopify-auszahlung-47.pdf' },
  t2: { note: 'Abendessen mit Jana' },
  t21: { note: 'Dauerauftrag, Mietvertrag im Ordner Wohnung' },
};

// --- Weitere Termine mit Geldwirkung (neben Abos und Sparplänen) -----------------------------------------------
export const financeEvents = [
  { id: 'ev-kk', kind: 'karte', title: 'Kreditkartenabrechnung', date: '2026-11-30', amount: accounts.find((a) => a.type === 'credit').balance, from: 'acc-giro', icon: 'credit-card', tone: 6 },
  { id: 'ev-est', kind: 'steuer', title: 'Einkommensteuer-Vorauszahlung', date: '2026-12-10', amount: -1200, from: 'acc-business', business: true, icon: 'landmark', tone: 'warning', note: 'Annahme, Demo-Wert' },
];

// --- Fristen und Laufzeiten der Verträge (Annahmen der Demo) ---------------------------------------------------
export const financeSubMeta = {
  'sub-kfz': { cancelBy: '2026-11-30', term: 'Jahresvertrag, verlängert sich zum 01.01.2027', note: 'Kündigung zum Jahreswechsel nur bis 30.11.' },
  'sub-handy': { cancelBy: '2026-12-15', term: '24 Monate, verlängert sich zum 15.03.2027', note: 'Drei Monate Frist' },
  'sub-fitx': { cancelBy: '2026-12-03', term: 'Monatlich kündbar mit 28 Tagen Frist', note: 'Zum Jahresende kündigen bis 03.12.' },
  'sub-strom': { term: 'Variabler Tarif, 14 Tage Frist' },
  'sub-netflix': { term: 'Monatlich kündbar' },
  'sub-spotify': { term: 'Monatlich kündbar' },
  'sub-icloud': { term: 'Monatlich kündbar' },
  'sub-adobe': { term: 'Jahresabo, monatlich gezahlt', note: 'Betriebsausgabe' },
  'sub-miete': { term: 'Unbefristeter Mietvertrag' },
};

// --- Monatswerte der Vormonate (Jun–Okt). Der laufende Monat wird zur Laufzeit aus den Buchungen berechnet. ------
const month = (key, label, income, saved, byCat) => ({ key, label, income, saved, byCat, expenses: r2(Object.values(byCat).reduce((s, x) => s + x, 0)) });
export const financeMonths = [
  month('2026-06', 'Jun', 3120, 525, { Wohnen: 1245, Lebensmittel: 398.4, Restaurants: 112.8, Freizeit: 96, Mobilität: 128.5, Haushalt: 54.3, Abos: 49.97, Versicherungen: 54.1, Gesundheit: 39.9 }),
  month('2026-07', 'Jul', 2840, 575, { Wohnen: 1245, Lebensmittel: 412.2, Restaurants: 168.4, Freizeit: 214.5, Mobilität: 183, Haushalt: 61.8, Abos: 49.97, Versicherungen: 54.1, Gesundheit: 39.9 }),
  month('2026-08', 'Aug', 3560, 575, { Wohnen: 1245, Lebensmittel: 389.9, Restaurants: 142.1, Freizeit: 131.2, Mobilität: 96.4, Haushalt: 47.6, Abos: 49.97, Versicherungen: 54.1, Gesundheit: 39.9 }),
  month('2026-09', 'Sep', 3290, 575, { Wohnen: 1262, Lebensmittel: 421.6, Restaurants: 98.7, Freizeit: 88, Mobilität: 142.3, Haushalt: 72.4, Abos: 49.97, Versicherungen: 54.1, Gesundheit: 39.9 }),
  month('2026-10', 'Okt', 3715, 575, { Wohnen: 1245, Lebensmittel: 436.8, Restaurants: 124.5, Freizeit: 172.4, Mobilität: 164.9, Haushalt: 66.2, Abos: 49.97, Versicherungen: 54.1, Gesundheit: 39.9 }),
];

// --- Vermögensverlauf nach Gruppen (Dez–Nov); letzter Wert = aktueller Stand der Konten ------------------------
const grp = (types) => r2(accounts.filter((a) => types.includes(a.type)).reduce((s, a) => s + a.balance, 0));
export const financeNetWorthHistory = {
  labels: depotHistory.labels,
  series: [
    { name: 'Liquidität', values: [12840, 13620, 14180, 13950, 15310, 14870, 13490, 14760, 15620, 14930, 16180, grp(['giro', 'business', 'credit'])] },
    { name: 'Rücklagen', values: [7520, 7700, 7880, 8060, 8240, 8420, 8600, 8780, 8960, 9140, 9320, grp(['savings'])] },
    { name: 'Depot', values: [...depotHistory.series[0].values.slice(0, 11), depotValue] },
  ],
};

// --- Einstellungen Privatsphäre & Sicherheit (nur Finanzen) -----------------------------------------------------
export const financePrefs = {
  hideAmounts: false, tapReveal: true, hideInNotifications: true, hideInSwitcher: true,
  lock: false, lockMethod: 'biometrie', lockAfterMin: 1,
  reserve: 300, // Puffer, der bei „frei verfügbar“ nicht mitzählt (eigene Vorgabe)
};

// --- Hinweise, Suche, Mitteilungen ------------------------------------------------------------------------------
// Konten, Buchungen und Sparpläne findet die globale Suche direkt aus den Sammlungen (Slots); `financeSearch` nennt Abos und Budgets.
const fmtEur = (v) => eur(Math.abs(v), true);
export const financeHints = [
  ...budgets.filter((b) => b.value > b.target).map((b) => ({ id: `h-bud-${b.id}`, text: `${b.label} liegt ${fmtEur(b.value - b.target)} über dem Budget.`, source: `budgets[${b.id}]`, module: 'finance', tone: 'warning', to: 'finance.budgets' })),
  { id: 'h-kfz', text: 'Kfz-Versicherung: Kündigung zum 01.01. ist noch bis 30.11. möglich.', source: 'financeSubMeta[sub-kfz]', module: 'finance', tone: 'info', to: 'finance.subscriptions', carry: { selectedId: 'sub-kfz' } },
  { id: 'h-netflix', text: `Netflix wurde seit 34 Tagen nicht genutzt (${fmtEur(13.99 * 12)} im Jahr).`, source: 'subscriptions[sub-netflix]', module: 'finance', tone: 'info', to: 'finance.subscriptions', carry: { selectedId: 'sub-netflix' } },
];
export const financeSearch = [
  ...subscriptions.map((s) => ({ id: `sub:${s.id}`, type: 'Abo', title: s.name, subtitle: `${fmtEur(s.amount)} im Monat`, module: 'finance', to: 'finance.subscriptions', params: { id: s.id } })),
  ...budgets.map((b) => ({ id: `budget:${b.id}`, type: 'Budget', title: `Budget ${b.label}`, subtitle: `${fmtEur(b.value)} von ${fmtEur(b.target)}`, module: 'finance', to: 'finance.budgets', params: { id: b.id } })),
];
const budFun = budgets.find((b) => b.id === 'b-fun');
export const financeNotifications = [
  { id: 'n-kfz', title: 'Kündigungsfrist Kfz-Versicherung', text: 'Noch bis 30.11. zum Jahreswechsel kündbar.', module: 'finance', tone: 'warning', priority: 'wichtig', time: '2026-11-24T08:00:00', to: 'finance.subscriptions' },
  { id: 'n-fun', title: 'Freizeit über Budget', text: `${fmtEur(budFun.value - budFun.target)} über dem Monatsbudget.`, module: 'finance', tone: 'warning', priority: 'normal', time: '2026-11-22T20:10:00', to: 'finance.budgets' },
  { id: 'n-tx', title: 'Etsy Auszahlung eingegangen', text: `Geschäftskonto: ${fmtEur(812.4)}`, module: 'finance', tone: 'info', priority: 'leise', time: '2026-11-23T10:05:00', to: 'finance.transaction', params: { id: 't3' } },
];

// --- Szenarien: Erststart (nichts erfasst) und Stress (Extremwerte, abgeleitete Werte folgen den verdreifachten Listen) ----------
const tripled = (v) => triple(v);
const stressTx = tripled(transactions);
const stressPositions = tripled(positions);
const stressDepot = r2(stressPositions.reduce((x, p) => x + p.value, 0) + depotCash);
const stressAccounts = [
  ...accounts.map((a) => (a.type === 'depot' ? { ...a, balance: stressDepot } : a)),
  { id: 'acc-extrem', name: 'Verrechnungskonto Online-Shop Nordlicht Studio mit sehr langem Namen', bank: 'Kontist Business Premium', type: 'business', balance: 9999999.99, icon: 'briefcase', tone: 5, spark: [9800000, 9900000, 9999999.99], iban: 'DE02 1203 0000 •••• •••• 00' },
];
const stressNet = r2(stressAccounts.reduce((x, a) => x + a.balance, 0));
const stressSpent = (cat) => r2(-stressTx.filter((t) => t.type === 'expense' && t.category === cat).reduce((x, t) => x + t.amount, 0));
const stressBudgets = budgets.map((b) => ({ ...b, value: stressSpent(b.category) }));
const stressSubs = tripled(subscriptions);
const stressFixed = r2(stressSubs.filter((x) => !x.business).reduce((x, y) => x + y.amount, 0));
const stressPlans = tripled(savingsPlans);
const stressSavings = r2(stressPlans.filter((p) => p.active).reduce((x, p) => x + p.monthly, 0));
const stressRate = (g) => r2(stressPlans.filter((p) => p.goalId === g).reduce((x, p) => x + p.monthly, 0));
export const scenarios = {
  erststart: {
    financeSummary: summaryOfFinance({ tx: [], budgetList: [], net: 0, depot: 0, fixed: 0, savingsTotal: 0 }), netWorth: 0, fixedCostsMonthly: 0,
    financeMonths: [], financeEvents: [], financeHints: [], financeSearch: [], financeNotifications: [],
    financeNetWorthHistory: { labels: [], series: [] },
    financeRules: [], financeTxMeta: {},
    financeCategories, financePrefs,
  },
  stress: {
    financeMonths,
    accounts: stressAccounts, netWorth: stressNet, transactions: stressTx, budgets: stressBudgets,
    positions: stressPositions, depotValue: stressDepot, subscriptions: stressSubs, fixedCostsMonthly: stressFixed,
    savingsPlans: stressPlans, savingsMonthlyTotal: stressSavings,
    savingsGoals: savingsGoals.map((g) => ({ ...g, current: g.id === 'g-rente' ? stressDepot : g.current, monthly: stressRate(g.id) })),
    depotHistory: { ...depotHistory, series: depotHistory.series.map((x, i) => (i === 0 ? { ...x, values: [...x.values.slice(0, -1), Math.round(stressDepot)] } : x)) },
    financeSummary: summaryOfFinance({ tx: stressTx, budgetList: stressBudgets, net: stressNet, depot: stressDepot, fixed: stressFixed, savingsTotal: stressSavings }),
  },
};
