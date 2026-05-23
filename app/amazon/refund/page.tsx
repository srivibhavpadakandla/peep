"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function RefundForm() {
  const router = useRouter();
  const params = useSearchParams();
  const orderId = params.get("order_id") ?? "";
  const [reason, setReason] = useState("package_stolen");
  const [description, setDescription] = useState("");
  const [evidenceConfirmed, setEvidenceConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const res = await fetch("/api/amazon/refund", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ order_id: orderId, reason, description, evidence_confirmed: evidenceConfirmed }),
    });
    const data = await res.json();
    setSubmitting(false);
    router.push(`/amazon/receipt?id=${encodeURIComponent(data.receipt_id)}&order_id=${encodeURIComponent(orderId)}`);
  };

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold mb-2">File a refund claim</h1>
      <p className="text-sm text-neutral-500 mb-4">Order #{orderId || "(none selected)"}</p>
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block">
          <span className="text-sm">Reason</span>
          <select
            name="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full border border-neutral-300 rounded px-2 py-1 text-sm"
          >
            <option value="package_stolen">Package was stolen</option>
            <option value="never_arrived">Package never arrived</option>
            <option value="damaged">Item arrived damaged</option>
            <option value="wrong_item">Wrong item received</option>
          </select>
        </label>
        <label className="block">
          <span className="text-sm">Description</span>
          <textarea
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full border border-neutral-300 rounded px-2 py-1 text-sm"
            placeholder="Describe what happened…"
          />
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="evidence_confirmed"
            checked={evidenceConfirmed}
            onChange={(e) => setEvidenceConfirmed(e.target.checked)}
          />
          <span className="text-sm">I confirm I have video evidence of the incident.</span>
        </label>
        <button
          type="submit"
          disabled={submitting}
          className="bg-yellow-400 hover:bg-yellow-500 text-black font-medium rounded py-2 px-4 text-sm disabled:opacity-50"
        >
          {submitting ? "Submitting…" : "Submit claim"}
        </button>
      </form>
    </div>
  );
}

export default function RefundPage() {
  return (
    <Suspense fallback={<div>Loading…</div>}>
      <RefundForm />
    </Suspense>
  );
}
