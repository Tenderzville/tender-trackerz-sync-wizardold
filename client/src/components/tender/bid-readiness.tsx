import { Link } from "wouter";
import { CheckCircle2, AlertTriangle, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useUserPreferences } from "@/hooks/use-user-preferences";
import { computeAlignment, type AlignmentTender } from "@/lib/bid-readiness";

function scoreColor(score: number) {
  if (score >= 75) return "text-green-600 dark:text-green-400";
  if (score >= 55) return "text-blue-600 dark:text-blue-400";
  if (score >= 35) return "text-yellow-600 dark:text-yellow-400";
  return "text-red-600 dark:text-red-400";
}

function useReadiness(tender: AlignmentTender) {
  const { data: prefs, isLoading } = useUserPreferences();
  return { isLoading, result: computeAlignment(prefs, tender) };
}

const SetPreferencesLink = () => (
  <Link href="/settings" className="font-medium text-primary underline inline-flex items-center gap-1">
    <Settings className="h-3 w-3" /> Set preferences to see your alignment score
  </Link>
);

/** One-line version for tender cards. */
export function BidReadiness({ tender }: { tender: AlignmentTender }) {
  const { isLoading, result } = useReadiness(tender);
  if (isLoading) return null;

  if (result.score === null) {
    return (
      <>
        <span className="mx-2">•</span>
        Bid Readiness: <span className="ml-1"><SetPreferencesLink /></span>
      </>
    );
  }

  const title = [...result.reasons, ...result.concerns].join(" · ");
  return (
    <>
      <span className="mx-2">•</span>
      <span title={title}>
        Bid Readiness:
        <span className={`font-semibold ml-1 ${scoreColor(result.score)}`}>{result.score}%</span>
        <span className="ml-1 text-xs">({result.level})</span>
      </span>
    </>
  );
}

/** Full version for the tender details modal. */
export function BidReadinessPanel({ tender }: { tender: AlignmentTender }) {
  const { isLoading, result } = useReadiness(tender);
  if (isLoading) return null;

  if (result.score === null) {
    return (
      <div className="rounded-lg border-2 border-primary/20 p-6 text-center">
        <p className="font-medium mb-1">Bid Readiness</p>
        <p className="text-sm text-muted-foreground mb-2">
          Tell us your sectors, counties or keywords and we will score how well this tender fits you.
        </p>
        <SetPreferencesLink />
      </div>
    );
  }

  return (
    <div className="rounded-lg border-2 border-primary/20 p-6">
      <div className="flex items-center gap-4 mb-4">
        <div className={`text-4xl font-bold ${scoreColor(result.score)}`}>{result.score}%</div>
        <div>
          <p className="text-sm font-medium">Bid Readiness</p>
          <Badge variant="outline">{result.level}</Badge>
        </div>
      </div>

      <ul className="space-y-1.5">
        {result.reasons.map((r) => (
          <li key={r} className="flex items-start gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
            <span>{r}</span>
          </li>
        ))}
        {result.concerns.map((c) => (
          <li key={c} className="flex items-start gap-2 text-sm">
            <AlertTriangle className="h-4 w-4 mt-0.5 text-yellow-600 flex-shrink-0" />
            <span>{c}</span>
          </li>
        ))}
      </ul>

      <p className="text-[11px] text-muted-foreground mt-4">
        Based on your saved preferences and what this tender publishes (sector, location, keywords, budget, time to
        prepare). It shows fit, not your chance of winning.
      </p>
    </div>
  );
}
