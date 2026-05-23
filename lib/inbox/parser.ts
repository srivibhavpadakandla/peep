import type { ExpectedDelivery, InboxEmail } from "./types";

/**
 * Parse an inbox into the set of deliveries expected on `today`.
 *
 * Default implementation is a pure regex extractor — fast, deterministic,
 * and tunable without an API key. A swap-in Claude-based parser can replace
 * this when the inbox shape is less predictable.
 */
export function parseExpectedDeliveries(emails: InboxEmail[], today: string): ExpectedDelivery[] {
  const out: ExpectedDelivery[] = [];
  for (const email of emails) {
    const ed = extract(email);
    if (!ed) continue;
    if (ed.expected_date !== today) continue;
    out.push({ ...ed, email_id: email.id, received: false });
  }
  return out;
}

function extract(email: InboxEmail): Omit<ExpectedDelivery, "email_id" | "received"> | null {
  const body = email.body;
  const orderMatch = body.match(/Order\s*#?\s*([0-9-]{10,})/i);
  const itemMatch = body.match(/Item:\s*(.+)/i);
  const dateMatch = body.match(/Expected\s+delivery:\s*([0-9]{4}-[0-9]{2}-[0-9]{2})/i);
  if (!orderMatch || !itemMatch || !dateMatch) return null;
  return {
    order_id: orderMatch[1].trim(),
    item_description: itemMatch[1].trim(),
    expected_date: dateMatch[1].trim(),
  };
}
