import { OpportunityStatus } from "@prisma/client";

export const INTERVIEW_STATUSES = [
  OpportunityStatus.INTERVIEWING,
  OpportunityStatus.INTERVIEWED,
] as const;

export const DEFAULT_REMINDER_MINUTES_BEFORE = 15;

export function isInterviewStatus(status: OpportunityStatus): boolean {
  return INTERVIEW_STATUSES.includes(
    status as (typeof INTERVIEW_STATUSES)[number],
  );
}

export function splitInterviewAt(iso: string | null | undefined): {
  date: string;
  time: string;
} {
  if (!iso) {
    return { date: "", time: "" };
  }

  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return { date: "", time: "" };
  }

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  const hours = String(parsed.getHours()).padStart(2, "0");
  const minutes = String(parsed.getMinutes()).padStart(2, "0");

  return {
    date: `${year}-${month}-${day}`,
    time: `${hours}:${minutes}`,
  };
}

export function combineInterviewAt(
  date: string,
  time: string,
): string | null {
  const trimmedDate = date.trim();
  if (!trimmedDate) {
    return null;
  }

  const trimmedTime = time.trim() || "09:00";
  const parsed = new Date(`${trimmedDate}T${trimmedTime}`);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
}

export function getReminderTriggerTime(
  interviewAt: Date,
  minutesBefore = DEFAULT_REMINDER_MINUTES_BEFORE,
): Date {
  return new Date(interviewAt.getTime() - minutesBefore * 60 * 1000);
}

type InterviewReminderOpportunity = {
  id: string;
  status: OpportunityStatus;
  companyName: string | null;
  roleTitle: string | null;
  interviewAt: string | null;
  interviewReminderEnabled: boolean;
};

export function shouldNotifyInterview(
  opportunity: InterviewReminderOpportunity,
  now: Date,
  minutesBefore = DEFAULT_REMINDER_MINUTES_BEFORE,
): boolean {
  if (!opportunity.interviewReminderEnabled || !opportunity.interviewAt) {
    return false;
  }

  if (!isInterviewStatus(opportunity.status)) {
    return false;
  }

  const interviewAt = new Date(opportunity.interviewAt);
  if (Number.isNaN(interviewAt.getTime()) || interviewAt.getTime() <= now.getTime()) {
    return false;
  }

  const triggerAt = getReminderTriggerTime(interviewAt, minutesBefore);
  return now.getTime() >= triggerAt.getTime();
}

export function buildInterviewNotificationKey(
  opportunityId: string,
  interviewAt: string,
): string {
  return `interview-reminder:${opportunityId}:${interviewAt}`;
}

export function buildInterviewNotificationBody(
  opportunity: Pick<InterviewReminderOpportunity, "companyName" | "roleTitle">,
  interviewAt: string,
): string {
  const company = opportunity.companyName ?? "Unknown company";
  const role = opportunity.roleTitle ? ` for ${opportunity.roleTitle}` : "";
  const when = new Date(interviewAt).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return `${company}${role} — ${when}`;
}
