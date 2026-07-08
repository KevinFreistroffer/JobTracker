import { ContactType, OpportunityStatus } from "@prisma/client";

export const CONTACT_TYPE_LABELS: Record<ContactType, string> = {
  EMAIL: "Email",
  CALL: "Call",
  LINKEDIN: "LinkedIn",
};

export const STATUS_LABELS: Record<OpportunityStatus, string> = {
  NEW: "New",
  RESPONDED: "Responded",
  MEETING_SCHEDULED: "Meeting Scheduled",
  CODING_TEST: "Coding Test",
  TEST_FINISHED: "Test Finished",
  INTERVIEWING: "Interviewing",
  INTERVIEWED: "Interviewed",
  OFFER: "Offer",
  REJECTED: "Rejected",
  NO_RESPONSE: "No Response",
  WITHDRAWN: "Withdrawn",
};

export const STATUS_OPTIONS = Object.entries(STATUS_LABELS).map(
  ([value, label]) => ({
    value: value as OpportunityStatus,
    label,
  }),
);

export const CONTACT_TYPE_OPTIONS = Object.entries(CONTACT_TYPE_LABELS).map(
  ([value, label]) => ({
    value: value as ContactType,
    label,
  }),
);

export type OpportunityRecord = {
  id: string;
  contactType: ContactType | null;
  status: OpportunityStatus;
  recruiterName: string | null;
  recruiterEmail: string | null;
  companyName: string | null;
  roleTitle: string | null;
  contactDate: string | null;
  interviewAt: string | null;
  interviewReminderEnabled: boolean;
  notes: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export const emptyOpportunityForm = {
  contactType: "" as ContactType | "",
  status: "NEW" as OpportunityStatus,
  recruiterName: "",
  recruiterEmail: "",
  companyName: "",
  roleTitle: "",
  contactDate: "",
  interviewDate: "",
  interviewTime: "",
  interviewReminderEnabled: false,
  notes: "",
  jobDescription: "",
  isAiRole: false,
};
