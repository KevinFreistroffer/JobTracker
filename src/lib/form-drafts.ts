export const APPLICATION_MATERIALS_DRAFT_KEY =
  "job-tracking:application-materials-draft";
export const OPPORTUNITY_DRAFT_KEY = "job-tracking:opportunity-draft";

export type JobDescriptionDraft = {
  companyName: string;
  jobDescription: string;
};

export const emptyJobDescriptionDraft: JobDescriptionDraft = {
  companyName: "",
  jobDescription: "",
};
