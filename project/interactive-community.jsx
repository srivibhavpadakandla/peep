/* Peep — Community tab (neighborhood feed of camera alerts + discussion) */

// ───────── Seed data ─────────

// Neighborhood camera map — relative positions on a stylized block grid.
const NEIGHBOR_INFO = [
  // matches cameras[i]
  { addr: '128 Linden St', who: 'Becca M.',  initials: 'BM', color: '#bf7af0', joined: '8 mo', lastSeen: 'No alerts · 24h' },
  { addr: '132 Linden St', who: 'Ravi P.',   initials: 'RP', color: '#FF9F0A', joined: '1 yr', lastSeen: 'Spotted UPS delivery · 9:21a' },
  { addr: '136 Linden St', who: 'Sami K.',   initials: 'SK', color: '#FF453A', joined: '6 mo', lastSeen: 'Logged loiter · 12:11p' },
  { addr: '140 Linden St', who: 'Mike R.',   initials: 'MR', color: '#0A84FF', joined: '2 yr', lastSeen: 'No alerts · 24h' },
  { addr: '122 5th Ave',   who: 'Elena H.',  initials: 'EH', color: '#FFC033', joined: '11 mo', lastSeen: 'Tagged cat (Miso) · 2h' },
  { addr: '126 5th Ave',   who: 'Anna L.',   initials: 'AL', color: '#FF9F0A', joined: '5 mo', lastSeen: 'Active loiter alert · 12 min' },
  { addr: '130 5th Ave',   who: 'Tom M.',    initials: 'TM', color: '#FF453A', joined: '2 yr', lastSeen: 'False-alarm, resolved · yest' },
  { addr: '134 5th Ave',   who: 'Dana P.',   initials: 'DP', color: '#bf7af0', joined: '4 mo', lastSeen: 'No alerts · 24h' },
  { addr: '138 5th Ave',   who: 'Brad V.',   initials: 'BV', color: '#59C7FA', joined: '1 yr', lastSeen: '311 streetlight · 3h' },
  { addr: '120 Pine St',   who: 'Jordan T.', initials: 'JT', color: '#bf7af0', joined: '9 mo', lastSeen: 'Lost cat post · 2h' },
  { addr: '124 Pine St',   who: 'Cori N.',   initials: 'CN', color: '#0FB882', joined: '3 yr', lastSeen: 'No alerts · 24h' },
  { addr: '142 Linden St', who: 'You',       initials: 'YOU', color: '#0A84FF', joined: '2 wk', lastSeen: 'Package taken · 2:32p' },
  { addr: '146 Linden St', who: 'Wes G.',    initials: 'WG', color: '#FF9F0A', joined: '7 mo', lastSeen: 'Active event · live' },
  { addr: '150 Linden St', who: 'Priya S.',  initials: 'PS', color: '#FFC033', joined: '4 mo', lastSeen: 'No alerts · 24h' },
  { addr: '118 Oak St',    who: 'Leo D.',    initials: 'LD', color: '#bf7af0', joined: '6 mo', lastSeen: 'No alerts · 24h' },
  { addr: '122 Oak St',    who: 'Maya J.',   initials: 'MJ', color: '#0FB882', joined: '1 yr', lastSeen: 'Animal · raccoon · 4a' },
  { addr: '126 Oak St',    who: 'Ben Q.',    initials: 'BQ', color: '#0A84FF', joined: '8 mo', lastSeen: 'No alerts · 24h' },
  { addr: '130 Oak St',    who: 'Sara V.',   initials: 'SV', color: '#FF453A', joined: '5 mo', lastSeen: 'No alerts · 24h' },
];

const NEIGHBORHOOD = {
  name: 'West End',
  neighbors: 142,
  peepCameras: 18,
  cameras: [
    // [x%, y%, state]   state: idle | active | alert | self
    [22, 18, 'idle'],   [38, 12, 'idle'],   [58, 16, 'idle'],   [78, 14, 'idle'],
    [16, 36, 'idle'],   [34, 32, 'alert'],  [54, 36, 'idle'],   [74, 32, 'idle'],   [88, 38, 'idle'],
    [12, 56, 'idle'],   [32, 54, 'idle'],   [50, 58, 'self'],   [68, 56, 'active'], [86, 60, 'idle'],
    [22, 78, 'idle'],   [44, 80, 'idle'],   [64, 78, 'idle'],   [82, 82, 'idle'],
  ],
};

// ───────── Friends (saved contacts you share ETA with / chat with) ─────────
const FRIENDS = [
  { id: 'f1', name: 'Becca M.',  initials: 'BM', color: '#bf7af0', online: true,
    seed: [
      { from: 'them', text: "Saw your porch cam clip — wild 😅", time: '2m' },
      { from: 'me',   text: "Right? Peep handled it before I even saw the notif.", time: '1m' },
    ] },
  { id: 'f2', name: 'Ravi P.',   initials: 'RP', color: '#FF9F0A', online: true,
    seed: [
      { from: 'them', text: "You around tonight? Wanna grab the package off your porch if you’re out", time: '14m' },
    ] },
  { id: 'f3', name: 'Elena H.',  initials: 'EH', color: '#FFC033', online: false,
    seed: [
      { from: 'me',   text: "Thanks for grabbing the Amazon box yesterday 🙏", time: '1h' },
      { from: 'them', text: "Anytime!", time: '1h' },
    ] },
  { id: 'f4', name: 'Mike R.',   initials: 'MR', color: '#0A84FF', online: false,
    seed: [
      { from: 'them', text: "On it 👍", time: '3h' },
    ] },
  { id: 'f5', name: 'Jordan T.', initials: 'JT', color: '#bf7af0', online: true,
    seed: [
      { from: 'them', text: "Still need the spare key back whenever", time: 'yest' },
    ] },
];

const POST_TYPES = [
  { key: 'all',        label: 'All' },
  { key: 'alert',      label: 'Alerts' },
  { key: 'discussion', label: 'Discussion' },
  { key: 'lost',       label: 'Lost & Found' },
];

