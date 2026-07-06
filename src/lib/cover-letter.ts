export type CoverLetterInput = {
  resume: string;
  companyName: string;
  jobDescription: string;
};

const CANDIDATE_NAME = "Kevin Freistroffer";

export function buildCoverLetterPrompt({
  resume,
  companyName,
  jobDescription,
}: CoverLetterInput) {
  const company = companyName.trim() || "the company";

  return `Write a tailored, professional cover letter for a software engineering role at ${company}.

Use the candidate resume and job description below. The cover letter should:
- Open with a strong, specific hook about why the candidate is a great fit for ${company} and this role
- Be 3-4 concise paragraphs (about 250-350 words total)
- Connect specific resume experience, skills, and measurable achievements to what the job description asks for
- Reference concrete details from the job description (team, product, tech stack, mission, responsibilities)
- Sound natural, confident, and genuine, not like generic corporate filler
- Stay truthful: do not invent employers, projects, skills, or credentials not supported by the resume
- Be written in the first person as the candidate
- Close with a professional call to action and sign-off

Formatting:
- Start with a greeting (use "Dear Hiring Manager," if no specific name is available)
- Use complete paragraphs, not bullet points
- End with "Sincerely," followed by the candidate's name: ${CANDIDATE_NAME}. Do not use placeholder text.

Candidate resume:
${resume.trim()}

Job description:
${jobDescription.trim()}`;
}

export async function generateCoverLetter(
  input: CoverLetterInput,
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
            "You help software engineers write compelling, specific, and truthful cover letters tailored to a job description.",
        },
        {
          role: "user",
          content: buildCoverLetterPrompt(input),
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

  const coverLetter = data.choices?.[0]?.message?.content?.trim();
  if (!coverLetter) {
    throw new Error("OpenAI returned an empty response");
  }

  return coverLetter;
}
