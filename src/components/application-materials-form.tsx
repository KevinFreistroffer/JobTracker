"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSharedJobDraft } from "@/hooks/use-shared-job-draft";
import {
  buildCoverLetterFilename,
  downloadWordFile,
} from "@/lib/download-word-file";

type GeneratedMaterials = {
  coverLetter: string;
  shortAnswer: string;
  longAnswer: string;
};

type CopyTarget = "coverLetter" | "shortAnswer" | "longAnswer";

export function ApplicationMaterialsForm() {
  const [draft, setDraft] = useSharedJobDraft();
  const { companyName, roleTitle = "", jobDescription } = draft;
  const [materials, setMaterials] = useState<GeneratedMaterials | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedTarget, setCopiedTarget] = useState<CopyTarget | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMaterials(null);
    setCopiedTarget(null);
    setIsGenerating(true);

    try {
      const [materialsResponse, saveResponse] = await Promise.all([
        fetch("/api/application-materials", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ companyName, jobDescription }),
        }),
        fetch("/api/job-descriptions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            companyName,
            roleTitle: roleTitle.trim() || undefined,
            body: jobDescription,
          }),
        }),
      ]);

      const materialsBody = await materialsResponse.json().catch(() => null);
      const saveBody = await saveResponse.json().catch(() => null);

      if (!materialsResponse.ok) {
        throw new Error(
          materialsBody?.error ?? "Failed to generate application materials",
        );
      }

      if (!saveResponse.ok) {
        throw new Error(saveBody?.error ?? "Failed to save job description");
      }

      setMaterials({
        coverLetter: materialsBody.coverLetter,
        shortAnswer: materialsBody.shortAnswer,
        longAnswer: materialsBody.longAnswer ?? materialsBody.answer,
      });
    } catch (generateError) {
      setError(
        generateError instanceof Error
          ? generateError.message
          : "Failed to generate application materials",
      );
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleCopy(target: CopyTarget) {
    const text = materials?.[target];
    if (!text) {
      return;
    }

    await navigator.clipboard.writeText(text);
    setCopiedTarget(target);
    window.setTimeout(() => setCopiedTarget(null), 2000);
  }

  async function handleDownload() {
    if (!materials?.coverLetter) {
      return;
    }

    await downloadWordFile(
      materials.coverLetter,
      buildCoverLetterFilename(companyName),
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Application Materials
        </h1>
        <p className="mt-1 text-slate-600">
          Generate a cover letter and &ldquo;Why work here?&rdquo; answers from
          your resume and a job description in one step.
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
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="roleTitle">Role Title</Label>
          <Input
            id="roleTitle"
            value={roleTitle}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                roleTitle: event.target.value,
              }))
            }
            placeholder="Senior Software Engineer"
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
            required
          />
          <p className="text-sm text-slate-500">
            Shared with Interview Prep. Generating materials also saves to your
            JD library.
          </p>
        </div>

        <Button type="submit" disabled={isGenerating}>
          {isGenerating ? "Generating..." : "Generate Materials"}
        </Button>
      </form>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {materials ? (
        <div className="space-y-4">
          <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Cover Letter
                  {companyName.trim() ? ` for ${companyName.trim()}` : ""}
                </h2>
              </div>
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
                  onClick={() => void handleCopy("coverLetter")}
                >
                  {copiedTarget === "coverLetter" ? "Copied!" : "Copy"}
                </Button>
              </div>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
              {materials.coverLetter}
            </p>
          </div>

          <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Why Work Here — Short Version
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
                {copiedTarget === "shortAnswer" ? "Copied!" : "Copy"}
              </Button>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
              {materials.shortAnswer}
            </p>
          </div>

          <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Why Work Here — Long Version
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
                {copiedTarget === "longAnswer" ? "Copied!" : "Copy"}
              </Button>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
              {materials.longAnswer}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
