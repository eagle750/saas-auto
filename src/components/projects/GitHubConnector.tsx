"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle, XCircle, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

const schema = z.object({
  repo: z
    .string()
    .min(1, "Repository is required")
    .regex(
      /^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/,
      'Must be in format "owner/repo-name"'
    ),
  pat: z.string().min(1, "Personal access token is required"),
});

type FormValues = z.infer<typeof schema>;

interface GitHubConnectorProps {
  onVerified: (repo: string, pat: string) => void;
  value?: { repo: string };
}

type VerifyState = "idle" | "loading" | "success" | "error";

export function GitHubConnector({ onVerified, value }: GitHubConnectorProps) {
  const [verifyState, setVerifyState] = useState<VerifyState>("idle");
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      repo: value?.repo ?? "",
      pat: "",
    },
  });

  async function onSubmit(data: FormValues) {
    setVerifyState("loading");
    setVerifyError(null);

    try {
      const res = await fetch("/api/github/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repo: data.repo, pat: data.pat }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `Verification failed (${res.status})`);
      }

      setVerifyState("success");
      onVerified(data.repo, data.pat);
    } catch (err) {
      setVerifyState("error");
      setVerifyError(
        err instanceof Error ? err.message : "Verification failed."
      );
    }
  }

  const isSuccess = verifyState === "success";

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Repo URL field */}
        <div className="space-y-1.5">
          <label
            htmlFor="github-repo"
            className="text-sm font-medium text-foreground"
          >
            GitHub Repository
          </label>
          <Input
            id="github-repo"
            placeholder="owner/repo-name"
            autoComplete="off"
            disabled={isSuccess}
            {...register("repo")}
            className={cn(
              errors.repo ? "border-red-500 focus-visible:ring-red-500/30" : ""
            )}
          />
          {errors.repo && (
            <p className="text-xs text-red-400">{errors.repo.message}</p>
          )}
          <p className="text-xs text-muted-foreground">
            e.g. <span className="font-mono">acme-corp/my-saas-app</span>
          </p>
        </div>

        {/* PAT field */}
        <div className="space-y-1.5">
          <label
            htmlFor="github-pat"
            className="text-sm font-medium text-foreground"
          >
            Personal Access Token (PAT)
          </label>
          <Input
            id="github-pat"
            type="password"
            placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
            autoComplete="off"
            disabled={isSuccess}
            {...register("pat")}
            className={cn(
              errors.pat ? "border-red-500 focus-visible:ring-red-500/30" : ""
            )}
          />
          {errors.pat && (
            <p className="text-xs text-red-400">{errors.pat.message}</p>
          )}
        </div>

        {/* Verify button */}
        <Button
          type="submit"
          disabled={verifyState === "loading" || isSuccess}
          className="w-full"
        >
          {verifyState === "loading" ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Verifying…
            </>
          ) : isSuccess ? (
            <>
              <CheckCircle className="mr-2 size-4 text-[#10B981]" />
              Connected to {getValues("repo")}
            </>
          ) : (
            "Verify Connection"
          )}
        </Button>

        {/* Error state */}
        {verifyState === "error" && verifyError && (
          <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-400">
            <XCircle className="mt-0.5 size-4 shrink-0" />
            <span>{verifyError}</span>
          </div>
        )}

        {/* Success state */}
        {isSuccess && (
          <div className="flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-sm text-emerald-400">
            <CheckCircle className="mt-0.5 size-4 shrink-0" />
            <span>
              Repository verified. AI-Auto-SaaS has access to push code.
            </span>
          </div>
        )}
      </form>

      {/* How to create a PAT */}
      <Accordion>
        <AccordionItem value="how-to-pat">
          <AccordionTrigger className="text-sm text-muted-foreground">
            How to create a Personal Access Token
          </AccordionTrigger>
          <AccordionContent>
            <ol className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="font-semibold text-foreground shrink-0">1.</span>
                <span>
                  Go to{" "}
                  <a
                    href="https://github.com/settings/tokens"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline inline-flex items-center gap-0.5"
                  >
                    GitHub Settings → Developer Settings → Personal Access Tokens
                    <ExternalLink className="size-3" />
                  </a>
                </span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-foreground shrink-0">2.</span>
                <span>
                  Click <strong className="text-foreground">Generate new token (classic)</strong> and give
                  it a descriptive name like <em>AI-Auto-SaaS</em>.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-foreground shrink-0">3.</span>
                <span>
                  Set an expiration date (90 days recommended for security).
                </span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-foreground shrink-0">4.</span>
                <span>
                  Select the <strong className="text-foreground">repo</strong> scope to allow
                  reading and writing to your repositories.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-foreground shrink-0">5.</span>
                <span>
                  Click <strong className="text-foreground">Generate token</strong> and copy it
                  immediately — it won&apos;t be shown again.
                </span>
              </li>
            </ol>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

export default GitHubConnector;
