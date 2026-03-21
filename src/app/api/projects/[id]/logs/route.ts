import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";

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

  // Verify project exists and is owned by the current user
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

  const channel = `build:${id}`;

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      function send(data: unknown) {
        const payload = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(payload));
      }

      // Send existing build logs from DB on connection
      try {
        const existingLogs = await prisma.buildLog.findMany({
          where: { projectId: id },
          orderBy: { createdAt: "asc" },
        });

        for (const log of existingLogs) {
          send({
            step: log.step,
            message: log.message,
            level: log.level,
            timestamp: log.createdAt.toISOString(),
            metadata: log.metadata,
          });
        }
      } catch (err) {
        console.error(`[SSE /api/projects/${id}/logs] Failed to fetch existing logs:`, err);
      }

      // Create a duplicate Redis connection for pub/sub
      const subscriber = redis.duplicate();

      const cleanup = async () => {
        try {
          await subscriber.unsubscribe(channel);
          subscriber.disconnect();
        } catch {
          // Ignore cleanup errors
        }
        try {
          controller.close();
        } catch {
          // Already closed
        }
      };

      // Cleanup on client disconnect
      req.signal.addEventListener("abort", () => {
        void cleanup();
      });

      try {
        subscriber.on("message", (_channel: string, message: string) => {
          try {
            const data = JSON.parse(message) as unknown;
            send(data);
          } catch {
            send({ message, level: "INFO", timestamp: new Date().toISOString() });
          }
        });

        await subscriber.subscribe(channel);
      } catch (err) {
        console.error(`[SSE /api/projects/${id}/logs] Subscribe error:`, err);
        void cleanup();
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
