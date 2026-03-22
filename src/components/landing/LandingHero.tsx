"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Sparkles, Github, Zap } from "lucide-react";

export function LandingHero() {
  return (
    <section className="relative overflow-hidden py-28 md:py-40 px-6">
      {/* Mesh gradient background */}
      <div className="absolute inset-0 mesh-gradient pointer-events-none" />
      <div className="absolute inset-0 grid-bg pointer-events-none" />

      {/* Animated orbs */}
      <div className="absolute top-20 left-[10%] w-72 h-72 bg-emerald-500/20 rounded-full blur-[120px] animate-float pointer-events-none" />
      <div className="absolute bottom-20 right-[10%] w-96 h-96 bg-teal-500/15 rounded-full blur-[120px] animate-float pointer-events-none" style={{ animationDelay: "-3s" }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-cyan-500/8 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative max-w-5xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Badge
            variant="secondary"
            className="mb-8 text-sm px-4 py-2 border border-white/10 bg-white/[0.04] backdrop-blur-sm hover:bg-white/[0.08] transition-colors cursor-default"
          >
            <Sparkles className="h-3.5 w-3.5 mr-2 text-emerald-400" />
            Powered by Claude + Gemini AI
            <ArrowRight className="h-3.5 w-3.5 ml-2 text-slate-500" />
          </Badge>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-5xl sm:text-6xl md:text-8xl font-extrabold tracking-tight mb-8 leading-[0.95]"
        >
          <span className="gradient-text">Describe it.</span>
          <br />
          <span className="text-[#F8FAFC] mt-2 block">We build it.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed"
        >
          Tell us what SaaS you want. Our AI agents generate the complete codebase,
          push it to your GitHub repo, and provide deployment instructions — all in minutes.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Button
            size="lg"
            className="gradient-btn text-base px-8 py-6 font-semibold text-white border-0 rounded-xl"
            asChild
          >
            <Link href="/register">
              <Zap className="mr-2 h-5 w-5" />
              Start Building Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="text-base px-8 py-6 border-white/10 hover:bg-white/5 hover:border-emerald-500/30 text-[#F8FAFC] rounded-xl transition-all"
            asChild
          >
            <Link href="#pricing">
              View Pricing
            </Link>
          </Button>
        </motion.div>

        {/* Social proof stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-16 flex flex-wrap justify-center gap-8 md:gap-12"
        >
          {[
            { value: "500+", label: "Projects built" },
            { value: "2 min", label: "Avg. build time" },
            { value: "99%", label: "Code quality" },
          ].map(({ value, label }) => (
            <div key={label} className="text-center">
              <div className="text-2xl md:text-3xl font-bold gradient-text">{value}</div>
              <div className="text-sm text-slate-500 mt-1">{label}</div>
            </div>
          ))}
        </motion.div>

        {/* Trust markers */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.65 }}
          className="mt-10 flex flex-wrap justify-center gap-6 text-sm text-slate-500"
        >
          <span className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            No credit card required
          </span>
          <span className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            2 free projects
          </span>
          <span className="flex items-center gap-1.5">
            <Github className="h-3.5 w-3.5" />
            Push to GitHub instantly
          </span>
        </motion.div>
      </div>
    </section>
  );
}
