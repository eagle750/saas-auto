import Link from "next/link";
import {
  Progress,
  ProgressTrack,
  ProgressIndicator,
  ProgressLabel,
  ProgressValue,
} from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { Plan } from "@/types/project";

interface UsageMeterProps {
  used: number;
  limit: number;
  plan: Plan;
}

export function UsageMeter({ used, limit, plan }: UsageMeterProps) {
  const isUnlimited = limit >= 9999;
  const percentage = isUnlimited ? 0 : Math.min((used / limit) * 100, 100);
  const isNearLimit = percentage >= 80;
  const isAtLimit = percentage >= 100;
  const showUpgrade = plan === "FREE" || isNearLimit;

  const indicatorClass = isAtLimit
    ? "bg-red-500"
    : isNearLimit
    ? "bg-amber-500"
    : "bg-emerald-500";

  const valueText = isUnlimited
    ? "Unlimited"
    : `${used} / ${limit}`;

  const valueClass = isUnlimited
    ? "text-emerald-400"
    : isAtLimit
    ? "text-red-400"
    : isNearLimit
    ? "text-amber-400"
    : "text-muted-foreground";

  return (
    <div className="space-y-2">
      <Progress value={isUnlimited ? 0 : percentage}>
        <ProgressLabel>Generations this month</ProgressLabel>
        <ProgressValue className={valueClass}>
          {() => valueText}
        </ProgressValue>
        <ProgressTrack className="h-2">
          <ProgressIndicator
            className={cn("transition-all duration-500", indicatorClass)}
            style={isUnlimited ? { width: "0%" } : { width: `${percentage}%` }}
          />
        </ProgressTrack>
      </Progress>

      {!isUnlimited && (
        <p className="text-xs text-muted-foreground">
          {isAtLimit ? (
            <span className="text-red-400">
              You&apos;ve reached your generation limit.{" "}
              <Link
                href="/billing"
                className="font-medium underline underline-offset-2 hover:text-red-300"
              >
                Upgrade now
              </Link>{" "}
              to continue.
            </span>
          ) : isNearLimit ? (
            <span className="text-amber-400">
              {limit - used} generation{limit - used !== 1 ? "s" : ""} remaining.{" "}
              <Link
                href="/billing"
                className="font-medium underline underline-offset-2 hover:text-amber-300"
              >
                Upgrade
              </Link>{" "}
              to get more.
            </span>
          ) : (
            <>
              {used} of {limit} generations used this month.
              {showUpgrade && (
                <>
                  {" "}
                  <Link
                    href="/billing"
                    className="font-medium text-blue-400 underline underline-offset-2 hover:text-blue-300"
                  >
                    Upgrade
                  </Link>{" "}
                  for more.
                </>
              )}
            </>
          )}
        </p>
      )}
    </div>
  );
}

export default UsageMeter;
