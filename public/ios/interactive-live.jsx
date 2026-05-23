/* Peep — Live screen with multi-camera, hold-to-talk, snapshot strip, rewind */

// ───────── Camera roster ─────────
const CAMERAS = [
  { id: 'front',  label: 'Front door', address: '142 Linden St', tint: '#0a1020', accent: '#ffd089', up: '12h 04m' },
  { id: 'back',   label: 'Back yard',  address: 'Garden gate',    tint: '#0a181c', accent: '#a8e0c4', up: '12h 04m' },
  { id: 'garage', label: 'Garage',     address: 'East driveway',  tint: '#1a1a18', accent: '#fff0a0', up: '03h 41m' },
  { id: 'side',   label: 'Side gate',  address: 'West alley',     tint: '#0a0d18', accent: '#9aa8c4', up: '12h 04m' },
];

const cameraById = (id) => CAMERAS.find(c => c.id === id) || CAMERAS[0];

// ───────── Porch / yard / garage / alley scene ─────────
function PorchScene({ camera = 'front', packageVisible = true, eventActive = false }) {
  const cam = cameraById(camera);

  if (camera === 'garage') return <GarageScene packageVisible={packageVisible} />;
  if (camera === 'back')   return <BackyardScene eventActive={eventActive} />;
  if (camera === 'side')   return <AlleyScene eventActive={eventActive} />;

  // Front-door (default) — original porch
  return (
    <div style={{
      position: 'absolute', inset: 0, overflow: 'hidden',
      background: 'linear-gradient(180deg, #0a1020 0%, #0e1830 30%, #0b0d18 60%, #050608 100%)',
    }}>
      {[[12,8],[26,15],[40,6],[58,18],[72,9],[84,14],[92,5]].map(([l, t], i) => (
        <div key={i} style={{
          position: 'absolute', left: `${l}%`, top: `${t}%`,
          width: 2, height: 2, borderRadius: 999, background: '#fff', opacity: 0.5,
          animation: `peepTwinkle ${2 + (i % 3)}s ease-in-out ${i * 0.3}s infinite`,
        }} />
      ))}
      <div style={{
        position: 'absolute', top: -20, right: -40, width: 180, height: 240,
        background: 'radial-gradient(ellipse 50% 60% at 100% 0%, rgba(255,200,120,0.18), transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', top: 6, right: 12, width: 8, height: 8, borderRadius: 999,
        background: '#ffd089', boxShadow: '0 0 16px 4px rgba(255,200,120,0.5)',
      }} />
      <div style={{
        position: 'absolute', top: 6, right: 12, width: 0, height: 0,
        animation: 'peepMoth 6s linear infinite',
      }}>
        <div style={{ position: 'absolute', width: 3, height: 3, background: '#d4cfa0', borderRadius: 1, opacity: 0.7 }} />
      </div>
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, height: '38%',
        background: 'linear-gradient(180deg, transparent, rgba(10,8,6,0.6) 40%, #050405)',
      }} />
      <div style={{
        position: 'absolute', left: '20%', right: '20%', bottom: '6%', height: 10,
        background: 'linear-gradient(180deg, #4a3520, #2a1f12)',
        borderRadius: '2px 2px 0 0', boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
      }} />
      <div style={{
        position: 'absolute', left: '24%', right: '24%', bottom: '16%', height: '58%',
        background: 'linear-gradient(180deg, #2a1810, #1a0e08)', borderRadius: '6px 6px 0 0',
        boxShadow: 'inset 0 0 0 2px rgba(255,180,100,0.08), 0 4px 16px rgba(0,0,0,0.6)',
      }}>
        <div style={{ position: 'absolute', left: 8, right: 8, top: 8, bottom: '50%',
          border: '1.5px solid rgba(255,180,100,0.1)', borderRadius: 3 }} />
        <div style={{ position: 'absolute', left: 8, right: 8, top: '52%', bottom: 8,
          border: '1.5px solid rgba(255,180,100,0.1)', borderRadius: 3 }} />
        <div style={{
          position: 'absolute', right: 10, top: '50%', width: 5, height: 5,
          borderRadius: 999, background: '#ddb780', boxShadow: '0 0 4px rgba(255,200,120,0.4)',
        }} />
      </div>
      {packageVisible && (
        <div style={{
          position: 'absolute', left: '40%', bottom: '9%', width: '20%', aspectRatio: '1.2 / 1',
          background: 'linear-gradient(140deg, #b89968 0%, #8a6e44 100%)', borderRadius: 2,
          boxShadow: '2px 2px 8px rgba(0,0,0,0.6), inset 0 1px rgba(255,255,255,0.1)',
          animation: eventActive ? 'peepShake 0.4s ease-in-out 3' : 'none',
        }}>
          <div style={{ position: 'absolute', left: 0, right: 0, top: '40%', height: '20%', background: 'rgba(255,255,255,0.15)' }} />
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: '40%', width: '20%', background: 'rgba(255,255,255,0.15)' }} />
        </div>
      )}
      {[10,28,45,62,80].map((l, i) => (
        <div key={i} style={{
          position: 'absolute', left: `${l}%`, top: '-10%', width: 1, height: 14,
          background: 'linear-gradient(180deg, transparent, rgba(150,180,220,0.3))',
          animation: `peepRain ${1.5 + (i % 3) * 0.3}s linear ${i * 0.4}s infinite`,
        }} />
      ))}
      <div style={{ position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 80% 80% at 50% 50%, transparent 40%, rgba(0,0,0,0.5))',
        pointerEvents: 'none' }} />
    </div>
  );
}

