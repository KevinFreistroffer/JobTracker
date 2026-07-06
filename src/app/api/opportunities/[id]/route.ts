import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { toErrorResponse } from "@/lib/api-error";
import { requireSession } from "@/lib/require-session";
import {
  opportunityUpdateSchema,
  serializeOpportunity,
} from "@/lib/validations";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const { unauthorized } = await requireSession();
  if (unauthorized) return unauthorized;

  try {
    const { id } = await context.params;
    const opportunity = await prisma.opportunity.findUnique({ where: { id } });

    if (!opportunity) {
      return NextResponse.json(
        { error: "Opportunity not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(serializeOpportunity(opportunity));
  } catch (error) {
    return toErrorResponse("Failed to fetch opportunity", error);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { unauthorized } = await requireSession();
  if (unauthorized) return unauthorized;

  try {
    const { id } = await context.params;
    const body = await request.json();
    const parsed = opportunityUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const existing = await prisma.opportunity.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Opportunity not found" },
        { status: 404 },
      );
    }

    const opportunity = await prisma.opportunity.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json(serializeOpportunity(opportunity));
  } catch (error) {
    return toErrorResponse("Failed to update opportunity", error);
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { unauthorized } = await requireSession();
  if (unauthorized) return unauthorized;

  try {
    const { id } = await context.params;
    const existing = await prisma.opportunity.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json(
        { error: "Opportunity not found" },
        { status: 404 },
      );
    }

    await prisma.opportunity.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return toErrorResponse("Failed to delete opportunity", error);
  }
}
