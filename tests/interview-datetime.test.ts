import { OpportunityStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
import {
  buildInterviewNotificationKey,
  combineInterviewAt,
  DEFAULT_REMINDER_MINUTES_BEFORE,
  isInterviewStatus,
  shouldNotifyInterview,
  splitInterviewAt,
} from "@/lib/interview-datetime";

describe("interview datetime helpers", () => {
  it("identifies interview statuses", () => {
    expect(isInterviewStatus(OpportunityStatus.INTERVIEWING)).toBe(true);
    expect(isInterviewStatus(OpportunityStatus.INTERVIEWED)).toBe(true);
    expect(isInterviewStatus(OpportunityStatus.NEW)).toBe(false);
  });

  it("combines and splits interview date and time", () => {
    const iso = combineInterviewAt("2025-07-10", "14:30");
    expect(iso).toBeTruthy();

    const split = splitInterviewAt(iso);
    expect(split.date).toBe("2025-07-10");
    expect(split.time).toBe("14:30");
  });

  it("defaults missing interview time to 9:00", () => {
    const iso = combineInterviewAt("2025-07-10", "");
    expect(splitInterviewAt(iso).time).toBe("09:00");
  });

  it("builds stable notification keys", () => {
    expect(buildInterviewNotificationKey("opp-1", "2025-07-10T14:30:00.000Z")).toBe(
      "interview-reminder:opp-1:2025-07-10T14:30:00.000Z",
    );
  });
});

describe("shouldNotifyInterview", () => {
  const baseOpportunity = {
    id: "opp-1",
    status: OpportunityStatus.INTERVIEWING,
    companyName: "Acme Corp",
    roleTitle: "Engineer",
    interviewReminderEnabled: true,
  };

  it("returns true inside the reminder window", () => {
    const interviewAt = new Date("2025-07-10T15:00:00");
    const now = new Date(
      interviewAt.getTime() - (DEFAULT_REMINDER_MINUTES_BEFORE - 1) * 60 * 1000,
    );

    expect(
      shouldNotifyInterview(
        {
          ...baseOpportunity,
          interviewAt: interviewAt.toISOString(),
        },
        now,
      ),
    ).toBe(true);
  });

  it("returns false when reminders are disabled", () => {
    const interviewAt = new Date("2025-07-10T15:00:00");
    const now = new Date(interviewAt.getTime() - 5 * 60 * 1000);

    expect(
      shouldNotifyInterview(
        {
          ...baseOpportunity,
          interviewReminderEnabled: false,
          interviewAt: interviewAt.toISOString(),
        },
        now,
      ),
    ).toBe(false);
  });

  it("returns false before the reminder window opens", () => {
    const interviewAt = new Date("2025-07-10T15:00:00");
    const now = new Date(
      interviewAt.getTime() - (DEFAULT_REMINDER_MINUTES_BEFORE + 30) * 60 * 1000,
    );

    expect(
      shouldNotifyInterview(
        {
          ...baseOpportunity,
          interviewAt: interviewAt.toISOString(),
        },
        now,
      ),
    ).toBe(false);
  });
});
