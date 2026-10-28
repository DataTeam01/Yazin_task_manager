import { describe, expect, it } from "vitest";
import type { Task } from "@/types";
import { buildReview } from "./review";

// Tuesday 27 Oct 2026 (local noon). Week: Mon 26 Oct – Sun 1 Nov. Next week: Mon 2 Nov – Sun 8 Nov.
const NOW = new Date(2026, 9, 27, 12, 0, 0);

let n = 0;
function task(over: Partial<Task>): Task {
  n += 1;
  return {
    id: `t${n}`,
    project_id: null,
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

const at = (y: number, m: number, d: number, h = 12): string => new Date(y, m - 1, d, h).toISOString();

describe("buildReview", () => {
  it("reports the week and next-week ranges", () => {
    const r = buildReview([], NOW);
    expect([r.periodStart, r.periodEnd]).toEqual(["2026-10-26", "2026-11-01"]);
    expect([r.nextStart, r.nextEnd]).toEqual(["2026-11-02", "2026-11-08"]);
  });

  it("includes tasks completed this week, newest first, and ignores older ones", () => {
    const r = buildReview(
      [
        task({ id: "mon", status: "done", completed_at: at(2026, 10, 26) }),
        task({ id: "tue", status: "done", completed_at: at(2026, 10, 27) }),
        task({ id: "last-week", status: "done", completed_at: at(2026, 10, 25) }),
      ],
      NOW,
    );
    expect(r.completed.map((t) => t.id)).toEqual(["tue", "mon"]);
  });

  it("sums estimates for completed work", () => {
    const r = buildReview(
      [
        task({ status: "done", completed_at: at(2026, 10, 26), estimate_minutes: 30 }),
        task({ status: "done", completed_at: at(2026, 10, 27), estimate_minutes: 45 }),
        task({ status: "done", completed_at: at(2026, 10, 27) }),
      ],
      NOW,
    );
    expect(r.minutesCompleted).toBe(75);
  });

  it("lists open overdue tasks, most late first, with days late", () => {
    const r = buildReview(
      [
        task({ id: "a", deadline: "2026-10-25" }),
        task({ id: "b", deadline: "2026-10-20", status: "doing" }),
        task({ id: "today", deadline: "2026-10-27" }),
        task({ id: "done", deadline: "2026-10-01", status: "done", completed_at: at(2026, 10, 2) }),
      ],
      NOW,
    );
    expect(r.slipped.map((s) => [s.task.id, s.daysLate])).toEqual([
      ["b", 7],
      ["a", 2],
    ]);
  });

  it("lists open tasks due next calendar week, soonest first", () => {
    const r = buildReview(
      [
        task({ id: "sun-this-week", deadline: "2026-11-01" }),
        task({ id: "mon", deadline: "2026-11-02" }),
        task({ id: "sun", deadline: "2026-11-08" }),
        task({ id: "after", deadline: "2026-11-09" }),
        task({ id: "done", deadline: "2026-11-03", status: "done", completed_at: at(2026, 10, 27) }),
      ],
      NOW,
    );
    expect(r.upcoming.map((t) => t.id)).toEqual(["mon", "sun"]);
  });

  it("ignores subtasks", () => {
    const r = buildReview([task({ parent_task_id: "p", deadline: "2026-10-01" })], NOW);
    expect(r.slipped).toHaveLength(0);
  });

  it("covers the whole month or quarter when asked", () => {
    const m = buildReview([], NOW, "month");
    expect([m.periodStart, m.periodEnd]).toEqual(["2026-10-01", "2026-10-31"]);
    expect([m.nextStart, m.nextEnd]).toEqual(["2026-11-01", "2026-11-30"]);
    const q = buildReview([], NOW, "quarter");
    expect([q.periodStart, q.periodEnd]).toEqual(["2026-10-01", "2026-12-31"]);
    expect([q.nextStart, q.nextEnd]).toEqual(["2027-01-01", "2027-03-31"]);
  });

  it("counts tasks finished earlier in the month under the month view only", () => {
    const early = task({ status: "done", completed_at: new Date(2026, 9, 5, 10).toISOString() });
    expect(buildReview([early], NOW, "week").completed).toHaveLength(0);
    expect(buildReview([early], NOW, "month").completed).toHaveLength(1);
    expect(buildReview([early], NOW, "quarter").completed).toHaveLength(1);
  });
});
