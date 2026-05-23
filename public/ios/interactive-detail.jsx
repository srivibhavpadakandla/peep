/* Peep — Event Detail screen with scrubber + before/after + similar events */

// ───────── Mini porch scene variant for before/after stills ─────────
function MiniPorch({ withPackage, withPerson, label, marker }) {
  return (
    <div style={{
      position: 'relative', aspectRatio: '4 / 3',
      background: 'linear-gradient(180deg, #0a1020 0%, #0b0d18 70%, #050608 100%)',
      borderRadius: 10, overflow: 'hidden',
      border: `0.5px solid ${peep.sep}`,
    }}>
      {/* door */}
      <div style={{
        position: 'absolute', left: '28%', right: '28%', bottom: '14%', top: '20%',
        background: 'linear-gradient(180deg, #2a1810, #1a0e08)', borderRadius: '4px 4px 0 0',
        boxShadow: 'inset 0 0 0 1.5px rgba(255,180,100,0.08)',
      }}>
        <div style={{ position: 'absolute', right: 6, top: '50%', width: 3, height: 3, borderRadius: 999, background: '#ddb780' }} />
      </div>
      {/* mat */}
      <div style={{
        position: 'absolute', left: '22%', right: '22%', bottom: '7%', height: 6,
        background: '#3a2a18', borderRadius: '2px 2px 0 0',
      }} />
      {/* package */}
      {withPackage && (
        <div style={{
          position: 'absolute', left: '44%', bottom: '9%',
          width: '14%', aspectRatio: '1.2 / 1',
          background: 'linear-gradient(140deg, #b89968, #8a6e44)', borderRadius: 1,
          boxShadow: '1px 1px 4px rgba(0,0,0,0.6)',
        }} />
      )}
      {/* person silhouette */}
      {withPerson && (
        <div style={{
          position: 'absolute', left: '52%', bottom: '12%', width: '10%', height: '50%',
        }}>
          <div style={{
            position: 'absolute', top: 0, left: '30%', width: '40%', aspectRatio: '1',
            borderRadius: 999, background: '#1a1a1a', boxShadow: '0 0 8px rgba(0,0,0,0.6)',
          }} />
          <div style={{
            position: 'absolute', top: '30%', left: 0, right: 0, bottom: 0,
            background: '#1a1a1a', borderRadius: '40% 40% 4px 4px',
          }} />
        </div>
      )}
      {/* detection box */}
      {marker && (
        <div style={{
          position: 'absolute',
          left: withPerson ? '48%' : '40%', bottom: '7%',
          width: withPerson ? '24%' : '22%',
          height: withPerson ? '55%' : '18%',
          border: `1.5px solid ${peep.critical}`,
          boxShadow: `0 0 0 1px ${peep.critical}40`,
        }}>
          <div style={{
            position: 'absolute', top: -16, left: 0, padding: '1px 4px',
            background: peep.critical, color: '#fff', fontSize: 8, fontWeight: 700,
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          }}>{marker}</div>
        </div>
      )}
      {/* label */}
      <div style={{
        position: 'absolute', bottom: 4, left: 6,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        fontSize: 9, color: 'rgba(255,255,255,0.6)',
      }}>{label}</div>
    </div>
  );
}

