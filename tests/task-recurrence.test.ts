import assert from "node:assert/strict";
import test from "node:test";

import {
  nextDueAfterCompletion,
  nextTaskOccurrence,
  reactivateRecurringTaskIfDue,
  taskOccursOn,
} from "../lib/task-recurrence.ts";

const recurringTask = (
  repeatUnit: "day" | "week" | "month" | "year",
  repeatInterval: number,
  repeatAnchor: string,
  completed = `${repeatAnchor}T16:00:00.000Z`,
) => ({
  id: "task",
  title: "Test task",
  section: "custom",
  created: `${repeatAnchor}T12:00:00.000Z`,
  recurring: true,
  repeatUnit,
  repeatInterval,
  repeatAnchor,
  done: true,
  completed,
});

test("a monthly task completed July 29 returns August 29", () => {
  const task = recurringTask("month", 1, "2026-07-29");
  assert.equal(nextDueAfterCompletion(task), "2026-08-29");
  assert.equal(reactivateRecurringTaskIfDue(task, "2026-08-28").done, true);
  const due = reactivateRecurringTaskIfDue(task, "2026-08-29");
  assert.equal(due.done, false);
  assert.equal(due.completed, undefined);
});

test("quarterly and six-month schedules preserve their anchor day", () => {
  assert.equal(
    nextTaskOccurrence(recurringTask("month", 3, "2026-07-29"), "2026-07-29"),
    "2026-10-29",
  );
  assert.equal(
    nextTaskOccurrence(recurringTask("month", 6, "2026-07-29"), "2026-07-29"),
    "2027-01-29",
  );
});

test("late completion does not shift the established monthly schedule", () => {
  const task = recurringTask(
    "month",
    1,
    "2026-07-15",
    "2026-07-29T18:00:00.000Z",
  );
  assert.equal(nextDueAfterCompletion(task), "2026-08-15");
});

test("early completion still returns the first scheduled occurrence", () => {
  const task = recurringTask(
    "month",
    1,
    "2026-08-15",
    "2026-07-29T18:00:00.000Z",
  );
  assert.equal(nextDueAfterCompletion(task), "2026-08-15");
});

test("month-end schedules clamp without drifting", () => {
  const task = recurringTask("month", 1, "2026-01-31");
  assert.equal(nextTaskOccurrence(task, "2026-01-31"), "2026-02-28");
  assert.equal(nextTaskOccurrence(task, "2026-02-28"), "2026-03-31");
});

test("leap-day yearly schedules use the final day of February", () => {
  const task = recurringTask("year", 1, "2024-02-29");
  assert.equal(nextTaskOccurrence(task, "2024-02-29"), "2025-02-28");
  assert.equal(taskOccursOn(task, "2028-02-29"), true);
});

test("weekly and biweekly schedules respect selected weekdays", () => {
  const weekly = {
    ...recurringTask("week", 1, "2026-07-27"),
    recurringDays: ["Monday", "Thursday"],
  };
  assert.equal(nextTaskOccurrence(weekly, "2026-07-27"), "2026-07-30");
  assert.equal(nextTaskOccurrence(weekly, "2026-07-30"), "2026-08-03");

  const biweekly = {
    ...recurringTask("week", 2, "2026-07-27"),
    recurringDays: ["Monday"],
  };
  assert.equal(nextTaskOccurrence(biweekly, "2026-07-27"), "2026-08-10");
});

test("daily intervals reactivate on or after the next due date", () => {
  const task = recurringTask("day", 3, "2026-07-29");
  assert.equal(nextTaskOccurrence(task, "2026-07-29"), "2026-08-01");
  assert.equal(reactivateRecurringTaskIfDue(task, "2026-08-03").done, false);
});
