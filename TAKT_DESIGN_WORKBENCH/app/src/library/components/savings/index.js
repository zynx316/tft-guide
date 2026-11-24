// Komponentenbereich "savings" (Sparpläne) – export default Array von Komponenten-Definitionen (siehe library/CONTRACT.md).
// Gemeinsame Helfer: _savings.js (Formate, Atome, CSS), _plans.js (Plan-Logik), _coverage.js, _calc.js (Rechner-Zustand), _chart.js, _wizard.js.
import savingsSummary from './savings-summary.js';
import savingsPlanList from './savings-plan-list.js';
import growthChart from './growth-chart.js';
import savingsSliders from './savings-sliders.js';
import savingsResult from './savings-result.js';
import savingsTable from './savings-table.js';
import goalCalculator from './goal-calculator.js';
import savingsGoalCard from './savings-goal-card.js';
import savingsWizard from './savings-wizard.js';
import executionCalendar from './execution-calendar.js';
import coverageCheck from './coverage-check.js';
import savingsPlanDetail from './savings-plan-detail.js';
import executionList from './execution-list.js';
import savingsCompare from './savings-compare.js';
import taxAllowance from './tax-allowance.js';
import savingsHints from './savings-hints.js';
import planActions from './plan-actions.js';

export default [...savingsSummary, ...savingsPlanList, ...growthChart, ...savingsSliders, ...savingsResult, ...savingsTable, ...goalCalculator, ...savingsGoalCard, ...savingsWizard, ...executionCalendar, ...coverageCheck, ...savingsPlanDetail, ...executionList, ...savingsCompare, ...taxAllowance, ...savingsHints, ...planActions];
