export type WhyWorkHereInput = {
  resume: string;
  companyName: string;
  jobDescription: string;
};

export type WhyWorkHereAnswer = {
  shortAnswer: string;
  longAnswer: string;
};

export function buildWhyWorkHerePrompt({
  resume,
  companyName,
  jobDescription,
}: WhyWorkHereInput) {
  return `Write two first-person answers to the question: "Why do you want to work for ${companyName}?"

Use the candidate resume and job description below.

The short answer should:
- Be 1-2 sentences total
- Sound like this style: "I am excited about the opportunity to work at [company] because I am passionate about [mission/domain]. With over eight years of experience as a full-stack software engineer, I have honed my skills in [specific skills], which align with [company]'s needs."
- Be specific to ${companyName}; do not copy the example wording exactly unless it genuinely fits the job description

The long answer should:
- Be 2-3 concise paragraphs (about 150-250 words total)
- Connect specific resume experience, skills, and achievements to what ${companyName} needs
- Reference concrete details from the job description (team, product, tech stack, mission, etc.)
- Sound natural and genuine, not like generic corporate filler
- Stay truthful: do not invent employers, projects, skills, or credentials not supported by the resume
- Avoid bullet points; write in complete sentences as if speaking in an interview or cover letter

Return only valid JSON with this exact shape:
{
  "shortAnswer": "1-2 sentence answer",
  "longAnswer": "2-3 paragraph answer"
}

Candidate resume:
${resume.trim()}

Job description:
${jobDescription.trim()}`;
}

export async function generateWhyWorkHereAnswer(
  input: WhyWorkHereInput,
  apiKey: string,
): Promise<WhyWorkHereAnswer> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You help software engineers write compelling, specific answers to job application questions. Return only valid JSON.",
        },
        {
          role: "user",
          content: buildWhyWorkHerePrompt(input),
        },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
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

  const parsed = JSON.parse(content) as Partial<WhyWorkHereAnswer>;
  if (!parsed.shortAnswer || !parsed.longAnswer) {
    throw new Error("OpenAI response did not include both answer versions");
  }

  return {
    shortAnswer: parsed.shortAnswer.trim(),
    longAnswer: parsed.longAnswer.trim(),
  };
}
