import { ContactType, OpportunityStatus } from "@prisma/client";
import { z } from "zod";

const contactTypeSchema = z.nativeEnum(ContactType);
const statusSchema = z.nativeEnum(OpportunityStatus);

export const opportunityInputSchema = z.object({
  contactType: contactTypeSchema,
  status: statusSchema.default(OpportunityStatus.NEW),
  recruiterName: z.string().trim().min(1, "Recruiter name is required"),
  recruiterEmail: z
    .union([z.string().trim().email("Enter a valid email address"), z.literal("")])
    .optional()
    .transform((value) => (value === "" || value === undefined ? null : value)),
  companyName: z.string().trim().min(1, "Company name is required"),
  roleTitle: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value === "" ? null : value ?? null)),
  contactDate: z.coerce.date({
    errorMap: () => ({ message: "Contact date is required" }),
  }),
  notes: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value === "" ? null : value ?? null)),
});

export const opportunityUpdateSchema = opportunityInputSchema.partial();

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
