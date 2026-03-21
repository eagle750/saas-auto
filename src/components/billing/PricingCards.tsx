"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Loader2, Zap } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PLAN_FEATURES, PLAN_PRICES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Plan } from "@/types/project";

interface PricingCardsProps {
  currentPlan?: Plan;
}

const PLANS: Plan[] = ["FREE", "STARTER", "PRO", "ENTERPRISE"];

const PLAN_LABELS: Record<Plan, string> = {
  FREE: "Free",
  STARTER: "Starter",
  PRO: "Pro",
  ENTERPRISE: "Enterprise",
};

const PLAN_DESCRIPTIONS: Record<Plan, string> = {
  FREE: "Perfect for trying out the platform",
  STARTER: "For indie developers and small teams",
  PRO: "For teams shipping products fast",
  ENTERPRISE: "For organizations at scale",
};

export function PricingCards({ currentPlan }: PricingCardsProps) {
  const [loadingPlan, setLoadingPlan] = useState<Plan | null>(null);

  async function handleSubscribe(plan: Plan) {
    if (plan === "FREE" || plan === currentPlan) return;
    setLoadingPlan(plan);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      if (!res.ok) throw new Error("Checkout failed");
      const data = (await res.json()) as { url?: string };
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      // Toast or error handling could be added here
    } finally {
      setLoadingPlan(null);
    }
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
      {PLANS.map((plan, index) => {
        const isCurrent = plan === currentPlan;
        const isPro = plan === "PRO";
        const price = PLAN_PRICES[plan];
        const features = PLAN_FEATURES[plan];
        const isLoading = loadingPlan === plan;
        const isFree = plan === "FREE";

        return (
          <motion.div
            key={plan}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: index * 0.08 }}
          >
            <Card
              className={cn(
                "relative flex h-full flex-col",
                isPro && "ring-2 ring-blue-500",
                isCurrent && !isPro && "ring-2 ring-emerald-500"
              )}
            >
              {/* Most popular badge */}
              {isPro && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-blue-600 text-white border-0 shadow-lg shadow-blue-600/25 px-3">
                    <Zap className="mr-1 size-3" />
                    Most Popular
                  </Badge>
                </div>
              )}

              {/* Current plan badge */}
              {isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-emerald-600 text-white border-0 shadow-lg shadow-emerald-600/25 px-3">
                    Current Plan
                  </Badge>
                </div>
              )}

              <CardHeader className={cn(isPro && "pt-6")}>
                <CardTitle>{PLAN_LABELS[plan]}</CardTitle>
                <CardDescription>{PLAN_DESCRIPTIONS[plan]}</CardDescription>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-foreground">
                    {isFree ? "Free" : `$${price}`}
                  </span>
                  {!isFree && (
                    <span className="text-sm text-muted-foreground">/month</span>
                  )}
                </div>
              </CardHeader>

              <CardContent className="flex-1">
                <ul className="space-y-2">
                  {features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 size-4 shrink-0 text-emerald-400" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                {isFree ? (
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled={isCurrent}
                    onClick={() => handleSubscribe(plan)}
                  >
                    {isCurrent ? "Current Plan" : "Get Started Free"}
                  </Button>
                ) : (
                  <Button
                    className={cn(
                      "w-full",
                      isPro &&
                        "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/25"
                    )}
                    variant={isPro ? "default" : "outline"}
                    disabled={isCurrent || isLoading}
                    onClick={() => handleSubscribe(plan)}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        Redirecting…
                      </>
                    ) : isCurrent ? (
                      "Current Plan"
                    ) : (
                      `Upgrade to ${PLAN_LABELS[plan]}`
                    )}
                  </Button>
                )}
              </CardFooter>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}

export default PricingCards;
