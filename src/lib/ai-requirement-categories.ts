import { z } from "zod";

export const AI_REQUIREMENT_CATEGORIES = [
  "governance",
  "security",
  "infrastructure",
  "models",
  "vendors",
  "mlops",
  "data",
  "strategy",
  "other",
] as const;

export type AiRequirementCategory = (typeof AI_REQUIREMENT_CATEGORIES)[number];

export const aiRequirementCategorySchema = z.enum(AI_REQUIREMENT_CATEGORIES);
