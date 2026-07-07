import { ContactType } from "@prisma/client";
import { z } from "zod";
import { suggestIsAiRole } from "@/lib/suggest-is-ai-role";

export type ParseRecruiterEmailInput = {
  emailText: string;
};

export type ParsedRecruiterEmail = {
  contactType: ContactType | null;
  recruiterName: string | null;
  recruiterEmail: string | null;
  companyName: string | null;
  roleTitle: string | null;
  contactDate: string | null;
  notes: string | null;
  jobDescription: string | null;
};

export const parsedRecruiterEmailSchema = z.object({
  contactType: z.enum(["EMAIL", "CALL", "LINKEDIN"]).nullable().optional(),
  recruiterName: z.string().nullable().optional(),
  recruiterEmail: z.string().nullable().optional(),
  companyName: z.string().nullable().optional(),
  roleTitle: z.string().nullable().optional(),
  contactDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
  notes: z.string().nullable().optional(),
  jobDescription: z.string().nullable().optional(),
});

export function buildParseRecruiterEmailPrompt(emailText: string) {
  return `Extract recruiter opportunity details from the pasted recruiter message below.

Return a JSON object with exactly these keys:
- "contactType": "EMAIL", "CALL", or "LINKEDIN". Use "EMAIL" for recruiter emails unless the message clearly indicates a phone call or LinkedIn outreach.
- "recruiterName": Recruiter or sender name, or null if unknown.
- "recruiterEmail": Recruiter email address, or null if unknown.
- "companyName": Hiring company or staffing agency representing the role, or null if unknown.
- "roleTitle": Job title or role being discussed, or null if unknown.
- "contactDate": Email or message date in YYYY-MM-DD format if it can be determined from headers or content, otherwise null.
- "notes": A concise summary of useful follow-up details from the message (compensation, location, next steps, links, urgency). Do not repeat fields already captured above. Use an empty string if nothing extra is useful.
- "jobDescription": The full job description text if it appears in the message (requirements, responsibilities, qualifications). Use null if no job description is included. Do not summarize—copy the complete JD when present.

Use null for unknown values. Do not invent details that are not supported by the message.

Pasted recruiter message:
${emailText.trim()}`;
}

export function parseRecruiterEmailResponse(content: string): ParsedRecruiterEmail {
  let parsed: unknown;

  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("OpenAI returned invalid JSON");
  }

  const result = parsedRecruiterEmailSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error("OpenAI returned an invalid recruiter email shape");
  }

  return {
    contactType: result.data.contactType ?? ContactType.EMAIL,
    recruiterName: result.data.recruiterName?.trim() || null,
    recruiterEmail: result.data.recruiterEmail?.trim() || null,
    companyName: result.data.companyName?.trim() || null,
    roleTitle: result.data.roleTitle?.trim() || null,
    contactDate: result.data.contactDate ?? null,
    notes: result.data.notes?.trim() || null,
    jobDescription: result.data.jobDescription?.trim() || null,
  };
}

export async function parseRecruiterEmail(
  input: ParseRecruiterEmailInput,
  apiKey: string,
): Promise<ParsedRecruiterEmail> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You extract structured job opportunity details from recruiter emails and messages. Return only valid JSON matching the requested schema.",
        },
        {
          role: "user",
          content: buildParseRecruiterEmailPrompt(input.emailText),
        },
      ],
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `OpenAI request failed (${response.status}): ${errorBody.slice(0, 300)}`,
    );
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string | null } }>;
  };

  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("OpenAI returned an empty response");
  }

  return parseRecruiterEmailResponse(content);
}

export function toOpportunityFormValues(parsed: ParsedRecruiterEmail) {
  const jobDescription = parsed.jobDescription ?? "";
  const roleTitle = parsed.roleTitle ?? "";

  return {
    contactType: parsed.contactType ?? ContactType.EMAIL,
    status: "NEW" as const,
    recruiterName: parsed.recruiterName ?? "",
    recruiterEmail: parsed.recruiterEmail ?? "",
    companyName: parsed.companyName ?? "",
    roleTitle,
    contactDate: parsed.contactDate ?? "",
    notes: parsed.notes ?? "",
    jobDescription,
    isAiRole: suggestIsAiRole(roleTitle || null, jobDescription),
  };
}
