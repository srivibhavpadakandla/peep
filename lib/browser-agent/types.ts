export interface BrowserAgentRequest {
  workflow: string;
  params: Record<string, string | number | boolean>;
  /** Base URL of the simulated target. Defaults from env. */
  baseUrl?: string;
}

export interface BrowserAgentResult {
  success: boolean;
  workflow: string;
  /** Receipt / confirmation id returned by the target site, when applicable. */
  receipt_id?: string;
  /** Final URL the agent landed on. */
  landed_url?: string;
  /** Optional screenshot, as a data URL. */
  screenshot_data_url?: string;
  error?: string;
  /** Step-by-step trace for observability. */
  trace: BrowserAgentTraceEntry[];
}

export interface BrowserAgentTraceEntry {
  step: string;
  ok: boolean;
  detail?: string;
  ts: number;
}
