"use client";

import { useEffect, useState } from "react";

export function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const fadeTimer = window.setTimeout(() => setFadeOut(true), 1800);
    const hideTimer = window.setTimeout(() => setVisible(false), 2400);
    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-white dark:bg-[#0b141a]"
      style={{
        transition: "opacity 600ms ease",
        opacity: fadeOut ? 0 : 1,
        pointerEvents: fadeOut ? "none" : "auto",
      }}
    >
      {/* Radial glow behind logo */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="h-64 w-64 rounded-full bg-primary/8"
          style={{ filter: "blur(60px)" }}
        />
      </div>

      <div className="relative flex flex-col items-center">
        {/* Wordmark — Creative Reveal Animation */}
        <div className="flex items-center  overflow-hidden px-6 py-3">
          <img
            src="/Mira.png"
            alt="M"
            className="h-16 w-16 object-contain sm:h-24 sm:w-24"
            style={{
              animation: "splash-logo-reveal 0.9s cubic-bezier(0.34, 1.56, 0.64, 1) both",
            }}
          />
          <span
            className="text-3xl font-semibold tracking-tight text-blue-600 dark:text-[#e9edef] sm:text-5xl"
            style={{
              animation: "splash-text-slide 0.75s cubic-bezier(0.16, 1, 0.3, 1) 0.55s both",
            }}
          >
            ira
          </span>
        </div>
      </div>
    </div>
  );
}
