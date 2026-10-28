"use client";

import { useEffect, useState } from "react";
import { Check, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createSubtask, deleteTask, setTaskStatus } from "@/lib/actions/tasks";
import { cn } from "@/lib/utils";
import type { Task } from "@/types";

interface SubtaskListProps {
  parent: Task;
  subtasks: readonly Task[];
}

/** Checklist of a task's subtasks. Lives inside the task form, so Enter must not submit the form. */
export function SubtaskList({ parent, subtasks }: SubtaskListProps) {
  const [subs, setSubs] = useState<Task[]>([...subtasks]);
  const [draft, setDraft] = useState("");
  const [adding, setAdding] = useState(false);

  // Re-sync when the server data changes (compared by content so optimistic edits aren't clobbered by re-renders).
  const signature = subtasks.map((t) => `${t.id}:${t.status}:${t.title}`).join("|");
  useEffect(() => setSubs([...subtasks]), [signature]); // eslint-disable-line react-hooks/exhaustive-deps

  const done = subs.filter((t) => t.status === "done").length;

  async function add(): Promise<void> {
    const title = draft.trim();
    if (!title || adding) return;
    setAdding(true);
    const result = await createSubtask(parent.id, title);
    setAdding(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setSubs((prev) => [...prev, result.data]);
    setDraft("");
  }

  async function toggle(task: Task): Promise<void> {
    const next = task.status === "done" ? "todo" : "done";
    const before = subs;
    setSubs((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: next } : t)));
    const result = await setTaskStatus(task.id, next);
    if (!result.ok) {
      setSubs(before);
      toast.error(`Couldn't update subtask: ${result.error}`);
    }
  }

  async function remove(task: Task): Promise<void> {
    const before = subs;
    setSubs((prev) => prev.filter((t) => t.id !== task.id));
    const result = await deleteTask(task.id);
    if (!result.ok) {
      setSubs(before);
      toast.error(`Couldn't delete subtask: ${result.error}`);
    }
  }

  return (
    <fieldset className="space-y-2">
      <legend className="flex w-full items-baseline justify-between text-sm font-medium">
        Subtasks
        {subs.length > 0 ? (
          <span className="text-xs font-normal text-muted-foreground">
            {done}/{subs.length} done
          </span>
        ) : null}
      </legend>

      {subs.length > 0 ? (
        <ul className="divide-y rounded-md border">
          {subs.map((task) => {
            const isDone = task.status === "done";
            return (
              <li key={task.id} className="flex items-center gap-2.5 px-2.5 py-1.5">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={isDone}
                  aria-label={`Mark "${task.title}" as ${isDone ? "not done" : "done"}`}
                  onClick={() => void toggle(task)}
                  className={cn(
                    "flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded border",
                    isDone ? "border-primary bg-primary text-primary-foreground" : "border-input hover:border-primary",
                  )}
                >
                  {isDone ? <Check className="h-3 w-3" aria-hidden /> : null}
                </button>
                <span className={cn("min-w-0 flex-1 truncate text-sm", isDone && "text-muted-foreground line-through")}>
                  {task.title}
                </span>
                <button
                  type="button"
                  aria-label={`Delete subtask "${task.title}"`}
                  onClick={() => void remove(task)}
                  className="rounded p-0.5 text-muted-foreground hover:text-destructive"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void add();
            }
          }}
          placeholder="Add a subtask…"
          aria-label="New subtask title"
          disabled={adding}
        />
        <Button type="button" variant="outline" size="icon" aria-label="Add subtask" onClick={() => void add()} disabled={adding || !draft.trim()}>
          <Plus className="h-4 w-4" aria-hidden />
        </Button>
      </div>
    </fieldset>
  );
}
