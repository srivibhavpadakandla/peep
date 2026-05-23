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
      {/* Wordmark */}
      <div style={{
        marginTop: 30, fontSize: 60, fontWeight: 700, letterSpacing: -2,
        display: 'flex', alignItems: 'baseline',
      }}>
        <span>p</span>
        <span style={{
          width: 46, height: 46, borderRadius: 999,
          background: 'radial-gradient(circle at 30% 30%, #fff 0%, #d0d0d0 30%, #1a1a1a 60%)',
          border: `2px solid ${peep.text}`,
          marginLeft: -2, marginRight: -2, marginBottom: -2,
          display: 'inline-block', verticalAlign: 'baseline',
          boxShadow: `inset 0 0 12px rgba(0,0,0,0.6), 0 0 24px ${peep.accent}40`,
        }} />
        <span style={{ marginLeft: -2 }}>ep</span>
      </div>

      {/* Tagline */}
      <div style={{ fontSize: 20, fontWeight: 500, marginTop: 18, lineHeight: 1.3 }}>
        Your doorstep, watched by an AI that <em style={{ color: peep.accent, fontStyle: 'normal' }}>does something about it.</em>
      </div>

      {/* Hero camera + agent fan illustration */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginTop: 8, marginBottom: 8, position: 'relative',
      }}>
        <HeroCameraIllustration />
      </div>

      {/* Three agent chips */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <AgentChip color={peep.info}     label="Vision"  sub="sees" />
        <AgentChip color={peep.accent}   label="Claude"  sub="thinks" />
        <AgentChip color="#bf7af0"       label="Browser" sub="acts" />
      </div>
    </OnboardingScreen>
  );
}

function HeroCameraIllustration() {
  return (
    <div style={{
      width: 240, height: 240, position: 'relative',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {/* outer pulse ring */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        border: `1px solid ${peep.accent}22`,
        animation: 'peepRing 3s ease-out infinite',
      }} />
      <div style={{
        position: 'absolute', inset: 14, borderRadius: '50%',
        border: `1px solid ${peep.accent}33`,
        animation: 'peepRing 3s ease-out 1s infinite',
      }} />

      {/* camera body */}
      <div style={{
        width: 130, height: 130, borderRadius: '50%',
        background: 'radial-gradient(circle at 35% 30%, #2a2a2a 0%, #0a0a0a 70%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: `inset 0 0 20px rgba(0,0,0,0.8), 0 0 40px ${peep.accent}33`,
        position: 'relative',
      }}>
        {/* lens */}
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'radial-gradient(circle at 30% 30%, #1a4a3a 0%, #051f15 60%, #000)',
          border: `2px solid ${peep.accent}80`,
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute', top: 6, left: 10, width: 8, height: 8,
            borderRadius: '50%', background: 'rgba(255,255,255,0.4)',
          }} />
        </div>
        {/* LED */}
        <div style={{
          position: 'absolute', top: 14, right: 22,
          width: 6, height: 6, borderRadius: 999, background: peep.accent,
          boxShadow: `0 0 12px ${peep.accent}`,
          animation: 'peepPulse 1.5s ease-in-out infinite',
        }} />
      </div>

      {/* agent satellite dots */}
      {[
        { angle: -65, color: peep.info,   label: '👁' },
        { angle: 0,   color: peep.accent, label: '🧠' },
        { angle: 65,  color: '#bf7af0',   label: '⚡' },
      ].map((s, i) => {
        const rad = s.angle * Math.PI / 180;
        const r = 100;
        return (
          <div key={i} style={{
            position: 'absolute',
            left: `calc(50% + ${Math.sin(rad) * r}px - 18px)`,
            top: `calc(50% - ${Math.cos(rad) * r}px - 18px)`,
            width: 36, height: 36, borderRadius: 999,
            background: s.color + '26', border: `0.5px solid ${s.color}99`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18,
            animation: `peepFloat 3.5s ease-in-out ${i * 0.3}s infinite`,
          }}>{s.label}</div>
        );
      })}
    </div>
  );
}

