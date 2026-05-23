/* Peep app screen mockups — visual representation of the SwiftUI screens.
   All styles inlined, dark mode, matching Color+Peep.swift palette. */

// ───────── Tokens ─────────
const peep = {
  bg:        '#000000',
  surface:   '#1C1C1E', // secondarySystemBackground (dark)
  surface2:  '#2C2C2E',
  text:      '#FFFFFF',
  textSec:   'rgba(235,235,245,0.60)',
  textTer:   'rgba(235,235,245,0.30)',
  sep:       'rgba(84,84,88,0.5)',
  accent:    '#0FB882',
  critical:  '#FF453A',
  high:      '#FF9F0A',
  warning:   '#FFC033',
  info:      '#59C7FA',
};

const sevColor = (s) => ({
  critical: peep.critical, high: peep.high, warning: peep.warning, info: peep.info
}[s]);

const sevLabel = (s) => ({
  critical: 'CRITICAL', high: 'HIGH', warning: 'WARNING', info: 'INFO'
}[s]);

const eventMeta = {
  package_arrived:      { label: 'Package arrived',           emoji: '📦', severity: 'info'     },
  package_taken:        { label: 'Package taken',             emoji: '📦', severity: 'critical' },
  package_not_arrived:  { label: 'Package never arrived',     emoji: '📦', severity: 'high'     },
  person_loitering:     { label: 'Person loitering',          emoji: '🚶', severity: 'warning'  },
  multiple_loitering:   { label: 'Multiple people loitering', emoji: '👥', severity: 'high'     },
  weapon_detected:      { label: 'Weapon detected',           emoji: '⚠️', severity: 'critical' },
  after_hours_activity: { label: 'After-hours activity',      emoji: '🌙', severity: 'warning'  },
  animal_detected:      { label: 'Animal detected',           emoji: '🐕', severity: 'info'     },
};

// ───────── Seed events ─────────
const SEED = [
  { type: 'package_taken',        time: '2:32 PM',  conf: 0.94 },
  { type: 'package_arrived',      time: '1:58 PM',  conf: 0.97 },
  { type: 'person_loitering',     time: '12:11 PM', conf: 0.81 },
  { type: 'animal_detected',      time: '10:04 AM', conf: 0.88 },
  { type: 'package_arrived',      time: '9:21 AM',  conf: 0.96 },
];
const SEED_YEST = [
  { type: 'after_hours_activity', time: '11:58 PM', conf: 0.73 },
  { type: 'multiple_loitering',   time: '10:47 PM', conf: 0.79 },
  { type: 'weapon_detected',      time: '9:12 PM',  conf: 0.62 },
  { type: 'package_not_arrived',  time: '7:30 PM',  conf: 0.99 },
  { type: 'package_arrived',      time: '3:05 PM',  conf: 0.95 },
  { type: 'animal_detected',      time: '6:42 AM',  conf: 0.91 },
];

// ───────── Shared bits ─────────
function SeverityBadge({ severity }) {
  const c = sevColor(severity);
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 8px', borderRadius: 999,
      background: c + '22', border: `0.5px solid ${c}59`,
    }}>
      <div style={{ width: 5, height: 5, borderRadius: 999, background: c }} />
      <span style={{
        fontFamily: '-apple-system, system-ui', fontSize: 10, fontWeight: 600,
        letterSpacing: 0.6, color: c,
      }}>{sevLabel(severity)}</span>
    </div>
  );
}

function Card({ children, style }) {
  return (
    <div style={{
      background: peep.surface, borderRadius: 14, padding: 14, ...style,
    }}>{children}</div>
  );
}

