import { GeminiRouter } from "./gemini-router";
import { MockRouter } from "./router";
import type { OrchestrationRouter } from "./router";

export function getOrchestrationRouter(): { router: OrchestrationRouter; mode: "gemini" | "mock" } {
  const key = process.env.GEMINI_API_KEY;
  if (key && key.trim().length > 0) {
    return { router: new GeminiRouter(key), mode: "gemini" };
  }
  return { router: new MockRouter(), mode: "mock" };
}
