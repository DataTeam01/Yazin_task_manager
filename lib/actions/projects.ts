"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  idSchema,
  milestoneFieldsSchema,
  projectFieldsSchema,
  type MilestoneFields,
  type ProjectFields,
} from "@/lib/validators/project";
import type { Milestone, Project } from "@/types";
import { fail, type ActionResult } from "./result";

function revalidateProjectViews(): void {
  for (const path of ["/", "/projects", "/deadlines", "/review"]) revalidatePath(path);
  revalidatePath("/projects/[id]", "page");
}

export async function createProject(fields: ProjectFields): Promise<ActionResult<Project>> {
  const parsed = projectFieldsSchema.safeParse(fields);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid project");

  const { data, error } = await createClient().from("projects").insert(parsed.data).select().single();
  if (error) return fail(error.message);
  revalidateProjectViews();
  return { ok: true, data };
}

export async function updateProject(id: string, fields: ProjectFields): Promise<ActionResult<Project>> {
  const parsed = projectFieldsSchema.safeParse(fields);
  if (!idSchema.safeParse(id).success || !parsed.success) {
    return fail(parsed.success ? "Invalid project" : (parsed.error.issues[0]?.message ?? "Invalid project"));
  }

  const { data, error } = await createClient().from("projects").update(parsed.data).eq("id", id).select().single();
  if (error) return fail(error.message);
  revalidateProjectViews();
  return { ok: true, data };
}

export async function setProjectArchived(id: string, archived: boolean): Promise<ActionResult> {
  if (!idSchema.safeParse(id).success) return fail("Invalid project");
  const { error } = await createClient()
    .from("projects")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) return fail(error.message);
  revalidateProjectViews();
  return { ok: true, data: null };
}

/** Deletes the project, its milestones and all of its tasks (database cascade). */
export async function deleteProject(id: string): Promise<ActionResult> {
  if (!idSchema.safeParse(id).success) return fail("Invalid project");
  const { error } = await createClient().from("projects").delete().eq("id", id);
  if (error) return fail(error.message);
  revalidateProjectViews();
  return { ok: true, data: null };
}

export async function createMilestone(projectId: string, fields: MilestoneFields): Promise<ActionResult<Milestone>> {
  const parsed = milestoneFieldsSchema.safeParse(fields);
  if (!idSchema.safeParse(projectId).success || !parsed.success) {
    return fail(parsed.success ? "Invalid milestone" : (parsed.error.issues[0]?.message ?? "Invalid milestone"));
  }

  const db = createClient();
  const { data: last } = await db
    .from("milestones")
    .select("position")
    .eq("project_id", projectId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await db
    .from("milestones")
    .insert({ ...parsed.data, project_id: projectId, position: (last?.position ?? -1) + 1 })
    .select()
    .single();
  if (error) return fail(error.message);
  revalidateProjectViews();
  return { ok: true, data };
}

export async function updateMilestone(id: string, fields: MilestoneFields): Promise<ActionResult<Milestone>> {
  const parsed = milestoneFieldsSchema.safeParse(fields);
  if (!idSchema.safeParse(id).success || !parsed.success) {
    return fail(parsed.success ? "Invalid milestone" : (parsed.error.issues[0]?.message ?? "Invalid milestone"));
  }
  const { data, error } = await createClient().from("milestones").update(parsed.data).eq("id", id).select().single();
  if (error) return fail(error.message);
  revalidateProjectViews();
  return { ok: true, data };
}

/** Deletes the milestone; its tasks stay in the project with no milestone. */
export async function deleteMilestone(id: string): Promise<ActionResult> {
  if (!idSchema.safeParse(id).success) return fail("Invalid milestone");
  const { error } = await createClient().from("milestones").delete().eq("id", id);
  if (error) return fail(error.message);
  revalidateProjectViews();
  return { ok: true, data: null };
}
