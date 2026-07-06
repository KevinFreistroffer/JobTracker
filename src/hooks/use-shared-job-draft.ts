"use client";

import {
  useCallback,
  useMemo,
  type Dispatch,
  type SetStateAction,
} from "react";
import { usePersistedState } from "@/hooks/use-persisted-state";
import {
  APPLICATION_MATERIALS_DRAFT_KEY,
  emptyJobDescriptionDraft,
  type JobDescriptionDraft,
} from "@/lib/form-drafts";

function normalizeJobDescriptionDraft(
  draft: Partial<JobDescriptionDraft>,
): JobDescriptionDraft {
  return {
    ...emptyJobDescriptionDraft,
    ...draft,
  };
}

export function useSharedJobDraft() {
  const [rawState, setRawState, clearPersisted, isHydrated] = usePersistedState(
    APPLICATION_MATERIALS_DRAFT_KEY,
    emptyJobDescriptionDraft,
  );

  const state = useMemo(
    () => normalizeJobDescriptionDraft(rawState),
    [rawState],
  );

  const setState = useCallback<Dispatch<SetStateAction<JobDescriptionDraft>>>(
    (update) => {
      setRawState((current) => {
        const normalizedCurrent = normalizeJobDescriptionDraft(current);
        const next =
          typeof update === "function" ? update(normalizedCurrent) : update;

        return normalizeJobDescriptionDraft(next);
      });
    },
    [setRawState],
  );

  return [state, setState, clearPersisted, isHydrated] as const;
}
