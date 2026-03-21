import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { UsageMeter } from "@/components/billing/UsageMeter";
import { Button } from "@/components/ui/button";
import { Plus, Zap, CheckCircle2, Clock, FolderKanban } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
};

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [projects, subscription] = await Promise.all([
    prisma.project.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        buildLogs: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    }),
    prisma.subscription.findUnique({
      where: { userId: session.user.id },
    }),
  ]);

  const completed = projects.filter((p) => p.status === "COMPLETED").length;
  const inProgress = projects.filter(
    (p) => !["DRAFT", "COMPLETED", "FAILED"].includes(p.status)
  ).length;
  const draft = projects.filter((p) => p.status === "DRAFT").length;

  const firstName = session.user.name?.split(" ")[0] ?? "there";

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#F8FAFC]">
            Welcome back, {firstName}!
          </h1>
          <p className="text-slate-400 mt-1">
            Here&apos;s an overview of your AI-generated SaaS projects.
          </p>
        </div>
        <Button
          asChild
          className="bg-[#3B82F6] hover:bg-[#2563EB] text-white font-semibold shrink-0"
        >
          <Link href="/new-project">
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Link>
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center gap-2 mb-2">
            <FolderKanban className="h-4 w-4 text-slate-400" />
            <p className="text-sm text-slate-400">Total Projects</p>
          </div>
          <p className="text-3xl font-bold text-[#F8FAFC]">{projects.length}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <p className="text-sm text-slate-400">Completed</p>
          </div>
          <p className="text-3xl font-bold text-[#F8FAFC]">{completed}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-[#3B82F6]" />
            <p className="text-sm text-slate-400">In Progress</p>
          </div>
          <p className="text-3xl font-bold text-[#F8FAFC]">{inProgress}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-4 w-4 text-amber-400" />
            <p className="text-sm text-slate-400">Drafts</p>
          </div>
          <p className="text-3xl font-bold text-[#F8FAFC]">{draft}</p>
        </div>
      </div>

      {/* Usage Meter */}
      {subscription && (
        <UsageMeter
          used={subscription.generationsUsed}
          limit={subscription.generationsLimit}
          plan={
            subscription.plan as "FREE" | "STARTER" | "PRO" | "ENTERPRISE"
          }
        />
      )}

      {/* Projects Grid */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-semibold text-[#F8FAFC]">
            Your Projects
          </h2>
          {projects.length > 0 && (
            <span className="text-sm text-slate-400">
              {projects.length} project{projects.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {projects.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-white/10 p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-5">
              <Zap className="h-8 w-8 text-[#3B82F6]" />
            </div>
            <h3 className="text-xl font-semibold text-[#F8FAFC] mb-2">
              No projects yet
            </h3>
            <p className="text-slate-400 mb-8 max-w-sm mx-auto">
              Describe your SaaS idea and let AI build a complete codebase,
              configure the stack, and push to GitHub.
            </p>
            <Button
              asChild
              className="bg-[#3B82F6] hover:bg-[#2563EB] text-white font-semibold"
            >
              <Link href="/new-project">
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Project
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                project={project as any}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
