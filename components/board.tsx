"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { BoardColumn } from "@/components/board-column";
import { BoardFilters } from "@/components/board-filters";
import { PageHeader } from "@/components/page-header";
import { StatsStrip } from "@/components/stats-strip";
import { TaskDialog } from "@/components/task-dialog";
import { Button } from "@/components/ui/button";
import { moveTask } from "@/lib/actions/tasks";
import { toDateString } from "@/lib/dates";
import type { TaskDialogData } from "@/lib/queries/task-dialog";
import { EMPTY_FILTERS, hasActiveFilters, matchesFilters, type TaskFilters } from "@/lib/tasks/filters";
import { nextCompletedAt, positionBetween } from "@/lib/tasks/logic";
import { computeStats, subtaskProgress } from "@/lib/tasks/stats";
import { TASK_STATUSES, type Tag, type Task, type TaskStatus } from "@/types";

const COLUMNS: readonly { status: TaskStatus; title: string; hint: string }[] = [
  { status: "todo", title: "Going to work", hint: "Nothing queued. Add what's next above." },
  { status: "doing", title: "Working on", hint: "Drag a task here when you start it." },
  { status: "done", title: "Worked on", hint: "Finished tasks land here." },
];

interface BoardState {
  byId: Record<string, Task>;
  columns: Record<TaskStatus, string[]>;
}

function buildState(tasks: readonly Task[]): BoardState {
  const byId: Record<string, Task> = {};
  const columns: Record<TaskStatus, string[]> = { todo: [], doing: [], done: [] };
  const top = tasks.filter((t) => !t.parent_task_id).sort((a, b) => a.position - b.position);
  for (const task of top) {
    byId[task.id] = task;
    columns[task.status].push(task.id);
  }
  return { byId, columns };
}

function isStatus(value: string): value is TaskStatus {
  return (TASK_STATUSES as readonly string[]).includes(value);
}

interface BoardProps {
  tasks: Task[];
  data: TaskDialogData;
  /** Set by the global shortcuts when they fire from another page. */
  initialAction?: "new" | "search";
  /** Server-computed "today" used for the first render; replaced by the browser's local date on mount. */
  initialToday: string;
}

