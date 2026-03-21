"use client";

import { useState, useEffect, useCallback } from "react";
import type { Project } from "@/types/project";

interface UseProjectResult {
  project: Project | null;
  isLoading: boolean;
  error: string | null;
  mutate: () => Promise<void>;
}

export function useProject(id: string): UseProjectResult {
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProject = useCallback(async () => {
    if (!id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(
          body?.message ?? `Failed to fetch project: ${response.status}`
        );
      }

      const data: Project = await response.json();
      setProject(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
      setProject(null);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  return { project, isLoading, error, mutate: fetchProject };
}
