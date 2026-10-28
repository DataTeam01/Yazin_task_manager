"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import { parseDateOnly } from "@/lib/dates";
import { buildTimeline } from "@/lib/tasks/timeline";
import { isOverdue } from "@/lib/tasks/stats";
import { cn } from "@/lib/utils";
import type { Project, Task } from "@/types";

interface ProjectTimelineProps {
  project: Project;
  tasks: readonly Task[];
  today: string;
  onOpen: (task: Task) => void;
}

function describe(task: Task): string {
  const from = task.start_date ?? task.deadline;
  const to = task.deadline ?? task.start_date;
  if (!from || !to) return task.title;
  const fmt = (d: string): string => format(parseDateOnly(d), "d MMM");
  return from === to ? `${task.title} · ${fmt(from)}` : `${task.title} · ${fmt(from)} → ${fmt(to)}`;
}

/** Gantt-style bars from each task's start date to its deadline. */
export function ProjectTimeline({ project, tasks, today, onOpen }: ProjectTimelineProps) {
  const timeline = useMemo(() => buildTimeline(tasks, project, today), [tasks, project, today]);

  if (!timeline) {
    return (
      <p className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
        Give tasks a start date or deadline and they will appear on the timeline.
      </p>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border bg-card">
        <div className="min-w-[640px]">
          {/* Axis */}
          <div className="grid grid-cols-[minmax(8rem,14rem)_1fr] border-b bg-secondary/50 text-xs text-muted-foreground">
            <div className="px-3 py-2">Task</div>
            <div className="relative h-8" aria-hidden>
              {timeline.ticks.map((tick) => (
                <span key={`${tick.left}-${tick.label}`} className="absolute top-2 -translate-x-0 pl-1" style={{ left: `${tick.left}%` }}>
                  {tick.label}
                </span>
              ))}
            </div>
          </div>

          <ul>
            {timeline.rows.map(({ task, left, width }) => {
              const done = task.status === "done";
              const late = isOverdue(task, today);
              return (
                <li key={task.id} className="grid grid-cols-[minmax(8rem,14rem)_1fr] border-b last:border-b-0">
                  <button
                    type="button"
                    onClick={() => onOpen(task)}
                    className={cn("truncate px-3 py-2 text-left text-sm hover:bg-accent/60", done && "text-muted-foreground line-through")}
                    title={task.title}
                  >
                    {task.title}
                  </button>
                  <div className="relative h-9">
                    {/* Week/month gridlines */}
                    {timeline.ticks.map((tick) => (
                      <span
                        key={`${tick.left}-g`}
                        className="absolute inset-y-0 w-px bg-border/60"
                        style={{ left: `${tick.left}%` }}
                        aria-hidden
                      />
                    ))}
                    {timeline.todayLeft !== null ? (
                      <span
                        className="absolute inset-y-0 w-0.5 bg-primary/70"
                        style={{ left: `${timeline.todayLeft}%` }}
                        aria-hidden
                      />
                    ) : null}
                    <button
                      type="button"
                      onClick={() => onOpen(task)}
                      aria-label={describe(task)}
                      title={describe(task)}
                      className={cn(
                        "absolute top-2 h-5 min-w-[6px] rounded-md",
                        late && "!bg-destructive",
                        done && "opacity-45",
                        task.status === "doing" && "ring-2 ring-primary/40 ring-offset-1 ring-offset-card",
                      )}
                      style={{ left: `${left}%`, width: `${width}%`, backgroundColor: project.color }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {timeline.todayLeft !== null ? "The vertical line marks today. " : ""}
        {timeline.undated > 0
          ? `${timeline.undated} ${timeline.undated === 1 ? "task has" : "tasks have"} no dates and ${timeline.undated === 1 ? "isn't" : "aren't"} shown.`
          : ""}
      </p>
    </div>
  );
}
