import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { PricingCards } from "@/components/billing/PricingCards";
import { UsageMeter } from "@/components/billing/UsageMeter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Calendar, Zap, CheckCircle2 } from "lucide-react";
import type { Metadata } from "next";
import type { Plan } from "@/types/project";

export const metadata: Metadata = {
  title: "Billing",
};

export const dynamic = "force-dynamic";

const PLAN_PERKS: Record<string, string[]> = {
  FREE: ["2 AI generations / month", "STATIC tier only", "Community support"],
  STARTER: [
    "10 generations / month",
    "STATIC + DYNAMIC tiers",
    "Email support",
    "GitHub push",
  ],
  PRO: [
    "Unlimited generations",
    "All tiers including FULLSTACK",
    "Priority support",
    "Custom domains",
    "Team seats",
  ],
  ENTERPRISE: [
    "Everything in PRO",
    "Dedicated infrastructure",
    "SLA guarantee",
    "Custom integrations",
  ],
};

export default async function BillingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const subscription = await prisma.subscription.findUnique({
    where: { userId: session.user.id },
  });

  const plan = (subscription?.plan ?? "FREE") as Plan;
  const perks = PLAN_PERKS[plan] ?? [];

  return (
    <div className="space-y-10 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#F8FAFC]">Billing</h1>
        <p className="text-slate-400 mt-1">
          Manage your subscription and track AI generation usage.
        </p>
      </div>

      {/* Current Plan Card */}
      <Card className="bg-white/[0.03] border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#F8FAFC]">
            <CreditCard className="h-5 w-5 text-[#3B82F6]" />
            Current Plan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#3B82F6]/20 border border-[#3B82F6]/30 flex items-center justify-center">
                <Zap className="w-5 h-5 text-[#3B82F6]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-[#F8FAFC]">
                    {plan}
                  </span>
                  <Badge
                    variant="outline"
                    className="text-xs border-white/15 text-slate-400 capitalize"
                  >
                    {subscription?.status ?? "active"}
                  </Badge>
                </div>
                <p className="text-sm text-slate-400 mt-0.5">
                  {subscription?.generationsUsed ?? 0} /{" "}
                  {subscription?.generationsLimit ?? 2} generations used this
                  month
                </p>
              </div>
            </div>
          </div>

          {/* Perks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {perks.map((perk) => (
              <div key={perk} className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span className="text-sm text-slate-300">{perk}</span>
              </div>
            ))}
          </div>

          {/* Billing cycle */}
          {subscription?.currentPeriodEnd && (
            <div className="flex items-center gap-2 text-sm text-slate-400 pt-2 border-t border-white/10">
              <Calendar className="h-4 w-4 text-slate-500" />
              <span>
                Next billing date:{" "}
                <span className="text-[#F8FAFC] font-medium">
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString(
                    "en-US",
                    {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    }
                  )}
                </span>
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage Meter */}
      {subscription && (
        <UsageMeter
          used={subscription.generationsUsed}
          limit={subscription.generationsLimit}
          plan={plan}
        />
      )}

      {/* Upgrade / Change Plan */}
      <div>
        <h2 className="text-xl font-semibold text-[#F8FAFC] mb-2">
          {plan === "FREE" ? "Upgrade Your Plan" : "Change Plan"}
        </h2>
        <p className="text-slate-400 text-sm mb-7">
          {plan === "FREE"
            ? "Unlock more generations and advanced tiers."
            : "Switch to a plan that fits your needs."}
        </p>
        <PricingCards currentPlan={plan} />
      </div>
    </div>
  );
}
