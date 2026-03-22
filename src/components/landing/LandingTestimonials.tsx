"use client";

import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Sarah K.",
    role: "Indie Hacker",
    quote:
      "I shipped a complete SaaS idea in under an hour. The code quality actually surprised me — proper TypeScript, error handling, everything.",
    rating: 5,
    avatar: "SK",
    gradient: "from-blue-500 to-violet-600",
  },
  {
    name: "Marcus T.",
    role: "Startup Founder",
    quote:
      "It handled Stripe billing, auth, and a full dashboard. Saved me at least two weeks of boilerplate work.",
    rating: 5,
    avatar: "MT",
    gradient: "from-violet-500 to-fuchsia-600",
  },
  {
    name: "Priya N.",
    role: "Solo Developer",
    quote:
      "The real-time build log is genuinely addicting to watch. Feels like having a senior engineer pair-programming with you.",
    rating: 5,
    avatar: "PN",
    gradient: "from-emerald-500 to-cyan-600",
  },
];

export function LandingTestimonials() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 grid-bg pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-sm font-medium text-violet-400 tracking-widest uppercase mb-4 block">
            Testimonials
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-[#F8FAFC] mb-5">
            Loved by{" "}
            <span className="gradient-text">builders</span>
          </h2>
          <p className="text-slate-400 text-lg">
            Join hundreds of developers shipping faster with AI-Auto-SaaS.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map(({ name, role, quote, rating, avatar, gradient }, i) => (
            <motion.div
              key={name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group"
            >
              <div className="glow-card h-full rounded-2xl p-6 md:p-8">
                <Quote className="h-8 w-8 text-white/5 mb-4" />
                <div className="flex mb-4">
                  {Array.from({ length: rating }).map((_, j) => (
                    <Star
                      key={j}
                      className="h-4 w-4 text-amber-400 fill-amber-400"
                    />
                  ))}
                </div>
                <p className="text-slate-300 mb-6 leading-relaxed">
                  &ldquo;{quote}&rdquo;
                </p>
                <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                  <div
                    className={`w-10 h-10 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-xs font-bold text-white shrink-0`}
                  >
                    {avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-[#F8FAFC]">{name}</p>
                    <p className="text-xs text-slate-500">{role}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
