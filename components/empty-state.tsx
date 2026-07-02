import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  eyebrow,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  eyebrow?: string;
}) {
  return (
    <div className="relative flex min-h-80 flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed border-blue-100 bg-card p-8 text-center shadow-[0_22px_56px_rgba(37,99,235,0.06)]">
      <div className="absolute inset-x-12 top-0 h-28 rounded-full bg-primary/10 blur-3xl" />
      {eyebrow && (
        <div className="relative mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <Icon className="h-3.5 w-3.5" />
          {eyebrow}
        </div>
      )}

      <p className="relative max-w-xl text-2xl font-semibold tracking-normal sm:text-3xl">
        {title}
      </p>
      {description && (
        <p className="relative mt-3 max-w-lg text-sm leading-6 text-muted-foreground sm:text-base">
          {description}
        </p>
      )}
    </div>
  );
}
