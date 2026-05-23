/* Peep — atoms, motion, screen chrome */

// ───────── Press: scale + opacity on tap ─────────
function Press({ children, onTap, onLongPress, longPressMs = 500, style, hoverable = true, ...rest }) {
  const [down, setDown] = React.useState(false);
  const timer = React.useRef(null);
  const fired = React.useRef(false);

  const start = (e) => {
    setDown(true);
    fired.current = false;
    if (onLongPress) {
      timer.current = setTimeout(() => {
        fired.current = true;
        onLongPress();
        if (window.navigator.vibrate) navigator.vibrate(30);
      }, longPressMs);
    }
  };
  const end = (e) => {
    setDown(false);
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
  };
  const click = (e) => {
    if (!fired.current && onTap) onTap(e);
  };

  return (
    <div
      onMouseDown={start} onMouseUp={end} onMouseLeave={end}
      onTouchStart={start} onTouchEnd={end} onTouchCancel={end}
      onClick={click}
      style={{
        cursor: 'pointer', userSelect: 'none',
        transform: down ? 'scale(0.97)' : 'scale(1)',
        opacity: down ? 0.75 : 1,
        transition: 'transform .12s cubic-bezier(.2,.7,.3,1), opacity .12s',
        WebkitTapHighlightColor: 'transparent',
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

// ───────── Toast queue (mounted via portal-like approach) ─────────
const ToastContext = React.createContext(() => {});

// Expert mode — when on, surfaces raw confidence numbers, metadata keys, agent log labels.
const ExpertModeContext = React.createContext(false);
const useExpert = () => React.useContext(ExpertModeContext);

function ToastHost({ children }) {
  const [toasts, setToasts] = React.useState([]);
  const push = React.useCallback((msg, opts = {}) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(t => [...t, { id, msg, icon: opts.icon, accent: opts.accent || peep.accent }]);
    setTimeout(() => {
      setToasts(t => t.filter(x => x.id !== id));
    }, opts.duration || 3000);
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div style={{
        position: 'absolute', left: 16, right: 16, bottom: 100, zIndex: 100,
        display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center',
        pointerEvents: 'none',
      }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            background: 'rgba(28,28,30,0.94)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            color: peep.text, padding: '10px 14px', borderRadius: 14,
            boxShadow: '0 8px 28px rgba(0,0,0,0.4), 0 0 0 0.5px rgba(255,255,255,0.08) inset',
            display: 'flex', alignItems: 'center', gap: 10, maxWidth: 320,
            animation: 'peepToastIn .25s cubic-bezier(.2,.7,.3,1) both',
            fontSize: 13, fontWeight: 500,
          }}>
            {t.icon && <span style={{ fontSize: 16 }}>{t.icon}</span>}
            <span style={{ flex: 1 }}>{t.msg}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

const useToast = () => React.useContext(ToastContext);

// ───────── SeverityBadge ─────────
function SeverityBadge({ severity, size = 'sm' }) {
  const c = sevColor(severity);
  const fs = size === 'lg' ? 11 : 10;
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 8px', borderRadius: 999,
      background: c + '22', border: `0.5px solid ${c}59`,
    }}>
      <div style={{ width: 5, height: 5, borderRadius: 999, background: c }} />
      <span style={{ fontSize: fs, fontWeight: 600, letterSpacing: 0.6, color: c }}>
        {sevLabel(severity)}
      </span>
    </div>
  );
}

function Card({ children, style }) {
  return (
    <div style={{ background: peep.surface, borderRadius: 14, padding: 14, ...style }}>
      {children}
    </div>
  );
}

// ───────── Screen chrome ─────────
function Screen({ children, title, hideTitle, backTitle, onBack, rightAction, noScroll }) {
  return (
    <div style={{
      width: '100%', height: '100%', background: peep.bg, color: peep.text,
      fontFamily: '-apple-system, "SF Pro", system-ui',
      display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative',
    }}>
      <div style={{ height: 54, flexShrink: 0 }} />
      {(backTitle || rightAction) && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '4px 14px 6px', flexShrink: 0, minHeight: 32,
        }}>
          {backTitle ? (
            <Press onTap={onBack} style={{
              display: 'flex', alignItems: 'center', gap: 2,
              color: peep.accent, fontSize: 17, fontWeight: 400,
              padding: '4px 6px 4px 0',
            }}>
              <span style={{ fontSize: 22, lineHeight: 1, marginRight: 2 }}>‹</span>
              <span>{backTitle}</span>
            </Press>
          ) : <span />}
          {rightAction || <span />}
        </div>
      )}
      {!hideTitle && title && (
        <div style={{
          padding: '4px 20px 8px', flexShrink: 0,
          fontSize: 34, fontWeight: 700, letterSpacing: 0.4,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span>{title}</span>
        </div>
      )}
      <div style={{
        flex: 1, overflowY: noScroll ? 'hidden' : 'auto', paddingBottom: noScroll ? 0 : 84,
        WebkitOverflowScrolling: 'touch',
      }}>
        {children}
      </div>
    </div>
  );
}

// ───────── Horizontal scroll chips with right-edge fade ─────────
function HScrollChips({ children, padding = 20 }) {
  const ref = React.useRef(null);
  const [atEnd, setAtEnd] = React.useState(false);

  const check = () => {
    const el = ref.current; if (!el) return;
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
  };
  React.useEffect(() => {
    check();
    const el = ref.current;
    if (!el) return;
    el.addEventListener('scroll', check, { passive: true });
    return () => el.removeEventListener('scroll', check);
  }, []);

  return (
    <div style={{ position: 'relative' }}>
      <div ref={ref} style={{
        display: 'flex', gap: 8, overflowX: 'auto',
        padding: `0 ${padding}px 4px`,
        scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch',
      }}>
        {React.Children.map(children, (c, i) => (
          <div key={i} style={{ flexShrink: 0 }}>{c}</div>
        ))}
      </div>
      {!atEnd && (
        <div style={{
          position: 'absolute', right: 0, top: 0, bottom: 0, width: 36,
          background: `linear-gradient(90deg, transparent, ${peep.bg})`,
          pointerEvents: 'none',
        }} />
      )}
    </div>
  );
}


function TabBar({ active, onChange }) {
  const items = [
    { key: 'live',      label: 'Live' },
    { key: 'activity',  label: 'Activity' },
    { key: 'community', label: 'Community' },
    { key: 'inbox',     label: 'Inbox' },
    { key: 'settings',  label: 'Settings' },
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
          <Press key={it.key} onTap={() => onChange(it.key)} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 3, color: on ? peep.accent : peep.textTer,
            padding: '4px 6px',
          }}>
            <TabGlyph kind={it.key} on={on} />
            <span style={{ fontSize: 10, fontWeight: 500 }}>{it.label}</span>
          </Press>
        );
      })}
    </div>
  );
}

