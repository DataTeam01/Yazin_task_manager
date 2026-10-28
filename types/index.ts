import type { Tables, Enums } from "./database";

export type Project = Tables<"projects">;
export type Milestone = Tables<"milestones">;
export type Task = Tables<"tasks">;
export type Tag = Tables<"tags">;

export type ProjectStatus = Enums<"project_status">;
export type TaskStatus = Enums<"task_status">;
export type TaskPriority = Enums<"task_priority">;

export const TASK_STATUSES: readonly TaskStatus[] = ["todo", "doing", "done"];
export const TASK_PRIORITIES: readonly TaskPriority[] = ["low", "medium", "high"];
export const PROJECT_STATUSES: readonly ProjectStatus[] = ["active", "on_hold", "completed"];
