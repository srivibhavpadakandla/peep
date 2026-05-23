/* Peep — Onboarding (3-screen intro + permissions) */

function OnboardingFlow({ onDone }) {
  const [step, setStep] = React.useState(0);

  const next = () => setStep(s => s + 1);
  const skip = onDone;

  const screens = [
    <OnboardingIntro  key="0" onNext={next} onSkip={skip} />,
    <OnboardingPair   key="1" onNext={next} onSkip={skip} />,
    <OnboardingAmazon key="2" onNext={next} onSkip={skip} />,
    <OnboardingHours  key="3" onNext={next} onSkip={skip} />,
    <OnboardingPerms  key="4" onDone={onDone} />,
  ];

  return (
    <div style={{
      width: '100%', height: '100%', position: 'relative', overflow: 'hidden',
      background: peep.bg, color: peep.text,
      fontFamily: '-apple-system, "SF Pro", system-ui',
    }}>
      {/* Owl watermark on screens 1+ (reference image vibe) */}
      {step > 0 && <OwlWatermark opacity={0.08} />}

      {/* skip + progress at top */}
      <div style={{
        position: 'absolute', top: 60, left: 20, right: 20, zIndex: 10,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{
          flex: 1, height: 3, background: peep.surface, borderRadius: 999, overflow: 'hidden',
        }}>
          <div style={{
            width: `${((step + 1) / screens.length) * 100}%`, height: '100%',
            background: peep.accent, transition: 'width .3s cubic-bezier(.2,.7,.3,1)',
          }} />
        </div>
        {step < screens.length - 1 && (
          <Press onTap={skip} style={{
            fontSize: 14, color: peep.textSec, padding: 4,
          }}>Skip</Press>
        )}
      </div>

      <div key={step} style={{
        width: '100%', height: '100%',
        animation: 'peepFade .3s ease both',
      }}>
        {screens[step]}
      </div>
    </div>
  );
}

function OnboardingScreen({ children, footer }) {
  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', flexDirection: 'column',
      padding: '100px 28px 40px', boxSizing: 'border-box',
    }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>{children}</div>
      <div style={{ flexShrink: 0 }}>{footer}</div>
    </div>
  );
}

function OnboardingButton({ children, onTap, primary = true }) {
  return (
    <Press onTap={onTap} style={{
      width: '100%', boxSizing: 'border-box',
      background: primary ? peep.accent : peep.surface,
      color: primary ? '#000' : peep.text,
      borderRadius: 14, padding: '15px 20px',
      fontSize: 16, fontWeight: 600, textAlign: 'center',
    }}>{children}</Press>
  );
}

// ───────── 0 · Welcome ─────────
function OnboardingIntro({ onNext }) {
  return (
    <OnboardingScreen footer={<OnboardingButton onTap={onNext}>Get started</OnboardingButton>}>
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 8,
        marginTop: -20,
      }}>
        <OwlLogo size={150} color={peep.text} />
        <div style={{
          fontSize: 22, fontWeight: 500, letterSpacing: 1,
          color: peep.text, marginTop: 6,
        }}>peep</div>
      </div>

      {/* Tagline matching the brand reference */}
      <div style={{ fontSize: 24, fontWeight: 600, lineHeight: 1.25,
        color: peep.text, textAlign: 'center', marginBottom: 10, padding: '0 8px' }}>
        Your doorstep just got{' '}
        <span style={{
          color: peep.accent,
          borderBottom: `3px solid ${peep.accent}`,
          paddingBottom: 1,
        }}>smarter</span>.
      </div>
      <div style={{ fontSize: 14, color: peep.textSec, lineHeight: 1.5,
        textAlign: 'center', marginBottom: 16, padding: '0 8px' }}>
        Three agents working together. Vision spots what happens, Claude reasons about it, a browser agent files refunds — before you've reached for your phone.
      </div>
    </OnboardingScreen>
  );
}