const COMMUNITY_POSTS = [
  {
    id: 'p1', kind: 'alert', sharedByPeep: true,
    author: { initials: 'AL', color: '#FF9F0A', name: 'Anna L.', distance: '2 doors down' },
    time: '12 min ago',
    body: 'Heads up — looks like the same person who was loitering on my porch yesterday is back on Linden. Peep flagged 8 sec of pacing at 2:08 PM.',
    eventType: 'person_loitering', confidence: 0.84,
    reactions: { 'eye': 14, 'hand-heart': 6, 'warning': 3 },
    reactedByMe: 'eye',
    commentCount: 7,
    comments: [
      { author: 'Mike R.', initials: 'MR', color: '#0A84FF', text: "Saw him too on my Ring around 1:50. Hoodie, gray backpack." },
      { author: 'Dana P.', initials: 'DP', color: '#bf7af0', text: "Posted in the WhatsApp group. Linden block — stay sharp." },
    ],
    corroborations: 3,
  },
  {
    id: 'p2', kind: 'alert', sharedByPeep: true,
    author: { initials: 'PEEP', color: '#dcc878', name: 'Peep Network', distance: '3 cameras agreed' },
    time: '38 min ago',
    body: 'Multi-camera verification: 3 Peep cameras on Linden St between #136–#148 spotted the same individual within 6 minutes.',
    eventType: 'multiple_loitering', confidence: 0.91,
    multiCamera: true,
    reactions: { 'eye': 22, 'warning': 9 },
    commentCount: 11,
    comments: [
      { author: 'Sami K.', initials: 'SK', color: '#FF453A', text: "Called non-emergency, they're sending someone." },
    ],
    corroborations: 3,
  },
  {
    id: 'p3', kind: 'lost',
    author: { initials: 'JT', color: '#bf7af0', name: 'Jordan T.', distance: '4 doors down' },
    time: '2 hr ago',
    body: 'Lost: brown tabby cat, answers to Miso. Missing since this morning. Microchipped. He has a green collar.',
    image: 'cat',
    reactions: { 'eye': 18, 'hand-heart': 4 },
    commentCount: 3,
    comments: [],
    corroborations: 0,
  },
  {
    id: 'p4', kind: 'discussion',
    author: { initials: 'BV', color: '#59C7FA', name: 'Brad V.', distance: 'around the corner' },
    time: '3 hr ago',
    body: 'Streetlight at the corner of Linden & 5th is out again. Reported it on 311, ticket #SR-449281.',
    reactions: { 'hand-heart': 11, 'lightbulb': 4 },
    commentCount: 1,
    comments: [],
    corroborations: 0,
  },
  {
    id: 'p5', kind: 'alert', sharedByPeep: true,
    author: { initials: 'TM', color: '#FF453A', name: 'Tom M.', distance: '1 door down' },
    time: 'Yesterday 9:14 PM',
    body: 'Resolved — Peep flagged "after-hours activity" at 9:12 PM. False alarm: my wife getting home late from work. Marked + reported.',
    eventType: 'after_hours_activity', confidence: 0.73, resolved: true,
    reactions: { 'hand-heart': 8, 'prohibit': 5 },
    commentCount: 2,
    comments: [],
    corroborations: 0,
  },
  {
    id: 'p6', kind: 'discussion',
    author: { initials: 'EH', color: '#FFC033', name: 'Elena H.', distance: '6 doors down' },
    time: 'Yesterday',
    body: 'Free moving boxes — driveway pickup, 138 Linden. Probably 30-ish boxes, all assembled.',
    reactions: { 'hand-heart': 24 },
    commentCount: 6,
    comments: [],
    corroborations: 0,
  },
];

// ───────── Build a community post from a Peep-detected event ─────────
function buildEventPost(event, { auto = false } = {}) {
  const m = eventMeta[event.type] || {};
  const bodyMap = {
    package_taken:       'Peep camera caught someone grabbing a package off my porch. Clip attached — heads up if you see them on your block.',
    package_not_arrived: 'Expected delivery never arrived. Peep filed a claim. Posting in case anyone saw the courier on the block.',
    weapon_detected:     'Peep flagged a possible weapon on my porch camera. Reviewing now — be careful out there.',
    person_loitering:    'Person hanging around my porch for a while. Peep clipped it. Anyone recognize them?',
    multiple_loitering:  'Multiple people loitering at my door. Peep verified across cameras. Stay sharp.',
    after_hours_activity:'After-hours activity flagged by Peep. Probably nothing, sharing the clip in case anyone else saw movement.',
  };
  return {
    id: 'auto_' + (event.id || Math.random().toString(36).slice(2, 8)),
    kind: 'alert', sharedByPeep: true,
    author: { initials: 'YOU', color: peep.blue, name: 'You', distance: '142 Linden St' },
    time: auto ? 'Just now · auto-shared' : 'Just now',
    body: bodyMap[event.type] || 'Peep flagged something on my camera. Clip attached.',
    eventType: event.type,
    confidence: event.conf || 0.8,
    reactions: {},
    commentCount: 0,
    comments: [],
    corroborations: 0,
    multiCamera: event.type === 'multiple_loitering',
  };
}

// ───────── Neighborhood pulse map ─────────
function NeighborhoodPulse({ onTapCamera }) {
  return (
    <div style={{
      margin: '0 20px', borderRadius: 16, padding: 16,
      background: 'linear-gradient(160deg, #131318 0%, #0c0e14 100%)',
      border: `0.5px solid ${peep.sep}`,
      display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, color: peep.textSec, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>
            Neighborhood pulse
          </div>
          <div style={{ fontSize: 17, fontWeight: 600, marginTop: 2 }}>
            {NEIGHBORHOOD.name} · last 24h
          </div>
        </div>
        <div style={{
          padding: '4px 10px', borderRadius: 999,
          background: peep.warning + '26', border: `0.5px solid ${peep.warning}66`,
          color: peep.warning, fontSize: 11, fontWeight: 600,
        }}>1 active</div>
      </div>

      {/* Stylized block map */}
      <div style={{
        position: 'relative', aspectRatio: '2 / 1', borderRadius: 10, overflow: 'hidden',
        background: '#070809',
      }}>
        {/* streets — two horizontal + two vertical */}
        {[28, 72].map(t => (
          <div key={'h'+t} style={{
            position: 'absolute', left: 0, right: 0, top: `${t}%`, height: 8,
            background: 'rgba(255,255,255,0.04)',
          }} />
        ))}
        {[30, 70].map(l => (
          <div key={'v'+l} style={{
            position: 'absolute', top: 0, bottom: 0, left: `${l}%`, width: 8,
            background: 'rgba(255,255,255,0.04)',
          }} />
        ))}
        {/* center label */}
        <div style={{
          position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          fontSize: 9, color: peep.textTer, letterSpacing: 0.5,
        }}>LINDEN ST</div>

        {/* cameras */}
        {NEIGHBORHOOD.cameras.map(([x, y, state], i) => {
          const color = state === 'alert' ? peep.warning
                      : state === 'active' ? peep.accent
                      : state === 'self'  ? peep.blue
                      : peep.textTer;
          const size = state === 'self' ? 9 : 7;
          const hitSize = 28;
          return (
            <Press key={i} onTap={() => onTapCamera && onTapCamera(i)} style={{
              position: 'absolute', left: `${x}%`, top: `${y}%`,
              width: hitSize, height: hitSize, borderRadius: 999,
              transform: 'translate(-50%, -50%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 2,
            }}>
              <div style={{
                width: size, height: size, borderRadius: 999,
                background: color,
                boxShadow: state === 'alert' || state === 'active' || state === 'self'
                  ? `0 0 0 4px ${color}40` : 'none',
                animation: state === 'alert' ? 'peepPulse 1.5s ease-in-out infinite' : undefined,
                position: 'relative',
              }}>
                {state === 'self' && (
                  <div style={{
                    position: 'absolute', left: '50%', top: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 3, height: 3, borderRadius: 999, background: '#fff',
                  }} />
                )}
              </div>
            </Press>
          );
        })}
      </div>

      {/* legend */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 14px',
        fontSize: 12, color: peep.textSec,
      }}>
        <LegendDot color={peep.blue}    label="You" />
        <LegendDot color={peep.accent}  label="Live event" />
        <LegendDot color={peep.warning} label="Recent alert" />
        <LegendDot color={peep.textTer} label="Idle camera" />
      </div>

      <div style={{
        display: 'flex', justifyContent: 'space-between',
        fontSize: 12, color: peep.textSec, paddingTop: 4, borderTop: `0.5px solid ${peep.sep}`,
      }}>
        <Stat label={NEIGHBORHOOD.neighbors} sub="neighbors" />
        <Stat label={NEIGHBORHOOD.peepCameras} sub="cameras" />
        <Stat label="6" sub="alerts · 24h" />
        <Stat label="2" sub="resolved" />
      </div>
    </div>
  );
}

function LegendDot({ color, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 8, height: 8, borderRadius: 999, background: color, flexShrink: 0 }} />
      <span>{label}</span>
    </div>
  );
}

