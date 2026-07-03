import { generateCoverLetter } from "@/lib/cover-letter";
import { generateWhyWorkHereAnswer } from "@/lib/why-work-here";

export type ApplicationMaterialsInput = {
  resume: string;
  companyName: string;
  jobDescription: string;
};

export type ApplicationMaterials = {
  coverLetter: string;
  shortAnswer: string;
  longAnswer: string;
};

export async function generateApplicationMaterials(
  input: ApplicationMaterialsInput,
  apiKey: string,
): Promise<ApplicationMaterials> {
  const [coverLetter, whyWorkHere] = await Promise.all([
    generateCoverLetter(input, apiKey),
    generateWhyWorkHereAnswer(input, apiKey),
  ]);

  return {
    coverLetter,
    ...whyWorkHere,
  };
}
