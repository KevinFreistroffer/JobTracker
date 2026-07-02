import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  opportunityUpdateSchema,
  serializeOpportunity,
} from "@/lib/validations";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
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
    console.error("GET /api/opportunities/[id] failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch opportunity" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
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
    console.error("PATCH /api/opportunities/[id] failed:", error);
    return NextResponse.json(
      { error: "Failed to update opportunity" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
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
    console.error("DELETE /api/opportunities/[id] failed:", error);
    return NextResponse.json(
      { error: "Failed to delete opportunity" },
      { status: 500 },
    );
  }
}
