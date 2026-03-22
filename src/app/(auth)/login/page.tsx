"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, Mail, Lock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const oauthError = searchParams.get("error");
  const oauthErrorMap: Record<string, string> = {
    OAuthAccountNotLinked: "An account with this email already exists. Please sign in with your original method.",
    OAuthCallbackError: "Something went wrong during sign-in. Please try again.",
    OAuthSignin: "Could not start the sign-in flow. Please try again.",
    OAuthCreateAccount: "Could not create your account. Please try again.",
    Configuration: "OAuth provider is not configured. Please check that GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and AUTH_SECRET are set in your environment variables.",
    Callback: "Something went wrong during sign-in. Please try again.",
    Default: "An unexpected error occurred. Please try again.",
  };
  const [authError, setAuthError] = useState<string | null>(
    oauthError ? (oauthErrorMap[oauthError] ?? oauthErrorMap.Default) : null
  );
  const [oauthLoading, setOAuthLoading] = useState<"github" | "google" | null>(
    null
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginFormData) {
    setAuthError(null);
    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    if (result?.error) {
      setAuthError("Invalid email or password. Please try again.");
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
  }

  async function handleOAuth(provider: "github" | "google") {
    setOAuthLoading(provider);
    await signIn(provider, { callbackUrl });
  }

  return (
    <div className="w-full space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-[#F8FAFC]">Welcome back</h1>
        <p className="text-slate-400 mt-2 text-sm">
          Sign in to your AI-Auto-SaaS account
        </p>
      </div>

      {/* OAuth Buttons */}
      <div className="space-y-3">
        <Button
          type="button"
          variant="outline"
          className="w-full bg-white/5 border-white/10 text-[#F8FAFC] hover:bg-white/10 hover:text-[#F8FAFC]"
          onClick={() => handleOAuth("github")}
          disabled={oauthLoading !== null || isSubmitting}
        >
          {oauthLoading === "github" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
            </svg>
          )}
          Continue with GitHub
        </Button>

        <Button
          type="button"
          variant="outline"
          className="w-full bg-white/5 border-white/10 text-[#F8FAFC] hover:bg-white/10 hover:text-[#F8FAFC]"
          onClick={() => handleOAuth("google")}
          disabled={oauthLoading !== null || isSubmitting}
        >
          {oauthLoading === "google" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
          )}
          Continue with Google
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <Separator className="flex-1 bg-white/10" />
        <span className="text-xs text-slate-500">or continue with email</span>
        <Separator className="flex-1 bg-white/10" />
      </div>

      {/* Credentials Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {authError && (
          <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-sm text-red-400">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {authError}
          </div>
        )}

        <div className="space-y-1.5">
          <label
            htmlFor="email"
            className="text-sm font-medium text-slate-300"
          >
            Email address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              className="pl-9 bg-white/5 border-white/10 text-[#F8FAFC] placeholder:text-slate-600 focus:border-[#3B82F6] focus:ring-[#3B82F6]/20"
              {...register("email")}
            />
          </div>
          {errors.email && (
            <p className="text-xs text-red-400">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="password"
              className="text-sm font-medium text-slate-300"
            >
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-[#3B82F6] hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              className="pl-9 bg-white/5 border-white/10 text-[#F8FAFC] placeholder:text-slate-600 focus:border-[#3B82F6] focus:ring-[#3B82F6]/20"
              {...register("password")}
            />
          </div>
          {errors.password && (
            <p className="text-xs text-red-400">{errors.password.message}</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white font-semibold"
          disabled={isSubmitting || oauthLoading !== null}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Signing in…
            </>
          ) : (
            "Sign in"
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-slate-400">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="text-[#3B82F6] hover:underline font-medium"
        >
          Create one for free
        </Link>
      </p>
    </div>
  );
}
