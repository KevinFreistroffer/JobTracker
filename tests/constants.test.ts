import { describe, expect, it } from "vitest";
import { CONTACT_TYPE_LABELS, CONTACT_TYPE_OPTIONS } from "@/lib/constants";

describe("contact type constants", () => {
  it("includes LinkedIn in labels and dropdown options", () => {
    expect(CONTACT_TYPE_LABELS.LINKEDIN).toBe("LinkedIn");
    expect(CONTACT_TYPE_OPTIONS).toEqual(
      expect.arrayContaining([{ value: "LINKEDIN", label: "LinkedIn" }]),
    );
  });
});
