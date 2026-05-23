import DemoCockpit from "@/components/DemoCockpit";

export default function HomePage() {
  return (
    <main className="p-6 space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Peep</h1>
        <p className="text-sm text-neutral-400">
          A camera that watches your doorstep, notices things that matter, and handles them for you.
        </p>
      </header>
      <DemoCockpit />
    </main>
  );
}
