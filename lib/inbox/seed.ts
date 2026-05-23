import type { InboxEmail } from "./types";

/** Returns an inbox seeded with 3 emails about packages expected today. */
export function seedInbox(now: Date = new Date()): InboxEmail[] {
  const today = isoDate(now);
  return [
    {
      id: "em_001",
      from: "shipment-tracking@amazon.com",
      subject: "Your order will arrive today",
      received_at: now.getTime() - 1000 * 60 * 60 * 6,
      body: [
        "Hi,",
        "",
        "Your package is out for delivery and is expected to arrive today.",
        "",
        `Order #112-7350199-0123456`,
        `Item: Anker PowerCore 20K Portable Charger`,
        `Expected delivery: ${today}`,
        "",
        "Track at https://amazon.com/orders",
        "— Amazon",
      ].join("\n"),
    },
    {
      id: "em_002",
      from: "shipment-tracking@amazon.com",
      subject: "Arriving today: Logitech MX Master 3S",
      received_at: now.getTime() - 1000 * 60 * 60 * 3,
      body: [
        "Your package is on the way.",
        "",
        `Order #112-7350199-7891011`,
        `Item: Logitech MX Master 3S`,
        `Expected delivery: ${today}`,
      ].join("\n"),
    },
    {
      id: "em_003",
      from: "newsletter@mediumweekly.com",
      subject: "5 stories you should read this week",
      received_at: now.getTime() - 1000 * 60 * 60 * 2,
      body: "This is a newsletter, not a delivery email. Ignore me.",
    },
  ];
}

function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