function ScreenChrome({ title, children, hideTitle = false }) {
  // Status bar + large nav title + scrollable body
  return (
    <div style={{
      width: '100%', height: '100%', background: peep.bg, color: peep.text,
      fontFamily: '-apple-system, "SF Pro", system-ui',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* status bar spacer */}
      <div style={{ height: 54, flexShrink: 0 }} />
      {!hideTitle && (
        <div style={{
          padding: '8px 20px 8px', flexShrink: 0,
          fontSize: 34, fontWeight: 700, letterSpacing: 0.4,
        }}>{title}</div>
      )}
      <div style={{ flex: 1, overflow: 'hidden', paddingBottom: 84 }}>
        {children}
      </div>
    </div>
  );
}

function TabBar({ active }) {
  const items = [
    { key: 'live',     label: 'Live',     glyph: '⌂' },
    { key: 'activity', label: 'Activity', glyph: '◔' },
    { key: 'inbox',    label: 'Inbox',    glyph: '▤' },
    { key: 'settings', label: 'Settings', glyph: '⚙' },
  ];
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 30,
      paddingTop: 8, paddingBottom: 28,
      background: 'rgba(20,20,22,0.86)',
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      borderTop: `0.5px solid ${peep.sep}`,
      display: 'flex', justifyContent: 'space-around',
    }}>
      {items.map(it => {
        const on = it.key === active;
        return (
          <div key={it.key} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            color: on ? peep.accent : peep.textTer,
          }}>
            <TabGlyph kind={it.key} on={on} />
            <span style={{ fontSize: 10, fontWeight: 500 }}>{it.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function TabGlyph({ kind, on }) {
  // Simple SF-Symbol-ish glyphs
  const c = on ? peep.accent : peep.textTer;
  const w = 24, h = 24;
  if (kind === 'live') return (
    <svg width={w} height={h} viewBox="0 0 24 24"><path fill={c} d="M12 3L3 11h2v9h5v-6h4v6h5v-9h2L12 3z"/></svg>
  );
  if (kind === 'activity') return (
    <svg width={w} height={h} viewBox="0 0 24 24"><path fill={c} d="M12 3a6 6 0 016 6v3l2 3v1H4v-1l2-3V9a6 6 0 016-6zm-2 17h4a2 2 0 11-4 0z"/></svg>
  );
  if (kind === 'inbox') return (
    <svg width={w} height={h} viewBox="0 0 24 24"><path fill={c} d="M4 4h16v10h-4l-2 2h-4l-2-2H4V4zm0 12h4l2 2h4l2-2h4v4H4v-4z"/></svg>
  );
  return (
    <svg width={w} height={h} viewBox="0 0 24 24"><path fill={c} d="M19.5 12a7.5 7.5 0 00-.12-1.34l2.04-1.59-2-3.46-2.4.96a7.5 7.5 0 00-2.32-1.34L14.4 3h-4l-.3 2.23a7.5 7.5 0 00-2.32 1.34l-2.4-.96-2 3.46 2.04 1.59A7.5 7.5 0 004.5 12c0 .46.04.9.12 1.34l-2.04 1.59 2 3.46 2.4-.96a7.5 7.5 0 002.32 1.34L9.6 21h4l.3-2.23a7.5 7.5 0 002.32-1.34l2.4.96 2-3.46-2.04-1.59c.08-.44.12-.88.12-1.34zM12 15.5a3.5 3.5 0 110-7 3.5 3.5 0 010 7z"/></svg>
  );
}

// ───────── EventRow ─────────
function EventRow({ ev }) {
  const m = eventMeta[ev.type];
  const c = sevColor(m.severity);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 14px', background: peep.surface, borderRadius: 14,
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: c + '24', border: `0.5px solid ${c}40`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 22, flexShrink: 0,
      }}>{m.emoji}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 500, color: peep.text }}>{m.label}</div>
        <div style={{ display: 'flex', gap: 6, marginTop: 2, fontSize: 11, color: peep.textSec }}>
          <span>{ev.time}</span>
          <span>·</span>
          <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
            conf {ev.conf.toFixed(2)}
          </span>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
        <SeverityBadge severity={m.severity} />
        <span style={{ color: peep.textTer, fontSize: 10 }}>›</span>
      </div>
    </div>
  );
}

