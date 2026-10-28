"use client";

import { useState, useTransition } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { TaskCard } from "@/components/task-card";
import { Input } from "@/components/ui/input";
import { createTask } from "@/lib/actions/tasks";
import type { ProjectOption } from "@/lib/queries/projects";
import type { SubtaskProgress } from "@/lib/tasks/stats";
import { cn } from "@/lib/utils";
import type { Tag, Task, TaskStatus } from "@/types";

interface BoardColumnProps {
  status: TaskStatus;
  title: string;
  hint: string;
  tasks: readonly Task[];
  projectsById: ReadonlyMap<string, ProjectOption>;
  progress: ReadonlyMap<string, SubtaskProgress>;
  tagsByTask: ReadonlyMap<string, Tag[]>;
  today: string;
  onOpen: (task: Task) => void;
}

export function BoardColumn({ status, title, hint, tasks, projectsById, progress, tagsByTask, today, onOpen }: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const [draft, setDraft] = useState("");
  const [pending, startTransition] = useTransition();

  function quickAdd(event: React.FormEvent): void {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    startTransition(async () => {
      const result = await createTask({ title: text, status });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setDraft("");
    });
  }

  return (
    <section
      aria-labelledby={`col-${status}`}
      className={cn("flex min-h-[12rem] flex-col rounded-xl bg-secondary/60 p-3 transition-colors", isOver && "bg-accent")}
    >
      <header className="mb-3 flex items-baseline justify-between px-1">
        <h2 id={`col-${status}`} className="font-display text-lg">
          {title}
        </h2>
        <span className="text-xs text-muted-foreground" aria-label={`${tasks.length} tasks`}>
          {tasks.length}
        </span>
      </header>

      <form onSubmit={quickAdd} className="relative mb-3">
        <Plus className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden />
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          disabled={pending}
          placeholder="Add a task…"
          aria-label={`Quick add to ${title}`}
          className="bg-background pl-8"
        />
      </form>

      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <ul ref={setNodeRef} className="flex flex-1 flex-col gap-2">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              project={task.project_id ? projectsById.get(task.project_id) : undefined}
              progress={progress.get(task.id)}
              tags={tagsByTask.get(task.id)}
              today={today}
              onOpen={onOpen}
            />
          ))}
          {tasks.length === 0 ? (
            <li className="rounded-lg border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
              {hint}
            </li>
          ) : null}
        </ul>
      </SortableContext>
    </section>
  );
}
