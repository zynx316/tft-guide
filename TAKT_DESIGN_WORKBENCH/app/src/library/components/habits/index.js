// Komponentenbereich "habits": Gewohnheiten (habit-*, streak-panel, routine-flow) und Start/Heute (today-tiles, day-brief, …).
// Export default Array von Komponenten-Definitionen (siehe library/CONTRACT.md).
import habitList from './habit-list.js';
import habitWeekGrid from './habit-week-grid.js';
import habitHeatmap from './habit-heatmap.js';
import streakPanel from './streak-panel.js';
import habitInsights from './habit-insights.js';
import routineFlow from './routine-flow.js';
import habitForm from './habit-form.js';
import todayTiles from './today-tiles.js';
import dayBrief from './day-brief.js';
import hintCards from './hint-cards.js';
import dayRings from './day-rings.js';
import quickCapture from './quick-capture.js';
import ritualStepper from './ritual-stepper.js';
import weekReview from './week-review.js';
import tileConfig from './tile-config.js';

export default [habitList, habitWeekGrid, habitHeatmap, streakPanel, habitInsights, routineFlow, habitForm, todayTiles, dayBrief, hintCards, dayRings, quickCapture, ritualStepper, weekReview, tileConfig];
