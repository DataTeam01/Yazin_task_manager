"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { DatePicker } from "@/components/date-picker";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createMilestone, deleteMilestone, updateMilestone } from "@/lib/actions/projects";
import { milestoneFieldsSchema, type MilestoneFields } from "@/lib/validators/project";
import type { Milestone } from "@/types";

interface MilestoneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  /** The milestone being edited, or null to create one. */
  milestone: Milestone | null;
}

export function MilestoneDialog({ open, onOpenChange, projectId, milestone }: MilestoneDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <MilestoneForm
          key={milestone?.id ?? "new"}
          projectId={projectId}
          milestone={milestone}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function MilestoneForm({
  projectId,
  milestone,
  onDone,
}: {
  projectId: string;
  milestone: Milestone | null;
  onDone: () => void;
}) {
  const [fields, setFields] = useState<MilestoneFields>({
    name: milestone?.name ?? "",
    deadline: milestone?.deadline ?? null,
  });
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pending, startTransition] = useTransition();

  function submit(event: React.FormEvent): void {
    event.preventDefault();
    const parsed = milestoneFieldsSchema.safeParse(fields);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the form");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = milestone
        ? await updateMilestone(milestone.id, parsed.data)
        : await createMilestone(projectId, parsed.data);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(milestone ? "Milestone updated" : "Milestone added");
      onDone();
    });
  }

  function remove(): void {
    if (!milestone) return;
    startTransition(async () => {
      const result = await deleteMilestone(milestone.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Milestone deleted");
      onDone();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <DialogHeader>
        <DialogTitle>{milestone ? "Edit milestone" : "New milestone"}</DialogTitle>
        <DialogDescription>
          {milestone ? "Deleting a milestone keeps its tasks in the project." : "A checkpoint within this project."}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-1.5">
        <Label htmlFor="milestone-name">Name</Label>
        <Input
          id="milestone-name"
          value={fields.name}
          onChange={(e) => setFields((f) => ({ ...f, name: e.target.value }))}
          autoFocus
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="milestone-deadline">Deadline</Label>
        <DatePicker
          id="milestone-deadline"
          value={fields.deadline}
          onChange={(v) => setFields((f) => ({ ...f, deadline: v }))}
        />
      </div>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <DialogFooter className="gap-2 sm:justify-between">
        {milestone ? (
          confirmDelete ? (
            <Button type="button" variant="destructive" onClick={remove} disabled={pending}>
              Confirm delete
            </Button>
          ) : (
            <Button type="button" variant="ghost" className="text-destructive" onClick={() => setConfirmDelete(true)}>
              Delete
            </Button>
          )
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onDone}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save"}
          </Button>
        </div>
      </DialogFooter>
    </form>
  );
}
