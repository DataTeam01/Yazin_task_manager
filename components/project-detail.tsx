"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Archive, ArchiveRestore, CalendarDays, Check, ChevronLeft, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { MilestoneDialog } from "@/components/milestone-dialog";
import { PageHeader } from "@/components/page-header";
import { ProgressBar } from "@/components/progress-bar";
import { ProjectDialog } from "@/components/project-dialog";
import { StatusBadge } from "@/components/status-badge";
import { TaskDialog } from "@/components/task-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { deleteProject, setProjectArchived } from "@/lib/actions/projects";
import { setTaskStatus } from "@/lib/actions/tasks";
import { parseDateOnly, toDateString } from "@/lib/dates";
import { ProjectTimeline } from "@/components/project-timeline";
import type { TaskDialogData } from "@/lib/queries/task-dialog";
import { countByStatus, progressPercent } from "@/lib/tasks/progress";
import { isOverdue, subtaskProgress } from "@/lib/tasks/stats";
import { cn } from "@/lib/utils";
import type { Milestone, Project, Task, TaskStatus } from "@/types";

interface ProjectDetailProps {
  project: Project;
  milestones: Milestone[];
  tasks: Task[];
  data: TaskDialogData;
  initialToday: string;
}

const PRIORITY_DOT: Record<Task["priority"], string> = {
  high: "bg-destructive",
  medium: "bg-amber-500",
  low: "bg-muted-foreground/50",
};

