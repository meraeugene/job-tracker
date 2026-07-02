"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { AppHeader } from "@/components/app-sidebar";
import { useApplicationStore } from "@/hooks/use-application-store";
import { cn } from "@/utils/cn";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { resume } = useApplicationStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!resume) {
      router.replace(`/onboarding?next=${encodeURIComponent(pathname)}`);
    }
  }, [pathname, resume, router]);

  if (!resume) {
    return (
      <div className="min-h-screen bg-background text-foreground">
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
            ? "max-w-[min(80vw,1540px)]"
            : "max-w-6xl",
        )}
      >
        {children}
      </main>
    </div>
  );
}