// ───────── Clip scrubber with event marker ─────────
function ClipScrubber({ event }) {
  const [t, setT] = React.useState(0.62); // moment of event
  const eventAt = 0.62;
  const totalSec = 12;
  const currentSec = (t * totalSec).toFixed(1);

  return (
    <div style={{
      padding: '12px 16px', background: peep.surface, borderRadius: 14,
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Press style={{
          width: 32, height: 32, borderRadius: 999, background: peep.accent,
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000',
          fontSize: 12,
        }}>
          <div style={{
            width: 0, height: 0, borderTop: '6px solid transparent',
            borderBottom: '6px solid transparent', borderLeft: '8px solid #000',
            marginLeft: 2,
          }} />
        </Press>
        <span style={{
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          fontSize: 12, color: peep.text,
        }}>0:{currentSec.padStart(4,'0')}</span>
        <span style={{
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          fontSize: 12, color: peep.textSec, marginLeft: 'auto',
        }}>0:{totalSec.toFixed(1)}</span>
      </div>
      <ScrubberTrack value={t} onChange={setT} eventAt={eventAt} />
      <div style={{ position: 'relative', height: 14 }}>
        <div style={{
          position: 'absolute', left: `${eventAt * 100}%`, top: 0,
          transform: 'translateX(-50%)',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          fontSize: 9, color: peep.critical, fontWeight: 600, whiteSpace: 'nowrap',
        }}>↑ event</div>
      </div>
    </div>
  );
}

function ScrubberTrack({ value, onChange, eventAt }) {
  const ref = React.useRef(null);
  const [dragging, setDragging] = React.useState(false);

  const update = (clientX) => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    onChange(Math.max(0, Math.min(1, (clientX - r.left) / r.width)));
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

  // Filmstrip cells
  const cells = 16;

  return (
    <div ref={ref}
      onMouseDown={e => { setDragging(true); update(e.clientX); }}
      onTouchStart={e => { setDragging(true); update(e.touches[0].clientX); }}
      style={{
        position: 'relative', height: 24, cursor: 'pointer',
        background: peep.surface2, borderRadius: 4, overflow: 'hidden',
      }}>
      {/* filmstrip stub */}
      <div style={{ display: 'flex', height: '100%', gap: 1 }}>
        {Array.from({ length: cells }).map((_, i) => (
          <div key={i} style={{
            flex: 1, background: `rgba(255,255,255,${0.04 + (i % 3) * 0.02})`,
          }} />
        ))}
      </div>
      {/* event marker */}
      <div style={{
        position: 'absolute', top: 0, bottom: 0, left: `${eventAt * 100}%`,
        width: 2, background: peep.critical, transform: 'translateX(-1px)',
        boxShadow: `0 0 6px ${peep.critical}`,
      }} />
      {/* progress fill */}
      <div style={{
        position: 'absolute', top: 0, bottom: 0, left: 0, width: `${value * 100}%`,
        background: 'linear-gradient(90deg, rgba(15,184,130,0.0), rgba(15,184,130,0.25))',
      }} />
      {/* head */}
      <div style={{
        position: 'absolute', top: -3, bottom: -3, left: `calc(${value * 100}% - 1px)`,
        width: 3, background: '#fff', borderRadius: 1,
        boxShadow: '0 0 6px rgba(255,255,255,0.5)',
      }} />
    </div>
  );
}

// ───────── Before/After ─────────
function BeforeAfter({ event }) {
  const showsPerson = ['package_taken','person_loitering','multiple_loitering','weapon_detected','after_hours_activity'].includes(event.type);
  return (
    <div>
      <div style={{
        fontSize: 13, color: peep.text, fontWeight: 600,
        marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8,
      }}>
        Before & after
        <span style={{ fontSize: 11, color: peep.textSec, fontWeight: 500 }}>
          · 3 sec apart
        </span>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <MiniPorch
            withPackage={event.type !== 'package_not_arrived'}
            withPerson={false}
            label="−3s · before"
          />
        </div>
        <div style={{ flex: 1 }}>
          <MiniPorch
            withPackage={event.type === 'package_arrived'}
            withPerson={showsPerson}
            label="+1s · event"
            marker={`${(event.conf * 100).toFixed(0)}%`}
          />
        </div>
      </div>
    </div>
  );
}

// ───────── Similar events ─────────
function SimilarEvents({ current, onOpen }) {
  const allEvents = [...TODAY_EVENTS, ...YEST_EVENTS];
  const similar = similarTo(current, allEvents);
  if (similar.length === 0) return null;
  const count = similar.length + 1;
  const cat = eventMeta[current.type].category;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        <div style={{
          fontSize: 11, color: peep.textSec, textTransform: 'uppercase',
          letterSpacing: 0.5, fontWeight: 600,
        }}>Similar recently</div>
        <div style={{ fontSize: 11, color: peep.textTer }}>
          {count} {cat} events in 48h
        </div>
      </div>
      <div style={{
        display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4,
        scrollbarWidth: 'none', marginLeft: -20, marginRight: -20, padding: '0 20px 4px',
      }}>
        {similar.map(e => {
          const m = eventMeta[e.type];
          const c = sevColor(m.severity);
          return (
            <Press key={e.id} onTap={() => onOpen(e)} style={{
              flexShrink: 0, width: 140,
              background: peep.surface, borderRadius: 12, padding: 12,
              display: 'flex', flexDirection: 'column', gap: 6,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 9,
                background: c + '24', border: `0.5px solid ${c}40`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18,
              }}>{m.emoji}</div>
              <div style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.2 }}>{m.label}</div>
              <div style={{ fontSize: 10, color: peep.textSec }}>{e.time}</div>
            </Press>
          );
        })}
      </div>
    </div>
  );
}