// ───────── LIVE ─────────
function LiveScreen() {
  const active = { type: 'package_taken', time: '2:32 PM', conf: 0.94 };
  const m = eventMeta[active.type];
  return (
    <ScreenChrome title="Live">
      <div style={{
        height: '100%', overflowY: 'auto',
        display: 'flex', flexDirection: 'column', gap: 18, padding: '0 20px 24px',
      }}>
        {/* camera feed */}
        <div style={{
          aspectRatio: '16 / 9', background: '#000', borderRadius: 16,
          position: 'relative', overflow: 'hidden',
          backgroundImage: 'radial-gradient(circle at 30% 40%, rgba(255,255,255,0.04), transparent 60%), radial-gradient(circle at 70% 80%, rgba(255,255,255,0.025), transparent 60%)',
        }}>
          <div style={{
            position: 'absolute', top: 12, left: 12,
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '5px 10px', borderRadius: 999,
            background: 'rgba(255,255,255,0.10)',
            backdropFilter: 'blur(12px) saturate(180%)',
            WebkitBackdropFilter: 'blur(12px) saturate(180%)',
            border: '0.5px solid rgba(255,255,255,0.15)',
          }}>
            <div style={{ width: 7, height: 7, borderRadius: 999, background: peep.accent }} />
            <span style={{
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              fontSize: 11, fontWeight: 600, color: '#fff',
            }}>LIVE</span>
          </div>
        </div>

        {/* status strip */}
        <div style={{
          background: peep.surface, borderRadius: 14, padding: '12px 16px',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{
            width: 6, height: 6, borderRadius: 999, background: peep.accent,
            boxShadow: `0 0 0 4px ${peep.accent}40`,
          }} />
          <span style={{ fontSize: 14 }}>Watching · 2 deliveries expected today</span>
        </div>

        {/* quick actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          {[
            { icon: 'waveform', title: 'Talk' },
            { icon: 'camera',   title: 'Snapshot' },
            { icon: 'bell',     title: 'Mute alerts 1h' },
          ].map((a, i) => (
            <div key={i} style={{
              flex: 1, background: peep.surface, borderRadius: 16, padding: 14,
              display: 'flex', flexDirection: 'column', gap: 12,
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 999,
                background: peep.accent + '26',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <QuickIcon kind={a.icon} />
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.25 }}>{a.title}</div>
            </div>
          ))}
        </div>

        {/* active right now */}
        <div style={{
          background: peep.surface, borderRadius: 18, padding: 16,
          border: `1.5px solid ${sevColor(m.severity)}99`,
          display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.5, color: peep.textSec, textTransform: 'uppercase' }}>
              Active right now
            </span>
            <SeverityBadge severity={m.severity} />
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 28 }}>{m.emoji}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 17, fontWeight: 600 }}>{m.label}</div>
              <div style={{ fontSize: 13, color: peep.textSec, marginTop: 3 }}>
                Refund filed. Tap to review →
              </div>
            </div>
          </div>
          <div style={{
            background: peep.accent, borderRadius: 12,
            padding: '11px 16px', color: '#000',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            fontWeight: 600, fontSize: 15,
          }}>
            <span>View</span><span>→</span>
          </div>
        </div>
      </div>
      <TabBar active="live" />
    </ScreenChrome>
  );
}

function QuickIcon({ kind }) {
  const c = peep.accent, s = 16;
  if (kind === 'waveform') return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.2" strokeLinecap="round">
      <path d="M3 12h2M7 7v10M11 4v16M15 8v8M19 11v2"/>
    </svg>
  );
  if (kind === 'camera') return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill={c}>
      <path d="M9 4l-2 2H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V8a2 2 0 00-2-2h-3l-2-2H9zm3 5a5 5 0 110 10 5 5 0 010-10z"/>
    </svg>
  );
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round">
      <path d="M6 8a6 6 0 0112 0c0 7 3 7 3 9H3c0-2 3-2 3-9zM10 21a2 2 0 004 0M3 3l18 18"/>
    </svg>
  );
}

