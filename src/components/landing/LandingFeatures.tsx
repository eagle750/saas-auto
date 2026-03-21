"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Zap, Github, Layers, Activity, Shield, Globe } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "AI-Powered Generation",
    desc: "Claude + Gemini collaboratively plan and write your entire codebase with production-quality code.",
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
  },
  {
    icon: Github,
    title: "GitHub Push",
    desc: "Generated code lands directly in your GitHub repository in a single commit, ready to deploy.",
    color: "text-purple-400",
    bg: "bg-purple-500/10 border-purple-500/20",
  },
  {
    icon: Layers,
    title: "Multi-Tier Projects",
    desc: "From simple landing pages to full-stack SaaS with auth, payments, databases, and admin panels.",
    color: "text-indigo-400",
    bg: "bg-indigo-500/10 border-indigo-500/20",
  },
  {
    icon: Activity,
    title: "Real-Time Progress",
    desc: "Watch your project build in real-time with a live streaming build log — file by file.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
  },
  {
    icon: Shield,
    title: "Self-Review & Fix",
    desc: "AI reviews its own code and automatically fixes issues before pushing to your repo.",
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
  },
  {
    icon: Globe,
    title: "Deploy Anywhere",
    desc: "Get tailored deployment guides for Vercel, Railway, Render, Netlify, or Docker.",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10 border-cyan-500/20",
  },
];

export function LandingFeatures() {
  return (
    <section className="py-20">
      <div className="max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-[#F8FAFC] mb-4">
            Everything you need to ship
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            From architecture planning to code generation, self-review, and deployment.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map(({ icon: Icon, title, desc, color, bg }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              whileHover={{ y: -4 }}
            >
              <Card className="h-full bg-white/[0.02] border-white/10 hover:border-white/20 transition-colors">
                <CardContent className="pt-6">
                  <div
                    className={`w-11 h-11 rounded-xl border ${bg} flex items-center justify-center mb-4`}
                  >
                    <Icon className={`h-5 w-5 ${color}`} />
                  </div>
                  <h3 className="font-semibold text-[#F8FAFC] mb-2">{title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
