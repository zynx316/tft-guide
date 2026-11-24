// Gesundheit (Fitness, Ernährung): Erststart ist in sich schlüssig – kein vorbelegter Plan, Startprogramme sind gültig,
// ein gewähltes Programm erzeugt „Heute“ und keine „ausgelassenen“ Tage davor.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { WORLD } from '../app/src/seed/world/index.js';
import { applyScenario } from '../app/src/core/world.js';
import { nextTraining, weekOverview } from '../app/src/library/components/fitness/_calc.js';

const TODAY = '2026-11-24';
const es = applyScenario(WORLD, 'erststart');
const lib = WORLD.exerciseLibrary;

test('Fitness Erststart: noch kein Programm, keine Einheit, kein „nächstes Training“', () => {
  assert.equal(es.trainingProgram.days.length, 0);
  assert.equal(es.trainingProgram.rhythm.length, 0);
  assert.equal(es.activeWorkout.exercises.length, 0);
  assert.equal(es.fitnessToday.nextDayId, null);
  assert.equal(es.workoutHistory.length, 0);
  assert.equal(weekOverview(es.trainingProgram, es.workoutHistory, [], TODAY).some((d) => d.kind === 'missed'), false);
});

test('Startprogramme: Katalog bleibt im Erststart, Übungen und Rhythmus sind gültig', () => {
  assert.ok(es.programCatalog.length >= 2 && es.programCatalog.length <= 4);
  assert.equal(es.programCatalog.filter((c) => c.recommended).length, 1);
  for (const c of es.programCatalog) {
    const p = c.program; const ids = new Set(p.days.map((d) => d.id));
    assert.ok(p.rhythm.length === 7, `${c.id}: Rhythmus Mo–So`);
    for (const r of p.rhythm.filter((x) => x.kind === 'strength')) assert.ok(ids.has(r.dayId), `${c.id}: Tag ${r.dayId} fehlt`);
    for (const d of p.days) for (const e of d.exercises) assert.ok(lib.some((l) => l.id === e.exerciseId), `${c.id}: Übung ${e.exerciseId} fehlt`);
    const t = nextTraining(p, lib, TODAY);
    assert.ok(t && t.nextDayId && t.nextExercises.length > 0 && t.nextSets > 0, `${c.id}: nächstes Training`);
  }
});

test('Gewähltes Programm: Tage vor dem Start sind nicht „ausgelassen“', () => {
  const prog = { ...es.programCatalog[0].program, startDate: TODAY };
  const week = weekOverview(prog, [], [], TODAY);
  assert.equal(week[0].kind, 'prestart');
  assert.equal(week.some((d) => d.kind === 'missed'), false);
});

test('Ernährung Erststart: Tagebuch und Verlauf leer, Tagesziel bleibt', () => {
  assert.equal(es.nutDiary.length, 0);
  assert.equal(es.nutHistory.length, 0);
  assert.ok(es.nutGoals.kcal > 0);
});