function BackyardScene() {
  return (
    <div style={{
      position: 'absolute', inset: 0, overflow: 'hidden',
      background: 'linear-gradient(180deg, #0a181c 0%, #0a1418 50%, #050a0c 100%)',
    }}>
      {/* moon */}
      <div style={{
        position: 'absolute', top: 18, left: '20%', width: 24, height: 24, borderRadius: 999,
        background: 'radial-gradient(circle at 30% 30%, #e8e0c8, #a8a090)',
        boxShadow: '0 0 28px rgba(232,224,200,0.3)',
      }} />
      {/* tree silhouettes */}
      <svg style={{ position: 'absolute', left: 0, bottom: 0, width: '100%', height: '70%' }} viewBox="0 0 100 70" preserveAspectRatio="none">
        <path d="M0,70 L0,40 Q5,20 12,38 Q18,15 24,32 Q30,10 38,28 L38,70 Z" fill="#040806" />
        <path d="M62,70 L62,32 Q70,12 78,30 Q86,18 94,34 Q100,22 100,38 L100,70 Z" fill="#040806" />
      </svg>
      {/* lawn */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '30%',
        background: 'linear-gradient(180deg, transparent, #060a08)' }} />
      {/* gate */}
      <div style={{
        position: 'absolute', left: '38%', right: '38%', bottom: '14%', height: '34%',
        background: 'repeating-linear-gradient(90deg, #1a1a18 0 4px, #0a0a08 4px 7px)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
      }} />
      <div style={{ position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 80% 80% at 50% 50%, transparent 40%, rgba(0,0,0,0.4))',
        pointerEvents: 'none' }} />
    </div>
  );
}

function GarageScene({ packageVisible }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, overflow: 'hidden',
      background: 'linear-gradient(180deg, #1a1a18 0%, #0e0e0c 100%)',
    }}>
      {/* fluorescent strip */}
      <div style={{
        position: 'absolute', top: 6, left: '20%', right: '20%', height: 4,
        background: '#fff0a0', boxShadow: '0 4px 24px rgba(255,240,160,0.5)',
      }} />
      {/* shelving outline */}
      <div style={{
        position: 'absolute', top: 30, left: 12, bottom: '30%', width: 50,
        border: '1.5px solid rgba(255,255,255,0.08)', borderRadius: 2,
      }}>
        {[20,40,60,80].map(t => (
          <div key={t} style={{ position: 'absolute', left: 0, right: 0, top: `${t}%`, height: 1, background: 'rgba(255,255,255,0.08)' }} />
        ))}
      </div>
      {/* car silhouette */}
      <div style={{
        position: 'absolute', bottom: '12%', right: 20, width: '52%', height: '28%',
        background: '#1a1a18', borderRadius: '20% 8% 4% 4% / 30% 30% 4% 4%',
        boxShadow: '0 4px 16px rgba(0,0,0,0.6)',
      }} />
      {/* package on floor */}
      {packageVisible && (
        <div style={{
          position: 'absolute', left: '20%', bottom: '6%', width: '14%', aspectRatio: '1.2 / 1',
          background: 'linear-gradient(140deg, #b89968 0%, #8a6e44 100%)', borderRadius: 2,
          boxShadow: '2px 2px 6px rgba(0,0,0,0.6)',
        }} />
      )}
    </div>
  );
}

