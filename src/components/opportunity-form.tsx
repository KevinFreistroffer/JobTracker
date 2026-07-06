"use client";

import { ContactType, OpportunityStatus } from "@prisma/client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { usePersistedState } from "@/hooks/use-persisted-state";
import {
  CONTACT_TYPE_OPTIONS,
  emptyOpportunityForm,
  OpportunityRecord,
  STATUS_OPTIONS,
} from "@/lib/constants";
import {
  combineInterviewAt,
  isInterviewStatus,
  splitInterviewAt,
} from "@/lib/interview-datetime";
import { toOpportunityFormValues } from "@/lib/parse-recruiter-email";

export type OpportunityFormValues = {
  contactType: ContactType | "";
  status: OpportunityStatus;
  recruiterName: string;
  recruiterEmail: string;
  companyName: string;
  roleTitle: string;
  contactDate: string;
  interviewDate: string;
  interviewTime: string;
  interviewReminderEnabled: boolean;
  notes: string;
};

type OpportunityFormProps = {
  initialValues?: Partial<OpportunityFormValues>;
  persistKey?: string;
  enableEmailImport?: boolean;
  onSubmit: (values: OpportunityFormValues) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
};

export function toFormValues(
  opportunity?: OpportunityRecord | null,
): OpportunityFormValues {
  if (!opportunity) {
    return { ...emptyOpportunityForm };
  }

  const { date: interviewDate, time: interviewTime } = splitInterviewAt(
    opportunity.interviewAt,
  );

  return {
    contactType: opportunity.contactType ?? "",
    status: opportunity.status,
    recruiterName: opportunity.recruiterName ?? "",
    recruiterEmail: opportunity.recruiterEmail ?? "",
    companyName: opportunity.companyName ?? "",
    roleTitle: opportunity.roleTitle ?? "",
    contactDate: opportunity.contactDate?.slice(0, 10) ?? "",
    interviewDate,
    interviewTime,
    interviewReminderEnabled: opportunity.interviewReminderEnabled ?? false,
    notes: opportunity.notes ?? "",
  };
}

