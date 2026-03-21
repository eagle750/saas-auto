import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/crypto";

const patchProjectSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  config: z.record(z.string(), z.unknown()).optional(),
  githubRepo: z.string().nullable().optional(),
  githubPat: z.string().nullable().optional(),
});

export async function GET(
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
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        buildLogs: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

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

    return NextResponse.json(project);
  } catch (error) {
    console.error(`[GET /api/projects/${id}]`, error);
    return NextResponse.json(
      { error: "Failed to fetch project", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
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

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body", code: "INVALID_BODY" },
      { status: 400 }
    );
  }

  const parsed = patchProjectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: parsed.error.issues[0]?.message ?? "Validation failed",
        code: "VALIDATION_ERROR",
        details: parsed.error.issues,
      },
      { status: 422 }
    );
  }

  try {
    const existing = await prisma.project.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json(
        { error: "Project not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    if (existing.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    const { githubPat, ...rest } = parsed.data;

    // Encrypt githubPat before saving if provided
    const updateData: Record<string, unknown> = { ...rest };
    if (githubPat !== undefined) {
      updateData.githubPat = githubPat !== null ? encrypt(githubPat) : null;
    }

    const updated = await prisma.project.update({
      where: { id },
      data: updateData,
      include: {
        buildLogs: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(`[PATCH /api/projects/${id}]`, error);
    return NextResponse.json(
      { error: "Failed to update project", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
    const existing = await prisma.project.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json(
        { error: "Project not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    if (existing.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    await prisma.project.delete({ where: { id } });

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error(`[DELETE /api/projects/${id}]`, error);
    return NextResponse.json(
      { error: "Failed to delete project", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
