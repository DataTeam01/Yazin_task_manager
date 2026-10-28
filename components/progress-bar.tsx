import { progressPercent } from "@/lib/tasks/progress";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  done: number;
  total: number;
  label: string;
  color?: string;
  className?: string;
}

export function ProgressBar({ done, total, label, color, className }: ProgressBarProps) {
  const pct = progressPercent(done, total);
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      aria-valuetext={`${done} of ${total} done`}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-secondary", className)}
    >
      <div
        className="h-full rounded-full bg-primary transition-[width] duration-300"
        style={{ width: `${pct}%`, ...(color ? { backgroundColor: color } : {}) }}
      />
    </div>
  );
}
