import {
  addMonths,
  addQuarters,
  addWeeks,
  differenceInCalendarDays,
  endOfMonth,
  endOfQuarter,
  isWithinInterval,
  parseISO,
  startOfMonth,
  startOfQuarter,
} from "date-fns";
import { parseDateOnly, toDateString, weekBounds } from "@/lib/dates";
import type { Task } from "@/types";

export interface SlippedTask {
  task: Task;
  daysLate: number;
}

export type ReviewPeriod = "week" | "month" | "quarter";

export interface PeriodReview {
  /** First and last day (yyyy-MM-dd) of the week, month or quarter being reviewed. */
  periodStart: string;
  periodEnd: string;
  /** The period right after it. */
  nextStart: string;
  nextEnd: string;
  completed: Task[];
  slipped: SlippedTask[];
  upcoming: Task[];
  minutesCompleted: number;
}

function bounds(now: Date, period: ReviewPeriod): { start: Date; end: Date } {
  if (period === "month") return { start: startOfMonth(now), end: endOfMonth(now) };
  if (period === "quarter") return { start: startOfQuarter(now), end: endOfQuarter(now) };
  return weekBounds(now);
}

function shift(now: Date, period: ReviewPeriod): Date {
  if (period === "month") return addMonths(now, 1);
  if (period === "quarter") return addQuarters(now, 1);
  return addWeeks(now, 1);
}

/**
 * Top-level tasks only (subtasks roll up into their parent).
 * - completed: done with completed_at inside this period/month/quarter, newest first
 * - slipped: still open and past their deadline, most late first
 * - upcoming: still open with a deadline inside the next period, soonest first
 */
export function buildReview(tasks: readonly Task[], now: Date, period: ReviewPeriod = "week"): PeriodReview {
  const today = toDateString(now);
  const current = bounds(now, period);
  const next = bounds(shift(now, period), period);
  const nextStart = toDateString(next.start);
  const nextEnd = toDateString(next.end);

  const top = tasks.filter((t) => !t.parent_task_id);

  const completed = top
    .filter((t) => t.status === "done" && t.completed_at && isWithinInterval(parseISO(t.completed_at), current))
    .sort((a, b) => (b.completed_at ?? "").localeCompare(a.completed_at ?? ""));

  const slipped = top
    .filter((t) => t.status !== "done" && t.deadline !== null && t.deadline < today)
    .map((task) => ({
      task,
      daysLate: differenceInCalendarDays(parseDateOnly(today), parseDateOnly(task.deadline ?? today)),
    }))
    .sort((a, b) => b.daysLate - a.daysLate);

  const upcoming = top
    .filter((t) => t.status !== "done" && t.deadline !== null && t.deadline >= nextStart && t.deadline <= nextEnd)
    .sort((a, b) => (a.deadline ?? "").localeCompare(b.deadline ?? "") || a.position - b.position);

  return {
    periodStart: toDateString(current.start),
    periodEnd: toDateString(current.end),
    nextStart,
    nextEnd,
    completed,
    slipped,
    upcoming,
    minutesCompleted: completed.reduce((sum, t) => sum + (t.estimate_minutes ?? 0), 0),
  };
}
