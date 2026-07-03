/** Resolves the OpenAI API key from supported environment variable names. */
export function getOpenAiApiKey(): string | undefined {
  return process.env.OPENAI_API_KEY ?? process.env.OPEN_API_KEY;
}
