import type { Metadata } from "next";
import { Suspense } from "react";
import { PricingCards } from "@/components/billing/PricingCards";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingProcess } from "@/components/landing/LandingProcess";
import { LandingFeatures } from "@/components/landing/LandingFeatures";
import { LandingTestimonials } from "@/components/landing/LandingTestimonials";
import { LandingCTA } from "@/components/landing/LandingCTA";

export const metadata: Metadata = {
  title: "AI-Auto-SaaS — Build SaaS with AI",
  description:
    "Describe your SaaS idea and let AI build, configure, and deploy it for you. From concept to GitHub push in minutes.",
};

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#0A0F1C] text-[#F8FAFC]">
      {/* Hero */}
      <LandingHero />

      {/* 3-Step Process */}
      <div className="border-t border-white/[0.04]">
        <LandingProcess />
      </div>

      {/* Features Bento Grid */}
      <div className="border-t border-white/[0.04]">
        <LandingFeatures />
      </div>

      {/* Testimonials */}
      <div className="border-t border-white/[0.04]">
        <LandingTestimonials />
      </div>

      {/* Pricing */}
      <section
        id="pricing"
        className="py-24 px-6 w-full border-t border-white/[0.04] relative"
        aria-labelledby="pricing-heading"
      >
        <div className="absolute inset-0 grid-bg pointer-events-none" />

        <div className="relative max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-sm font-medium text-violet-400 tracking-widest uppercase mb-4 block">
              Pricing
            </span>
            <h2
              id="pricing-heading"
              className="text-4xl md:text-5xl font-bold text-[#F8FAFC] mb-5"
            >
              Simple, transparent{" "}
              <span className="gradient-text">pricing</span>
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Start free, scale as you grow. No hidden fees, no surprises.
            </p>
          </div>
          <Suspense
            fallback={
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-96 bg-white/[0.03] rounded-2xl border border-white/[0.06]"
                  />
                ))}
              </div>
            }
          >
            <PricingCards />
          </Suspense>
        </div>
      </section>

      {/* CTA Banner */}
      <div className="border-t border-white/[0.04]">
        <LandingCTA />
      </div>
    </div>
  );
}
