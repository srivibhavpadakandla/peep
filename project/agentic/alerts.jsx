// Alert subsystem — surfaces critical events on every channel a browser
// has: system notification, audible siren, full-bleed red banner.
//
// Subscribes to PeepEventBus. Each high-severity event_type triggers all
// three channels; a React component (PeepAlertBanner) reads the in-memory
// alert and renders the banner. Sound + notification fire imperatively.

(function () {
  const BUS = window.PeepEventBus;
  if (!BUS) return;

  // ── Which events count as "alert me right now" ──────────────────────
  const HIGH_PRIORITY = new Set([
    'porch_theft',
    'package_fleeing',
    'package_taken',
    'weapon_detected',
  ]);

  // ── Audible siren via Web Audio (no asset download) ─────────────────
  let _ac = null;
  function getAC() {
    if (!_ac) {
      try { _ac = new (window.AudioContext || window.webkitAudioContext)(); }
      catch { _ac = null; }
    }
    return _ac;
  }
  function playSiren({ duration = 1.6 } = {}) {
    const ac = getAC(); if (!ac) return;
    if (ac.state === 'suspended') ac.resume().catch(() => {});
    const now = ac.currentTime;

    // Two-tone "weep-woop" alarm — square wave through a gain envelope.
    const osc = ac.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(880, now);
    const tones = [880, 580, 880, 580, 880, 580];
    tones.forEach((hz, i) => {
      osc.frequency.setValueAtTime(hz, now + i * (duration / tones.length));
    });
    const gain = ac.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.05);
    gain.gain.linearRampToValueAtTime(0.18, now + duration - 0.1);
    gain.gain.linearRampToValueAtTime(0,    now + duration);
    osc.connect(gain).connect(ac.destination);
    osc.start(now);
    osc.stop(now + duration);
  }

  // ── System Notification ────────────────────────────────────────────
  let _notifPerm = (typeof Notification !== 'undefined') ? Notification.permission : 'denied';
  function ensureNotifPermission() {
    if (_notifPerm === 'granted' || _notifPerm === 'denied') return Promise.resolve(_notifPerm);
    return Notification.requestPermission().then(p => { _notifPerm = p; return p; });
  }
  // Try to upgrade permission on first user interaction (browsers require a
  // gesture for both requestPermission and audio context resume).
  document.addEventListener('click', () => {
    ensureNotifPermission().catch(() => {});
    const ac = getAC(); if (ac && ac.state === 'suspended') ac.resume().catch(() => {});
  }, { once: true });

  function fireNotification(title, body) {
    if (typeof Notification === 'undefined') return;
    if (_notifPerm !== 'granted') return;
    try {
      new Notification(title, { body, tag: 'peep-alert', silent: false });
    } catch {}
  }

  // ── Banner state (single source of truth for React renderer) ───────
  const subs = new Set();
  let current = null;            // { id, title, body, sev, ts }
  let dismissTimer = null;
  function publishCurrent() {
    subs.forEach(fn => { try { fn(current); } catch {} });
  }
  function setBanner(b, autoDismissMs = 10000) {
    current = b;
    if (dismissTimer) clearTimeout(dismissTimer);
    publishCurrent();
    if (b && autoDismissMs) {
      dismissTimer = setTimeout(() => {
        current = null; dismissTimer = null; publishCurrent();
      }, autoDismissMs);
    }
  }
  function dismissBanner() { setBanner(null); }

  // ── Listen ─────────────────────────────────────────────────────────
  BUS.subscribe((ev) => {
    if (ev.event_type === 'browser_agent_done') return;
    if (!HIGH_PRIORITY.has(ev.event_type)) return;

    const title = {
      porch_theft:     'Porch theft in progress',
      package_fleeing: 'Suspect fleeing with package',
      package_taken:   'Package taken from porch',
      weapon_detected: 'Weapon detected at door',
    }[ev.event_type] || 'Peep alert';

    const body = `Confidence ${(ev.confidence * 100).toFixed(0)}% · ${new Date(ev.timestamp).toLocaleTimeString()}`;

    setBanner({
      id: `alrt_${Math.random().toString(36).slice(2, 8)}`,
      title, body,
      sev: ev.event_type === 'porch_theft' || ev.event_type === 'weapon_detected'
            ? 'critical' : 'high',
      ts: ev.timestamp,
    });
    playSiren();
    fireNotification(title, body);
    window.PeepLiveLogs?.append?.({
      source: 'alerts',
      text: `${title} · ${body} · siren + system notification fired`,
    });
  });

  // ── React component for the on-screen banner ───────────────────────
  function PeepAlertBanner() {
    const [b, setB] = React.useState(current);
    React.useEffect(() => {
      const fn = (next) => setB(next);
      subs.add(fn);
      return () => subs.delete(fn);
    }, []);
    if (!b) return null;
    const bg = b.sev === 'critical' ? '#7a2030' : '#5a4a25';
    return (
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: bg, color: '#fff',
        padding: '12px 18px',
        display: 'flex', alignItems: 'center', gap: 12,
        boxShadow: '0 4px 24px rgba(0,0,0,0.35)',
        animation: 'peepBannerDrop 350ms cubic-bezier(0.2,0.7,0.3,1) both',
        fontFamily: 'inherit',
      }}>
        <span style={{
          width: 10, height: 10, borderRadius: 999, background: '#fff',
          animation: 'peepPulse 700ms ease-in-out infinite',
        }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{b.title}</div>
          <div style={{ fontSize: 12, opacity: 0.85, marginTop: 1 }}>{b.body}</div>
        </div>
        <button onClick={dismissBanner}
                style={{
                  border: 0, background: 'rgba(255,255,255,0.15)', color: '#fff',
                  padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 12,
                }}>Dismiss</button>
      </div>
    );
  }

  window.PeepAlerts = {
    setBanner, dismissBanner, playSiren, fireNotification,
    ensureNotifPermission,
    subscribe(fn) { subs.add(fn); return () => subs.delete(fn); },
    getCurrent() { return current; },
  };
  window.PeepAlertBanner = PeepAlertBanner;
})();
