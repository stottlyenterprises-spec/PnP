import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
const googleConnect = readFileSync(new URL("../app/api/google/connect/route.ts", import.meta.url), "utf8");
const outlookToken = readFileSync(new URL("../app/api/outlook/token.ts", import.meta.url), "utf8");

test("D.E.E.D.S. tasks can be scheduled without a connected calendar", () => {
  assert.match(page, /openTaskScheduler/);
  assert.match(page, /Put on calendar/);
  assert.match(page, /D\.E\.E\.D\.S\. calendar/);
  assert.match(page, /scheduledDate:date/);
  assert.match(page, /setCalendarAnchor\(calendarScheduler\.date\)/);
});

test("calendar task cards support mouse and long-press touch dragging", () => {
  assert.match(page, /CalendarTaskItem/);
  assert.match(page, /draggable onDragStart/);
  assert.match(page, /calendarLongPressRef\.current=window\.setTimeout/);
  assert.match(page, /setPointerCapture\(event\.pointerId\)/);
  assert.match(page, /data-calendar-drop-date/);
  assert.match(page, /Math\.round\(\(\(clientY-rect\.top\)\/60\*60\)\/15\)\*15/);
  assert.match(css, /\.calendarTaskDraggable\{[^}]*touch-action:none/);
  assert.match(css, /\.calendarDropZone\.dropActive/);
});

test("dragging one recurring occurrence persists an exception without moving the series", () => {
  assert.match(page, /calendarOverrides\?:Record<string,CalendarOccurrenceOverride>/);
  assert.match(page, /currentTask\.recurring&&!moveSeries/);
  assert.match(page, /\[sourceKey\]:\{date,time:nextTime\}/);
  assert.match(page, /calendarOccurrenceSource:source/);
  assert.match(page, /!task\.calendarOverrides\?\.\[date\]/);
});

test("calendar moves are recoverable and connected events remain read-only", () => {
  assert.match(page, /restoreCalendarMove/);
  assert.match(page, />Undo</);
  assert.match(googleConnect, /calendar\.readonly/);
  assert.doesNotMatch(googleConnect, /auth\/calendar["\s]/);
  assert.match(outlookToken, /Calendars\.Read/);
  assert.doesNotMatch(outlookToken, /Calendars\.ReadWrite/);
});

test("repeating tasks warn before the scheduling sheet moves their series", () => {
  assert.match(page, /This is a repeating task\. Scheduling it here moves its repeating schedule/);
  assert.match(page, /next\.repeatAnchor=date/);
  assert.match(page, /next\.recurringDays/);
});

test("undated tasks can be planned from lists directly onto a real month grid", () => {
  assert.match(page, /unscheduledCalendarTasks/);
  assert.match(page, /CalendarPlanningTray/);
  assert.match(page, /tap it and then tap a day/i);
  assert.match(page, /schedulePlanningTask/);
  assert.match(page, /MonthCalendar/);
  assert.match(page, /monthPlanningGrid/);
  assert.match(css, /\.calendarBacklog/);
  assert.match(css, /\.monthPlanningGrid/);
});

test("an undated task is not mistaken for an unchanged calendar move", () => {
  assert.match(page, /hasExistingDate=!!\(original\.scheduledDate\|\|original\.repeatAnchor\|\|original\.calendarOccurrenceSource\)/);
  assert.match(page, /sameDate=hasExistingDate&&date===sourceKey/);
  assert.match(page, /drag\.sourceDate===""/);
});

test("task editing presents one date concept for one-time and repeating work", () => {
  assert.match(page, /editingTask\.recurring\?"Next due":"Scheduled for"/);
  assert.match(page, /The next date this task should appear/);
  assert.doesNotMatch(page, />Scheduled date</);
  assert.doesNotMatch(page, />First occurrence</);
  assert.match(page, /scheduledDate:recurring\?undefined:anchor/);
});
