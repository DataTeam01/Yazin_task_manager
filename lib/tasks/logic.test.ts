import { describe, expect, it } from "vitest";
import { nextCompletedAt, positionBetween } from "./logic";

const NOW = new Date("2026-10-27T10:00:00.000Z");

describe("nextCompletedAt", () => {
  it("sets a timestamp when a task becomes done", () => {
    expect(nextCompletedAt("doing", null, "done", NOW)).toBe(NOW.toISOString());
  });

  it("keeps the original timestamp while the task stays done", () => {
    expect(nextCompletedAt("done", "2026-10-01T00:00:00.000Z", "done", NOW)).toBe("2026-10-01T00:00:00.000Z");
  });

  it("clears the timestamp when moved back out of done", () => {
    expect(nextCompletedAt("done", "2026-10-01T00:00:00.000Z", "todo", NOW)).toBeNull();
  });

  it("stays null for open tasks", () => {
    expect(nextCompletedAt("todo", null, "doing", NOW)).toBeNull();
  });
});

describe("positionBetween", () => {
  it("returns the midpoint between two neighbours", () => {
    expect(positionBetween(1, 3)).toBe(2);
  });

  it("goes after the last item", () => {
    expect(positionBetween(5, undefined)).toBe(6);
  });

  it("goes before the first item", () => {
    expect(positionBetween(undefined, 5)).toBe(4);
  });

  it("starts an empty column at 1", () => {
    expect(positionBetween(undefined, undefined)).toBe(1);
  });
});
