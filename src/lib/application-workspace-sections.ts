export const APPLICATION_WORKSPACE_SECTIONS = [
  { id: "job-input", label: "Job Description" },
  { id: "cover-letter", label: "Cover Letter" },
  { id: "why-work-here-short", label: "Why Work Here (Short)" },
  { id: "why-work-here-long", label: "Why Work Here (Long)" },
  { id: "tech-stack-summary", label: "Tech Stack Summary" },
  { id: "role-focus-summary", label: "Role Focus" },
  { id: "technical-questions", label: "Technical Questions" },
  { id: "cultural-questions", label: "Culture Questions" },
] as const;

export type ApplicationWorkspaceSectionId =
  (typeof APPLICATION_WORKSPACE_SECTIONS)[number]["id"];

export function scrollToWorkspaceSection(id: ApplicationWorkspaceSectionId) {
  document.getElementById(id)?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}
