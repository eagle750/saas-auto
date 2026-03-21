import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE_CLASSES = {
  sm: "size-4 border-2",
  md: "size-8 border-2",
  lg: "size-12 border-[3px]",
};

export function LoadingSpinner({
  size = "md",
  className,
}: LoadingSpinnerProps) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn(
        "animate-spin rounded-full border-transparent border-t-blue-500",
        SIZE_CLASSES[size],
        "border-muted",
        "border-t-[#3B82F6]",
        className
      )}
    />
  );
}

export function FullPageLoader({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex min-h-screen items-center justify-center bg-[#0A0F1C]",
        className
      )}
    >
      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner size="lg" />
        <p className="text-sm text-muted-foreground animate-pulse">Loading…</p>
      </div>
    </div>
  );
}

export default LoadingSpinner;
