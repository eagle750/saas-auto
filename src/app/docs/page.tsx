import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Code2, Rocket, Zap } from "lucide-react";

export const metadata: Metadata = {
  title: "Documentation | AI-Auto-SaaS",
  description: "Learn how to use AI-Auto-SaaS to build and deploy your SaaS applications.",
};

const sections = [
  {
    icon: Rocket,
    title: "Getting Started",
    description: "Create your first AI-generated SaaS project in under 5 minutes.",
    items: [
      "Sign up and connect your GitHub account",
      "Describe your SaaS idea in plain English",
      "Review and customize the generated code",
      "Deploy with one click",
    ],
  },
  {
    icon: Code2,
    title: "Project Generation",
    description: "Understand what AI-Auto-SaaS generates and how to customize it.",
    items: [
      "Full-stack Next.js application",
      "Database schema and migrations",
      "Authentication and authorization",
      "Stripe billing integration",
    ],
  },
  {
    icon: Zap,
    title: "Plans & Limits",
    description: "Overview of available plans and generation limits.",
    items: [
      "Free: 2 project generations",
      "Pro: 50 generations per month",
      "Enterprise: Unlimited generations",
      "All plans include GitHub integration",
    ],
  },
];

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-[#0A0F1C]">
      <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#3B82F6]/10 border border-[#3B82F6]/20 px-4 py-1.5 text-sm text-[#3B82F6] mb-6">
            <BookOpen className="w-4 h-4" />
            Documentation
          </div>
          <h1 className="text-4xl font-bold text-[#F8FAFC] sm:text-5xl">
            How it works
          </h1>
          <p className="mt-4 text-lg text-slate-400 max-w-2xl mx-auto">
            Everything you need to know about generating, customizing, and deploying
            your AI-powered SaaS applications.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-12">
          {sections.map((section) => (
            <div
              key={section.title}
              className="bg-white/[0.03] border border-white/10 rounded-2xl p-8"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="w-10 h-10 rounded-lg bg-[#3B82F6]/10 border border-[#3B82F6]/20 flex items-center justify-center flex-shrink-0">
                  <section.icon className="w-5 h-5 text-[#3B82F6]" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-[#F8FAFC]">
                    {section.title}
                  </h2>
                  <p className="text-slate-400 text-sm mt-1">
                    {section.description}
                  </p>
                </div>
              </div>
              <ul className="space-y-3 ml-14">
                {section.items.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-slate-300 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <p className="text-slate-400 mb-4">Ready to build your SaaS?</p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-lg bg-[#3B82F6] px-6 py-3 text-sm font-semibold text-white hover:bg-[#2563EB] transition-colors"
          >
            Get Started Free
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