// ───────── 1 · Pair camera ─────────
function OnboardingPair({ onNext }) {
  const [paired, setPaired] = React.useState(false);

  return (
    <OnboardingScreen footer={
      <OnboardingButton onTap={paired ? onNext : () => setPaired(true)}>
        {paired ? 'Continue' : 'Tap to pair'}
      </OnboardingButton>
    }>
      <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.4, marginTop: 30 }}>
        Pair your camera
      </div>
      <div style={{ fontSize: 15, color: peep.textSec, marginTop: 10, lineHeight: 1.5 }}>
        Hold your phone near the Peep camera. We'll pair over Bluetooth and join your Wi-Fi automatically.
      </div>

      {/* Camera illustration — owl-eye shape on aubergine, gold accents */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', marginTop: 20,
      }}>
        <div style={{
          width: 200, height: 200, borderRadius: '50%',
          background: `radial-gradient(circle at 35% 30%, ${peep.surface2} 0%, ${peep.surface} 55%, #2a1f33 100%)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative',
          boxShadow: `inset 0 0 24px rgba(0,0,0,0.5), 0 0 ${paired ? 60 : 30}px ${paired ? peep.accent + 'B0' : peep.accent + '20'}`,
          transition: 'box-shadow .4s',
        }}>
          {/* iris / lens */}
          <div style={{
            width: 92, height: 92, borderRadius: '50%',
            background: `radial-gradient(circle at 35% 30%, ${peep.text} 0%, ${peep.accent} 35%, #6c5418 100%)`,
            border: `2px solid ${peep.accent}`,
            position: 'relative',
            boxShadow: `0 0 14px ${peep.accent}66`,
          }}>
            {/* pupil */}
            <div style={{
              position: 'absolute', left: '50%', top: '50%',
              transform: 'translate(-50%, -50%)',
              width: 38, height: 38, borderRadius: '50%',
              background: '#1a0d22',
            }} />
            {/* catchlight */}
            <div style={{
              position: 'absolute', top: '20%', left: '24%', width: 16, height: 16,
              borderRadius: '50%', background: 'rgba(255,255,255,0.55)',
              filter: 'blur(2px)',
            }} />
          </div>
          {/* pulse rings when paired */}
          {paired && [1,2,3].map(i => (
            <div key={i} style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              border: `1px solid ${peep.accent}`,
              animation: `peepRing 2s ease-out ${i * 0.4}s infinite`,
            }} />
          ))}
        </div>
      </div>

      <div style={{
        fontSize: 13, color: paired ? peep.accent : peep.textSec, textAlign: 'center',
        marginBottom: 16, fontWeight: 500,
      }}>
        {paired ? '✓ Paired · Peep-A4F9 on 5GHz' : 'Searching for nearby cameras…'}
      </div>
    </OnboardingScreen>
  );
}

// ───────── 2 · Connect Amazon ─────────
function OnboardingAmazon({ onNext }) {
  const [connected, setConnected] = React.useState(false);

  return (
    <OnboardingScreen footer={
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <OnboardingButton onTap={() => { setConnected(true); setTimeout(onNext, 600); }}>
          {connected ? '✓ Connected' : 'Connect Amazon'}
        </OnboardingButton>
        <OnboardingButton onTap={onNext} primary={false}>Maybe later</OnboardingButton>
      </div>
    }>
      <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.4, marginTop: 30 }}>
        Connect Amazon
      </div>
      <div style={{ fontSize: 15, color: peep.textSec, marginTop: 10, lineHeight: 1.5 }}>
        When Peep sees a package taken or never arrive, it can file the refund or missing-delivery claim on your behalf.
      </div>

      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginTop: 18,
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
          <FlowStep icon="package" iconColor={peep.info}     text="Camera detects theft" done />
          <FlowStep icon="brain"   iconColor={peep.accent}   text="Claude verifies + matches order" done />
          <FlowStep icon="lightning" iconColor="#bf7af0"     text="Browser agent files refund" highlighted={connected} done={connected} />
          <FlowStep icon="envelope" iconColor={peep.text}    text="You get the receipt" done={connected} />
        </div>
      </div>

      {/* Privacy note */}
      <div style={{
        padding: 14, borderRadius: 12,
        background: peep.surface, border: `0.5px solid ${peep.sep}`,
        display: 'flex', flexDirection: 'column', gap: 8,
        marginBottom: 8,
      }}>
        <div style={{
          fontSize: 11, color: peep.accent, textTransform: 'uppercase',
          letterSpacing: 0.5, fontWeight: 700,
        }}>🔒 What Peep accesses</div>
        <div style={{ fontSize: 12, color: peep.textSec, lineHeight: 1.5 }}>
          Order IDs, delivery confirmations, and the Returns page — only when a Peep alert matches one of your orders. Nothing is read or stored otherwise. You can revoke access any time from Settings.
        </div>
        <Press onTap={() => {}} style={{
          fontSize: 12, fontWeight: 600, color: peep.accent,
          alignSelf: 'flex-start',
        }}>Learn more about our privacy →</Press>
      </div>
    </OnboardingScreen>
  );
}

