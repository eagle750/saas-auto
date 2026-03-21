"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Sparkles } from "lucide-react";

export function LandingHero() {
  return (
    <section className="relative overflow-hidden py-24 md:py-36 px-6">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/15 via-purple-600/8 to-transparent pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-5xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Badge
            variant="secondary"
            className="mb-6 text-sm px-4 py-1.5 border border-white/10 bg-white/5"
          >
            <Sparkles className="h-3.5 w-3.5 mr-2 text-blue-400" />
            Powered by Claude + Gemini AI
          </Badge>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6"
        >
          <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-blue-500 bg-clip-text text-transparent">
            Describe it.
          </span>
          <br />
          <span className="text-[#F8FAFC]">We build it.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Tell us what SaaS you want. Our AI agents generate the complete codebase, push it
          to your GitHub repo, and provide deployment instructions — all in minutes.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Button
            size="lg"
            className="text-base px-8 bg-[#3B82F6] hover:bg-[#2563EB] font-semibold"
            asChild
          >
            <Link href="/register">
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="text-base px-8 border-white/10 hover:bg-white/5 text-[#F8FAFC]"
            asChild
          >
            <Link href="#pricing">View Pricing</Link>
          </Button>
        </motion.div>

        {/* Social proof */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-8 text-sm text-slate-500"
        >
          ✓ No credit card required &nbsp;·&nbsp; ✓ 2 free projects &nbsp;·&nbsp; ✓ Push to GitHub instantly
        </motion.p>
      </div>
    </section>
  );
}
