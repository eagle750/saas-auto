import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized", code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  const { id } = await params;

  try {
    // Fetch project and verify ownership
    const project = await prisma.project.findUnique({ where: { id } });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    if (project.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    // Check subscription and remaining generations
    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "No active subscription found", code: "NO_SUBSCRIPTION" },
        { status: 402 }
      );
    }

    if (subscription.generationsUsed >= subscription.generationsLimit) {
      return NextResponse.json(
        {
          error: "Generation limit reached for your current plan",
          code: "GENERATION_LIMIT_EXCEEDED",
        },
        { status: 402 }
      );
    }

    // Rate limit: 1 active job per user at a time
    const activeJob = await prisma.project.findFirst({
      where: {
        userId: session.user.id,
        status: { in: ["QUEUED", "PLANNING", "GENERATING", "REVIEWING", "PUSHING", "DEPLOYING"] },
      },
    });

    if (activeJob) {
      return NextResponse.json(
        {
          error: "You already have an active generation job. Please wait for it to complete.",
          code: "ACTIVE_JOB_EXISTS",
        },
        { status: 409 }
      );
    }

    // Update project status to QUEUED (worker polls Postgres — no Redis/BullMQ)
    await prisma.project.update({
      where: { id },
      data: { status: "QUEUED", errorLog: null },
    });

    // Increment generationsUsed on subscription
    await prisma.subscription.update({
      where: { userId: session.user.id },
      data: { generationsUsed: { increment: 1 } },
    });

    const jobId = `generate:${id}:${Date.now()}`;

    return NextResponse.json({ success: true, jobId }, { status: 202 });
  } catch (error) {
    console.error(`[POST /api/projects/${id}/generate]`, error);

    // Attempt to reset project status on failure
    try {
      await prisma.project.update({
        where: { id },
        data: { status: "DRAFT" },
      });
    } catch {
      // Ignore rollback errors
    }

    return NextResponse.json(
      { error: "Failed to queue generation", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
