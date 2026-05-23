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
let _phoneCocoPromise = null;
function WebcamFeed() {
  const videoRef = React.useRef(null);
  const [error, setError] = React.useState(null);
  const [model, setModel] = React.useState(null);
  const [dets, setDets] = React.useState([]);

  React.useEffect(() => {
    let stream;
    let cancelled = false;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
      } catch (e) {
        setError(e.message || 'Camera unavailable');
      }
    })();
    return () => {
      cancelled = true;
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, []);

  React.useEffect(() => {
    if (typeof cocoSsd === 'undefined') return;
    if (!_phoneCocoPromise) _phoneCocoPromise = cocoSsd.load({ base: 'lite_mobilenet_v2' });
    let cancelled = false;
    _phoneCocoPromise.then(m => { if (!cancelled) setModel(m); });
    return () => { cancelled = true; };
  }, []);

  React.useEffect(() => {
    if (!model) return;
    let raf;
    let running = true;
    const tick = async () => {
      const v = videoRef.current;
      if (running && v && v.readyState >= 2 && v.videoWidth > 0) {
        try {
          const preds = await model.detect(v, 6, 0.55);
          if (!running) return;
          const W = v.videoWidth, H = v.videoHeight;
          const PKG = new Set(['backpack', 'handbag', 'suitcase', 'book']);
          setDets(preds.map(p => ({
            x: (p.bbox[0] / W) * 100,
            y: (p.bbox[1] / H) * 100,
            w: (p.bbox[2] / W) * 100,
            h: (p.bbox[3] / H) * 100,
            label: PKG.has(p.class) ? 'package' : p.class,
            conf: p.score.toFixed(2),
            color: p.class === 'person' ? '#7ea582'
                 : PKG.has(p.class) ? '#706b8e' : '#c8a86a',
          })));
        } catch {}
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { running = false; if (raf) cancelAnimationFrame(raf); };
  }, [model]);

  return (
    <div style={{ position: 'absolute', inset: 0, background: '#000' }}>
      <video ref={videoRef} autoPlay playsInline muted
             style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      {dets.map((d, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: d.x + '%', top: d.y + '%', width: d.w + '%', height: d.h + '%',
          border: `1.5px solid ${d.color}`, borderRadius: 2, pointerEvents: 'none', zIndex: 3,
        }}>
          <div style={{
            position: 'absolute', left: 0, top: -16, padding: '0 4px', height: 14,
            background: d.color, color: '#0a0a0a', fontSize: 10,
            fontFamily: 'JetBrains Mono, ui-monospace, monospace', lineHeight: '14px',
          }}>{d.label} {d.conf}</div>
        </div>
      ))}
      {error && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          color: 'rgba(255,255,255,0.7)', fontSize: 12, padding: 16, textAlign: 'center',
        }}>Camera access denied or unavailable<br/><span style={{opacity:0.6}}>{error}</span></div>
      )}
    </div>
  );
}

function PorchScene({ camera = 'front', packageVisible = true, eventActive = false }) {
  const cam = cameraById(camera);

  if (camera === 'front')  return <WebcamFeed />;
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
          }}>{c.label}</Press>
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
        flex: 1, background: held ? peep.accent : peep.surface,
        color: held ? '#fff' : peep.text,
        border: held ? 'none' : `0.5px solid ${peep.sep}`,
        borderRadius: 14, padding: '12px 8px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
        transition: 'background .15s, transform .1s',
        transform: held ? 'scale(0.97)' : 'scale(1)',
        WebkitTapHighlightColor: 'transparent',
        boxShadow: held ? `0 4px 12px ${peep.accent}55` : '0 1px 2px rgba(61,53,72,0.04)',
      }}>
      <Icon name="microphone" size={20} weight="fill" color={held ? '#fff' : peep.text} />
      <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: 0.1 }}>
        {held ? 'Speaking…' : 'Hold to talk'}
      </span>
    </div>
  );
}

