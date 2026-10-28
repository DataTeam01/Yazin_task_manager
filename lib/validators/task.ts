import { z } from "zod";

const dateOnly = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid date")
  .nullable();

export const taskStatusSchema = z.enum(["todo", "doing", "done"]);
export const taskPrioritySchema = z.enum(["low", "medium", "high"]);

export const taskFieldsSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.string().trim().max(5000).nullable(),
  status: taskStatusSchema,
  priority: taskPrioritySchema,
  project_id: z.string().uuid().nullable(),
  milestone_id: z.string().uuid().nullable(),
  start_date: dateOnly,
  deadline: dateOnly,
  estimate_minutes: z.number().int().min(0).max(100_000).nullable(),
});
export type TaskFields = z.infer<typeof taskFieldsSchema>;

export const createTaskSchema = taskFieldsSchema.partial({
  description: true,
  priority: true,
  project_id: true,
  milestone_id: true,
  start_date: true,
  deadline: true,
  estimate_minutes: true,
});
export type CreateTaskInput = z.input<typeof createTaskSchema>;

export const updateTaskSchema = z.object({ id: z.string().uuid(), fields: taskFieldsSchema });

export const moveTaskSchema = z.object({
  id: z.string().uuid(),
  status: taskStatusSchema,
  position: z.number().finite(),
});
export type MoveTaskInput = z.infer<typeof moveTaskSchema>;

export const setStatusSchema = z.object({ id: z.string().uuid(), status: taskStatusSchema });

export const deleteTaskSchema = z.object({ id: z.string().uuid() });
