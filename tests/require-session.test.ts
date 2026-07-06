import { afterEach, describe, expect, it, vi } from "vitest";

vi.unmock("@/lib/require-session");

const authMock = vi.hoisted(() => vi.fn());

vi.mock("@/auth", () => ({
  auth: authMock,
}));

import { requireSession } from "@/lib/require-session";

afterEach(() => {
  authMock.mockReset();
});

describe("requireSession", () => {
  it("returns 401 when there is no session", async () => {
    authMock.mockResolvedValue(null);

    const result = await requireSession();

    expect(result.session).toBeNull();
    expect(result.unauthorized?.status).toBe(401);

    const body = await result.unauthorized?.json();
    expect(body).toEqual({ error: "Unauthorized" });
  });

  it("returns the session when authenticated", async () => {
    const session = { user: { name: "Kevin", email: "kevin@example.com" } };
    authMock.mockResolvedValue(session);

    const result = await requireSession();

    expect(result.unauthorized).toBeNull();
    expect(result.session).toEqual(session);
  });
});
