import { addDays } from "date-fns";
import { parseDateOnly, toDateString } from "@/lib/dates";
import type { Task, TaskPriority } from "@/types";

export type DeadlineBucket = "overdue" | "today" | "next7" | "later" | "none";

export const BUCKET_ORDER: readonly DeadlineBucket[] = ["overdue", "today", "next7", "later", "none"];

export const BUCKET_LABELS: Record<DeadlineBucket, string> = {
  overdue: "Overdue",
  today: "Today",
  next7: "Next 7 days",
  later: "Later",
  none: "No deadline",
};

type Sortable = Pick<Task, "deadline" | "status" | "priority" | "position">;

const PRIORITY_RANK: Record<TaskPriority, number> = { high: 0, medium: 1, low: 2 };

/** Overdue is before today; Next 7 days covers tomorrow through today + 7 inclusive. */
export function bucketFor(deadline: string | null, today: string): DeadlineBucket {
  if (!deadline) return "none";
  if (deadline < today) return "overdue";
  if (deadline === today) return "today";
  const weekEnd = toDateString(addDays(parseDateOnly(today), 7));
  return deadline <= weekEnd ? "next7" : "later";
}

function compare(a: Sortable, b: Sortable): number {
  if (a.deadline !== b.deadline) {
    if (a.deadline === null) return 1;
    if (b.deadline === null) return -1;
    return a.deadline < b.deadline ? -1 : 1;
  }
  return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || a.position - b.position;
}

/** Groups open (not done) tasks into deadline buckets, each sorted by date, then priority. */
export function groupByDeadline<T extends Sortable>(tasks: readonly T[], today: string): Record<DeadlineBucket, T[]> {
  const groups: Record<DeadlineBucket, T[]> = { overdue: [], today: [], next7: [], later: [], none: [] };
  for (const task of tasks) {
    if (task.status === "done") continue;
    groups[bucketFor(task.deadline, today)].push(task);
  }
  for (const bucket of BUCKET_ORDER) groups[bucket].sort(compare);
  return groups;
}

/** Tasks (any status) keyed by their deadline date, for the calendar. */
export function tasksByDeadline<T extends Pick<Task, "deadline">>(tasks: readonly T[]): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const task of tasks) {
    if (!task.deadline) continue;
    const list = map.get(task.deadline);
    if (list) list.push(task);
    else map.set(task.deadline, [task]);
  }
  return map;
}
