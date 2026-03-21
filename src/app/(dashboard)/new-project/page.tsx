"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { StepIndicator } from "@/components/shared/StepIndicator";
import { RequirementInput } from "@/components/projects/RequirementInput";
import { TechStackSelector } from "@/components/projects/TechStackSelector";
import { GitHubConnector } from "@/components/projects/GitHubConnector";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  ArrowRight,
  Zap,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import type { ProjectTier, GenerationConfig } from "@/types/project";
import { TIER_LABELS, PLAN_PRICES } from "@/lib/constants";

const STEPS = ["Requirement", "Tier", "Tech Stack", "GitHub", "Review & Pay"];

const TIER_DESCRIPTIONS: Record<
  ProjectTier,
  { desc: string; features: string[]; price: number }
> = {
  STATIC: {
    desc: "Landing pages, portfolios, and blogs — no backend needed.",
    features: ["HTML/CSS/JS", "SEO optimized", "Fast CDN deployment"],
    price: PLAN_PRICES.FREE,
  },
  DYNAMIC: {
    desc: "Single-page apps with APIs and a database.",
    features: ["REST API", "Database CRUD", "Authentication"],
    price: PLAN_PRICES.STARTER,
  },
  FULLSTACK: {
    desc: "Complete SaaS with auth, payments, multi-page routing.",
    features: [
      "Full auth flow",
      "Stripe billing",
      "Admin panel",
      "Email notifications",
    ],
    price: PLAN_PRICES.PRO,
  },
};

