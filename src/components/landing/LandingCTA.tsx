"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap } from "lucide-react";

export function LandingCTA() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 mesh-gradient pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative max-w-3xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="glow-card rounded-3xl p-10 md:p-16">
            <h2 className="text-4xl md:text-5xl font-bold text-[#F8FAFC] mb-5">
              Ready to build your{" "}
              <span className="gradient-text">SaaS</span>?
            </h2>
            <p className="text-slate-400 mb-10 text-lg max-w-lg mx-auto">
              Join hundreds of developers who&apos;ve shipped faster with AI-Auto-SaaS.
              Start for free, no credit card required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="gradient-btn text-base px-10 py-6 font-semibold text-white border-0 rounded-xl"
                asChild
              >
                <Link href="/register">
                  <Zap className="mr-2 h-5 w-5" />
                  Start Building Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
