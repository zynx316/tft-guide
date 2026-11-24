// Domänen-Komponenten "tasks"
import taskList from './task-list.js';
import kanbanBoard from './kanban-board.js';
import focusNext from './focus-next.js';
import taskDetail from './task-detail.js';
import projectList from './project-list.js';
import taskStats from './task-stats.js';
import taskCharts from './task-charts.js';
import taskInbox from './task-inbox.js';
import taskCapture from './task-capture.js';
import focusTimer from './focus-timer.js';
import focusLog from './focus-log.js';
import taskHints from './task-hints.js';
import nextTask from './next-task.js';
export default [taskList, kanbanBoard, focusNext, taskDetail, projectList, taskStats, ...taskCharts, taskInbox, taskCapture, focusTimer, focusLog, taskHints, nextTask];
