import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { TierBadge } from "@/components/projects/TierBadge";
import { BuildProgress } from "@/components/projects/BuildProgress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Github,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Clock,
  RotateCcw,
  FileCode2,
  ScrollText,
} from "lucide-react";
import { STATUS_LABELS } from "@/lib/constants";
import type { ProjectTier, ProjectStatus } from "@/types/project";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

const ACTIVE_STATUSES: ProjectStatus[] = [
  "QUEUED",
  "PLANNING",
  "GENERATING",
  "REVIEWING",
  "PUSHING",
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    select: { name: true },
  });
  return { title: project?.name ?? "Project" };
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      buildLogs: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!project || project.userId !== session.user.id) notFound();

  const isActive = ACTIVE_STATUSES.includes(project.status as ProjectStatus);
  const isCompleted = project.status === "COMPLETED";
  const isFailed = project.status === "FAILED";
  const isDraft = project.status === "DRAFT";

  const fileCount = Array.isArray(project.generatedFiles)
    ? project.generatedFiles.length
    : 0;

  const statusVariant = isCompleted
    ? "default"
    : isFailed
    ? "destructive"
    : "secondary";

  return (
    <div className="space-y-7 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-[#F8FAFC] truncate">
              {project.name}
            </h1>
            <TierBadge tier={project.tier as ProjectTier} />
            <Badge variant={statusVariant}>
              {STATUS_LABELS[project.status as ProjectStatus] ?? project.status}
            </Badge>
          </div>
          <p className="text-slate-400 mt-1.5 text-sm line-clamp-2 leading-relaxed">
            {project.requirement}
          </p>
          <p className="text-xs text-slate-600 mt-1">
            Created{" "}
            {new Date(project.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {project.githubRepo && (
            <Button
              variant="outline"
              size="sm"
              asChild
              className="border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-[#F8FAFC]"
            >
              <a
                href={`https://github.com/${project.githubRepo}`}
                target="_blank"
                rel="noreferrer"
              >
                <Github className="mr-2 h-4 w-4" />
                View Repo
                <ExternalLink className="ml-2 h-3 w-3 opacity-60" />
              </a>
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            asChild
            className="border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-[#F8FAFC]"
          >
            <Link href={`/project/${id}/logs`}>
              <ScrollText className="mr-2 h-4 w-4" />
              Logs
            </Link>
          </Button>
        </div>
      </div>

      {/* Active: real-time build progress */}
      {isActive && (
        <BuildProgress
          projectId={project.id}
          status={project.status as ProjectStatus}
        />
      )}

      {/* COMPLETED state */}
      {isCompleted && (
        <Card className="border-emerald-500/30 bg-emerald-500/[0.05]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
              Build Complete!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {fileCount > 0 && (
                <div className="rounded-lg bg-white/[0.03] border border-white/10 p-3 flex items-center gap-2">
                  <FileCode2 className="h-4 w-4 text-[#3B82F6]" />
                  <div>
                    <p className="text-xs text-slate-400">Files Generated</p>
                    <p className="text-lg font-bold text-[#F8FAFC]">
                      {fileCount}
                    </p>
                  </div>
                </div>
              )}
              {project.githubRepo && (
                <div className="rounded-lg bg-white/[0.03] border border-white/10 p-3 flex items-center gap-2">
                  <Github className="h-4 w-4 text-[#3B82F6]" />
                  <div>
                    <p className="text-xs text-slate-400">Pushed to</p>
                    <p className="text-sm font-mono font-medium text-[#F8FAFC] truncate max-w-[120px]">
                      {project.githubRepo.split("/").pop()}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Requirement recap */}
            {project.requirement && (
              <div className="rounded-lg bg-white/[0.03] border border-white/10 p-4">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">
                  Original Requirement
                </p>
                <p className="text-sm text-slate-300 leading-relaxed line-clamp-4">
                  {project.requirement}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              {project.githubRepo && (
                <Button
                  asChild
                  className="bg-[#3B82F6] hover:bg-[#2563EB] text-white"
                >
                  <a
                    href={`https://github.com/${project.githubRepo}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Github className="mr-2 h-4 w-4" />
                    View on GitHub
                  </a>
                </Button>
              )}
              {project.deploymentUrl && (
                <Button
                  variant="outline"
                  asChild
                  className="border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                >
                  <a
                    href={project.deploymentUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Live Preview
                  </a>
                </Button>
              )}
              <Button
                variant="outline"
                asChild
                className="border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
              >
                <Link href={`/project/${id}/logs`}>
                  <ScrollText className="mr-2 h-4 w-4" />
                  View Build Logs
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* FAILED state */}
      {isFailed && (
        <Card className="border-red-500/30 bg-red-500/[0.05]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-400">
              <AlertCircle className="h-5 w-5" />
              Build Failed
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-400">
              The generation pipeline encountered an error. You can review the
              logs and retry.
            </p>
            {project.errorLog && (
              <pre className="text-xs bg-black/30 rounded-lg p-4 overflow-x-auto text-red-300 border border-red-500/20 max-h-48">
                {project.errorLog}
              </pre>
            )}
            <div className="flex flex-wrap gap-3">
              <RetryButton projectId={id} />
              <Button
                variant="outline"
                asChild
                className="border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
              >
                <Link href={`/project/${id}/logs`}>
                  <ScrollText className="mr-2 h-4 w-4" />
                  View Logs
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* DRAFT state */}
      {isDraft && (
        <Card className="bg-white/[0.03] border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#F8FAFC]">
              <Clock className="h-5 w-5 text-amber-400" />
              Ready to Generate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-400 mb-5">
              Your project is configured and ready. Click below to start the AI
              generation pipeline.
            </p>
            <StartGenerationForm projectId={id} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Server action wrappers as inline server components
function RetryButton({ projectId }: { projectId: string }) {
  async function retryAction() {
    "use server";
    await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/projects/${projectId}/generate`,
      { method: "POST" }
    );
  }
  return (
    <form action={retryAction}>
      <Button
        type="submit"
        variant="outline"
        className="border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
      >
        <RotateCcw className="mr-2 h-4 w-4" />
        Retry Generation
      </Button>
    </form>
  );
}

function StartGenerationForm({ projectId }: { projectId: string }) {
  async function startAction() {
    "use server";
    await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/projects/${projectId}/generate`,
      { method: "POST" }
    );
  }
  return (
    <form action={startAction}>
      <Button
        type="submit"
        className="bg-[#3B82F6] hover:bg-[#2563EB] text-white font-semibold"
      >
        <Clock className="mr-2 h-4 w-4" />
        Start Generation
      </Button>
    </form>
  );
}
