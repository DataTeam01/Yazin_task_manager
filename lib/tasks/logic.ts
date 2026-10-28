import type { TaskStatus } from "@/types";

/**
 * Mirrors the database trigger so optimistic updates match what the server will store:
 * set when a task becomes done, kept while it stays done, cleared otherwise.
 */
export function nextCompletedAt(
  prevStatus: TaskStatus,
  prevCompletedAt: string | null,
  nextStatus: TaskStatus,
  now: Date = new Date(),
): string | null {
  if (nextStatus !== "done") return null;
  if (prevStatus === "done" && prevCompletedAt) return prevCompletedAt;
  return now.toISOString();
}

/** Fractional position for an item dropped between two neighbours (either may be absent). */
export function positionBetween(prev: number | undefined, next: number | undefined): number {
  if (prev !== undefined && next !== undefined) return (prev + next) / 2;
  if (prev !== undefined) return prev + 1;
  if (next !== undefined) return next - 1;
  return 1;
}
