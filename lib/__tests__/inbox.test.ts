import { describe, it, expect } from "vitest";
import { seedInbox } from "../inbox/seed";
import { parseExpectedDeliveries } from "../inbox/parser";
import { findMissingDeliveries } from "../inbox/checker";

const today = "2026-05-23";
const fixedDate = new Date(`${today}T12:00:00`);

describe("parseExpectedDeliveries", () => {
  it("extracts deliveries from Amazon-shaped emails and ignores noise", () => {
    const emails = seedInbox(fixedDate);
    const out = parseExpectedDeliveries(emails, today);
    expect(out).toHaveLength(2);
    expect(out[0].order_id).toBe("112-7350199-0123456");
    expect(out[0].item_description).toContain("Anker");
    expect(out[0].received).toBe(false);
    expect(out[1].order_id).toBe("112-7350199-7891011");
  });

  it("filters out emails not expected today", () => {
    const emails = seedInbox(fixedDate);
    const out = parseExpectedDeliveries(emails, "2099-01-01");
    expect(out).toHaveLength(0);
  });

  it("returns nothing when emails lack delivery fields", () => {
    const out = parseExpectedDeliveries(
      [
        {
          id: "x",
          from: "spam@example.com",
          subject: "buy more stuff",
          received_at: 0,
          body: "no order id here, no expected delivery either",
        },
      ],
      today,
    );
    expect(out).toEqual([]);
  });
});

describe("findMissingDeliveries", () => {
  const expected = [
    { email_id: "a", order_id: "1", item_description: "x", expected_date: today, received: false },
    { email_id: "b", order_id: "2", item_description: "y", expected_date: today, received: false },
    { email_id: "c", order_id: "3", item_description: "z", expected_date: today, received: true },
  ];

  it("returns nothing when all pending have a matching arrival", () => {
    expect(findMissingDeliveries(expected, 2)).toEqual([]);
  });
  it("returns the first N missing when arrivals < pending", () => {
    const out = findMissingDeliveries(expected, 1);
    expect(out).toHaveLength(1);
    expect(out[0].order_id).toBe("1");
  });
  it("returns all pending when no arrivals seen", () => {
    const out = findMissingDeliveries(expected, 0);
    expect(out.map((d) => d.order_id)).toEqual(["1", "2"]);
  });
  it("ignores entries already received", () => {
    const out = findMissingDeliveries(expected, 0);
    expect(out.find((d) => d.order_id === "3")).toBeUndefined();
  });
});
