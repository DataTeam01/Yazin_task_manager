import { addWeeks, differenceInCalendarDays, isWithinInterval, parseISO } from "date-fns";
import { parseDateOnly, toDateString, weekBounds } from "@/lib/dates";
import type { Task } from "@/types";

export interface SlippedTask {
  task: Task;
  daysLate: number;
}

export interface WeeklyReview {
  /** Monday and Sunday (yyyy-MM-dd) of the week being reviewed. */
  weekStart: string;
  weekEnd: string;
  /** The calendar week after it. */
  nextStart: string;
  nextEnd: string;
  completed: Task[];
  slipped: SlippedTask[];
  upcoming: Task[];
  minutesCompleted: number;
}

/**
 * Top-level tasks only (subtasks roll up into their parent).
 * - completed: done with completed_at inside this calendar week, newest first
 * - slipped: still open and past their deadline, most late first
 * - upcoming: still open with a deadline inside next calendar week, soonest first
 */
export function buildReview(tasks: readonly Task[], now: Date): WeeklyReview {
  const today = toDateString(now);
  const week = weekBounds(now);
  const next = weekBounds(addWeeks(now, 1));
  const nextStart = toDateString(next.start);
  const nextEnd = toDateString(next.end);

  const top = tasks.filter((t) => !t.parent_task_id);

  const completed = top
    .filter((t) => t.status === "done" && t.completed_at && isWithinInterval(parseISO(t.completed_at), week))
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
    weekStart: toDateString(week.start),
    weekEnd: toDateString(week.end),
    nextStart,
    nextEnd,
    completed,
    slipped,
    upcoming,
    minutesCompleted: completed.reduce((sum, t) => sum + (t.estimate_minutes ?? 0), 0),
  };
}