function AlleyScene() {
  return (
    <div style={{
      position: 'absolute', inset: 0, overflow: 'hidden',
      background: 'linear-gradient(180deg, #0a0d18 0%, #050608 100%)',
    }}>
      {/* fence lines on either side */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: '32%',
        background: 'repeating-linear-gradient(0deg, transparent 0 8px, rgba(255,255,255,0.04) 8px 9px)',
      }} />
      <div style={{
        position: 'absolute', right: 0, top: 0, bottom: 0, width: '32%',
        background: 'repeating-linear-gradient(0deg, transparent 0 8px, rgba(255,255,255,0.04) 8px 9px)',
      }} />
      {/* light at end */}
      <div style={{
        position: 'absolute', top: '40%', left: '50%', transform: 'translateX(-50%)',
        width: 80, height: 80, borderRadius: 999,
        background: 'radial-gradient(circle, rgba(154,168,196,0.18), transparent 70%)',
      }} />
      {/* trash bins */}
      <div style={{
        position: 'absolute', left: '34%', bottom: '12%', width: '8%', aspectRatio: '1 / 1.2',
        background: '#0a0d10', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '4px 4px 1px 1px',
      }} />
      <div style={{
        position: 'absolute', right: '34%', bottom: '12%', width: '8%', aspectRatio: '1 / 1.2',
        background: '#0a0d10', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '4px 4px 1px 1px',
      }} />
    </div>
  );
}

// ───────── Camera switcher ─────────
function CameraSwitcher({ value, onChange }) {
  return (
    <HScrollChips>
      {CAMERAS.map(c => {
        const on = c.id === value;
        return (
          <Press key={c.id} onTap={() => onChange(c.id)} style={{
            padding: '7px 14px', borderRadius: 999,
            background: on ? peep.surface2 : 'transparent',
            color: on ? peep.text : peep.textSec,
            fontSize: 13, fontWeight: on ? 600 : 500,
            border: on ? `0.5px solid ${peep.sep}` : '0.5px solid transparent',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: 999,
              background: on ? peep.accent : peep.textTer,
              boxShadow: on ? `0 0 0 3px ${peep.accent}33` : 'none',
            }} />
            <span>{c.label}</span>
          </Press>
        );
      })}
    </HScrollChips>
  );
}

// ───────── Hold-to-talk waveform overlay ─────────
function TalkOverlay({ heldMs }) {
  // Render 32 bars whose heights oscillate based on time.
  const bars = 32;
  const seconds = (heldMs / 1000).toFixed(1);
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 88, zIndex: 90,
      padding: '16px 20px',
      animation: 'peepToastIn .2s cubic-bezier(.2,.7,.3,1) both',
      pointerEvents: 'none',
    }}>
      <div style={{
        background: 'rgba(28,28,30,0.94)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderRadius: 20, padding: '14px 16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 0.5px rgba(255,255,255,0.08) inset',
        border: `1px solid ${peep.critical}66`,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 8, height: 8, borderRadius: 999, background: peep.critical,
              animation: 'peepPulse 0.7s ease-in-out infinite',
            }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: peep.critical }}>
              SPEAKING
            </span>
          </div>
          <span style={{
            fontSize: 13, color: peep.text,
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          }}>{seconds}s</span>
        </div>
        {/* Waveform */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 3, height: 36,
        }}>
          {Array.from({ length: bars }).map((_, i) => {
            // pseudo-random height driven by held time + position
            const phase = (heldMs / 80 + i * 0.7);
            const h = 8 + Math.abs(Math.sin(phase) * 14 + Math.cos(phase * 1.7 + i) * 10);
            return (
              <div key={i} style={{
                width: 3, height: Math.min(34, h),
                borderRadius: 999,
                background: `linear-gradient(180deg, ${peep.accent} 0%, ${peep.critical} 100%)`,
                transition: 'height .05s linear',
              }} />
            );
          })}
        </div>
        <div style={{
          textAlign: 'center', marginTop: 8, fontSize: 11, color: peep.textSec,
        }}>Release to send</div>
      </div>
    </div>
  );
}

function HoldToTalkButton({ held, onStart, onEnd }) {
  return (
    <div
      onMouseDown={onStart} onMouseUp={onEnd} onMouseLeave={onEnd}
      onTouchStart={onStart} onTouchEnd={onEnd} onTouchCancel={onEnd}
      style={{
        cursor: 'pointer', userSelect: 'none',
        flex: 1, background: held ? peep.critical + '26' : peep.surface,
        border: held ? `1px solid ${peep.critical}` : '1px solid transparent',
        borderRadius: 16, padding: 14,
        display: 'flex', flexDirection: 'column', gap: 12,
        transition: 'transform .12s, background .15s',
        transform: held ? 'scale(0.97)' : 'scale(1)',
        WebkitTapHighlightColor: 'transparent',
      }}>
      <div style={{
        width: 32, height: 32, borderRadius: 999,
        background: held ? peep.critical : peep.accent + '26',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: held ? '#fff' : peep.accent,
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke={held ? '#fff' : peep.accent} strokeWidth="2.2" strokeLinecap="round">
          <path d="M3 12h2M7 7v10M11 4v16M15 8v8M19 11v2"/>
        </svg>
      </div>
      <div style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.25 }}>
        {held ? 'Speaking…' : 'Hold to talk'}
      </div>
    </div>
  );
}

