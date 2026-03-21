import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepIndicatorProps {
  steps: string[];
  currentStep: number;
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="w-full">
      {/* Horizontal layout (desktop) */}
      <ol className="hidden md:flex items-center w-full">
        {steps.map((label, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isFuture = index > currentStep;

          return (
            <li
              key={label}
              className={cn(
                "flex items-center",
                index < steps.length - 1 ? "flex-1" : ""
              )}
            >
              <div className="flex flex-col items-center gap-1.5">
                {/* Circle */}
                <div
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full text-sm font-semibold transition-all",
                    isCompleted
                      ? "bg-[#3B82F6] text-white"
                      : isCurrent
                      ? "bg-transparent text-[#3B82F6] ring-2 ring-[#3B82F6] ring-offset-2 ring-offset-[#0A0F1C]"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <Check className="size-4" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                {/* Label */}
                <span
                  className={cn(
                    "text-xs font-medium whitespace-nowrap",
                    isCompleted || isCurrent
                      ? "text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {label}
                </span>
              </div>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "flex-1 mx-2 mb-5 h-px transition-colors",
                    isCompleted ? "bg-[#3B82F6]" : "bg-border"
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>

      {/* Vertical layout (mobile) */}
      <ol className="flex md:hidden flex-col gap-0">
        {steps.map((label, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;

          return (
            <li key={label} className="flex gap-3">
              <div className="flex flex-col items-center">
                {/* Circle */}
                <div
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-all",
                    isCompleted
                      ? "bg-[#3B82F6] text-white"
                      : isCurrent
                      ? "bg-transparent text-[#3B82F6] ring-2 ring-[#3B82F6] ring-offset-2 ring-offset-[#0A0F1C]"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <Check className="size-3.5" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                {/* Vertical connector */}
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "my-1 w-px flex-1 min-h-[1.5rem] transition-colors",
                      isCompleted ? "bg-[#3B82F6]" : "bg-border"
                    )}
                  />
                )}
              </div>
              <div className="pb-4 pt-0.5">
                <span
                  className={cn(
                    "text-sm font-medium",
                    isCompleted || isCurrent
                      ? "text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {label}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export default StepIndicator;
