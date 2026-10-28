import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-dashed px-6 py-14 text-center">
      <div className="mb-4 rounded-full bg-accent p-3 text-primary">
        <Icon className="h-6 w-6" aria-hidden />
      </div>
      <h2 className="font-display text-xl">{title}</h2>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
