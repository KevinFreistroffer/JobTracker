import "@testing-library/jest-dom/vitest";
import { beforeEach, vi } from "vitest";

const requireSessionMock = vi.hoisted(() =>
  vi.fn().mockResolvedValue({
    session: { user: { name: "Test User" } },
    unauthorized: null,
  }),
);

vi.mock("@/lib/require-session", () => ({
  requireSession: requireSessionMock,
}));

beforeEach(() => {
  requireSessionMock.mockResolvedValue({
    session: { user: { name: "Test User" } },
    unauthorized: null,
  });
});
