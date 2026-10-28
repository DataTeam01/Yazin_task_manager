"use client";

import type { RefObject } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ProjectOption } from "@/lib/queries/projects";
import { ALL, EMPTY_FILTERS, NONE, hasActiveFilters, type TaskFilters } from "@/lib/tasks/filters";
import type { Tag, TaskPriority } from "@/types";

interface BoardFiltersProps {
  filters: TaskFilters;
  onChange: (filters: TaskFilters) => void;
  projects: readonly ProjectOption[];
  tags: readonly Tag[];
  searchRef: RefObject<HTMLInputElement | null>;
  shown: number;
  total: number;
}

export function BoardFilters({ filters, onChange, projects, tags, searchRef, shown, total }: BoardFiltersProps) {
  const active = hasActiveFilters(filters);
  const patch = (changes: Partial<TaskFilters>): void => onChange({ ...filters, ...changes });

  return (
    <search aria-label="Filter tasks" className="mb-5 flex flex-wrap items-center gap-2">
      <div className="relative min-w-[12rem] flex-1 sm:max-w-xs">
        <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden />
        <Input
          ref={searchRef}
          type="search"
          value={filters.query}
          onChange={(e) => patch({ query: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              patch({ query: "" });
              e.currentTarget.blur();
            }
          }}
          placeholder="Search tasks  ( / )"
          aria-label="Search tasks"
          className="pl-8"
        />
      </div>

      <Select value={filters.project} onValueChange={(project) => patch({ project })}>
        <SelectTrigger className="w-[9.5rem]" aria-label="Filter by project">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All projects</SelectItem>
          <SelectItem value={NONE}>No project</SelectItem>
          {projects.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.priority} onValueChange={(priority) => patch({ priority: priority as TaskFilters["priority"] })}>
        <SelectTrigger className="w-[8.5rem]" aria-label="Filter by priority">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Any priority</SelectItem>
          {(["high", "medium", "low"] satisfies TaskPriority[]).map((p) => (
            <SelectItem key={p} value={p}>
              {p[0]?.toUpperCase()}
              {p.slice(1)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {tags.length > 0 ? (
        <Select value={filters.tag} onValueChange={(tag) => patch({ tag })}>
          <SelectTrigger className="w-[8.5rem]" aria-label="Filter by tag">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Any tag</SelectItem>
            {tags.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}

      {active ? (
        <>
          <Button variant="ghost" size="sm" onClick={() => onChange(EMPTY_FILTERS)}>
            <X className="mr-1 h-4 w-4" aria-hidden />
            Clear
          </Button>
          <span className="text-sm text-muted-foreground" role="status">
            {shown} of {total} shown
          </span>
        </>
      ) : null}
    </search>
  );
}
