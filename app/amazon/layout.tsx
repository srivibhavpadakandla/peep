import type { ReactNode } from "react";
import Link from "next/link";

export default function AmazonLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <header className="bg-[#131921] text-white px-6 py-3 flex items-center gap-4">
        <Link href="/amazon/orders" className="text-xl font-bold tracking-tight">
          smazon<span className="text-orange-400">.sim</span>
        </Link>
        <span className="text-xs text-neutral-400">simulated target — for agent testing only</span>
      </header>
      <main className="max-w-3xl mx-auto p-8">{children}</main>
    </div>
  );
}
