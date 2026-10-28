import type { Task, TaskStatus } from "@/types";

export interface StatusCounts {
  todo: number;
  doing: number;
  done: number;
  total: number;
}

export function emptyCounts(): StatusCounts {
  return { todo: 0, doing: 0, done: 0, total: 0 };
}

export function countByStatus(tasks: readonly Pick<Task, "status">[]): StatusCounts {
  const counts = emptyCounts();
  for (const task of tasks) {
    counts[task.status satisfies TaskStatus] += 1;
    counts.total += 1;
  }
  return counts;
}

/** Whole-number percentage of done tasks; 0 when there are no tasks. */
export function progressPercent(done: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((Math.min(done, total) / total) * 100);
}
