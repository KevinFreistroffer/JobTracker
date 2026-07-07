"use client";

import Link from "next/link";
import { format } from "date-fns";
import { Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const PREVIEW_LENGTH = 200;

export type JobDescriptionRecord = {
  id: string;
  companyName: string;
  roleTitle: string | null;
  body: string;
  isAiRole: boolean;
  createdAt: string;
  updatedAt: string;
};

type SavedJobDescriptionItemProps = {
  jobDescription: JobDescriptionRecord;
  expanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onToggleAiRole: (isAiRole: boolean) => void;
  isTogglingAiRole: boolean;
};

export function getJobDescriptionPreview(
  body: string,
  expanded: boolean,
  previewLength = PREVIEW_LENGTH,
) {
  const needsTruncation = body.length > previewLength;

  if (!needsTruncation || expanded) {
    return {
      text: body,
      needsTruncation,
    };
  }

  return {
    text: `${body.slice(0, previewLength).trimEnd()}…`,
    needsTruncation,
  };
}

export function SavedJobDescriptionItem({
  jobDescription,
  expanded,
  onToggle,
  onDelete,
  onToggleAiRole,
  isTogglingAiRole,
}: SavedJobDescriptionItemProps) {
  const { text, needsTruncation } = getJobDescriptionPreview(
    jobDescription.body,
    expanded,
  );

  return (
    <article className="rounded-md border border-slate-200 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-2">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-medium text-slate-900">
                {jobDescription.companyName}
                {jobDescription.roleTitle
                  ? ` — ${jobDescription.roleTitle}`
                  : ""}
              </h3>
              {jobDescription.isAiRole ? (
                <Badge variant="secondary">AI role</Badge>
              ) : null}
            </div>
            <p className="text-xs text-slate-500">
              Saved {format(new Date(jobDescription.createdAt), "MMM d, yyyy")}
            </p>
          </div>

          <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
            {text}
          </p>

          {needsTruncation ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onToggle}
              aria-expanded={expanded}
            >
              {expanded ? "Show less" : "Show full description"}
            </Button>
          ) : null}

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={jobDescription.isAiRole}
              disabled={isTogglingAiRole}
              onChange={(event) => onToggleAiRole(event.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
            AI role
          </label>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Delete</span>
        </Button>
      </div>
    </article>
  );
}

export function JdLibrary() {
  const [jobDescriptions, setJobDescriptions] = useState<JobDescriptionRecord[]>(
    [],
  );
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [insightError, setInsightError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [deletingJobDescription, setDeletingJobDescription] =
    useState<JobDescriptionRecord | null>(null);
  const [togglingAiRoleId, setTogglingAiRoleId] = useState<string | null>(null);

  const loadJobDescriptions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/job-descriptions");
      const body = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(body?.error ?? "Failed to load job descriptions");
      }

      setJobDescriptions(body as JobDescriptionRecord[]);
      setExpandedIds(new Set());
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load job descriptions",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadJobDescriptions();
  }, [loadJobDescriptions]);

  function toggleExpanded(id: string) {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  async function handleGenerateInsight(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setInsightError(null);
    setAnswer(null);
    setCopied(false);
    setIsGenerating(true);

    try {
      const response = await fetch("/api/job-descriptions/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });

      const body = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(body?.error ?? "Failed to generate insight");
      }

      setAnswer(body.answer as string);
    } catch (generateError) {
      setInsightError(
        generateError instanceof Error
          ? generateError.message
          : "Failed to generate insight",
      );
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleToggleAiRole(
    jobDescription: JobDescriptionRecord,
    isAiRole: boolean,
  ) {
    setTogglingAiRoleId(jobDescription.id);
    setError(null);

    try {
      const response = await fetch(
        `/api/job-descriptions/${jobDescription.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isAiRole }),
        },
      );

      const body = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(body?.error ?? "Failed to update AI role flag");
      }

      setJobDescriptions((current) =>
        current.map((item) =>
          item.id === jobDescription.id ? { ...item, isAiRole } : item,
        ),
      );
    } catch (toggleError) {
      setError(
        toggleError instanceof Error
          ? toggleError.message
          : "Failed to update AI role flag",
      );
    } finally {
      setTogglingAiRoleId(null);
    }
  }

  async function handleDelete() {
    if (!deletingJobDescription) {
      return;
    }

    try {
      const response = await fetch(
        `/api/job-descriptions/${deletingJobDescription.id}`,
        { method: "DELETE" },
      );

      const body = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(body?.error ?? "Failed to delete job description");
      }

      setDeletingJobDescription(null);
      await loadJobDescriptions();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to delete job description",
      );
      setDeletingJobDescription(null);
    }
  }

  async function handleCopy() {
    if (!answer) {
      return;
    }

    await navigator.clipboard.writeText(answer);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          JD Library
        </h1>
        <p className="mt-1 text-slate-600">
          Archive saved job descriptions and ask questions across your library.
        </p>
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <form
        className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 sm:p-6"
        onSubmit={(event) => void handleGenerateInsight(event)}
      >
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Ask Across Your Library
          </h2>
          <p className="text-sm text-slate-500">
            Ask open-ended questions like what Python-heavy roles typically
            require.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="insightQuestion">Question</Label>
          <Textarea
            id="insightQuestion"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="What do Python-heavy roles typically require?"
            className="min-h-[120px]"
            required
          />
        </div>

        <Button
          type="submit"
          disabled={
            isGenerating || question.trim().length === 0 || jobDescriptions.length === 0
          }
        >
          {isGenerating ? "Generating..." : "Generate Insight"}
        </Button>
      </form>

      <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Saved Job Descriptions
              {!isLoading && jobDescriptions.length > 0
                ? ` (${jobDescriptions.length})`
                : ""}
            </h2>
            <p className="text-sm text-slate-500">
              Save job descriptions from{" "}
              <Link
                href="/application-materials"
                className="font-medium text-slate-900 underline underline-offset-2"
              >
                Application &amp; Prep
              </Link>
              .
            </p>
          </div>
        </div>

        {isLoading ? (
          <p className="text-sm text-slate-500">Loading saved job descriptions...</p>
        ) : jobDescriptions.length === 0 ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            No saved job descriptions yet. Paste a job description on{" "}
            <Link
              href="/application-materials"
              className="font-medium underline underline-offset-2"
            >
              Application &amp; Prep
            </Link>{" "}
            and click Generate Materials to add your first entry.
          </div>
        ) : (
          <ul className="space-y-3">
            {jobDescriptions.map((jobDescription) => (
              <li key={jobDescription.id}>
                <SavedJobDescriptionItem
                  jobDescription={jobDescription}
                  expanded={expandedIds.has(jobDescription.id)}
                  onToggle={() => toggleExpanded(jobDescription.id)}
                  onDelete={() => setDeletingJobDescription(jobDescription)}
                  onToggleAiRole={(isAiRole) =>
                    void handleToggleAiRole(jobDescription, isAiRole)
                  }
                  isTogglingAiRole={togglingAiRoleId === jobDescription.id}
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      {insightError ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {insightError}
        </div>
      ) : null}

      {answer ? (
        <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">Insight</h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void handleCopy()}
            >
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
            {answer}
          </p>
        </div>
      ) : null}

      <AlertDialog
        open={deletingJobDescription !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingJobDescription(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete job description?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes{" "}
              {deletingJobDescription?.companyName ?? "this job description"}{" "}
              from your library. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleDelete()}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
