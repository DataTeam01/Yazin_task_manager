import "server-only";
import { listMilestoneOptions, listProjectOptions, type MilestoneOption, type ProjectOption } from "./projects";
import { listTags, listTaskTags, type TaskTagLink } from "./tags";
import type { Tag } from "@/types";

/** Everything the task dialog and task cards need besides the tasks themselves. */
export interface TaskDialogData {
  projects: ProjectOption[];
  milestones: MilestoneOption[];
  tags: Tag[];
  taskTags: TaskTagLink[];
}

export async function getTaskDialogData(): Promise<TaskDialogData> {
  const [projects, milestones, tags, taskTags] = await Promise.all([
    listProjectOptions(),
    listMilestoneOptions(),
    listTags(),
    listTaskTags(),
  ]);
  return { projects, milestones, tags, taskTags };
}
