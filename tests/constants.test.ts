import { describe, expect, it } from "vitest";
import {
  CONTACT_TYPE_LABELS,
  CONTACT_TYPE_OPTIONS,
  STATUS_LABELS,
  STATUS_OPTIONS,
} from "@/lib/constants";

describe("contact type constants", () => {
  it("includes LinkedIn in labels and dropdown options", () => {
    expect(CONTACT_TYPE_LABELS.LINKEDIN).toBe("LinkedIn");
    expect(CONTACT_TYPE_OPTIONS).toEqual(
      expect.arrayContaining([{ value: "LINKEDIN", label: "LinkedIn" }]),
    );
  });
});

describe("status constants", () => {
  it("includes Meeting Scheduled in labels and dropdown options", () => {
    expect(STATUS_LABELS.MEETING_SCHEDULED).toBe("Meeting Scheduled");
    expect(STATUS_OPTIONS).toEqual(
      expect.arrayContaining([
        { value: "MEETING_SCHEDULED", label: "Meeting Scheduled" },
      ]),
    );
  });
});
