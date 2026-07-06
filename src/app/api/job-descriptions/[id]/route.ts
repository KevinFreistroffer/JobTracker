import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { toErrorResponse } from "@/lib/api-error";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_request: NextRequest, context: RouteContext) {
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
