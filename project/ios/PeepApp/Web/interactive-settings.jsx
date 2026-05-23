/* Peep — Settings with integration sheets, test alert, severity overrides */

function IntegrationRow({ label, status, statusColor, onTap, last }) {
  return (
    <Press onTap={onTap} style={{
      display: 'flex', alignItems: 'center', minHeight: 44,
      padding: '10px 16px', borderBottom: last ? 'none' : `0.5px solid ${peep.sep}`,
    }}>
      <div style={{ flex: 1, fontSize: 15 }}>{label}</div>
      <span style={{ fontSize: 14, color: statusColor || peep.textSec }}>{status}</span>
    </Press>
  );
}

function IntegrationSheet({ kind, onClose, onConnect, onDisconnect }) {
  if (!kind) return null;
  const config = {
    Amazon: {
      title: 'Amazon',
      description: 'Peep files refund and missing-delivery claims against your Amazon orders, automatically.',
      bullets: [
        'Read order history for delivery matching',
        'Submit returns + claims on your behalf',
        'Notify you before final submission',
      ],
      connected: true,
    },
    Gmail: {
      title: 'Gmail',
      description: 'Read incoming shipping confirmations so Peep knows what to watch for and when.',
      bullets: [
        'Read messages from Amazon, UPS, FedEx, USPS',
        'Extract tracking IDs and ETAs',
        'No personal email is sent or read',
      ],
      connected: false,
    },
    Police: {
      title: 'Police',
      description: 'Direct dispatch to your local non-emergency line for confirmed weapon detections.',
      bullets: [
        'Requires verified address',
        'Available in select metros · coming soon',
      ],
      connected: false,
      comingSoon: true,
    },
  }[kind];

  return (
    <Sheet open={!!kind} onClose={onClose} title={config.title}>
      <div style={{ padding: '0 20px 8px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 14, color: peep.textSec, lineHeight: 1.5 }}>
          {config.description}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {config.bullets.map((b, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ color: peep.accent, fontSize: 13, marginTop: 1 }}>✓</span>
              <span style={{ fontSize: 13, color: peep.text }}>{b}</span>
            </div>
          ))}
        </div>
        <Press onTap={() => {
          if (config.comingSoon) return;
          if (config.connected) onDisconnect(kind); else onConnect(kind);
          onClose();
        }} style={{
          marginTop: 12,
          background: config.comingSoon ? peep.surface3
                    : config.connected ? peep.critical + '26'
                    : peep.accent,
          color: config.comingSoon ? peep.textSec
                : config.connected ? peep.critical
                : '#000',
          borderRadius: 14, padding: '14px 16px',
          fontWeight: 600, fontSize: 15, textAlign: 'center',
        }}>
          {config.comingSoon ? 'Notify me when available'
            : config.connected ? `Disconnect ${kind}`
            : `Connect ${kind}`}
        </Press>
      </div>
    </Sheet>
  );
}