export function Board({ tasks, data, initialAction, initialToday }: BoardProps) {
  const router = useRouter();
  const { projects, tags, taskTags } = data;
  const [state, setState] = useState<BoardState>(() => buildState(tasks));
  const stateRef = useRef(state);
  stateRef.current = state;
  const snapshot = useRef<BoardState | null>(null);
  const dragging = useRef(false);

  const [today, setToday] = useState(initialToday);
  const [dialog, setDialog] = useState<{ open: boolean; task: Task | null; status: TaskStatus }>({
    open: false,
    task: null,
    status: "todo",
  });

  useEffect(() => setToday(toDateString(new Date())), []);

  const [filters, setFilters] = useState<TaskFilters>(EMPTY_FILTERS);
  const searchRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcuts ("n" new task, "/" search) arrive as window events from GlobalShortcuts.
  useEffect(() => {
    const onNew = (): void => setDialog({ open: true, task: null, status: "todo" });
    const onSearch = (): void => searchRef.current?.focus();
    window.addEventListener("app:new-task", onNew);
    window.addEventListener("app:focus-search", onSearch);
    return () => {
      window.removeEventListener("app:new-task", onNew);
      window.removeEventListener("app:focus-search", onSearch);
    };
  }, []);

  // The shortcut was pressed on another page: perform it here, then clean the URL.
  useEffect(() => {
    if (!initialAction) return;
    if (initialAction === "new") setDialog({ open: true, task: null, status: "todo" });
    else searchRef.current?.focus();
    router.replace("/");
  }, [initialAction, router]);

  // Re-sync with the server after revalidation (never mid-drag).
  useEffect(() => {
    if (!dragging.current) setState(buildState(tasks));
  }, [tasks]);

  const subtasks = useMemo(() => tasks.filter((t) => t.parent_task_id), [tasks]);
  const progress = useMemo(() => subtaskProgress(subtasks), [subtasks]);
  const projectsById = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects]);
  const tagIdsByTask = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const link of taskTags) {
      const set = map.get(link.task_id);
      if (set) set.add(link.tag_id);
      else map.set(link.task_id, new Set([link.tag_id]));
    }
    return map;
  }, [taskTags]);
  const tagsByTask = useMemo(() => {
    const byId = new Map(tags.map((t) => [t.id, t]));
    const map = new Map<string, Tag[]>();
    for (const [taskId, ids] of tagIdsByTask) {
      map.set(taskId, [...ids].flatMap((id) => byId.get(id) ?? []));
    }
    return map;
  }, [tags, tagIdsByTask]);
  const filtersActive = hasActiveFilters(filters);
  const stats = useMemo(
    () => computeStats([...Object.values(state.byId), ...subtasks], new Date(`${today}T12:00:00`)),
    [state.byId, subtasks, today],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function containerOf(s: BoardState, id: string): TaskStatus | null {
    if (isStatus(id)) return id;
    return TASK_STATUSES.find((status) => s.columns[status].includes(id)) ?? null;
  }

  function onDragStart(): void {
    dragging.current = true;
    snapshot.current = stateRef.current;
  }

  /** Moves the card into the hovered column live, so the drop target shows where it will land. */
  function onDragOver({ active, over }: DragOverEvent): void {
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);

    setState((prev) => {
      const from = containerOf(prev, activeId);
      const to = containerOf(prev, overId);
      if (!from || !to || from === to) return prev;

      const dest = prev.columns[to];
      const overIndex = isStatus(overId) ? dest.length : dest.indexOf(overId);
      const below =
        !isStatus(overId) &&
        active.rect.current.translated &&
        active.rect.current.translated.top > over.rect.top + over.rect.height / 2;
      const insertAt = isStatus(overId) ? dest.length : overIndex + (below ? 1 : 0);

      const moving = prev.byId[activeId];
      if (!moving) return prev;
      return {
        byId: {
          ...prev.byId,
          [activeId]: { ...moving, status: to, completed_at: nextCompletedAt(moving.status, moving.completed_at, to) },
        },
        columns: {
          ...prev.columns,
          [from]: prev.columns[from].filter((id) => id !== activeId),
          [to]: [...dest.slice(0, insertAt), activeId, ...dest.slice(insertAt)],
        },
      };
    });
  }

  function rollback(message: string): void {
    if (snapshot.current) setState(snapshot.current);
    toast.error(message);
  }

  async function onDragEnd({ active, over }: DragEndEvent): Promise<void> {
    const before = snapshot.current;
    snapshot.current = null;
    dragging.current = false;

    const activeId = String(active.id);
    const current = stateRef.current;
    if (!over || !before) {
      if (before) setState(before);
      return;
    }

    const status = containerOf(current, activeId);
    if (!status) return;

    let ids = current.columns[status];
    const overId = String(over.id);
    if (!isStatus(overId) && overId !== activeId && containerOf(current, overId) === status) {
      ids = arrayMove(ids, ids.indexOf(activeId), ids.indexOf(overId));
    }

    const index = ids.indexOf(activeId);
    const originalStatus = containerOf(before, activeId);
    if (originalStatus === status && before.columns[status].indexOf(activeId) === index) {
      setState((prev) => ({ ...prev, columns: { ...prev.columns, [status]: ids } }));
      return;
    }

    const prevTask = ids[index - 1] ? current.byId[ids[index - 1] as string] : undefined;
    const nextTask = ids[index + 1] ? current.byId[ids[index + 1] as string] : undefined;
    const position = positionBetween(prevTask?.position, nextTask?.position);

    const moved = current.byId[activeId];
    if (!moved) return;
    setState({
      byId: { ...current.byId, [activeId]: { ...moved, status, position } },
      columns: { ...current.columns, [status]: ids },
    });

    const result = await moveTask({ id: activeId, status, position });
    if (!result.ok) rollback(`Couldn't move task: ${result.error}`);
  }

  function onDragCancel(): void {
    dragging.current = false;
    if (snapshot.current) setState(snapshot.current);
    snapshot.current = null;
  }

  const openTask = (task: Task): void => setDialog({ open: true, task, status: task.status });
  const total = Object.keys(state.byId).length;
  const visibleIds = (status: TaskStatus): string[] =>
    state.columns[status].filter((id) => {
      const task = state.byId[id];
      return task ? matchesFilters(task, filters, tagIdsByTask.get(id)) : false;
    });
  const visibleCount = TASK_STATUSES.reduce((n, s) => n + visibleIds(s).length, 0);

  return (
    <>
      <PageHeader
        title="Board"
        description="What you're working on, what's done, and what's next."
        actions={
          <Button onClick={() => setDialog({ open: true, task: null, status: "todo" })}>
            <Plus className="mr-1.5 h-4 w-4" aria-hidden />
            New task
          </Button>
        }
      />

      <StatsStrip stats={stats} />

      <BoardFilters
        filters={filters}
        onChange={setFilters}
        projects={projects}
        tags={tags}
        searchRef={searchRef}
        shown={visibleCount}
        total={total}
      />

      {total === 0 ? (
        <p className="mb-4 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          Your board is empty. Add your first task in any column below, or use New task.
        </p>
      ) : null}

      <DndContext
        id="board-dnd"
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        onDragCancel={onDragCancel}
      >
        <div className="grid gap-4 lg:grid-cols-3">
          {COLUMNS.map((col) => (
            <BoardColumn
              key={col.status}
              status={col.status}
              title={col.title}
              hint={filtersActive ? "No tasks match your filters." : col.hint}
              tasks={visibleIds(col.status).flatMap((id) => {
                const task = state.byId[id];
                return task ? [task] : [];
              })}
              projectsById={projectsById}
              progress={progress}
              tagsByTask={tagsByTask}
              today={today}
              onOpen={openTask}
            />
          ))}
        </div>
      </DndContext>

      <TaskDialog
        open={dialog.open}
        onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}
        task={dialog.task}
        defaults={{ status: dialog.status }}
        data={data}
        allTasks={tasks}
      />
    </>
  );
}