function TabGlyph({ kind, on }) {
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
  if (kind === 'community') return (
    <svg width={w} height={h} viewBox="0 0 24 24">
      <circle cx="7"  cy="9"  r="3" fill={c}/>
      <circle cx="17" cy="9"  r="3" fill={c}/>
      <circle cx="12" cy="6.5" r="3.2" fill={c}/>
      <path fill={c} d="M2 19c0-2.8 2.2-5 5-5s5 2.2 5 5v1H2v-1zm10 0c0-2.8 2.2-5 5-5s5 2.2 5 5v1H12v-1z"/>
    </svg>
  );
  return (
    <svg width={w} height={h} viewBox="0 0 24 24"><path fill={c} d="M19.5 12a7.5 7.5 0 00-.12-1.34l2.04-1.59-2-3.46-2.4.96a7.5 7.5 0 00-2.32-1.34L14.4 3h-4l-.3 2.23a7.5 7.5 0 00-2.32 1.34l-2.4-.96-2 3.46 2.04 1.59A7.5 7.5 0 004.5 12c0 .46.04.9.12 1.34l-2.04 1.59 2 3.46 2.4-.96a7.5 7.5 0 002.32 1.34L9.6 21h4l.3-2.23a7.5 7.5 0 002.32-1.34l2.4.96 2-3.46-2.04-1.59c.08-.44.12-.88.12-1.34zM12 15.5a3.5 3.5 0 110-7 3.5 3.5 0 010 7z"/></svg>
  );
}

