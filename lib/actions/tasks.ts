"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { fail, type ActionResult } from "@/lib/actions/result";
import {
  createTaskSchema,
  deleteTaskSchema,
  moveTaskSchema,
  setStatusSchema,
  updateTaskSchema,
  type CreateTaskInput,
  type MoveTaskInput,
  type TaskFields,
} from "@/lib/validators/task";
import { subtaskTitleSchema } from "@/lib/validators/tag";
import type { Task, TaskStatus } from "@/types";

function revalidateTaskViews(): void {
  for (const path of ["/", "/deadlines", "/projects", "/review"]) revalidatePath(path);
  revalidatePath("/projects/[id]", "page");
}

export async function createTask(input: CreateTaskInput): Promise<ActionResult<Task>> {
  const parsed = createTaskSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid task");

  const db = createClient();
  // Append to the bottom of the target column.
  const { data: last } = await db
    .from("tasks")
    .select("position")
    .eq("status", parsed.data.status)
    .is("parent_task_id", null)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await db
    .from("tasks")
    .insert({ ...parsed.data, position: (last?.position ?? 0) + 1 })
    .select()
    .single();
  if (error) return fail(error.message);

  revalidateTaskViews();
  return { ok: true, data };
}

export async function updateTask(id: string, fields: TaskFields): Promise<ActionResult<Task>> {
  const parsed = updateTaskSchema.safeParse({ id, fields });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid task");

  const { data, error } = await createClient().from("tasks").update(parsed.data.fields).eq("id", id).select().single();
  if (error) return fail(error.message);

  revalidateTaskViews();
  return { ok: true, data };
}

/** Persists a drag-and-drop result. completed_at is handled by the database trigger. */
export async function moveTask(input: MoveTaskInput): Promise<ActionResult> {
  const parsed = moveTaskSchema.safeParse(input);
  if (!parsed.success) return fail("Invalid move");

  const { error } = await createClient()
    .from("tasks")
    .update({ status: parsed.data.status, position: parsed.data.position })
    .eq("id", parsed.data.id);
  if (error) return fail(error.message);

  revalidateTaskViews();
  return { ok: true, data: null };
}

/** Adds a subtask under a top-level task; it inherits the parent project and milestone. */
export async function createSubtask(parentId: string, title: string): Promise<ActionResult<Task>> {
  const parsedTitle = subtaskTitleSchema.safeParse(title);
  if (!parsedTitle.success) return fail(parsedTitle.error.issues[0]?.message ?? "Invalid title");

  const db = createClient();
  const { data: parent, error: parentError } = await db
    .from("tasks")
    .select("id, project_id, milestone_id, parent_task_id, priority")
    .eq("id", parentId)
    .maybeSingle();
  if (parentError) return fail(parentError.message);
  if (!parent) return fail("Parent task not found");
  if (parent.parent_task_id) return fail("A subtask cannot have its own subtasks");

  const { data: last } = await db
    .from("tasks")
    .select("position")
    .eq("parent_task_id", parentId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await db
    .from("tasks")
    .insert({
      title: parsedTitle.data,
      parent_task_id: parent.id,
      project_id: parent.project_id,
      milestone_id: parent.milestone_id,
      priority: parent.priority,
      status: "todo",
      position: (last?.position ?? 0) + 1,
    })
    .select()
    .single();
  if (error) return fail(error.message);

  revalidateTaskViews();
  return { ok: true, data };
}

/** Changes only the status (e.g. a checkbox toggle); completed_at is handled by the database trigger. */
export async function setTaskStatus(id: string, status: TaskStatus): Promise<ActionResult> {
  const parsed = setStatusSchema.safeParse({ id, status });
  if (!parsed.success) return fail("Invalid status change");

  const { error } = await createClient().from("tasks").update({ status: parsed.data.status }).eq("id", id);
  if (error) return fail(error.message);

  revalidateTaskViews();
  return { ok: true, data: null };
}

export async function deleteTask(id: string): Promise<ActionResult> {
  const parsed = deleteTaskSchema.safeParse({ id });
  if (!parsed.success) return fail("Invalid task");

  const { error } = await createClient().from("tasks").delete().eq("id", id);
  if (error) return fail(error.message);

  revalidateTaskViews();
  return { ok: true, data: null };
}
