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
    bg: "bg-blue-500/10 border-blue-500/20",
  },
  {
    step: "02",
    icon: Settings,
    title: "Configure",
    desc: "Choose your database, auth provider, payment platform, and deployment target. Smart defaults speed you up.",
    color: "text-purple-400",
    bg: "bg-purple-500/10 border-purple-500/20",
  },
  {
    step: "03",
    icon: GitBranch,
    title: "Deploy",
    desc: "Your complete codebase lands in your GitHub repo in minutes — reviewed, validated, and ready to ship.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
  },
];

export function LandingProcess() {
  return (
    <section className="py-20 bg-white/[0.02] border-y border-white/5">
      <div className="max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-[#F8FAFC] mb-4">
            How it works
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            Three steps from idea to working SaaS. No setup required.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connecting line (desktop) */}
          <div className="hidden md:block absolute top-12 left-[calc(16.67%+2rem)] right-[calc(16.67%+2rem)] h-px bg-gradient-to-r from-blue-500/30 via-purple-500/30 to-emerald-500/30" />

          {steps.map(({ step, icon: Icon, title, desc, color, bg }, i) => (
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="text-center relative"
            >
              <div
                className={`w-14 h-14 rounded-2xl border ${bg} flex items-center justify-center mx-auto mb-4 relative z-10`}
              >
                <Icon className={`h-7 w-7 ${color}`} />
              </div>
              <div className={`text-xs font-mono ${color} mb-2 tracking-widest`}>
                STEP {step}
              </div>
              <h3 className="text-xl font-semibold text-[#F8FAFC] mb-2">{title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
