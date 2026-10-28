import { describe, expect, it } from "vitest";
import type { Task } from "@/types";
import { buildTimeline } from "./timeline";

let n = 0;
function task(over: Partial<Task>): Task {
  n += 1;
  return {
    id: `t${n}`,
    project_id: "p",
    milestone_id: null,
    parent_task_id: null,
    title: `Task ${n}`,
    description: null,
    status: "todo",
    priority: "medium",
    start_date: null,
    deadline: null,
    estimate_minutes: null,
    completed_at: null,
    position: n,
    created_at: "2026-10-01T00:00:00.000Z",
    updated_at: "2026-10-01T00:00:00.000Z",
    ...over,
  };
}
const NO_DATES = { start_date: null, deadline: null };

describe("buildTimeline", () => {
  it("returns null when no task has a date", () => {
    expect(buildTimeline([task({})], NO_DATES, "2026-10-27")).toBeNull();
  });

  it("lays bars out as percentages of an inclusive range", () => {
    // 10 days: 1 Nov .. 10 Nov
    const t = buildTimeline(
      [
        task({ id: "a", start_date: "2026-11-01", deadline: "2026-11-05" }),
        task({ id: "b", start_date: "2026-11-06", deadline: "2026-11-10" }),
      ],
      NO_DATES,
      "2026-10-01",
    );
    expect(t?.days).toBe(10);
    expect(t?.rows[0]).toMatchObject({ left: 0, width: 50 });
    expect(t?.rows[1]).toMatchObject({ left: 50, width: 50 });
  });

  it("gives a task with only a deadline a single-day bar", () => {
    const t = buildTimeline(
      [
        task({ start_date: "2026-11-01", deadline: "2026-11-10" }),
        task({ id: "d", deadline: "2026-11-05" }),
      ],
      NO_DATES,
      "2026-10-01",
    );
    const row = t?.rows.find((r) => r.task.id === "d");
    expect(row?.width).toBeCloseTo(10);
    expect(row?.left).toBeCloseTo(40);
  });

  it("widens the range to the project's own dates", () => {
    const t = buildTimeline(
      [task({ start_date: "2026-11-05", deadline: "2026-11-06" })],
      { start_date: "2026-11-01", deadline: "2026-11-10" },
      "2026-10-01",
    );
    expect(t?.start).toBe("2026-11-01");
    expect(t?.end).toBe("2026-11-10");
    expect(t?.days).toBe(10);
  });

  it("places the today marker only when today is inside the range", () => {
    const tasks = [task({ start_date: "2026-11-01", deadline: "2026-11-10" })];
    expect(buildTimeline(tasks, NO_DATES, "2026-11-01")?.todayLeft).toBeCloseTo(5);
    expect(buildTimeline(tasks, NO_DATES, "2026-10-31")?.todayLeft).toBeNull();
    expect(buildTimeline(tasks, NO_DATES, "2026-11-11")?.todayLeft).toBeNull();
  });

  it("sorts rows by start date and counts undated tasks and ignores subtasks", () => {
    const t = buildTimeline(
      [
        task({ id: "late", start_date: "2026-11-05", deadline: "2026-11-06" }),
        task({ id: "early", start_date: "2026-11-01", deadline: "2026-11-02" }),
        task({}),
        task({ parent_task_id: "late", start_date: "2026-01-01", deadline: "2026-01-02" }),
      ],
      NO_DATES,
      "2026-10-01",
    );
    expect(t?.rows.map((r) => r.task.id)).toEqual(["early", "late"]);
    expect(t?.undated).toBe(1);
    expect(t?.start).toBe("2026-11-01");
  });

  it("drops axis labels that would collide with the start label or the right edge", () => {
    // 1 Nov (Sun) .. 16 Nov (Mon), 16 days. Monday 2 Nov sits 6% after the start label (too close);
    // Monday 16 Nov sits at 94% (too close to the edge). Only 9 Nov survives besides 2 Nov.
    const t = buildTimeline([task({ start_date: "2026-11-01", deadline: "2026-11-16" })], NO_DATES, "2026-10-01");
    expect(t?.ticks.map((x) => x.label)).toEqual(["2 Nov", "9 Nov"]);
  });

  it("keeps the start label when the next tick is far enough away", () => {
    // 3 Nov (Tue) .. 23 Nov: first Monday is 9 Nov, 6 days (~29%) later.
    const t = buildTimeline([task({ start_date: "2026-11-03", deadline: "2026-11-23" })], NO_DATES, "2026-10-01");
    expect(t?.ticks[0]).toMatchObject({ label: "3 Nov", left: 0 });
  });
});
