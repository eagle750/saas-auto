"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  XCircle,
  Loader2,
  GitBranch,
  RefreshCw,
  FileText,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Progress,
  ProgressTrack,
  ProgressIndicator,
} from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useBuildStream } from "@/hooks/useBuildStream";
import { cn } from "@/lib/utils";
import type { ProjectStatus, LogLevel, BuildLog } from "@/types/project";

interface BuildProgressProps {
  projectId: string;
  status: ProjectStatus;
}

const STAGE_ORDER: ProjectStatus[] = [
  "QUEUED",
  "PLANNING",
  "GENERATING",
  "REVIEWING",
  "PUSHING",
  "DEPLOYING",
  "COMPLETED",
];

const STAGE_LABELS: Record<ProjectStatus, string> = {
  DRAFT: "Draft",
  QUEUED: "Queued",
  PLANNING: "Planning Architecture",
  GENERATING: "Generating Code",
  REVIEWING: "Reviewing Output",
  PUSHING: "Pushing to GitHub",
  DEPLOYING: "Deploying",
  COMPLETED: "Completed",
  FAILED: "Failed",
};

const LOG_LEVEL_CLASSES: Record<LogLevel, string> = {
  INFO: "text-blue-400",
  SUCCESS: "text-emerald-400",
  WARN: "text-amber-400",
  ERROR: "text-red-400",
};

const LOG_LEVEL_BADGE_CLASSES: Record<LogLevel, string> = {
  INFO: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
  SUCCESS: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
  WARN: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
  ERROR: "bg-red-500/20 text-red-400 border border-red-500/30",
};

function getProgress(status: ProjectStatus): number {
  const idx = STAGE_ORDER.indexOf(status);
  if (status === "COMPLETED") return 100;
  if (status === "FAILED") return 100;
  if (idx < 0) return 0;
  return Math.round((idx / (STAGE_ORDER.length - 1)) * 100);
}

function LogEntry({ log, index }: { log: BuildLog; index: number }) {
  const time = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(log.createdAt));

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay: Math.min(index * 0.02, 0.3) }}
      className="flex items-start gap-2 py-1 font-mono text-xs"
    >
      <span className="shrink-0 text-muted-foreground/60 tabular-nums">{time}</span>
      <Badge className={cn("shrink-0 text-[10px] h-4 px-1", LOG_LEVEL_BADGE_CLASSES[log.level])}>
        {log.level}
      </Badge>
      <span className={cn("leading-relaxed", LOG_LEVEL_CLASSES[log.level])}>
        {log.message}
      </span>
    </motion.div>
  );
}

function Confetti() {
  const colors = ["#3B82F6", "#8B5CF6", "#10B981", "#F59E0B", "#EF4444", "#EC4899"];
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 30 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute size-2 rounded-sm"
          style={{
            backgroundColor: colors[i % colors.length],
            left: `${Math.random() * 100}%`,
            top: `-10px`,
          }}
          animate={{
            y: [0, 400 + Math.random() * 200],
            x: [(Math.random() - 0.5) * 100],
            rotate: [0, 360 * (Math.random() > 0.5 ? 1 : -1)],
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: 1.5 + Math.random() * 1,
            delay: Math.random() * 0.5,
            ease: "easeIn",
          }}
        />
      ))}
    </div>
  );
}

