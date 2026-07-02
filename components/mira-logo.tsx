import { cn } from "@/utils/cn";

export function MiraLogo({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center font-semibold tracking-normal text-primary",
        compact ? "text-xl" : "text-base",
        className,
      )}
    >
      {compact ? "M" : "Mira"}
    </span>
  );
}