// ───────── Severity override per event type ─────────
function SeverityOverrides({ overrides, onChange }) {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <div>
      <Press onTap={() => setExpanded(!expanded)} style={{
        display: 'flex', alignItems: 'center', minHeight: 44,
        padding: '8px 16px',
      }}>
        <div style={{ flex: 1, fontSize: 15 }}>Per-event severity</div>
        <span style={{
          fontSize: 13, color: peep.textSec,
          transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
          transition: 'transform .2s',
        }}>›</span>
      </Press>
      {expanded && (
        <div style={{ borderTop: `0.5px solid ${peep.sep}`, animation: 'peepFade .2s ease both' }}>
          {Object.keys(eventMeta).map((type, i, arr) => {
            const m = eventMeta[type];
            const current = overrides[type] || m.severity;
            return (
              <div key={type} style={{
                display: 'flex', alignItems: 'center', minHeight: 50,
                padding: '8px 16px',
                borderBottom: i === arr.length - 1 ? 'none' : `0.5px solid ${peep.sep}`,
                gap: 10,
              }}>
                <span style={{ flex: 1, fontSize: 14 }}>{m.label}</span>
                <SeveritySelect value={current} onChange={v => onChange(type, v)} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SeveritySelect({ value, onChange }) {
  const opts = ['info', 'warning', 'high', 'critical'];
  const c = sevColor(value);
  const [open, setOpen] = React.useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <Press onTap={() => setOpen(!open)} style={{
        fontSize: 13, color: c, fontWeight: 500,
        padding: '2px 6px',
      }}>
        {sevLabel(value)} <span style={{ fontSize: 10, opacity: 0.6 }}>▾</span>
      </Press>
      {open && (
        <div style={{
          position: 'absolute', right: 0, top: '110%', zIndex: 50,
          background: peep.surface, borderRadius: 10,
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          border: `0.5px solid ${peep.sep}`,
          padding: 4, minWidth: 110,
        }}>
          {opts.map(o => (
            <Press key={o} onTap={() => { onChange(o); setOpen(false); }} style={{
              padding: '6px 10px', borderRadius: 6,
              fontSize: 13, color: sevColor(o), fontWeight: 500,
            }}>{sevLabel(o)}</Press>
          ))}
        </div>
      )}
    </div>
  );
}

// ───────── Settings screen ─────────
// ─── Realtime relay status pill + URL editor ────────────────────────────────
function RealtimeSection() {
  const [status, setStatus] = React.useState(() => window.PeepRT?.status() || 'idle');
  const [url, setUrl] = React.useState(() => window.PeepRT?.getURL() || '');
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(url);
  const toast = useToast();

  React.useEffect(() => {
    if (!window.PeepRT) return;
    return window.PeepRT.onStatus(setStatus);
  }, []);

  const dot = status === 'open' ? peep.accent
            : status === 'connecting' ? '#dcc878'
            : peep.critical;
  const label = { open: 'Connected', connecting: 'Connecting…', closed: 'Offline', idle: 'Idle' }[status] || status;

  const save = () => {
    window.PeepRT?.setURL(draft.trim());
    setUrl(draft.trim());
    setEditing(false);
    toast('Reconnecting…', { icon: 'broadcast' });
  };

  return (
    <SettingsSection title="Realtime relay"
      footer="When connected, your community posts and friend messages broadcast to every device hitting the same relay. Use the trycloudflare URL for multi-device demos.">
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '12px 16px', borderBottom: `0.5px solid ${peep.sep}`,
      }}>
        <span style={{
          width: 8, height: 8, borderRadius: 999, background: dot,
          boxShadow: status === 'open' ? `0 0 8px ${dot}99` : 'none',
        }} />
        <span style={{ flex: 1, fontSize: 14 }}>{label}</span>
        <Press onTap={() => window.PeepRT?.reconnect?.()} style={{
          fontSize: 12, color: peep.accent, fontWeight: 600,
        }}>Reconnect</Press>
      </div>
      <div style={{ padding: '10px 16px' }}>
        <div style={{
          fontSize: 11, color: peep.textSec, marginBottom: 6,
          textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600,
        }}>Relay URL</div>
        {editing ? (
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              value={draft}
              onChange={e => setDraft(e.target.value)}
              placeholder="https://your-tunnel.trycloudflare.com"
              style={{
                flex: 1, padding: '8px 10px', borderRadius: 8,
                border: `0.5px solid ${peep.sep}`, background: peep.surface2,
                fontSize: 13, color: peep.text, outline: 'none',
                fontFamily: '"JetBrains Mono", ui-monospace, monospace',
              }}
            />
            <Press onTap={save} style={{
              padding: '8px 12px', background: peep.accent, color: '#fff',
              borderRadius: 8, fontSize: 13, fontWeight: 600,
            }}>Save</Press>
            <Press onTap={() => { setDraft(url); setEditing(false); }} style={{
              padding: '8px 12px', background: peep.surface2, color: peep.text,
              borderRadius: 8, fontSize: 13, fontWeight: 500,
            }}>Cancel</Press>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <code style={{
              flex: 1, padding: '8px 10px', borderRadius: 8,
              background: peep.surface2, fontSize: 12,
              fontFamily: '"JetBrains Mono", ui-monospace, monospace',
              color: peep.text,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{url || '(unset)'}</code>
            <Press onTap={() => setEditing(true)} style={{
              padding: '8px 12px', color: peep.accent, fontSize: 13, fontWeight: 600,
            }}>Edit</Press>
          </div>
        )}
      </div>
    </SettingsSection>
  );
}

function SettingsScreen({ state, setState, onFireTestAlert, onFireAmazonDemo }) {
  const toast = useToast();
  const [integrationOpen, setIntegrationOpen] = React.useState(null);

  const set = (k, v) => setState(s => ({ ...s, settings: { ...s.settings, [k]: v } }));
  const setAnimal = (k, v) => setState(s => ({
    ...s, settings: { ...s.settings, animals: { ...s.settings.animals, [k]: v } },
  }));
  const setIntegration = (k, v) => setState(s => ({
    ...s, settings: { ...s.settings, integrations: { ...s.settings.integrations, [k]: v } },
  }));
  const setOverride = (type, v) => setState(s => ({
    ...s, settings: { ...s.settings, severityOverrides: { ...s.settings.severityOverrides, [type]: v } },
  }));

  const S = state.settings;

  return (
    <Screen title="Settings">
      <div style={{ paddingBottom: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
        <SettingsSection title="Notifications">
          <SRow label="Push alerts" trailing={<Toggle on={S.push} onChange={v => set('push', v)} />} />
          <SRow label="Critical only" trailing={<Toggle on={S.criticalOnly} onChange={v => set('criticalOnly', v)} />} />
          <SRow label="Quiet hours start" trailing={<TimePill text="10:00 PM" />} />
          <SRow label="Quiet hours end"   trailing={<TimePill text="7:00 AM" />} last />
        </SettingsSection>

        <SettingsSection title="Detection">
          <div style={{ padding: '11px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 15 }}>Loitering threshold</span>
              <span style={{
                fontSize: 13, color: peep.textSec,
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              }}>{S.loiter.toFixed(1)}s</span>
            </div>
            <Slider value={(S.loiter - 1) / 14} onChange={v => set('loiter', Math.round((1 + v * 14) * 2) / 2)} />
          </div>
          <Sep />
          <SRow label="Fire once per session" trailing={<Toggle on={S.fireOnce} onChange={v => set('fireOnce', v)} />} />
          <SRow label="Require movement" trailing={<Toggle on={S.requireMovement} onChange={v => set('requireMovement', v)} />} />
          <Sep />
          <SeverityOverrides overrides={S.severityOverrides} onChange={setOverride} />
        </SettingsSection>

        <SettingsSection title="Animals">
          {[
            ['dog',  'Dog'],
            ['cat',  'Cat'],
            ['bird', 'Bird'],
            ['bear', 'Bear'],
          ].map(([k, name], i, arr) => (
            <SRow key={k}
              label={name}
              trailing={<Toggle on={S.animals[k]} onChange={v => setAnimal(k, v)} />}
              last={i === arr.length - 1}
            />
          ))}
        </SettingsSection>

        <SettingsSection title="Auto-actions"
          footer="Peep will always send a push notification before any auto-action is filed.">
          <SRow label="Auto-file refund on theft" trailing={<Toggle on={S.autoRefund} onChange={v => set('autoRefund', v)} />} />
          <SRow label="Auto-file claim for missing delivery" trailing={<Toggle on={S.autoClaim} onChange={v => set('autoClaim', v)} />} />
          <SRow label="Alert if expected package doesn't arrive" trailing={<Toggle on={S.notifyMissing} onChange={v => set('notifyMissing', v)} />} />
          <SRow label="Require my approval before filing" trailing={<Toggle on={S.reviewBeforeFiling} onChange={v => set('reviewBeforeFiling', v)} />} last />
        </SettingsSection>

        <RealtimeSection />

        <SettingsSection title="Neighborhood"
          footer="When on, Peep posts the verified clip to your West End feed automatically — no review step. You can always delete it later.">
          <SRow label="Auto-share critical incidents"
            trailing={<Toggle on={S.autoShareCritical} onChange={v => set('autoShareCritical', v)} />} last />
        </SettingsSection>

        <SettingsSection title="Integrations">
          <IntegrationRow label="Amazon"
            status={S.integrations.Amazon ? 'Connected' : 'Connect'}
            statusColor={S.integrations.Amazon ? peep.accent : peep.blue}
            onTap={() => setIntegrationOpen('Amazon')} />
          <IntegrationRow label="Gmail"
            status={S.integrations.Gmail ? 'Connected' : 'Connect'}
            statusColor={S.integrations.Gmail ? peep.accent : peep.blue}
            onTap={() => setIntegrationOpen('Gmail')} />
          <IntegrationRow label="Police"
            status="Coming soon"
            statusColor={peep.textSec}
            onTap={() => setIntegrationOpen('Police')}
            last />
        </SettingsSection>

        <SettingsSection title="Demo" footer="Reliable scripted flows for recording. Both jump straight to Live.">
          <SRow
            label={<span style={{ color: peep.accent, fontWeight: 600 }}>▶ Demo Amazon refund flow</span>}
            trailing={<span style={{ color: peep.textTer, fontSize: 14 }}>›</span>}
            onTap={() => {
              if (onFireAmazonDemo) onFireAmazonDemo();
              toast('Package theft detected · agent dispatched', { icon: 'lightning' });
            }}
          />
          <SRow
            label={<span style={{ color: peep.text, fontWeight: 600 }}>Fire random test alert</span>}
            trailing={<span style={{ color: peep.textTer, fontSize: 14 }}>›</span>}
            onTap={() => {
              onFireTestAlert();
              toast('Test alert fired. Check Live →', { icon: 'lightning' });
            }}
            last
          />
        </SettingsSection>

        <SettingsSection title="Advanced"
          footer="Expert mode shows raw confidence scores, metadata keys, and the technical agent log.">
          <SRow label="Expert mode"
            trailing={<Toggle on={S.expertMode} onChange={v => set('expertMode', v)} />} last />
        </SettingsSection>

        {/* About — app icon */}
        <div style={{
          margin: '8px 16px 0', padding: 18,
          background: peep.surface, borderRadius: 14,
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <PeepAppIcon size={64} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.2 }}>peep</div>
            <div style={{
              fontSize: 11, color: peep.textSec, marginTop: 2,
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            }}>v0.1.0 · build 142</div>
          </div>
          <Press style={{
            padding: '7px 12px', borderRadius: 10, background: peep.surface2,
            color: peep.accent, fontSize: 12, fontWeight: 600,
          }}>About</Press>
        </div>

        <div style={{
          textAlign: 'center', padding: '12px 20px',
          fontSize: 11, color: peep.textTer,
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        }}>your doorstep just got smarter.</div>
      </div>

      <IntegrationSheet
        kind={integrationOpen}
        onClose={() => setIntegrationOpen(null)}
        onConnect={k => { setIntegration(k, true); toast(`${k} connected.`, { icon: '✓' }); }}
        onDisconnect={k => { setIntegration(k, false); toast(`${k} disconnected.`, { icon: '✕' }); }}
      />
    </Screen>
  );
}

Object.assign(window, {
  IntegrationRow, IntegrationSheet, SeverityOverrides, SeveritySelect, SettingsScreen,
});
