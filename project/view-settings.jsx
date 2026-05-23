// Settings view — form layout

const FormRow = ({ label, sub, children, align = 'center' }) => (
  <div className={'grid grid-cols-[220px_1fr] gap-10 py-5 hairline-b items-' + align}>
    <div>
      <div className="text-[14px] text-ink-200">{label}</div>
      {sub && <div className="text-[13px] text-ink-400 mt-1 leading-relaxed">{sub}</div>}
    </div>
    <div>{children}</div>
  </div>
);

const SectionGroup = ({ title, children }) => (
  <div className="mb-10">
    <h2 className="text-[18px] text-ink-100 mb-1">{title}</h2>
    <div className="[&>div:last-child]:!shadow-none">{children}</div>
  </div>
);

// ── Test agent: fires real events onto PeepEventBus so the full pipeline runs ──
const TEST_EVENTS = [
  { type: 'package_fleeing',   label: 'Suspect fleeing with package', conf: 0.88,
    tagline: 'Person sprinting away holding a box · IoU 0.18 · speed 41%/s' },
  { type: 'package_taken',     label: 'Package taken',                conf: 0.91,
    tagline: 'Person picked up package and exited frame.' },
  { type: 'package_arrived',   label: 'Package arrived',              conf: 0.96,
    tagline: 'Cardboard box placed on porch.' },
  { type: 'person_loitering',  label: 'Person loitering',             conf: 0.83,
    tagline: 'Person on porch · dwell 14s.' },
  { type: 'weapon_detected',   label: 'Weapon detected',              conf: 0.76,
    tagline: 'Object resembling a long tool, held by person.' },
];

const TestAgentPanel = () => {
  const [busy, setBusy] = React.useState(null);
  const [lastFired, setLastFired] = React.useState(null);

  const fire = (def) => {
    if (!window.PeepEventBus) return;
    setBusy(def.type);
    window.PeepLiveLogs?.append({ source: 'system', text: `Test agent · firing ${def.type} (conf ${def.conf}).` });
    window.PeepEventBus.publish({
      event_type: def.type,
      confidence: def.conf,
      evidence_clip: { kind: 'frame', ref: 'about:blank' },
    });
    setLastFired({ ...def, at: new Date() });
    setTimeout(() => setBusy(null), 500);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-2">
        {TEST_EVENTS.map(ev => (
          <button key={ev.type}
            onClick={() => fire(ev)}
            disabled={busy === ev.type}
            className="group flex items-center justify-between gap-3 px-3 py-2.5 rounded-md bg-ink-850 hairline hover:bg-ink-800 transition disabled:opacity-50 text-left">
            <div className="min-w-0">
              <div className="text-[13.5px] text-ink-100 flex items-center gap-2">
                <span className="inline-flex w-1.5 h-1.5 rounded-full bg-em"
                  style={{ background: SEVERITY[EVENT_TYPES[ev.type]?.severity || 'info']?.color }} />
                {ev.label}
              </div>
              <div className="text-[12px] text-ink-400 mt-0.5 truncate">{ev.tagline}</div>
            </div>
            <span className="text-[11px] text-ink-400 font-mono shrink-0">
              conf {ev.conf.toFixed(2)} · fire ›
            </span>
          </button>
        ))}
      </div>
      {lastFired && (
        <div className="text-[12px] text-ink-400 font-mono">
          last: {lastFired.type} @ {lastFired.at.toLocaleTimeString()}
          {' '}— check Alerts + Logs to verify the orchestrator + email side-effects.
        </div>
      )}
    </div>
  );
};