function Stat({ label, sub }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
      <span style={{ fontSize: 17, fontWeight: 600, color: peep.text,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>{label}</span>
      <span style={{ fontSize: 10, color: peep.textSec }}>{sub}</span>
    </div>
  );
}

// ───────── Avatar ─────────
function Avatar({ initials, color, size = 36, peepShared }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: 999, flexShrink: 0,
      background: `linear-gradient(140deg, ${color}, ${color}80)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontSize: size * 0.36, fontWeight: 700,
      position: 'relative',
    }}>
      {initials}
      {peepShared && (
        <div style={{
          position: 'absolute', bottom: -2, right: -2,
          width: size * 0.45, height: size * 0.45, borderRadius: 999,
          background: peep.accent, border: '2px solid #000',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: size * 0.18, color: '#000', fontWeight: 800,
        }}>P</div>
      )}
    </div>
  );
}

const REACTION_LABELS = {
  'eye':        'Saw it',
  'hand-heart': 'Thanks',
  'warning':    'Heads up',
  'lightbulb':  'Useful',
  'prohibit':   'Not it',
};

const REACTION_COLORS = {
  'eye':        peep.info,
  'hand-heart': peep.accent,
  'warning':    peep.warning,
  'lightbulb':  peep.accent,
  'prohibit':   peep.critical,
};

// ───────── Reaction bar ─────────
function ReactionBar({ post, onReact }) {
  const entries = Object.entries(post.reactions);
  return (
    <div style={{
      display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center',
    }}>
      {entries.map(([name, count]) => {
        const mine = post.reactedByMe === name;
        const c = REACTION_COLORS[name] || peep.accent;
        return (
          <Press key={name} onTap={() => onReact(post, name)} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '4px 10px', borderRadius: 999,
            background: mine ? c + '26' : peep.surface2,
            border: mine ? `0.5px solid ${c}99` : `0.5px solid ${peep.sep}`,
            color: mine ? c : peep.text,
            fontSize: 12, fontWeight: 600,
          }}>
            <Icon name={name} size={14} weight="fill" color={mine ? c : peep.text} />
            <span style={{ fontSize: 11 }}>{REACTION_LABELS[name] || ''}</span>
            <span style={{
              fontSize: 11, opacity: 0.65,
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            }}>{count}</span>
          </Press>
        );
      })}
      <ReactionPicker onPick={(name) => onReact(post, name)} />
    </div>
  );
}

function ReactionPicker({ onPick }) {
  const [open, setOpen] = React.useState(false);
  const options = ['eye', 'hand-heart', 'warning', 'lightbulb', 'prohibit'];
  return (
    <div style={{ position: 'relative' }}>
      <Press onTap={() => setOpen(!open)} style={{
        padding: '4px 10px', borderRadius: 999,
        background: peep.surface2, border: `0.5px dashed ${peep.sep}`,
        color: peep.textSec, fontSize: 13, fontWeight: 600,
        display: 'inline-flex', alignItems: 'center', gap: 2,
      }}>+</Press>
      {open && (
        <div style={{
          position: 'absolute', bottom: '110%', left: 0, zIndex: 30,
          display: 'flex', gap: 4, padding: 6,
          background: peep.surface2, borderRadius: 14,
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        }}>
          {options.map(o => {
            const c = REACTION_COLORS[o];
            return (
              <Press key={o} onTap={() => { onPick(o); setOpen(false); }} style={{
                padding: 6, borderRadius: 8,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                minWidth: 50,
              }}>
                <Icon name={o} size={18} weight="fill" color={c} />
                <span style={{ fontSize: 9, color: peep.textSec, fontWeight: 500 }}>
                  {REACTION_LABELS[o]}
                </span>
              </Press>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ───────── Post card ─────────
function PostCard({ post, onReact, onComment }) {
  const evMeta = post.eventType ? eventMeta[post.eventType] : null;
  const sc = evMeta ? sevColor(evMeta.severity) : null;
  const toast = useToast();

  return (
    <div style={{
      background: peep.surface, borderRadius: 16, padding: 14,
      display: 'flex', flexDirection: 'column', gap: 12,
      border: post.multiCamera ? `1px solid ${peep.warning}66` : `0.5px solid ${peep.sep}`,
    }}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Avatar initials={post.author.initials} color={post.author.color}
                peepShared={post.sharedByPeep && !post.multiCamera} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>{post.author.name}</span>
            {post.sharedByPeep && (
              <Press
                onTap={(e) => {
                  e && e.stopPropagation && e.stopPropagation();
                  toast(
                    'Peep-verified: includes a clip from a real Peep camera with the AI agent\'s confidence attached.',
                    { icon: '✓', duration: 4500 }
                  );
                }}
                style={{
                  fontSize: 9, fontWeight: 700, color: peep.accent,
                  background: peep.accent + '22', padding: '1px 5px', borderRadius: 4,
                  letterSpacing: 0.5, display: 'inline-flex', alignItems: 'center', gap: 3,
                }}>
                <span>PEEP VERIFIED</span>
                <span style={{ fontSize: 8, opacity: 0.7 }}>ⓘ</span>
              </Press>
            )}
          </div>
          <div style={{ fontSize: 11, color: peep.textSec }}>
            {post.author.distance} · {post.time}
          </div>
        </div>
        {evMeta && (
          <SeverityBadge severity={evMeta.severity} />
        )}
      </div>

      {/* multi-camera ribbon */}
      {post.multiCamera && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 10px', borderRadius: 8,
          background: peep.warning + '14', border: `0.5px solid ${peep.warning}40`,
        }}>
          <Icon name="broadcast" size={16} weight="fill" color={peep.warning} />
          <span style={{ fontSize: 12, color: peep.warning, fontWeight: 600 }}>
            {post.corroborations} cameras corroborated
          </span>
        </div>
      )}

      {/* body */}
      <div style={{ fontSize: 14, lineHeight: 1.45, color: peep.text }}>
        {post.body}
      </div>

      {/* event clip thumbnail */}
      {evMeta && !post.resolved && (
        <div style={{
          aspectRatio: '16 / 9', borderRadius: 10, overflow: 'hidden',
          position: 'relative', background: '#000',
        }}>
          <PorchScene camera="still" packageVisible={false} />
          <div style={{
            position: 'absolute', inset: 0, zIndex: 5,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 999,
              background: 'rgba(255,255,255,0.18)',
              backdropFilter: 'blur(12px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{
                width: 0, height: 0, borderTop: '8px solid transparent',
                borderBottom: '8px solid transparent', borderLeft: '12px solid #fff', marginLeft: 4,
              }} />
            </div>
          </div>
          <div style={{
            position: 'absolute', top: 8, left: 8, zIndex: 5,
            padding: '3px 7px', borderRadius: 999,
            background: 'rgba(0,0,0,0.6)',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            fontSize: 9, color: '#fff', fontWeight: 600,
          }}>{evMeta.label.toUpperCase()} · {(post.confidence * 100).toFixed(0)}%</div>
        </div>
      )}

      {/* resolved badge */}
      {post.resolved && (
        <div style={{
          padding: '8px 10px', borderRadius: 8,
          background: peep.accent + '14', border: `0.5px solid ${peep.accent}66`,
          color: peep.accent, fontSize: 12, fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span>✓</span>
          <span>Resolved by {post.author.name.split(' ')[0]}</span>
        </div>
      )}

      {/* image placeholder for lost pets etc */}
      {post.image === 'cat' && (
        <div style={{
          aspectRatio: '4 / 3', borderRadius: 10,
          background: 'linear-gradient(135deg, #4a3520 0%, #2a1f12 100%)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <Icon name="cat" size={56} weight="fill" color={peep.textSec} />
          <div style={{
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            fontSize: 10, color: peep.textTer,
          }}>[ photo: brown tabby ]</div>
        </div>
      )}

      {/* reactions */}
      <ReactionBar post={post} onReact={onReact} />

      {/* footer actions */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14,
        paddingTop: 8, borderTop: `0.5px solid ${peep.sep}`,
      }}>
        <FooterAction icon="chat-circle" label={`${post.commentCount} comments`} onTap={onComment} />
        <FooterAction icon="arrow-up-right" label="Share"  />
        {post.sharedByPeep && !post.resolved && (
          <FooterAction icon="megaphone-simple" label="Also saw" highlight />
        )}
      </div>

      {/* visible comment preview */}
      {post.comments.length > 0 && (
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 8,
          padding: '10px 12px', borderRadius: 10, background: peep.bg,
          border: `0.5px solid ${peep.sep}`,
        }}>
          {post.comments.slice(0, 2).map((c, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <Avatar initials={c.initials} color={c.color} size={24} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{c.author}</div>
                <div style={{ fontSize: 12, color: peep.textSec, marginTop: 1, lineHeight: 1.4 }}>
                  {c.text}
                </div>
              </div>
            </div>
          ))}
          {post.commentCount > post.comments.length && (
            <Press onTap={onComment} style={{
              fontSize: 11, color: peep.accent, fontWeight: 600, paddingTop: 2,
            }}>View all {post.commentCount} comments →</Press>
          )}
        </div>
      )}
    </div>
  );
}

function FooterAction({ icon, label, onTap, highlight }) {
  const color = highlight ? peep.warning : peep.textSec;
  return (
    <Press onTap={onTap} style={{
      display: 'flex', alignItems: 'center', gap: 5,
      fontSize: 12, fontWeight: 600, color,
    }}>
      <Icon name={icon} size={13} weight="regular" color={color} />
      <span>{label}</span>
    </Press>
  );
}

// ───────── Composer sheet ─────────
function ComposerSheet({ open, onClose, onPost }) {
  const [kind, setKind] = React.useState('discussion');
  const [text, setText] = React.useState('');
  const [shareAlert, setShareAlert] = React.useState(false);

  const submit = () => {
    if (!text.trim()) return;
    onPost({ kind, body: text.trim(), shareAlert });
    setText(''); setKind('discussion'); setShareAlert(false);
    onClose();
  };

  const kinds = [
    { key: 'alert',      label: 'Alert',        icon: 'warning' },
    { key: 'discussion', label: 'Discussion',   icon: 'chat-circle' },
    { key: 'lost',       label: 'Lost & Found', icon: 'magnifying-glass' },
  ];

  return (
    <Sheet open={open} onClose={onClose} title="Post to neighborhood" height="80%">
      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <div style={{ fontSize: 11, color: peep.textSec, textTransform: 'uppercase',
            letterSpacing: 0.5, fontWeight: 600, marginBottom: 8 }}>Type</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {kinds.map(k => (
              <Press key={k.key} onTap={() => setKind(k.key)} style={{
                flex: 1, padding: '10px 8px', borderRadius: 10,
                background: k.key === kind ? peep.accent : peep.surface2,
                color: k.key === kind ? '#000' : peep.text,
                fontSize: 12, fontWeight: 600, textAlign: 'center',
                display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center',
              }}>
                <Icon name={k.icon} size={18} weight="fill" color={k.key === kind ? '#000' : peep.accent} />
                <span>{k.label}</span>
              </Press>
            ))}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 11, color: peep.textSec, textTransform: 'uppercase',
            letterSpacing: 0.5, fontWeight: 600, marginBottom: 8 }}>Message</div>
          <textarea
            value={text} onChange={e => setText(e.target.value)}
            placeholder="Share what you saw, or what you need help with…"
            rows={6}
            style={{
              ...inputStyle, fontFamily: '-apple-system, "SF Pro", system-ui',
              resize: 'none', lineHeight: 1.45,
            }}
          />
        </div>

        {kind === 'alert' && (
          <Press onTap={() => setShareAlert(!shareAlert)} style={{
            background: shareAlert ? peep.accent + '22' : peep.surface2,
            border: shareAlert ? `1px solid ${peep.accent}99` : `0.5px solid ${peep.sep}`,
            borderRadius: 12, padding: 12,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <span style={{ fontSize: 20 }}>📡</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>
                Attach Peep clip from last 15 min
              </div>
              <div style={{ fontSize: 11, color: peep.textSec, marginTop: 2 }}>
                Adds vision-agent confidence + verified timestamp
              </div>
            </div>
            <div style={{
              width: 20, height: 20, borderRadius: 999,
              background: shareAlert ? peep.accent : 'transparent',
              border: shareAlert ? 'none' : `1.5px solid ${peep.textTer}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#000', fontSize: 12, fontWeight: 700,
            }}>{shareAlert ? '✓' : ''}</div>
          </Press>
        )}

        <div style={{
          padding: 12, borderRadius: 10, background: peep.bg,
          border: `0.5px dashed ${peep.sep}`,
          fontSize: 11, color: peep.textSec, lineHeight: 1.5,
        }}>
          Posts go to <strong style={{ color: peep.text }}>West End · 142 neighbors</strong>. Your address is shown as "1 door down" / "across the street" — not your unit.
        </div>

        <Press onTap={submit} style={{
          marginTop: 4,
          background: text.trim() ? peep.accent : peep.surface3,
          color: text.trim() ? '#000' : peep.textSec,
          borderRadius: 14, padding: '14px 16px',
          fontWeight: 600, fontSize: 15, textAlign: 'center',
        }}>Post to neighborhood</Press>
      </div>
    </Sheet>
  );
}

