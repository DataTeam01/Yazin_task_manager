import type { Task, TaskPriority } from "@/types";

export const ALL = "all";
export const NONE = "none";

export interface TaskFilters {
  /** A project id, `ALL`, or `NONE` (tasks without a project). */
  project: string;
  priority: typeof ALL | TaskPriority;
  /** A tag id or `ALL`. */
  tag: string;
  query: string;
}

export const EMPTY_FILTERS: TaskFilters = { project: ALL, priority: ALL, tag: ALL, query: "" };

export function hasActiveFilters(filters: TaskFilters): boolean {
  return (
    filters.project !== ALL || filters.priority !== ALL || filters.tag !== ALL || filters.query.trim() !== ""
  );
}

type Filterable = Pick<Task, "title" | "description" | "project_id" | "priority">;

export function matchesFilters(task: Filterable, filters: TaskFilters, taskTagIds: ReadonlySet<string> | undefined): boolean {
  if (filters.project === NONE ? task.project_id !== null : filters.project !== ALL && task.project_id !== filters.project) {
    return false;
  }
  if (filters.priority !== ALL && task.priority !== filters.priority) return false;
  if (filters.tag !== ALL && !taskTagIds?.has(filters.tag)) return false;

  const query = filters.query.trim().toLowerCase();
  if (query) {
    const haystack = `${task.title} ${task.description ?? ""}`.toLowerCase();
    if (!haystack.includes(query)) return false;
  }
  return true;
}
