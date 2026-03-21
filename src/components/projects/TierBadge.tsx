import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ProjectTier } from "@/types/project";

interface TierBadgeProps {
  tier: ProjectTier;
  className?: string;
}

export function TierBadge({ tier, className }: TierBadgeProps) {
  if (tier === "STATIC") {
    return (
      <Badge
        className={cn(
          "bg-blue-600/20 text-blue-400 border border-blue-600/30 hover:bg-blue-600/30",
          className
        )}
      >
        Static
      </Badge>
    );
  }

  if (tier === "DYNAMIC") {
    return (
      <Badge
        className={cn(
          "bg-purple-600/20 text-purple-400 border border-purple-600/30 hover:bg-purple-600/30",
          className
        )}
      >
        Dynamic
      </Badge>
    );
  }

  // FULLSTACK: gradient badge
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center rounded-4xl px-2 text-xs font-medium text-white",
        "bg-gradient-to-r from-blue-600 to-purple-600",
        className
      )}
    >
      Full-Stack
    </span>
  );
}

export default TierBadge;
