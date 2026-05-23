import DemoCockpit from "@/components/DemoCockpit";

export default function HomePage() {
  return (
    <main className="p-6 space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Cipher · Agentic Camera</h1>
        <p className="text-sm text-neutral-400">
          Vision agent → Claude orchestration → Playwright browser agent. One event contract, three isolated modules.
        </p>
      </header>
      <DemoCockpit />
    </main>
  );
}
