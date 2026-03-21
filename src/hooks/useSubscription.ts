"use client";

import { useSession } from "next-auth/react";
import type { Plan } from "@/types/project";

interface UseSubscriptionResult {
  plan: Plan;
  generationsUsed: number;
  generationsLimit: number;
  canGenerate: boolean;
  isLoading: boolean;
}

export function useSubscription(): UseSubscriptionResult {
  const { data: session, status } = useSession();

  const isLoading = status === "loading";

  if (!session?.user) {
    return {
      plan: "FREE",
      generationsUsed: 0,
      generationsLimit: 2,
      canGenerate: false,
      isLoading,
    };
  }

  // The session.user object is augmented in the auth callbacks with subscription data
  const user = session.user as {
    plan?: Plan;
    generationsUsed?: number;
    generationsLimit?: number;
  };

  const plan: Plan = user.plan ?? "FREE";
  const generationsUsed: number = user.generationsUsed ?? 0;
  const generationsLimit: number = user.generationsLimit ?? 2;
  const canGenerate = generationsUsed < generationsLimit;

  return {
    plan,
    generationsUsed,
    generationsLimit,
    canGenerate,
    isLoading,
  };
}
