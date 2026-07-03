import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { usePersistedState } from "@/hooks/use-persisted-state";

describe("usePersistedState", () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it("restores a saved value after remount", async () => {
    window.localStorage.setItem(
      "job-tracking:test-draft",
      JSON.stringify({ companyName: "Acme Corp", jobDescription: "Role" }),
    );

    const { result, unmount } = renderHook(() =>
      usePersistedState("job-tracking:test-draft", {
        companyName: "",
        jobDescription: "",
      }),
    );

    await waitFor(() => {
      expect(result.current[0]).toEqual({
        companyName: "Acme Corp",
        jobDescription: "Role",
      });
    });

    unmount();

    const { result: remounted } = renderHook(() =>
      usePersistedState("job-tracking:test-draft", {
        companyName: "",
        jobDescription: "",
      }),
    );

    await waitFor(() => {
      expect(remounted.current[0]).toEqual({
        companyName: "Acme Corp",
        jobDescription: "Role",
      });
    });
  });

  it("persists updates and clears stored values", async () => {
    const { result } = renderHook(() =>
      usePersistedState("job-tracking:test-draft", {
        companyName: "",
        jobDescription: "",
      }),
    );

    await waitFor(() => {
      expect(result.current[3]).toBe(true);
    });

    act(() => {
      result.current[1]({
        companyName: "Northstar",
        jobDescription: "Backend role",
      });
    });

    await waitFor(() => {
      expect(window.localStorage.getItem("job-tracking:test-draft")).toContain(
        "Northstar",
      );
    });

    act(() => {
      result.current[2]();
    });

    expect(window.localStorage.getItem("job-tracking:test-draft")).toBeNull();
  });
});
