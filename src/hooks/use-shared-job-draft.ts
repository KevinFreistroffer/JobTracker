"use client";

import { usePersistedState } from "@/hooks/use-persisted-state";
import {
  APPLICATION_MATERIALS_DRAFT_KEY,
  emptyJobDescriptionDraft,
  type JobDescriptionDraft,
} from "@/lib/form-drafts";

export function useSharedJobDraft() {
  return usePersistedState<JobDescriptionDraft>(
    APPLICATION_MATERIALS_DRAFT_KEY,
    emptyJobDescriptionDraft,
  );
}
