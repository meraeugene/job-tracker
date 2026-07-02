"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGroup, motion } from "framer-motion";
import {
  BriefcaseBusiness,
  Columns3,
  Mail,
  MessageSquareText,
  SquarePen,
  UserRound,
} from "lucide-react";
import { MiraLogo } from "@/components/mira-logo";
import { cn } from "@/utils/cn";

const items = [
  { label: "Profile", href: "/profile", icon: UserRound },
  { label: "Prepare", href: "/prepare", icon: SquarePen },
  { label: "Mira Board", href: "/board", icon: Columns3 },
  {
    label: "Job Applications",
    href: "/job-applications",
    icon: BriefcaseBusiness,
  },
  { label: "Cover Letters", href: "/cover-letters", icon: Mail },
  { label: "Interview Prep", href: "/interview-prep", icon: MessageSquareText },
];

function HeaderLinks() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed left-1/2 top-4 z-40 flex w-fit max-w-[calc(100%-1.5rem)] -translate-x-1/2 items-center justify-center gap-1 overflow-x-auto rounded-full border border-white/45 bg-white/25 p-2 shadow-[0_18px_60px_rgba(15,23,42,0.16)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/10"
    >
      <Link
        href="/profile"
        className="mr-5 flex h-12 shrink-0 items-center rounded-full px-2 text-primary transition hover:text-primary/80 sm:h-11"
        aria-label="Mira home"
      >
        <MiraLogo />
      </Link>
      <LayoutGroup id="main-navigation-pill">
        {items.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex h-12 shrink-0 items-center justify-center gap-2 overflow-hidden rounded-full px-4 text-sm font-medium transition sm:h-11",
                active
                  ? "text-white"
                  : "text-muted-foreground hover:bg-white/35 hover:text-foreground dark:hover:bg-white/10",
              )}
              title={item.label}
            >
              {active && (
                <motion.span
                  layoutId="nav-active-glue"
                  className="absolute inset-0 rounded-full bg-primary shadow-[0_8px_22px_rgba(37,99,235,0.32)]"
                  transition={{
                    type: "spring",
                    stiffness: 360,
                    damping: 30,
                    mass: 0.85,
                  }}
                />
              )}
              <Icon className="relative h-4 w-4 shrink-0" />
              <span className="relative whitespace-nowrap">{item.label}</span>
            </Link>
          );
        })}
      </LayoutGroup>
    </nav>
  );
}

export function AppHeader() {
  return <HeaderLinks />;
}

export function AppSidebar() {
  return <AppHeader />;
}
