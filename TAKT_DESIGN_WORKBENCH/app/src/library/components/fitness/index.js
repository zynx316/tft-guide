// Komponentenbereich "fitness" – export default Array von Komponenten-Definitionen (siehe library/CONTRACT.md).
import setLogger from './set-logger.js';
import focusSet from './focus-set.js';
import sessionHeader from './session-header.js';
import restTimer from './rest-timer.js';
import workoutSummary from './workout-summary.js';
import exerciseList from './exercise-list.js';
import exerciseDetail from './exercise-detail.js';
import exerciseAlternatives from './exercise-alternatives.js';
import trainingWeek from './training-week.js';
import programCard from './program-card.js';
import nextWorkout from './next-workout.js';
import recordsList from './records-list.js';
import muscleBalance from './muscle-balance.js';
import weightTrend from './weight-trend.js';
import weightEntry from './weight-entry.js';
import bodyMeasures from './body-measures.js';
import stepsChart from './steps-chart.js';
import sleepChart from './sleep-chart.js';
import readinessCard from './readiness-card.js';
import streakCard from './streak-card.js';
import goalList from './goal-list.js';
import milestoneList from './milestone-list.js';
import weeklyRecap from './weekly-recap.js';
import kpiRow from './kpi-row.js';

export default [...sessionHeader, ...setLogger, ...focusSet, ...restTimer, ...workoutSummary, ...exerciseList, ...exerciseDetail, ...exerciseAlternatives, ...trainingWeek, ...programCard, ...nextWorkout,
  ...recordsList, ...muscleBalance, ...weightTrend, ...weightEntry, ...bodyMeasures, ...stepsChart, ...sleepChart, ...readinessCard, ...streakCard, ...goalList, ...milestoneList, ...weeklyRecap, ...kpiRow];
