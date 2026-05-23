/* Peep — Activity screen with filter chips + sticky headers + empty state + pull-to-refresh */

// ───────── Pull-to-refresh wrapper ─────────
function PullToRefresh({ onRefresh, children }) {
  const containerRef = React.useRef(null);
  const [pull, setPull] = React.useState(0);          // current pull distance (px)
  const [refreshing, setRefreshing] = React.useState(false);
  const startY = React.useRef(null);
  const armed = React.useRef(false);

  const threshold = 64;

  const onStart = (clientY) => {
    if (!containerRef.current) return;
    if (containerRef.current.scrollTop <= 0) {
      startY.current = clientY;
      armed.current = true;
    }
  };
  const onMove = (clientY) => {
    if (!armed.current || refreshing) return;
    const delta = clientY - startY.current;
    if (delta < 0) { setPull(0); return; }
    // dampened pull
    const damped = Math.min(120, delta * 0.55);
    setPull(damped);
  };
  const onEnd = () => {
    if (!armed.current) return;
    armed.current = false;
    if (pull >= threshold) {
      setRefreshing(true);
      setPull(threshold);
      const done = onRefresh && onRefresh();
      const finish = () => {
        setRefreshing(false);
        setPull(0);
      };
      if (done && typeof done.then === 'function') {
        done.then(finish);
      } else {
        setTimeout(finish, 900);
      }
    } else {
      setPull(0);
    }
  };

  const progress = Math.min(1, pull / threshold);

  return (
    <div style={{ position: 'relative', height: '100%' }}>
      {/* Spinner */}
      <div style={{
        position: 'absolute', top: 8, left: 0, right: 0, zIndex: 4,
        display: 'flex', justifyContent: 'center',
        opacity: pull > 0 || refreshing ? 1 : 0,
        transition: refreshing ? 'opacity .15s' : 'none',
      }}>
        <RefreshSpinner progress={progress} spinning={refreshing} />
      </div>
      <div
        ref={containerRef}
        onTouchStart={e => onStart(e.touches[0].clientY)}
        onTouchMove={e => onMove(e.touches[0].clientY)}
        onTouchEnd={onEnd}
        onMouseDown={e => onStart(e.clientY)}
        onMouseMove={e => { if (armed.current) onMove(e.clientY); }}
        onMouseUp={onEnd}
        onMouseLeave={onEnd}
        style={{
          height: '100%', overflowY: 'auto', WebkitOverflowScrolling: 'touch',
          transform: `translateY(${pull}px)`,
          transition: armed.current ? 'none' : 'transform .3s cubic-bezier(.2,.7,.3,1)',
        }}
      >
        {children}
      </div>
    </div>
  );
}

