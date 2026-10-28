import type { Metadata, Viewport } from "next";
import { Inter, Fraunces } from "next/font/google";
import { AppNav } from "@/components/app-nav";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { GlobalShortcuts } from "@/components/global-shortcuts";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemedToaster } from "@/components/themed-toaster";
import "./globals.css";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });
const display = Fraunces({ subsets: ["latin"], variable: "--font-display" });

export const metadata: Metadata = {
  title: { default: "Tasks", template: "%s · Tasks" },
  description: "Personal task and project management",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf8f4" },
    { media: "(prefers-color-scheme: dark)", color: "#151311" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${sans.variable} ${display.variable}`}>
      <body className="font-sans">
        <ThemeProvider>
        <a
          href="#main"
          className="sr-only z-50 rounded-md bg-primary px-3 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
        >
          Skip to content
        </a>
        <div className="flex min-h-screen">
          <AppNav />
          <main id="main" className="min-w-0 flex-1 px-4 pb-24 pt-6 md:px-8 md:pb-10 md:pt-8">
            <div className="mb-5 flex items-center justify-between md:hidden">
              <Link href="/" className="font-display text-2xl tracking-tight">
                Yazin&apos;s Space<span className="text-primary">.</span>
              </Link>
              <ThemeToggle className="w-28" />
            </div>
            {children}
          </main>
        </div>
        <GlobalShortcuts />
        <ThemedToaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