// ───────── Push/pop screen transitions ─────────
// Stack of screens; new screens slide in from the right.
function ScreenStack({ stack }) {
  const [prevLen, setPrevLen] = React.useState(stack.length);
  const direction = stack.length > prevLen ? 'push' : (stack.length < prevLen ? 'pop' : 'same');

  React.useEffect(() => { setPrevLen(stack.length); }, [stack.length]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      {stack.map((entry, i) => {
        const isTop = i === stack.length - 1;
        const isPrev = i === stack.length - 2;
        let anim = 'none';
        if (isTop && direction === 'push') anim = 'peepPushIn .28s cubic-bezier(.2,.7,.3,1) both';
        if (isPrev && direction === 'pop') anim = 'peepPushIn .28s cubic-bezier(.2,.7,.3,1) reverse both';
        return (
          <div key={entry.key} style={{
            position: 'absolute', inset: 0,
            animation: anim,
            zIndex: i,
            visibility: i < stack.length - 1 && direction !== 'pop' ? 'hidden' : 'visible',
          }}>
            {entry.node}
          </div>
        );
      })}
    </div>
  );
}

// ───────── Tab content fade ─────────
function TabSwitcher({ children, tabKey }) {
  return (
    <div key={tabKey} style={{
      width: '100%', height: '100%',
      animation: 'peepFade .22s ease both',
    }}>
      {children}
    </div>
  );
}

// ───────── Modal sheet (bottom slide-up) ─────────
function Sheet({ open, onClose, title, children, height = '70%' }) {
  if (!open) return null;
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 80,
      display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
      animation: 'peepFade .18s ease both',
    }}>
      <Press onTap={onClose} style={{
        position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)',
      }}><span /></Press>
      <div style={{
        position: 'relative', background: '#1C1C1E', color: peep.text,
        borderRadius: '20px 20px 0 0', maxHeight: height, minHeight: 200,
        padding: '8px 0 24px',
        boxShadow: '0 -8px 32px rgba(0,0,0,0.4)',
        animation: 'peepSheetUp .26s cubic-bezier(.2,.7,.3,1) both',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ width: 36, height: 5, borderRadius: 999, background: peep.textTer, alignSelf: 'center', marginBottom: 8 }} />
        {title && <div style={{ padding: '4px 20px 12px', fontSize: 17, fontWeight: 600, textAlign: 'center' }}>{title}</div>}
        <div style={{ flex: 1, overflowY: 'auto' }}>{children}</div>
      </div>
    </div>
  );
}

// ───────── Toggle ─────────
function Toggle({ on, onChange }) {
  return (
    <div onClick={() => onChange(!on)} style={{
      width: 51, height: 31, borderRadius: 999,
      background: on ? peep.accent : 'rgba(120,120,128,0.32)',
      position: 'relative', transition: 'background .15s',
      cursor: 'pointer', userSelect: 'none', flexShrink: 0,
    }}>
      <div style={{
        position: 'absolute', top: 2, left: on ? 22 : 2,
        width: 27, height: 27, borderRadius: 999, background: '#fff',
        boxShadow: '0 3px 8px rgba(0,0,0,0.2)',
        transition: 'left .18s cubic-bezier(.2,.7,.3,1)',
      }} />
    </div>
  );
}