// ───────── ACTIVITY ─────────
function ActivityScreen() {
  return (
    <ScreenChrome title="Activity">
      <div style={{
        height: '100%', overflowY: 'auto',
        padding: '0 20px 24px', display: 'flex', flexDirection: 'column', gap: 20,
      }}>
        <ActivitySection title="Today" events={SEED} />
        <ActivitySection title="Yesterday" events={SEED_YEST} />
      </div>
      <TabBar active="activity" />
    </ScreenChrome>
  );
}

function ActivitySection({ title, events }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
        <span style={{ fontSize: 16, fontWeight: 600 }}>{title}</span>
        <span style={{
          fontSize: 11, color: peep.textSec,
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        }}>{events.length}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {events.map((e, i) => <EventRow key={i} ev={e} />)}
      </div>
    </div>
  );
}

// ───────── EVENT DETAIL ─────────
function EventDetailScreen() {
  const ev = { type: 'package_taken', time: 'Today, 2:32 PM', conf: 0.94, receipt: 'RFND-XQ7K9-PJZ4' };
  const m = eventMeta[ev.type];
  return (
    <ScreenChrome hideTitle>
      <div style={{
        height: '100%', overflowY: 'auto',
        display: 'flex', flexDirection: 'column', gap: 18, paddingBottom: 24,
      }}>
        {/* clip */}
        <div style={{
          aspectRatio: '16 / 9', background: '#000', position: 'relative', overflow: 'hidden',
          backgroundImage: 'radial-gradient(circle at 30% 60%, rgba(255,255,255,0.03), transparent 60%)',
        }}>
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: 999,
              background: 'rgba(255,255,255,0.18)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{
                width: 0, height: 0, borderTop: '12px solid transparent',
                borderBottom: '12px solid transparent', borderLeft: '18px solid #fff',
                marginLeft: 5,
              }} />
            </div>
          </div>
          <div style={{
            position: 'absolute', bottom: 10, right: 10,
            background: 'rgba(0,0,0,0.4)', padding: '4px 8px', borderRadius: 999,
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            fontSize: 10, color: 'rgba(255,255,255,0.7)',
          }}>peep://clips/sample.mp4</div>
        </div>

        {/* title block */}
        <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 32, fontWeight: 600, lineHeight: 1.15 }}>{m.label}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <SeverityBadge severity={m.severity} />
            <span style={{ fontSize: 13, color: peep.textSec }}>{ev.time}</span>
          </div>
          <div style={{ marginTop: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: peep.textSec }}>Confidence</span>
              <span style={{
                fontSize: 11, color: peep.textSec,
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              }}>{ev.conf.toFixed(2)}</span>
            </div>
            <div style={{ height: 3, background: peep.surface, borderRadius: 999, overflow: 'hidden' }}>
              <div style={{ width: `${ev.conf * 100}%`, height: '100%', background: peep.accent }} />
            </div>
          </div>
        </div>

        {/* what peep did */}
        <div style={{ padding: '0 20px' }}>
          <Card style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 16, fontWeight: 600 }}>What Peep did</div>
            <TimelineStep title="Vision agent" sub={`detected package_taken (conf ${ev.conf.toFixed(2)})`} />
            <TimelineStep title="Orchestration" sub="decided to file refund" />
            <TimelineStep title="Browser agent" sub={`receipt ${ev.receipt}`} last />
          </Card>
        </div>

        {/* actions */}
        <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <ActionRow icon="✓" title="Mark resolved" />
          <ActionRow icon="!" title="Report wrong" />
          <ActionRow icon="↑" title="Share clip" />
          <ActionRow icon="☎" title="Call police" destructive />
        </div>
      </div>
    </ScreenChrome>
  );
}

function TimelineStep({ title, sub, last }) {
  return (
    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        width: 14, alignSelf: 'stretch',
      }}>
        <div style={{
          width: 10, height: 10, borderRadius: 999,
          background: peep.accent,
          boxShadow: `0 0 0 4px ${peep.accent}40`,
          marginTop: 4, flexShrink: 0,
        }} />
        {!last && <div style={{
          flex: 1, width: 1.5, background: 'rgba(235,235,245,0.25)', marginTop: 4, marginBottom: -4,
        }} />}
      </div>
      <div style={{ flex: 1, paddingBottom: last ? 0 : 4 }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{title}</div>
        <div style={{
          fontSize: 12, color: peep.textSec, marginTop: 2,
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        }}>{sub}</div>
      </div>
    </div>
  );
}

