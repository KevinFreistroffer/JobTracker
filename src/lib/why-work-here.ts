export type WhyWorkHereInput = {
  resume: string;
  companyName: string;
  jobDescription: string;
};

export function buildWhyWorkHerePrompt({
  resume,
  companyName,
  jobDescription,
}: WhyWorkHereInput) {
  return `Write a first-person answer to the question: "Why do you want to work for ${companyName}?"

Use the candidate resume and job description below. The answer should:
- Be 2-3 concise paragraphs (about 150-250 words total)
- Connect specific resume experience, skills, and achievements to what ${companyName} needs
- Reference concrete details from the job description (team, product, tech stack, mission, etc.)
- Sound natural and genuine, not like generic corporate filler
- Stay truthful: do not invent employers, projects, skills, or credentials not supported by the resume
- Avoid bullet points; write in complete sentences as if speaking in an interview or cover letter

Candidate resume:
${resume.trim()}

Job description:
${jobDescription.trim()}`;
}

export async function generateWhyWorkHereAnswer(
  input: WhyWorkHereInput,
  apiKey: string,
): Promise<string> {
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
            "You help software engineers write compelling, specific answers to job application questions.",
        },
        {
          role: "user",
          content: buildWhyWorkHerePrompt(input),
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

  const answer = data.choices?.[0]?.message?.content?.trim();
  if (!answer) {
    throw new Error("OpenAI returned an empty response");
  }

  return answer;
}
