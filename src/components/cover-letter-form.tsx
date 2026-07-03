"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { usePersistedState } from "@/hooks/use-persisted-state";
import {
  COVER_LETTER_DRAFT_KEY,
  emptyJobDescriptionDraft,
} from "@/lib/form-drafts";
import {
  buildCoverLetterFilename,
  downloadWordFile,
} from "@/lib/download-word-file";

export function CoverLetterForm() {
  const [draft, setDraft] = usePersistedState(
    COVER_LETTER_DRAFT_KEY,
    emptyJobDescriptionDraft,
  );
  const { companyName, jobDescription } = draft;
  const [coverLetter, setCoverLetter] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setCoverLetter(null);
    setCopied(false);
    setIsGenerating(true);

    try {
      const response = await fetch("/api/cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName, jobDescription }),
      });

      const body = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(body?.error ?? "Failed to generate cover letter");
      }

      setCoverLetter(body.coverLetter);
    } catch (generateError) {
      setError(
        generateError instanceof Error
          ? generateError.message
          : "Failed to generate cover letter",
      );
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleCopy() {
    if (!coverLetter) {
      return;
    }

    await navigator.clipboard.writeText(coverLetter);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  async function handleDownload() {
    if (!coverLetter) {
      return;
    }

    await downloadWordFile(
      coverLetter,
      buildCoverLetterFilename(companyName),
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Cover Letter
        </h1>
        <p className="mt-1 text-slate-600">
          Generate a tailored cover letter from your resume and a job
          description.
        </p>
      </div>

      <form
        className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 sm:p-6"
        onSubmit={handleSubmit}
      >
        <div className="space-y-2">
          <Label htmlFor="companyName">Company Name</Label>
          <Input
            id="companyName"
            value={companyName}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                companyName: event.target.value,
              }))
            }
            placeholder="Acme Corp (optional)"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="jobDescription">Job Description</Label>
          <Textarea
            id="jobDescription"
            value={jobDescription}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                jobDescription: event.target.value,
              }))
            }
            placeholder="Paste the full job description here..."
            className="min-h-[240px]"
          />
        </div>

        <Button type="submit" disabled={isGenerating}>
          {isGenerating ? "Generating..." : "Generate Cover Letter"}
        </Button>
      </form>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {coverLetter ? (
        <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">
              Cover Letter
              {companyName.trim() ? ` for ${companyName.trim()}` : ""}
            </h2>
            <div className="flex shrink-0 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void handleDownload()}
              >
                Download
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void handleCopy()}
              >
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>
          </div>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
            {coverLetter}
          </p>
        </div>
      ) : null}
    </div>
  );
}