// ───────── Snapshot strip ─────────
function SnapshotStrip({ snapshots, onOpen, onClear }) {
  if (snapshots.length === 0) return null;
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 6,
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, color: peep.textSec, textTransform: 'uppercase',
          letterSpacing: 0.5, fontWeight: 600 }}>
          Snapshots · {snapshots.length}
        </span>
        <Press onTap={onClear} style={{ fontSize: 11, color: peep.textTer, fontWeight: 500 }}>
          Clear
        </Press>
      </div>
      <div style={{
        display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2,
        scrollbarWidth: 'none',
      }}>
        {snapshots.slice().reverse().map(snap => (
          <Press key={snap.id} onTap={() => onOpen(snap)} style={{
            flexShrink: 0, width: 72, aspectRatio: '4 / 3',
            background: '#000', borderRadius: 8, overflow: 'hidden',
            position: 'relative', border: `0.5px solid ${peep.sep}`,
          }}>
            <PorchScene camera={snap.camera} packageVisible={snap.packageVisible} />
            <div style={{
              position: 'absolute', bottom: 2, right: 4, zIndex: 5,
              fontSize: 8, color: '#fff',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              textShadow: '0 1px 2px rgba(0,0,0,0.8)',
            }}>{snap.time}</div>
          </Press>
        ))}
      </div>
    </div>
  );
}

function SnapshotPreview({ snapshot, onClose }) {
  if (!snapshot) return null;
  return (
    <Sheet open={!!snapshot} onClose={onClose} title={`Snapshot · ${snapshot.time}`} height="80%">
      <div style={{ padding: '0 20px 8px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{
          aspectRatio: '16 / 9', background: '#000', borderRadius: 14, overflow: 'hidden',
          position: 'relative',
        }}>
          <PorchScene camera={snapshot.camera} packageVisible={snapshot.packageVisible} />
        </div>
        <div style={{ fontSize: 13, color: peep.textSec }}>
          {cameraById(snapshot.camera).label} · {snapshot.time} · {snapshot.size}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Press style={{
            flex: 1, padding: '12px', borderRadius: 12, background: peep.surface2,
            color: peep.text, fontSize: 14, fontWeight: 600, textAlign: 'center',
          }}>Save to Photos</Press>
          <Press style={{
            flex: 1, padding: '12px', borderRadius: 12, background: peep.accent,
            color: '#000', fontSize: 14, fontWeight: 600, textAlign: 'center',
          }}>Share</Press>
        </div>
      </div>
    </Sheet>
  );
}

// ───────── Rewind scrubber ─────────
function RewindScrubber({ offset, onChange, onLive }) {
  // offset goes from -30 (30s ago) to 0 (live)
  return (
    <div style={{
      background: peep.surface, borderRadius: 12, padding: '10px 12px',
      display: 'flex', flexDirection: 'column', gap: 8,
      animation: 'peepToastIn .2s ease both',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, color: peep.textSec, textTransform: 'uppercase',
          letterSpacing: 0.5, fontWeight: 600 }}>
          Rewind · {offset === 0 ? 'live' : `−${Math.abs(offset).toFixed(0)}s`}
        </span>
        <Press onTap={onLive} style={{
          fontSize: 11, color: peep.accent, fontWeight: 600,
        }}>Jump to live →</Press>
      </div>
      <RewindTrack value={(offset + 30) / 30} onChange={v => onChange(Math.round(v * 30) - 30)} />
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        fontSize: 9, color: peep.textTer,
      }}>
        <span>−30s</span><span>−20s</span><span>−10s</span><span>NOW</span>
      </div>
    </div>
  );
}

function RewindTrack({ value, onChange }) {
  const ref = React.useRef(null);
  const [dragging, setDragging] = React.useState(false);
  const update = (x) => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    onChange(Math.max(0, Math.min(1, (x - r.left) / r.width)));
  };
  React.useEffect(() => {
    if (!dragging) return;
    const move = e => update(e.clientX ?? (e.touches && e.touches[0].clientX));
    const up = () => setDragging(false);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    window.addEventListener('touchmove', move);
    window.addEventListener('touchend', up);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
      window.removeEventListener('touchmove', move);
      window.removeEventListener('touchend', up);
    };
  }, [dragging]);

  return (
    <div ref={ref}
      onMouseDown={e => { setDragging(true); update(e.clientX); }}
      onTouchStart={e => { setDragging(true); update(e.touches[0].clientX); }}
      style={{
        position: 'relative', height: 22, cursor: 'pointer',
        background: peep.surface2, borderRadius: 4, overflow: 'hidden',
      }}>
      <div style={{ display: 'flex', height: '100%', gap: 1 }}>
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} style={{
            flex: 1, background: `rgba(255,255,255,${0.04 + (i % 3) * 0.02})`,
          }} />
        ))}
      </div>
      {/* event marker at -10s (when test alert is at) */}
      <div style={{
        position: 'absolute', top: 0, bottom: 0, left: `${(20/30) * 100}%`,
        width: 2, background: peep.critical, transform: 'translateX(-1px)',
        boxShadow: `0 0 4px ${peep.critical}`,
      }} />
      <div style={{
        position: 'absolute', top: -2, bottom: -2, left: `calc(${value * 100}% - 1.5px)`,
        width: 3, background: '#fff', borderRadius: 1,
        boxShadow: '0 0 6px rgba(255,255,255,0.5)',
      }} />
    </div>
  );
}