const ViewSettings = () => {
  const [gmail, setGmail] = React.useState(true);
  const [dwell, setDwell] = React.useState(12);
  const [cooldown, setCooldown] = React.useState(45);
  const [movement, setMovement] = React.useState(8);
  const [amazon, setAmazon] = React.useState(true);
  const [police, setPolice] = React.useState(false);
  const [showDisconnect, setShowDisconnect] = React.useState(false);
  const [profile, setProfile] = React.useState(() => window.PeepProfile.get());
  const [editingProfile, setEditingProfile] = React.useState(false);
  const [draftName, setDraftName]   = React.useState(profile.name);
  const [draftEmail, setDraftEmail] = React.useState(profile.email);

  React.useEffect(() => window.PeepProfile.subscribe(setProfile), []);

  const saveProfile = () => {
    window.PeepProfile.set({ name: draftName.trim(), email: draftEmail.trim() });
    setEditingProfile(false);
  };

  return (
    <div className="h-full overflow-y-auto scroll-thin">
      <div className="h-14 px-8 flex items-center hairline-b">
        <h1 className="text-[16px] text-ink-100">Settings</h1>
      </div>

      <div className="px-8 pt-6 pb-10 max-w-[800px]">
        <SectionGroup title="Profile">
          <FormRow label="Name" sub="Shown in the sidebar and on outgoing messages.">
            {editingProfile ? (
              <input
                value={draftName} onChange={e => setDraftName(e.target.value)}
                className="h-9 px-3 w-full max-w-[320px] rounded-md bg-ink-850 hairline text-[14px] text-ink-100 focus:outline-none focus:ring-1 focus:ring-em-line"
              />
            ) : (
              <span className="text-[14px] text-ink-200">{profile.name}</span>
            )}
          </FormRow>
          <FormRow label="Notification email" sub="Where Peep sends security alerts.">
            <div className="flex items-center justify-between gap-3">
              {editingProfile ? (
                <input
                  type="email"
                  value={draftEmail} onChange={e => setDraftEmail(e.target.value)}
                  className="h-9 px-3 flex-1 max-w-[320px] rounded-md bg-ink-850 hairline text-[14px] text-ink-100 focus:outline-none focus:ring-1 focus:ring-em-line"
                />
              ) : (
                <span className="text-[14px] text-ink-200">{profile.email}</span>
              )}
              {editingProfile ? (
                <div className="flex gap-2">
                  <Btn variant="ghost" size="sm" onClick={() => {
                    setDraftName(profile.name); setDraftEmail(profile.email); setEditingProfile(false);
                  }}>Cancel</Btn>
                  <Btn variant="primary" size="sm" onClick={saveProfile}>Save</Btn>
                </div>
              ) : (
                <Btn variant="ghost" size="sm" onClick={() => setEditingProfile(true)}>Edit</Btn>
              )}
            </div>
          </FormRow>
        </SectionGroup>

        <SectionGroup title="Gmail">
          <FormRow label="Account" sub={`Connected as ${profile.email}`}>
            <div className="flex items-center justify-between gap-3">
              <span className="text-[14px] text-ink-200">{profile.email}</span>
              {gmail ? (
                <Btn variant="ghost" size="sm" onClick={() => setShowDisconnect(true)}>Disconnect</Btn>
              ) : (
                <Btn variant="primary" size="md" onClick={() => setGmail(true)}>Connect</Btn>
              )}
            </div>
          </FormRow>
          <FormRow label="Permissions" sub="The minimum we need.">
            <Mono className="text-[13px] text-ink-200 block">gmail.readonly</Mono>
            <div className="text-[12.5px] text-ink-400 mt-1">Peep never sends, deletes, or modifies messages.</div>
          </FormRow>
        </SectionGroup>

        <SectionGroup title="Detection">
          <FormRow label="Dwell threshold" sub="Before flagging loitering.">
            <Slider value={dwell} onChange={setDwell} min={3} max={120} step={1} format={(v) => `${v}s`} />
          </FormRow>
          <FormRow label="Alert cooldown" sub="Minimum gap between repeats.">
            <Slider value={cooldown} onChange={setCooldown} min={10} max={600} step={5} format={(v) => v < 60 ? `${v}s` : `${Math.floor(v/60)} min ${v%60}s`} />
          </FormRow>
          <FormRow label="Movement threshold" sub="Frame-to-frame pixel motion.">
            <Slider value={movement} onChange={setMovement} min={1} max={30} step={1} format={(v) => `${v}px`} />
          </FormRow>
        </SectionGroup>

        <SectionGroup title="Integrations">
          <FormRow label="Amazon" sub="Files refund claims for stolen or missing packages.">
            <div className="flex items-center justify-between">
              <span className="text-[14px] text-ink-300">{amazon ? 'Active' : 'Disabled'}</span>
              <Toggle on={amazon} onChange={setAmazon} />
            </div>
          </FormRow>
          <FormRow label="Local police" sub="Files a non-emergency report on weapon detection.">
            <div className="flex items-center justify-between">
              <span className="text-[14px] text-ink-300">{police ? 'Active' : 'Not connected'}</span>
              <Toggle on={police} onChange={setPolice} />
            </div>
          </FormRow>
        </SectionGroup>

        <SectionGroup title="Test agent">
          <FormRow label="Simulated events" sub="Publish a fake event onto the bus to exercise the orchestrator, alerts, and logs end-to-end. Useful for demos and for verifying email delivery.">
            <TestAgentPanel />
          </FormRow>
        </SectionGroup>
      </div>

      {showDisconnect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setShowDisconnect(false)}>
          <div className="absolute inset-0 bg-ink-100/20" />
          <div className="relative w-[400px] bg-ink-850 hairline rounded-lg p-6 slide-in" onClick={e => e.stopPropagation()}>
            <div className="text-[15px] text-ink-100">Sign out of Gmail?</div>
            <div className="text-[14px] text-ink-300 mt-2 leading-relaxed">
              Peep will fall back to the seeded demo inbox.
            </div>
            <div className="mt-5 flex items-center justify-end gap-2">
              <Btn variant="ghost" size="md" onClick={() => setShowDisconnect(false)}>Cancel</Btn>
              <Btn variant="danger" size="md" onClick={() => { setGmail(false); setShowDisconnect(false); }}>
                Sign out
              </Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

window.ViewSettings = ViewSettings;
