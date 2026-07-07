import { z } from "zod";
import { aiRequirementCategorySchema } from "@/lib/ai-requirement-categories";

export type AiRequirementExtractInput = {
  companyName: string;
  roleTitle: string | null;
  jobDescriptionId: string;
  body: string;
};

export type ExtractedAiRequirement = {
  text: string;
  category?: string;
};

export type AiRequirementExtractResult = {
  requirements: ExtractedAiRequirement[];
};

const extractedRequirementSchema = z.object({
  text: z.string().trim().min(1),
  category: aiRequirementCategorySchema.optional(),
});

export const aiRequirementExtractSchema = z.object({
  requirements: z.array(extractedRequirementSchema),
});

export function buildAiRequirementExtractPrompt({
  companyName,
  roleTitle,
  jobDescriptionId,
  body,
}: AiRequirementExtractInput) {
  const roleLine = roleTitle ? `Role: ${roleTitle}\n` : "";

  return `Extract AI-specific job requirements from the job description below.

Focus only on requirements related to artificial intelligence, machine learning, LLMs, MLOps, AI governance, AI security, model deployment, AI vendors/platforms, data for AI, and AI strategy. Do NOT include generic software engineering requirements unless they are clearly AI-specific (for example "experience with Python for ML pipelines" counts; "5+ years of software engineering" does not).

Return a JSON object with exactly this key:
- "requirements": an array of objects, each with:
  - "text": a concise requirement phrase in the employer's voice (for example "Advanced knowledge of AI systems/vendors, models, capacity planning and provisioning")
  - "category" (optional): one of governance, security, infrastructure, models, vendors, mlops, data, strategy, other

If there are no AI-specific requirements, return an empty array.

Job description ID: ${jobDescriptionId}
Company: ${companyName}
${roleLine}
Description:
${body.trim()}`;
}

export function parseAiRequirementExtractResponse(
  content: string,
): AiRequirementExtractResult {
  let parsed: unknown;

  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("OpenAI returned invalid JSON");
  }

  const result = aiRequirementExtractSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error("OpenAI returned an invalid AI requirement extract shape");
  }

  return result.data;
}

export async function extractAiRequirementsFromJobDescription(
  input: AiRequirementExtractInput,
  apiKey: string,
): Promise<AiRequirementExtractResult> {
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
            "You extract AI-specific job requirements from job descriptions. Return only valid JSON matching the requested schema.",
        },
        {
          role: "user",
          content: buildAiRequirementExtractPrompt(input),
        },
      ],
      temperature: 0.3,
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

  return parseAiRequirementExtractResponse(content);
}
