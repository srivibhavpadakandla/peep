/** Raw email as it would appear in any inbox. */
export interface InboxEmail {
  id: string;
  from: string;
  subject: string;
  received_at: number; // unix ms
  body: string;
}

/** A delivery expected today, derived from an email. */
export interface ExpectedDelivery {
  /** Source email id. */
  email_id: string;
  order_id: string;
  item_description: string;
  /** Carrier-provided expected delivery date (YYYY-MM-DD in local time). */
  expected_date: string;
  /** True if the camera has observed an arrival for this order today. */
  received: boolean;
}
