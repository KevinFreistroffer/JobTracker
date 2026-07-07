"use client";

import Link from "next/link";
import { format } from "date-fns";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { JobDescriptionRecord } from "@/components/jd-library";

export type AiRequirementRecord = {
  id: string;
  canonicalText: string;
  category: string | null;
  occurrenceCount: number;
  jobDescriptions: Array<{
    id: string;
    companyName: string;
    roleTitle: string | null;
    rawText: string;
  }>;
  createdAt: string;
  updatedAt: string;
};

export type StudySubject = {
  name: string;
  rationale: string;
  relatedRequirements: string[];
  priority: "high" | "medium" | "low";
};

type ExtractResult = {
  processedJobDescriptionCount: number;
  newRequirementCount: number;
  totalCanonicalCount: number;
};

function priorityClassName(priority: StudySubject["priority"]) {
  switch (priority) {
    case "high":
      return "bg-red-100 text-red-800";
    case "medium":
      return "bg-amber-100 text-amber-800";
    case "low":
      return "bg-slate-100 text-slate-700";
  }
}

function categoryClassName() {
  return "bg-violet-100 text-violet-800";
}

export function AiRequirements() {
  const [jobDescriptions, setJobDescriptions] = useState<JobDescriptionRecord[]>(
    [],
  );
  const [requirements, setRequirements] = useState<AiRequirementRecord[]>([]);
  const [studySubjects, setStudySubjects] = useState<StudySubject[] | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isGeneratingStudy, setIsGeneratingStudy] = useState(false);
  const [forceReextract, setForceReextract] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractResult, setExtractResult] = useState<ExtractResult | null>(
    null,
  );
  const [studyError, setStudyError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [jobDescriptionsResponse, requirementsResponse] = await Promise.all([
        fetch("/api/job-descriptions"),
        fetch("/api/ai-requirements"),
      ]);

      const jobDescriptionsBody = await jobDescriptionsResponse
        .json()
        .catch(() => null);
      const requirementsBody = await requirementsResponse
        .json()
        .catch(() => null);

      if (!jobDescriptionsResponse.ok) {
        throw new Error(
          jobDescriptionsBody?.error ?? "Failed to load job descriptions",
        );
      }

      if (!requirementsResponse.ok) {
        throw new Error(
          requirementsBody?.error ?? "Failed to load AI requirements",
        );
      }

      setJobDescriptions(jobDescriptionsBody as JobDescriptionRecord[]);
      setRequirements(requirementsBody as AiRequirementRecord[]);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load AI requirements data",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const aiJobDescriptions = jobDescriptions.filter(
    (jobDescription) => jobDescription.isAiRole,
  );

  async function handleToggleAiRole(
    jobDescription: JobDescriptionRecord,
    isAiRole: boolean,
  ) {
    setTogglingId(jobDescription.id);
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
      setTogglingId(null);
    }
  }

  async function handleExtract() {
    setIsExtracting(true);
    setError(null);
    setExtractResult(null);

    try {
      const response = await fetch("/api/ai-requirements/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force: forceReextract }),
      });

      const body = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(body?.error ?? "Failed to extract AI requirements");
      }

      setExtractResult(body as ExtractResult);
      await loadData();
    } catch (extractError) {
      setError(
        extractError instanceof Error
          ? extractError.message
          : "Failed to extract AI requirements",
      );
    } finally {
      setIsExtracting(false);
    }
  }

  async function handleGenerateStudySubjects() {
    setIsGeneratingStudy(true);
    setStudyError(null);
    setStudySubjects(null);

    try {
      const response = await fetch("/api/ai-requirements/study-subjects", {
        method: "POST",
      });

      const body = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(body?.error ?? "Failed to generate study subjects");
      }

      setStudySubjects(body.subjects as StudySubject[]);
    } catch (generateError) {
      setStudyError(
        generateError instanceof Error
          ? generateError.message
          : "Failed to generate study subjects",
      );
    } finally {
      setIsGeneratingStudy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          AI Requirements
        </h1>
        <p className="mt-1 text-slate-600">
          Extract and deduplicate AI-specific requirements from flagged job
          descriptions, then generate a study guide.
        </p>
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 sm:p-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            AI Job Descriptions
            {!isLoading ? ` (${aiJobDescriptions.length} flagged)` : ""}
          </h2>
          <p className="text-sm text-slate-500">
            Toggle which saved JDs count as AI roles. Manage all JDs in the{" "}
            <Link
              href="/jd-library"
              className="font-medium text-slate-900 underline underline-offset-2"
            >
              JD Library
            </Link>
            .
          </p>
        </div>

        {isLoading ? (
          <p className="text-sm text-slate-500">Loading job descriptions...</p>
        ) : jobDescriptions.length === 0 ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            No saved job descriptions yet. Save JDs from{" "}
            <Link
              href="/application-materials"
              className="font-medium underline underline-offset-2"
            >
              Application &amp; Prep
            </Link>{" "}
            first.
          </div>
        ) : (
          <ul className="space-y-2">
            {jobDescriptions.map((jobDescription) => (
              <li
                key={jobDescription.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-slate-200 p-3"
              >
                <div>
                  <p className="font-medium text-slate-900">
                    {jobDescription.companyName}
                    {jobDescription.roleTitle
                      ? ` — ${jobDescription.roleTitle}`
                      : ""}
                  </p>
                  <p className="text-xs text-slate-500">
                    Saved{" "}
                    {format(new Date(jobDescription.createdAt), "MMM d, yyyy")}
                  </p>
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={jobDescription.isAiRole}
                    disabled={togglingId === jobDescription.id}
                    onChange={(event) =>
                      void handleToggleAiRole(
                        jobDescription,
                        event.target.checked,
                      )
                    }
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  AI role
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 sm:p-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Extract Requirements
          </h2>
          <p className="text-sm text-slate-500">
            Extract AI-specific requirements from flagged JDs and merge similar
            ones into a unique list.
          </p>
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={forceReextract}
            onChange={(event) => setForceReextract(event.target.checked)}
            className="h-4 w-4 rounded border-slate-300"
          />
          Re-extract all flagged JDs (overwrite prior extractions)
        </label>

        <Button
          type="button"
          disabled={isExtracting || aiJobDescriptions.length === 0}
          onClick={() => void handleExtract()}
        >
          {isExtracting ? "Extracting..." : "Extract & merge requirements"}
        </Button>

        {extractResult ? (
          <p className="text-sm text-slate-600">
            Processed {extractResult.processedJobDescriptionCount} JD
            {extractResult.processedJobDescriptionCount === 1 ? "" : "s"},{" "}
            extracted {extractResult.newRequirementCount} raw requirement
            {extractResult.newRequirementCount === 1 ? "" : "s"},{" "}
            {extractResult.totalCanonicalCount} unique canonical requirement
            {extractResult.totalCanonicalCount === 1 ? "" : "s"} total.
          </p>
        ) : null}
      </div>

      <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 sm:p-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Unique Requirements
            {!isLoading && requirements.length > 0
              ? ` (${requirements.length})`
              : ""}
          </h2>
          <p className="text-sm text-slate-500">
            Deduplicated AI requirements sorted by how often they appear.
          </p>
        </div>

        {isLoading ? (
          <p className="text-sm text-slate-500">Loading requirements...</p>
        ) : requirements.length === 0 ? (
          <p className="text-sm text-slate-500">
            No requirements extracted yet. Flag AI JDs and run extraction.
          </p>
        ) : (
          <ul className="space-y-3">
            {requirements.map((requirement) => (
              <li
                key={requirement.id}
                className="rounded-md border border-slate-200 p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-slate-900 px-2 py-0.5 text-xs font-medium text-white">
                    {requirement.occurrenceCount} JD
                    {requirement.occurrenceCount === 1 ? "" : "s"}
                  </span>
                  {requirement.category ? (
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${categoryClassName()}`}
                    >
                      {requirement.category}
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 text-sm leading-relaxed text-slate-800">
                  {requirement.canonicalText}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  From:{" "}
                  {requirement.jobDescriptions
                    .map((jobDescription) =>
                      jobDescription.roleTitle
                        ? `${jobDescription.companyName} (${jobDescription.roleTitle})`
                        : jobDescription.companyName,
                    )
                    .join(", ")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 sm:p-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Study Guide
          </h2>
          <p className="text-sm text-slate-500">
            Ask the LLM to generalize the top subjects to study based on your
            unique requirements.
          </p>
        </div>

        <Button
          type="button"
          disabled={isGeneratingStudy || requirements.length === 0}
          onClick={() => void handleGenerateStudySubjects()}
        >
          {isGeneratingStudy
            ? "Generating..."
            : "Generate top subjects to study"}
        </Button>

        {studyError ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {studyError}
          </div>
        ) : null}

        {studySubjects ? (
          <ol className="space-y-4">
            {studySubjects.map((subject, index) => (
              <li
                key={`${subject.name}-${index}`}
                className="rounded-md border border-slate-200 p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-slate-900">
                    {index + 1}. {subject.name}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${priorityClassName(subject.priority)}`}
                  >
                    {subject.priority}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-slate-700">
                  {subject.rationale}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  Related: {subject.relatedRequirements.join("; ")}
                </p>
              </li>
            ))}
          </ol>
        ) : null}
      </div>
    </div>
  );
}
