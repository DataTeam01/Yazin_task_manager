"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { CalendarClock, CheckCircle2, Clock, TriangleAlert } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { TaskDialog } from "@/components/task-dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { parseDateOnly, toDateString } from "@/lib/dates";
import type { TaskDialogData } from "@/lib/queries/task-dialog";
import { buildReview, type ReviewPeriod } from "@/lib/tasks/review";
import { cn } from "@/lib/utils";
import type { Task } from "@/types";

interface ReviewViewProps {
  tasks: Task[];
  data: TaskDialogData;
  initialToday: string;
}

const PERIODS: Record<ReviewPeriod, { tab: string; noun: string; label: string; nextLabel: string }> = {
  week: { tab: "Weekly", noun: "week", label: "Week of", nextLabel: "next week" },
  month: { tab: "Monthly", noun: "month", label: "Month of", nextLabel: "next month" },
  quarter: { tab: "Quarterly", noun: "quarter", label: "Quarter of", nextLabel: "next quarter" },
};

function formatMinutes(total: number): string {
  if (total <= 0) return "0m";
  const h = Math.floor(total / 60);
  const m = total % 60;
  return h > 0 ? `${h}h${m > 0 ? ` ${m}m` : ""}` : `${m}m`;
}

export function ReviewView({ tasks, data, initialToday }: ReviewViewProps) {
  const [today, setToday] = useState(initialToday);
  const [period, setPeriod] = useState<ReviewPeriod>("week");
  const [dialog, setDialog] = useState<{ open: boolean; task: Task | null }>({ open: false, task: null });
  useEffect(() => setToday(toDateString(new Date())), []);

  const review = useMemo(() => buildReview(tasks, new Date(`${today}T12:00:00`), period), [tasks, today, period]);
  const p = PERIODS[period];
  const projectsById = useMemo(() => new Map(data.projects.map((p) => [p.id, p])), [data.projects]);
  const open = (task: Task): void => setDialog({ open: true, task });

  const range = (a: string, b: string): string =>
    `${format(parseDateOnly(a), "d MMM")} – ${format(parseDateOnly(b), "d MMM")}`;

  const tiles = [
    { label: "Completed", value: String(review.completed.length), icon: CheckCircle2, tone: "text-primary" },
    { label: "Slipped", value: String(review.slipped.length), icon: TriangleAlert, tone: review.slipped.length > 0 ? "text-destructive" : "" },
    { label: `Due ${p.nextLabel}`, value: String(review.upcoming.length), icon: CalendarClock, tone: "" },
    { label: "Estimated time done", value: formatMinutes(review.minutesCompleted), icon: Clock, tone: "" },
  ];

  const row = (task: Task, trailing: React.ReactNode) => {
    const project = task.project_id ? projectsById.get(task.project_id) : undefined;
    return (
      <li key={task.id}>
        <button type="button" onClick={() => open(task)} className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm hover:bg-accent/60">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-sm"
            style={{ backgroundColor: project?.color ?? "hsl(var(--muted-foreground) / 0.4)" }}
            aria-hidden
          />
          <span className="min-w-0 flex-1 truncate">{task.title}</span>
          {project ? <span className="hidden text-xs text-muted-foreground sm:inline">{project.name}</span> : null}
          <span className="shrink-0 text-xs text-muted-foreground">{trailing}</span>
        </button>
      </li>
    );
  };

  const section = (id: string, title: string, hint: string, count: number, empty: string, children: React.ReactNode) => (
    <section aria-labelledby={id} className="mb-8">
      <h2 id={id} className="font-display text-xl">
        {title} <span className="font-sans text-sm font-normal text-muted-foreground">{count}</span>
      </h2>
      <p className="mb-2 text-xs text-muted-foreground">{hint}</p>
      {count === 0 ? (
        <p className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="divide-y rounded-xl border bg-card">{children}</ul>
      )}
    </section>
  );

  const nothing = review.completed.length + review.slipped.length + review.upcoming.length === 0;

  return (
    <>
      <PageHeader
        title="Manager's Review"
        description={`Ujwal - R, Manager - Data Team · ${p.label} ${range(review.periodStart, review.periodEnd)}. Look back, then plan ahead.`}
      />

      <Tabs value={period} onValueChange={(v) => setPeriod(v as ReviewPeriod)} className="mb-6">
        <TabsList aria-label="Review period">
          {(Object.keys(PERIODS) as ReviewPeriod[]).map((key) => (
            <TabsTrigger key={key} value={key}>
              {PERIODS[key].tab}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <dl className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        {tiles.map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="rounded-lg border bg-card px-4 py-3">
            <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Icon className="h-3.5 w-3.5" aria-hidden />
              {label}
            </dt>
            <dd className={cn("font-display text-3xl tabular-nums", tone)}>{value}</dd>
          </div>
        ))}
      </dl>

      {nothing ? (
        <EmptyState
          icon={CheckCircle2}
          title={`A quiet ${p.noun}`}
          description={`Nothing completed, nothing slipped and nothing due ${p.nextLabel}. Add tasks with deadlines from the board.`}
        />
      ) : (
        <>
          {section(
            "rv-completed",
            `Completed this ${p.noun}`,
            `Finished this ${p.noun}, newest first.`,
            review.completed.length,
            `Nothing finished yet this ${p.noun}.`,
            review.completed.map((t) => row(t, t.completed_at ? format(new Date(t.completed_at), "EEE") : "")),
          )}
          {section(
            "rv-slipped",
            "Slipped past deadline",
            "Still open and overdue, most late first. Finish, reschedule or drop them.",
            review.slipped.length,
            "Nothing is overdue. Nicely done.",
            review.slipped.map(({ task, daysLate }) =>
              row(task, <span className="font-medium text-destructive">{daysLate === 1 ? "1 day late" : `${daysLate} days late`}</span>),
            ),
          )}
          {section(
            "rv-upcoming",
            `Due ${p.nextLabel}`,
            `Open tasks with a deadline ${range(review.nextStart, review.nextEnd)}.`,
            review.upcoming.length,
            `Nothing due ${p.nextLabel}.`,
            review.upcoming.map((t) => row(t, t.deadline ? format(parseDateOnly(t.deadline), "EEE d MMM") : "")),
          )}
        </>
      )}

      <TaskDialog
        open={dialog.open}
        onOpenChange={(o) => setDialog((d) => ({ ...d, open: o }))}
        task={dialog.task}
        data={data}
        allTasks={tasks}
      />
    </>
  );
}
