"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { format } from "date-fns";
import { CalendarDays, CheckSquare, GripVertical } from "lucide-react";
import { parseDateOnly } from "@/lib/dates";
import type { ProjectOption } from "@/lib/queries/projects";
import { isOverdue, type SubtaskProgress } from "@/lib/tasks/stats";
import { cn } from "@/lib/utils";
import type { Tag, Task, TaskPriority } from "@/types";

const PRIORITY_STYLES: Record<TaskPriority, { dot: string; label: string }> = {
  high: { dot: "bg-destructive", label: "High priority" },
  medium: { dot: "bg-amber-500", label: "Medium priority" },
  low: { dot: "bg-muted-foreground/50", label: "Low priority" },
};

interface TaskCardProps {
  task: Task;
  project: ProjectOption | undefined;
  progress: SubtaskProgress | undefined;
  tags: readonly Tag[] | undefined;
  today: string;
  onOpen: (task: Task) => void;
}

export function TaskCard({ task, project, progress, tags, today, onOpen }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const overdue = isOverdue(task, today);
  const priority = PRIORITY_STYLES[task.priority];

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "group relative touch-manipulation rounded-lg border bg-card p-3 shadow-sm transition-shadow hover:shadow-md",
        isDragging && "z-10 opacity-60 shadow-lg",
        task.status === "done" && "opacity-75",
      )}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          className="-ml-1 mt-0.5 cursor-grab touch-nonerounded p-0.5 text-muted-foreground hover:text-foreground active:cursor-grabbing"
          aria-label={`Drag ${task.title}. Press space to pick up, arrow keys to move.`}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" aria-hidden />
        </button>

        <button
          type="button"
          onClick={() => onOpen(task)}
          className="min-w-0 flex-1 rounded text-left"
          aria-label={`Edit ${task.title}`}
        >
          <span className="flex items-start gap-2">
            <span
              className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", priority.dot)}
              role="img"
              aria-label={priority.label}
              title={priority.label}
            />
            <span className={cn("text-sm font-medium leading-snug", task.status === "done" && "line-through")}>
              {task.title}
            </span>
          </span>

          <span className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {project ? (
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: project.color }} aria-hidden />
                {project.name}
              </span>
            ) : null}
            {task.deadline ? (
              <span className={cn("flex items-center gap-1", overdue && "font-medium text-destructive")}>
                <CalendarDays className="h-3 w-3" aria-hidden />
                {overdue ? "Overdue · " : ""}
                {format(parseDateOnly(task.deadline), "d MMM")}
              </span>
            ) : null}
            {progress ? (
              <span className="flex items-center gap-1" title="Subtasks done">
                <CheckSquare className="h-3 w-3" aria-hidden />
                {progress.done}/{progress.total}
              </span>
            ) : null}
          </span>
          {tags && tags.length > 0 ? (
            <span className="mt-2 flex flex-wrap gap-1">
              {tags.map((tag) => (
                <span key={tag.id} className="flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: tag.color }} aria-hidden />
                  {tag.name}
                </span>
              ))}
            </span>
          ) : null}
        </button>
      </div>
    </li>
  );
}
