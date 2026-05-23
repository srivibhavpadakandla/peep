"use client";

import { useRouter } from "next/navigation";

interface Order {
  id: string;
  title: string;
  delivered: string;
  price: string;
}

const ORDERS: Order[] = [
  {
    id: "112-7350199-0123456",
    title: "Anker PowerCore 20K Portable Charger",
    delivered: "Delivered May 22",
    price: "$49.99",
  },
  {
    id: "112-7350199-7891011",
    title: "Logitech MX Master 3S",
    delivered: "Delivered May 19",
    price: "$99.00",
  },
];

export default function OrdersPage() {
  const router = useRouter();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Your Orders</h1>
      <ul className="space-y-3">
        {ORDERS.map((o) => (
          <li
            key={o.id}
            data-order-id={o.id}
            className="border border-neutral-300 rounded p-4 flex items-center justify-between"
          >
            <div>
              <div className="font-medium">{o.title}</div>
              <div className="text-xs text-neutral-500">
                {o.delivered} · {o.price} · Order #{o.id}
              </div>
            </div>
            <button
              type="button"
              className="refund-cta bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 rounded px-3 py-1 text-sm"
              onClick={() => router.push(`/amazon/refund?order_id=${o.id}`)}
            >
              File a refund claim
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
