import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { verifyGitHubAccess } from "@/lib/github";

const verifySchema = z.object({
  repo: z
    .string()
    .min(1, "Repository is required")
    .regex(/^[^/]+\/[^/]+$/, "Repository must be in owner/repo-name format"),
  pat: z.string().min(1, "Personal access token is required"),
});

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

  const parsed = verifySchema.safeParse(body);
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

  const { repo, pat } = parsed.data;

  try {
    const result = await verifyGitHubAccess(repo, pat);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[POST /api/github/verify]", error);
    return NextResponse.json(
      { ok: false, error: "Failed to verify GitHub access" },
      { status: 500 }
    );
  }
}
