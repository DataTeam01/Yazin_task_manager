import { describe, expect, it } from "vitest";
import { countByStatus, progressPercent } from "./progress";

describe("progressPercent", () => {
  it("is 0 when there are no tasks", () => {
    expect(progressPercent(0, 0)).toBe(0);
  });

  it("rounds to a whole number", () => {
    expect(progressPercent(1, 3)).toBe(33);
    expect(progressPercent(2, 3)).toBe(67);
  });

  it("reaches 100 when everything is done", () => {
    expect(progressPercent(4, 4)).toBe(100);
  });

  it("never exceeds 100", () => {
    expect(progressPercent(5, 4)).toBe(100);
  });
});

describe("countByStatus", () => {
  it("counts each status and the total", () => {
    const counts = countByStatus([
      { status: "todo" },
      { status: "doing" },
      { status: "done" },
      { status: "done" },
    ]);
    expect(counts).toEqual({ todo: 1, doing: 1, done: 2, total: 4 });
  });

  it("handles an empty list", () => {
    expect(countByStatus([])).toEqual({ todo: 0, doing: 0, done: 0, total: 0 });
  });
});
