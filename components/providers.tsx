"use client";

import { SplashScreen } from "@/components/splash-screen";
import { useApplicationStore } from "@/hooks/use-application-store";
import { useEffect } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const loadStorage = useApplicationStore((state) => state.loadStorage);

  useEffect(() => {
    loadStorage();
  }, [loadStorage]);

  return (
    <>
      <SplashScreen />
      {children}
    </>
  );
}