// ───────── Agent ticker (friendly labels + collapsible details) ─────────
function AgentTicker({ event, onComplete, expanded }) {
  const stages = React.useMemo(() => {
    const conf = event.conf.toFixed(2);
    if (event.type === 'package_taken') return [
      { agent: 'vision',  text: `detected package_taken (conf ${conf})` },
      { agent: 'claude',  text: 'cross-checked against Amazon order #114-882…' },
      { agent: 'browser', text: 'opening Amazon Returns…' },
      { agent: 'browser', text: 'filing refund: reason=package_stolen' },
      { agent: 'done',    text: `refund filed · receipt ${event.receipt || 'RFND-XQ7K9-PJZ4'}` },
    ];
    if (event.type === 'package_not_arrived') return [
      { agent: 'vision',  text: `confirmed no delivery in window` },
      { agent: 'claude',  text: 'matched to order 114-2238871…' },
      { agent: 'browser', text: 'opening Amazon Claims…' },
      { agent: 'done',    text: 'claim filed · reason=never_arrived' },
    ];
    if (event.type === 'weapon_detected') return [
      { agent: 'vision',  text: `weapon-like object detected (conf ${conf})` },
      { agent: 'claude',  text: 'low confidence · escalating to human review' },
      { agent: 'done',    text: 'human review queued · no auto-action' },
    ];
    return [
      { agent: 'vision', text: `detected ${event.type} (conf ${conf})` },
      { agent: 'done',   text: 'logged alert · no action taken' },
    ];
  }, [event]);

  const [stage, setStage] = React.useState(0);
  const [typed, setTyped] = React.useState('');

  React.useEffect(() => {
    if (stage >= stages.length) { onComplete && onComplete(stages); return; }
    const target = stages[stage].text;
    setTyped('');
    let i = 0;
    const id = setInterval(() => {
      i++;
      setTyped(target.slice(0, i));
      if (i >= target.length) {
        clearInterval(id);
        setTimeout(() => setStage(s => s + 1), 700);
      }
    }, 18);
    return () => clearInterval(id);
  }, [stage, stages]);

  if (!expanded) return null;

  const agentLabel = { vision: 'Spotted', claude: 'Verified', browser: 'Acted', done: 'Done' };
  const agentColor = { vision: peep.info, claude: peep.accent, browser: '#bf7af0', done: peep.accent };

  return (
    <div style={{
      background: 'rgba(0,0,0,0.4)', borderRadius: 10, padding: 12,
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
      fontSize: 11, lineHeight: 1.5,
      display: 'flex', flexDirection: 'column', gap: 6,
      border: `0.5px solid ${peep.sep}`,
      animation: 'peepFade .2s ease both',
    }}>
      {stages.slice(0, stage).map((s, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, opacity: 0.65 }}>
          <span style={{ color: agentColor[s.agent], minWidth: 64, fontWeight: 600 }}>{agentLabel[s.agent]}</span>
          <span style={{ color: peep.textSec, flex: 1 }}>{s.text}</span>
        </div>
      ))}
      {stage < stages.length && (
        <div style={{ display: 'flex', gap: 8 }}>
          <span style={{ color: agentColor[stages[stage].agent], minWidth: 64, fontWeight: 600 }}>
            {agentLabel[stages[stage].agent]}
          </span>
          <span style={{ color: peep.text, flex: 1 }}>
            {typed}
            <span style={{
              display: 'inline-block', width: 6, height: 11, marginLeft: 1,
              background: peep.accent, verticalAlign: 'middle',
              animation: 'peepCaret 0.8s steps(2) infinite',
            }} />
          </span>
        </div>
      )}
    </div>
  );
}

