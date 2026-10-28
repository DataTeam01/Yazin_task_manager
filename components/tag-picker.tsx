"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Tag } from "@/types";

interface TagPickerProps {
  tags: readonly Tag[];
  selected: readonly string[];
  onChange: (ids: string[]) => void;
  /** Creates (or finds) a tag by name and resolves to it, or null on failure. */
  onCreate: (name: string) => Promise<Tag | null>;
}

/** Toggle chips for existing tags plus an input for new ones. Lives inside a form, so Enter must not submit it. */
export function TagPicker({ tags, selected, onChange, onCreate }: TagPickerProps) {
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);

  const toggle = (id: string): void =>
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);

  async function create(): Promise<void> {
    const name = draft.trim();
    if (!name || busy) return;
    setBusy(true);
    const tag = await onCreate(name);
    setBusy(false);
    if (!tag) return;
    if (!selected.includes(tag.id)) onChange([...selected, tag.id]);
    setDraft("");
  }

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">Tags</legend>
      {tags.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => {
            const on = selected.includes(tag.id);
            return (
              <button
                key={tag.id}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(tag.id)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors",
                  on ? "border-transparent bg-primary/15 font-medium" : "text-muted-foreground hover:bg-accent",
                )}
              >
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: tag.color }} aria-hidden />
                {tag.name}
              </button>
            );
          })}
        </div>
      ) : null}
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void create();
            }
          }}
          placeholder="New tag…"
          aria-label="New tag name"
          disabled={busy}
        />
        <Button type="button" variant="outline" size="icon" aria-label="Add tag" onClick={() => void create()} disabled={busy || !draft.trim()}>
          <Plus className="h-4 w-4" aria-hidden />
        </Button>
      </div>
    </fieldset>
  );
}
