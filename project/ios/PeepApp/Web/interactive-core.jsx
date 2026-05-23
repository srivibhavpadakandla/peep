/* Peep — atoms, motion, screen chrome */

// ───────── Owl brand mark (from owl-logo.svg) ─────────
function OwlLogo({ size = 80, color, style }) {
  const c = color || peep.text;
  return (
    <svg width={size} height={size * (174/121)} viewBox="0 0 121 174"
      fill={c} style={style}>
      <path d="M23.8482 174C24.8726 168.244 26.519 166.066 31.1617 163.85H55.269V174H23.8482Z"/>
      <path d="M91.3849 174C90.3605 168.244 88.7141 166.066 84.0715 163.85H59.9641V174H91.3849Z"/>
      <path d="M44.4343 145.363H55.269V165.663H44.4343V145.363Z"/>
      <path d="M59.9641 145.363H70.7989V165.663H59.9641V145.363Z"/>
      <path d="M66.465 145.363H78.3832V155.875H66.465V145.363Z"/>
      <path d="M0.914581 76.4875H11.2076C14.578 112.914 21.0005 130.074 54.9079 145.906L44.7954 151.706C11.4609 134.662 2.68196 117.562 0.914581 76.4875Z"/>
      <path d="M8.31834 30.2688L15.1804 36.0688C10.4429 40.2439 9.33289 48.2199 11.2076 76.4875H0.733995C-1.38809 45.8237 1.07666 37.6995 8.31834 30.2688Z"/>
      <path d="M10.2591 55.826C10.8008 55.6447 23.9227 80.4528 45.111 75.7635L58.4739 89.5385C28.6482 89.6303 18.2103 86.9499 10.9814 77.2135C10.9814 77.2135 9.71737 56.0072 10.2591 55.826Z"/>
      <path d="M22.223 42.05H32.1548C29.0021 47.2391 27.6461 52.5793 29.9879 65.25C25.1451 64.1382 23.8754 62.2231 20.7784 56.7313C18.1417 50.1072 20.2703 46.077 22.223 42.05Z"/>
      <path d="M40.3211 65.4312L31.9741 60.175C35.2562 55.0673 42.3438 55.9183 40.3211 43.1923C45.9518 45.4937 47.4837 48.5566 48.0458 51.2938C48.1401 61.2941 38.0326 66.9335 40.3211 65.4312Z"/>
      <path d="M28.0015 54.7375H38.8363L40.1003 65.4313L29.9879 65.25L28.0015 54.7375Z"/>
      <path d="M37.9037 56.9629C37.9037 56.9629 31.0089 57.1843 28.3264 54.3061C25.6439 51.4278 27.8791 46.8171 27.8791 46.8171C28.7355 52.8852 31.7244 54.56 37.9037 56.9629Z"/>
      <path d="M98.6113 42.05H89.2396C92.2145 47.2391 93.494 52.5793 91.2843 65.25C95.854 64.1382 97.0521 62.2231 99.9744 56.7313C102.462 50.1072 100.454 46.077 98.6113 42.05Z"/>
      <path d="M81.5339 65.4312L89.4102 60.175C86.3132 55.0673 79.6254 55.9183 81.534 43.1923C76.2209 45.4937 74.7753 48.5566 74.245 51.2938C74.1559 61.2941 83.6934 66.9335 81.5339 65.4312Z"/>
      <path d="M93.1587 54.7375H82.935L81.7423 65.4313L91.2843 65.25L93.1587 54.7375Z"/>
      <path d="M83.815 56.9629C83.815 56.9629 90.321 57.1843 92.8521 54.3061C95.3833 51.4278 93.2742 46.8171 93.2742 46.8171C92.4662 52.8852 89.6458 54.56 83.815 56.9629Z"/>
      <path d="M110.526 104.4H121V174H110.526V104.4Z"/>
      <path d="M57.436 119.625H67.721C78.7774 143.376 86.6014 154.65 111.249 161.312V174C78.6664 159.524 65.3631 147.991 57.436 119.625Z"/>
      <path d="M57.436 104.4H68.2708V120.894L57.6166 120.35L57.436 119.72V104.4Z"/>
      <path d="M90.1209 82.2875C101.653 79.0303 108.301 81.3096 121 104.4H110.526C96.842 83.1133 79.0708 85.67 67.729 104.4L57.436 104.4C66.2416 81.4836 73.7249 77.8198 90.1209 82.2875Z"/>
      <path d="M82.8977 77.575C98.6783 76.2626 95.2788 74.8213 103.664 70.1438L104.567 83.375L78.0221 82.4688C73.4508 82.1018 74.5198 81.0296 82.8977 77.575Z"/>
      <path d="M106.192 35.8875L114.319 30.2688C123.117 55.9231 123.135 68.0991 104.387 81.3813L103.664 70.1438C113.647 56.7714 110.323 49.2686 106.192 35.8875Z"/>
      <path fillRule="evenodd" clipRule="evenodd" d="M119.194 5.8C117.281 20.4403 111.769 24.3245 101.859 31.175C79.556 33.5418 73.6475 37.3077 69.5348 46.4H51.838C45.9827 35.1426 36.6938 33.7497 20.2366 31.175C5.50081 24.1193 3.57644 17.6232 0.734001 5.8V0C21.3177 9.08844 34.3284 8.94288 59.9641 0C86.1914 9.47202 98.9763 8.90825 119.194 0V5.8ZM34.683 16.3125L14.0969 15.0438L23.487 23.7438C47.261 26.9823 50.544 27.2865 60.3253 45.4938C66.4678 31.1978 71.7903 28.0053 101.136 22.1125L106.915 13.775L92.2878 16.3125L61.2282 10.5125L34.683 16.3125Z"/>
      <path d="M51.6574 46.4H69.3542C68.7669 55.8416 68.5271 61.4507 67.3679 68.875C65.375 74.2631 63.9477 76.7686 60.5058 79.75C56.1153 75.3898 55.9914 72.8625 54.5467 68.875C54.1856 66.8812 52.418 59.6132 51.6574 46.4Z"/>
    </svg>
  );
}