function ActionRow({ icon, title, destructive }) {
  const c = destructive ? peep.critical : peep.text;
  const bg = destructive ? peep.critical + '26' : peep.surface;
  return (
    <div style={{
      background: bg, borderRadius: 14, padding: '13px 16px',
      display: 'flex', alignItems: 'center', gap: 12, color: c,
    }}>
      <span style={{ fontSize: 15, fontWeight: 600, width: 18, textAlign: 'center' }}>{icon}</span>
      <span style={{ fontSize: 15, fontWeight: 600 }}>{title}</span>
    </div>
  );
}

// ───────── INBOX ─────────
function InboxScreen() {
  const deliveries = [
    { order: '114-8829112-0034221', item: 'Anker PowerCore 20K Portable Charger', received: false },
    { order: '112-4490023-1188776', item: 'Logitech MX Master 3S',                received: false },
  ];
  return (
    <ScreenChrome title="Inbox">
      <div style={{
        height: '100%', overflowY: 'auto',
        padding: '0 20px 24px', display: 'flex', flexDirection: 'column', gap: 12,
      }}>
        {deliveries.map((d, i) => <DeliveryCard key={i} d={d} />)}
      </div>
      <TabBar active="inbox" />
    </ScreenChrome>
  );
}

function DeliveryCard({ d }) {
  const c = d.received ? peep.accent : peep.warning;
  return (
    <Card style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{
        fontSize: 11, color: peep.textSec,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
      }}>{d.order}</div>
      <div style={{ fontSize: 15, fontWeight: 500 }}>{d.item}</div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '7px 12px', borderRadius: 999,
          background: c + '26', border: `0.5px solid ${c}66`, color: c,
          fontSize: 12, fontWeight: 600,
        }}>
          <div style={{ width: 5, height: 5, borderRadius: 999, background: c }} />
          {d.received ? 'Received' : 'Pending'}
        </div>
      </div>
    </Card>
  );
}

// ───────── SETTINGS ─────────
function SettingsScreen() {
  return (
    <ScreenChrome title="Settings">
      <div style={{
        height: '100%', overflowY: 'auto',
        paddingBottom: 24, display: 'flex', flexDirection: 'column', gap: 24,
      }}>
        <SettingsSection title="Notifications">
          <SRow label="Push alerts" trailing={<Toggle on />} />
          <SRow label="Critical only" trailing={<Toggle />} />
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
              }}>6.0s</span>
            </div>
            <Slider value={0.36} />
          </div>
          <Sep />
          <SRow label="Fire once per session" trailing={<Toggle on />} />
          <SRow label="Require movement" trailing={<Toggle on />} last />
        </SettingsSection>

        <SettingsSection title="Animals">
          <SRow label={<><span style={{ marginRight: 8 }}>🐕</span>Dog</>}  trailing={<Toggle on />} />
          <SRow label={<><span style={{ marginRight: 8 }}>🐈</span>Cat</>}  trailing={<Toggle on />} />
          <SRow label={<><span style={{ marginRight: 8 }}>🐦</span>Bird</>} trailing={<Toggle />} />
          <SRow label={<><span style={{ marginRight: 8 }}>🐻</span>Bear</>} trailing={<Toggle on />} last />
        </SettingsSection>

        <SettingsSection title="Auto-actions">
          <SRow label="Auto-file refund on theft" trailing={<Toggle on />} />
          <SRow label="Auto-file claim on missing delivery" trailing={<Toggle on />} />
          <SRow label="Notify when expected package doesn't arrive" trailing={<Toggle on />} last />
        </SettingsSection>

        <SettingsSection title="Integrations">
          <IntegrationRow label="Amazon" status="Connected"    statusColor={peep.accent} />
          <IntegrationRow label="Gmail"  status="Connect"      statusColor="#0a84ff" />
          <IntegrationRow label="Police" status="Coming soon"  statusColor={peep.textSec} last />
        </SettingsSection>
      </div>
      <TabBar active="settings" />
    </ScreenChrome>
  );
}