export function ProjectDetail({ project, milestones, tasks, data, initialToday }: ProjectDetailProps) {
  const router = useRouter();
  const [local, setLocal] = useState(tasks);
  const [today, setToday] = useState(initialToday);
  const [taskDialog, setTaskDialog] = useState<{ open: boolean; task: Task | null; milestoneId: string | null }>({
    open: false,
    task: null,
    milestoneId: null,
  });
  const [milestoneDialog, setMilestoneDialog] = useState<{ open: boolean; milestone: Milestone | null }>({
    open: false,
    milestone: null,
  });
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => setToday(toDateString(new Date())), []);
  useEffect(() => setLocal(tasks), [tasks]);

  const topLevel = useMemo(() => local.filter((t) => !t.parent_task_id), [local]);
  const subs = useMemo(() => subtaskProgress(local), [local]);
  const overall = useMemo(() => countByStatus(topLevel), [topLevel]);
  const archived = project.archived_at !== null;

  const groups = useMemo(() => {
    const byMilestone = new Map<string | null, Task[]>();
    for (const task of topLevel) {
      byMilestone.set(task.milestone_id, [...(byMilestone.get(task.milestone_id) ?? []), task]);
    }
    return byMilestone;
  }, [topLevel]);

  /** Optimistic checkbox toggle with rollback. */
  async function toggle(task: Task): Promise<void> {
    const next: TaskStatus = task.status === "done" ? "todo" : "done";
    const previous = local;
    setLocal((prev) =>
      prev.map((t) =>
        t.id === task.id ? { ...t, status: next, completed_at: next === "done" ? new Date().toISOString() : null } : t,
      ),
    );
    const result = await setTaskStatus(task.id, next);
    if (!result.ok) {
      setLocal(previous);
      toast.error(`Couldn't update task: ${result.error}`);
    }
  }

  function toggleArchive(): void {
    startTransition(async () => {
      const result = await setProjectArchived(project.id, !archived);
      if (!result.ok) toast.error(result.error);
      else toast.success(archived ? "Project restored" : "Project archived");
    });
  }

  function remove(): void {
    startTransition(async () => {
      const result = await deleteProject(project.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Project deleted");
      router.push("/projects");
    });
  }

  const renderTasks = (list: Task[]) => (
    <ul className="divide-y">
      {list.map((task) => {
        const progress = subs.get(task.id);
        const done = task.status === "done";
        return (
          <li key={task.id} className="flex items-center gap-3 py-2.5">
            <button
              type="button"
              role="checkbox"
              aria-checked={done}
              aria-label={`Mark "${task.title}" as ${done ? "not done" : "done"}`}
              onClick={() => void toggle(task)}
              className={cn(
                "flex h-5 w-5 shrink-0 items-center justify-center rounded border",
                done ? "border-primary bg-primary text-primary-foreground" : "border-input hover:border-primary",
              )}
            >
              {done ? <Check className="h-3.5 w-3.5" aria-hidden /> : null}
            </button>
            <span className={cn("h-2 w-2 shrink-0 rounded-full", PRIORITY_DOT[task.priority])} role="img" aria-label={`${task.priority} priority`} />
            <button
              type="button"
              onClick={() => setTaskDialog({ open: true, task, milestoneId: task.milestone_id })}
              className={cn("min-w-0 flex-1 truncate rounded text-left text-sm", done && "text-muted-foreground line-through")}
            >
              {task.title}
            </button>
            {task.status === "doing" ? <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">Doing</span> : null}
            {progress ? (
              <span className="text-xs text-muted-foreground">
                {progress.done}/{progress.total}
              </span>
            ) : null}
            {task.deadline ? (
              <span className={cn("shrink-0 text-xs text-muted-foreground", isOverdue(task, today) && "font-medium text-destructive")}>
                {format(parseDateOnly(task.deadline), "d MMM")}
              </span>
            ) : null}
          </li>
        );
      })}
    </ul>
  );

  const unassigned = groups.get(null) ?? [];

  return (
    <>
      <Link href="/projects" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" aria-hidden />
        Projects
      </Link>

      <PageHeader
        title={project.name}
        description={project.goal ?? undefined}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              <Pencil className="mr-1.5 h-4 w-4" aria-hidden />
              Edit
            </Button>
            <Button variant="outline" size="sm" onClick={toggleArchive} disabled={pending}>
              {archived ? <ArchiveRestore className="mr-1.5 h-4 w-4" aria-hidden /> : <Archive className="mr-1.5 h-4 w-4" aria-hidden />}
              {archived ? "Restore" : "Archive"}
            </Button>
            <Button variant="outline" size="sm" className="text-destructive" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="mr-1.5 h-4 w-4" aria-hidden />
              Delete
            </Button>
          </>
        }
      />

      <section aria-label="Project summary" className="mb-8 rounded-xl border bg-card p-4">
        <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: project.color }} aria-hidden />
            <StatusBadge status={project.status} archived={archived} />
          </span>
          {project.start_date ? <span>Started {format(parseDateOnly(project.start_date), "d MMM yyyy")}</span> : null}
          {project.deadline ? (
            <span
              className={cn(
                "flex items-center gap-1.5",
                project.status !== "completed" && project.deadline < today && "font-medium text-destructive",
              )}
            >
              <CalendarDays className="h-4 w-4" aria-hidden />
              Due {format(parseDateOnly(project.deadline), "d MMM yyyy")}
            </span>
          ) : null}
        </div>
        <div className="mb-1.5 flex items-baseline justify-between text-sm">
          <span className="text-muted-foreground">
            {overall.done} of {overall.total} tasks done · {overall.todo} to do · {overall.doing} doing
          </span>
          <span className="font-medium tabular-nums">{progressPercent(overall.done, overall.total)}%</span>
        </div>
        <ProgressBar done={overall.done} total={overall.total} label="Overall progress" color={project.color} />
      </section>

      <h2 className="mb-3 font-display text-2xl">Timeline</h2>
      <div className="mb-8">
        <ProjectTimeline
          project={project}
          tasks={local}
          today={today}
          onOpen={(task) => setTaskDialog({ open: true, task, milestoneId: task.milestone_id })}
        />
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-2xl">Milestones</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setMilestoneDialog({ open: true, milestone: null })}>
            <Plus className="mr-1.5 h-4 w-4" aria-hidden />
            Milestone
          </Button>
          <Button size="sm" onClick={() => setTaskDialog({ open: true, task: null, milestoneId: null })}>
            <Plus className="mr-1.5 h-4 w-4" aria-hidden />
            Task
          </Button>
        </div>
      </div>

      {milestones.length === 0 && topLevel.length === 0 ? (
        <div className="rounded-lg border border-dashed px-6 py-12 text-center">
          <p className="font-display text-xl">Nothing here yet</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            Break the project into milestones, then add tasks to each one.
          </p>
          <Button className="mt-5" onClick={() => setMilestoneDialog({ open: true, milestone: null })}>
            Add the first milestone
          </Button>
        </div>
      ) : (
        <div className="space-y-5">
          {milestones.map((milestone) => {
            const list = groups.get(milestone.id) ?? [];
            const counts = countByStatus(list);
            return (
              <section key={milestone.id} aria-labelledby={`ms-${milestone.id}`} className="rounded-xl border bg-card p-4">
                <header className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <h3 id={`ms-${milestone.id}`} className="font-display text-lg">
                    {milestone.name}
                  </h3>
                  {milestone.deadline ? (
                    <span
                      className={cn(
                        "text-xs text-muted-foreground",
                        counts.done < counts.total && milestone.deadline < today && "font-medium text-destructive",
                      )}
                    >
                      Due {format(parseDateOnly(milestone.deadline), "d MMM")}
                    </span>
                  ) : null}
                  <div className="ml-auto flex items-center gap-1">
                    <span className="mr-2 text-xs tabular-nums text-muted-foreground">
                      {counts.done}/{counts.total}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Edit milestone ${milestone.name}`}
                      onClick={() => setMilestoneDialog({ open: true, milestone })}
                    >
                      <Pencil className="h-4 w-4" aria-hidden />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Add task to ${milestone.name}`}
                      onClick={() => setTaskDialog({ open: true, task: null, milestoneId: milestone.id })}
                    >
                      <Plus className="h-4 w-4" aria-hidden />
                    </Button>
                  </div>
                </header>
                <ProgressBar done={counts.done} total={counts.total} label={`${milestone.name} progress`} color={project.color} className="mb-2 h-1.5" />
                {list.length > 0 ? (
                  renderTasks(list)
                ) : (
                  <p className="py-3 text-sm text-muted-foreground">No tasks yet. Use + to add one.</p>
                )}
              </section>
            );
          })}

          {unassigned.length > 0 ? (
            <section aria-labelledby="ms-none" className="rounded-xl border bg-card p-4">
              <h3 id="ms-none" className="mb-2 font-display text-lg">
                No milestone
              </h3>
              {renderTasks(unassigned)}
            </section>
          ) : null}
        </div>
      )}

      <ProjectDialog open={editOpen} onOpenChange={setEditOpen} project={project} />
      <MilestoneDialog
        open={milestoneDialog.open}
        onOpenChange={(open) => setMilestoneDialog((d) => ({ ...d, open }))}
        projectId={project.id}
        milestone={milestoneDialog.milestone}
      />
      <TaskDialog
        open={taskDialog.open}
        onOpenChange={(open) => setTaskDialog((d) => ({ ...d, open }))}
        task={taskDialog.task}
        defaults={{ project_id: project.id, milestone_id: taskDialog.milestoneId }}
        data={data}
        allTasks={local}
      />

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete “{project.name}”?</DialogTitle>
            <DialogDescription>
              This permanently deletes the project, its {milestones.length} milestones and all {local.length} of its
              tasks. Archive it instead if you might want it back.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={remove} disabled={pending}>
              Delete project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
