"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("demo@cipher.test");
  const [password, setPassword] = useState("hackathon");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // No real auth — this is a simulated target. Anything goes.
    router.push("/amazon/orders");
  };

  return (
    <div className="max-w-sm mx-auto border border-neutral-300 rounded-lg p-6">
      <h1 className="text-2xl font-semibold mb-4">Sign in</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <label className="block">
          <span className="text-sm">Email</span>
          <input
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-neutral-300 rounded px-2 py-1 text-sm"
            autoComplete="email"
          />
        </label>
        <label className="block">
          <span className="text-sm">Password</span>
          <input
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-neutral-300 rounded px-2 py-1 text-sm"
            autoComplete="current-password"
          />
        </label>
        <button
          type="submit"
          className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-medium rounded py-2 text-sm"
        >
          Continue
        </button>
      </form>
      <p className="mt-4 text-xs text-neutral-500">
        Hint for the agent: any credentials work — this page exists to be automated against.
      </p>
    </div>
  );
}