// ───────── Comments sheet ─────────
function CommentsSheet({ post, onClose }) {
  const [draft, setDraft] = React.useState('');
  const toast = useToast();
  if (!post) return null;

  return (
    <Sheet open={!!post} onClose={onClose} title="Comments" height="86%">
      <div style={{ padding: '0 20px 12px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{
          padding: 12, background: peep.surface, borderRadius: 12,
          fontSize: 13, color: peep.text, lineHeight: 1.45,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Avatar initials={post.author.initials} color={post.author.color} size={24} />
            <span style={{ fontSize: 12, fontWeight: 600 }}>{post.author.name}</span>
            <span style={{ fontSize: 11, color: peep.textSec }}>· {post.time}</span>
          </div>
          {post.body}
        </div>

        {post.comments.length === 0 && (
          <div style={{ fontSize: 12, color: peep.textSec, textAlign: 'center', padding: 24 }}>
            Be the first to comment.
          </div>
        )}
        {post.comments.map((c, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, padding: '4px 4px' }}>
            <Avatar initials={c.initials} color={c.color} size={32} />
            <div style={{
              flex: 1, background: peep.surface, borderRadius: 12,
              padding: '8px 12px',
            }}>
              <div style={{ fontSize: 12, fontWeight: 600 }}>{c.author}</div>
              <div style={{ fontSize: 13, color: peep.text, marginTop: 2, lineHeight: 1.4 }}>{c.text}</div>
            </div>
          </div>
        ))}

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', paddingTop: 8 }}>
          <input
            value={draft} onChange={e => setDraft(e.target.value)}
            placeholder="Add a comment…"
            style={{ ...inputStyle, padding: '10px 14px' }}
          />
          <Press onTap={() => {
            if (!draft.trim()) return;
            toast('Comment posted.', { icon: 'chat-circle' });
            setDraft('');
            onClose();
          }} style={{
            background: draft.trim() ? peep.accent : peep.surface3,
            color: draft.trim() ? '#000' : peep.textSec,
            padding: '10px 16px', borderRadius: 10,
            fontWeight: 600, fontSize: 14,
          }}>Send</Press>
        </div>
      </div>
    </Sheet>
  );
}

