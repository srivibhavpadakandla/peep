// Logs view

const SOURCE_COLOR = {
  vision: '#758082',
  orchestration: '#7ea582',
  browser: '#b3bd80',
  system: '#706b8e',
};

const ViewLogs = () => {
  const [query, setQuery] = React.useState('');
  const [source, setSource] = React.useState('all');
  const [live, setLive] = React.useState(() => (window.PeepLiveLogs?.all() || []));

  React.useEffect(() => {
    return window.PeepLiveLogs?.subscribe(setLive);
  }, []);

  // Live logs are newest-first; static LOGS are roughly newest-first too.
  // Merge so live ones surface on top.
  const all = React.useMemo(() => [...live, ...LOGS], [live]);
  const filtered = all.filter(l =>
    (source === 'all' || l.source === source) &&
    (!query || l.text.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div className="h-full flex flex-col">
      <div className="h-14 px-8 flex items-center justify-between hairline-b">
        <div className="flex items-baseline gap-3">
          <h1 className="text-[16px] text-ink-100">Logs</h1>
          <span className="text-[13px] text-ink-400">{filtered.length} events</span>
        </div>
        <input
          value={query} onChange={e => setQuery(e.target.value)}
          placeholder="Search"
          className="h-8 px-3 w-[220px] rounded-md bg-ink-850 hairline text-[13px] text-ink-100 placeholder:text-ink-500 focus:outline-none focus:ring-1 focus:ring-em-line"
        />
      </div>

      <div className="px-8 pt-5 flex items-center gap-2">
        <Chip active={source==='all'} onClick={() => setSource('all')}>All</Chip>
        {LOG_SOURCES.map(s => (
          <Chip key={s} active={source===s} onClick={() => setSource(s)}>{s}</Chip>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto scroll-thin px-8 pt-4 pb-8 max-w-[1100px]">
        <div>
          {filtered.map((l, i) => (
            <div key={i}
                 className={'grid grid-cols-[80px_120px_1fr] gap-5 py-3 items-baseline ' +
                   (i < filtered.length - 1 ? 'hairline-b' : '')}>
              <Mono className="text-[12px] text-ink-500 tabular-nums">{fmtTimeS(l.t)}</Mono>
              <span className="text-[13px] text-ink-400">{l.source}</span>
              <div className="text-[14px] text-ink-200 leading-snug">{l.text}</div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="py-16 text-center text-[14px] text-ink-400">
              No matches.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

window.ViewLogs = ViewLogs;