export default function NewProjectPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);

  const [requirement, setRequirement] = useState("");
  const [detectedTier, setDetectedTier] = useState<ProjectTier>("DYNAMIC");
  const [selectedTier, setSelectedTier] = useState<ProjectTier | null>(null);
  const [config, setConfig] = useState<GenerationConfig>({ styling: "shadcn" });
  const [github, setGitHub] = useState<{ repo: string; pat: string } | null>(
    null
  );

  const tier = selectedTier ?? detectedTier;

  const handleNext = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const handlePrev = () => setStep((s) => Math.max(s - 1, 0));

  const canProceed = () => {
    if (step === 0) return requirement.trim().length > 20;
    if (step === 3) return github !== null;
    return true;
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const createRes = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: requirement.slice(0, 60).trim() || "My SaaS Project",
          requirement,
          tier,
          config: {
            ...config,
            ...(github ? { githubRepo: github.repo } : {}),
          },
          githubRepo: github?.repo,
          githubPat: github?.pat,
        }),
      });

      if (!createRes.ok) {
        const err = await createRes.json();
        throw new Error(err.error ?? "Failed to create project");
      }

      const { project } = await createRes.json();

      const genRes = await fetch(`/api/projects/${project.id}/generate`, {
        method: "POST",
      });

      if (!genRes.ok) {
        const err = await genRes.json();
        throw new Error(err.error ?? "Failed to start generation");
      }

      toast.success("Generation started! Taking you to build progress…");
      router.push(`/project/${project.id}`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Something went wrong. Try again."
      );
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#F8FAFC]">New Project</h1>
        <p className="text-slate-400 mt-1">
          Describe your SaaS idea and let AI build it for you — step by step.
        </p>
      </div>

      {/* Step Indicator */}
      <StepIndicator steps={STEPS} currentStep={step} />

      {/* Step Content with Framer Motion transitions */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          {/* Step 0: Requirement */}
          {step === 0 && (
            <Card className="bg-white/[0.03] border-white/10">
              <CardHeader>
                <CardTitle className="text-[#F8FAFC]">
                  Describe your SaaS
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Be specific — include features, target users, and any
                  integrations needed.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RequirementInput
                  value={requirement}
                  onChange={setRequirement}
                  onTierDetected={(t) => setDetectedTier(t)}
                />
              </CardContent>
            </Card>
          )}

          {/* Step 1: Tier Selection */}
          {step === 1 && (
            <Card className="bg-white/[0.03] border-white/10">
              <CardHeader>
                <CardTitle className="text-[#F8FAFC]">Project Tier</CardTitle>
                <CardDescription className="text-slate-400">
                  We detected{" "}
                  <span className="text-[#3B82F6] font-semibold">
                    {TIER_LABELS[detectedTier]}
                  </span>{" "}
                  for your idea. You can override below.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {(["STATIC", "DYNAMIC", "FULLSTACK"] as ProjectTier[]).map(
                  (t) => (
                    <button
                      key={t}
                      onClick={() => setSelectedTier(t)}
                      className={`w-full text-left rounded-xl border p-4 transition-all ${
                        tier === t
                          ? "border-[#3B82F6] bg-[#3B82F6]/10 ring-2 ring-[#3B82F6]/20"
                          : "border-white/10 hover:border-[#3B82F6]/50 bg-white/[0.02]"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-[#F8FAFC]">
                          {TIER_LABELS[t]}
                        </span>
                        {t === detectedTier && (
                          <Badge className="text-xs bg-[#3B82F6]/20 text-[#3B82F6] border-[#3B82F6]/30">
                            AI Detected
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-400 mb-2">
                        {TIER_DESCRIPTIONS[t].desc}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {TIER_DESCRIPTIONS[t].features.map((f) => (
                          <Badge
                            key={f}
                            variant="outline"
                            className="text-xs border-white/15 text-slate-400"
                          >
                            {f}
                          </Badge>
                        ))}
                      </div>
                    </button>
                  )
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 2: Tech Stack */}
          {step === 2 && (
            <Card className="bg-white/[0.03] border-white/10">
              <CardHeader>
                <CardTitle className="text-[#F8FAFC]">Tech Stack</CardTitle>
                <CardDescription className="text-slate-400">
                  Choose your preferred technologies. Smart defaults are
                  pre-selected for your tier.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TechStackSelector
                  value={config}
                  onChange={setConfig}
                  tier={tier}
                />
              </CardContent>
            </Card>
          )}

          {/* Step 3: GitHub */}
          {step === 3 && (
            <Card className="bg-white/[0.03] border-white/10">
              <CardHeader>
                <CardTitle className="text-[#F8FAFC]">
                  GitHub Repository
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Connect your GitHub so AI can push the generated code
                  directly.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <GitHubConnector
                  onVerified={(repo, pat) => setGitHub({ repo, pat })}
                  value={github ? { repo: github.repo } : undefined}
                />
              </CardContent>
            </Card>
          )}

          {/* Step 4: Review & Pay */}
          {step === 4 && (
            <Card className="bg-white/[0.03] border-white/10">
              <CardHeader>
                <CardTitle className="text-[#F8FAFC]">
                  Review &amp; Generate
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Review your configuration before we start building your SaaS.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Summary card */}
                <div className="rounded-xl bg-white/[0.04] border border-white/10 p-5 space-y-4 text-sm">
                  <div>
                    <span className="text-slate-500 text-xs uppercase tracking-wider">
                      Requirement
                    </span>
                    <p className="mt-1.5 text-[#F8FAFC] font-medium line-clamp-3 leading-relaxed">
                      {requirement}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-slate-500 text-xs uppercase tracking-wider">
                        Tier
                      </span>
                      <div className="mt-1.5">
                        <Badge className="bg-[#3B82F6]/20 text-[#3B82F6] border-[#3B82F6]/30">
                          {TIER_LABELS[tier]}
                        </Badge>
                      </div>
                    </div>

                    {config.database && (
                      <div>
                        <span className="text-slate-500 text-xs uppercase tracking-wider">
                          Database
                        </span>
                        <p className="mt-1.5 text-[#F8FAFC] capitalize">
                          {config.database}
                        </p>
                      </div>
                    )}

                    {config.auth && (
                      <div>
                        <span className="text-slate-500 text-xs uppercase tracking-wider">
                          Auth
                        </span>
                        <p className="mt-1.5 text-[#F8FAFC] capitalize">
                          {config.auth}
                        </p>
                      </div>
                    )}

                    {config.styling && (
                      <div>
                        <span className="text-slate-500 text-xs uppercase tracking-wider">
                          Styling
                        </span>
                        <p className="mt-1.5 text-[#F8FAFC] capitalize">
                          {config.styling}
                        </p>
                      </div>
                    )}
                  </div>

                  {github && (
                    <div>
                      <span className="text-slate-500 text-xs uppercase tracking-wider">
                        GitHub
                      </span>
                      <div className="mt-1.5 flex items-center gap-2">
                        <span className="font-mono text-xs text-[#F8FAFC] bg-white/5 px-2 py-1 rounded">
                          {github.repo}
                        </span>
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Price */}
                <div className="flex items-center justify-between rounded-xl bg-[#3B82F6]/10 border border-[#3B82F6]/20 p-4">
                  <div>
                    <p className="text-sm font-medium text-[#F8FAFC]">
                      Generation cost
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Deducted from your plan quota
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-[#3B82F6]">
                      1 credit
                    </p>
                  </div>
                </div>

                {/* Generate button */}
                <Button
                  size="lg"
                  className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold text-base h-12"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Building your SaaS…
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 h-5 w-5" />
                      Generate My SaaS
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={handlePrev}
          disabled={step === 0 || isGenerating}
          className="text-slate-400 hover:text-[#F8FAFC]"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        {step < STEPS.length - 1 && (
          <Button
            onClick={handleNext}
            disabled={!canProceed() || isGenerating}
            className="bg-[#3B82F6] hover:bg-[#2563EB] text-white"
          >
            Next
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