// ───────── Friends rail ─────────
function FriendsRail({ friends, onOpenFriend, onAddFriend }) {
  return (
    <div style={{ padding: '0 20px' }}>
      <div style={{
        display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
        marginBottom: 10,
      }}>
        <div style={{
          fontSize: 11, color: peep.textSec, textTransform: 'uppercase',
          letterSpacing: 0.5, fontWeight: 600,
        }}>Friends</div>
        <span style={{ fontSize: 11, color: peep.textTer }}>
          {friends.filter(f => f.online).length} online
        </span>
      </div>
      <div style={{
        display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4,
        scrollbarWidth: 'none',
      }} className="hide-scroll">
        <Press onTap={onAddFriend} style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
          minWidth: 60,
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: 999,
            background: peep.surface2, color: peep.textSec,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, fontWeight: 300,
            border: `1px dashed ${peep.sep}`,
          }}>+</div>
          <span style={{ fontSize: 11, color: peep.textSec, fontWeight: 500 }}>Add</span>
        </Press>
        {friends.map(f => (
          <Press key={f.id} onTap={() => onOpenFriend(f)} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
            minWidth: 60,
          }}>
            <div style={{ position: 'relative' }}>
              <Avatar initials={f.initials} color={f.color} size={52} />
              {f.online && (
                <div style={{
                  position: 'absolute', bottom: 0, right: 0,
                  width: 14, height: 14, borderRadius: 999,
                  background: peep.accent, border: `2px solid ${peep.bg}`,
                }} />
              )}
            </div>
            <span style={{
              fontSize: 11, color: peep.text, fontWeight: 500,
              maxWidth: 64, overflow: 'hidden', textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>{f.name.split(' ')[0]}</span>
          </Press>
        ))}
      </div>
    </div>
  );
}

// ───────── Conversation store (lives on window so all sheets share state) ──
// A conversation id is the friend's stable id ("f1"…). Each entry is a list
// of message records: { id, from:'me'|'them', authorId, authorName, text, ts }.
const _convoStore = (window._peepConvoStore ||= {
  data: new Map(),        // convoId → message[]
  subs: new Set(),
  get(convoId) { return this.data.get(convoId) || []; },
  set(convoId, msgs) { this.data.set(convoId, msgs); this.subs.forEach(fn => { try { fn(convoId); } catch {} }); },
  append(convoId, msg) {
    const cur = this.get(convoId);
    if (cur.some(m => m.id && m.id === msg.id)) return false;
    this.data.set(convoId, [...cur, msg]);
    this.subs.forEach(fn => { try { fn(convoId); } catch {} });
    return true;
  },
  subscribe(fn) { this.subs.add(fn); return () => this.subs.delete(fn); },
});

// One-time bootstrap: feed any inbound realtime messages into the store.
(function bootstrapConvoSync() {
  if (window._peepConvoBootstrapped) return;
  window._peepConvoBootstrapped = true;
  if (!window.PeepRT) return;
  const myClient = window.PeepRT.clientId();
  // Existing snapshot
  window.PeepRT.onSnapshot(({ messages }) => {
    for (const m of messages || []) {
      if (!m.conversationId) continue;
      const adapted = {
        id: m.id,
        from: m.fromClient === myClient ? 'me' : 'them',
        authorId: m.fromClient,
        authorName: m.fromName || 'Neighbor',
        text: m.text,
        ts: m.ts,
      };
      _convoStore.append(m.conversationId, adapted);
    }
  });
  // Live messages
  window.PeepRT.onMessage((m) => {
    if (!m?.conversationId) return;
    const adapted = {
      id: m.id,
      from: m.fromClient === myClient ? 'me' : 'them',
      authorId: m.fromClient,
      authorName: m.fromName || 'Neighbor',
      text: m.text,
      ts: m.ts,
    };
    _convoStore.append(m.conversationId, adapted);
  });
})();

