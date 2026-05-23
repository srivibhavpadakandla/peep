// Inbox view — today's expected deliveries

const ViewInbox = () => {
  const [items, setItems] = React.useState([]);
  const [autoSweep, setAutoSweep] = React.useState(true);
  const [sweeping, setSweeping] = React.useState(false);

  const togglePill = (id) => {
    setItems(items.map(i => i.id === id
      ? { ...i, status: i.status === 'pending' ? 'received' : 'pending' }
      : i));
  };
  const sweep = () => {
    setSweeping(true);
    setTimeout(() => setSweeping(false), 1200);
  };

  const pending = items.filter(i => i.status === 'pending').length;

  return (
    <div className="h-full overflow-y-auto scroll-thin">
      <div className="h-14 px-8 flex items-center justify-between hairline-b">
        <h1 className="text-[16px] text-ink-100">Inbox</h1>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <Toggle on={autoSweep} onChange={setAutoSweep} />
            <span className="text-[13.5px] text-ink-300">Auto-sweep</span>
          </label>
          <Btn variant="primary" size="md" onClick={sweep}>
            {sweeping && <Icon name="loader-2" size={13} className="animate-spin" />}
            Check now
          </Btn>
        </div>
      </div>

      <div className="px-8 pt-6 pb-10 max-w-[920px]">
        <div className="flex items-baseline gap-3 mb-5">
          <h2 className="text-[20px] text-ink-100">Today</h2>
          <span className="text-[14px] text-ink-400">
            {pending} pending · {items.length - pending} received
          </span>
        </div>

        <div>
          {items.map((it, i) => (
            <div key={it.id}
                 className={'grid grid-cols-[1fr_120px_80px_110px] gap-6 py-4 items-baseline ' +
                   (i < items.length - 1 ? 'hairline-b' : '')}>
              <div className="min-w-0">
                <div className="text-[15px] text-ink-100">{it.item}</div>
                <Mono className="text-[12px] text-ink-500 mt-0.5 block">{it.id}</Mono>
              </div>
              <div className="text-[14px] text-ink-300">{it.from}</div>
              <Mono className="text-[13px] text-ink-300 tabular-nums">{it.eta}</Mono>
              <div className="flex justify-end">
                <button
                  onClick={() => togglePill(it.id)}
                  className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[13px] transition-colors hairline"
                  style={
                    it.status === 'received'
                      ? { color: '#706b8e', background: 'rgba(112,107,142,0.06)' }
                      : { color: '#6f6a61', background: 'transparent' }
                  }
                >
                  {it.status === 'received' ? 'Received' : 'Pending'}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12">
          <h2 className="text-[20px] text-ink-100 mb-3">Tomorrow</h2>
          <div className="text-[14px] text-ink-400 py-6">
            Nothing expected.
          </div>
        </div>
      </div>
    </div>
  );
};

window.ViewInbox = ViewInbox;