// ───────── Timeline step ─────────
function TimelineStep({ title, sub, last }) {
  return (
    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        width: 14, alignSelf: 'stretch',
      }}>
        <div style={{
          width: 10, height: 10, borderRadius: 999, background: peep.accent,
          boxShadow: `0 0 0 4px ${peep.accent}40`, marginTop: 4, flexShrink: 0,
        }} />
        {!last && <div style={{
          flex: 1, width: 1.5, background: 'rgba(235,235,245,0.25)',
          marginTop: 4, marginBottom: -4,
        }} />}
      </div>
      <div style={{ flex: 1, paddingBottom: last ? 0 : 4 }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{title}</div>
        <div style={{
          fontSize: 12, color: peep.textSec, marginTop: 2,
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        }}>{sub}</div>
      </div>
    </div>
  );
}

// ───────── Event detail screen ─────────
function EventDetailScreen({ ev, onBack, onOpenEvent }) {
  const m = eventMeta[ev.type];
  const receipt = ev.receipt || `RFND-${ev.id.toUpperCase()}-${ev.type.slice(0,3).toUpperCase()}`;
  const meta = ev.metadata || {};
  const toast = useToast();
  const expert = useExpert();
  const [techExpanded, setTechExpanded] = React.useState(false);

  return (
    <Screen hideTitle backTitle="Activity" onBack={onBack}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* clip with porch scene */}
        <div style={{
          aspectRatio: '16 / 9', background: '#000', position: 'relative', overflow: 'hidden',
        }}>
          <PorchScene packageVisible={false} eventActive />
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 4,
          }}>
            <Press style={{
              width: 64, height: 64, borderRadius: 999,
              background: 'rgba(255,255,255,0.18)',
              backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{
                width: 0, height: 0, borderTop: '12px solid transparent',
                borderBottom: '12px solid transparent', borderLeft: '18px solid #fff',
                marginLeft: 5,
              }} />
            </Press>
          </div>
          <div style={{
            position: 'absolute', bottom: 10, right: 10, zIndex: 4,
            background: 'rgba(0,0,0,0.4)', padding: '4px 8px', borderRadius: 999,
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            fontSize: 10, color: 'rgba(255,255,255,0.7)',
          }}>peep://clips/{ev.id}.mp4</div>
        </div>

        {/* title block */}
        <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 30, fontWeight: 600, lineHeight: 1.15 }}>{m.label}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <SeverityBadge severity={m.severity} />
            <span style={{ fontSize: 13, color: peep.textSec }}>{ev.time}</span>
          </div>
          <div style={{ marginTop: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: peep.textSec }}>Confidence</span>
              <span style={{
                fontSize: 11, color: peep.textSec,
                fontFamily: expert ? 'ui-monospace, SFMono-Regular, Menlo, monospace' : 'inherit',
              }}>{expert ? ev.conf.toFixed(2) : confidenceLabel(ev.conf)}</span>
            </div>
            <div style={{ height: 3, background: peep.surface, borderRadius: 999, overflow: 'hidden' }}>
              <div style={{ width: `${ev.conf * 100}%`, height: '100%', background: peep.accent }} />
            </div>
          </div>
        </div>

        {/* scrubber */}
        <div style={{ padding: '0 20px' }}>
          <ClipScrubber event={ev} />
        </div>

        {/* before/after */}
        <div style={{ padding: '0 20px' }}>
          <BeforeAfter event={ev} />
        </div>

        {/* what peep did */}
        <div style={{ padding: '0 20px' }}>
          <Card style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 16, fontWeight: 600 }}>What Peep did</div>
            <TimelineStep title={friendlyStepTitle(ev.type, 0)}
                          sub={friendlyStepSub(ev.type, 0, ev, receipt)} />
            <TimelineStep title={friendlyStepTitle(ev.type, 1)}
                          sub={friendlyStepSub(ev.type, 1, ev, receipt)} />
            <TimelineStep title={friendlyStepTitle(ev.type, 2)}
                          sub={friendlyStepSub(ev.type, 2, ev, receipt)} last />

            <Press onTap={() => setTechExpanded(!techExpanded)} style={{
              fontSize: 11, color: peep.textSec, alignSelf: 'flex-start',
              padding: '2px 4px',
            }}>{techExpanded ? 'Hide technical log' : 'Show technical log ›'}</Press>

            {techExpanded && (
              <div style={{
                background: 'rgba(0,0,0,0.4)', borderRadius: 10, padding: 12,
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                fontSize: 11, lineHeight: 1.5, color: peep.textSec,
                border: `0.5px solid ${peep.sep}`,
                animation: 'peepFade .2s ease both',
                display: 'flex', flexDirection: 'column', gap: 4,
              }}>
                <div><span style={{ color: peep.info, fontWeight: 600 }}>vision_agent</span> · detected {ev.type} (conf {ev.conf.toFixed(2)})</div>
                <div><span style={{ color: peep.accent, fontWeight: 600 }}>orchestration</span> · {decisionLine(ev.type)}</div>
                <div><span style={{ color: '#bf7af0', fontWeight: 600 }}>browser_agent</span> · {browserLine(ev.type, receipt)}</div>
              </div>
            )}
          </Card>
        </div>

        {/* metadata — humanized; raw shown in expert mode */}
        {Object.keys(meta).length > 0 && (
          <div style={{ padding: '0 20px' }}>
            <Card style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 16, fontWeight: 600 }}>Details</div>
              {Object.entries(meta).sort().map(([k, v]) => {
                const h = humanizeMeta(k, v);
                return (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{
                      fontSize: 13, color: peep.textSec,
                      fontFamily: expert ? 'ui-monospace, SFMono-Regular, Menlo, monospace' : 'inherit',
                    }}>{expert ? k : h.label}</span>
                    <span style={{
                      fontSize: 13,
                      fontFamily: expert ? 'ui-monospace, SFMono-Regular, Menlo, monospace' : 'inherit',
                    }}>{expert ? String(v) : h.value}</span>
                  </div>
                );
              })}
            </Card>
          </div>
        )}

        {/* similar events */}
        <SimilarEvents current={ev} onOpen={onOpenEvent} />

        {/* actions */}
        <div style={{ padding: '0 20px 8px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <ActionRow icon="✓" title="Mark resolved"
            onTap={() => toast('Marked resolved.', { icon: '✓' })} />
          <ActionRow icon="!" title="Report wrong"
            onTap={() => toast('Reported. Peep will retrain on this clip.', { icon: '↻' })} />
          <ActionRow icon="↑" title="Share clip"
            onTap={() => toast('Clip link copied.', { icon: '🔗' })} />
          {m.severity === 'critical' && (
            <ActionRow icon="☎" title="Call police" destructive
              onConfirm={() => toast('Dialing 911…', { icon: '☎', accent: peep.critical })} />
          )}
        </div>
      </div>
    </Screen>
  );
}

