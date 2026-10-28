"use client";

import { useEffect, useState } from "react";
import { Monitor, Moon, Sun, type LucideIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

const OPTIONS: readonly { value: "light" | "dark" | "system"; label: string; icon: LucideIcon }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

/** Segmented Light / Dark / System control. */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  // The stored theme is only known in the browser; render nothing selected until mounted to avoid a hydration mismatch.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div role="radiogroup" aria-label="Colour theme" className={cn("flex rounded-lg border bg-background p-0.5", className)}>
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const selected = mounted && theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={`${label} theme`}
            title={`${label} theme`}
            onClick={() => setTheme(value)}
            className={cn(
              "flex flex-1 items-center justify-center rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground",
              selected && "bg-accent text-foreground shadow-sm",
            )}
          >
            <Icon className="h-4 w-4" aria-hidden />
          </button>
        );
      })}
    </div>
  );
}
