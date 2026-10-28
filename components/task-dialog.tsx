"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { DatePicker } from "@/components/date-picker";
import { SubtaskList } from "@/components/subtask-list";
import { TagPicker } from "@/components/tag-picker";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createTag, setTaskTags } from "@/lib/actions/tags";
import { createTask, deleteTask, updateTask } from "@/lib/actions/tasks";
import type { TaskDialogData } from "@/lib/queries/task-dialog";
import { taskFieldsSchema, type TaskFields } from "@/lib/validators/task";
import type { Tag, Task, TaskPriority, TaskStatus } from "@/types";

const NONE = "none";

const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "Going to work",
  doing: "Working on",
  done: "Worked on",
};

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The task being edited, or null to create a new one. */
  task: Task | null;
  /** Initial values when creating a new task. */
  defaults?: Partial<Pick<TaskFields, "status" | "project_id" | "milestone_id">>;
  data: TaskDialogData;
  /** Every task (including subtasks), used to list this task's subtasks. */
  allTasks: readonly Task[];
}

export function TaskDialog({ open, onOpenChange, task, defaults, data, allTasks }: TaskDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        {/* Keyed so the form state resets whenever a different task (or "new") is opened. */}
        <TaskForm
          key={task?.id ?? `new-${defaults?.status}-${defaults?.project_id}-${defaults?.milestone_id}`}
          task={task}
          defaults={defaults}
          data={data}
          allTasks={allTasks}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

interface TaskFormProps {
  task: Task | null;
  defaults: TaskDialogProps["defaults"];
  data: TaskDialogData;
  allTasks: readonly Task[];
  onDone: () => void;
}

function sameSet(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((id) => b.includes(id));
}

function TaskForm({ task, defaults, data, allTasks, onDone }: TaskFormProps) {
  const [fields, setFields] = useState<TaskFields>({
    title: task?.title ?? "",
    description: task?.description ?? null,
    status: task?.status ?? defaults?.status ?? "todo",
    priority: task?.priority ?? "medium",
    project_id: task ? task.project_id : (defaults?.project_id ?? null),
    milestone_id: task ? task.milestone_id : (defaults?.milestone_id ?? null),
    start_date: task?.start_date ?? null,
    deadline: task?.deadline ?? null,
    estimate_minutes: task?.estimate_minutes ?? null,
  });
  const initialTagIds = useMemo(
    () => (task ? data.taskTags.filter((l) => l.task_id === task.id).map((l) => l.tag_id) : []),
    [task, data.taskTags],
  );
  const [tagIds, setTagIds] = useState<string[]>(initialTagIds);
  const [createdTags, setCreatedTags] = useState<Tag[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pending, startTransition] = useTransition();

  const projectMilestones = data.milestones.filter((m) => m.project_id === fields.project_id);
  const allTags = [...data.tags, ...createdTags.filter((c) => !data.tags.some((t) => t.id === c.id))];
  const subtasks = useMemo(
    () => (task ? allTasks.filter((t) => t.parent_task_id === task.id) : []),
    [task, allTasks],
  );

  const set = <K extends keyof TaskFields>(key: K, value: TaskFields[K]): void =>
    setFields((prev) => ({ ...prev, [key]: value }));

  async function handleCreateTag(name: string): Promise<Tag | null> {
    const result = await createTag(name);
    if (!result.ok) {
      toast.error(result.error);
      return null;
    }
    setCreatedTags((prev) => [...prev, result.data]);
    return result.data;
  }

  function submit(event: React.FormEvent): void {
    event.preventDefault();
    const parsed = taskFieldsSchema.safeParse({
      ...fields,
      description: fields.description?.trim() ? fields.description : null,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the form");
      return;
    }
    if (parsed.data.start_date && parsed.data.deadline && parsed.data.start_date > parsed.data.deadline) {
      setError("Start date must be on or before the deadline");
      return;
    }
    setError(null);

    startTransition(async () => {
      const result = task ? await updateTask(task.id, parsed.data) : await createTask(parsed.data);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      if (!sameSet(tagIds, initialTagIds)) {
        const tagResult = await setTaskTags(result.data.id, tagIds);
        if (!tagResult.ok) {
          toast.error(`Task saved, but tags failed: ${tagResult.error}`);
          onDone();
          return;
        }
      }
      toast.success(task ? "Task updated" : "Task created");
      onDone();
    });
  }

  function remove(): void {
    if (!task) return;
    startTransition(async () => {
      const result = await deleteTask(task.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Task deleted");
      onDone();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <DialogHeader>
        <DialogTitle>{task ? "Edit task" : "New task"}</DialogTitle>
        <DialogDescription>{task ? "Update the details below." : "What do you want to get done?"}</DialogDescription>
      </DialogHeader>

      <div className="space-y-1.5">
        <Label htmlFor="task-title">Title</Label>
        <Input
          id="task-title"
          value={fields.title}
          onChange={(e) => set("title", e.target.value)}
          aria-invalid={error !== null && !fields.title.trim()}
          autoFocus
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="task-description">Notes</Label>
        <textarea
          id="task-description"
          rows={4}
          value={fields.description ?? ""}
          onChange={(e) => set("description", e.target.value)}
          className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground"
          placeholder="Context, links, next steps…"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="task-status">Status</Label>
          <Select value={fields.status} onValueChange={(v) => set("status", v as TaskStatus)}>
            <SelectTrigger id="task-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(STATUS_LABELS) as TaskStatus[]).map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="task-priority">Priority</Label>
          <Select value={fields.priority} onValueChange={(v) => set("priority", v as TaskPriority)}>
            <SelectTrigger id="task-priority">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="task-project">Project</Label>
        <Select
          value={fields.project_id ?? NONE}
          onValueChange={(v) => setFields((prev) => ({ ...prev, project_id: v === NONE ? null : v, milestone_id: null }))}
        >
          <SelectTrigger id="task-project">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>No project</SelectItem>
            {data.projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {projectMilestones.length > 0 ? (
        <div className="space-y-1.5">
          <Label htmlFor="task-milestone">Milestone</Label>
          <Select value={fields.milestone_id ?? NONE} onValueChange={(v) => set("milestone_id", v === NONE ? null : v)}>
            <SelectTrigger id="task-milestone">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>No milestone</SelectItem>
              {projectMilestones.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="task-start">Start date</Label>
          <DatePicker id="task-start" value={fields.start_date} onChange={(v) => set("start_date", v)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="task-deadline">Deadline</Label>
          <DatePicker id="task-deadline" value={fields.deadline} onChange={(v) => set("deadline", v)} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="task-estimate">Estimate (minutes)</Label>
        <Input
          id="task-estimate"
          type="number"
          inputMode="numeric"
          min={0}
          value={fields.estimate_minutes ?? ""}
          onChange={(e) => set("estimate_minutes", e.target.value === "" ? null : Number(e.target.value))}
        />
      </div>

      <TagPicker tags={allTags} selected={tagIds} onChange={setTagIds} onCreate={handleCreateTag} />

      {task && !task.parent_task_id ? (
        <SubtaskList parent={task} subtasks={subtasks} />
      ) : task ? null : (
        <p className="text-xs text-muted-foreground">Save the task first, then reopen it to add subtasks.</p>
      )}

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <DialogFooter className="gap-2 sm:justify-between">
        {task ? (
          confirmDelete ? (
            <Button type="button" variant="destructive" onClick={remove} disabled={pending}>
              Confirm delete
            </Button>
          ) : (
            <Button type="button" variant="ghost" className="text-destructive" onClick={() => setConfirmDelete(true)}>
              Delete
            </Button>
          )
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onDone}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save"}
          </Button>
        </div>
      </DialogFooter>
    </form>
  );
}
