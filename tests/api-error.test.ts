import { Prisma } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { toErrorResponse } from "@/lib/api-error";

describe("toErrorResponse", () => {
  it("surfaces Prisma known request error codes (e.g. missing table)", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    const error = new Prisma.PrismaClientKnownRequestError(
      "The table `public.Opportunity` does not exist in the current database.",
      { code: "P2021", clientVersion: "6.5.0", meta: { table: "Opportunity" } },
    );

    const response = toErrorResponse("Failed to create opportunity", error);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe("Failed to create opportunity");
    expect(body.code).toBe("P2021");
    expect(body.meta).toEqual({ table: "Opportunity" });
  });

  it("surfaces initialization (connection) errors", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    const error = new Prisma.PrismaClientInitializationError(
      "Can't reach database server",
      "6.5.0",
      "P1001",
    );

    const response = toErrorResponse("Failed to create opportunity", error);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.code).toBe("P1001");
    expect(body.detail).toContain("Can't reach database server");
  });

  it("falls back to the raw message for generic errors", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    const response = toErrorResponse(
      "Failed to create opportunity",
      new Error("boom"),
    );
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.detail).toBe("boom");
  });
});
