"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  BriefcaseBusiness,
  Columns3,
  Mail,
  MessageSquareText,
  SquarePen,
  UserRound,
  Menu,
  X,
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

/* ─── Large screen: inline pill nav (hidden below lg) ─── */
function DesktopNav() {
  const pathname = usePathname();

  return (
    <LayoutGroup id="desktop-nav-pill">
      <div className="hidden items-center gap-1 lg:flex">
        {items.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex h-11 shrink-0 items-center justify-center gap-2 overflow-hidden rounded-full px-4 text-sm font-medium transition",
                active
                  ? "text-white"
                  : "text-muted-foreground hover:bg-white/35 hover:text-foreground dark:hover:bg-white/10",
              )}
              title={item.label}
            >
              {active && (
                <motion.span
                  layoutId="desktop-active-pill"
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
      </div>
    </LayoutGroup>
  );
}

/* ─── Glassmorphic fullscreen overlay (portal) ─── */
const menuContainerVariants = {
  closed: { transition: { staggerChildren: 0.02, staggerDirection: -1 } },
  open: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};

const menuItemVariants = {
  closed: { opacity: 0, y: 16, filter: "blur(4px)" },
  open: { opacity: 1, y: 0, filter: "blur(0px)" },
};

function MobileOverlay({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Close on route change
  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  // Lock scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [open]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="mobile-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28, ease: "easeInOut" }}
          className="fixed inset-0 z-[100] flex flex-col overflow-y-auto"
        >
          {/* Glassmorphic backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-white/70 backdrop-blur-2xl dark:bg-[#0b141a]/85 dark:backdrop-blur-2xl"
          />

          {/* Header row — matches nav bar position exactly */}
          <div className="relative z-10 mx-auto flex w-[calc(100%-1.5rem)] items-center justify-between p-2 pt-[calc(1rem+0.5rem)]">
            <Link
              href="/profile"
              onClick={onClose}
              className="flex h-11 shrink-0 items-center rounded-full px-2 text-primary"
              aria-label="Mira home"
            >
              <MiraLogo />
            </Link>
            <button
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-black/5 dark:hover:bg-white/10"
              aria-label="Close menu"
            >
              <X className="h-6 w-6 text-foreground" strokeWidth={2.2} />
            </button>
          </div>

          {/* Nav items */}
          <motion.nav
            variants={menuContainerVariants}
            initial="closed"
            animate="open"
            exit="closed"
            className="relative z-10 flex flex-1 flex-col justify-center gap-1.5 px-6 py-8 sm:gap-2 sm:px-12 md:px-20"
          >
            {items.map((item) => {
              const active =
                pathname === item.href ||
                pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.href}
                  variants={menuItemVariants}
                  transition={{
                    type: "spring",
                    stiffness: 320,
                    damping: 26,
                  }}
                >
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "group flex items-center gap-4 rounded-2xl px-4 py-3.5 text-base font-medium transition-all duration-200 sm:px-5 sm:py-4 sm:text-lg",
                      active
                        ? "bg-primary/10 text-primary shadow-[inset_0_0_0_1px] shadow-primary/20 dark:bg-primary/15 dark:text-white"
                        : "text-foreground/60 hover:bg-muted/60 hover:text-foreground dark:text-white/50 dark:hover:bg-white/5 dark:hover:text-white/90",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200 sm:h-11 sm:w-11",
                        active
                          ? "bg-primary text-white shadow-[0_6px_20px_rgba(37,99,235,0.35)]"
                          : "bg-muted text-muted-foreground group-hover:bg-muted group-hover:text-foreground dark:bg-white/[0.08] dark:text-white/40 dark:group-hover:bg-white/[0.12] dark:group-hover:text-white/70",
                      )}
                    >
                      <Icon
                        className="h-[18px] w-[18px] sm:h-5 sm:w-5"
                        strokeWidth={active ? 2.2 : 1.8}
                      />
                    </span>
                    <span>{item.label}</span>
                    </Link>
                </motion.div>
              );
            })}
          </motion.nav>

          {/* Bottom accent */}
          <div className="relative z-10 px-8 pb-8">
            <div className="h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" />
            <p className="mt-3 text-center text-xs text-muted-foreground/50">
              Mira — Your application prep friend
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/* ─── Combined Header ─── */
function HeaderBar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleMenu = useCallback(() => setMenuOpen((v) => !v), []);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  return (
    <>
      <nav className="fixed left-1/2 top-4 z-40 flex w-[calc(100%-1.5rem)] -translate-x-1/2 items-center justify-between rounded-full border border-white/45 bg-white/25 p-2 shadow-[0_18px_60px_rgba(15,23,42,0.16)] backdrop-blur-2xl lg:w-fit lg:justify-center dark:border-white/10 dark:bg-white/10">
        {/* Logo */}
        <Link
          href="/profile"
          className="flex h-11 shrink-0 items-center rounded-full px-2 text-primary transition hover:text-primary/80 lg:mr-5"
          aria-label="Mira home"
        >
          <MiraLogo />
        </Link>

        {/* Large screen links */}
        <DesktopNav />

        {/* Mobile / tablet burger */}
        <button
          onClick={toggleMenu}
          className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-white/30 lg:hidden dark:hover:bg-white/10"
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6 text-foreground" strokeWidth={2.2} />
        </button>
      </nav>

      {/* Overlay via portal */}
      <MobileOverlay open={menuOpen} onClose={closeMenu} />
    </>
  );
}

/* ─── Exports ─── */
export function AppHeader() {
  return <HeaderBar />;
}

export function AppSidebar() {
  return <AppHeader />;
}
