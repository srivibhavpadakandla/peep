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
      width: 28, height: 28, borderRadius: 999,
      background: peep.surface, border: `0.5px solid ${peep.sep}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <svg width="14" height="14" viewBox="0 0 24 24"
        style={{
          transform: spinning ? 'rotate(0deg)' : `rotate(${progress * 360}deg)`,
          animation: spinning ? 'peepSpin 0.9s linear infinite' : 'none',
        }}>
        <circle cx="12" cy="12" r="9"
          fill="none" stroke={peep.text} strokeWidth="2"
          strokeDasharray="56.5" strokeDashoffset={56.5 * (1 - progress)}
          strokeLinecap="round" transform="rotate(-90 12 12)" />
      </svg>
    </div>
  );
}

function EventRow({ ev, onTap, highlight }) {
  const m = eventMeta[ev.type];
  const expert = useExpert();
  return (
    <Press onTap={onTap} style={{
      display: 'flex', alignItems: 'flex-start', gap: 12,
      padding: '14px 16px', background: peep.surface,
      borderRadius: 12, border: `0.5px solid ${peep.sep}`,
      animation: highlight ? 'peepHighlight 2s ease both' : undefined,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 500, color: peep.text }}>{m.label}</div>
        <div style={{ fontSize: 13, color: peep.textSec, marginTop: 2 }}>
          {ev.time} · {expert ? `conf ${ev.conf.toFixed(2)}` : confidenceLabel(ev.conf)}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, paddingTop: 1 }}>
        <SeverityBadge severity={m.severity} />
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
            padding: '5px 12px', borderRadius: 999,
            background: on ? peep.text : 'transparent',
            color: on ? peep.bg : peep.textSec,
            fontSize: 13, fontWeight: 400,
            border: on ? 'none' : `0.5px solid ${peep.sep}`,
          }}>
            {f.label} <span style={{ opacity: 0.6 }}>{counts[f.key]}</span>
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
        toast('Activity refreshed.', { icon: 'arrow-clockwise' });
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{
        position: 'sticky', top: 0, zIndex: 5,
        padding: '6px 4px 6px',
        background: peep.bg,
        fontSize: 13, color: peep.textSec, fontWeight: 500,
      }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {events.map(e => (
          <EventRow key={e.id} ev={e} onTap={() => onOpenEvent(e)} highlight={e.id === highlightId} />
        ))}
      </div>
    </div>
  );
}

function AllClearFooter() {
  return null;
}

Object.assign(window, { EventRow, FilterChips, ActivityScreen });
