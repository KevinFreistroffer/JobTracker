import { ContactType, OpportunityStatus } from "@prisma/client";
import { z } from "zod";
import { isInterviewStatus } from "@/lib/interview-datetime";

const contactTypeSchema = z.nativeEnum(ContactType);
const statusSchema = z.nativeEnum(OpportunityStatus);

const opportunityObjectSchema = z.object({
  contactType: contactTypeSchema.nullable().optional(),
  status: statusSchema.optional(),
  recruiterName: z.string().trim().optional(),
  recruiterEmail: z.string().trim().optional(),
  companyName: z.string().trim().optional(),
  roleTitle: z.string().trim().optional(),
  contactDate: z
    .union([z.string().trim(), z.date(), z.null()])
    .optional(),
  interviewAt: z
    .union([z.string().trim(), z.date(), z.null()])
    .optional(),
  interviewReminderEnabled: z.boolean().optional(),
  notes: z.union([z.string().trim(), z.null()]).optional(),
});

type OpportunityObject = z.infer<typeof opportunityObjectSchema>;

function validateRecruiterEmail(
  data: Pick<OpportunityObject, "contactType" | "recruiterEmail">,
  ctx: z.RefinementCtx,
) {
  if (data.contactType === ContactType.LINKEDIN) {
    return;
  }

  if (
    data.recruiterEmail &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.recruiterEmail)
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Enter a valid email address",
      path: ["recruiterEmail"],
    });
  }
}

function normalizeOptionalText(value: string | null | undefined) {
  if (value === undefined) {
    return undefined;
  }

  const trimmed = value?.trim() ?? "";
  return trimmed === "" ? null : trimmed;
}

function normalizeContactDate(value: string | Date | null | undefined) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === "") {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function normalizeInterviewAt(value: string | Date | null | undefined) {
  return normalizeContactDate(value);
}

function normalizeNotes(value: string | null | undefined, defaultValue?: string) {
  if (value === undefined) {
    return defaultValue;
  }

  return value ? value : "";
}

function normalizeOpportunity<T extends Partial<OpportunityObject>>(
  data: T,
  options: { defaultNotes?: string; defaultStatus?: OpportunityStatus } = {},
) {
  const roleTitle = normalizeOptionalText(data.roleTitle);
  const notes = normalizeNotes(data.notes, options.defaultNotes);
  const recruiterName = normalizeOptionalText(data.recruiterName);
  const companyName = normalizeOptionalText(data.companyName);
  const contactDate = normalizeContactDate(data.contactDate);
  const interviewAt = normalizeInterviewAt(data.interviewAt);
  const interviewReminderEnabled =
    data.interviewReminderEnabled === undefined
      ? undefined
      : data.interviewReminderEnabled;
  const contactType =
    data.contactType === undefined ? undefined : data.contactType ?? null;
  const status =
    data.status === undefined
      ? options.defaultStatus
      : data.status ?? OpportunityStatus.NEW;
  const clearsInterviewFields =
    status !== undefined && !isInterviewStatus(status);

  if (data.contactType === ContactType.LINKEDIN) {
    return {
      ...data,
      contactType,
      status,
      recruiterName,
      companyName,
      contactDate,
      interviewAt: clearsInterviewFields ? null : interviewAt,
      interviewReminderEnabled: clearsInterviewFields
        ? false
        : interviewReminderEnabled,
      recruiterEmail: "",
      roleTitle,
      notes,
    };
  }

  const recruiterEmail =
    data.recruiterEmail === undefined
      ? undefined
      : data.recruiterEmail
        ? data.recruiterEmail
        : null;

  return {
    ...data,
    contactType,
    status,
    recruiterName,
    companyName,
    contactDate,
    interviewAt: clearsInterviewFields ? null : interviewAt,
    interviewReminderEnabled: clearsInterviewFields
      ? false
      : interviewReminderEnabled,
    recruiterEmail,
    roleTitle,
    notes,
  };
}

export const opportunityInputSchema = opportunityObjectSchema
  .superRefine(validateRecruiterEmail)
  .transform((data) => {
    const normalized = normalizeOpportunity(data, {
      defaultNotes: "",
      defaultStatus: OpportunityStatus.NEW,
    });

    return {
      contactType: normalized.contactType ?? null,
      status: normalized.status ?? OpportunityStatus.NEW,
      recruiterName: normalized.recruiterName ?? null,
      recruiterEmail: normalized.recruiterEmail ?? null,
      companyName: normalized.companyName ?? null,
      roleTitle: normalized.roleTitle ?? null,
      contactDate: normalized.contactDate ?? null,
      interviewAt: normalized.interviewAt ?? null,
      interviewReminderEnabled: normalized.interviewReminderEnabled ?? false,
      notes: normalized.notes ?? "",
    };
  });

export const opportunityUpdateSchema = opportunityObjectSchema
  .partial()
  .superRefine((data, ctx) => {
    if (data.recruiterEmail === undefined) {
      return;
    }

    validateRecruiterEmail(
      {
        contactType: data.contactType ?? null,
        recruiterEmail: data.recruiterEmail,
      },
      ctx,
    );
  })
  .transform((data) => normalizeOpportunity(data));

export type OpportunityInput = z.infer<typeof opportunityInputSchema>;
export type OpportunityUpdateInput = z.infer<typeof opportunityUpdateSchema>;

export function serializeOpportunity<T extends {
  contactDate: Date | null;
  interviewAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}>(opportunity: T) {
  return {
    ...opportunity,
    contactDate: opportunity.contactDate?.toISOString() ?? null,
    interviewAt: opportunity.interviewAt?.toISOString() ?? null,
    createdAt: opportunity.createdAt.toISOString(),
    updatedAt: opportunity.updatedAt.toISOString(),
  };
}

const jobDescriptionObjectSchema = z.object({
  companyName: z.string().trim().min(1, "Company name is required"),
  roleTitle: z.string().trim().optional(),
  body: z.string().trim().min(1, "Job description is required"),
});

export const jobDescriptionInputSchema = jobDescriptionObjectSchema.transform(
  (data) => ({
    companyName: data.companyName,
    roleTitle: normalizeOptionalText(data.roleTitle) ?? null,
    body: data.body,
  }),
);

export const jobDescriptionInsightSchema = z.object({
  question: z.string().trim().min(1, "Question is required"),
});

export type JobDescriptionInput = z.infer<typeof jobDescriptionInputSchema>;
export type JobDescriptionInsightInput = z.infer<
  typeof jobDescriptionInsightSchema
>;

export function serializeJobDescription<T extends {
  createdAt: Date;
  updatedAt: Date;
}>(jobDescription: T) {
  return {
    ...jobDescription,
    createdAt: jobDescription.createdAt.toISOString(),
    updatedAt: jobDescription.updatedAt.toISOString(),
  };
}
