import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { toErrorResponse } from "@/lib/api-error";
import { requireSession } from "@/lib/require-session";
import {
  jobDescriptionPatchSchema,
  serializeJobDescription,
} from "@/lib/validations";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { unauthorized } = await requireSession();
  if (unauthorized) return unauthorized;

  try {
    const { id } = await context.params;
    const existing = await prisma.jobDescription.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json(
        { error: "Job description not found" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const parsed = jobDescriptionPatchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const jobDescription = await prisma.jobDescription.update({
      where: { id },
      data: { isAiRole: parsed.data.isAiRole },
    });

    return NextResponse.json(serializeJobDescription(jobDescription));
  } catch (error) {
    return toErrorResponse("Failed to update job description", error);
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { unauthorized } = await requireSession();
  if (unauthorized) return unauthorized;

  try {
    const { id } = await context.params;
    const existing = await prisma.jobDescription.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json(
        { error: "Job description not found" },
        { status: 404 },
      );
    }

    await prisma.jobDescription.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return toErrorResponse("Failed to delete job description", error);
  }
}
