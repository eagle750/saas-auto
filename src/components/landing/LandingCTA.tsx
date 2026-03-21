"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function LandingCTA() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/15 via-purple-600/8 to-transparent pointer-events-none" />

      <div className="relative max-w-3xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-[#F8FAFC] mb-4">
            Ready to build your SaaS?
          </h2>
          <p className="text-slate-400 mb-8 text-lg">
            Join hundreds of developers who&apos;ve shipped faster with AI-Auto-SaaS.
            Start for free, no credit card required.
          </p>
          <Button
            size="lg"
            className="text-base px-10 bg-[#3B82F6] hover:bg-[#2563EB] font-semibold"
            asChild
          >
            <Link href="/register">
              Start Building Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