// ───────── Phosphor icon helper ─────────
function Icon({ name, size = 18, weight = 'regular', color, style }) {
  // Phosphor weights: thin, light, regular, bold, fill, duotone
  const cls = weight === 'regular' ? `ph ph-${name}` : `ph-${weight} ph-${name}`;
  return (
    <i className={cls} style={{
      fontSize: size, lineHeight: 1, color: color || 'inherit',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      ...style,
    }} />
  );
}

// ───────── Peep app icon (iOS squircle with owl) ─────────
function PeepAppIcon({ size = 60, style }) {
  return (
    <div style={{
      width: size, height: size,
      borderRadius: size * 0.22, // iOS squircle-ish
      background: `linear-gradient(155deg, ${peep.surface2} 0%, ${peep.bg} 100%)`,
      boxShadow: `inset 0 1px 0 rgba(255,255,255,0.06), 0 4px 12px rgba(0,0,0,0.35), 0 0 0 0.5px rgba(255,255,255,0.08)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden', flexShrink: 0,
      ...style,
    }}>
      {/* gold gleam in the corner */}
      <div style={{
        position: 'absolute', top: -size * 0.2, right: -size * 0.2,
        width: size * 0.6, height: size * 0.6, borderRadius: '50%',
        background: `radial-gradient(circle, ${peep.accent}66, transparent 70%)`,
      }} />
      <OwlLogo size={size * 0.62} color={peep.text} />
    </div>
  );
}

function OwlWatermark({ opacity = 0.06, color }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, overflow: 'hidden',
      pointerEvents: 'none', opacity,
    }}>
      <div style={{
        position: 'absolute', left: '50%', top: '52%',
        transform: 'translate(-50%, -50%)',
      }}>
        <OwlLogo size={620} color={color || '#d8dad0'} />
      </div>
    </div>
  );
}

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
            background: peep.text,
            color: peep.bg, padding: '10px 14px', borderRadius: 12,
            boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
            display: 'flex', alignItems: 'center', gap: 10, maxWidth: 320,
            animation: 'peepToastIn .25s cubic-bezier(.2,.7,.3,1) both',
            fontSize: 14, fontWeight: 400,
          }}>
            {t.icon && (
              typeof t.icon === 'string' && t.icon.length > 3
                ? <Icon name={t.icon} size={16} weight="fill" color={t.accent || peep.accent} />
                : <span style={{ fontSize: 16 }}>{t.icon}</span>
            )}
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
  return (
    <span style={{
      fontSize: 12, fontWeight: 500, color: c,
    }}>
      {sevLabel(severity)}
    </span>
  );
}

function Card({ children, style }) {
  return (
    <div style={{
      background: peep.surface, borderRadius: 12, padding: 16,
      border: `0.5px solid ${peep.sep}`,
      ...style,
    }}>
      {children}
    </div>
  );
}

// ───────── Screen chrome ─────────
function Screen({ children, title, hideTitle, backTitle, onBack, rightAction, noScroll }) {
  return (
    <div style={{
      width: '100%', height: '100%', background: peep.bg, color: peep.text,
      fontFamily: "'Inter', -apple-system, system-ui, sans-serif",
      display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative',
    }}>
      <div style={{ height: 54, flexShrink: 0 }} />
      {(backTitle || rightAction) && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '4px 16px 6px', flexShrink: 0, minHeight: 32,
        }}>
          {backTitle ? (
            <Press onTap={onBack} style={{
              display: 'flex', alignItems: 'center', gap: 2,
              color: peep.accent, fontSize: 16, fontWeight: 400,
              padding: '4px 6px 4px 0',
            }}>
              <span style={{ fontSize: 20, lineHeight: 1, marginRight: 2 }}>‹</span>
              <span>{backTitle}</span>
            </Press>
          ) : <span />}
          {rightAction || <span />}
        </div>
      )}
      {!hideTitle && title && (
        <div style={{
          padding: '8px 20px 14px', flexShrink: 0,
          fontSize: 28, fontWeight: 500, letterSpacing: -0.4,
        }}>{title}</div>
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
      paddingTop: 10, paddingBottom: 26,
      background: 'rgba(245,243,236,0.94)',
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
            gap: 2, color: on ? peep.text : peep.textTer,
            padding: '4px 8px',
          }}>
            <TabGlyph kind={it.key} on={on} />
            <span style={{ fontSize: 10, fontWeight: 400 }}>{it.label}</span>
          </Press>
        );
      })}
    </div>
  );
}

function TabGlyph({ kind, on }) {
  const c = on ? peep.text : peep.textTer;
  const w = 22, h = 22;
  if (kind === 'live') return (
    <svg width={w} height={h} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={on ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M3 11l9-7 9 7v9a1 1 0 01-1 1h-4v-7h-8v7H4a1 1 0 01-1-1z"/></svg>
  );
  if (kind === 'activity') return (
    <svg width={w} height={h} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={on ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M18 16v-5a6 6 0 10-12 0v5l-2 2v1h16v-1zM10 21a2 2 0 004 0"/></svg>
  );
  if (kind === 'inbox') return (
    <svg width={w} height={h} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={on ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M4 14h5l1 2h4l1-2h5M4 14V5a1 1 0 011-1h14a1 1 0 011 1v9m-16 0v5a1 1 0 001 1h14a1 1 0 001-1v-5"/></svg>
  );
  if (kind === 'community') return (
    <svg width={w} height={h} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={on ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="3"/><circle cx="5"  cy="11" r="2.4"/><circle cx="19" cy="11" r="2.4"/><path d="M3 19c0-2.2 1.8-4 4-4M21 19c0-2.2-1.8-4-4-4M7 21c0-2.8 2.2-5 5-5s5 2.2 5 5"/></svg>
  );
  return (
    <svg width={w} height={h} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={on ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 008.91 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 8.91a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
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
        position: 'relative', background: peep.surface, color: peep.text,
        borderRadius: '12px 12px 0 0', maxHeight: height, minHeight: 200,
        padding: '8px 0 24px',
        marginBottom: 70,  // sit above the tab bar so content isn't clipped
        animation: 'peepSheetUp .26s cubic-bezier(.2,.7,.3,1) both',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ width: 36, height: 4, borderRadius: 999, background: peep.textTer, alignSelf: 'center', marginBottom: 8 }} />
        {title && <div style={{ padding: '4px 20px 12px', fontSize: 16, fontWeight: 500 }}>{title}</div>}
        <div style={{ flex: 1, overflowY: 'auto' }}>{children}</div>
      </div>
    </div>
  );
}

// ───────── Toggle ─────────
function Toggle({ on, onChange }) {
  return (
    <div onClick={() => onChange(!on)} style={{
      width: 44, height: 26, borderRadius: 999,
      background: on ? peep.text : peep.surface3,
      position: 'relative', transition: 'background .15s',
      cursor: 'pointer', userSelect: 'none', flexShrink: 0,
    }}>
      <div style={{
        position: 'absolute', top: 2, left: on ? 20 : 2,
        width: 22, height: 22, borderRadius: 999, background: peep.bg,
        boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
        transition: 'left .18s cubic-bezier(.2,.7,.3,1)',
      }} />
    </div>
  );
}

function TimePill({ text, onTap }) {
  return (
    <Press onTap={onTap} style={{
      background: peep.surface2, borderRadius: 8,
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
      padding: '10px 16px', borderBottom: last ? 'none' : `0.5px solid ${peep.sep}`,
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
      {title && (
        <div style={{
          padding: '0 20px 8px', fontSize: 13,
          color: peep.textSec, fontWeight: 500,
        }}>{title}</div>
      )}
      <div style={{
        margin: '0 16px',
        background: peep.surface, borderRadius: 12,
        border: `0.5px solid ${peep.sep}`, overflow: 'hidden',
      }}>{children}</div>
      {footer && (
        <div style={{ padding: '8px 20px 0', fontSize: 12, color: peep.textSec, lineHeight: 1.5 }}>{footer}</div>
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
      style={{ height: 24, display: 'flex', alignItems: 'center', position: 'relative', cursor: 'pointer' }}>
      <div style={{ position: 'absolute', left: 0, right: 0, height: 2, background: peep.surface3, borderRadius: 999 }} />
      <div style={{ position: 'absolute', left: 0, width: `${value * 100}%`, height: 2, background: peep.text, borderRadius: 999 }} />
      <div style={{
        position: 'absolute', left: `calc(${value * 100}% - 10px)`,
        width: 20, height: 20, borderRadius: 999, background: peep.bg,
        border: `0.5px solid ${peep.sep}`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
      }} />
    </div>
  );
}

// ───────── ActionRow — text-first, no icon ─────────
function ActionRow({ title, destructive, onTap, onConfirm }) {
  const [confirming, setConfirming] = React.useState(false);
  const c = destructive ? peep.critical : peep.text;

  if (confirming) {
    return (
      <div style={{
        background: peep.surface, borderRadius: 10,
        padding: '12px 14px',
        border: `0.5px solid ${c}`,
        display: 'flex', alignItems: 'center', gap: 10,
        animation: 'peepFade .2s ease both',
      }}>
        <span style={{ fontSize: 13, color: peep.textSec, flex: 1 }}>Confirm?</span>
        <Press onTap={() => setConfirming(false)} style={{
          padding: '5px 10px', fontSize: 13, color: peep.textSec,
        }}>Cancel</Press>
        <Press onTap={() => { setConfirming(false); onConfirm && onConfirm(); }} style={{
          padding: '5px 10px', fontSize: 13, fontWeight: 500, color: c,
        }}>{title}</Press>
      </div>
    );
  }

  return (
    <Press onTap={onTap}
           onLongPress={destructive ? () => setConfirming(true) : undefined}
           style={{
      background: peep.surface, borderRadius: 10, padding: '12px 14px',
      border: `0.5px solid ${peep.sep}`,
      display: 'flex', alignItems: 'center', color: c,
    }}>
      <span style={{ fontSize: 15, fontWeight: 400 }}>{title}</span>
      {destructive && (
        <span style={{ fontSize: 11, color: peep.textTer, marginLeft: 'auto' }}>hold to confirm</span>
      )}
    </Press>
  );
}

Object.assign(window, {
  OwlLogo, OwlWatermark, PeepAppIcon, Icon,
  Press, ToastHost, useToast,
  ExpertModeContext, useExpert,
  SeverityBadge, Card, Screen, TabBar, HScrollChips,
  ScreenStack, TabSwitcher, Sheet,
  Toggle, TimePill, Sep, SRow, SettingsSection, Slider, ActionRow,
});
