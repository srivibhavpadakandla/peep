// Agents view — 2x2 grid + run detail drawer

const AgentCard = ({ agent, runs, onOpenRun }) => {
  return (
    <Surface className="p-6 flex flex-col h-full">
      <div className="flex items-baseline justify-between">
        <div className="flex items-baseline gap-2.5">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: agent.color }} />
          <span className="text-[16px] text-ink-100">{agent.name}</span>
        </div>
      </div>
      <div className="text-[14px] text-ink-400 mt-1.5 leading-relaxed">{agent.role}</div>

      <div className="mt-6 flex-1">
        <div className="text-[13px] text-ink-400 mb-2">Recent outputs</div>
        <div className="-mx-2">
          {runs.slice(0, 5).map(ev => {
            const stage = ev[agent.id];
            if (!stage) {
              return (
                <div key={ev.id} className="px-2 py-2 flex items-baseline gap-3 opacity-40">
                  <Mono className="text-[12px] text-ink-500 w-[44px] shrink-0 tabular-nums">{fmtTime(ev.timestamp)}</Mono>
                  <span className="text-[13.5px] text-ink-500 flex-1">skipped</span>
                </div>
              );
            }
            return (
              <button
                key={ev.id}
                onClick={() => onOpenRun(ev.id)}
                className="w-full text-left px-2 py-2 rounded-md hover:bg-ink-800 flex items-start gap-3"
              >
                <Mono className="text-[12px] text-ink-500 w-[44px] shrink-0 tabular-nums mt-[2px]">{fmtTime(ev.timestamp)}</Mono>
                <span className="text-[14px] text-ink-200 flex-1 leading-snug">{stage.sentence}</span>
                <Mono className="text-[12px] text-ink-500 shrink-0 mt-[2px]">{stage.timing_ms}ms</Mono>
              </button>
            );
          })}
        </div>
      </div>
    </Surface>
  );
};

const RunDrawer = ({ event, onClose }) => {
  if (!event) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-ink-100/20" />
      <div
        className="relative h-full w-[520px] bg-ink-850 hairline-l flex flex-col slide-in"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 h-14 hairline-b flex items-center justify-between">
          <div className="flex items-baseline gap-3">
            <span className="text-[16px] text-ink-100">{EVENT_TYPES[event.type].label}</span>
            <SeverityChip sev={EVENT_TYPES[event.type].severity} />
          </div>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-100">
            <Icon name="x" size={16} />
          </button>
        </div>

        <div className="px-6 py-4 hairline-b flex items-baseline gap-4 text-[13px] text-ink-400">
          <span>{fmtDay(event.timestamp)} · {fmtTime(event.timestamp)}</span>
          <Mono className="text-[13px] text-ink-200">{Math.round(event.confidence*100)}%</Mono>
        </div>

        <div className="flex-1 overflow-y-auto scroll-thin px-6 py-5 space-y-5">
          {AGENTS.map(agent => {
            const stage = event[agent.id];
            if (!stage) return (
              <div key={agent.id} className="pl-3 border-l opacity-40" style={{ borderColor: agent.color }}>
                <div className="text-[14px] text-ink-300">{agent.name}</div>
                <div className="text-[13.5px] text-ink-500 mt-1">skipped</div>
              </div>
            );
            return (
              <div key={agent.id} className="pl-3 border-l" style={{ borderColor: agent.color }}>
                <div className="flex items-baseline justify-between">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[14px]" style={{ color: agent.color }}>{agent.name}</span>
                    {stage.verdict && (
                      <span className="text-[12px] text-ink-400">{stage.verdict.toLowerCase().replace('_',' ')}</span>
                    )}
                  </div>
                  <Mono className="text-[12px] text-ink-500">{stage.timing_ms}ms</Mono>
                </div>
                <div className="text-[14px] text-ink-200 mt-1.5 leading-relaxed">{stage.sentence}</div>
                {stage.failing_rule && (
                  <Mono className="text-[12px] text-ink-500 mt-1 block">{stage.failing_rule}</Mono>
                )}
                <details className="mt-3">
                  <summary className="text-[13px] text-ink-400 hover:text-ink-200">Show technical details</summary>
                  <pre className="mt-2 p-3 rounded bg-ink-900 text-[12px] text-ink-300 overflow-x-auto leading-relaxed font-mono">
{JSON.stringify(stage.json, null, 2)}
                  </pre>
                </details>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const ViewAgents = ({ events }) => {
  const [openRun, setOpenRun] = React.useState(null);
  const openEvent = events.find(e => e.id === openRun);

  return (
    <div className="h-full overflow-y-auto scroll-thin">
      <div className="h-14 px-8 flex items-center justify-between hairline-b">
        <h1 className="text-[16px] text-ink-100">Agents</h1>
        <span className="text-[13px] text-ink-400"><Mono className="text-[13px] text-ink-200">{events.length}</Mono> runs today</span>
      </div>

      <div className="px-8 py-6 grid grid-cols-2 gap-5">
        {AGENTS.map(agent => (
          <AgentCard key={agent.id} agent={agent} runs={events} onOpenRun={setOpenRun} />
        ))}
      </div>

      <RunDrawer event={openEvent} onClose={() => setOpenRun(null)} />
    </div>
  );
};

window.ViewAgents = ViewAgents;
