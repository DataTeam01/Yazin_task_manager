"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/** Light / dark / system theme. The choice is remembered in localStorage and defaults to the OS setting. */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
    </NextThemesProvider>
  );
}
