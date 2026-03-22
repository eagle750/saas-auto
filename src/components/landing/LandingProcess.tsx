"use client";

import { motion } from "framer-motion";
import { Code2, Settings, GitBranch } from "lucide-react";

const steps = [
  {
    step: "01",
    icon: Code2,
    title: "Describe",
    desc: "Tell us what you want to build in plain English. Include features, integrations, and target users.",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    glow: "shadow-blue-500/20",
    lineColor: "from-blue-500",
  },
  {
    step: "02",
    icon: Settings,
    title: "Configure",
    desc: "Choose your database, auth provider, payment platform, and deployment target. Smart defaults speed you up.",
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    glow: "shadow-violet-500/20",
    lineColor: "via-violet-500",
  },
  {
    step: "03",
    icon: GitBranch,
    title: "Deploy",
    desc: "Your complete codebase lands in your GitHub repo in minutes — reviewed, validated, and ready to ship.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    glow: "shadow-emerald-500/20",
    lineColor: "to-emerald-500",
  },
];

export function LandingProcess() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Subtle grid bg */}
      <div className="absolute inset-0 grid-bg pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="text-sm font-medium text-violet-400 tracking-widest uppercase mb-4 block">
            How it works
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-[#F8FAFC] mb-5">
            Three steps to{" "}
            <span className="gradient-text">launch</span>
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto text-lg">
            From idea to working SaaS. No setup required.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connecting line (desktop) */}
          <div className="hidden md:block absolute top-16 left-[calc(16.67%+2rem)] right-[calc(16.67%+2rem)] h-px bg-gradient-to-r from-blue-500/40 via-violet-500/40 to-emerald-500/40" />

          {steps.map(({ step, icon: Icon, title, desc, color, bg, glow }, i) => (
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="text-center relative group"
            >
              <div className="relative z-10 mx-auto mb-6">
                <div
                  className={`w-16 h-16 rounded-2xl border border-white/10 ${bg} flex items-center justify-center mx-auto transition-all duration-300 group-hover:${glow} group-hover:shadow-lg group-hover:scale-105`}
                >
                  <Icon className={`h-7 w-7 ${color}`} />
                </div>
              </div>
              <div className={`text-xs font-mono ${color} mb-3 tracking-[0.2em] uppercase`}>
                Step {step}
              </div>
              <h3 className="text-xl font-semibold text-[#F8FAFC] mb-3">{title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed max-w-xs mx-auto">{desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
