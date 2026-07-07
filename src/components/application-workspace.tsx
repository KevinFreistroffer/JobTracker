"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSharedJobDraft } from "@/hooks/use-shared-job-draft";
import {
  APPLICATION_WORKSPACE_SECTIONS,
  scrollToWorkspaceSection,
  type ApplicationWorkspaceSectionId,
} from "@/lib/application-workspace-sections";
import {
  buildCoverLetterFilename,
  downloadWordFile,
} from "@/lib/download-word-file";
import type { InterviewPrep } from "@/lib/interview-prep";
import { cn } from "@/lib/utils";

type GeneratedMaterials = {
  coverLetter: string;
  shortAnswer: string;
  longAnswer: string;
};

type MaterialsCopyTarget = "coverLetter" | "shortAnswer" | "longAnswer";

type PrepCopyTarget =
  | "techStackSummary"
  | "roleFocusSummary"
  | "technicalQuestionsToAsk"
  | "culturalQuestionsToAsk";

function formatQuestionList(questions: string[]) {
  return questions.map((question, index) => `${index + 1}. ${question}`).join("\n");
}

function WorkspaceSectionNav({
  activeSection,
  onNavigate,
  className,
}: {
  activeSection: ApplicationWorkspaceSectionId | null;
  onNavigate: (id: ApplicationWorkspaceSectionId) => void;
  className?: string;
}) {
  return (
    <nav className={cn("space-y-1", className)} aria-label="Workspace sections">
      {APPLICATION_WORKSPACE_SECTIONS.map((section) => (
        <button
          key={section.id}
          type="button"
          onClick={() => onNavigate(section.id)}
          className={cn(
            "block w-full rounded-md px-3 py-2 text-left text-sm transition-colors",
            activeSection === section.id
              ? "bg-slate-900 text-white"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
          )}
        >
          {section.label}
        </button>
      ))}
    </nav>
  );
}

function SectionPlaceholder({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm text-slate-500">{children}</p>
  );
}

