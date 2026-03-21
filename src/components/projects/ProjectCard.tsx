"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { GitBranch, Calendar, Loader2 } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TierBadge } from "@/components/projects/TierBadge";
import { cn } from "@/lib/utils";
import type { Project, ProjectStatus } from "@/types/project";

interface ProjectCardProps {
  project: Project;
}

function StatusBadge({ status }: { status: ProjectStatus }) {
  const animatedStatuses: ProjectStatus[] = ["GENERATING", "PLANNING", "QUEUED", "REVIEWING", "PUSHING", "DEPLOYING"];
  const isAnimated = animatedStatuses.includes(status);

  const statusConfig: Record<ProjectStatus, { label: string; className: string }> = {
    COMPLETED: {
      label: "Completed",
      className: "bg-emerald-600/20 text-emerald-400 border border-emerald-600/30",
    },
    FAILED: {
      label: "Failed",
      className: "bg-red-600/20 text-red-400 border border-red-600/30",
    },
    GENERATING: {
      label: "Generating",
      className: "bg-blue-600/20 text-blue-400 border border-blue-600/30",
    },
    PLANNING: {
      label: "Planning",
      className: "bg-blue-600/20 text-blue-400 border border-blue-600/30",
    },
    QUEUED: {
      label: "Queued",
      className: "bg-blue-600/20 text-blue-400 border border-blue-600/30",
    },
    REVIEWING: {
      label: "Reviewing",
      className: "bg-blue-600/20 text-blue-400 border border-blue-600/30",
    },
    PUSHING: {
      label: "Pushing",
      className: "bg-blue-600/20 text-blue-400 border border-blue-600/30",
    },
    DEPLOYING: {
      label: "Deploying",
      className: "bg-blue-600/20 text-blue-400 border border-blue-600/30",
    },
    DRAFT: {
      label: "Draft",
      className: "bg-muted text-muted-foreground border border-border",
    },
  };

  const config = statusConfig[status];

  return (
    <Badge className={cn("gap-1", config.className)}>
      {isAnimated && <Loader2 className="size-3 animate-spin" />}
      {config.label}
    </Badge>
  );
}

export function ProjectCard({ project }: ProjectCardProps) {
  const router = useRouter();

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(project.createdAt));

  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.005 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className="cursor-pointer"
      onClick={() => router.push(`/project/${project.id}`)}
    >
      <Card className="h-full transition-shadow hover:shadow-lg hover:shadow-blue-500/5 hover:ring-blue-500/20">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="line-clamp-1">{project.name}</CardTitle>
            <TierBadge tier={project.tier} />
          </div>
          <CardDescription className="line-clamp-2 mt-1">
            {project.requirement}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <StatusBadge status={project.status} />
        </CardContent>

        <CardFooter className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="size-3" />
            {formattedDate}
          </span>
          {project.githubRepo && (
            <span className="flex items-center gap-1 truncate max-w-[160px]">
              <GitBranch className="size-3 shrink-0" />
              <span className="truncate">{project.githubRepo}</span>
            </span>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  );
}

export default ProjectCard;
