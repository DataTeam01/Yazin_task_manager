"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { ProjectDialog } from "@/components/project-dialog";
import { Button } from "@/components/ui/button";

export function NewProjectButton({ label = "New project" }: { label?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-1.5 h-4 w-4" aria-hidden />
        {label}
      </Button>
      <ProjectDialog open={open} onOpenChange={setOpen} project={null} />
    </>
  );
}
