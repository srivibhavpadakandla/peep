// Usage view

const StatTile = ({ label, value, sub }) => (
  <div className="py-2">
    <div className="text-[13px] text-ink-400">{label}</div>
    <div className="mt-2 flex items-baseline gap-2">
      <span className="text-[32px] text-ink-100 tabular-nums font-mono">
        {value}
      </span>
      {sub && <span className="text-[13px] text-ink-400">{sub}</span>}
    </div>
  </div>
);

const ViewUsage = ({ apiKeySet = true }) => {
  return (
    <div className="h-full overflow-y-auto scroll-thin">
      <div className="h-14 px-8 flex items-center justify-between hairline-b">
        <h1 className="text-[16px] text-ink-100">Usage</h1>
        <span className="text-[13px] text-ink-400">May 2026</span>
      </div>

      <div className="px-8 pt-6 pb-10 max-w-[900px]">
        {apiKeySet ? (
          <div className="grid grid-cols-3 gap-10 pb-8 hairline-b">
            <StatTile label="Cost" value={'$' + USAGE.cost_usd.toFixed(4)} />
            <StatTile label="Tokens" value={USAGE.tokens.toLocaleString()} sub={'avg ' + Math.round(USAGE.tokens/USAGE.calls) + '/call'} />
            <StatTile label="Calls" value={USAGE.calls} />
          </div>
        ) : (
          <div className="py-8 hairline-b flex items-baseline justify-between">
            <div>
              <div className="text-[16px] text-ink-100">Rule-based router · no API calls</div>
              <div className="text-[13.5px] text-ink-400 mt-1">Add an Anthropic API key in Settings to enable the reasoning agent.</div>
            </div>
            <Btn variant="primary" size="md">Add API key</Btn>
          </div>
        )}

        <div className="mt-8">
          <div className="text-[13px] text-ink-400 mb-3">Recent calls</div>
          <div>
            {USAGE.recent.map((c, i) => (
              <div key={i}
                   className={'grid grid-cols-[140px_1fr_100px_100px] gap-4 py-3 items-baseline ' +
                     (i < USAGE.recent.length - 1 ? 'hairline-b' : '')}>
                <Mono className="text-[12.5px] text-ink-500 tabular-nums">{fmtDay(c.t)} · {fmtTime(c.t)}</Mono>
                <span className="text-[14px] text-ink-200">{EVENT_TYPES[c.workflow].label}</span>
                <Mono className="text-[13px] text-ink-300 tabular-nums text-right">{c.tokens.toLocaleString()}</Mono>
                <Mono className="text-[13px] text-ink-300 tabular-nums text-right">${c.cost.toFixed(4)}</Mono>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

window.ViewUsage = ViewUsage;
