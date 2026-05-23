// Live view — camera feed + agent panel

const LiveDetections = {
  live: [
    { x: 36, y: 22, w: 22, h: 65, label: 'person', conf: '0.91', color: '#7ea582' },
    { x: 62, y: 64, w: 9,  h: 14, label: 'package', conf: '0.96', color: '#706b8e' },
  ],
  import: [
    { x: 30, y: 30, w: 18, h: 55, label: 'person', conf: '0.83', color: '#7ea582' },
  ],
};

const SourceToggle = ({ source, onChange }) => (
  <div className="inline-flex rounded-md hairline p-0.5">
    {['live', 'import'].map(s => (
      <button
        key={s}
        onClick={() => onChange(s)}
        className={'h-7 px-3 rounded text-[13px] transition-colors ' +
          (source === s ? 'bg-ink-800 text-ink-100' : 'text-ink-400 hover:text-ink-200')}
      >
        {s === 'live' ? 'Live' : 'Import'}
      </button>
    ))}
  </div>
);

const ViewLive = ({ events, activeEventId, activeAgentId, source, setSource, openDrawer, activeCamera }) => {
  const dets = LiveDetections[source];
  const activeEvent = events.find(e => e.id === activeEventId) || events[0] || null;
  const sev = activeEvent ? EVENT_TYPES[activeEvent.type].severity : null;
  const userEmail = window.PeepProfile?.get().email || 'jamie@hello.com';
  const reviewLabel = activeEvent?.executor
    ? (activeEvent.executor.dest === 'amazon.com'   ? 'Open refund at Amazon'
     : activeEvent.executor.dest === userEmail      ? 'Open email in Gmail'
     : 'View log entry')
    : 'View reasoning trace';

  return (
    <div className="h-full flex flex-col overflow-y-auto scroll-thin">
      {/* Top bar */}
      <div className="h-14 px-8 flex items-center justify-between hairline-b">
        <div className="flex items-baseline gap-3">
          <h1 className="text-[16px] text-ink-100">{activeCamera ? activeCamera.label : 'No camera'}</h1>
          <span className="flex items-center gap-1.5 text-[13px] text-ink-400">
            <span className="w-1.5 h-1.5 rounded-full bg-em pulse-dot" />
            Watching
          </span>
        </div>

        <div className="flex items-center gap-5 text-[13px] text-ink-400">
          <span>Phase <span className="text-ink-200">detecting</span></span>
          <span>Person <span className="text-ink-200">present</span></span>
          <span>Tracking <Mono className="text-[13px] text-ink-200">person_01</Mono></span>
          <button
            onClick={openDrawer}
            className="xl:hidden text-ink-400 hover:text-ink-100"
            title="Open agent panel"
          >
            <Icon name="panel-right-open" size={15} />
          </button>
        </div>
      </div>

      {/* Camera */}
      <div className="px-8 pt-6">
        <CameraPlaceholder source={source} detections={dets} />
      </div>

      {/* Below-camera bar */}
      <div className="px-8 mt-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <SourceToggle source={source} onChange={setSource} />
          {source === 'import' && (
            <button className="text-[13px] text-ink-300 hover:text-ink-100">
              Choose file… <Mono className="text-[12px] text-ink-500 ml-1">porch_2025-04-17.mp4</Mono>
            </button>
          )}
        </div>
        <div className="flex items-center gap-4 text-[13px] text-ink-400">
          <span><Mono className="text-[13px] text-ink-200">12.4</Mono> fps</span>
          <span><Mono className="text-[13px] text-ink-200">78</Mono>ms</span>
        </div>
      </div>

      {/* Current event + action */}
      <div className="px-8 mt-8 pb-10">
        {!activeEvent && (
          <div className="text-[13px] text-ink-400">
            Awaiting the vision agent — trigger a detection in the camera frame to populate this panel.
          </div>
        )}
        {activeEvent && (
        <div className="grid grid-cols-2 gap-10">
          <div className="pr-10 -mr-10" style={{ borderRight: '1px solid rgba(23,20,15,0.07)' }}>
            <div className="text-[13px] text-ink-400">Current event</div>
            <div className="text-[20px] text-ink-100 mt-2">{EVENT_TYPES[activeEvent.type].label}</div>
            <div className="text-[14px] text-ink-300 mt-2 leading-relaxed">
              {activeEvent.vision.sentence}
            </div>
            <div className="flex items-baseline gap-4 mt-4">
              <SeverityChip sev={sev} />
              <Mono className="text-[12px] text-ink-400">{Math.round(activeEvent.confidence*100)}%</Mono>
              <span className="text-[12px] text-ink-400">{fmtTimeS(activeEvent.timestamp)}</span>
            </div>
          </div>

          <div>
            <div className="text-[13px] text-ink-400">Latest action</div>
            <div className="text-[20px] text-ink-100 mt-2 leading-snug">
              {activeEvent.executor
                ? activeEvent.executor.sentence
                : 'No action. Reasoning agent ruled this out.'}
            </div>
            {activeEvent.executor?.reference && (
              <div className="text-[13px] text-ink-400 mt-2">
                Reference <Mono className="text-[13px] text-ink-200">{activeEvent.executor.reference}</Mono>
              </div>
            )}
            <button className="mt-4 inline-flex items-center gap-1.5 text-[14px] text-em hover:underline">
              {reviewLabel} <Icon name="arrow-right" size={13} />
            </button>
          </div>
        </div>
        )}
      </div>
    </div>
  );
};

window.ViewLive = ViewLive;
