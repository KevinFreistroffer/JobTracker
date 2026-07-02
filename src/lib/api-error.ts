import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

type ErrorBody = {
  error: string;
  code?: string;
  detail?: string;
  meta?: unknown;
};

/**
 * Turns an unknown thrown value into a structured JSON error response.
 *
 * Prisma error codes are surfaced so failures like a missing table (P2021),
 * failed connections (P1000/P1001), or auth issues are visible from the
 * client instead of being hidden behind a generic 500. This is safe for a
 * personal, single-user app; scrub `detail`/`meta` before exposing publicly.
 */
export function toErrorResponse(fallback: string, error: unknown): NextResponse {
  console.error(`${fallback}:`, error);

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return NextResponse.json<ErrorBody>(
      {
        error: fallback,
        code: error.code,
        detail: error.message,
        meta: error.meta,
      },
      { status: 500 },
    );
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return NextResponse.json<ErrorBody>(
      {
        error: fallback,
        code: error.errorCode ?? "INITIALIZATION_ERROR",
        detail: error.message,
      },
      { status: 500 },
    );
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return NextResponse.json<ErrorBody>(
      { error: fallback, code: "VALIDATION_ERROR", detail: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json<ErrorBody>(
    {
      error: fallback,
      detail: error instanceof Error ? error.message : String(error),
    },
    { status: 500 },
  );
}
