import { isWithinInterval, parseISO } from "date-fns";
import { parseDateOnly, toDateString, weekBounds } from "@/lib/dates";
import type { Task } from "@/types";

export interface BoardStats {
  inProgress: number;
  dueThisWeek: number;
  overdue: number;
  completedThisWeek: number;
}

export function isOverdue(task: Pick<Task, "deadline" | "status">, today: string): boolean {
  return task.status !== "done" && task.deadline !== null && task.deadline < today;
}

/** Stats over top-level tasks only; subtasks roll up into their parent's progress. */
export function computeStats(tasks: readonly Task[], now: Date): BoardStats {
  const today = toDateString(now);
  const { start, end } = weekBounds(now);
  const stats: BoardStats = { inProgress: 0, dueThisWeek: 0, overdue: 0, completedThisWeek: 0 };

  for (const task of tasks) {
    if (task.parent_task_id) continue;
    if (task.status === "doing") stats.inProgress += 1;
    if (isOverdue(task, today)) stats.overdue += 1;
    if (task.status !== "done" && task.deadline && task.deadline >= today) {
      if (isWithinInterval(parseDateOnly(task.deadline), { start, end })) stats.dueThisWeek += 1;
    }
    if (task.status === "done" && task.completed_at) {
      if (isWithinInterval(parseISO(task.completed_at), { start, end })) stats.completedThisWeek += 1;
    }
  }
  return stats;
}

export interface SubtaskProgress {
  done: number;
  total: number;
}

export function subtaskProgress(tasks: readonly Task[]): Map<string, SubtaskProgress> {
  const map = new Map<string, SubtaskProgress>();
  for (const task of tasks) {
    if (!task.parent_task_id) continue;
    const entry = map.get(task.parent_task_id) ?? { done: 0, total: 0 };
    entry.total += 1;
    if (task.status === "done") entry.done += 1;
    map.set(task.parent_task_id, entry);
  }
  return map;
}
