import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Tag } from "@/types";

export interface TaskTagLink {
  task_id: string;
  tag_id: string;
}

export async function listTags(): Promise<Tag[]> {
  const { data, error } = await createClient().from("tags").select("*").order("name", { ascending: true });
  if (error) throw new Error(`Could not load tags: ${error.message}`);
  return data;
}

export async function listTaskTags(): Promise<TaskTagLink[]> {
  const { data, error } = await createClient().from("task_tags").select("task_id, tag_id");
  if (error) throw new Error(`Could not load task tags: ${error.message}`);
  return data;
}
