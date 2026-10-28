import { cn } from "@/lib/utils";
import type { ProjectStatus } from "@/types";

const LABELS: Record<ProjectStatus, string> = {
  active: "Active",
  on_hold: "On hold",
  completed: "Completed",
};

export function StatusBadge({ status, archived = false }: { status: ProjectStatus; archived?: boolean }) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
        archived
          ? "bg-muted text-muted-foreground"
          : status === "active"
            ? "bg-primary/10 text-primary"
            : status === "completed"
              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
              : "bg-amber-500/15 text-amber-700 dark:text-amber-400",
      )}
    >
      {archived ? "Archived" : LABELS[status]}
    </span>
  );
}
