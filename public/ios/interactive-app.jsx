/* Peep — app root: onboarding gate, tab switching, push/pop detail, toasts */

function initialState() {
  return {
    onboarded: false,
    tab: 'live',
    detailStack: [], // events in nav stack
    activeEvent: TODAY_EVENTS[0],
    activeCamera: 'front',
    snapshots: [],
    rewindOffset: 0,
    openSnapshot: null,
    talkOn: false,
    muteOn: false,
    snapshotFlash: false,
    pendingNotification: null,
    recentlyReceivedOrderID: null,
    deliveries: [
      { id: 'd1', order: '114-8829112-0034221', item: 'Anker PowerCore 20K Portable Charger',
        carrier: 'Amazon', eta: 'Arriving today · ETA 6 PM', received: false },
      { id: 'd2', order: '112-4490023-1188776', item: 'Logitech MX Master 3S',
        carrier: 'UPS', eta: 'Out for delivery', received: false },
    ],
    settings: {
      push: true,
      criticalOnly: false,
      loiter: 6.0,
      fireOnce: true,
      requireMovement: true,
      animals: { dog: true, cat: true, bird: false, bear: false },
      autoRefund: true,
      autoClaim: true,
      notifyMissing: true,
      integrations: { Amazon: true, Gmail: false, Police: false },
      severityOverrides: {},
      expertMode: false,
      reviewBeforeFiling: false,
    },
  };
}

function AppInner() {
  const [state, setState] = React.useState(initialState());
  const toast = useToast();
  const openEvent = (ev) => setState(s => ({ ...s, detailStack: [...s.detailStack, ev] }));
  const popEvent = ()    => setState(s => ({ ...s, detailStack: s.detailStack.slice(0, -1) }));
  const setTab = (t)     => setState(s => ({ ...s, tab: t, detailStack: [] }));

  // After a delivery is marked received, jump to Activity briefly highlighted.
  const handleDeliveryReceived = (orderID) => {
    setState(s => ({ ...s, recentlyReceivedOrderID: orderID }));
    setTimeout(() => {
      setState(s => ({ ...s, recentlyReceivedOrderID: null }));
    }, 4000);
  };

  // Fire a fake critical event into Live.
  const fireTestAlert = () => {
    const types = ['package_taken', 'person_loitering', 'weapon_detected', 'multiple_loitering'];
    const type = types[Math.floor(Math.random() * types.length)];
    const ev = {
      id: 'live' + Math.random().toString(36).slice(2,6),
      type,
      time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      conf: 0.78 + Math.random() * 0.2,
      receipt: genReceipt(),
      metadata: { source: 'test_alert' },
    };
    setState(s => ({
      ...s,
      activeEvent: ev,
      tab: 'live',
      detailStack: [],
      activeCamera: 'front',
      rewindOffset: 0,
      pendingNotification: ev,
    }));
    // Auto-dismiss banner
    setTimeout(() => {
      setState(s => s.pendingNotification?.id === ev.id ? { ...s, pendingNotification: null } : s);
    }, 5000);
  };

  const tapNotification = (ev) => {
    setState(s => ({ ...s, pendingNotification: null, tab: 'live', detailStack: [ev] }));
  };
  const dismissNotification = () => {
    setState(s => ({ ...s, pendingNotification: null }));
  };

  // Auto-toast when active event arrives for first time on session
  React.useEffect(() => {
    if (state.activeEvent && state.activeEvent.type === 'package_taken' && !state.onboarded) return;
    // (kept silent — agent ticker tells the story)
  }, [state.activeEvent]);

  // ───────── Render ─────────

  if (!state.onboarded) {
    return (
      <OnboardingFlow onDone={() => setState(s => ({ ...s, onboarded: true }))} />
    );
  }

  // Active screen: detail stack takes precedence
  let mainScreen;
  if (state.tab === 'live') {
    mainScreen = <LiveScreen state={state} setState={setState} onOpenEvent={openEvent} />;
  } else if (state.tab === 'activity') {
    mainScreen = <ActivityScreen onOpenEvent={openEvent} recentlyReceivedOrderID={state.recentlyReceivedOrderID} />;
  } else if (state.tab === 'community') {
    mainScreen = <CommunityScreen />;
  } else if (state.tab === 'inbox') {
    mainScreen = <InboxScreen state={state} setState={setState} onReceived={handleDeliveryReceived} />;
  } else {
    mainScreen = <SettingsScreen state={state} setState={setState} onFireTestAlert={fireTestAlert} />;
  }

  // Build push-stack:
  // - base = current tab screen (keyed by tab so it fades on tab change)
  // - then each detail event pushes on top
  const stack = [
    { key: 'tab-' + state.tab, node: <TabSwitcher tabKey={state.tab}>{mainScreen}</TabSwitcher> },
    ...state.detailStack.map((ev, i) => ({
      key: 'detail-' + ev.id + '-' + i,
      node: <EventDetailScreen ev={ev}
              onBack={popEvent}
              onOpenEvent={openEvent} />,
    })),
  ];

  return (
    <ExpertModeContext.Provider value={!!state.settings.expertMode}>
      <div style={{ width: '100%', height: '100%', position: 'relative' }}>
        <ScreenStack stack={stack} />
        <TabBar active={state.tab} onChange={setTab} />
        {state.pendingNotification && (
          <PushNotificationBanner
            event={state.pendingNotification}
            onTap={() => tapNotification(state.pendingNotification)}
            onDismiss={dismissNotification}
          />
        )}
      </div>
    </ExpertModeContext.Provider>
  );
}

