import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const POLL_MS = 1500;

const TERMINAL = new Set(["COMPLETED", "FAILED", "DRAFT"]);

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: "Unauthorized", code: "UNAUTHORIZED" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { id } = await params;

  const project = await prisma.project.findUnique({ where: { id } });

  if (!project) {
    return new Response(JSON.stringify({ error: "Project not found", code: "NOT_FOUND" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (project.userId !== session.user.id) {
    return new Response(JSON.stringify({ error: "Forbidden", code: "FORBIDDEN" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const sentIds = new Set<string>();

      function send(data: unknown) {
        const payload = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(payload));
      }

      async function flushNewLogs() {
        const logs = await prisma.buildLog.findMany({
          where: { projectId: id },
          orderBy: { createdAt: "asc" },
        });
        for (const log of logs) {
          if (sentIds.has(log.id)) continue;
          sentIds.add(log.id);
          send({
            step: log.step,
            message: log.message,
            level: log.level,
            timestamp: log.createdAt.toISOString(),
            metadata: log.metadata,
          });
        }
      }

      let interval: ReturnType<typeof setInterval> | null = null;

      const cleanup = () => {
        if (interval) {
          clearInterval(interval);
          interval = null;
        }
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      };

      req.signal.addEventListener("abort", () => {
        cleanup();
      });

      try {
        await flushNewLogs();

        if (TERMINAL.has(project.status)) {
          try {
            controller.close();
          } catch {
            /* closed */
          }
          return;
        }

        interval = setInterval(async () => {
          try {
            await flushNewLogs();
            const p = await prisma.project.findUnique({
              where: { id },
              select: { status: true },
            });
            if (p && TERMINAL.has(p.status)) {
              await flushNewLogs();
              cleanup();
            }
          } catch (err) {
            console.error(`[SSE /api/projects/${id}/logs] Poll error:`, err);
          }
        }, POLL_MS);
      } catch (err) {
        console.error(`[SSE /api/projects/${id}/logs] Failed:`, err);
        cleanup();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
