"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { tagNameSchema, taskTagsSchema } from "@/lib/validators/tag";
import type { Tag } from "@/types";
import { fail, type ActionResult } from "./result";

const TAG_COLORS = ["#c8502d", "#2f6f8f", "#6b8f3a", "#8a6bb0", "#b08a2f", "#c2557a", "#3f8f7f", "#5b6b7a"];

function revalidateTagViews(): void {
  for (const path of ["/", "/deadlines", "/review"]) revalidatePath(path);
  revalidatePath("/projects/[id]", "page");
}

/** Creates a tag, or returns the existing one with the same (lower-cased) name. */
export async function createTag(name: string): Promise<ActionResult<Tag>> {
  const parsed = tagNameSchema.safeParse(name);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid tag");

  const db = createClient();
  const existing = await db.from("tags").select("*").eq("name", parsed.data).maybeSingle();
  if (existing.data) return { ok: true, data: existing.data };

  const { count } = await db.from("tags").select("id", { count: "exact", head: true });
  const color = TAG_COLORS[(count ?? 0) % TAG_COLORS.length] ?? "#78716c";
  const { data, error } = await db.from("tags").insert({ name: parsed.data, color }).select().single();
  if (error) return fail(error.message);

  revalidateTagViews();
  return { ok: true, data };
}

/** Replaces a task's tags, writing only the difference. */
export async function setTaskTags(taskId: string, tagIds: string[]): Promise<ActionResult> {
  const parsed = taskTagsSchema.safeParse({ taskId, tagIds });
  if (!parsed.success) return fail("Invalid tags");

  const db = createClient();
  const current = await db.from("task_tags").select("tag_id").eq("task_id", taskId);
  if (current.error) return fail(current.error.message);

  const have = new Set(current.data.map((r) => r.tag_id));
  const want = new Set(parsed.data.tagIds);
  const remove = [...have].filter((id) => !want.has(id));
  const add = [...want].filter((id) => !have.has(id));

  if (remove.length > 0) {
    const { error } = await db.from("task_tags").delete().eq("task_id", taskId).in("tag_id", remove);
    if (error) return fail(error.message);
  }
  if (add.length > 0) {
    const { error } = await db.from("task_tags").insert(add.map((tag_id) => ({ task_id: taskId, tag_id })));
    if (error) return fail(error.message);
  }

  revalidateTagViews();
  return { ok: true, data: null };
}