// ───────── Push notification banner ─────────
function PushNotificationBanner({ event, onTap, onDismiss }) {
  const m = eventMeta[event.type];
  const c = sevColor(m.severity);
  const headline = {
    package_taken:       'Peep filed your refund',
    package_not_arrived: 'Missing delivery claim filed',
    weapon_detected:     'Critical: human review needed',
    person_loitering:    'Person at your door',
    multiple_loitering:  'Multiple people at your door',
  }[event.type] || 'Peep detected activity';

  const subhead = {
    package_taken:       `Receipt ${event.receipt}. Tap to review.`,
    package_not_arrived: 'Tap to view the claim.',
    weapon_detected:     'Possible weapon detected. Tap to confirm.',
  }[event.type] || `Detected at ${event.time}. Tap to view.`;

  return (
    <div style={{
      position: 'absolute', left: 8, right: 8, top: 56, zIndex: 200,
      animation: 'peepBannerDrop .35s cubic-bezier(.2,.7,.3,1) both',
    }}>
      <Press onTap={onTap} style={{
        background: 'rgba(36,36,38,0.94)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        borderRadius: 18, padding: '12px 14px',
        boxShadow: '0 12px 32px rgba(0,0,0,0.5), 0 0 0 0.5px rgba(255,255,255,0.08) inset',
        border: `0.5px solid ${c}60`,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 8,
          background: c + '33', border: `0.5px solid ${c}60`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, flexShrink: 0,
        }}>{m.emoji}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: peep.textSec }}>PEEP</span>
            <span style={{ fontSize: 11, color: peep.textTer, marginLeft: 'auto' }}>now</span>
          </div>
          <div style={{
            fontSize: 13, fontWeight: 600, color: peep.text, marginTop: 1,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{headline}</div>
          <div style={{
            fontSize: 12, color: peep.textSec, marginTop: 1,
            overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box',
            WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          }}>{subhead}</div>
        </div>
      </Press>
    </div>
  );
}

function App() {
  return (
    <div style={{
      width: '100vw', height: '100vh',
      background: '#0d0d11',
      backgroundImage:
        'radial-gradient(circle at 50% 0%, rgba(15,184,130,0.05), transparent 50%), ' +
        'radial-gradient(circle at 50% 100%, rgba(255,69,58,0.03), transparent 50%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
    }}>
      <IOSDevice width={390} height={844} dark>
        <ToastHost>
          <AppInner />
        </ToastHost>
      </IOSDevice>
    </div>
  );
}ReactDOM.createRoot(document.getElementById('root')).render(<App />);