export function OpportunityForm({
  initialValues,
  persistKey,
  enableEmailImport = false,
  onSubmit,
  onCancel,
  submitLabel = "Save",
}: OpportunityFormProps) {
  const [values, setValues, clearPersisted] = usePersistedState(
    persistKey ?? "job-tracking:opportunity-draft-disabled",
    {
      ...emptyOpportunityForm,
      ...initialValues,
    },
    Boolean(persistKey),
  );
  const [emailPaste, setEmailPaste] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField<K extends keyof OpportunityFormValues>(
    key: K,
    value: OpportunityFormValues[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  function updateStatus(status: OpportunityStatus) {
    setValues((current) => {
      const next = { ...current, status };

      if (!isInterviewStatus(status)) {
        next.interviewDate = "";
        next.interviewTime = "";
        next.interviewReminderEnabled = false;
      }

      return next;
    });
    setErrors((current) => {
      const next = { ...current };
      delete next.status;
      delete next.interviewDate;
      delete next.interviewTime;
      return next;
    });
  }

  const showInterviewFields = isInterviewStatus(values.status);

  function updateContactType(contactType: ContactType) {
    setValues((current) => ({
      ...current,
      contactType,
      recruiterEmail:
        contactType === ContactType.LINKEDIN ? "" : current.recruiterEmail,
    }));
    setErrors((current) => {
      const next = { ...current };
      delete next.contactType;
      delete next.recruiterEmail;
      return next;
    });
  }

  function validate(): boolean {
    const nextErrors: Record<string, string> = {};

    if (
      values.contactType !== ContactType.LINKEDIN &&
      values.recruiterEmail.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.recruiterEmail.trim())
    ) {
      nextErrors.recruiterEmail = "Enter a valid email address";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleParseEmail() {
    setParseError(null);
    setIsParsing(true);

    try {
      const response = await fetch("/api/opportunities/parse-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailText: emailPaste }),
      });

      const body = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(body?.error ?? "Failed to parse recruiter email");
      }

      const parsed = toOpportunityFormValues(body);
      setValues((current) => ({
        ...current,
        ...parsed,
        status: current.status,
      }));
      setErrors({});
    } catch (error) {
      setParseError(
        error instanceof Error
          ? error.message
          : "Failed to parse recruiter email",
      );
    } finally {
      setIsParsing(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(values);
      clearPersisted();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {enableEmailImport ? (
        <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div>
            <Label htmlFor="recruiterEmailPaste">Import from Email</Label>
            <p className="text-sm text-slate-500">
              Paste the full recruiter email or message to auto-fill the form.
            </p>
          </div>
          <Textarea
            id="recruiterEmailPaste"
            value={emailPaste}
            onChange={(event) => setEmailPaste(event.target.value)}
            placeholder="Paste the recruiter email here..."
            className="min-h-[140px] bg-white"
          />
          <Button
            type="button"
            variant="outline"
            disabled={isParsing || !emailPaste.trim()}
            onClick={() => void handleParseEmail()}
          >
            {isParsing ? "Filling..." : "Fill from Email"}
          </Button>
          {parseError ? (
            <p className="text-sm text-red-600">{parseError}</p>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="contactType">Contact Type</Label>
          <Select
            value={values.contactType || undefined}
            onValueChange={(value) => updateContactType(value as ContactType)}
          >
            <SelectTrigger id="contactType">
              <SelectValue placeholder="Optional" />
            </SelectTrigger>
            <SelectContent>
              {CONTACT_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={values.status}
            onValueChange={(value) =>
              updateStatus(value as OpportunityStatus)
            }
          >
            <SelectTrigger id="status">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div
        className={
          values.contactType === ContactType.LINKEDIN
            ? "space-y-2"
            : "grid gap-4 sm:grid-cols-2"
        }
      >
        <div className="space-y-2">
          <Label htmlFor="recruiterName">Recruiter Name</Label>
          <Input
            id="recruiterName"
            value={values.recruiterName}
            onChange={(event) =>
              updateField("recruiterName", event.target.value)
            }
            placeholder="Jane Smith"
          />
        </div>

        {values.contactType !== ContactType.LINKEDIN ? (
          <div className="space-y-2">
            <Label htmlFor="recruiterEmail">Recruiter Email</Label>
            <Input
              id="recruiterEmail"
              type="email"
              value={values.recruiterEmail}
              onChange={(event) =>
                updateField("recruiterEmail", event.target.value)
              }
              placeholder="jane@company.com"
            />
            {errors.recruiterEmail ? (
              <p className="text-sm text-red-600">{errors.recruiterEmail}</p>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="companyName">Company Name</Label>
          <Input
            id="companyName"
            value={values.companyName}
            onChange={(event) => updateField("companyName", event.target.value)}
            placeholder="Acme Corp"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="roleTitle">Role Title</Label>
          <Input
            id="roleTitle"
            value={values.roleTitle}
            onChange={(event) => updateField("roleTitle", event.target.value)}
            placeholder="Senior Software Developer"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="contactDate">Contact Date</Label>
        <Input
          id="contactDate"
          type="date"
          value={values.contactDate}
          onChange={(event) => updateField("contactDate", event.target.value)}
        />
      </div>

      {showInterviewFields ? (
        <div className="space-y-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div>
            <h3 className="text-sm font-medium text-slate-900">
              Interview schedule
            </h3>
            <p className="text-sm text-slate-600">
              Add the interview date and time, and enable a reminder notification.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="interviewDate">Interview Date</Label>
              <Input
                id="interviewDate"
                type="date"
                value={values.interviewDate}
                onChange={(event) =>
                  updateField("interviewDate", event.target.value)
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="interviewTime">Interview Time</Label>
              <Input
                id="interviewTime"
                type="time"
                value={values.interviewTime}
                onChange={(event) =>
                  updateField("interviewTime", event.target.value)
                }
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              id="interviewReminderEnabled"
              type="checkbox"
              checked={values.interviewReminderEnabled}
              onChange={(event) =>
                updateField("interviewReminderEnabled", event.target.checked)
              }
              className="h-4 w-4 rounded border-slate-300"
            />
            Remind me 15 minutes before the interview
          </label>
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={values.notes}
          onChange={(event) => updateField("notes", event.target.value)}
          placeholder="Follow-up details, interview times, compensation notes..."
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
