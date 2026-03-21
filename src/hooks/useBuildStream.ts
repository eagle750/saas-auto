"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { BuildLog } from "@/types/project";

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 2000;

interface UseBuildStreamResult {
  logs: BuildLog[];
  isConnected: boolean;
  error: string | null;
}

export function useBuildStream(
  projectId: string,
  active: boolean
): UseBuildStreamResult {
  const [logs, setLogs] = useState<BuildLog[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const retryCountRef = useRef<number>(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeRef = useRef<boolean>(active);

  // Keep activeRef in sync without triggering reconnects
  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  const disconnect = useCallback(() => {
    if (retryTimerRef.current !== null) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const connect = useCallback(() => {
    if (!projectId || !activeRef.current) return;

    // Clean up any existing connection before opening a new one
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    const url = `/api/projects/${projectId}/logs`;
    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onopen = () => {
      setIsConnected(true);
      setError(null);
      retryCountRef.current = 0;
    };

    es.onmessage = (event: MessageEvent) => {
      try {
        const log: BuildLog = JSON.parse(event.data as string);
        setLogs((prev) => [...prev, log]);
      } catch {
        // Silently ignore malformed events
      }
    };

    es.onerror = () => {
      es.close();
      eventSourceRef.current = null;
      setIsConnected(false);

      if (!activeRef.current) return;

      if (retryCountRef.current < MAX_RETRIES) {
        retryCountRef.current += 1;
        const delay = RETRY_DELAY_MS * retryCountRef.current;
        setError(
          `Connection lost. Reconnecting (attempt ${retryCountRef.current}/${MAX_RETRIES})...`
        );
        retryTimerRef.current = setTimeout(() => {
          if (activeRef.current) {
            connect();
          }
        }, delay);
      } else {
        setError(
          "Unable to connect to build log stream after multiple attempts."
        );
      }
    };
  }, [projectId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (active && projectId) {
      retryCountRef.current = 0;
      setLogs([]);
      setError(null);
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [active, projectId, connect, disconnect]);

  return { logs, isConnected, error };
}