function TimePill({ text, onTap }) {
  return (
    <Press onTap={onTap} style={{
      background: peep.surface2, borderRadius: 7,
      padding: '4px 10px', fontSize: 14, color: peep.text,
    }}>{text}</Press>
  );
}

function Sep() {
  return <div style={{ height: 0.5, background: peep.sep, marginLeft: 16 }} />;
}

function SRow({ label, trailing, last, onTap }) {
  const content = (
    <div style={{
      display: 'flex', alignItems: 'center', minHeight: 44,
      padding: '8px 16px', borderBottom: last ? 'none' : `0.5px solid ${peep.sep}`,
    }}>
      <div style={{ flex: 1, fontSize: 15, display: 'flex', alignItems: 'center' }}>{label}</div>
      {trailing}
    </div>
  );
  if (onTap) return <Press onTap={onTap}>{content}</Press>;
  return content;
}

function SettingsSection({ title, children, footer }) {
  return (
    <div>
      <div style={{
        padding: '0 36px 6px', fontSize: 13,
        color: peep.textSec, textTransform: 'uppercase', letterSpacing: -0.08,
      }}>{title}</div>
      <div style={{
        margin: '0 16px', background: peep.surface, borderRadius: 12, overflow: 'hidden',
      }}>{children}</div>
      {footer && (
        <div style={{ padding: '6px 36px 0', fontSize: 12, color: peep.textSec }}>{footer}</div>
      )}
    </div>
  );
}

// ───────── Slider (drag) ─────────
function Slider({ value, onChange }) {
  const ref = React.useRef(null);
  const [dragging, setDragging] = React.useState(false);

  const update = (clientX) => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const v = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
    onChange(v);
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
      style={{ height: 28, display: 'flex', alignItems: 'center', position: 'relative', cursor: 'pointer' }}>
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

// ───────── ActionRow with confirm-on-long-press ─────────
function ActionRow({ icon, title, destructive, onTap, onConfirm }) {
  const [confirming, setConfirming] = React.useState(false);
  const c = destructive ? peep.critical : peep.text;
  const bg = destructive ? peep.critical + '26' : peep.surface;

  if (confirming) {
    return (
      <div style={{
        background: bg, borderRadius: 14, padding: '13px 16px',
        display: 'flex', alignItems: 'center', gap: 10,
        animation: 'peepFade .2s ease both',
      }}>
        <span style={{ fontSize: 13, color: peep.textSec, flex: 1 }}>Confirm?</span>
        <Press onTap={() => setConfirming(false)} style={{
          padding: '6px 12px', fontSize: 13, fontWeight: 600, color: peep.textSec,
        }}>Cancel</Press>
        <Press onTap={() => { setConfirming(false); onConfirm && onConfirm(); }} style={{
          padding: '6px 12px', fontSize: 13, fontWeight: 600, color: c,
          background: c + '33', borderRadius: 8,
        }}>{title}</Press>
      </div>
    );
  }

  return (
    <Press onTap={onTap}
           onLongPress={destructive ? () => setConfirming(true) : undefined}
           style={{
      background: bg, borderRadius: 14, padding: '13px 16px',
      display: 'flex', alignItems: 'center', gap: 12, color: c,
    }}>
      <span style={{ fontSize: 15, fontWeight: 600, width: 18, textAlign: 'center' }}>{icon}</span>
      <span style={{ fontSize: 15, fontWeight: 600 }}>{title}</span>
      {destructive && (
        <span style={{ fontSize: 10, color: peep.textTer, marginLeft: 'auto' }}>hold to confirm</span>
      )}
    </Press>
  );
}

Object.assign(window, {
  Press, ToastHost, useToast,
  ExpertModeContext, useExpert,
  SeverityBadge, Card, Screen, TabBar, HScrollChips,
  ScreenStack, TabSwitcher, Sheet,
  Toggle, TimePill, Sep, SRow, SettingsSection, Slider, ActionRow,
});
