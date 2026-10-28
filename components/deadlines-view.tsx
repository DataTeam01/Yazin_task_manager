"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { CalendarCheck, Check } from "lucide-react";
import { toast } from "sonner";
import { DeadlineCalendar } from "@/components/deadline-calendar";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { TaskDialog } from "@/components/task-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { setTaskStatus } from "@/lib/actions/tasks";
import { parseDateOnly, toDateString } from "@/lib/dates";
import type { TaskDialogData } from "@/lib/queries/task-dialog";
import { BUCKET_LABELS, BUCKET_ORDER, groupByDeadline } from "@/lib/tasks/deadlines";
import { cn } from "@/lib/utils";
import type { Task, TaskStatus } from "@/types";

interface DeadlinesViewProps {
  tasks: Task[];
  data: TaskDialogData;
  initialToday: string;
}

const PRIORITY_DOT: Record<Task["priority"], string> = {
  high: "bg-destructive",
  medium: "bg-amber-500",
  low: "bg-muted-foreground/50",
};

export function DeadlinesView({ tasks, data, initialToday }: DeadlinesViewProps) {
  const { projects } = data;
  const [local, setLocal] = useState(tasks);
  const [today, setToday] = useState(initialToday);
  const [dialog, setDialog] = useState<{ open: boolean; task: Task | null }>({ open: false, task: null });

  useEffect(() => setToday(toDateString(new Date())), []);
  useEffect(() => setLocal(tasks), [tasks]);

  const projectsById = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects]);
  const titlesById = useMemo(() => new Map(local.map((t) => [t.id, t.title])), [local]);
  const groups = useMemo(() => groupByDeadline(local, today), [local, today]);
  const openCount = BUCKET_ORDER.reduce((n, b) => n + groups[b].length, 0);

  /** Optimistic status change with rollback; used by the checkbox and its Undo. */
  async function changeStatus(task: Task, next: TaskStatus, announce: boolean): Promise<void> {
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
      return;
    }
    if (announce) {
      toast.success(`Marked “${task.title}” done`, {
        action: { label: "Undo", onClick: () => void changeStatus(task, task.status, false) },
      });
    }
  }

  const open = (task: Task): void => setDialog({ open: true, task });

  return (
    <>
      <PageHeader title="Deadlines" description="Open tasks by when they're due." />

      <Tabs defaultValue="list">
        <TabsList className="mb-5">
          <TabsTrigger value="list">List</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          {openCount === 0 ? (
            <EmptyState
              icon={CalendarCheck}
              title="Nothing open"
              description="Every task is done. Add a task with a deadline from the board and it will show up here."
            />
          ) : (
            <div className="space-y-7">
              {BUCKET_ORDER.map((bucket) => {
                const list = groups[bucket];
                if (list.length === 0) return null;
                return (
                  <section key={bucket} aria-labelledby={`bucket-${bucket}`}>
                    <h2
                      id={`bucket-${bucket}`}
                      className={cn(
                        "mb-2 flex items-baseline gap-2 font-display text-xl",
                        bucket === "overdue" && "text-destructive",
                      )}
                    >
                      {BUCKET_LABELS[bucket]}
                      <span className="font-sans text-sm font-normal text-muted-foreground">{list.length}</span>
                    </h2>
                    <ul className="divide-y rounded-xl border bg-card">
                      {list.map((task) => {
                        const project = task.project_id ? projectsById.get(task.project_id) : undefined;
                        const parent = task.parent_task_id ? titlesById.get(task.parent_task_id) : undefined;
                        return (
                          <li key={task.id} className="flex items-center gap-3 px-3 py-2.5">
                            <button
                              type="button"
                              role="checkbox"
                              aria-checked={false}
                              aria-label={`Mark "${task.title}" as done`}
                              onClick={() => void changeStatus(task, "done", true)}
                              className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-input text-transparent hover:border-primary hover:text-primary/50"
                            >
                              <Check className="h-3.5 w-3.5" aria-hidden />
                            </button>
                            <span
                              className={cn("h-2 w-2 shrink-0 rounded-full", PRIORITY_DOT[task.priority])}
                              role="img"
                              aria-label={`${task.priority} priority`}
                            />
                            <button type="button" onClick={() => open(task)} className="min-w-0 flex-1 rounded text-left">
                              <span className="block truncate text-sm">{task.title}</span>
                              {parent ? (
                                <span className="block truncate text-xs text-muted-foreground">Subtask of {parent}</span>
                              ) : null}
                            </button>
                            {task.status === "doing" ? (
                              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">Doing</span>
                            ) : null}
                            {project ? (
                              <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
                                <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: project.color }} aria-hidden />
                                {project.name}
                              </span>
                            ) : null}
                            {task.deadline ? (
                              <span
                                className={cn(
                                  "w-14 shrink-0 text-right text-xs text-muted-foreground",
                                  bucket === "overdue" && "font-medium text-destructive",
                                )}
                              >
                                {format(parseDateOnly(task.deadline), "d MMM")}
                              </span>
                            ) : null}
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="calendar">
          <DeadlineCalendar tasks={local} projectsById={projectsById} today={today} onOpen={open} />
        </TabsContent>
      </Tabs>

      <TaskDialog
        open={dialog.open}
        onOpenChange={(o) => setDialog((d) => ({ ...d, open: o }))}
        task={dialog.task}
        data={data}
        allTasks={local}
      />
    </>
  );
}
