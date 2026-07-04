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
        "inline-flex items-center  font-semibold tracking-tight text-[#17130c] dark:text-[#e9edef]",
        compact ? "text-xl" : "text-base",
        className,
      )}
    >
      <img
        src="/Mira.png"
        alt="M"
        className={cn(
          "object-contain",
          compact ? "h-9 w-9" : "h-9 w-9",
        )}
      />
      {!compact && <span className="text-xl text-blue-600">ira</span>}
    </span>
  );
}
