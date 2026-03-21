import type { Metadata } from "next";
import Link from "next/link";
import { Zap } from "lucide-react";

export const metadata: Metadata = {
  title: {
    template: "%s | AI-Auto-SaaS",
    default: "Auth | AI-Auto-SaaS",
  },
};

export const dynamic = "force-dynamic";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-[#0A0F1C]">
      {/* Left side: branding / illustration */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col items-center justify-center p-12">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0A0F1C] via-[#0D1B3E] to-[#0A1628]" />

        {/* Animated grid pattern */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(rgba(59, 130, 246, 0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59, 130, 246, 0.3) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }}
        />

        {/* Glow orbs */}
        <div className="absolute top-1/4 left-1/3 w-64 h-64 bg-[#3B82F6]/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-48 h-48 bg-blue-600/15 rounded-full blur-2xl" />

        {/* Content */}
        <div className="relative z-10 max-w-md text-center space-y-8">
          <Link href="/" className="flex items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#3B82F6] flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Zap className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-[#F8FAFC]">
              AI-Auto-SaaS
            </span>
          </Link>

          <div className="space-y-4">
            <h2 className="text-3xl font-bold text-[#F8FAFC] leading-tight">
              Build your SaaS{" "}
              <span className="text-[#3B82F6]">in minutes</span>,
              <br />
              not months.
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed">
              Describe your idea. Our AI builds the codebase, pushes to GitHub,
              and deploys — automatically.
            </p>
          </div>

          {/* Feature bullets */}
          <div className="space-y-3 text-left">
            {[
              "AI generates production-ready code",
              "Automatic GitHub repository creation",
              "Multi-tier architecture support",
              "Deploy anywhere with one click",
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-[#3B82F6]/20 border border-[#3B82F6]/40 flex items-center justify-center flex-shrink-0">
                  <div className="w-2 h-2 rounded-full bg-[#3B82F6]" />
                </div>
                <span className="text-slate-300 text-sm">{feature}</span>
              </div>
            ))}
          </div>

          {/* Social proof */}
          <div className="pt-4 border-t border-white/10">
            <p className="text-slate-500 text-sm">
              Trusted by{" "}
              <span className="text-[#F8FAFC] font-semibold">500+</span>{" "}
              developers and indie hackers
            </p>
          </div>
        </div>
      </div>

      {/* Right side: form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center justify-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-lg bg-[#3B82F6] flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-[#F8FAFC]">
              AI-Auto-SaaS
            </span>
          </div>

          {/* Auth card */}
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-8 shadow-2xl shadow-black/50 backdrop-blur-sm">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