// ───────── Restyled quick-action row ─────────
function LiveActionRow({
  talking, onTalkStart, onTalkEnd,
  onSnapshot, snapshotCount,
  muteOn, muteLabel, onToggleMute,
}) {
  const cellBase = {
    flex: 1, borderRadius: 14, padding: '12px 8px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
    fontSize: 12, fontWeight: 600, letterSpacing: 0.1,
    boxShadow: '0 1px 2px rgba(61,53,72,0.04)',
    transition: 'background .15s',
  };
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <HoldToTalkButton held={talking} onStart={onTalkStart} onEnd={onTalkEnd} />
      <Press onTap={onSnapshot} style={{
        ...cellBase,
        background: peep.surface,
        border: `0.5px solid ${peep.sep}`,
        color: peep.text,
      }}>
        <Icon name="camera" size={20} weight="fill" color={peep.text} />
        <span>{snapshotCount > 0 ? `Snapshot · ${snapshotCount}` : 'Snapshot'}</span>
      </Press>
      <Press onTap={onToggleMute} style={{
        ...cellBase,
        background: muteOn ? peep.text : peep.surface,
        border: muteOn ? 'none' : `0.5px solid ${peep.sep}`,
        color: muteOn ? peep.bg : peep.text,
      }}>
        <Icon name={muteOn ? 'bell-slash' : 'bell'} size={20} weight="fill"
          color={muteOn ? peep.bg : peep.text} />
        <span>{muteOn ? `Muted ${muteLabel}` : 'Mute'}</span>
      </Press>
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
// ───────── Amazon agent demo (cinematic mock browser that auto-plays) ─────────
const AMAZON_PHASES = [
  { ms: 1100, status: 'Connecting to amazon.com/your-orders…' },
  { ms: 1500, status: 'Found order · Anker PowerCore 20K' },
  { ms: 1400, status: 'Opening "Problem with order" menu' },
  { ms: 1500, status: 'Selecting reason · "Package didn\'t arrive"' },
  { ms: 3200, status: 'Attaching Peep clip + filing claim' },
  { ms: 1800, status: 'Submitting…' },
  { ms: 1200, status: '✓ Refund issued · $42.99 to Visa •••• 4242' },
];

function AmazonAgentDemo({ event, onClose }) {
  const [phase, setPhase] = React.useState(0);
  const [typed, setTyped] = React.useState('');
  const reason = "Doorbell camera confirms theft at 2:32 PM. Clip attached: peep://clips/" + (event?.id || 'demo') + ".mp4";

  React.useEffect(() => {
    if (phase >= AMAZON_PHASES.length) return;
    const t = setTimeout(() => setPhase(p => p + 1), AMAZON_PHASES[phase].ms);
    return () => clearTimeout(t);
  }, [phase]);

  // typewriter for phase 4 (the form)
  React.useEffect(() => {
    if (phase !== 4) return;
    setTyped('');
    let i = 0;
    const id = setInterval(() => {
      i++;
      setTyped(reason.slice(0, i));
      if (i >= reason.length) clearInterval(id);
    }, 38);
    return () => clearInterval(id);
  }, [phase]);

  // cursor positions per phase (% of pane width/height)
  const cursorPos = [
    { x: 22, y: 10 },  // 0 navigating
    { x: 70, y: 38 },  // 1 hovering order
    { x: 86, y: 38 },  // 2 hit "Problem with order"
    { x: 60, y: 56 },  // 3 click "Package didn't arrive"
    { x: 24, y: 78 },  // 4 typing in box
    { x: 80, y: 92 },  // 5 hit Submit
    { x: 50, y: 50 },  // 6 done
  ];
  const cur = cursorPos[Math.min(phase, cursorPos.length - 1)];

  const amzOrange = '#FF9900';
  const amzDark = '#131A22';
  const amzLink = '#007185';
  const amzGreen = '#067D62';

  return (
    <Sheet open onClose={onClose} title={null} height="94%">
      <div style={{
        display: 'flex', flexDirection: 'column',
        margin: '0 12px', borderRadius: 14, overflow: 'hidden',
        background: '#fff', border: `0.5px solid ${peep.sep}`,
        boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
        position: 'relative',
      }}>
        {/* browser chrome */}
        <div style={{
          background: '#f0f0f0', padding: '6px 10px',
          display: 'flex', alignItems: 'center', gap: 8,
          borderBottom: '0.5px solid #d0d0d0',
        }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {['#ff5f57','#ffbd2e','#28ca42'].map(c =>
              <div key={c} style={{ width: 9, height: 9, borderRadius: 999, background: c }} />)}
          </div>
          <div style={{
            flex: 1, padding: '3px 10px', borderRadius: 999, background: '#fff',
            fontSize: 10, fontFamily: 'ui-monospace, SFMono-Regular, monospace',
            color: '#444', border: '0.5px solid #d0d0d0',
            display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden',
          }}>
            <span style={{ color: amzGreen, fontSize: 8 }}>🔒</span>
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              amazon.com/gp/your-account/order-details
            </span>
          </div>
          <div style={{
            fontSize: 9, color: '#888',
            fontFamily: 'ui-monospace, SFMono-Regular, monospace',
          }}>action-layer</div>
        </div>

        {/* amazon header */}
        <div style={{
          background: amzDark, padding: '8px 10px',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{
            color: '#fff', fontSize: 18, fontWeight: 700,
            fontFamily: '"Amazon Ember", -apple-system, sans-serif', letterSpacing: -0.5,
          }}>amazon<span style={{ color: amzOrange }}>.</span></span>
          <div style={{
            flex: 1, height: 22, background: '#fff', borderRadius: 4,
            display: 'flex', alignItems: 'center', padding: '0 8px',
            fontSize: 10, color: '#888',
          }}>Search Amazon</div>
          <div style={{
            color: '#fff', fontSize: 9,
          }}>Your Orders</div>
        </div>

        {/* page body */}
        <div style={{
          position: 'relative', minHeight: 420, padding: 14,
          background: '#fff', display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          {phase === 0 && (
            <div style={{
              padding: 30, textAlign: 'center', color: '#888', fontSize: 12,
              display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center',
            }}>
              <div style={{
                width: 22, height: 22, borderRadius: 999,
                border: `2.5px solid ${amzOrange}`,
                borderTopColor: 'transparent',
                animation: 'peepSpin 0.8s linear infinite',
              }} />
              <span>Loading your orders…</span>
            </div>
          )}

          {phase >= 1 && (
            <div style={{
              border: phase >= 1 && phase <= 3 ? `2px solid ${amzOrange}` : '0.5px solid #d5d9d9',
              borderRadius: 8, padding: 12, display: 'flex', gap: 12,
              animation: phase === 1 ? 'peepFade .35s ease both' : undefined,
              transition: 'border-color .25s',
              boxShadow: phase >= 1 && phase <= 3 ? `0 0 0 4px ${amzOrange}33` : 'none',
              background: '#fafafa', position: 'relative',
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: 6, flexShrink: 0,
                background: 'linear-gradient(135deg, #2a2a2a 0%, #555 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22,
              }}>🔋</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, color: amzLink, lineHeight: 1.3, fontWeight: 500 }}>
                  Anker PowerCore 20K Portable Charger, 20000mAh Battery Pack…
                </div>
                <div style={{
                  fontSize: 10, color: '#565959', marginTop: 4,
                  fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                }}>Order # 114-8829112-0034221 · $42.99</div>
                <div style={{
                  fontSize: 10, color: amzGreen, marginTop: 2, fontWeight: 600,
                }}>Delivered Mon, Mar 23 (per carrier)</div>
              </div>
              <Press style={{
                padding: '4px 8px', fontSize: 10,
                background: phase === 2 ? '#f7ca00' : '#f0c14b',
                color: '#111', borderRadius: 4,
                border: '1px solid #a88734',
                alignSelf: 'flex-start',
                transition: 'background .2s',
                boxShadow: phase === 2 ? '0 0 0 3px rgba(247,202,0,0.4)' : 'none',
              }}>Problem with order ▾</Press>
            </div>
          )}

          {phase >= 3 && (
            <div style={{
              border: phase === 3 ? `2px solid ${amzOrange}` : '0.5px solid #d5d9d9',
              borderRadius: 6, padding: '8px 12px', fontSize: 11,
              background: '#fff', animation: 'peepFade .25s ease both',
              boxShadow: phase === 3 ? `0 0 0 3px ${amzOrange}33` : 'none',
              transition: 'border-color .25s',
            }}>
              <div style={{ fontSize: 10, color: '#565959', marginBottom: 4 }}>Reason</div>
              <div style={{ color: '#0F1111', fontWeight: 500 }}>Package didn't arrive</div>
            </div>
          )}

          {phase >= 4 && (
            <div style={{
              animation: 'peepFade .25s ease both',
              display: 'flex', flexDirection: 'column', gap: 6,
            }}>
              <div style={{ fontSize: 10, color: '#565959' }}>Tell us more (optional)</div>
              <div style={{
                border: phase === 4 ? `2px solid ${amzOrange}` : '0.5px solid #d5d9d9',
                borderRadius: 4, padding: '8px 10px', minHeight: 56,
                fontSize: 11, color: '#0F1111', background: '#fff', lineHeight: 1.4,
                boxShadow: phase === 4 ? `0 0 0 3px ${amzOrange}33` : 'none',
                transition: 'border-color .25s',
              }}>
                {typed}
                {phase === 4 && typed.length < reason.length && (
                  <span style={{
                    display: 'inline-block', width: 1.5, height: 11, marginLeft: 1,
                    background: '#0F1111', verticalAlign: 'middle',
                    animation: 'peepCaret 0.7s steps(2) infinite',
                  }} />
                )}
              </div>
            </div>
          )}

          {phase >= 5 && phase < 6 && (
            <Press style={{
              alignSelf: 'flex-start', padding: '8px 18px',
              background: phase === 5 ? '#f7ca00' : '#f0c14b',
              color: '#111', borderRadius: 4, fontSize: 12, fontWeight: 500,
              border: '1px solid #a88734',
              boxShadow: phase === 5 ? '0 0 0 4px rgba(247,202,0,0.4)' : 'none',
              transition: 'all .15s',
            }}>Submit request</Press>
          )}

          {phase === 6 && (
            <div style={{
              animation: 'peepFade .35s ease both',
              padding: 16, borderRadius: 8, background: '#f0f9f4',
              border: `1px solid ${amzGreen}55`,
              display: 'flex', flexDirection: 'column', gap: 6,
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                color: amzGreen, fontWeight: 600, fontSize: 14,
              }}>
                <div style={{
                  width: 22, height: 22, borderRadius: 999,
                  background: amzGreen, color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700,
                }}>✓</div>
                Refund issued
              </div>
              <div style={{ fontSize: 12, color: '#0F1111', lineHeight: 1.45 }}>
                $42.99 refunded to Visa ending in 4242. Funds typically appear in 3–5 business days.
              </div>
              <div style={{
                fontSize: 10, color: '#565959', marginTop: 4,
                fontFamily: 'ui-monospace, SFMono-Regular, monospace',
              }}>Confirmation: {event?.receipt || 'RFND-XQ7K9-PJZ4'}</div>
            </div>
          )}

          {/* fake cursor */}
          <div style={{
            position: 'absolute', pointerEvents: 'none', zIndex: 20,
            left: `${cur.x}%`, top: `${cur.y}%`,
            transform: 'translate(-2px, -2px)',
            transition: 'left .55s cubic-bezier(.4,1.2,.4,1), top .55s cubic-bezier(.4,1.2,.4,1)',
          }}>
            <svg width="18" height="18" viewBox="0 0 18 18" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}>
              <path d="M1.5 1.5 L1.5 13 L5 9.5 L7.5 14.5 L9.5 13.5 L7 8.5 L11.5 8.5 Z"
                fill="#fff" stroke="#111" strokeWidth="1" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {/* peep agent status footer */}
        <div style={{
          background: peep.text, color: '#fff',
          padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{
            width: 7, height: 7, borderRadius: 999, background: phase >= 6 ? peep.accent : '#FF9900',
            animation: phase < 6 ? 'peepPulse 1.2s ease-in-out infinite' : undefined,
            flexShrink: 0,
          }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 9, opacity: 0.6, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>
              Powered by Action Layer
            </div>
            <div style={{ fontSize: 12, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {AMAZON_PHASES[Math.min(phase, AMAZON_PHASES.length - 1)].status}
            </div>
          </div>
          <div style={{
            fontSize: 9, opacity: 0.7,
            fontFamily: 'ui-monospace, SFMono-Regular, monospace',
          }}>{Math.min(phase + 1, AMAZON_PHASES.length)}/{AMAZON_PHASES.length}</div>
        </div>
      </div>

      {phase >= 6 && (
        <div style={{ padding: '14px 20px 0' }}>
          <Press onTap={onClose} style={{
            background: peep.accent, color: '#fff', padding: '12px 16px',
            borderRadius: 12, textAlign: 'center', fontWeight: 600, fontSize: 14,
            animation: 'peepFade .3s ease both',
          }}>Done</Press>
        </div>
      )}
    </Sheet>
  );
}

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
      background: 'rgba(30,22,38,0.45)', borderRadius: 10, padding: 12,
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
function ActiveEventCard({ event, onView, onShareToCommunity, autoShared }) {
  const m = eventMeta[event.type];
  const c = sevColor(m.severity);
  const [tickerStages, setTickerStages] = React.useState(null);
  // auto-expand for critical events so the agent flow is visible during a demo
  const [showDetails, setShowDetails] = React.useState(
    ['package_taken', 'package_not_arrived', 'weapon_detected'].includes(event.type)
  );
  const [shared, setShared] = React.useState(false);

  const headline = friendlyHeadline(event, tickerStages);
  const done = tickerStages != null;
  const shareable = ['package_taken', 'weapon_detected', 'person_loitering',
    'multiple_loitering', 'after_hours_activity'].includes(event.type);

  return (
    <div style={{
      background: peep.surface, borderRadius: 12, padding: 16,
      border: `0.5px solid ${peep.sep}`,
      display: 'flex', flexDirection: 'column', gap: 12,
      animation: 'peepEventArrive .5s cubic-bezier(.2,.7,.3,1) both',
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 16, fontWeight: 500 }}>{m.label}</div>
        <SeverityBadge severity={m.severity} />
      </div>
      <div style={{ fontSize: 13, color: peep.textSec }}>
        {event.time} · {confidenceLabel(event.conf)}
      </div>

      <div style={{ fontSize: 14, color: peep.text, lineHeight: 1.45 }}>
        {headline}
      </div>

      <AgentTicker event={event} expanded={showDetails}
        onComplete={(s) => setTickerStages(s)} />
      <Press onTap={() => setShowDetails(!showDetails)} style={{
        fontSize: 13, color: peep.textSec, alignSelf: 'flex-start',
      }}>{showDetails ? 'Hide details' : 'Show details'}</Press>

      <Press onTap={onView} style={{
        background: peep.text, borderRadius: 8,
        padding: '10px 14px', color: peep.bg,
        textAlign: 'center', fontWeight: 400, fontSize: 14,
      }}>{done ? 'View receipt' : 'View event'}</Press>

      {shareable && (autoShared || shared) && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 10px', borderRadius: 10,
          background: peep.accentSoft, border: `0.5px solid ${peep.accent}55`,
          fontSize: 12, color: peep.accent, fontWeight: 600,
        }}>
          <Icon name="broadcast" size={14} weight="fill" color={peep.accent} />
          <span>{autoShared ? 'Auto-shared with West End' : 'Shared with West End'}</span>
        </div>
      )}

      {shareable && !autoShared && !shared && onShareToCommunity && (
        <Press onTap={() => { onShareToCommunity(event); setShared(true); }} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          padding: '10px 12px', borderRadius: 10,
          background: peep.surface2, border: `0.5px solid ${peep.sep}`,
          color: peep.text, fontSize: 13, fontWeight: 600,
        }}>
          <Icon name="broadcast" size={15} weight="fill" color={peep.text} />
          Share clip with neighbors
        </Press>
      )}
    </div>
  );
}

function friendlyHeadline(event, stages) {
  const done = stages != null;
  if (event.type === 'package_taken') {
    return done ? `Peep filed your refund.` : `Filing your refund…`;
  }
  if (event.type === 'package_not_arrived') {
    return done ? `Peep filed a missing-delivery claim.` : `Filing a missing-delivery claim…`;
  }
  if (event.type === 'weapon_detected') {
    return done ? `Flagged for your review.` : `Reviewing…`;
  }
  if (event.type === 'person_loitering' || event.type === 'multiple_loitering') {
    return done ? `Logged loitering at your door.` : `Watching loitering at your door…`;
  }
  return done ? `Logged.` : `Reviewing…`;
}

function ProgressPip() { return null; }

// ───────── Live screen ─────────
function LiveScreen({ state, setState, onOpenEvent, onShareToCommunity }) {
  const active = state.activeEvent;
  const cam = cameraById(state.activeCamera);
  const packageOnPorch = !active || active.type !== 'package_taken' || state.rewindOffset < -5;
  const isReplay = state.rewindOffset < 0;

  const [talkStart, setTalkStart] = React.useState(null);
  const [talkMs, setTalkMs] = React.useState(0);
  const toast = useToast();
  const [showRewind, setShowRewind] = React.useState(false);
  const [shareEtaPkg, setShareEtaPkg] = React.useState(null);
  const pendingDelivery = state.deliveries.find(d => !d.received) || null;

  React.useEffect(() => {
    if (talkStart == null) return;
    let raf;
    const tick = () => { setTalkMs(Date.now() - talkStart); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [talkStart]);

  const startTalk = () => { setTalkStart(Date.now()); setTalkMs(0); };
  const endTalk = () => {
    if (talkStart == null) return;
    const ms = Date.now() - talkStart;
    setTalkStart(null);
    if (ms > 300) toast(`Voice sent · ${(ms / 1000).toFixed(1)}s`);
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 8 }}>
        <CameraSwitcher value={state.activeCamera}
                        onChange={id => setState(s => ({ ...s, activeCamera: id, rewindOffset: 0 }))} />

        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* camera feed */}
          <div style={{
            aspectRatio: '16 / 9', background: '#000', borderRadius: 12,
            position: 'relative', overflow: 'hidden',
          }}>
            <PorchScene camera={state.activeCamera}
                        packageVisible={packageOnPorch} eventActive={!!active && !isReplay} />

            {state.snapshotFlash && (
              <div style={{ position: 'absolute', inset: 0, background: '#fff',
                opacity: 0.8, animation: 'peepFlash 350ms ease-out forwards', zIndex: 5 }} />
            )}

            <div style={{
              position: 'absolute', top: 10, left: 10,
              padding: '4px 9px', borderRadius: 6,
              background: 'rgba(0,0,0,0.4)',
              color: '#fff', fontSize: 11, fontWeight: 500,
              zIndex: 4,
            }}>{isReplay ? 'Replay' : 'Live'}</div>

            <Press onTap={() => setShowRewind(!showRewind)} style={{
              position: 'absolute', top: 10, right: 10, zIndex: 4,
              padding: '4px 9px', borderRadius: 6,
              background: 'rgba(0,0,0,0.4)',
              color: '#fff', fontSize: 11, fontWeight: 500,
            }}>Rewind 30s</Press>

            <div style={{
              position: 'absolute', bottom: 10, left: 10, zIndex: 4,
              fontSize: 11, color: 'rgba(255,255,255,0.85)',
            }}>{cam.address} · {cam.label}</div>
          </div>

          {showRewind && (
            <RewindScrubber
              offset={state.rewindOffset}
              onChange={(v) => setState(s => ({ ...s, rewindOffset: v }))}
              onLive={() => setState(s => ({ ...s, rewindOffset: 0 }))}
            />
          )}

          {/* status */}
          <div style={{
            padding: '12px 14px',
            background: peep.surface, borderRadius: 12,
            border: `0.5px solid ${peep.sep}`,
            display: 'flex', flexDirection: 'column', gap: pendingDelivery ? 10 : 0,
          }}>
            <Press onTap={() => {
                if (pendingDelivery) {
                  setState(s => ({ ...s, tab: 'inbox', detailStack: [] }));
                }
              }} style={{
              display: 'flex', alignItems: 'center',
            }}>
              <span style={{ fontSize: 14, flex: 1 }}>{statusMessage(state)}</span>
              {pendingDelivery && (
                <span style={{ fontSize: 13, color: peep.text }}>View →</span>
              )}
            </Press>
            {pendingDelivery && (
              <Press onTap={() => setShareEtaPkg(pendingDelivery)} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 10px', borderRadius: 10,
                background: peep.accentSoft,
                border: `0.5px solid ${peep.accent}55`,
              }}>
                <Icon name="paper-plane-tilt" size={14} weight="fill" color={peep.accent} />
                <span style={{ fontSize: 13, color: peep.accent, fontWeight: 600, flex: 1 }}>
                  Not home? Share ETA with a friend
                </span>
                <span style={{ fontSize: 13, color: peep.accent }}>→</span>
              </Press>
            )}
          </div>

          {/* quick actions */}
          <LiveActionRow
            talking={talkStart != null}
            onTalkStart={startTalk}
            onTalkEnd={endTalk}
            onSnapshot={takeSnapshot}
            snapshotCount={state.snapshots.length}
            muteOn={state.muteOn}
            muteLabel={state.muteUntilLabel}
            onToggleMute={() => setState(s => {
              const cur = s.muteUntilLabel || null;
              const next = cur == null ? '1h' : cur === '1h' ? '4h' : cur === '4h' ? 'tomorrow' : null;
              return { ...s, muteOn: next != null, muteUntilLabel: next };
            })}
          />

          <SnapshotStrip
            snapshots={state.snapshots}
            onOpen={(snap) => setState(s => ({ ...s, openSnapshot: snap }))}
            onClear={() => setState(s => ({ ...s, snapshots: [] }))}
          />

          {active && !isReplay && (
            <ActiveEventCard event={active} onView={() => onOpenEvent(active)}
              onShareToCommunity={onShareToCommunity}
              autoShared={!!state.settings.autoShareCritical
                && ['package_taken','weapon_detected','multiple_loitering'].includes(active.type)} />
          )}
          {(!active || isReplay) && (
            <div style={{
              background: peep.surface, borderRadius: 12, padding: 16,
              border: `0.5px solid ${peep.sep}`,
              fontSize: 14, color: peep.textSec, textAlign: 'center',
            }}>
              {isReplay
                ? `Viewing footage from ${Math.abs(state.rewindOffset)} seconds ago.`
                : 'Nothing active.'}
            </div>
          )}
        </div>
      </div>

      <SnapshotPreview
        snapshot={state.openSnapshot}
        onClose={() => setState(s => ({ ...s, openSnapshot: null }))}
      />
      <ShareEtaSheet
        open={!!shareEtaPkg}
        delivery={shareEtaPkg}
        onClose={() => setShareEtaPkg(null)}
      />
    </Screen>
  );
}

Object.assign(window, {
  CAMERAS, cameraById, PorchScene,
  CameraSwitcher, TalkOverlay, HoldToTalkButton, LiveActionRow,
  AmazonAgentDemo,
  SnapshotStrip, SnapshotPreview, RewindScrubber,
  AgentTicker, ActiveEventCard, LiveScreen,
});