export function BuildProgress({ projectId, status }: BuildProgressProps) {
  const isActive =
    status !== "COMPLETED" && status !== "FAILED" && status !== "DRAFT";
  const { logs, isConnected, error } = useBuildStream(projectId, isActive);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const prevStatus = useRef<ProjectStatus>(status);

  // Auto-scroll logs
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  // Trigger confetti on completion
  useEffect(() => {
    if (status === "COMPLETED" && prevStatus.current !== "COMPLETED") {
      setShowConfetti(true);
      const t = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(t);
    }
    prevStatus.current = status;
  }, [status]);

  const progress = getProgress(status);
  const progressBarColor =
    status === "FAILED"
      ? "bg-red-500"
      : status === "COMPLETED"
      ? "bg-emerald-500"
      : "bg-blue-500";

  // Collect unique file paths from logs metadata
  const generatedFiles = logs
    .filter((l) => l.metadata?.filePath)
    .map((l) => l.metadata!.filePath as string)
    .filter((v, i, arr) => arr.indexOf(v) === i);

  return (
    <div className="relative space-y-6">
      {/* Confetti overlay */}
      <AnimatePresence>{showConfetti && <Confetti />}</AnimatePresence>

      {/* Status indicator */}
      <div className="flex items-center gap-3">
        {status === "COMPLETED" ? (
          <CheckCircle className="size-8 shrink-0 text-emerald-400" />
        ) : status === "FAILED" ? (
          <XCircle className="size-8 shrink-0 text-red-400" />
        ) : (
          <Loader2 className="size-8 shrink-0 animate-spin text-blue-400" />
        )}
        <div>
          <p className="text-lg font-semibold text-foreground">
            {STAGE_LABELS[status]}
          </p>
          {isActive && (
            <p className="text-sm text-muted-foreground">
              {isConnected ? "Connected to build stream" : "Connecting…"}
            </p>
          )}
        </div>
        {isActive && (
          <Badge className="ml-auto bg-blue-500/20 text-blue-400 border border-blue-500/30 animate-pulse">
            Live
          </Badge>
        )}
      </div>

      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Progress</span>
          <span>{progress}%</span>
        </div>
        <ProgressTrack className="h-2">
          <ProgressIndicator
            className={cn("transition-all duration-700", progressBarColor)}
            style={{ width: `${progress}%` }}
          />
        </ProgressTrack>
      </div>

      {/* Connection error banner */}
      {error && isActive && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-400">
          {error}
        </div>
      )}

      {/* Log stream */}
      <div className="rounded-xl border border-border/40 bg-[#0D1117]">
        <div className="flex items-center justify-between border-b border-border/40 px-4 py-2">
          <span className="text-xs font-medium text-muted-foreground">
            Build Logs
          </span>
          <span className="text-xs text-muted-foreground">{logs.length} entries</span>
        </div>
        <div
          ref={scrollRef}
          className="h-64 overflow-y-auto p-4"
        >
          {logs.length === 0 ? (
            <p className="text-xs text-muted-foreground">Waiting for logs…</p>
          ) : (
            logs.map((log, i) => (
              <LogEntry key={log.id} log={log} index={i} />
            ))
          )}
        </div>
      </div>

      {/* Generated files tree */}
      {generatedFiles.length > 0 && (
        <div className="rounded-xl border border-border/40 bg-[#0D1117]">
          <div className="border-b border-border/40 px-4 py-2">
            <span className="text-xs font-medium text-muted-foreground">
              Generated Files ({generatedFiles.length})
            </span>
          </div>
          <div className="p-4 space-y-1 max-h-48 overflow-y-auto">
            {generatedFiles.map((file) => (
              <motion.div
                key={file}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 text-xs text-muted-foreground"
              >
                <FileText className="size-3 shrink-0 text-blue-400" />
                <ChevronRight className="size-3 shrink-0 text-border" />
                <span className="font-mono">{file}</span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Completed: GitHub link */}
      {status === "COMPLETED" && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-center"
        >
          <p className="mb-3 text-sm font-medium text-emerald-400">
            Your project has been generated and pushed to GitHub!
          </p>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/30 px-4 py-2 text-sm font-medium text-emerald-400 transition-colors hover:bg-emerald-500/10"
          >
            <GitBranch className="size-4" />
            View on GitHub
          </a>
        </motion.div>
      )}

      {/* Failed: error + retry */}
      {status === "FAILED" && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-red-500/30 bg-red-500/5 p-4"
        >
          <p className="mb-3 text-sm font-medium text-red-400">
            Build failed. Check the logs above for more details.
          </p>
          <Button
            variant="outline"
            className="border-red-500/30 text-red-400 hover:bg-red-500/10"
            onClick={() => {
              // Reload page to trigger a retry from the server action
              window.location.reload();
            }}
          >
            <RefreshCw className="mr-2 size-4" />
            Retry Build
          </Button>
        </motion.div>
      )}
    </div>
  );
}

export default BuildProgress;
