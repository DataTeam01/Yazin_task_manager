import { cn } from "@/lib/utils";
import type { BoardStats } from "@/lib/tasks/stats";

export function StatsStrip({ stats }: { stats: BoardStats }) {
  const items = [
    { label: "In progress", value: stats.inProgress, tone: "" },
    { label: "Due this week", value: stats.dueThisWeek, tone: "" },
    { label: "Overdue", value: stats.overdue, tone: stats.overdue > 0 ? "text-destructive" : "" },
    { label: "Done this week", value: stats.completedThisWeek, tone: "text-primary" },
  ];

  return (
    <dl className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="rounded-lg border bg-card px-4 py-3">
          <dt className="text-xs text-muted-foreground">{item.label}</dt>
          <dd className={cn("font-display text-3xl tabular-nums", item.tone)}>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
