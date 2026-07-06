import { z } from "zod";

export type InterviewPrepInput = {
  resume: string;
  companyName: string;
  jobDescription: string;
};

export type InterviewPrep = {
  techStackSummary: string;
  roleFocusSummary: string;
  technicalQuestions: string[];
  culturalQuestions: string[];
};

export const interviewPrepSchema = z.object({
  techStackSummary: z.string().min(1),
  roleFocusSummary: z.string().min(1),
  technicalQuestions: z.array(z.string().min(1)).length(5),
  culturalQuestions: z.array(z.string().min(1)).length(5),
});

export function buildInterviewPrepPrompt({
  resume,
  companyName,
  jobDescription,
}: InterviewPrepInput) {
  const company = companyName.trim() || "the company";

  return `Analyze the job description and candidate resume below for an interview prep session at ${company}.

Return a JSON object with exactly these keys:
- "techStackSummary": A concise paragraph summarizing the technologies, languages, frameworks, cloud services, and tools mentioned or implied in the job description.
- "roleFocusSummary": A concise paragraph summarizing what the company is looking for—key responsibilities, seniority level, domain focus, and must-have vs nice-to-have signals.
- "technicalQuestions": An array of exactly 5 technical interview questions tailored to this role. Mix conceptual and practical questions grounded in the job description's tech stack and the candidate's resume experience. Do not ask generic trivia unrelated to the role.
- "culturalQuestions": An array of exactly 5 cultural-fit interview questions for an individual contributor role. Focus on teamwork, values, motivation, communication, and work style. Do NOT include people-management, leadership-of-teams, or "how would you manage/direct a team" style questions.

Candidate resume:
${resume.trim()}

Job description:
${jobDescription.trim()}`;
}

export function parseInterviewPrepResponse(content: string): InterviewPrep {
  let parsed: unknown;

  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("OpenAI returned invalid JSON");
  }

  const result = interviewPrepSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error("OpenAI returned an invalid interview prep shape");
  }

  return result.data;
}

export async function generateInterviewPrep(
  input: InterviewPrepInput,
  apiKey: string,
): Promise<InterviewPrep> {
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
            "You help software engineers prepare for job interviews by analyzing job descriptions and resumes. Return only valid JSON matching the requested schema.",
        },
        {
          role: "user",
          content: buildInterviewPrepPrompt(input),
        },
      ],
      temperature: 0.7,
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

  return parseInterviewPrepResponse(content);
}
