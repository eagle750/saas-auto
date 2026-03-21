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

      {/* 3-Step Process: Describe → Configure → Deploy */}
      <LandingProcess />

      {/* Features Grid (6 cards) */}
      <LandingFeatures />

      {/* Testimonials */}
      <LandingTestimonials />

      {/* Pricing */}
      <section
        id="pricing"
        className="py-24 px-6 w-full"
        aria-labelledby="pricing-heading"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2
              id="pricing-heading"
              className="text-4xl font-bold text-[#F8FAFC] mb-4"
            >
              Simple, transparent pricing
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
                    className="h-96 bg-white/5 rounded-2xl border border-white/10"
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
      <LandingCTA />
    </div>
  );
}
