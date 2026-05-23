import { ClaudeRouter } from "./claude-router";
import { MockRouter } from "./router";
import type { OrchestrationRouter } from "./router";

export function getOrchestrationRouter(): { router: OrchestrationRouter; mode: "claude" | "mock" } {
  const key = process.env.ANTHROPIC_API_KEY;
  if (key && key.trim().length > 0) {
    return { router: new ClaudeRouter(key), mode: "claude" };
  }
  return { router: new MockRouter(), mode: "mock" };
}