function RefreshSpinner({ progress, spinning }) {
  return (
    <div style={{
      width: 32, height: 32, borderRadius: 999,
      background: peep.surface, border: `0.5px solid ${peep.sep}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
    }}>
      <svg width="18" height="18" viewBox="0 0 24 24"
        style={{
          transform: spinning ? 'rotate(0deg)' : `rotate(${progress * 360}deg)`,
          animation: spinning ? 'peepSpin 0.9s linear infinite' : 'none',
        }}>
        <circle cx="12" cy="12" r="9"
          fill="none" stroke={peep.accent} strokeWidth="2.5"
          strokeDasharray="56.5" strokeDashoffset={56.5 * (1 - progress)}
          strokeLinecap="round" transform="rotate(-90 12 12)" />
      </svg>
    </div>
  );
}

function EventRow({ ev, onTap, highlight }) {
  const m = eventMeta[ev.type];
  const c = sevColor(m.severity);
  const expert = useExpert();
  return (
    <Press onTap={onTap} style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 14px', background: peep.surface, borderRadius: 14,
      animation: highlight ? 'peepHighlight 2s ease both' : undefined,
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: c + '24', border: `0.5px solid ${c}40`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 22, flexShrink: 0,
      }}>{m.emoji}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 500 }}>{m.label}</div>
        <div style={{ display: 'flex', gap: 6, marginTop: 2, fontSize: 11, color: peep.textSec }}>
          <span>{ev.time}</span><span>·</span>
          {expert ? (
            <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
              conf {ev.conf.toFixed(2)}
            </span>
          ) : (
            <span>{confidenceLabel(ev.conf)}</span>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
        <SeverityBadge severity={m.severity} />
        <span style={{ color: peep.textTer, fontSize: 10 }}>›</span>
      </div>
    </Press>
  );
}

function FilterChips({ value, onChange, counts }) {
  return (
    <HScrollChips>
      {FILTERS.map(f => {
        const on = f.key === value;
        return (
          <Press key={f.key} onTap={() => onChange(f.key)} style={{
            padding: '6px 14px', borderRadius: 999,
            background: on ? peep.accent : peep.surface,
            color: on ? '#000' : peep.text,
            fontSize: 13, fontWeight: 600,
            border: on ? 'none' : `0.5px solid ${peep.sep}`,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <span>{f.label}</span>
            <span style={{
              fontSize: 11, opacity: 0.7,
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            }}>{counts[f.key]}</span>
          </Press>
        );
      })}
    </HScrollChips>
  );
}

function ActivityScreen({ onOpenEvent, recentlyReceivedOrderID }) {
  const [filter, setFilter] = React.useState('all');
  const [refreshTick, setRefreshTick] = React.useState(0);
  const toast = useToast();

  const handleRefresh = () => {
    // simulate a refresh
    return new Promise(resolve => {
      setTimeout(() => {
        setRefreshTick(n => n + 1);
        toast('Activity refreshed.', { icon: '↻' });
        resolve();
      }, 900);
    });
  };

  const allEvents = React.useMemo(() => [
    ...TODAY_EVENTS.map(e => ({ ...e, day: 'Today' })),
    ...YEST_EVENTS.map(e => ({ ...e, day: 'Yesterday' })),
  ], [refreshTick]);

  const counts = React.useMemo(() => {
    const c = { all: allEvents.length };
    for (const f of FILTERS.slice(1)) {
      c[f.key] = allEvents.filter(e => eventMeta[e.type].category === f.key).length;
    }
    return c;
  }, [allEvents]);

  const filtered = filter === 'all' ? allEvents : allEvents.filter(e => eventMeta[e.type].category === filter);

  const today = filtered.filter(e => e.day === 'Today');
  const yesterday = filtered.filter(e => e.day === 'Yesterday');

  // Cross-screen highlight: if user just received a delivery in Inbox,
  // highlight the matching package_arrived event briefly.
  const highlightId = recentlyReceivedOrderID
    ? today.find(e => e.type === 'package_arrived')?.id
    : null;

  if (filtered.length === 0) {
    return (
      <Screen title="Activity">
        <FilterChips value={filter} onChange={setFilter} counts={counts} />
        <div style={{
          padding: 40, display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: 16, marginTop: 60,
        }}>
          <div style={{ fontSize: 48, opacity: 0.4 }}>✓</div>
          <div style={{ fontSize: 15, color: peep.textSec, textAlign: 'center' }}>
            No {filter !== 'all' ? FILTERS.find(f => f.key === filter).label.toLowerCase() : 'events'} in the last 48 hours.
          </div>
        </div>
      </Screen>
    );
  }

  return (
    <Screen title="Activity" noScroll>
      <PullToRefresh onRefresh={handleRefresh}>
        <FilterChips value={filter} onChange={setFilter} counts={counts} />
        <div style={{ padding: '8px 20px 100px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {today.length > 0 && <Section title="Today" events={today}
            onOpenEvent={onOpenEvent} highlightId={highlightId} />}
          {yesterday.length > 0 && <Section title="Yesterday" events={yesterday}
            onOpenEvent={onOpenEvent} />}
          <AllClearFooter />
        </div>
      </PullToRefresh>
    </Screen>
  );
}

function Section({ title, events, onOpenEvent, highlightId }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{
        position: 'sticky', top: 0, zIndex: 5,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 4px 8px', margin: '-8px -4px 0',
        background: 'rgba(0,0,0,0.86)',
        backdropFilter: 'blur(12px) saturate(180%)',
        WebkitBackdropFilter: 'blur(12px) saturate(180%)',
      }}>
        <span style={{ fontSize: 16, fontWeight: 600 }}>{title}</span>
        <span style={{
          fontSize: 11, color: peep.textSec,
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        }}>{events.length}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {events.map(e => (
          <EventRow key={e.id} ev={e} onTap={() => onOpenEvent(e)} highlight={e.id === highlightId} />
        ))}
      </div>
    </div>
  );
}

function AllClearFooter() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
      padding: '20px 20px 0', color: peep.textTer,
    }}>
      <div style={{ fontSize: 18 }}>·</div>
      <div style={{ fontSize: 12 }}>End of activity</div>
    </div>
  );
}

Object.assign(window, { EventRow, FilterChips, ActivityScreen });
