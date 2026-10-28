import "server-only";
import { createClient } from "@/lib/supabase/server";
import { countByStatus, emptyCounts, type StatusCounts } from "@/lib/tasks/progress";
import type { Milestone, Project, Task } from "@/types";

export type ProjectOption = Pick<Project, "id" | "name" | "color">;
export type MilestoneOption = Pick<Milestone, "id" | "project_id" | "name">;

export interface ProjectSummary extends Project {
  counts: StatusCounts;
}

/** Active (non-archived) projects for pickers and chips. */
export async function listProjectOptions(): Promise<ProjectOption[]> {
  const { data, error } = await createClient()
    .from("projects")
    .select("id, name, color")
    .is("archived_at", null)
    .order("name", { ascending: true });
  if (error) throw new Error(`Could not load projects: ${error.message}`);
  return data;
}

export async function listMilestoneOptions(): Promise<MilestoneOption[]> {
  const { data, error } = await createClient()
    .from("milestones")
    .select("id, project_id, name")
    .order("position", { ascending: true });
  if (error) throw new Error(`Could not load milestones: ${error.message}`);
  return data;
}

/** Projects with per-status counts of top-level tasks (subtasks roll up into their parent). */
export async function listProjectSummaries(archived: boolean): Promise<ProjectSummary[]> {
  const db = createClient();
  const projectQuery = db.from("projects").select("*").order("created_at", { ascending: false });
  const [projects, tasks] = await Promise.all([
    archived ? projectQuery.not("archived_at", "is", null) : projectQuery.is("archived_at", null),
    db.from("tasks").select("project_id, status").is("parent_task_id", null).not("project_id", "is", null),
  ]);
  if (projects.error) throw new Error(`Could not load projects: ${projects.error.message}`);
  if (tasks.error) throw new Error(`Could not load tasks: ${tasks.error.message}`);

  const byProject = new Map<string, Pick<Task, "status">[]>();
  for (const t of tasks.data) {
    if (!t.project_id) continue;
    byProject.set(t.project_id, [...(byProject.get(t.project_id) ?? []), { status: t.status }]);
  }
  return projects.data.map((p) => ({
    ...p,
    counts: byProject.has(p.id) ? countByStatus(byProject.get(p.id) ?? []) : emptyCounts(),
  }));
}

export interface ProjectDetail {
  project: Project;
  milestones: Milestone[];
  /** Top-level tasks and subtasks of this project. */
  tasks: Task[];
}

export async function getProjectDetail(id: string): Promise<ProjectDetail | null> {
  const db = createClient();
  const [project, milestones, tasks] = await Promise.all([
    db.from("projects").select("*").eq("id", id).maybeSingle(),
    db.from("milestones").select("*").eq("project_id", id).order("position", { ascending: true }),
    db.from("tasks").select("*").eq("project_id", id).order("position", { ascending: true }),
  ]);
  if (project.error) {
    // An invalid uuid string is a "not found", not a server error.
    if (project.error.code === "22P02") return null;
    throw new Error(`Could not load project: ${project.error.message}`);
  }
  if (milestones.error) throw new Error(`Could not load milestones: ${milestones.error.message}`);
  if (tasks.error) throw new Error(`Could not load tasks: ${tasks.error.message}`);
  if (!project.data) return null;
  return { project: project.data, milestones: milestones.data, tasks: tasks.data };
}
