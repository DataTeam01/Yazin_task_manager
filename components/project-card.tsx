import Link from "next/link";
import { format } from "date-fns";
import { CalendarDays } from "lucide-react";
import { ProgressBar } from "@/components/progress-bar";
import { StatusBadge } from "@/components/status-badge";
import { parseDateOnly } from "@/lib/dates";
import type { ProjectSummary } from "@/lib/queries/projects";
import { progressPercent } from "@/lib/tasks/progress";
import { cn } from "@/lib/utils";

export function ProjectCard({ project, today }: { project: ProjectSummary; today: string }) {
  const { counts } = project;
  const late = project.status !== "completed" && project.deadline !== null && project.deadline < today;

  return (
    <Link
      href={`/projects/${project.id}`}
      className="block rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="h-3.5 w-3.5 shrink-0 rounded-sm" style={{ backgroundColor: project.color }} aria-hidden />
          <h2 className="truncate font-display text-xl">{project.name}</h2>
        </div>
        <StatusBadge status={project.status} archived={project.archived_at !== null} />
      </div>

      {project.goal ? <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">{project.goal}</p> : null}

      <div className="mb-1.5 flex items-baseline justify-between text-sm">
        <span className="text-muted-foreground">
          {counts.done} of {counts.total} done
        </span>
        <span className="font-medium tabular-nums">{progressPercent(counts.done, counts.total)}%</span>
      </div>
      <ProgressBar done={counts.done} total={counts.total} label={`${project.name} progress`} color={project.color} />

      <dl className="mt-3 flex gap-4 text-xs text-muted-foreground">
        <div>
          <dt className="inline">To do </dt>
          <dd className="inline font-medium text-foreground">{counts.todo}</dd>
        </div>
        <div>
          <dt className="inline">Doing </dt>
          <dd className="inline font-medium text-foreground">{counts.doing}</dd>
        </div>
        <div>
          <dt className="inline">Done </dt>
          <dd className="inline font-medium text-foreground">{counts.done}</dd>
        </div>
      </dl>

      {project.deadline ? (
        <p className={cn("mt-3 flex items-center gap-1.5 text-xs text-muted-foreground", late && "font-medium text-destructive")}>
          <CalendarDays className="h-3.5 w-3.5" aria-hidden />
          {late ? "Overdue · " : "Due "}
          {format(parseDateOnly(project.deadline), "d MMM yyyy")}
        </p>
      ) : null}
    </Link>
  );
}