function AgentChip({ color, label, sub }) {
  return (
    <div style={{
      flex: 1, padding: '10px 8px', borderRadius: 12,
      background: peep.surface, border: `0.5px solid ${peep.sep}`,
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
    }}>
      <div style={{
        width: 6, height: 6, borderRadius: 999, background: color,
        boxShadow: `0 0 0 3px ${color}33`,
      }} />
      <span style={{ fontSize: 13, fontWeight: 600, marginTop: 4 }}>{label}</span>
      <span style={{ fontSize: 11, color: peep.textSec }}>{sub}</span>
    </div>
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

      {/* Camera illustration */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', marginTop: 20,
      }}>
        <div style={{
          width: 180, height: 180, borderRadius: '50%',
          background: 'radial-gradient(circle at 30% 30%, #2a2a2a, #0a0a0a)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative',
          boxShadow: `inset 0 0 20px rgba(0,0,0,0.8), 0 0 ${paired ? 60 : 30}px ${paired ? peep.accent + '80' : 'rgba(255,255,255,0.05)'}`,
          transition: 'box-shadow .4s',
        }}>
          <div style={{
            width: 70, height: 70, borderRadius: '50%',
            background: 'radial-gradient(circle at 30% 30%, #1a4a3a 0%, #051f15 60%, #000)',
            border: `2px solid ${peep.accent}40`,
            position: 'relative',
          }}>
            <div style={{
              position: 'absolute', top: 8, left: 12, width: 8, height: 8,
              borderRadius: '50%', background: 'rgba(255,255,255,0.3)',
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
          <FlowStep emoji="📦" text="Camera detects theft" done />
          <FlowStep emoji="🧠" text="Claude verifies + matches order" done />
          <FlowStep emoji="⚡" text="Browser agent files refund" highlighted={connected} done={connected} />
          <FlowStep emoji="✉️" text="You get the receipt" done={connected} />
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

function FlowStep({ emoji, text, done, highlighted }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 14px',
      background: highlighted ? peep.accent + '22' : peep.surface,
      borderRadius: 12,
      border: highlighted ? `1px solid ${peep.accent}99` : '1px solid transparent',
      transition: 'all .3s',
    }}>
      <span style={{ fontSize: 22 }}>{emoji}</span>
      <span style={{ flex: 1, fontSize: 14, fontWeight: 500,
        color: done ? peep.text : peep.textSec }}>{text}</span>
      <span style={{
        width: 18, height: 18, borderRadius: 999,
        background: done ? peep.accent : 'transparent',
        border: done ? 'none' : `1.5px solid ${peep.textTer}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#000', fontSize: 11, fontWeight: 700,
      }}>{done ? '✓' : ''}</span>
    </div>
  );
}

// ───────── 3 · Quiet hours ─────────
function OnboardingHours({ onNext }) {
  const [start, setStart] = React.useState('10:00 PM');
  const [end,   setEnd]   = React.useState('7:00 AM');

  return (
    <OnboardingScreen footer={<OnboardingButton onTap={onNext}>Set quiet hours</OnboardingButton>}>
      <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.4, marginTop: 30 }}>
        Quiet hours
      </div>
      <div style={{ fontSize: 15, color: peep.textSec, marginTop: 10, lineHeight: 1.5 }}>
        Peep keeps watching, but only buzzes for critical events during these hours.
      </div>

      {/* Moon → sun illustration */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginTop: 10, marginBottom: 10,
      }}>
        <DayNightArc />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <HoursRow label="Start" value={start} icon="🌙" />
        <HoursRow label="End"   value={end}   icon="☀️" />
      </div>

      <div style={{
        marginTop: 16, padding: 14, background: peep.surface, borderRadius: 14,
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

function DayNightArc() {
  return (
    <div style={{
      width: '100%', maxWidth: 280, aspectRatio: '2.5 / 1', position: 'relative',
    }}>
      {/* arc */}
      <svg viewBox="0 0 250 100" style={{ width: '100%', height: '100%' }}>
        <defs>
          <linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"  stopColor="#3a4a7a" />
            <stop offset="50%" stopColor="#1a2a4a" />
            <stop offset="100%" stopColor="#d49a40" />
          </linearGradient>
        </defs>
        <path d="M 20 90 Q 125 -10, 230 90" stroke="url(#arcGrad)" strokeWidth="2.5" fill="none" />
        {/* dotted active band */}
        <path d="M 20 90 Q 125 -10, 230 90" stroke={peep.accent} strokeWidth="3" fill="none"
          strokeDasharray="3 6" strokeDashoffset="0" opacity="0.5" />
      </svg>
      {/* moon */}
      <div style={{
        position: 'absolute', left: '0%', top: '60%', fontSize: 32,
        transform: 'translate(-50%, -50%)',
        filter: 'drop-shadow(0 0 12px rgba(122,160,196,0.4))',
      }}>🌙</div>
      {/* sun */}
      <div style={{
        position: 'absolute', right: '0%', top: '60%', fontSize: 32,
        transform: 'translate(50%, -50%)',
        filter: 'drop-shadow(0 0 16px rgba(255,200,100,0.5))',
      }}>☀️</div>
      {/* center label */}
      <div style={{
        position: 'absolute', left: '50%', top: '12%', transform: 'translateX(-50%)',
        fontSize: 11, color: peep.textSec, letterSpacing: 0.5, textTransform: 'uppercase',
        fontWeight: 600,
      }}>quiet · 10p → 7a</div>
    </div>
  );
}

function HoursRow({ label, value, icon }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '14px 16px', background: peep.surface, borderRadius: 14,
    }}>
      <span style={{ fontSize: 22 }}>{icon}</span>
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
        <NotifPreview emoji="📦" title="Package taken · 142 Linden"
          body="Refund filed with Amazon. Tap to review →" severity="critical" />
        <NotifPreview emoji="🚶" title="Someone at your door"
          body="Loitering for 8 sec. Tap to see live →" severity="warning" />
        <NotifPreview emoji="🐕" title="Animal · dog"
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

function NotifPreview({ emoji, title, body, severity, muted }) {
  const c = severity === 'critical' ? peep.critical
          : severity === 'warning' ? peep.warning
          : peep.info;
  return (
    <div style={{
      background: 'rgba(36,36,38,0.9)',
      borderRadius: 14, padding: 12,
      border: `0.5px solid ${c}40`,
      display: 'flex', alignItems: 'center', gap: 10,
      opacity: muted ? 0.55 : 1,
    }}>
      <div style={{
        width: 30, height: 30, borderRadius: 7,
        background: c + '33', border: `0.5px solid ${c}60`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 16, flexShrink: 0,
      }}>{emoji}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: peep.textSec }}>PEEP</span>
          <span style={{ fontSize: 10, color: peep.textTer, marginLeft: 'auto' }}>now</span>
        </div>
        <div style={{ fontSize: 12, fontWeight: 600, color: peep.text, marginTop: 1 }}>
          {title}
        </div>
        <div style={{ fontSize: 11, color: peep.textSec, marginTop: 1, lineHeight: 1.4 }}>
          {body}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  OnboardingFlow, OnboardingIntro, OnboardingPair, OnboardingAmazon,
  OnboardingHours, OnboardingPerms,
});
