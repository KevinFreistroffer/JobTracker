import { afterEach, describe, expect, it } from "vitest";
import { isAllowedGitHubUsername } from "@/lib/auth-allowlist";

const originalAllowedUsername = process.env.ALLOWED_GITHUB_USERNAME;

afterEach(() => {
  if (originalAllowedUsername === undefined) {
    delete process.env.ALLOWED_GITHUB_USERNAME;
  } else {
    process.env.ALLOWED_GITHUB_USERNAME = originalAllowedUsername;
  }
});

describe("isAllowedGitHubUsername", () => {
  it("allows the configured username case-insensitively", () => {
    process.env.ALLOWED_GITHUB_USERNAME = "KevinFreistroffer";

    expect(isAllowedGitHubUsername("kevinfreistroffer")).toBe(true);
    expect(isAllowedGitHubUsername("KevinFreistroffer")).toBe(true);
  });

  it("rejects a different username", () => {
    process.env.ALLOWED_GITHUB_USERNAME = "allowed-user";

    expect(isAllowedGitHubUsername("other-user")).toBe(false);
  });

  it("rejects everyone when the env var is missing", () => {
    delete process.env.ALLOWED_GITHUB_USERNAME;

    expect(isAllowedGitHubUsername("any-user")).toBe(false);
    expect(isAllowedGitHubUsername(null)).toBe(false);
    expect(isAllowedGitHubUsername(undefined)).toBe(false);
  });
});
