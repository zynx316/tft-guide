// Beispieldaten für die Komponenten-Galerie (aus der gemeinsamen Datenwelt, nur lesen).
import { goals, goalAreas } from '../../../seed/world/goals.js';
import { savingsGoals } from '../../../seed/world/finance.js';
import { bodySummary, bodyWeightLog, fitnessProfile, weeklyTraining, fitnessStreak } from '../../../seed/world/fitness.js';
import { channels } from '../../../seed/world/sales.js';
import { habits } from '../../../seed/world/habits.js';
import { tasks } from '../../../seed/world/organisation.js';
import { notes } from '../../../seed/world/knowledge.js';

export const EXAMPLE = { goals, areas: goalAreas, tasks, savingsGoals, bodySummary, bodyWeightLog, fitnessProfile, weeklyTraining, fitnessStreak, channels, habits, notes };
