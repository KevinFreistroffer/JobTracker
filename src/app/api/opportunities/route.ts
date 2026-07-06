import { ContactType, OpportunityStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { toErrorResponse } from "@/lib/api-error";
import { requireSession } from "@/lib/require-session";
import {
  opportunityInputSchema,
  serializeOpportunity,
} from "@/lib/validations";

export async function GET(request: NextRequest) {
  const { unauthorized } = await requireSession();
  if (unauthorized) return unauthorized;

  try {
    const statusParam = request.nextUrl.searchParams.get("status");
    const contactTypeParam = request.nextUrl.searchParams.get("contactType");
    const search = request.nextUrl.searchParams.get("search")?.trim();

    const where: {
      status?: OpportunityStatus;
      contactType?: ContactType;
      OR?: Array<{
        companyName?: { contains: string; mode: "insensitive" };
        recruiterName?: { contains: string; mode: "insensitive" };
        roleTitle?: { contains: string; mode: "insensitive" };
      }>;
    } = {};

    if (
      statusParam &&
      Object.values(OpportunityStatus).includes(statusParam as OpportunityStatus)
    ) {
      where.status = statusParam as OpportunityStatus;
    }

    if (
      contactTypeParam &&
      Object.values(ContactType).includes(contactTypeParam as ContactType)
    ) {
      where.contactType = contactTypeParam as ContactType;
    }

    if (search) {
      where.OR = [
        { companyName: { contains: search, mode: "insensitive" } },
        { recruiterName: { contains: search, mode: "insensitive" } },
        { roleTitle: { contains: search, mode: "insensitive" } },
      ];
    }

    const opportunities = await prisma.opportunity.findMany({
      where,
      orderBy: { contactDate: "desc" },
    });

    return NextResponse.json(
      opportunities.map((opportunity) => serializeOpportunity(opportunity)),
    );
  } catch (error) {
    return toErrorResponse("Failed to fetch opportunities", error);
  }
}

export async function POST(request: NextRequest) {
  const { unauthorized } = await requireSession();
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json();
    const parsed = opportunityInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const opportunity = await prisma.opportunity.create({
      data: parsed.data,
    });

    return NextResponse.json(serializeOpportunity(opportunity), { status: 201 });
  } catch (error) {
    return toErrorResponse("Failed to create opportunity", error);
  }
}
