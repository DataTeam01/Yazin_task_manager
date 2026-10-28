import { describe, expect, it } from "vitest";
import { ALL, EMPTY_FILTERS, NONE, hasActiveFilters, matchesFilters, type TaskFilters } from "./filters";

const task = {
  title: "Write quarterly report",
  description: "Include the revenue chart",
  project_id: "p1",
  priority: "high" as const,
};
const f = (over: Partial<TaskFilters>): TaskFilters => ({ ...EMPTY_FILTERS, ...over });

describe("matchesFilters", () => {
  it("matches everything with empty filters", () => {
    expect(matchesFilters(task, EMPTY_FILTERS, undefined)).toBe(true);
  });

  it("filters by project, including 'none'", () => {
    expect(matchesFilters(task, f({ project: "p1" }), undefined)).toBe(true);
    expect(matchesFilters(task, f({ project: "p2" }), undefined)).toBe(false);
    expect(matchesFilters(task, f({ project: NONE }), undefined)).toBe(false);
    expect(matchesFilters({ ...task, project_id: null }, f({ project: NONE }), undefined)).toBe(true);
  });

  it("filters by priority", () => {
    expect(matchesFilters(task, f({ priority: "high" }), undefined)).toBe(true);
    expect(matchesFilters(task, f({ priority: "low" }), undefined)).toBe(false);
  });

  it("filters by tag", () => {
    expect(matchesFilters(task, f({ tag: "t1" }), new Set(["t1", "t2"]))).toBe(true);
    expect(matchesFilters(task, f({ tag: "t3" }), new Set(["t1"]))).toBe(false);
    expect(matchesFilters(task, f({ tag: "t1" }), undefined)).toBe(false);
  });

  it("searches title and notes case-insensitively", () => {
    expect(matchesFilters(task, f({ query: "QUARTERLY" }), undefined)).toBe(true);
    expect(matchesFilters(task, f({ query: "revenue" }), undefined)).toBe(true);
    expect(matchesFilters(task, f({ query: "missing" }), undefined)).toBe(false);
    expect(matchesFilters(task, f({ query: "   " }), undefined)).toBe(true);
  });

  it("requires every filter to match", () => {
    expect(matchesFilters(task, f({ project: "p1", priority: "low" }), undefined)).toBe(false);
  });
});

describe("hasActiveFilters", () => {
  it("is false for the empty filters and true once any is set", () => {
    expect(hasActiveFilters(EMPTY_FILTERS)).toBe(false);
    expect(hasActiveFilters(f({ query: "x" }))).toBe(true);
    expect(hasActiveFilters(f({ tag: "t1" }))).toBe(true);
    expect(hasActiveFilters(f({ project: ALL }))).toBe(false);
  });
});
