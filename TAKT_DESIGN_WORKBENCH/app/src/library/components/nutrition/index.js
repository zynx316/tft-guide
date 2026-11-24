// Komponentenbereich "nutrition" (Ernährung) – export default Array von Komponenten-Definitionen (siehe library/CONTRACT.md).
// Gemeinsame Helfer: _calc.js, _recipes.js (rein, ohne UI), _ui.js, _portion.js.
import calorieBudget from './calorie-budget.js';
import macroSummary from './macro-summary.js';
import mealTimeline from './meal-timeline.js';
import waterTracker from './water-tracker.js';
import nextMealCard from './next-meal-card.js';
import nutritionHints from './nutrition-hints.js';
import dayStrip from './day-strip.js';
import foodSearch from './food-search.js';
import portionPicker from './portion-picker.js';
import scanSim from './scan-sim.js';
import quickKcal from './quick-kcal.js';
import kcalTrend from './kcal-trend.js';
import logBar from './log-bar.js';
import foodList from './food-list.js';
import nutritionTable from './nutrition-table.js';
import foodForm from './food-form.js';
import recipeList from './recipe-list.js';
import recipeDetail from './recipe-detail.js';
import cookMode from './cook-mode.js';
import weekPlanner from './week-planner.js';
import shoppingList from './shopping-list.js';
import goalWizard from './goal-wizard.js';
import nutritionStats from './nutrition-stats.js';

export default [...calorieBudget, ...macroSummary, ...mealTimeline, ...waterTracker, ...nextMealCard, ...nutritionHints, ...dayStrip, ...foodSearch, ...portionPicker, ...scanSim, ...quickKcal, ...kcalTrend, ...logBar, ...foodList, ...nutritionTable, ...foodForm, ...recipeList, ...recipeDetail, ...cookMode, ...weekPlanner, ...shoppingList, ...goalWizard, ...nutritionStats];
