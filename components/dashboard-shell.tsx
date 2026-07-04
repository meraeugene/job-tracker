"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/app-sidebar";
import { useApplicationStore } from "@/hooks/use-application-store";
import { cn } from "@/utils/cn";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { resume } = useApplicationStore();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !resume) {
      router.replace(`/onboarding?next=${encodeURIComponent(pathname)}`);
    }
  }, [mounted, pathname, resume, router]);

  if (!mounted || !resume) {
    return (
      <div className="min-h-screen bg-background text-foreground animate-pulse">
        <AppHeader />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader />
      <main
        className={cn(
          "mx-auto w-full px-4 pb-12 pt-28 sm:px-6 lg:px-8",
          pathname === "/board"
            ? "max-w-full lg:max-w-[min(80vw,1540px)]"
            : "max-w-6xl",
        )}
      >
        {children}
      </main>
    </div>
  );
}