// Friendly step labels for the "What Peep did" timeline.
function friendlyStepTitle(type, idx) {
  if (idx === 0) return 'Spotted';
  if (idx === 1) {
    if (type === 'package_taken')      return 'Verified theft';
    if (type === 'package_not_arrived')return 'Verified missing';
    if (type === 'weapon_detected')    return 'Escalated';
    return 'Reviewed';
  }
  if (type === 'package_taken')      return 'Filed your refund';
  if (type === 'package_not_arrived')return 'Filed missing-delivery claim';
  if (type === 'weapon_detected')    return 'Queued for human review';
  return 'Logged';
}

function friendlyStepSub(type, idx, ev, receipt) {
  if (idx === 0) return `${eventMeta[type].label} · ${confidenceLabel(ev.conf)}`;
  if (idx === 1) {
    if (type === 'package_taken')       return 'Cross-checked against your Amazon order';
    if (type === 'package_not_arrived') return 'Matched to your pending delivery';
    if (type === 'weapon_detected')     return 'Low confidence · sent to human review';
    return 'No further action needed';
  }
  if (type === 'package_taken')       return `Receipt ${receipt}`;
  if (type === 'package_not_arrived') return `Claim ${receipt}`;
  if (type === 'weapon_detected')     return 'Reviewer will respond within 5 min';
  return 'Saved to your Activity feed';
}

Object.assign(window, {
  MiniPorch, ClipScrubber, BeforeAfter, SimilarEvents, TimelineStep, EventDetailScreen,
});
