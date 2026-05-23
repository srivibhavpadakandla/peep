// Alerts view — security alerts + config sidebar

const ALERT_EVENT_TYPES = ['package_fleeing', 'person_loitering', 'multiple_loitering', 'weapon_detected', 'after_hours_activity', 'animal_detected'];

const formatDuration = (s) => {
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (m < 60) return r ? `${m} min ${r}s` : `${m} min`;
  return `${Math.floor(m/60)}h ${m%60}m`;
};

const ConfigSidebar = ({ open, onToggle }) => {
  const [enabled, setEnabled] = React.useState(true);
  const [dwell, setDwell] = React.useState(12);
  const [fireOnce, setFireOnce] = React.useState(true);
  const [quietStart, setQuietStart] = React.useState('22:00');
  const [quietEnd, setQuietEnd] = React.useState('06:00');
  const [movementGate, setMovementGate] = React.useState(true);
  const [animals, setAnimals] = React.useState({ dog: true, bear: true, cat: false, bird: false });

  return (
    <div className={'shrink-0 transition-all duration-200 ' + (open ? 'w-[300px]' : 'w-[44px]')}>
      <div className="h-full bg-ink-900 hairline-l flex flex-col">
        {open ? (
          <>
            <div className="h-14 px-5 hairline-b flex items-center justify-between">
              <span className="text-[14px] text-ink-100">Configuration</span>
              <button onClick={() => onToggle(false)} className="text-ink-400 hover:text-ink-100">
                <Icon name="panel-right-close" size={15} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto scroll-thin">
              <div className="px-5 py-4 hairline-b flex items-center justify-between">
                <span className="text-[14px] text-ink-200">Alerts enabled</span>
                <Toggle on={enabled} onChange={setEnabled} />
              </div>

              <div className="px-5 py-4 hairline-b">
                <div className="text-[14px] text-ink-200 mb-2.5">Loitering threshold</div>
                <Slider value={dwell} onChange={setDwell} min={1} max={1800} step={1} format={formatDuration} />
              </div>

              <div className="px-5 py-4 hairline-b flex items-center justify-between">
                <span className="text-[14px] text-ink-200">Fire once per session</span>
                <Toggle on={fireOnce} onChange={setFireOnce} />
              </div>

              <div className="px-5 py-4 hairline-b">
                <div className="text-[14px] text-ink-200 mb-2.5">Quiet hours</div>
                <div className="flex items-center gap-2">
                  <input type="time" value={quietStart} onChange={e=>setQuietStart(e.target.value)}
                    className="flex-1 h-8 px-2 rounded-md bg-ink-850 hairline text-[13px] text-ink-100 font-mono" />
                  <span className="text-ink-400 text-[13px]">to</span>
                  <input type="time" value={quietEnd} onChange={e=>setQuietEnd(e.target.value)}
                    className="flex-1 h-8 px-2 rounded-md bg-ink-850 hairline text-[13px] text-ink-100 font-mono" />
                </div>
              </div>

              <div className="px-5 py-4 hairline-b flex items-center justify-between">
                <span className="text-[14px] text-ink-200">Require movement</span>
                <Toggle on={movementGate} onChange={setMovementGate} />
              </div>

              <div className="px-5 py-4">
                <div className="text-[14px] text-ink-200 mb-2.5">Animal classes</div>
                <div className="flex flex-wrap gap-1.5">
                  {['Dog', 'Bear', 'Cat', 'Bird'].map(l => {
                    const k = l.toLowerCase();
                    return (
                      <button key={k}
                        onClick={() => setAnimals(a => ({ ...a, [k]: !a[k] }))}
                        className={'h-7 px-2.5 rounded-md text-[13px] transition-colors hairline ' +
                          (animals[k] ? 'bg-em-soft text-em' : 'bg-ink-850 text-ink-400 hover:bg-ink-800')}>
                        {l}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        ) : (
          <button onClick={() => onToggle(true)} className="w-full h-14 flex items-center justify-center text-ink-400 hover:text-ink-100 hairline-b" title="Open config">
            <Icon name="sliders-horizontal" size={15} />
          </button>
        )}
      </div>
    </div>
  );
};

const ViewAlerts = ({ events }) => {
  const [configOpen, setConfigOpen] = React.useState(true);

  const alerts = events
    .filter(e => ALERT_EVENT_TYPES.includes(e.type))
    .filter(e => e.executor || e.reasoning?.verdict === 'FALSE_POSITIVE');

  return (
    <div className="h-full flex">
      <div className="flex-1 overflow-y-auto scroll-thin">
        <div className="h-14 px-8 flex items-center justify-between hairline-b">
          <div className="flex items-baseline gap-3">
            <h1 className="text-[16px] text-ink-100">Alerts</h1>
            <span className="text-[13px] text-ink-400">{alerts.length} in the last 24 hours</span>
          </div>
          <Btn variant="ghost" size="sm">Snooze 1h</Btn>
        </div>

        <div className="px-8 py-6">
          {alerts.map((a, i) => {
            const meta = EVENT_TYPES[a.type];
            const sev = meta.severity;
            const isFp = a.reasoning?.verdict === 'FALSE_POSITIVE';
            return (
              <div key={a.id}
                   className={'grid grid-cols-[3px_1fr_auto] gap-4 py-5 items-start ' + (i < alerts.length - 1 ? 'hairline-b' : '')}>
                <div className="h-full" style={{ background: SEVERITY[sev].color }} />
                <div className="min-w-0">
                  <div className="flex items-baseline gap-3">
                    <span className="text-[15px] text-ink-100">{meta.label}</span>
                    <SeverityChip sev={sev} />
                    {isFp && <span className="text-[12px] text-ink-500">false positive · ignored</span>}
                    {a.type === 'weapon_detected' && !isFp && <span className="text-[12px]" style={{ color: SEVERITY.critical.color }}>acknowledge required</span>}
                  </div>
                  <div className="text-[14px] text-ink-300 mt-1.5 leading-relaxed">
                    {a.reasoning?.sentence && a.reasoning.sentence !== '—' ? a.reasoning.sentence : a.vision.sentence}
                  </div>
                  {a.executor && (
                    <div className="text-[13px] text-ink-400 mt-2 flex items-baseline gap-2">
                      <span>{a.executor.sentence}</span>
                      {a.executor.reference && <Mono className="text-[12px] text-ink-300">{a.executor.reference}</Mono>}
                    </div>
                  )}
                </div>
                <div className="text-right shrink-0 pt-0.5">
                  <Mono className="text-[12px] text-ink-300 tabular-nums">{Math.round(a.confidence*100)}%</Mono>
                  <div className="text-[12px] text-ink-500 mt-0.5">{fmtDay(a.timestamp)} · {fmtTime(a.timestamp)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <ConfigSidebar open={configOpen} onToggle={setConfigOpen} />
    </div>
  );
};

window.ViewAlerts = ViewAlerts;
