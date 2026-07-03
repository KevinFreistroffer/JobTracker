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

export type OpportunityFormValues = {
  contactType: ContactType | "";
  status: OpportunityStatus;
  recruiterName: string;
  recruiterEmail: string;
  companyName: string;
  roleTitle: string;
  contactDate: string;
  notes: string;
};

type OpportunityFormProps = {
  initialValues?: Partial<OpportunityFormValues>;
  persistKey?: string;
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

  return {
    contactType: opportunity.contactType ?? "",
    status: opportunity.status,
    recruiterName: opportunity.recruiterName ?? "",
    recruiterEmail: opportunity.recruiterEmail ?? "",
    companyName: opportunity.companyName ?? "",
    roleTitle: opportunity.roleTitle ?? "",
    contactDate: opportunity.contactDate?.slice(0, 10) ?? "",
    notes: opportunity.notes ?? "",
  };
}

export function OpportunityForm({
  initialValues,
  persistKey,
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
              updateField("status", value as OpportunityStatus)
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
