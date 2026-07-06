export const MAX_CORPUS_CHARS = 400_000;

export type JdInsightsJobDescription = {
  companyName: string;
  roleTitle: string | null;
  body: string;
  createdAt: string;
};

export type JdInsightsInput = {
  question: string;
  jobDescriptions: JdInsightsJobDescription[];
};

export function getCorpusCharCount(
  jobDescriptions: JdInsightsJobDescription[],
): number {
  return jobDescriptions.reduce(
    (total, jobDescription) =>
      total +
      jobDescription.companyName.length +
      (jobDescription.roleTitle?.length ?? 0) +
      jobDescription.body.length +
      jobDescription.createdAt.length,
    0,
  );
}

function formatJobDescriptionBlock(
  jobDescription: JdInsightsJobDescription,
  index: number,
) {
  const roleLine = jobDescription.roleTitle
    ? `Role: ${jobDescription.roleTitle}\n`
    : "";

  return `--- Job Description ${index + 1} ---
Company: ${jobDescription.companyName}
${roleLine}Saved: ${jobDescription.createdAt}
Description:
${jobDescription.body.trim()}`;
}

export function buildJdInsightsPrompt({
  question,
  jobDescriptions,
}: JdInsightsInput) {
  const corpus = jobDescriptions
    .map((jobDescription, index) =>
      formatJobDescriptionBlock(jobDescription, index),
    )
    .join("\n\n");

  return `You are analyzing a personal library of ${jobDescriptions.length} saved job descriptions.

Answer the user's question using only the evidence in the job descriptions below.

Guidelines:
- Identify patterns, common requirements, and notable outliers across the corpus
- If the question implies a filter (for example "Python-heavy", "AI/ML", "remote-first", "senior"), apply that filter to the relevant job descriptions before answering
- If the corpus does not contain enough relevant evidence, say so clearly instead of guessing
- Be specific and practical. Mention recurring skills, responsibilities, seniority signals, and tools when supported by the corpus
- Write in clear prose. Use short paragraphs or bullet points when helpful

User question:
${question.trim()}

Saved job descriptions:
${corpus}`;
}

export async function generateJdInsights(
  input: JdInsightsInput,
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
            "You help software engineers analyze patterns across their saved job descriptions. Stay grounded in the provided corpus.",
        },
        {
          role: "user",
          content: buildJdInsightsPrompt(input),
        },
      ],
      temperature: 0.4,
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
