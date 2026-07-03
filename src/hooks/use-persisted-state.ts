"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getPersistedValue,
  removePersistedValue,
  setPersistedValue,
} from "@/lib/persisted-storage";

export function usePersistedState<T>(
  key: string,
  initialValue: T,
  enabled = true,
) {
  const [state, setState] = useState(initialValue);
  const [isHydrated, setIsHydrated] = useState(!enabled);

  useEffect(() => {
    if (!enabled) {
      setIsHydrated(true);
      return;
    }

    const stored = getPersistedValue<T>(key);
    if (stored !== null) {
      setState(stored);
    }

    setIsHydrated(true);
  }, [enabled, key]);

  useEffect(() => {
    if (!enabled || !isHydrated) {
      return;
    }

    setPersistedValue(key, state);
  }, [enabled, isHydrated, key, state]);

  const clearPersisted = useCallback(() => {
    if (!enabled) {
      return;
    }

    removePersistedValue(key);
  }, [enabled, key]);

  return [state, setState, clearPersisted, isHydrated] as const;
}
