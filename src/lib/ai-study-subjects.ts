import { z } from "zod";

export type StudySubjectRequirement = {
  canonicalText: string;
  occurrenceCount: number;
  category: string | null;
};

export type AiStudySubjectsInput = {
  requirements: StudySubjectRequirement[];
};

export type StudySubject = {
  name: string;
  rationale: string;
  relatedRequirements: string[];
  priority: "high" | "medium" | "low";
};

export type AiStudySubjectsResult = {
  subjects: StudySubject[];
};

const studySubjectSchema = z.object({
  name: z.string().trim().min(1),
  rationale: z.string().trim().min(1),
  relatedRequirements: z.array(z.string().trim().min(1)).min(1),
  priority: z.enum(["high", "medium", "low"]),
});

export const aiStudySubjectsSchema = z.object({
  subjects: z.array(studySubjectSchema).min(1),
});

function formatRequirementsForStudy(
  requirements: StudySubjectRequirement[],
) {
  return requirements
    .map(
      (requirement, index) =>
        `${index + 1}. (${requirement.occurrenceCount} JD${requirement.occurrenceCount === 1 ? "" : "s"})${
          requirement.category ? ` [${requirement.category}]` : ""
        } ${requirement.canonicalText}`,
    )
    .join("\n");
}

export function buildAiStudySubjectsPrompt({
  requirements,
}: AiStudySubjectsInput) {
  return `You are helping a job seeker prioritize what to study for AI-focused roles.

Given the deduplicated AI job requirements below (with how many job descriptions mention each), return a JSON object with exactly this key:
- "subjects": an array of study subjects ranked by importance. Each subject has:
  - "name": a concise study area name (for example "AI Governance & Security")
  - "rationale": 1-2 sentences explaining why this matters based on the requirements
  - "relatedRequirements": array of canonical requirement texts from the list that support this subject
  - "priority": "high", "medium", or "low"

Guidelines:
- Return 5-10 subjects when enough requirements exist; fewer if the corpus is small
- Prioritize subjects that appear across multiple job descriptions
- Group related requirements into practical study areas a candidate can prepare for
- Order subjects from highest to lowest priority

Unique AI requirements:
${formatRequirementsForStudy(requirements)}`;
}

export function parseAiStudySubjectsResponse(
  content: string,
): AiStudySubjectsResult {
  let parsed: unknown;

  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("OpenAI returned invalid JSON");
  }

  const result = aiStudySubjectsSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error("OpenAI returned an invalid study subjects shape");
  }

  return result.data;
}

export async function generateAiStudySubjects(
  input: AiStudySubjectsInput,
  apiKey: string,
): Promise<AiStudySubjectsResult> {
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
            "You help job seekers prioritize study areas for AI roles based on job requirement patterns. Return only valid JSON matching the requested schema.",
        },
        {
          role: "user",
          content: buildAiStudySubjectsPrompt(input),
        },
      ],
      temperature: 0.5,
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

  return parseAiStudySubjectsResponse(content);
}
