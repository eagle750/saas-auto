"use client";

import { use } from "react";
import { BuildProgress } from "@/components/projects/BuildProgress";
import { useProject } from "@/hooks/useProject";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS } from "@/lib/constants";
import type { ProjectStatus } from "@/types/project";

export default function LogsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { project, isLoading, error } = useProject(id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#3B82F6]" />
          <p className="text-slate-400 text-sm">Loading build logs…</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <AlertCircle className="w-6 h-6 text-red-400" />
        </div>
        <p className="text-slate-400 text-center">
          {error ?? "Project not found"}
        </p>
        <Button
          variant="outline"
          asChild
          className="border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
        >
          <Link href="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>
    );
  }

  const statusLabel =
    STATUS_LABELS[project.status as ProjectStatus] ?? project.status;
  const isActive = [
    "QUEUED",
    "PLANNING",
    "GENERATING",
    "REVIEWING",
    "PUSHING",
  ].includes(project.status);

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="text-slate-400 hover:text-[#F8FAFC] self-start"
        >
          <Link href={`/project/${id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Project
          </Link>
        </Button>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-xl font-bold text-[#F8FAFC]">
            Build Logs — {project.name}
          </h1>
          <Badge
            variant={
              project.status === "COMPLETED"
                ? "default"
                : project.status === "FAILED"
                ? "destructive"
                : "secondary"
            }
            className="text-xs"
          >
            {isActive && (
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#3B82F6] animate-pulse mr-1.5" />
            )}
            {statusLabel}
          </Badge>
        </div>
      </div>

      {/* Full-page build log viewer */}
      <div className="min-h-[calc(100vh-12rem)]">
        <BuildProgress
          projectId={id}
          status={project.status as ProjectStatus}
        />
      </div>
    </div>
  );
}
