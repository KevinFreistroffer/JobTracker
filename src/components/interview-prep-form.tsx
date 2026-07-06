"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useSharedJobDraft } from "@/hooks/use-shared-job-draft";
import type { InterviewPrep } from "@/lib/interview-prep";

const JD_PREVIEW_LENGTH = 400;

type CopyTarget =
  | "techStackSummary"
  | "roleFocusSummary"
  | "technicalQuestions"
  | "culturalQuestions";

function formatQuestionList(questions: string[]) {
  return questions.map((question, index) => `${index + 1}. ${question}`).join("\n");
}

export function InterviewPrepForm() {
  const [draft] = useSharedJobDraft();
  const { companyName, jobDescription } = draft;
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [prep, setPrep] = useState<InterviewPrep | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedTarget, setCopiedTarget] = useState<CopyTarget | null>(null);

  const trimmedDescription = jobDescription.trim();
  const hasJobDescription = trimmedDescription.length > 0;
  const shouldTruncate = trimmedDescription.length > JD_PREVIEW_LENGTH;
  const descriptionPreview =
    shouldTruncate && !showFullDescription
      ? `${trimmedDescription.slice(0, JD_PREVIEW_LENGTH)}...`
      : trimmedDescription;

  async function handleGenerate() {
    setError(null);
    setPrep(null);
    setCopiedTarget(null);
    setIsGenerating(true);

    try {
      const response = await fetch("/api/interview-prep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName, jobDescription }),
      });

      const body = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(body?.error ?? "Failed to generate interview prep");
      }

      setPrep(body as InterviewPrep);
    } catch (generateError) {
      setError(
        generateError instanceof Error
          ? generateError.message
          : "Failed to generate interview prep",
      );
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleCopy(target: CopyTarget) {
    if (!prep) {
      return;
    }

    const text =
      target === "technicalQuestions" || target === "culturalQuestions"
        ? formatQuestionList(prep[target])
        : prep[target];

    await navigator.clipboard.writeText(text);
    setCopiedTarget(target);
    window.setTimeout(() => setCopiedTarget(null), 2000);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Interview Prep
        </h1>
        <p className="mt-1 text-slate-600">
          Generate a tech stack summary, role focus overview, and tailored
          interview questions from your shared job description.
        </p>
      </div>

      <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 sm:p-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Shared Job Description
          </h2>
          <p className="text-sm text-slate-500">
            Edit the job description on{" "}
            <Link
              href="/application-materials"
              className="font-medium text-slate-900 underline underline-offset-2"
            >
              Application Materials
            </Link>
            .
          </p>
        </div>

        {!hasJobDescription ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            No job description yet. Paste it on{" "}
            <Link
              href="/application-materials"
              className="font-medium underline underline-offset-2"
            >
              Application Materials
            </Link>{" "}
            first.
          </div>
        ) : (
          <div className="space-y-3">
            {companyName.trim() ? (
              <p className="text-sm text-slate-700">
                <span className="font-medium text-slate-900">Company:</span>{" "}
                {companyName.trim()}
              </p>
            ) : null}
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
              {descriptionPreview}
            </p>
            {shouldTruncate ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowFullDescription((current) => !current)}
              >
                {showFullDescription ? "Show less" : "Show full"}
              </Button>
            ) : null}
          </div>
        )}

        <Button
          type="button"
          disabled={isGenerating || !hasJobDescription || !companyName.trim()}
          onClick={() => void handleGenerate()}
        >
          {isGenerating ? "Generating..." : "Generate Interview Prep"}
        </Button>
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {prep ? (
        <div className="space-y-4">
          <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-900">
                Tech Stack Summary
              </h2>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void handleCopy("techStackSummary")}
              >
                {copiedTarget === "techStackSummary" ? "Copied!" : "Copy"}
              </Button>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
              {prep.techStackSummary}
            </p>
          </div>

          <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-900">
                What They&apos;re Looking For
              </h2>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void handleCopy("roleFocusSummary")}
              >
                {copiedTarget === "roleFocusSummary" ? "Copied!" : "Copy"}
              </Button>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
              {prep.roleFocusSummary}
            </p>
          </div>

          <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Technical Interview Questions
                </h2>
                <p className="text-sm text-slate-500">
                  Five questions tailored to the role and your resume.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void handleCopy("technicalQuestions")}
              >
                {copiedTarget === "technicalQuestions" ? "Copied!" : "Copy"}
              </Button>
            </div>
            <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-slate-700">
              {prep.technicalQuestions.map((question) => (
                <li key={question}>{question}</li>
              ))}
            </ol>
          </div>

          <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Cultural Fit Questions
                </h2>
                <p className="text-sm text-slate-500">
                  Five non-managerial questions about teamwork and values.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void handleCopy("culturalQuestions")}
              >
                {copiedTarget === "culturalQuestions" ? "Copied!" : "Copy"}
              </Button>
            </div>
            <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-slate-700">
              {prep.culturalQuestions.map((question) => (
                <li key={question}>{question}</li>
              ))}
            </ol>
          </div>
        </div>
      ) : null}
    </div>
  );
}
