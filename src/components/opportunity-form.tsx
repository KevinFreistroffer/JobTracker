"use client";

import { ContactType, OpportunityStatus } from "@prisma/client";
import { useEffect, useState } from "react";
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
import {
  CONTACT_TYPE_OPTIONS,
  emptyOpportunityForm,
  OpportunityRecord,
  STATUS_OPTIONS,
} from "@/lib/constants";

export type OpportunityFormValues = {
  contactType: ContactType;
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
    contactType: opportunity.contactType,
    status: opportunity.status,
    recruiterName: opportunity.recruiterName,
    recruiterEmail: opportunity.recruiterEmail ?? "",
    companyName: opportunity.companyName,
    roleTitle: opportunity.roleTitle ?? "",
    contactDate: opportunity.contactDate.slice(0, 10),
    notes: opportunity.notes ?? "",
  };
}

export function OpportunityForm({
  initialValues,
  onSubmit,
  onCancel,
  submitLabel = "Save",
}: OpportunityFormProps) {
  const [values, setValues] = useState<OpportunityFormValues>({
    ...emptyOpportunityForm,
    ...initialValues,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setValues({
      ...emptyOpportunityForm,
      ...initialValues,
    });
    setErrors({});
  }, [initialValues]);

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

  function validate(): boolean {
    const nextErrors: Record<string, string> = {};

    if (!values.recruiterName.trim()) {
      nextErrors.recruiterName = "Recruiter name is required";
    }
    if (!values.companyName.trim()) {
      nextErrors.companyName = "Company name is required";
    }
    if (!values.contactDate) {
      nextErrors.contactDate = "Contact date is required";
    }
    if (
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
            value={values.contactType}
            onValueChange={(value) =>
              updateField("contactType", value as ContactType)
            }
          >
            <SelectTrigger id="contactType">
              <SelectValue placeholder="Select type" />
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

      <div className="grid gap-4 sm:grid-cols-2">
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
          {errors.recruiterName ? (
            <p className="text-sm text-red-600">{errors.recruiterName}</p>
          ) : null}
        </div>

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
          {errors.companyName ? (
            <p className="text-sm text-red-600">{errors.companyName}</p>
          ) : null}
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
        {errors.contactDate ? (
          <p className="text-sm text-red-600">{errors.contactDate}</p>
        ) : null}
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
