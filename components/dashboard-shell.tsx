"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { AppHeader } from "@/components/app-sidebar";
import { useApplicationStore } from "@/hooks/use-application-store";

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
      <main className="mx-auto w-full max-w-6xl px-4 pb-12 pt-28 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
