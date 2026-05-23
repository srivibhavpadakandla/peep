// Main app shell

const App = () => {
  const [view, setView] = React.useState('live');
  const [collapsed, setCollapsed] = React.useState(false);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [source, setSource] = React.useState('live');
  const [events, setEvents] = React.useState([]);          // populated by real vision-agent events
  const [activeEventId, setActiveEventId] = React.useState(null);
  const [activeAgentId, setActiveAgentId] = React.useState('vision');
  const [flashKey, setFlashKey] = React.useState(0);

  // Cameras — user-editable, persisted in localStorage.
  const [cameras, setCameras] = React.useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('peep.cameras') || 'null');
      if (Array.isArray(saved) && saved.length) return saved;
    } catch {}
    return [{ id: 'cam_01', label: 'Front door', sub: '1080p · live', status: 'live' }];
  });
  const [activeCameraId, setActiveCameraId] = React.useState(() => {
    return localStorage.getItem('peep.activeCamera') || 'cam_01';
  });
  React.useEffect(() => {
    localStorage.setItem('peep.cameras', JSON.stringify(cameras));
  }, [cameras]);
  React.useEffect(() => {
    localStorage.setItem('peep.activeCamera', activeCameraId);
  }, [activeCameraId]);

  const renameCamera = (id, label) =>
    setCameras(cs => cs.map(c => c.id === id ? { ...c, label } : c));
  const removeCamera = (id) =>
    setCameras(cs => {
      const next = cs.filter(c => c.id !== id);
      if (id === activeCameraId && next.length) setActiveCameraId(next[0].id);
      return next;
    });
  const addCamera = () => {
    const id = 'cam_' + Math.random().toString(36).slice(2, 7);
    const n = cameras.length + 1;
    setCameras(cs => [...cs, { id, label: `Camera ${n}`, sub: 'idle', status: 'idle' }]);
  };

  // Auto-collapse sidebar at narrow widths (per spec: collapses at 1280)
  React.useEffect(() => {
    const handler = () => setCollapsed(window.innerWidth < 1200);
    handler();
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  // Subscribe to the real agentic event bus and convert into Console event shape.
  // Browser-agent receipts also flow through so the right panel reflects real activity.
  React.useEffect(() => {
    const bus = window.PeepEventBus;
    if (!bus) return;
    const unsub = bus.subscribe((ev) => {
      // Skip the receipt-only event; it gets attached to the originating one in UI.
      if (ev.event_type === 'browser_agent_done') {
        setActiveAgentId('executor');
        return;
      }
      // Only map known event types (matches Console's EVENT_TYPES table).
      if (!EVENT_TYPES[ev.event_type]) return;
      const built = buildEvent({
        id: 'evt_' + Math.random().toString(36).slice(2, 8),
        type: ev.event_type,
        ts: new Date(ev.timestamp),
        confidence: ev.confidence,
        vision: `${ev.event_type} detected from live camera`,
        cls: ev.event_type,
      });
      setEvents(prev => [built, ...prev].slice(0, 30));
      setActiveEventId(built.id);
      setActiveAgentId('vision');
      setFlashKey(k => k + 1);
    });
    return unsub;
  }, []);

  // Badge counts — derived from real events only.
  const badgeCounts = {
    inbox: { count: 0 },
    alerts: { count: events.filter(e => ['critical','high'].includes(EVENT_TYPES[e.type].severity)).length, kind: 'alert' },
  };

  const showRightPanel = view === 'live';

  return (
    <div className="w-screen h-screen flex bg-ink-950 text-ink-100 overflow-hidden">
      {window.PeepAlertBanner && <window.PeepAlertBanner />}
      <Sidebar
        active={view}
        onChange={setView}
        collapsed={collapsed}
        badgeCounts={badgeCounts}
        cameras={cameras}
        activeCameraId={activeCameraId}
        onSelectCamera={setActiveCameraId}
        onRenameCamera={renameCamera}
        onRemoveCamera={removeCamera}
        onAddCamera={addCamera}
      />

      <main className="flex-1 min-w-0 flex">
        <div className="flex-1 min-w-0 h-full bg-ink-950 flex flex-col">
          {view === 'live'     && <ViewLive events={events} activeEventId={activeEventId} activeAgentId={activeAgentId} source={source} setSource={setSource} openDrawer={() => setDrawerOpen(true)} activeCamera={cameras.find(c => c.id === activeCameraId) || cameras[0]} />}
          {view === 'agents'   && <ViewAgents events={events} />}
          {view === 'inbox'    && <ViewInbox />}
          {view === 'alerts'   && <ViewAlerts events={events} />}
          {view === 'logs'     && <ViewLogs />}
          {view === 'usage'    && <ViewUsage apiKeySet={true} />}
          {view === 'settings' && <ViewSettings />}
        </div>

        {showRightPanel && (
          <div className="w-[360px] shrink-0 hidden xl:block h-full">
            <AgentPanel events={events} activeEventId={activeEventId} activeAgentId={activeAgentId} flashKey={flashKey} />
          </div>
        )}
      </main>

      {/* Drawer for narrow widths */}
      {showRightPanel && drawerOpen && (
        <div className="fixed inset-0 z-40 xl:hidden" onClick={() => setDrawerOpen(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <div className="absolute right-0 top-0 bottom-0 w-[360px] bg-ink-900 slide-in" onClick={e => e.stopPropagation()}>
            <AgentPanel events={events} activeEventId={activeEventId} activeAgentId={activeAgentId} flashKey={flashKey} />
          </div>
        </div>
      )}
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