export function ApplicationWorkspace() {
  const [draft, setDraft] = useSharedJobDraft();
  const { companyName, roleTitle = "", jobDescription } = draft;
  const [materials, setMaterials] = useState<GeneratedMaterials | null>(null);
  const [prep, setPrep] = useState<InterviewPrep | null>(null);
  const [materialsError, setMaterialsError] = useState<string | null>(null);
  const [prepError, setPrepError] = useState<string | null>(null);
  const [isGeneratingMaterials, setIsGeneratingMaterials] = useState(false);
  const [isGeneratingPrep, setIsGeneratingPrep] = useState(false);
  const [copiedMaterialsTarget, setCopiedMaterialsTarget] =
    useState<MaterialsCopyTarget | null>(null);
  const [copiedPrepTarget, setCopiedPrepTarget] =
    useState<PrepCopyTarget | null>(null);
  const [activeSection, setActiveSection] =
    useState<ApplicationWorkspaceSectionId | null>("job-input");

  const hasJobDescription = jobDescription.trim().length > 0;
  const hasCompanyName = companyName.trim().length > 0;

  function navigateToSection(id: ApplicationWorkspaceSectionId) {
    setActiveSection(id);
    scrollToWorkspaceSection(id);
  }

  async function handleGenerateMaterials(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setMaterialsError(null);
    setMaterials(null);
    setCopiedMaterialsTarget(null);
    setIsGeneratingMaterials(true);

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
      navigateToSection("cover-letter");
    } catch (generateError) {
      setMaterialsError(
        generateError instanceof Error
          ? generateError.message
          : "Failed to generate application materials",
      );
    } finally {
      setIsGeneratingMaterials(false);
    }
  }

  async function handleGeneratePrep() {
    setPrepError(null);
    setPrep(null);
    setCopiedPrepTarget(null);
    setIsGeneratingPrep(true);

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
      navigateToSection("tech-stack-summary");
    } catch (generateError) {
      setPrepError(
        generateError instanceof Error
          ? generateError.message
          : "Failed to generate interview prep",
      );
    } finally {
      setIsGeneratingPrep(false);
    }
  }

  async function handleCopyMaterials(target: MaterialsCopyTarget) {
    const text = materials?.[target];
    if (!text) {
      return;
    }

    await navigator.clipboard.writeText(text);
    setCopiedMaterialsTarget(target);
    window.setTimeout(() => setCopiedMaterialsTarget(null), 2000);
  }

  async function handleCopyPrep(target: PrepCopyTarget) {
    if (!prep) {
      return;
    }

    const text =
      target === "technicalQuestionsToAsk" || target === "culturalQuestionsToAsk"
        ? formatQuestionList(prep[target])
        : prep[target];

    await navigator.clipboard.writeText(text);
    setCopiedPrepTarget(target);
    window.setTimeout(() => setCopiedPrepTarget(null), 2000);
  }

  async function handleDownloadCoverLetter() {
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
          Application &amp; Interview Prep
        </h1>
        <p className="mt-1 text-slate-600">
          Generate application materials and interview prep from one shared job
          description.
        </p>
      </div>

      <div className="lg:flex lg:items-start lg:gap-8">
        <aside className="hidden shrink-0 lg:block lg:w-56">
          <div className="sticky top-4 space-y-2">
            <p className="px-3 text-xs font-semibold tracking-wide text-slate-500 uppercase">
              Sections
            </p>
            <WorkspaceSectionNav
              activeSection={activeSection}
              onNavigate={navigateToSection}
            />
          </div>
        </aside>

        <div className="min-w-0 flex-1 space-y-6">
          <div className="sticky top-0 z-10 -mx-4 border-b border-slate-200 bg-slate-50/95 px-4 py-3 backdrop-blur lg:hidden">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {APPLICATION_WORKSPACE_SECTIONS.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => navigateToSection(section.id)}
                  className={cn(
                    "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors",
                    activeSection === section.id
                      ? "bg-slate-900 text-white"
                      : "bg-white text-slate-600 ring-1 ring-slate-200",
                  )}
                >
                  {section.label}
                </button>
              ))}
            </div>
          </div>

          <section
            id="job-input"
            className="scroll-mt-24 space-y-4 rounded-lg border border-slate-200 bg-white p-4 sm:p-6 lg:scroll-mt-8"
          >
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Job Description
              </h2>
              <p className="text-sm text-slate-500">
                Paste the job description once. Generating materials also saves
                it to your JD library.
              </p>
            </div>

            <form className="space-y-4" onSubmit={handleGenerateMaterials}>
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
              </div>

              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={isGeneratingMaterials}>
                  {isGeneratingMaterials
                    ? "Generating..."
                    : "Generate Materials"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={
                    isGeneratingPrep || !hasJobDescription || !hasCompanyName
                  }
                  onClick={() => void handleGeneratePrep()}
                >
                  {isGeneratingPrep
                    ? "Generating..."
                    : "Generate Interview Prep"}
                </Button>
              </div>
            </form>

            {materialsError ? (
              <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {materialsError}
              </div>
            ) : null}

            {prepError ? (
              <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {prepError}
              </div>
            ) : null}
          </section>

          <section
            id="cover-letter"
            className="scroll-mt-24 space-y-3 rounded-lg border border-slate-200 bg-white p-4 sm:p-6 lg:scroll-mt-8"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-900">
                Cover Letter
                {companyName.trim() ? ` for ${companyName.trim()}` : ""}
              </h2>
              {materials ? (
                <div className="flex shrink-0 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void handleDownloadCoverLetter()}
                  >
                    Download
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void handleCopyMaterials("coverLetter")}
                  >
                    {copiedMaterialsTarget === "coverLetter"
                      ? "Copied!"
                      : "Copy"}
                  </Button>
                </div>
              ) : null}
            </div>
            {materials ? (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                {materials.coverLetter}
              </p>
            ) : (
              <SectionPlaceholder>
                Generate application materials to create a cover letter.
              </SectionPlaceholder>
            )}
          </section>

          <section
            id="why-work-here-short"
            className="scroll-mt-24 space-y-3 rounded-lg border border-slate-200 bg-white p-4 sm:p-6 lg:scroll-mt-8"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Why Work Here — Short Version
                </h2>
                <p className="text-sm text-slate-500">
                  1-2 sentences for quick forms or recruiter messages.
                </p>
              </div>
              {materials ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void handleCopyMaterials("shortAnswer")}
                >
                  {copiedMaterialsTarget === "shortAnswer" ? "Copied!" : "Copy"}
                </Button>
              ) : null}
            </div>
            {materials ? (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                {materials.shortAnswer}
              </p>
            ) : (
              <SectionPlaceholder>
                Generate application materials to create this answer.
              </SectionPlaceholder>
            )}
          </section>

          <section
            id="why-work-here-long"
            className="scroll-mt-24 space-y-3 rounded-lg border border-slate-200 bg-white p-4 sm:p-6 lg:scroll-mt-8"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Why Work Here — Long Version
                </h2>
                <p className="text-sm text-slate-500">
                  Fuller response to &ldquo;Why do you want to work for{" "}
                  {companyName.trim() || "this company"}?&rdquo;
                </p>
              </div>
              {materials ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void handleCopyMaterials("longAnswer")}
                >
                  {copiedMaterialsTarget === "longAnswer" ? "Copied!" : "Copy"}
                </Button>
              ) : null}
            </div>
            {materials ? (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                {materials.longAnswer}
              </p>
            ) : (
              <SectionPlaceholder>
                Generate application materials to create this answer.
              </SectionPlaceholder>
            )}
          </section>

          <section
            id="tech-stack-summary"
            className="scroll-mt-24 space-y-3 rounded-lg border border-slate-200 bg-white p-4 sm:p-6 lg:scroll-mt-8"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-900">
                Tech Stack Summary
              </h2>
              {prep ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void handleCopyPrep("techStackSummary")}
                >
                  {copiedPrepTarget === "techStackSummary" ? "Copied!" : "Copy"}
                </Button>
              ) : null}
            </div>
            {prep ? (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                {prep.techStackSummary}
              </p>
            ) : (
              <SectionPlaceholder>
                Generate interview prep to summarize the tech stack.
              </SectionPlaceholder>
            )}
          </section>

          <section
            id="role-focus-summary"
            className="scroll-mt-24 space-y-3 rounded-lg border border-slate-200 bg-white p-4 sm:p-6 lg:scroll-mt-8"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-900">
                What They&apos;re Looking For
              </h2>
              {prep ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void handleCopyPrep("roleFocusSummary")}
                >
                  {copiedPrepTarget === "roleFocusSummary" ? "Copied!" : "Copy"}
                </Button>
              ) : null}
            </div>
            {prep ? (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                {prep.roleFocusSummary}
              </p>
            ) : (
              <SectionPlaceholder>
                Generate interview prep to summarize role focus.
              </SectionPlaceholder>
            )}
          </section>

          <section
            id="technical-questions"
            className="scroll-mt-24 space-y-3 rounded-lg border border-slate-200 bg-white p-4 sm:p-6 lg:scroll-mt-8"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Technical Questions to Ask
                </h2>
                <p className="text-sm text-slate-500">
                  Five questions you can ask interviewers about the technical
                  environment.
                </p>
              </div>
              {prep ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    void handleCopyPrep("technicalQuestionsToAsk")
                  }
                >
                  {copiedPrepTarget === "technicalQuestionsToAsk"
                    ? "Copied!"
                    : "Copy"}
                </Button>
              ) : null}
            </div>
            {prep ? (
              <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-slate-700">
                {prep.technicalQuestionsToAsk.map((question) => (
                  <li key={question}>{question}</li>
                ))}
              </ol>
            ) : (
              <SectionPlaceholder>
                Generate interview prep to get technical questions.
              </SectionPlaceholder>
            )}
          </section>

          <section
            id="cultural-questions"
            className="scroll-mt-24 space-y-3 rounded-lg border border-slate-200 bg-white p-4 sm:p-6 lg:scroll-mt-8"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Culture and Team Questions to Ask
                </h2>
                <p className="text-sm text-slate-500">
                  Five non-managerial questions you can ask about teamwork and
                  values.
                </p>
              </div>
              {prep ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void handleCopyPrep("culturalQuestionsToAsk")}
                >
                  {copiedPrepTarget === "culturalQuestionsToAsk"
                    ? "Copied!"
                    : "Copy"}
                </Button>
              ) : null}
            </div>
            {prep ? (
              <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-slate-700">
                {prep.culturalQuestionsToAsk.map((question) => (
                  <li key={question}>{question}</li>
                ))}
              </ol>
            ) : (
              <SectionPlaceholder>
                Generate interview prep to get culture questions.
              </SectionPlaceholder>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
