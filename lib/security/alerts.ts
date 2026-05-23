import type { EventType } from "../contract";

export interface SecurityAlert {
  id: string;
  event_type: EventType;
  confidence: number;
  ts: number;
  meta?: Record<string, unknown>;
}

const MAX = 64;

/**
 * In-memory ring buffer of recent alerts. Survives across requests in the same
 * Node process; lost on server restart. Swap for a real sink (DB, push channel)
 * by replacing append() and list().
 */
class AlertStore {
  private alerts: SecurityAlert[] = [];

  append(alert: Omit<SecurityAlert, "id" | "ts"> & Partial<Pick<SecurityAlert, "ts">>): SecurityAlert {
    const full: SecurityAlert = {
      id: `alt_${Math.random().toString(36).slice(2, 10)}`,
      ts: alert.ts ?? Date.now(),
      event_type: alert.event_type,
      confidence: alert.confidence,
      meta: alert.meta,
    };
    this.alerts.unshift(full);
    if (this.alerts.length > MAX) this.alerts.length = MAX;
    return full;
  }

  list(): SecurityAlert[] {
    return this.alerts.slice();
  }

  clear(): void {
    this.alerts.length = 0;
  }
}

// Module-level singleton — stable across HMR in dev.
const g = globalThis as unknown as { __cipher_alerts?: AlertStore };
export const alertStore: AlertStore = (g.__cipher_alerts ??= new AlertStore());
