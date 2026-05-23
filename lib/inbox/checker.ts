import type { ExpectedDelivery } from "./types";

/**
 * Given today's expected deliveries and the number of arrivals the camera has
 * observed today, return the set of orders that are still missing.
 *
 * We don't try to match an arrival to a specific order ID (the camera can't
 * read barcodes). The convention: each `package_arrived` event consumes one
 * pending delivery in the order the inbox returned them. Whatever's left over
 * after `observedArrivals` consumptions is reported as missing.
 */
export function findMissingDeliveries(
  expected: ExpectedDelivery[],
  observedArrivals: number,
): ExpectedDelivery[] {
  const pending = expected.filter((d) => !d.received);
  const stillMissing = Math.max(0, pending.length - Math.max(0, observedArrivals));
  if (stillMissing === 0) return [];
  // Return the *first* `stillMissing` pending entries — earlier-arriving orders
  // are more suspicious if no arrival was observed.
  return pending.slice(0, stillMissing);
}
