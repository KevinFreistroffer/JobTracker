import { z } from "zod";
import { aiRequirementCategorySchema } from "@/lib/ai-requirement-categories";

export type MergeMember = {
  jobDescriptionId: string;
  rawText: string;
};

export type ExistingCanonicalRequirement = {
  id: string;
  canonicalText: string;
  category: string | null;
};

export type AiRequirementMergeInput = {
  existingRequirements: ExistingCanonicalRequirement[];
  newRequirements: MergeMember[];
};

export type MergedRequirementGroup = {
  canonicalText: string;
  category?: string;
  members: MergeMember[];
};

export type AiRequirementMergeResult = {
  groups: MergedRequirementGroup[];
};

const mergeMemberSchema = z.object({
  jobDescriptionId: z.string().min(1),
  rawText: z.string().trim().min(1),
});

const mergedGroupSchema = z.object({
  canonicalText: z.string().trim().min(1),
  category: aiRequirementCategorySchema.optional(),
  members: z.array(mergeMemberSchema).min(1),
});

export const aiRequirementMergeSchema = z.object({
  groups: z.array(mergedGroupSchema),
});

function formatExistingRequirements(
  requirements: ExistingCanonicalRequirement[],
) {
  if (requirements.length === 0) {
    return "(none)";
  }

  return requirements
    .map(
      (requirement, index) =>
        `${index + 1}. [id=${requirement.id}] ${requirement.canonicalText}${
          requirement.category ? ` (category: ${requirement.category})` : ""
        }`,
    )
    .join("\n");
}

function formatNewRequirements(requirements: MergeMember[]) {
  if (requirements.length === 0) {
    return "(none)";
  }

  return requirements
    .map(
      (requirement, index) =>
        `${index + 1}. [jobDescriptionId=${requirement.jobDescriptionId}] ${requirement.rawText}`,
    )
    .join("\n");
}

export function buildAiRequirementMergePrompt({
  existingRequirements,
  newRequirements,
}: AiRequirementMergeInput) {
  return `Merge AI job requirements into deduplicated canonical groups.

You are given:
1. Existing canonical requirements already stored in the database
2. Newly extracted raw requirements from job descriptions

Return a JSON object with exactly this key:
- "groups": an array of merged groups. Each group has:
  - "canonicalText": a clear, generalized requirement phrase
  - "category" (optional): one of governance, security, infrastructure, models, vendors, mlops, data, strategy, other
  - "members": array of { "jobDescriptionId", "rawText" } for every raw requirement in this group

Merge rules:
- Combine semantically equivalent requirements (for example "AI governance" and "governance and security best practices for AI")
- Keep distinct requirements separate when they represent different study areas
- Prefer clear, generalized canonical phrasing
- Every new raw requirement must appear in exactly one group's members
- Reuse or refine existing canonical wording when a new requirement matches an existing group
- Include existing-only groups unchanged if they still apply (with an empty members array is NOT allowed — only return groups that have at least one member from the new requirements list OR represent a merge of new + existing)

Important: Every item in the "New raw requirements" list must appear in exactly one group's members array.

Existing canonical requirements:
${formatExistingRequirements(existingRequirements)}

New raw requirements:
${formatNewRequirements(newRequirements)}`;
}

export function parseAiRequirementMergeResponse(
  content: string,
): AiRequirementMergeResult {
  let parsed: unknown;

  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("OpenAI returned invalid JSON");
  }

  const result = aiRequirementMergeSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error("OpenAI returned an invalid AI requirement merge shape");
  }

  return result.data;
}

export async function mergeAiRequirements(
  input: AiRequirementMergeInput,
  apiKey: string,
): Promise<AiRequirementMergeResult> {
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
            "You deduplicate and merge AI job requirements into canonical groups. Return only valid JSON matching the requested schema.",
        },
        {
          role: "user",
          content: buildAiRequirementMergePrompt(input),
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

  return parseAiRequirementMergeResponse(content);
}
