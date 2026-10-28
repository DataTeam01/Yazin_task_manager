export type ActionResult<T = null> = { ok: true; data: T } | { ok: false; error: string };

export function fail(message: string): { ok: false; error: string } {
  return { ok: false, error: message };
}
