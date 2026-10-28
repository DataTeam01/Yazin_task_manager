import { addDays, differenceInCalendarDays, format, getDay } from "date-fns";
import { parseDateOnly, toDateString } from "@/lib/dates";
import type { Project, Task } from "@/types";

export interface TimelineRow {
  task: Task;
  /** Percentages of the full range. */
  left: number;
  width: number;
}

export interface TimelineTick {
  label: string;
  left: number;
}

export interface Timeline {
  start: string;
  end: string;
  days: number;
  rows: TimelineRow[];
  /** Null when today is outside the range. */
  todayLeft: number | null;
  ticks: TimelineTick[];
  /** Top-level tasks with neither a start date nor a deadline. */
  undated: number;
}

const MIN_TICK_GAP = 8;

function span(task: Pick<Task, "start_date" | "deadline">): [string, string] | null {
  const a = task.start_date ?? task.deadline;
  const b = task.deadline ?? task.start_date;
  if (!a || !b) return null;
  return a <= b ? [a, b] : [b, a];
}

/**
 * Gantt-style layout for a project's top-level tasks. A task spans start_date → deadline;
 * with only one of them it occupies that single day. Ranges are inclusive of both ends.
 */
export function buildTimeline(
  tasks: readonly Task[],
  project: Pick<Project, "start_date" | "deadline">,
  today: string,
): Timeline | null {
  const top = tasks.filter((t) => !t.parent_task_id);
  const dated = top.flatMap((task) => {
    const range = span(task);
    return range ? [{ task, range }] : [];
  });
  if (dated.length === 0) return null;

  const dates = dated.flatMap((d) => d.range);
  if (project.start_date) dates.push(project.start_date);
  if (project.deadline) dates.push(project.deadline);
  dates.sort();

  const start = dates[0] ?? today;
  const end = dates[dates.length - 1] ?? today;
  const startDate = parseDateOnly(start);
  const days = differenceInCalendarDays(parseDateOnly(end), startDate) + 1;
  const pct = (offsetDays: number): number => (offsetDays / days) * 100;

  const rows = dated
    .map(({ task, range: [from, to] }) => ({
      task,
      from,
      to,
      left: pct(differenceInCalendarDays(parseDateOnly(from), startDate)),
      width: pct(differenceInCalendarDays(parseDateOnly(to), parseDateOnly(from)) + 1),
    }))
    .sort((a, b) => a.from.localeCompare(b.from) || a.to.localeCompare(b.to) || a.task.position - b.task.position)
    .map(({ task, left, width }) => ({ task, left, width }));

  // Weekly ticks (Mondays) for short ranges, month starts for long ones.
  const ticks: TimelineTick[] = [{ label: format(startDate, "d MMM"), left: 0 }];
  for (let i = 1; i < days; i += 1) {
    const day = addDays(startDate, i);
    const weekly = days <= 60;
    if (weekly ? getDay(day) === 1 : day.getDate() === 1) {
      ticks.push({ label: format(day, weekly ? "d MMM" : "MMM"), left: pct(i) });
    }
  }

  // Keep labels legible: drop the start label when the next tick is right behind it, and any tick too close to the right edge.
  const spaced = ticks.filter((tick, i) => {
    if (i === 0) return (ticks[1]?.left ?? 100) >= MIN_TICK_GAP;
    return tick.left <= 100 - MIN_TICK_GAP;
  });

  const todayOffset = differenceInCalendarDays(parseDateOnly(today), startDate);
  const todayLeft = todayOffset >= 0 && todayOffset < days ? pct(todayOffset + 0.5) : null;

  return {
    start,
    end: toDateString(addDays(startDate, days - 1)),
    days,
    rows,
    todayLeft,
    ticks: spaced,
    undated: top.length - dated.length,
  };
}
