import { ContactType, OpportunityStatus } from "@prisma/client";
import { z } from "zod";

const contactTypeSchema = z.nativeEnum(ContactType);
const statusSchema = z.nativeEnum(OpportunityStatus);

const opportunityObjectSchema = z.object({
  contactType: contactTypeSchema,
  status: statusSchema.default(OpportunityStatus.NEW),
  recruiterName: z.string().trim().min(1, "Recruiter name is required"),
  recruiterEmail: z.string().trim().optional(),
  companyName: z.string().trim().min(1, "Company name is required"),
  roleTitle: z.string().trim().optional(),
  contactDate: z.coerce.date({
    errorMap: () => ({ message: "Contact date is required" }),
  }),
  notes: z.string().trim().optional(),
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

function normalizeOptionalText(value: string | undefined) {
  if (value === undefined) {
    return undefined;
  }

  return value === "" ? null : value;
}

function normalizeOpportunity<T extends Partial<OpportunityObject>>(data: T) {
  const roleTitle = normalizeOptionalText(data.roleTitle);
  const notes = normalizeOptionalText(data.notes);

  if (data.contactType === ContactType.LINKEDIN) {
    return {
      ...data,
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
    recruiterEmail,
    roleTitle,
    notes,
  };
}

export const opportunityInputSchema = opportunityObjectSchema
  .superRefine(validateRecruiterEmail)
  .transform((data) => normalizeOpportunity(data));

export const opportunityUpdateSchema = opportunityObjectSchema
  .partial()
  .superRefine((data, ctx) => {
    if (data.recruiterEmail === undefined) {
      return;
    }

    validateRecruiterEmail(
      {
        contactType: data.contactType ?? ContactType.EMAIL,
        recruiterEmail: data.recruiterEmail,
      },
      ctx,
    );
  })
  .transform((data) => normalizeOpportunity(data));

export type OpportunityInput = z.infer<typeof opportunityInputSchema>;
export type OpportunityUpdateInput = z.infer<typeof opportunityUpdateSchema>;

export function serializeOpportunity<T extends {
  contactDate: Date;
  createdAt: Date;
  updatedAt: Date;
}>(opportunity: T) {
  return {
    ...opportunity,
    contactDate: opportunity.contactDate.toISOString(),
    createdAt: opportunity.createdAt.toISOString(),
    updatedAt: opportunity.updatedAt.toISOString(),
  };
}
