/* Peep — Settings with integration sheets, test alert, severity overrides */

function IntegrationRow({ label, status, statusColor, onTap, last }) {
  return (
    <Press onTap={onTap} style={{
      display: 'flex', alignItems: 'center', minHeight: 44,
      padding: '10px 16px', borderBottom: last ? 'none' : `0.5px solid ${peep.sep}`,
      gap: 12,
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: 7,
        background: peep.accent + '26',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: peep.accent, fontSize: 13, fontWeight: 700,
      }}>{label[0]}</div>
      <div style={{ flex: 1, fontSize: 15 }}>{label}</div>
      <span style={{ fontSize: 14, fontWeight: 500, color: statusColor }}>{status}</span>
      <span style={{ color: peep.textTer, fontSize: 12 }}>›</span>
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
                <span style={{ fontSize: 18 }}>{m.emoji}</span>
                <span style={{ flex: 1, fontSize: 13 }}>{m.label}</span>
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
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '4px 10px', borderRadius: 999,
        background: c + '22', border: `0.5px solid ${c}59`,
      }}>
        <div style={{ width: 5, height: 5, borderRadius: 999, background: c }} />
        <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.6, color: c }}>
          {sevLabel(value)}
        </span>
        <span style={{ fontSize: 9, color: c, marginLeft: 2 }}>▾</span>
      </Press>
      {open && (
        <div style={{
          position: 'absolute', right: 0, top: '110%', zIndex: 50,
          background: peep.surface2, borderRadius: 10,
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          padding: 4, minWidth: 110,
        }}>
          {opts.map(o => {
            const oc = sevColor(o);
            return (
              <Press key={o} onTap={() => { onChange(o); setOpen(false); }} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 10px', borderRadius: 6,
              }}>
                <div style={{ width: 5, height: 5, borderRadius: 999, background: oc }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: oc }}>{sevLabel(o)}</span>
              </Press>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ───────── Settings screen ─────────
function SettingsScreen({ state, setState, onFireTestAlert }) {
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
            ['dog',  '🐕', 'Dog'], ['cat',  '🐈', 'Cat'],
            ['bird', '🐦', 'Bird'], ['bear', '🐻', 'Bear'],
          ].map(([k, e, name], i, arr) => (
            <SRow key={k}
              label={<><span style={{ marginRight: 8 }}>{e}</span>{name}</>}
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

        <SettingsSection title="Demo" footer="Fires a fake critical event so you can demo the full flow on-device.">
          <SRow
            label={<span style={{ color: peep.accent, fontWeight: 600 }}>Fire test alert</span>}
            trailing={<span style={{ color: peep.textTer, fontSize: 14 }}>›</span>}
            onTap={() => {
              onFireTestAlert();
              toast('Test alert fired. Check Live →', { icon: '⚡' });
            }}
            last
          />
        </SettingsSection>

        <SettingsSection title="Advanced"
          footer="Expert mode shows raw confidence scores, metadata keys, and the technical agent log.">
          <SRow label="Expert mode"
            trailing={<Toggle on={S.expertMode} onChange={v => set('expertMode', v)} />} last />
        </SettingsSection>

        <div style={{
          textAlign: 'center', padding: '12px 20px',
          fontSize: 11, color: peep.textTer,
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        }}>peep · v0.1.0</div>
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
