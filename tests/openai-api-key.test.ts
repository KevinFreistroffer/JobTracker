import { afterEach, describe, expect, it } from "vitest";
import { getOpenAiApiKey } from "@/lib/openai-api-key";

describe("getOpenAiApiKey", () => {
  const originalOpenAi = process.env.OPENAI_API_KEY;
  const originalOpenApi = process.env.OPEN_API_KEY;

  afterEach(() => {
    if (originalOpenAi === undefined) {
      delete process.env.OPENAI_API_KEY;
    } else {
      process.env.OPENAI_API_KEY = originalOpenAi;
    }
    if (originalOpenApi === undefined) {
      delete process.env.OPEN_API_KEY;
    } else {
      process.env.OPEN_API_KEY = originalOpenApi;
    }
  });

  it("returns OPENAI_API_KEY when set", () => {
    process.env.OPENAI_API_KEY = "sk-openai";
    delete process.env.OPEN_API_KEY;
    expect(getOpenAiApiKey()).toBe("sk-openai");
  });

  it("returns OPEN_API_KEY when OPENAI_API_KEY is unset", () => {
    delete process.env.OPENAI_API_KEY;
    process.env.OPEN_API_KEY = "sk-open-api";
    expect(getOpenAiApiKey()).toBe("sk-open-api");
  });

  it("prefers OPENAI_API_KEY over OPEN_API_KEY", () => {
    process.env.OPENAI_API_KEY = "sk-openai";
    process.env.OPEN_API_KEY = "sk-open-api";
    expect(getOpenAiApiKey()).toBe("sk-openai");
  });

  it("returns undefined when neither is set", () => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.OPEN_API_KEY;
    expect(getOpenAiApiKey()).toBeUndefined();
  });
});
