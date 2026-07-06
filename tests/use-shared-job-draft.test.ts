import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { useSharedJobDraft } from "@/hooks/use-shared-job-draft";
import { APPLICATION_MATERIALS_DRAFT_KEY } from "@/lib/form-drafts";

describe("useSharedJobDraft", () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it("reads and writes the application materials draft key", async () => {
    window.localStorage.setItem(
      APPLICATION_MATERIALS_DRAFT_KEY,
      JSON.stringify({
        companyName: "Acme Corp",
        jobDescription: "React and TypeScript role.",
      }),
    );

    const { result } = renderHook(() => useSharedJobDraft());

    await waitFor(() => {
      expect(result.current[0]).toEqual({
        companyName: "Acme Corp",
        jobDescription: "React and TypeScript role.",
      });
    });

    act(() => {
      result.current[1]({
        companyName: "Northstar",
        jobDescription: "Backend services.",
      });
    });

    await waitFor(() => {
      expect(
        window.localStorage.getItem(APPLICATION_MATERIALS_DRAFT_KEY),
      ).toContain("Northstar");
    });
  });
});
