import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Task } from "@/types";

/** All tasks including subtasks, ordered for the board. */
export async function listTasks(): Promise<Task[]> {
  const { data, error } = await createClient().from("tasks").select("*").order("position", { ascending: true });
  if (error) throw new Error(`Could not load tasks: ${error.message}`);
  return data;
}
