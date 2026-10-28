"use client";

import { useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { parseDateOnly, toDateString } from "@/lib/dates";
import type { ProjectOption } from "@/lib/queries/projects";
import { tasksByDeadline } from "@/lib/tasks/deadlines";
import { isOverdue } from "@/lib/tasks/stats";
import { cn } from "@/lib/utils";
import type { Task } from "@/types";

const WEEK = { weekStartsOn: 1 } as const;
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MAX_CHIPS = 2;

interface DeadlineCalendarProps {
  tasks: readonly Task[];
  projectsById: ReadonlyMap<string, ProjectOption>;
  today: string;
  onOpen: (task: Task) => void;
}

export function DeadlineCalendar({ tasks, projectsById, today, onOpen }: DeadlineCalendarProps) {
  const [month, setMonth] = useState(() => startOfMonth(parseDateOnly(today)));
  const [selected, setSelected] = useState<string>(today);

  const byDate = useMemo(() => tasksByDeadline(tasks), [tasks]);
  const days = useMemo(
    () => eachDayOfInterval({ start: startOfWeek(month, WEEK), end: endOfWeek(endOfMonth(month), WEEK) }),
    [month],
  );
  const selectedTasks = byDate.get(selected) ?? [];

  const chipClass = (task: Task): string =>
    task.status === "done"
      ? "bg-muted text-muted-foreground line-through"
      : isOverdue(task, today)
        ? "bg-destructive/10 text-destructive"
        : "bg-primary/10 text-foreground";

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-2xl" aria-live="polite">
          {format(month, "MMMM yyyy")}
        </h2>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" aria-label="Previous month" onClick={() => setMonth((m) => addMonths(m, -1))}>
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setMonth(startOfMonth(parseDateOnly(today)));
              setSelected(today);
            }}
          >
            Today
          </Button>
          <Button variant="outline" size="icon" aria-label="Next month" onClick={() => setMonth((m) => addMonths(m, 1))}>
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="grid grid-cols-7 border-b bg-secondary/50 text-center text-xs font-medium text-muted-foreground">
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-2">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const key = toDateString(day);
            const list = byDate.get(key) ?? [];
            const inMonth = isSameMonth(day, month);
            const isToday = key === today;
            const isSelected = key === selected;
            const open = list.filter((t) => t.status !== "done").length;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelected(key)}
                aria-pressed={isSelected}
                aria-label={`${format(day, "d MMMM")}, ${list.length} ${list.length === 1 ? "task" : "tasks"}`}
                className={cn(
                  "flex min-h-14 flex-col items-stretch gap-1 border-b border-r p-1 text-left align-top sm:min-h-24 sm:p-1.5",
                  !inMonth && "bg-secondary/30 text-muted-foreground",
                  isSelected && "bg-accent",
                )}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-xs",
                    isToday && "bg-primary font-semibold text-primary-foreground",
                  )}
                >
                  {format(day, "d")}
                </span>
                {/* Phones: just a count. Wider screens: task chips. */}
                {list.length > 0 ? (
                  <span
                    className={cn(
                      "w-fit rounded-full px-1.5 text-[10px] font-medium sm:hidden",
                      open > 0 ? "bg-primary/15" : "bg-muted text-muted-foreground",
                    )}
                  >
                    {list.length}
                  </span>
                ) : null}
                <span className="hidden flex-col gap-0.5 sm:flex">
                  {list.slice(0, MAX_CHIPS).map((task) => (
                    <span key={task.id} className={cn("truncate rounded px-1 py-0.5 text-[11px] leading-tight", chipClass(task))}>
                      {task.title}
                    </span>
                  ))}
                  {list.length > MAX_CHIPS ? (
                    <span className="px-1 text-[11px] text-muted-foreground">+{list.length - MAX_CHIPS} more</span>
                  ) : null}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <section aria-label={`Tasks due ${selected}`} className="mt-5">
        <h3 className="mb-2 font-display text-lg">{format(parseDateOnly(selected), "EEEE d MMMM")}</h3>
        {selectedTasks.length === 0 ? (
          <p className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
            Nothing due on this day.
          </p>
        ) : (
          <ul className="divide-y rounded-lg border bg-card">
            {selectedTasks.map((task) => {
              const project = task.project_id ? projectsById.get(task.project_id) : undefined;
              return (
                <li key={task.id}>
                  <button
                    type="button"
                    onClick={() => onOpen(task)}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm hover:bg-accent/60"
                  >
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-sm"
                      style={{ backgroundColor: project?.color ?? "hsl(var(--muted-foreground) / 0.4)" }}
                      aria-hidden
                    />
                    <span className={cn("min-w-0 flex-1 truncate", task.status === "done" && "text-muted-foreground line-through")}>
                      {task.title}
                    </span>
                    {isOverdue(task, today) ? <span className="text-xs font-medium text-destructive">Overdue</span> : null}
                    {project ? <span className="hidden text-xs text-muted-foreground sm:inline">{project.name}</span> : null}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
