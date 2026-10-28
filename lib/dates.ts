import { endOfWeek, format, parseISO, startOfDay, startOfWeek } from "date-fns";

const WEEK = { weekStartsOn: 1 } as const;

/** Local calendar date as yyyy-MM-dd (the format used by Postgres `date` columns). */
export function toDateString(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

/** Parses a yyyy-MM-dd string as local midnight (not UTC, so it never shifts a day). */
export function parseDateOnly(value: string): Date {
  return startOfDay(parseISO(value));
}

export function weekBounds(now: Date): { start: Date; end: Date } {
  return { start: startOfWeek(now, WEEK), end: endOfWeek(now, WEEK) };
}
