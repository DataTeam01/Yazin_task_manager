"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarClock, ClipboardCheck, FolderKanban, LayoutGrid, type LucideIcon } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const ITEMS: readonly NavItem[] = [
  { href: "/", label: "Board", icon: LayoutGrid },
  { href: "/deadlines", label: "Deadlines", icon: CalendarClock },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/review", label: "Review", icon: ClipboardCheck },
];

function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function AppNav() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r bg-card/60 px-3 py-6 md:flex">
        <Link href="/" className="mb-8 px-3 font-display whitespace-nowrap text-xl tracking-tight">
          Yazin&apos;s Space<span className="text-primary">.</span>
        </Link>
        <nav aria-label="Main" className="flex flex-col gap-1">
          {ITEMS.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
                  active && "bg-accent text-foreground",
                )}
              >
                <Icon className={cn("h-4 w-4", active && "text-primary")} aria-hidden />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto space-y-4 px-1">
          <ThemeToggle />
        <p className="px-2 text-xs text-muted-foreground">
          <kbd className="rounded border bg-background px-1.5 py-0.5 font-mono">n</kbd> new task
          <br />
          <kbd className="mt-1.5 inline-block rounded border bg-background px-1.5 py-0.5 font-mono">/</kbd> search
        </p>
        </div>
      </aside>

      {/* Mobile bottom bar */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-col items-center gap-1 py-2.5 text-xs font-medium text-muted-foreground",
                active && "text-primary",
              )}
            >
              <Icon className="h-5 w-5" aria-hidden />
              {label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