function FlowStep({ icon, iconColor, text, done, highlighted }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 14px',
      background: highlighted ? peep.accent + '22' : peep.surface,
      borderRadius: 12,
      border: highlighted ? `1px solid ${peep.accent}99` : '1px solid transparent',
      transition: 'all .3s',
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8,
        background: (iconColor || peep.accent) + '26',
        border: `0.5px solid ${(iconColor || peep.accent)}40`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon name={icon} size={18} weight="fill" color={iconColor || peep.accent} />
      </div>
      <span style={{ flex: 1, fontSize: 14, fontWeight: 500,
        color: done ? peep.text : peep.textSec }}>{text}</span>
      <span style={{
        width: 18, height: 18, borderRadius: 999,
        background: done ? peep.accent : 'transparent',
        border: done ? 'none' : `1.5px solid ${peep.textTer}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#000', flexShrink: 0,
      }}>{done && <Icon name="check" size={11} weight="bold" color="#000" />}</span>
    </div>
  );
}

// ───────── 3 · Quiet hours ─────────
function OnboardingHours({ onNext }) {
  // Stored as fraction [0..1] along the night arc (t=0 → 6 PM, t=1 → 9 AM).
  const [startT, setStartT] = React.useState(timeToT(22)); // 10 PM
  const [endT,   setEndT]   = React.useState(timeToT(7));  // 7 AM

  return (
    <OnboardingScreen footer={<OnboardingButton onTap={onNext}>Set quiet hours</OnboardingButton>}>
      <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.4, marginTop: 30 }}>
        Quiet hours
      </div>
      <div style={{ fontSize: 15, color: peep.textSec, marginTop: 10, lineHeight: 1.5 }}>
        Drag the moon and sun to set when Peep stays quiet.
      </div>

      {/* Draggable moon → sun arc */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginTop: 8, marginBottom: 12,
      }}>
        <DraggableDayNightArc
          startT={startT} endT={endT}
          onChange={(s, e) => { setStartT(s); setEndT(e); }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <HoursRow label="Start" value={tToTimeLabel(startT)} icon="moon-stars" />
        <HoursRow label="End"   value={tToTimeLabel(endT)}   icon="sun" />
      </div>

      <div style={{
        marginTop: 14, padding: 14, background: peep.surface, borderRadius: 14,
        display: 'flex', flexDirection: 'column', gap: 6,
      }}>
        <div style={{ fontSize: 11, color: peep.textSec, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>
          During quiet hours
        </div>
        <div style={{ fontSize: 13, color: peep.text, lineHeight: 1.5 }}>
          You'll still get pings for <span style={{ color: peep.critical, fontWeight: 600 }}>critical</span> events (theft, weapons). Everything else queues for morning.
        </div>
      </div>
    </OnboardingScreen>
  );
}

// Time mapping: arc represents 15-hour night cycle (6 PM → 9 AM).
function timeToT(hour24) {
  // map a real hour [0..24] to t along the night arc
  let h = hour24;
  if (h < 9) h += 24;          // morning hours map to "second half"
  return Math.max(0, Math.min(1, (h - 18) / 15));
}
function tToTimeLabel(t) {
  const totalHours = 15;
  const h = (18 + t * totalHours) % 24;
  const hourPart = Math.floor(h);
  const minPart = Math.round((h - hourPart) * 4) * 15; // snap to 15-min
  const adjMin = minPart === 60 ? 0 : minPart;
  const adjHour = minPart === 60 ? (hourPart + 1) % 24 : hourPart;
  const isAm = adjHour < 12;
  const display = adjHour === 0 ? 12 : adjHour > 12 ? adjHour - 12 : adjHour;
  return `${display}:${adjMin.toString().padStart(2,'0')} ${isAm ? 'AM' : 'PM'}`;
}
function arcPoint(t) {
  // Quadratic Bezier from (0,90) via (125,-10) to (250,90).
  // x is linear in t; y peaks at t=0.5.
  return {
    xPct: t * 100,
    yPct: 90 + 200 * (t * t - t), // ranges 90 (ends) → 40 (peak)
  };
}

function DraggableDayNightArc({ startT, endT, onChange }) {
  const ref = React.useRef(null);
  const [dragging, setDragging] = React.useState(null); // 'start' | 'end' | null

  const tFromClient = (clientX) => {
    const r = ref.current.getBoundingClientRect();
    return Math.max(0, Math.min(1, (clientX - r.left) / r.width));
  };

  const startDrag = (which) => (e) => {
    e.preventDefault();
    setDragging(which);
  };

  React.useEffect(() => {
    if (!dragging) return;
    const move = (e) => {
      const x = e.clientX ?? (e.touches && e.touches[0].clientX);
      if (x == null) return;
      let t = tFromClient(x);
      if (dragging === 'start') {
        // Clamp so start stays before end with a small gap
        t = Math.min(t, endT - 0.04);
        onChange(Math.max(0, t), endT);
      } else {
        t = Math.max(t, startT + 0.04);
        onChange(startT, Math.min(1, t));
      }
    };
    const up = () => setDragging(null);
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
  }, [dragging, startT, endT]);

  const moonPos = arcPoint(startT);
  const sunPos  = arcPoint(endT);

  return (
    <div ref={ref} style={{
      width: '100%', maxWidth: 320, aspectRatio: '2.5 / 1', position: 'relative',
      touchAction: 'none', userSelect: 'none',
    }}>
      {/* Base arc */}
      <svg viewBox="0 0 250 100" style={{ width: '100%', height: '100%' }} preserveAspectRatio="none">
        <defs>
          <linearGradient id="arcGradB" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"  stopColor="#3a4a7a" />
            <stop offset="50%" stopColor="#1a2a4a" />
            <stop offset="100%" stopColor="#d49a40" />
          </linearGradient>
        </defs>
        {/* Full 24h ghost arc */}
        <path d="M 0 90 Q 125 -10, 250 90"
          stroke={peep.textTer} strokeWidth="1.5" fill="none"
          strokeDasharray="3 5" />
        {/* Active quiet segment between moon and sun (drawn as the same Bezier but dasharray-clipped) */}
        <ActiveArcSegment startT={startT} endT={endT} />
      </svg>

      {/* center label */}
      <div style={{
        position: 'absolute', left: '50%', top: '8%', transform: 'translateX(-50%)',
        fontSize: 10, color: peep.textSec, letterSpacing: 0.5, textTransform: 'uppercase',
        fontWeight: 600, whiteSpace: 'nowrap',
      }}>quiet · {tToTimeLabel(startT)} → {tToTimeLabel(endT)}</div>

      {/* Moon handle */}
      <Handle
        x={moonPos.xPct} y={moonPos.yPct}
        icon="moon-stars" color={peep.info}
        active={dragging === 'start'}
        onStart={startDrag('start')}
      />
      {/* Sun handle */}
      <Handle
        x={sunPos.xPct} y={sunPos.yPct}
        icon="sun" color={peep.accent}
        active={dragging === 'end'}
        onStart={startDrag('end')}
      />
    </div>
  );
}

function ActiveArcSegment({ startT, endT }) {
  // Sample the Bezier between startT and endT, drawing as a polyline.
  const samples = 24;
  const pts = [];
  for (let i = 0; i <= samples; i++) {
    const t = startT + (endT - startT) * (i / samples);
    const p = arcPoint(t);
    pts.push(`${(p.xPct * 250 / 100).toFixed(1)},${(p.yPct).toFixed(1)}`);
  }
  return (
    <polyline points={pts.join(' ')} stroke="url(#arcGradB)" strokeWidth="3" fill="none"
      strokeLinecap="round" />
  );
}

function Handle({ x, y, icon, color, active, onStart }) {
  return (
    <div
      onMouseDown={onStart} onTouchStart={onStart}
      style={{
        position: 'absolute', left: `${x}%`, top: `${y}%`,
        transform: `translate(-50%, -50%) scale(${active ? 1.15 : 1})`,
        width: 44, height: 44, borderRadius: 999,
        background: color + '22', border: `1.5px solid ${color}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'grab', touchAction: 'none', userSelect: 'none',
        boxShadow: active
          ? `0 0 0 6px ${color}33, 0 6px 20px rgba(0,0,0,0.4)`
          : `0 4px 12px rgba(0,0,0,0.3), 0 0 12px ${color}40`,
        transition: 'transform .15s, box-shadow .15s',
        WebkitTapHighlightColor: 'transparent',
        zIndex: 5,
      }}>
      <Icon name={icon} size={22} weight="fill" color={color} />
    </div>
  );
}

