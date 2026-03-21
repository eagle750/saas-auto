"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Sarah K.",
    role: "Indie Hacker",
    quote:
      "I shipped a complete SaaS idea in under an hour. The code quality actually surprised me — proper TypeScript, error handling, everything.",
    rating: 5,
    avatar: "SK",
  },
  {
    name: "Marcus T.",
    role: "Startup Founder",
    quote:
      "It handled Stripe billing, auth, and a full dashboard. Saved me at least two weeks of boilerplate work.",
    rating: 5,
    avatar: "MT",
  },
  {
    name: "Priya N.",
    role: "Solo Developer",
    quote:
      "The real-time build log is genuinely addicting to watch. Feels like having a senior engineer pair-programming with you.",
    rating: 5,
    avatar: "PN",
  },
];

export function LandingTestimonials() {
  return (
    <section className="py-20 bg-white/[0.02] border-y border-white/5">
      <div className="max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-[#F8FAFC] mb-4">
            Loved by builders
          </h2>
          <p className="text-slate-400">
            Join hundreds of developers shipping faster with AI-Auto-SaaS.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map(({ name, role, quote, rating, avatar }, i) => (
            <motion.div
              key={name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
            >
              <Card className="h-full bg-white/[0.03] border-white/10">
                <CardContent className="pt-6">
                  <div className="flex mb-3">
                    {Array.from({ length: rating }).map((_, j) => (
                      <Star
                        key={j}
                        className="h-4 w-4 text-amber-400 fill-amber-400"
                      />
                    ))}
                  </div>
                  <p className="text-sm text-slate-400 mb-5 italic leading-relaxed">
                    &ldquo;{quote}&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
                      {avatar}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-[#F8FAFC]">{name}</p>
                      <p className="text-xs text-slate-500">{role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
