import { Badge } from "@/components/ui/badge";

export function FitScoreBadge({ score }: { score: number }) {
  const tone =
    score >= 90
      ? "border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-200"
      : score >= 82
        ? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200"
        : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200";

  return <Badge className={tone}>{score}% fit</Badge>;
}