function SettingsSection({ title, children }) {
  return (
    <div>
      <div style={{
        padding: '0 36px 6px', fontSize: 13,
        color: peep.textSec, textTransform: 'uppercase', letterSpacing: -0.08,
      }}>{title}</div>
      <div style={{
        margin: '0 16px', background: peep.surface, borderRadius: 12,
        overflow: 'hidden',
      }}>{children}</div>
    </div>
  );
}

function SRow({ label, trailing, last }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', minHeight: 44,
      padding: '8px 16px', borderBottom: last ? 'none' : `0.5px solid ${peep.sep}`,
    }}>
      <div style={{ flex: 1, fontSize: 15, display: 'flex', alignItems: 'center' }}>{label}</div>
      {trailing}
    </div>
  );
}

function Sep() {
  return <div style={{ height: 0.5, background: peep.sep, marginLeft: 16 }} />;
}

function Toggle({ on }) {
  return (
    <div style={{
      width: 51, height: 31, borderRadius: 999,
      background: on ? peep.accent : 'rgba(120,120,128,0.32)',
      position: 'relative', transition: 'background .15s',
    }}>
      <div style={{
        position: 'absolute', top: 2, left: on ? 22 : 2,
        width: 27, height: 27, borderRadius: 999, background: '#fff',
        boxShadow: '0 3px 8px rgba(0,0,0,0.2)',
      }} />
    </div>
  );
}

function TimePill({ text }) {
  return (
    <div style={{
      background: peep.surface2, borderRadius: 7,
      padding: '4px 10px', fontSize: 14, color: peep.text,
    }}>{text}</div>
  );
}

function Slider({ value }) {
  return (
    <div style={{ height: 24, display: 'flex', alignItems: 'center', position: 'relative' }}>
      <div style={{ position: 'absolute', left: 0, right: 0, height: 3, background: 'rgba(120,120,128,0.3)', borderRadius: 999 }} />
      <div style={{ position: 'absolute', left: 0, width: `${value * 100}%`, height: 3, background: peep.accent, borderRadius: 999 }} />
      <div style={{
        position: 'absolute', left: `calc(${value * 100}% - 14px)`,
        width: 28, height: 28, borderRadius: 999, background: '#fff',
        boxShadow: '0 3px 8px rgba(0,0,0,0.25)',
      }} />
    </div>
  );
}

function IntegrationRow({ label, status, statusColor, last }) {
  return (
    <div style={{
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
    </div>
  );
}

// ───────── App ─────────
const FRAME_W = 360;
const FRAME_H = 780;

function Phone({ children }) {
  return (
    <IOSDevice width={FRAME_W} height={FRAME_H} dark>
      {children}
    </IOSDevice>
  );
}

function App() {
  return (
    <DesignCanvas>
      <DCSection
        id="peep"
        title="Peep — iOS companion"
        subtitle="Dark mode · emerald accent · SF Pro · iOS 17+"
      >
        <DCArtboard id="live" label="1 · Live" width={FRAME_W} height={FRAME_H}>
          <Phone><LiveScreen /></Phone>
        </DCArtboard>
        <DCArtboard id="activity" label="2 · Activity" width={FRAME_W} height={FRAME_H}>
          <Phone><ActivityScreen /></Phone>
        </DCArtboard>
        <DCArtboard id="detail" label="3 · Event detail" width={FRAME_W} height={FRAME_H}>
          <Phone><EventDetailScreen /></Phone>
        </DCArtboard>
        <DCArtboard id="inbox" label="4 · Inbox" width={FRAME_W} height={FRAME_H}>
          <Phone><InboxScreen /></Phone>
        </DCArtboard>
        <DCArtboard id="settings" label="5 · Settings" width={FRAME_W} height={FRAME_H}>
          <Phone><SettingsScreen /></Phone>
        </DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
