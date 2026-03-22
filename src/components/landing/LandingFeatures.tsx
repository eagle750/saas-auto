"use client";

import { motion } from "framer-motion";
import { Zap, Github, Layers, Activity, Shield, Globe } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "AI-Powered Generation",
    desc: "Claude + Gemini collaboratively plan and write your entire codebase with production-quality code.",
    color: "text-blue-400",
    glowColor: "group-hover:shadow-blue-500/20",
    borderColor: "group-hover:border-blue-500/30",
    iconBg: "bg-blue-500/10",
    span: "md:col-span-2", // wide card
  },
  {
    icon: Github,
    title: "GitHub Push",
    desc: "Generated code lands directly in your GitHub repository in a single commit, ready to deploy.",
    color: "text-purple-400",
    glowColor: "group-hover:shadow-purple-500/20",
    borderColor: "group-hover:border-purple-500/30",
    iconBg: "bg-purple-500/10",
    span: "md:col-span-1",
  },
  {
    icon: Activity,
    title: "Real-Time Progress",
    desc: "Watch your project build in real-time with a live streaming build log — file by file.",
    color: "text-emerald-400",
    glowColor: "group-hover:shadow-emerald-500/20",
    borderColor: "group-hover:border-emerald-500/30",
    iconBg: "bg-emerald-500/10",
    span: "md:col-span-1",
  },
  {
    icon: Layers,
    title: "Multi-Tier Projects",
    desc: "From simple landing pages to full-stack SaaS with auth, payments, databases, and admin panels.",
    color: "text-indigo-400",
    glowColor: "group-hover:shadow-indigo-500/20",
    borderColor: "group-hover:border-indigo-500/30",
    iconBg: "bg-indigo-500/10",
    span: "md:col-span-2",
  },
  {
    icon: Shield,
    title: "Self-Review & Fix",
    desc: "AI reviews its own code and automatically fixes issues before pushing to your repo.",
    color: "text-amber-400",
    glowColor: "group-hover:shadow-amber-500/20",
    borderColor: "group-hover:border-amber-500/30",
    iconBg: "bg-amber-500/10",
    span: "md:col-span-1",
  },
  {
    icon: Globe,
    title: "Deploy Anywhere",
    desc: "Get tailored deployment guides for Vercel, Railway, Render, Netlify, or Docker.",
    color: "text-cyan-400",
    glowColor: "group-hover:shadow-cyan-500/20",
    borderColor: "group-hover:border-cyan-500/30",
    iconBg: "bg-cyan-500/10",
    span: "md:col-span-1",
  },
];

export function LandingFeatures() {
  return (
    <section id="features" className="py-24 relative">
      <div className="absolute inset-0 mesh-gradient opacity-50 pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-sm font-medium text-violet-400 tracking-widest uppercase mb-4 block">
            Features
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-[#F8FAFC] mb-5">
            Everything you need to{" "}
            <span className="gradient-text">ship</span>
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto text-lg">
            From architecture planning to code generation, self-review, and deployment.
          </p>
        </motion.div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {features.map(({ icon: Icon, title, desc, color, glowColor, borderColor, iconBg, span }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className={`group ${span}`}
            >
              <div
                className={`glow-card h-full rounded-2xl p-6 md:p-8 transition-all duration-300 ${glowColor} ${borderColor} group-hover:shadow-lg`}
              >
                <div
                  className={`w-12 h-12 rounded-xl ${iconBg} border border-white/5 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}
                >
                  <Icon className={`h-6 w-6 ${color}`} />
                </div>
                <h3 className="font-semibold text-lg text-[#F8FAFC] mb-2">{title}</h3>
                <p className="text-slate-400 leading-relaxed">{desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