function HoursRow({ label, value, icon }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '14px 16px', background: peep.surface, borderRadius: 14,
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8,
        background: peep.accent + '26',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name={icon} size={18} weight="fill" color={peep.accent} />
      </div>
      <span style={{ flex: 1, fontSize: 15, fontWeight: 500 }}>{label}</span>
      <div style={{
        background: peep.surface2, padding: '6px 14px', borderRadius: 8,
        fontSize: 15, fontWeight: 500,
      }}>{value}</div>
    </div>
  );
}

// ───────── 4 · Permissions ─────────
function OnboardingPerms({ onDone }) {
  const [showPrompt, setShowPrompt] = React.useState(false);

  return (
    <OnboardingScreen footer={
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <OnboardingButton onTap={() => setShowPrompt(true)}>
          {showPrompt ? 'Choose an option above' : 'Enable alerts'}
        </OnboardingButton>
        <OnboardingButton onTap={onDone} primary={false}>Skip for now</OnboardingButton>
      </div>
    }>
      <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.4, marginTop: 30 }}>
        Enable alerts
      </div>
      <div style={{ fontSize: 15, color: peep.textSec, marginTop: 10, lineHeight: 1.5 }}>
        Peep is calm by default — you'll only hear from us when something matters.
      </div>

      {/* Show what notifications look like */}
      <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <NotifPreview icon="package" title="Package taken · 142 Linden"
          body="Refund filed with Amazon. Tap to review →" severity="critical" />
        <NotifPreview icon="person-simple" title="Someone at your door"
          body="Loitering for 8 sec. Tap to see live →" severity="warning" />
        <NotifPreview icon="dog" title="Animal · dog"
          body="Logged. No action needed." severity="info" muted />
      </div>

      <div style={{
        marginTop: 14, padding: 12, borderRadius: 12,
        background: peep.surface, border: `0.5px solid ${peep.sep}`,
        fontSize: 12, color: peep.textSec, lineHeight: 1.5,
      }}>
        You can fine-tune which events alert you and set quiet hours from <strong style={{ color: peep.text }}>Settings → Notifications</strong> at any time.
      </div>

      {/* Faux iOS permission sheet */}
      {showPrompt && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 16, zIndex: 50,
          animation: 'peepFade .2s ease both',
        }}>
          <div style={{
            width: '100%', maxWidth: 320, background: 'rgba(58,58,60,0.95)',
            backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
            borderRadius: 14, padding: '20px 16px',
            display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center',
            boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
            animation: 'peepEventArrive .25s cubic-bezier(.2,.7,.3,1) both',
          }}>
            <div style={{ fontSize: 16, fontWeight: 600, textAlign: 'center' }}>
              "Peep" would like to send you notifications
            </div>
            <div style={{ fontSize: 13, color: peep.textSec, textAlign: 'center', lineHeight: 1.4 }}>
              Notifications may include alerts, sounds, and icon badges. These can be configured in Settings.
            </div>
            <div style={{ height: 0.5, background: peep.sep, width: '100%' }} />
            <div style={{ display: 'flex', gap: 10, width: '100%' }}>
              <Press onTap={onDone} style={{
                flex: 1, padding: '10px', borderRadius: 10, background: peep.surface2,
                color: peep.accent, fontSize: 14, fontWeight: 600, textAlign: 'center',
              }}>Don't Allow</Press>
              <Press onTap={onDone} style={{
                flex: 1, padding: '10px', borderRadius: 10, background: peep.accent,
                color: '#000', fontSize: 14, fontWeight: 700, textAlign: 'center',
              }}>Allow</Press>
            </div>
          </div>
        </div>
      )}
    </OnboardingScreen>
  );
}

function NotifPreview({ icon, title, body, severity, muted }) {
  const c = severity === 'critical' ? peep.critical
          : severity === 'warning' ? peep.warning
          : peep.info;
  return (
    <div style={{
      background: peep.surface, borderRadius: 10, padding: 12,
      border: `0.5px solid ${peep.sep}`,
      display: 'flex', flexDirection: 'column', gap: 2,
      opacity: muted ? 0.5 : 1,
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 500, color: peep.textSec }}>Peep</span>
        <span style={{ fontSize: 12, color: peep.textTer, marginLeft: 'auto' }}>now</span>
      </div>
      <div style={{ fontSize: 14, fontWeight: 500, color: peep.text, marginTop: 2 }}>
        {title}
      </div>
      <div style={{ fontSize: 13, color: peep.textSec, lineHeight: 1.4 }}>
        {body}
      </div>
    </div>
  );
}

Object.assign(window, {
  OnboardingFlow, OnboardingIntro, OnboardingPair, OnboardingAmazon,
  OnboardingHours, OnboardingPerms,
});
