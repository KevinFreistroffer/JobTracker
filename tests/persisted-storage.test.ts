import { afterEach, describe, expect, it } from "vitest";
import {
  getPersistedValue,
  removePersistedValue,
  setPersistedValue,
} from "@/lib/persisted-storage";

describe("persisted-storage", () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it("stores and retrieves JSON values", () => {
    setPersistedValue("test-key", { companyName: "Acme Corp" });

    expect(getPersistedValue<{ companyName: string }>("test-key")).toEqual({
      companyName: "Acme Corp",
    });
  });

  it("returns null for missing keys", () => {
    expect(getPersistedValue("missing-key")).toBeNull();
  });

  it("removes stored values", () => {
    setPersistedValue("test-key", { notes: "Follow up" });
    removePersistedValue("test-key");

    expect(getPersistedValue("test-key")).toBeNull();
  });
});