// ───────── Message thread sheet (1:1 chat with a friend) ─────────
function MessageSheet({ friend, onClose }) {
  const [draft, setDraft] = React.useState('');
  const [, force] = React.useReducer(x => x + 1, 0);
  const scrollRef = React.useRef(null);
  const toast = useToast();

  // Seed conversation store with the friend's canned messages once.
  React.useEffect(() => {
    if (!friend) return;
    if (_convoStore.get(friend.id).length === 0 && Array.isArray(friend.seed)) {
      _convoStore.set(friend.id, friend.seed.map((m, i) => ({
        id: `seed_${friend.id}_${i}`,
        from: m.from,
        authorName: m.from === 'me' ? 'You' : friend.name,
        text: m.text,
        ts: Date.now() - (friend.seed.length - i) * 60000,
      })));
    }
  }, [friend && friend.id]);

  // Re-render when the active conversation changes.
  React.useEffect(() => {
    return _convoStore.subscribe(cid => { if (friend && cid === friend.id) force(); });
  }, [friend && friend.id]);

  React.useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  });

  if (!friend) return null;
  const messages = _convoStore.get(friend.id);

  const send = () => {
    const t = draft.trim();
    if (!t) return;
    setDraft('');
    const myId = window.PeepRT?.clientId() || 'local';
    const myName = (window.PeepProfile?.get && window.PeepProfile.get().name)
                || localStorage.getItem('peep.displayName')
                || 'You';
    const msg = {
      id: 'm_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      conversationId: friend.id,
      fromClient: myId,
      fromName: myName,
      to: friend.id,
      text: t,
      ts: Date.now(),
    };
    // optimistic local append (will be deduped if relay echoes back)
    _convoStore.append(friend.id, {
      id: msg.id, from: 'me', authorName: 'You', text: t, ts: msg.ts,
    });
    const sent = window.PeepRT?.sendMessage?.(msg);
    if (!sent) {
      // Offline / no relay — simulate the friend acking, like before.
      setTimeout(() => {
        _convoStore.append(friend.id, {
          id: 'sim_' + Math.random().toString(36).slice(2, 8),
          from: 'them', authorName: friend.name, text: '👍', ts: Date.now(),
        });
      }, 900);
    }
  };

  return (
    <Sheet open={!!friend} onClose={onClose} title={null} height="86%">
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* header */}
        <div style={{
          padding: '0 20px 12px', display: 'flex', alignItems: 'center', gap: 12,
          borderBottom: `0.5px solid ${peep.sep}`,
        }}>
          <div style={{ position: 'relative' }}>
            <Avatar initials={friend.initials} color={friend.color} size={42} />
            {friend.online && (
              <div style={{
                position: 'absolute', bottom: 0, right: 0,
                width: 12, height: 12, borderRadius: 999,
                background: peep.accent, border: `2px solid ${peep.surface}`,
              }} />
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: peep.text }}>{friend.name}</div>
            <div style={{ fontSize: 12, color: friend.online ? peep.accent : peep.textSec }}>
              {friend.online ? 'Active now' : 'Offline'}
            </div>
          </div>
        </div>

        {/* messages */}
        <div ref={scrollRef} style={{
          flex: 1, overflowY: 'auto', padding: '14px 16px',
          display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          {messages.length === 0 && (
            <div style={{
              textAlign: 'center', color: peep.textSec, fontSize: 13, padding: 24,
            }}>Say hi to {friend.name.split(' ')[0]}.</div>
          )}
          {messages.map((m, i) => {
            const mine = m.from === 'me';
            return (
              <div key={i} style={{
                display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start',
              }}>
                <div style={{
                  maxWidth: '78%',
                  background: mine ? peep.accent : peep.surface2,
                  color: mine ? '#fff' : peep.text,
                  padding: '8px 12px', borderRadius: 16,
                  borderBottomRightRadius: mine ? 4 : 16,
                  borderBottomLeftRadius: mine ? 16 : 4,
                  fontSize: 14, lineHeight: 1.35,
                  whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                }}>{m.text}</div>
              </div>
            );
          })}
        </div>

        {/* composer */}
        <div style={{
          padding: '10px 14px 16px', display: 'flex', gap: 8, alignItems: 'center',
          borderTop: `0.5px solid ${peep.sep}`,
        }}>
          <input
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') send(); }}
            placeholder={`Message ${friend.name.split(' ')[0]}…`}
            style={{ ...inputStyle, padding: '10px 14px', borderRadius: 999 }}
          />
          <Press onTap={send} style={{
            background: draft.trim() ? peep.accent : peep.surface3,
            color: draft.trim() ? '#fff' : peep.textSec,
            width: 40, height: 40, borderRadius: 999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Icon name="paper-plane-tilt" size={18} weight="fill"
              color={draft.trim() ? '#fff' : peep.textSec} />
          </Press>
        </div>
      </div>
    </Sheet>
  );
}

// ───────── Share ETA sheet (used by Live + Inbox) ─────────
function ShareEtaSheet({ open, delivery, onClose }) {
  const [picked, setPicked] = React.useState(new Set());
  const [note, setNote] = React.useState('');
  const toast = useToast();

  React.useEffect(() => {
    if (open) { setPicked(new Set()); setNote(''); }
  }, [open]);

  const toggle = (id) => setPicked(s => {
    const n = new Set(s);
    if (n.has(id)) n.delete(id); else n.add(id);
    return n;
  });

  const send = () => {
    if (picked.size === 0) return;
    const names = FRIENDS.filter(f => picked.has(f.id)).map(f => f.name.split(' ')[0]);
    const who = names.length === 1 ? names[0]
              : names.length === 2 ? names.join(' and ')
              : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
    toast(`ETA shared with ${who}.`, { icon: 'paper-plane-tilt' });
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose} title="Share ETA with a friend" height="80%">
      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* package summary */}
        {delivery && (
          <div style={{
            background: peep.surface2, borderRadius: 12, padding: 12,
            display: 'flex', gap: 10, alignItems: 'center',
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8,
              background: peep.surface, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name="package" size={20} weight="fill" color={peep.text} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: peep.text,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {delivery.item}
              </div>
              <div style={{ fontSize: 12, color: peep.textSec, marginTop: 2 }}>
                {delivery.carrier} · {delivery.eta || 'ETA pending'}
              </div>
            </div>
          </div>
        )}

        <div>
          <div style={{
            fontSize: 11, color: peep.textSec, textTransform: 'uppercase',
            letterSpacing: 0.5, fontWeight: 600, marginBottom: 8,
          }}>Send to</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {FRIENDS.map(f => {
              const on = picked.has(f.id);
              return (
                <Press key={f.id} onTap={() => toggle(f.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: 10, borderRadius: 12,
                  background: on ? peep.accentSoft : peep.surface,
                  border: on ? `1px solid ${peep.accent}99` : `0.5px solid ${peep.sep}`,
                }}>
                  <div style={{ position: 'relative' }}>
                    <Avatar initials={f.initials} color={f.color} size={36} />
                    {f.online && (
                      <div style={{
                        position: 'absolute', bottom: 0, right: 0,
                        width: 10, height: 10, borderRadius: 999,
                        background: peep.accent, border: `2px solid ${on ? peep.accentSoft : peep.surface}`,
                      }} />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: peep.text }}>{f.name}</div>
                    <div style={{ fontSize: 11, color: peep.textSec }}>
                      {f.online ? 'Active now' : 'Offline'}
                    </div>
                  </div>
                  <div style={{
                    width: 22, height: 22, borderRadius: 999,
                    background: on ? peep.accent : 'transparent',
                    border: on ? 'none' : `1.5px solid ${peep.textTer}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: 13, fontWeight: 700,
                  }}>{on ? '✓' : ''}</div>
                </Press>
              );
            })}
          </div>
        </div>

        <div>
          <div style={{
            fontSize: 11, color: peep.textSec, textTransform: 'uppercase',
            letterSpacing: 0.5, fontWeight: 600, marginBottom: 8,
          }}>Add a note (optional)</div>
          <textarea
            value={note} onChange={e => setNote(e.target.value)}
            placeholder="Hey, can you grab this if I’m not home?"
            rows={3}
            style={{ ...inputStyle, resize: 'none', lineHeight: 1.4 }}
          />
        </div>

        <Press onTap={send} style={{
          marginTop: 4,
          background: picked.size > 0 ? peep.accent : peep.surface3,
          color: picked.size > 0 ? '#fff' : peep.textSec,
          borderRadius: 14, padding: '14px 16px',
          fontWeight: 600, fontSize: 15, textAlign: 'center',
        }}>
          {picked.size === 0
            ? 'Pick at least one friend'
            : `Share ETA with ${picked.size} friend${picked.size > 1 ? 's' : ''}`}
        </Press>
      </div>
    </Sheet>
  );
}

// ───────── Community screen ─────────
function CommunityScreen({ posts: extPosts, setPosts: extSetPosts } = {}) {
  const [filter, setFilter] = React.useState('all');
  const [composerOpen, setComposerOpen] = React.useState(false);
  const [commentPost, setCommentPost] = React.useState(null);
  const [neighborIdx, setNeighborIdx] = React.useState(null);
  const [messagingFriend, setMessagingFriend] = React.useState(null);
  const [localPosts, setLocalPosts] = React.useState(COMMUNITY_POSTS);
  const posts = extPosts || localPosts;
  const setPosts = extSetPosts || setLocalPosts;
  const [rtStatus, setRtStatus] = React.useState(() => window.PeepRT?.status() || 'idle');
  const toast = useToast();

  // ── Realtime: ingest snapshot + live posts from other connected clients ──
  React.useEffect(() => {
    if (!window.PeepRT) return;
    const unsubSnap = window.PeepRT.onSnapshot(({ posts: incoming }) => {
      if (!incoming || !incoming.length) return;
      setPosts(cur => {
        const known = new Set(cur.map(p => p.id));
        const fresh = incoming.filter(p => !known.has(p.id));
        return fresh.length ? [...fresh, ...cur] : cur;
      });
    });
    const unsubPost = window.PeepRT.onPost(post => {
      setPosts(cur => cur.some(p => p.id === post.id) ? cur : [post, ...cur]);
    });
    const unsubStatus = window.PeepRT.onStatus(setRtStatus);
    return () => { unsubSnap(); unsubPost(); unsubStatus(); };
  }, [setPosts]);

  const counts = React.useMemo(() => {
    const c = { all: posts.length };
    for (const f of POST_TYPES.slice(1)) {
      c[f.key] = posts.filter(p => p.kind === f.key).length;
    }
    return c;
  }, [posts]);

  const filtered = filter === 'all' ? posts : posts.filter(p => p.kind === filter);

  const handleReact = (post, emoji) => {
    setPosts(ps => ps.map(p => {
      if (p.id !== post.id) return p;
      const r = { ...p.reactions };
      if (p.reactedByMe === emoji) {
        r[emoji] = (r[emoji] || 1) - 1;
        if (r[emoji] <= 0) delete r[emoji];
        return { ...p, reactions: r, reactedByMe: null };
      }
      if (p.reactedByMe) {
        r[p.reactedByMe] = Math.max(0, (r[p.reactedByMe] || 1) - 1);
        if (r[p.reactedByMe] === 0) delete r[p.reactedByMe];
      }
      r[emoji] = (r[emoji] || 0) + 1;
      return { ...p, reactions: r, reactedByMe: emoji };
    }));
  };

  const handlePost = ({ kind, body, shareAlert }) => {
    const newPost = {
      id: 'me_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      kind,
      sharedByPeep: shareAlert,
      author: { initials: 'YOU', color: peep.blue, name: 'You', distance: '142 Linden St' },
      time: 'Just now',
      body,
      eventType: shareAlert ? 'person_loitering' : null,
      confidence: shareAlert ? 0.79 : null,
      reactions: {},
      commentCount: 0,
      comments: [],
      corroborations: 0,
    };
    setPosts(ps => [newPost, ...ps]);
    const broadcasted = window.PeepRT?.sendPost?.(newPost);
    toast(broadcasted ? 'Posted · synced to West End.' : 'Posted to West End.', { icon: '📨' });
  };

  return (
    <>
      <Screen title="Community">
        {/* + post button */}
        <Press onTap={() => setComposerOpen(true)} style={{
          position: 'absolute', top: 60, right: 20, zIndex: 20,
          width: 32, height: 32, borderRadius: 999,
          background: peep.surface2, color: peep.accent,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, lineHeight: 1, fontWeight: 300,
        }}>+</Press>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 24 }}>
          {/* neighborhood header */}
          <div style={{ padding: '0 20px', fontSize: 13, color: peep.textSec }}>
            {NEIGHBORHOOD.name} · {NEIGHBORHOOD.neighbors} neighbors · {NEIGHBORHOOD.peepCameras} Peep cameras
          </div>

          {/* pulse */}
          <NeighborhoodPulse onTapCamera={(i) => setNeighborIdx(i)} />

          {/* friends rail */}
          <FriendsRail
            friends={FRIENDS}
            onOpenFriend={(f) => setMessagingFriend(f)}
            onAddFriend={() => toast('Friend invite copied to clipboard.', { icon: 'link' })}
          />

          {/* filter chips */}
          <HScrollChips>
            {POST_TYPES.map(f => {
              const on = f.key === filter;
              return (
                <Press key={f.key} onTap={() => setFilter(f.key)} style={{
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

          {/* feed */}
          <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.length === 0 ? (
              <div style={{
                padding: 40, display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 12,
              }}>
                <div style={{ fontSize: 36, opacity: 0.4 }}>·</div>
                <div style={{ fontSize: 13, color: peep.textSec, textAlign: 'center' }}>
                  Nothing in this category yet.
                </div>
              </div>
            ) : (
              filtered.map(post => (
                <PostCard
                  key={post.id}
                  post={post}
                  onReact={handleReact}
                  onComment={() => setCommentPost(post)}
                />
              ))
            )}
          </div>

          <div style={{
            textAlign: 'center', padding: '12px 20px',
            fontSize: 11, color: peep.textTer,
          }}>End of feed</div>
        </div>
      </Screen>

      <ComposerSheet open={composerOpen} onClose={() => setComposerOpen(false)} onPost={handlePost} />
      <CommentsSheet post={commentPost} onClose={() => setCommentPost(null)} />
      <NeighborSheet
        idx={neighborIdx}
        onClose={() => setNeighborIdx(null)}
        onWave={(neighbor) => { toast(`Wave sent to ${neighbor.who}.`, { icon: 'hand-waving' }); setNeighborIdx(null); }}
        onMessage={(neighbor) => {
          setNeighborIdx(null);
          // open chat with matching friend, or create an ad-hoc one for this neighbor
          const match = FRIENDS.find(f => f.name === neighbor.who);
          setMessagingFriend(match || {
            id: 'n_' + neighbor.initials,
            name: neighbor.who, initials: neighbor.initials, color: neighbor.color,
            online: false, seed: [],
          });
        }}
      />
      <MessageSheet friend={messagingFriend} onClose={() => setMessagingFriend(null)} />
    </>
  );
}

// ───────── Neighbor sheet ─────────
function NeighborSheet({ idx, onClose, onWave, onMessage }) {
  if (idx == null) return null;
  const cam = NEIGHBORHOOD.cameras[idx];
  const n = NEIGHBOR_INFO[idx];
  if (!cam || !n) return null;
  const [, , state] = cam;
  const stateColor = state === 'alert' ? peep.warning
                  : state === 'active' ? peep.accent
                  : state === 'self'  ? peep.blue
                  : peep.textTer;
  const stateLabel = state === 'alert' ? 'Active alert'
                  : state === 'active' ? 'Live event'
                  : state === 'self'  ? 'Your camera'
                  : 'Idle · all clear';

  return (
    <Sheet open={idx != null} onClose={onClose} title={null} height="70%">
      <div style={{ padding: '0 20px 8px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Avatar initials={n.initials} color={n.color} size={56} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 20, fontWeight: 600 }}>{n.who}</div>
            <div style={{
              fontSize: 12, color: peep.textSec, marginTop: 2,
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            }}>{n.addr}</div>
          </div>
        </div>

        {/* state pill */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '8px 12px', borderRadius: 12,
          background: stateColor + '22', border: `0.5px solid ${stateColor}66`,
          alignSelf: 'flex-start',
        }}>
          <div style={{
            width: 8, height: 8, borderRadius: 999, background: stateColor,
            animation: state === 'alert' ? 'peepPulse 1.5s ease-in-out infinite' : undefined,
          }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: stateColor }}>
            {stateLabel}
          </span>
        </div>

        {/* stats */}
        <div style={{
          display: 'flex', gap: 8,
        }}>
          <NeighborStat label="On Peep" value={n.joined} />
          <NeighborStat label="Last 24h" value={state === 'idle' || state === 'self' ? '0 alerts' : '1 alert'} />
          <NeighborStat label="Distance" value={distanceLabel(idx)} />
        </div>

        {/* last activity */}
        <div style={{
          background: peep.surface, borderRadius: 12, padding: 14,
          display: 'flex', flexDirection: 'column', gap: 4,
        }}>
          <div style={{ fontSize: 11, color: peep.textSec, textTransform: 'uppercase',
            letterSpacing: 0.5, fontWeight: 600 }}>Most recent</div>
          <div style={{ fontSize: 14, color: peep.text }}>{n.lastSeen}</div>
        </div>

        {/* mini map showing this neighbor highlighted */}
        <div style={{
          position: 'relative', aspectRatio: '2 / 1', borderRadius: 10, overflow: 'hidden',
          background: '#070809',
        }}>
          {[28, 72].map(t => (
            <div key={'h'+t} style={{ position: 'absolute', left: 0, right: 0, top: `${t}%`, height: 6,
              background: 'rgba(255,255,255,0.04)' }} />
          ))}
          {[30, 70].map(l => (
            <div key={'v'+l} style={{ position: 'absolute', top: 0, bottom: 0, left: `${l}%`, width: 6,
              background: 'rgba(255,255,255,0.04)' }} />
          ))}
          {NEIGHBORHOOD.cameras.map(([x, y, st], i) => {
            const isMe = i === idx;
            const c = isMe ? stateColor
                    : st === 'alert' ? peep.warning + '66'
                    : st === 'active' ? peep.accent + '66'
                    : st === 'self'  ? peep.blue + '66'
                    : peep.textTer + '55';
            return (
              <div key={i} style={{
                position: 'absolute', left: `${x}%`, top: `${y}%`,
                width: isMe ? 12 : 6, height: isMe ? 12 : 6, borderRadius: 999,
                background: c, transform: 'translate(-50%, -50%)',
                boxShadow: isMe ? `0 0 0 8px ${stateColor}33, 0 0 14px ${stateColor}` : 'none',
                animation: isMe ? 'peepPulse 1.2s ease-in-out infinite' : undefined,
              }} />
            );
          })}
        </div>

        {/* actions */}
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          {n.who !== 'You' && (
            <Press onTap={() => onWave(n)} style={{
              flex: 1, padding: '12px', borderRadius: 12, background: peep.surface2,
              color: peep.text, fontSize: 14, fontWeight: 600, textAlign: 'center',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}><Icon name="hand-waving" size={16} weight="fill" color={peep.text} /> Wave</Press>
          )}
          <Press onTap={() => onMessage && onMessage(n)} style={{
            flex: 1, padding: '12px', borderRadius: 12, background: peep.accent,
            color: '#fff', fontSize: 14, fontWeight: 600, textAlign: 'center',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            <Icon name="chat-circle" size={16} weight="fill" color="#fff" /> Message
          </Press>
        </div>

        <div style={{
          padding: 10, borderRadius: 10, background: peep.bg,
          border: `0.5px dashed ${peep.sep}`,
          fontSize: 11, color: peep.textSec, lineHeight: 1.5,
        }}>
          Camera locations are shown at street-level only. Peep never shares exact unit, schedule, or footage without per-event consent.
        </div>
      </div>
    </Sheet>
  );
}

function NeighborStat({ label, value }) {
  return (
    <div style={{
      flex: 1, background: peep.surface, borderRadius: 10, padding: 10,
      display: 'flex', flexDirection: 'column', gap: 2,
    }}>
      <span style={{ fontSize: 10, color: peep.textSec, textTransform: 'uppercase',
        letterSpacing: 0.4, fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: peep.text,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>{value}</span>
    </div>
  );
}

function distanceLabel(idx) {
  // anchor at self camera (index 11 in our seed)
  const selfIdx = NEIGHBORHOOD.cameras.findIndex(c => c[2] === 'self');
  if (idx === selfIdx) return 'you';
  const [sx, sy] = NEIGHBORHOOD.cameras[selfIdx];
  const [x, y]   = NEIGHBORHOOD.cameras[idx];
  const d = Math.hypot(x - sx, y - sy);
  if (d < 15)  return '1 door';
  if (d < 25)  return '2 doors';
  if (d < 40)  return '½ block';
  return '1 block';
}

Object.assign(window, {
  CommunityScreen, NeighborhoodPulse, PostCard, ComposerSheet,
  Avatar, ReactionBar,
  FRIENDS, FriendsRail, MessageSheet, ShareEtaSheet, buildEventPost,
});
