const AI_ROLE_PATTERN =
  /\b(AI|ML|MLOps|LLM|LLMs|generative(?:\s+AI)?|machine\s+learning|artificial\s+intelligence|data\s+science|deep\s+learning|neural\s+networks?)\b/i;

export function suggestIsAiRole(roleTitle: string | null, body: string): boolean {
  const combined = [roleTitle ?? "", body].join("\n").trim();
  return AI_ROLE_PATTERN.test(combined);
}
