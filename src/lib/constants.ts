import { ContactType, OpportunityStatus } from "@prisma/client";

export const CONTACT_TYPE_LABELS: Record<ContactType, string> = {
  EMAIL: "Email",
  CALL: "Call",
};

export const STATUS_LABELS: Record<OpportunityStatus, string> = {
  NEW: "New",
  RESPONDED: "Responded",
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
  contactType: ContactType;
  status: OpportunityStatus;
  recruiterName: string;
  recruiterEmail: string | null;
  companyName: string;
  roleTitle: string | null;
  contactDate: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export const emptyOpportunityForm = {
  contactType: "EMAIL" as ContactType,
  status: "NEW" as OpportunityStatus,
  recruiterName: "",
  recruiterEmail: "",
  companyName: "",
  roleTitle: "",
  contactDate: new Date().toISOString().slice(0, 10),
  notes: "",
};
