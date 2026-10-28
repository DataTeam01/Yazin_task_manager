import { describe, expect, it } from "vitest";
import { bucketFor, groupByDeadline, tasksByDeadline } from "./deadlines";

const TODAY = "2026-10-27";

type T = Parameters<typeof groupByDeadline>[0][number];
const task = (over: Partial<T> & { id?: string }): T & { id: string } => ({
  id: "x",
  deadline: null,
  status: "todo",
  priority: "medium",
  position: 1,
  ...over,
});

describe("bucketFor", () => {
  it("puts past dates in overdue", () => {
    expect(bucketFor("2026-10-26", TODAY)).toBe("overdue");
  });

  it("puts today in today", () => {
    expect(bucketFor("2026-10-27", TODAY)).toBe("today");
  });

  it("covers tomorrow through today + 7 in next7", () => {
    expect(bucketFor("2026-10-28", TODAY)).toBe("next7");
    expect(bucketFor("2026-11-03", TODAY)).toBe("next7");
  });

  it("puts anything after today + 7 in later", () => {
    expect(bucketFor("2026-11-04", TODAY)).toBe("later");
  });

  it("handles month and year boundaries", () => {
    expect(bucketFor("2027-01-02", "2026-12-26")).toBe("next7");
    expect(bucketFor("2027-01-03", "2026-12-26")).toBe("later");
  });

  it("puts a missing deadline in none", () => {
    expect(bucketFor(null, TODAY)).toBe("none");
  });
});

describe("groupByDeadline", () => {
  it("excludes done tasks", () => {
    const groups = groupByDeadline([task({ id: "a", status: "done", deadline: "2026-10-01" })], TODAY);
    expect(groups.overdue).toHaveLength(0);
  });

  it("sorts by date, then priority, then position", () => {
    const groups = groupByDeadline(
      [
        task({ id: "late", deadline: "2026-10-20" }),
        task({ id: "early-low", deadline: "2026-10-10", priority: "low" }),
        task({ id: "early-high", deadline: "2026-10-10", priority: "high" }),
      ],
      TODAY,
    );
    expect(groups.overdue.map((t) => t.id)).toEqual(["early-high", "early-low", "late"]);
  });

  it("keeps doing tasks, which are still open", () => {
    const groups = groupByDeadline([task({ id: "d", status: "doing", deadline: TODAY })], TODAY);
    expect(groups.today.map((t) => t.id)).toEqual(["d"]);
  });

  it("returns empty buckets for no tasks", () => {
    expect(groupByDeadline([], TODAY)).toEqual({ overdue: [], today: [], next7: [], later: [], none: [] });
  });
});

describe("tasksByDeadline", () => {
  it("groups tasks by date and skips tasks without one", () => {
    const map = tasksByDeadline([
      { deadline: "2026-10-27" },
      { deadline: "2026-10-27" },
      { deadline: "2026-10-28" },
      { deadline: null },
    ]);
    expect(map.get("2026-10-27")).toHaveLength(2);
    expect(map.get("2026-10-28")).toHaveLength(1);
    expect(map.size).toBe(2);
  });
});