// ───────── Active event card ─────────
function ActiveEventCard({ event, onView }) {
  const m = eventMeta[event.type];
  const c = sevColor(m.severity);
  const [tickerStages, setTickerStages] = React.useState(null);
  const [showDetails, setShowDetails] = React.useState(false);

  // Friendly progress phrases that shift as the ticker progresses internally.
  // We render the ticker headless (expanded=false) just to drive completion.
  const headline = friendlyHeadline(event, tickerStages);
  const done = tickerStages != null;

  return (
    <div style={{
      background: peep.surface, borderRadius: 18, padding: 16,
      border: `1.5px solid ${c}99`,
      display: 'flex', flexDirection: 'column', gap: 12,
      animation: 'peepEventArrive .5s cubic-bezier(.2,.7,.3,1) both',
      boxShadow: `0 0 24px ${c}33`,
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
          <div style={{ fontSize: 12, color: peep.textSec, marginTop: 3 }}>
            {event.time} · {confidenceLabel(event.conf)}
          </div>
        </div>
      </div>

      {/* Friendly status — always visible */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 12px', borderRadius: 10,
        background: done ? peep.accent + '14' : peep.surface2,
        border: `0.5px solid ${done ? peep.accent + '40' : peep.sep}`,
      }}>
        <ProgressPip done={done} />
        <span style={{ fontSize: 13, color: peep.text, flex: 1, lineHeight: 1.4 }}>
          {headline}
        </span>
      </div>

      {/* Hidden ticker drives completion; visible only when expanded */}
      <AgentTicker event={event} expanded={showDetails}
        onComplete={(s) => setTickerStages(s)} />
      {showDetails && (
        <Press onTap={() => setShowDetails(false)} style={{
          fontSize: 11, color: peep.textSec, alignSelf: 'flex-start',
          padding: '2px 4px',
        }}>Hide details</Press>
      )}
      {!showDetails && (
        <Press onTap={() => setShowDetails(true)} style={{
          fontSize: 11, color: peep.textSec, alignSelf: 'flex-start',
          padding: '2px 4px',
        }}>Show details ›</Press>
      )}

      <Press onTap={onView} style={{
        background: done ? peep.accent : peep.surface3, borderRadius: 12,
        padding: '11px 16px', color: done ? '#000' : peep.text,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontWeight: 600, fontSize: 15,
        transition: 'background .3s, color .3s',
      }}>
        <span>{done ? 'View receipt' : 'View event'}</span><span>→</span>
      </Press>
    </div>
  );
}

function friendlyHeadline(event, stages) {
  const done = stages != null;
  if (event.type === 'package_taken') {
    return done
      ? `Peep spotted a package theft and filed your refund.`
      : `Peep spotted a package theft. Filing your refund…`;
  }
  if (event.type === 'package_not_arrived') {
    return done
      ? `Peep confirmed your delivery never arrived and filed a claim.`
      : `Filing a missing-delivery claim…`;
  }
  if (event.type === 'weapon_detected') {
    return done
      ? `Peep flagged a possible weapon. Awaiting your review.`
      : `Flagging a possible weapon. Awaiting your review…`;
  }
  if (event.type === 'person_loitering' || event.type === 'multiple_loitering') {
    return done
      ? `Peep logged loitering at your door.`
      : `Watching loitering at your door…`;
  }
  return done ? `Peep logged this event.` : `Reviewing…`;
}

function ProgressPip({ done }) {
  if (done) return (
    <div style={{
      width: 18, height: 18, borderRadius: 999, background: peep.accent,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#000', fontSize: 11, fontWeight: 700, flexShrink: 0,
    }}>✓</div>
  );
  return (
    <div style={{
      width: 18, height: 18, borderRadius: 999, flexShrink: 0,
      border: `2px solid ${peep.accent}`,
      borderTopColor: 'transparent',
      animation: 'peepSpin 1s linear infinite',
    }} />
  );
}

// ───────── Live screen ─────────
function LiveScreen({ state, setState, onOpenEvent }) {
  const active = state.activeEvent;
  const cam = cameraById(state.activeCamera);
  const packageOnPorch = !active || active.type !== 'package_taken' || state.rewindOffset < -5;
  const isReplay = state.rewindOffset < 0;

  // Hold-to-talk timer
  const [talkStart, setTalkStart] = React.useState(null);
  const [talkMs, setTalkMs] = React.useState(0);
  const toast = useToast();
  const [showRewind, setShowRewind] = React.useState(false);

  React.useEffect(() => {
    if (talkStart == null) return;
    let raf;
    const tick = () => {
      setTalkMs(Date.now() - talkStart);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [talkStart]);

  const startTalk = () => { setTalkStart(Date.now()); setTalkMs(0); };
  const endTalk = () => {
    if (talkStart == null) return;
    const ms = Date.now() - talkStart;
    setTalkStart(null);
    if (ms > 300) toast(`Voice sent · ${(ms / 1000).toFixed(1)}s`, { icon: '🔊' });
  };

  const takeSnapshot = () => {
    setState(s => ({
      ...s,
      snapshotFlash: true,
      snapshots: [...s.snapshots, {
        id: Math.random().toString(36).slice(2, 8),
        time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' }),
        camera: state.activeCamera,
        packageVisible: packageOnPorch,
        size: `${(Math.random() * 1.5 + 0.8).toFixed(1)} MB`,
      }],
    }));
    setTimeout(() => setState(s => ({ ...s, snapshotFlash: false })), 350);
  };

  return (
    <Screen title="Live">
      {talkStart != null && <TalkOverlay heldMs={talkMs} />}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingBottom: 8 }}>
        <CameraSwitcher value={state.activeCamera}
                        onChange={id => setState(s => ({ ...s, activeCamera: id, rewindOffset: 0 }))} />

        <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* camera feed */}
          <div style={{
            aspectRatio: '16 / 9', background: '#000', borderRadius: 16,
            position: 'relative', overflow: 'hidden',
          }}>
            <PorchScene camera={state.activeCamera}
                        packageVisible={packageOnPorch} eventActive={!!active && !isReplay} />

            {state.snapshotFlash && (
              <div style={{ position: 'absolute', inset: 0, background: '#fff',
                opacity: 0.8, animation: 'peepFlash 350ms ease-out forwards', zIndex: 5 }} />
            )}

            {/* event detection box overlay */}
            {active && !isReplay && active.type === 'package_taken' && state.activeCamera === 'front' && (
              <div style={{
                position: 'absolute', left: '36%', top: '52%', width: '28%', height: '30%',
                border: `1.5px solid ${peep.critical}`,
                boxShadow: `0 0 0 1px ${peep.critical}40`, zIndex: 4,
                animation: 'peepFade .4s ease both',
              }}>
                <div style={{
                  position: 'absolute', top: -18, left: 0, padding: '2px 6px',
                  background: peep.critical, color: '#fff', fontSize: 9, fontWeight: 700,
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                  letterSpacing: 0.3, whiteSpace: 'nowrap',
                }}>PERSON · {(active.conf * 100).toFixed(0)}%</div>
              </div>
            )}

            {/* LIVE / REPLAY pill */}
            <div style={{
              position: 'absolute', top: 12, left: 12,
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '5px 10px', borderRadius: 999,
              background: isReplay ? 'rgba(255,159,10,0.20)' : 'rgba(255,255,255,0.10)',
              backdropFilter: 'blur(12px) saturate(180%)',
              WebkitBackdropFilter: 'blur(12px) saturate(180%)',
              border: `0.5px solid ${isReplay ? peep.high + '99' : 'rgba(255,255,255,0.15)'}`,
              zIndex: 4,
            }}>
              <div style={{
                width: 7, height: 7, borderRadius: 999,
                background: isReplay ? peep.high : peep.accent,
                animation: isReplay ? 'none' : 'peepPulse 1.4s ease-in-out infinite',
              }} />
              <span style={{
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                fontSize: 11, fontWeight: 600, color: '#fff',
              }}>{isReplay ? 'REPLAY' : 'LIVE'}</span>
            </div>

            {/* Rewind 30s button */}
            <Press onTap={() => setShowRewind(!showRewind)} style={{
              position: 'absolute', top: 12, right: 12, zIndex: 4,
              padding: '5px 10px', borderRadius: 999,
              background: showRewind ? peep.accent : 'rgba(255,255,255,0.10)',
              color: showRewind ? '#000' : '#fff',
              backdropFilter: 'blur(12px) saturate(180%)',
              WebkitBackdropFilter: 'blur(12px) saturate(180%)',
              border: `0.5px solid ${showRewind ? peep.accent : 'rgba(255,255,255,0.15)'}`,
              fontSize: 11, fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
              <span>↺</span><span>30s</span>
            </Press>

            {state.muteOn && (
              <div style={{
                position: 'absolute', bottom: 10, right: 12, zIndex: 4,
                padding: '4px 9px', borderRadius: 999,
                background: 'rgba(255,255,255,0.10)',
                backdropFilter: 'blur(12px) saturate(180%)',
                border: '0.5px solid rgba(255,255,255,0.15)',
                fontSize: 10, fontWeight: 600, color: '#fff',
              }}>🔕 Muted</div>
            )}

            {/* address/timestamp bottom-left */}
            <div style={{
              position: 'absolute', bottom: 10, left: 12, zIndex: 4,
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              fontSize: 10, color: 'rgba(255,255,255,0.7)',
            }}>
              {cam.address.toUpperCase()} · {cam.label.toUpperCase()} · UP {cam.up}
            </div>
          </div>

          {/* rewind scrubber */}
          {showRewind && (
            <RewindScrubber
              offset={state.rewindOffset}
              onChange={(v) => setState(s => ({ ...s, rewindOffset: v }))}
              onLive={() => setState(s => ({ ...s, rewindOffset: 0 }))}
            />
          )}

          {/* status strip — tap to jump to Inbox when deliveries are expected */}
          <Press
            onTap={() => {
              if (state.deliveries.some(d => !d.received)) {
                setState(s => ({ ...s, tab: 'inbox', detailStack: [] }));
              }
            }}
            style={{
              background: peep.surface, borderRadius: 14, padding: '12px 16px',
              display: 'flex', alignItems: 'center', gap: 10,
            }}
          >
            <div style={{
              width: 6, height: 6, borderRadius: 999, background: peep.accent,
              boxShadow: `0 0 0 4px ${peep.accent}40`,
            }} />
            <span style={{ fontSize: 14, flex: 1 }}>{statusMessage(state)}</span>
            {state.deliveries.some(d => !d.received) && (
              <span style={{ fontSize: 12, color: peep.accent, fontWeight: 600 }}>View →</span>
            )}
          </Press>

          {/* quick actions */}
          <div style={{ display: 'flex', gap: 10 }}>
            <HoldToTalkButton held={talkStart != null} onStart={startTalk} onEnd={endTalk} />
            <Press onTap={takeSnapshot} style={{
              flex: 1, background: peep.surface, borderRadius: 16, padding: 14,
              display: 'flex', flexDirection: 'column', gap: 12,
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 999,
                background: peep.accent + '26',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill={peep.accent}>
                  <path d="M9 4l-2 2H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V8a2 2 0 00-2-2h-3l-2-2H9zm3 5a5 5 0 110 10 5 5 0 010-10z"/>
                </svg>
              </div>
              <div style={{ fontSize: 12, fontWeight: 600 }}>
                Snapshot{state.snapshots.length > 0 ? ` · ${state.snapshots.length}` : ''}
              </div>
            </Press>
            <Press onTap={() => setState(s => {
              const cur = s.muteUntilLabel || null;
              const next = cur == null ? '1h'
                         : cur === '1h'  ? '4h'
                         : cur === '4h'  ? 'tomorrow'
                         : null;
              return { ...s, muteOn: next != null, muteUntilLabel: next };
            })} style={{
              flex: 1, background: peep.surface, borderRadius: 16, padding: 14,
              display: 'flex', flexDirection: 'column', gap: 12,
              border: state.muteOn ? `1px solid ${peep.accent}99` : '1px solid transparent',
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 999,
                background: state.muteOn ? peep.accent : peep.accent + '26',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: state.muteOn ? '#000' : peep.accent,
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke={state.muteOn ? '#000' : peep.accent} strokeWidth="2" strokeLinecap="round">
                  <path d="M6 8a6 6 0 0112 0c0 7 3 7 3 9H3c0-2 3-2 3-9zM10 21a2 2 0 004 0M3 3l18 18"/>
                </svg>
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.25 }}>
                {state.muteOn ? `Muted ${state.muteUntilLabel}` : 'Mute alerts'}
              </div>
              {!state.muteOn && (
                <div style={{ fontSize: 10, color: peep.textSec, marginTop: -8 }}>
                  Tap to cycle 1h · 4h · til AM
                </div>
              )}
            </Press>
          </div>

          {/* snapshot strip */}
          <SnapshotStrip
            snapshots={state.snapshots}
            onOpen={(snap) => setState(s => ({ ...s, openSnapshot: snap }))}
            onClear={() => setState(s => ({ ...s, snapshots: [] }))}
          />

          {/* active event */}
          {active && !isReplay && (
            <ActiveEventCard event={active} onView={() => onOpenEvent(active)} />
          )}
          {(!active || isReplay) && (
            <div style={{
              background: peep.surface, borderRadius: 18, padding: 24,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
            }}>
              <div style={{ fontSize: 28, opacity: 0.4 }}>{isReplay ? '↺' : '✓'}</div>
              <div style={{ fontSize: 13, color: peep.textSec, textAlign: 'center' }}>
                {isReplay
                  ? `Viewing footage from ${Math.abs(state.rewindOffset)}s ago.`
                  : 'Nothing active. Peep is watching.'}
              </div>
            </div>
          )}
        </div>
      </div>

      <SnapshotPreview
        snapshot={state.openSnapshot}
        onClose={() => setState(s => ({ ...s, openSnapshot: null }))}
      />
    </Screen>
  );
}

Object.assign(window, {
  CAMERAS, cameraById, PorchScene,
  CameraSwitcher, TalkOverlay, HoldToTalkButton,
  SnapshotStrip, SnapshotPreview, RewindScrubber,
  AgentTicker, ActiveEventCard, LiveScreen,
});
