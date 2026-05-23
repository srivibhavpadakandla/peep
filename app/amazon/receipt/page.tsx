"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function Receipt() {
  const params = useSearchParams();
  const id = params.get("id") ?? "";
  const orderId = params.get("order_id") ?? "";
  return (
    <div className="max-w-xl border border-green-300 bg-green-50 rounded p-6">
      <h1 className="text-2xl font-semibold mb-2 text-green-800">Claim received</h1>
      <p className="text-sm text-neutral-700 mb-4">
        Your refund claim has been submitted. You will receive an email once it is reviewed.
      </p>
      <div className="text-sm" data-receipt-id={id}>
        <div><span className="font-medium">Receipt ID:</span> <code>{id}</code></div>
        <div><span className="font-medium">Order:</span> <code>{orderId}</code></div>
      </div>
    </div>
  );
}

export default function ReceiptPage() {
  return (
    <Suspense fallback={<div>Loading…</div>}>
      <Receipt />
    </Suspense>
  );
}
