"use client";

import { useEffect } from "react";
import type { OpportunityRecord } from "@/lib/constants";
import {
  buildInterviewNotificationBody,
  buildInterviewNotificationKey,
  DEFAULT_REMINDER_MINUTES_BEFORE,
  shouldNotifyInterview,
} from "@/lib/interview-datetime";

const NOTIFIED_STORAGE_KEY = "job-tracking:interview-reminders-notified";

function readNotifiedKeys(): Set<string> {
  if (typeof window === "undefined") {
    return new Set();
  }

  try {
    const raw = window.localStorage.getItem(NOTIFIED_STORAGE_KEY);
    if (!raw) {
      return new Set();
    }

    const parsed = JSON.parse(raw) as string[];
    return new Set(parsed);
  } catch {
    return new Set();
  }
}

function writeNotifiedKeys(keys: Set<string>) {
  window.localStorage.setItem(
    NOTIFIED_STORAGE_KEY,
    JSON.stringify([...keys]),
  );
}

function markNotified(key: string) {
  const keys = readNotifiedKeys();
  keys.add(key);
  writeNotifiedKeys(keys);
}

export function showInterviewNotification(opportunity: OpportunityRecord) {
  if (!opportunity.interviewAt || typeof window === "undefined") {
    return;
  }

  const body = buildInterviewNotificationBody(opportunity, opportunity.interviewAt);
  const title = "Upcoming interview reminder";

  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, { body });
    return;
  }

  window.alert(`${title}\n\n${body}`);
}

type UseInterviewRemindersOptions = {
  opportunities: OpportunityRecord[];
  enabled?: boolean;
  minutesBefore?: number;
  onNotify?: (opportunity: OpportunityRecord) => void;
};

export function useInterviewReminders({
  opportunities,
  enabled = true,
  minutesBefore = DEFAULT_REMINDER_MINUTES_BEFORE,
  onNotify = showInterviewNotification,
}: UseInterviewRemindersOptions) {
  useEffect(() => {
    if (!enabled || typeof window === "undefined") {
      return;
    }

    function checkReminders() {
      const now = new Date();
      const notifiedKeys = readNotifiedKeys();

      for (const opportunity of opportunities) {
        if (!shouldNotifyInterview(opportunity, now, minutesBefore)) {
          continue;
        }

        if (!opportunity.interviewAt) {
          continue;
        }

        const key = buildInterviewNotificationKey(
          opportunity.id,
          opportunity.interviewAt,
        );

        if (notifiedKeys.has(key)) {
          continue;
        }

        onNotify(opportunity);
        markNotified(key);
        notifiedKeys.add(key);
      }
    }

    if ("Notification" in window && Notification.permission === "default") {
      void Notification.requestPermission().then(() => {
        checkReminders();
      });
    } else {
      checkReminders();
    }

    const intervalId = window.setInterval(checkReminders, 60_000);
    return () => window.clearInterval(intervalId);
  }, [enabled, minutesBefore, onNotify, opportunities]);
}
