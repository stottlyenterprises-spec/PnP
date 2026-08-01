export type RecurrenceUnit = "day" | "week" | "month" | "year";

export type RecurringTaskSchedule = {
  recurring?: boolean;
  recurringDays?: string[];
  repeatInterval?: number;
  repeatUnit?: RecurrenceUnit;
  repeatAnchor?: string;
  scheduledDate?: string;
  created: string;
};

export type CompletableRecurringTask = RecurringTaskSchedule & {
  done: boolean;
  completed?: string;
};

export type TodayTaskSchedule = RecurringTaskSchedule & {
  section: string;
  day?: string;
};

export const recurrenceDays = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

const dateParts = (date: string) => date.split("-").map(Number) as [number, number, number];

const utcDayNumber = (date: string) => {
  const [year, month, day] = dateParts(date);
  return Math.floor(Date.UTC(year, month - 1, day) / 86400000);
};

const fromUtcDayNumber = (dayNumber: number) =>
  new Date(dayNumber * 86400000).toISOString().slice(0, 10);

export const weekdayForDate = (date: string) => {
  const day = new Date(`${date}T12:00:00`).getDay();
  return recurrenceDays[(day + 6) % 7];
};

const startOfWeekNumber = (date: string) =>
  utcDayNumber(date) - recurrenceDays.indexOf(weekdayForDate(date));

const scheduleAnchor = (task: RecurringTaskSchedule, fallback: string) =>
  task.repeatAnchor || task.scheduledDate || task.created.slice(0, 10) || fallback;

const scheduleUnit = (task: RecurringTaskSchedule): RecurrenceUnit =>
  task.repeatUnit || (task.recurringDays?.length ? "week" : "day");

const scheduleInterval = (task: RecurringTaskSchedule) =>
  Math.max(1, Number(task.repeatInterval) || 1);

export function taskOccursOn(task: RecurringTaskSchedule, date: string): boolean {
  if (!task.recurring) return false;
  const anchor = scheduleAnchor(task, date);
  if (date < anchor) return false;
  const interval = scheduleInterval(task);
  const unit = scheduleUnit(task);

  if (unit === "day") {
    return (utcDayNumber(date) - utcDayNumber(anchor)) % interval === 0;
  }

  if (unit === "week") {
    const activeDays = task.recurringDays?.length
      ? task.recurringDays
      : [weekdayForDate(anchor)];
    return (
      activeDays.includes(weekdayForDate(date)) &&
      Math.floor((startOfWeekNumber(date) - startOfWeekNumber(anchor)) / 7) % interval === 0
    );
  }

  const [year, month, day] = dateParts(date);
  const [anchorYear, anchorMonth, anchorDay] = dateParts(anchor);

  if (unit === "month") {
    const monthDistance = (year - anchorYear) * 12 + (month - anchorMonth);
    const lastDay = new Date(year, month, 0).getDate();
    return monthDistance % interval === 0 && day === Math.min(anchorDay, lastDay);
  }

  const yearDistance = year - anchorYear;
  const lastDay = new Date(year, anchorMonth, 0).getDate();
  return (
    yearDistance % interval === 0 &&
    month === anchorMonth &&
    day === Math.min(anchorDay, lastDay)
  );
}

export function taskAppearsToday(task: TodayTaskSchedule, date: string): boolean {
  if (task.scheduledDate === date) return true;
  if (task.recurring) return taskOccursOn(task, date);
  if (task.day === weekdayForDate(date)) return true;
  if (task.scheduledDate) return false;
  return task.section === "today";
}

export function nextTaskOccurrence(
  task: RecurringTaskSchedule,
  afterDate: string,
): string | null {
  if (!task.recurring) return null;
  const anchor = scheduleAnchor(task, afterDate);
  const interval = scheduleInterval(task);
  const unit = scheduleUnit(task);

  if (afterDate < anchor && unit !== "week") return anchor;

  if (unit === "day") {
    const distance = utcDayNumber(afterDate) - utcDayNumber(anchor);
    const periods = Math.floor(distance / interval) + 1;
    return fromUtcDayNumber(utcDayNumber(anchor) + periods * interval);
  }

  if (unit === "week") {
    const maximumSearch = interval * 7 + 7;
    const start = Math.max(utcDayNumber(afterDate), utcDayNumber(anchor) - 1);
    for (let offset = 1; offset <= maximumSearch; offset += 1) {
      const candidate = fromUtcDayNumber(start + offset);
      if (taskOccursOn(task, candidate)) return candidate;
    }
    return null;
  }

  const [anchorYear, anchorMonth, anchorDay] = dateParts(anchor);
  const [afterYear, afterMonth] = dateParts(afterDate);

  if (unit === "month") {
    const distance = (afterYear - anchorYear) * 12 + (afterMonth - anchorMonth);
    let periods = Math.max(0, Math.floor(distance / interval));
    while (true) {
      const monthIndex = anchorMonth - 1 + periods * interval;
      const year = anchorYear + Math.floor(monthIndex / 12);
      const month = ((monthIndex % 12) + 12) % 12 + 1;
      const day = Math.min(anchorDay, new Date(year, month, 0).getDate());
      const candidate = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      if (candidate > afterDate) return candidate;
      periods += 1;
    }
  }

  let periods = Math.max(0, Math.floor((afterYear - anchorYear) / interval));
  while (true) {
    const year = anchorYear + periods * interval;
    const day = Math.min(anchorDay, new Date(year, anchorMonth, 0).getDate());
    const candidate = `${year}-${String(anchorMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    if (candidate > afterDate) return candidate;
    periods += 1;
  }
}

export function reactivateRecurringTaskIfDue<T extends CompletableRecurringTask>(
  task: T,
  date: string,
): T {
  if (!task.recurring || !task.done || !task.completed) return task;
  const completedDate = task.completed.slice(0, 10);
  const nextOccurrence = nextTaskOccurrence(task, completedDate);
  if (!nextOccurrence || nextOccurrence > date) return task;
  return { ...task, done: false, completed: undefined };
}

export function nextDueAfterCompletion(
  task: CompletableRecurringTask,
): string | null {
  if (!task.recurring || !task.done || !task.completed) return null;
  return nextTaskOccurrence(task, task.completed.slice(0, 10));
}
