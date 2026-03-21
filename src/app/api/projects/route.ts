import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

const createProjectSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  requirement: z.string().min(1, "Requirement is required"),
  tier: z.enum(["STATIC", "DYNAMIC", "FULLSTACK"]),
  config: z.record(z.string(), z.unknown()).default({}),
  githubRepo: z.string().optional().nullable(),
  githubPat: z.string().optional().nullable(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized", code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  try {
    const projects = await prisma.project.findMany({
      where: { userId: session.user.id },
      include: {
        buildLogs: {
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error("[GET /api/projects]", error);
    return NextResponse.json(
      { error: "Failed to fetch projects", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized", code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body", code: "INVALID_BODY" },
      { status: 400 }
    );
  }

  const parsed = createProjectSchema.safeParse(body);
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

  const { name, requirement, tier, config, githubRepo, githubPat } = parsed.data;

  // Encrypt PAT if provided
  let encryptedPat: string | null = null;
  if (githubPat) {
    try {
      const { encrypt } = await import("@/lib/crypto");
      encryptedPat = encrypt(githubPat);
    } catch {
      encryptedPat = githubPat; // Fallback if encryption key not set
    }
  }

  try {
    const project = await prisma.project.create({
      data: {
        userId: session.user.id,
        name,
        requirement,
        tier,
        config: config as Prisma.InputJsonValue,
        status: "DRAFT",
        githubRepo: githubRepo ?? null,
        githubPat: encryptedPat,
      },
      include: {
        buildLogs: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/projects]", error);
    return NextResponse.json(
      { error: "Failed to create project", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
