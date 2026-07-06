export function isAllowedGitHubUsername(
  username: string | null | undefined,
): boolean {
  const allowed = process.env.ALLOWED_GITHUB_USERNAME?.trim();
  if (!allowed || !username) {
    return false;
  }

  return username.toLowerCase() === allowed.toLowerCase();
}
