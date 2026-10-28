"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

/** True when the keystroke belongs to a text field or an open dialog rather than to the page. */
function isTypingContext(target: EventTarget | null): boolean {
  if (document.querySelector('[role="dialog"], [role="alertdialog"]')) return true;
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

/**
 * "n" starts a new task and "/" focuses search. Both live on the board, so from any other page
 * they navigate there first (the board reads `?action=`).
 */
export function GlobalShortcuts() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent): void {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTypingContext(event.target)) return;

      const action = event.key === "n" ? "new" : event.key === "/" ? "search" : null;
      if (!action) return;
      event.preventDefault();

      if (pathname === "/") {
        window.dispatchEvent(new CustomEvent(action === "new" ? "app:new-task" : "app:focus-search"));
      } else {
        router.push(`/?action=${action}`);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [pathname, router]);

  return null;
}
