// Agent thought-process panel (right column on Live view)

const AgentRow = ({ agent, event, isActive }) => {
  const stage = event ? event[agent.id] : null;
  if (!stage && agent.id !== 'executor') return null;
  return (
    <div className={'relative px-5 py-3.5 transition-colors ' + (isActive ? 'bg-em-soft' : '')}>
      <div className="absolute left-0 top-3 bottom-3 w-px" style={{ background: agent.color, opacity: isActive ? 1 : 0.18 }} />
      <div className="flex items-start gap-2.5">
        <div className="relative mt-[5px]">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: agent.color }} />
          {isActive && (
            <div className="absolute inset-0 w-1.5 h-1.5 rounded-full pulse-dot" style={{ background: agent.color, '--pc': hexToRgba(agent.color, 0.45) }} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <div className="flex items-baseline gap-2">
              <span className="text-[14px] text-ink-100" style={{ color: agent.color }}>
                {agent.name}
              </span>
              {stage?.verdict && (
                <span className="text-[12px] text-ink-400">
                  {stage.verdict.toLowerCase().replace('_',' ')}
                </span>
              )}
            </div>
            {stage?.timing_ms != null && stage.timing_ms > 0 && (
              <Mono className="text-[12px] text-ink-400">{stage.timing_ms}ms</Mono>
            )}
          </div>
          <div className="text-[14px] text-ink-200 mt-1 leading-snug">
            {stage ? stage.sentence : <span className="text-ink-500">Waiting</span>}
          </div>
          {stage?.failing_rule && (
            <Mono className="text-[12px] text-ink-500 mt-1 block">
              {stage.failing_rule}
            </Mono>
          )}
        </div>
      </div>
    </div>
  );
};

const LiveAgenticTimeline = () => {
  const [items, setItems] = React.useState([]);
  React.useEffect(() => {
    const bus = window.PeepEventBus;
    if (!bus) return;
    const unsubBus = bus.subscribe((ev) => {
      setItems(prev => [{ kind: 'event', ts: ev.timestamp, ev }, ...prev].slice(0, 8));
    });
    const orch = window.PeepOrchestrator;
    const unsubOrch = orch?.onDecision?.((decisions) => {
      const latest = decisions[0];
      if (!latest) return;
      setItems(prev => [{ kind: 'decision', ts: latest.ts, decision: latest }, ...prev].slice(0, 8));
    });
    return () => { unsubBus && unsubBus(); unsubOrch && unsubOrch(); };
  }, []);

  return (
    <div className="px-5 pt-5 pb-2 hairline-t">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[13px] text-ink-400">Agentic events</span>
        <Mono className="text-[11px] text-ink-500">contract v1</Mono>
      </div>
      {items.length === 0 && (
        <div className="text-[12px] text-ink-500 px-1 pb-2">
          Awaiting vision agent · place a package in frame, then take it
        </div>
      )}
      <div className="space-y-1.5">
        {items.map((it, i) => {
          if (it.kind === 'event') {
            const e = it.ev;
            return (
              <div key={i} className="px-2 py-1.5 rounded-md bg-ink-800 flex items-center gap-2.5">
                <span className="w-1 h-4 rounded-full"
                      style={{ background: e.event_type === 'package_taken' ? '#c66' :
                                            e.event_type === 'browser_agent_done' ? '#7ea582' : '#706b8e' }} />
                <Mono className="text-[12.5px] text-ink-200 truncate flex-1">{e.event_type}</Mono>
                <Mono className="text-[11px] text-ink-500">{Math.round(e.confidence * 100)}%</Mono>
              </div>
            );
          }
          const d = it.decision;
          return (
            <div key={i} className="px-2 py-1.5 rounded-md hairline flex items-center gap-2.5">
              <Icon name={d.status === 'done' ? 'check' : d.status === 'failed' ? 'x' : 'arrow-right'}
                    size={12} className="text-ink-400" />
              <span className="text-[12.5px] text-ink-200 truncate flex-1">→ {d.workflow}</span>
              <Mono className="text-[11px] text-ink-500">{d.status}</Mono>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const AgentPanel = ({ events, activeEventId, activeAgentId, flashKey }) => {
  const activeEvent = events.find(e => e.id === activeEventId) || events[0] || null;

  return (
    <div className="h-full flex flex-col bg-ink-900 hairline-l">
      {/* Header */}
      <div className="h-14 px-5 flex items-center justify-between hairline-b">
        <div className="text-[14px] text-ink-100">Agent thought process</div>
        <span className="flex items-center gap-1.5 text-[12px] text-ink-400">
          <span className="w-1.5 h-1.5 rounded-full bg-em pulse-dot" />
          Live
        </span>
      </div>

      {/* Current event header */}
      {activeEvent ? (
        <div key={flashKey} className="px-5 py-4 hairline-b flash">
          <div className="flex items-baseline gap-2.5">
            <span className="text-[15px] text-ink-100">{EVENT_TYPES[activeEvent.type].label}</span>
            <SeverityChip sev={EVENT_TYPES[activeEvent.type].severity} />
          </div>
          <div className="flex items-baseline gap-3 mt-1.5">
            <Mono className="text-[12px] text-ink-400">{Math.round(activeEvent.confidence * 100)}%</Mono>
            <span className="text-[12px] text-ink-400">{fmtTimeS(activeEvent.timestamp)}</span>
          </div>
        </div>
      ) : (
        <div className="px-5 py-4 hairline-b text-[13px] text-ink-400">
          No event yet. The agent stack will populate when the vision agent fires.
        </div>
      )}

      {/* Agent stack */}
      <div className="flex-1 overflow-y-auto scroll-thin">
        {activeEvent && AGENTS.map((agent, i) => (
          <div key={agent.id} className={i < AGENTS.length - 1 ? 'hairline-b' : ''}>
            <AgentRow
              agent={agent}
              event={activeEvent}
              isActive={agent.id === activeAgentId}
            />
          </div>
        ))}

        <LiveAgenticTimeline />

        {/* Recent runs */}
        <div className="px-5 pt-5 pb-2">
          <span className="text-[13px] text-ink-400">Recent runs</span>
        </div>
        <div className="px-3 pb-5">
          {events.slice(0, 5).map(ev => {
            const sev = EVENT_TYPES[ev.type].severity;
            const totalMs = (ev.vision?.timing_ms||0) + (ev.orchestrator?.timing_ms||0) + (ev.reasoning?.timing_ms||0) + (ev.executor?.timing_ms||0);
            return (
              <div key={ev.id} className="px-2 py-1.5 rounded-md hover:bg-ink-800 flex items-center gap-2.5 cursor-pointer">
                <span className="w-px h-5" style={{ background: SEVERITY[sev].color }} />
                <span className="text-[13.5px] text-ink-200 truncate flex-1">{EVENT_TYPES[ev.type].label}</span>
                <Mono className="text-[12px] text-ink-500">{totalMs}ms</Mono>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

window.AgentPanel = AgentPanel;
