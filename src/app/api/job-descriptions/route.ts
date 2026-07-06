import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { toErrorResponse } from "@/lib/api-error";
import {
  jobDescriptionInputSchema,
  serializeJobDescription,
} from "@/lib/validations";

export async function GET() {
  try {
    const jobDescriptions = await prisma.jobDescription.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(
      jobDescriptions.map((jobDescription) =>
        serializeJobDescription(jobDescription),
      ),
    );
  } catch (error) {
    return toErrorResponse("Failed to fetch job descriptions", error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = jobDescriptionInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const jobDescription = await prisma.jobDescription.create({
      data: parsed.data,
    });

    return NextResponse.json(serializeJobDescription(jobDescription), {
      status: 201,
    });
  } catch (error) {
    return toErrorResponse("Failed to save job description", error);
  }
}
