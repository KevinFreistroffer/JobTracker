"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { usePersistedState } from "@/hooks/use-persisted-state";
import {
  emptyJobDescriptionDraft,
  WHY_WORK_HERE_DRAFT_KEY,
} from "@/lib/form-drafts";

type GeneratedAnswers = {
  shortAnswer: string;
  longAnswer: string;
};

export function WhyWorkHereForm() {
  const [draft, setDraft] = usePersistedState(
    WHY_WORK_HERE_DRAFT_KEY,
    emptyJobDescriptionDraft,
  );
  const { companyName, jobDescription } = draft;
  const [answers, setAnswers] = useState<GeneratedAnswers | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedAnswer, setCopiedAnswer] = useState<keyof GeneratedAnswers | null>(
    null,
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setAnswers(null);
    setCopiedAnswer(null);
    setIsGenerating(true);

    try {
      const response = await fetch("/api/why-work-here", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName, jobDescription }),
      });

      const body = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(body?.error ?? "Failed to generate answer");
      }

      setAnswers({
        shortAnswer: body.shortAnswer,
        longAnswer: body.longAnswer ?? body.answer,
      });
    } catch (generateError) {
      setError(
        generateError instanceof Error
          ? generateError.message
          : "Failed to generate answer",
      );
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleCopy(answerType: keyof GeneratedAnswers) {
    const answer = answers?.[answerType];
    if (!answer) {
      return;
    }

    await navigator.clipboard.writeText(answer);
    setCopiedAnswer(answerType);
    window.setTimeout(() => setCopiedAnswer(null), 2000);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Why Work Here
        </h1>
        <p className="mt-1 text-slate-600">
          Generate a tailored answer to &ldquo;Why do you want to work for this
          company?&rdquo; using your resume and a job description.
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
            placeholder="Acme Corp"
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
          {isGenerating ? "Generating..." : "Generate Answer"}
        </Button>
      </form>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {answers ? (
        <div className="space-y-4">
          <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Short Version
                </h2>
                <p className="text-sm text-slate-500">
                  1-2 sentences for quick forms or recruiter messages.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void handleCopy("shortAnswer")}
              >
                {copiedAnswer === "shortAnswer" ? "Copied!" : "Copy"}
              </Button>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
              {answers.shortAnswer}
            </p>
          </div>

          <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Long Version
                </h2>
                <p className="text-sm text-slate-500">
                  Fuller response to &ldquo;Why do you want to work for{" "}
                  {companyName.trim()}?&rdquo;
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void handleCopy("longAnswer")}
              >
                {copiedAnswer === "longAnswer" ? "Copied!" : "Copy"}
              </Button>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
              {answers.longAnswer}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
