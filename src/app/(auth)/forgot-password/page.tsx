"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Loader2, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const forgotSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotFormData = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotFormData>({
    resolver: zodResolver(forgotSchema),
  });

  async function onSubmit(_data: ForgotFormData) {
    // TODO: integrate password-reset API
    await new Promise((r) => setTimeout(r, 1000));
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="w-full space-y-6 text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
          <CheckCircle2 className="w-6 h-6 text-green-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#F8FAFC]">Check your email</h1>
          <p className="text-slate-400 mt-2 text-sm">
            If an account exists with that email, we&apos;ve sent password reset instructions.
          </p>
        </div>
        <Button variant="ghost" asChild className="text-[#3B82F6]">
          <Link href="/login">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to sign in
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-[#F8FAFC]">Reset your password</h1>
        <p className="text-slate-400 mt-2 text-sm">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium text-slate-300">
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

        <Button
          type="submit"
          className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white font-semibold"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Sending…
            </>
          ) : (
            "Send reset link"
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-slate-400">
        <Link href="/login" className="text-[#3B82F6] hover:underline font-medium inline-flex items-center gap-1">
          <ArrowLeft className="w-3 h-3" />
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
