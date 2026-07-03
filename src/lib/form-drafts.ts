export const COVER_LETTER_DRAFT_KEY = "job-tracking:cover-letter-draft";
export const WHY_WORK_HERE_DRAFT_KEY = "job-tracking:why-work-here-draft";
export const OPPORTUNITY_DRAFT_KEY = "job-tracking:opportunity-draft";

export type JobDescriptionDraft = {
  companyName: string;
  jobDescription: string;
};

export const emptyJobDescriptionDraft: JobDescriptionDraft = {
  companyName: "",
  jobDescription: "",
};
