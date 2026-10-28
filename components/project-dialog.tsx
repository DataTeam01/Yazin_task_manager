"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DatePicker } from "@/components/date-picker";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createProject, updateProject } from "@/lib/actions/projects";
import { projectFieldsSchema, type ProjectFields } from "@/lib/validators/project";
import { cn } from "@/lib/utils";
import type { Project, ProjectStatus } from "@/types";

export const PROJECT_COLORS = ["#c8502d", "#2f6f8f", "#6b8f3a", "#8a6bb0", "#b08a2f", "#c2557a", "#3f8f7f", "#5b6b7a"];

interface ProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The project being edited, or null to create one. */
  project: Project | null;
}

export function ProjectDialog({ open, onOpenChange, project }: ProjectDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <ProjectForm key={project?.id ?? "new"} project={project} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function ProjectForm({ project, onDone }: { project: Project | null; onDone: () => void }) {
  const router = useRouter();
  const [fields, setFields] = useState<ProjectFields>({
    name: project?.name ?? "",
    goal: project?.goal ?? null,
    status: project?.status ?? "active",
    start_date: project?.start_date ?? null,
    deadline: project?.deadline ?? null,
    color: project?.color ?? PROJECT_COLORS[0] ?? "#c8502d",
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const set = <K extends keyof ProjectFields>(key: K, value: ProjectFields[K]): void =>
    setFields((prev) => ({ ...prev, [key]: value }));

  function submit(event: React.FormEvent): void {
    event.preventDefault();
    const parsed = projectFieldsSchema.safeParse({ ...fields, goal: fields.goal?.trim() ? fields.goal : null });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the form");
      return;
    }
    setError(null);

    startTransition(async () => {
      const result = project ? await updateProject(project.id, parsed.data) : await createProject(parsed.data);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(project ? "Project updated" : "Project created");
      onDone();
      if (!project) router.push(`/projects/${result.data.id}`);
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <DialogHeader>
        <DialogTitle>{project ? "Edit project" : "New project"}</DialogTitle>
        <DialogDescription>{project ? "Update the project details." : "Give the work a name and a goal."}</DialogDescription>
      </DialogHeader>

      <div className="space-y-1.5">
        <Label htmlFor="project-name">Name</Label>
        <Input id="project-name" value={fields.name} onChange={(e) => set("name", e.target.value)} autoFocus />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="project-goal">Goal</Label>
        <textarea
          id="project-goal"
          rows={3}
          value={fields.goal ?? ""}
          onChange={(e) => set("goal", e.target.value)}
          className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground"
          placeholder="What does done look like?"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="project-status">Status</Label>
        <Select value={fields.status} onValueChange={(v) => set("status", v as ProjectStatus)}>
          <SelectTrigger id="project-status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="on_hold">On hold</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="project-start">Start date</Label>
          <DatePicker id="project-start" value={fields.start_date} onChange={(v) => set("start_date", v)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="project-deadline">Deadline</Label>
          <DatePicker id="project-deadline" value={fields.deadline} onChange={(v) => set("deadline", v)} />
        </div>
      </div>

      <fieldset className="space-y-1.5">
        <legend className="text-sm font-medium">Colour</legend>
        <div className="flex flex-wrap gap-2">
          {PROJECT_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => set("color", color)}
              aria-label={`Colour ${color}`}
              aria-pressed={fields.color === color}
              className={cn(
                "h-7 w-7 rounded-full border-2 border-transparent",
                fields.color === color && "border-foreground ring-2 ring-background ring-offset-0",
              )}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </fieldset>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <DialogFooter className="gap-2">
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
      </DialogFooter>
    </form>
  );
}
