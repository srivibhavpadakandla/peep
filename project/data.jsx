// Mock data for Peep console

const EVENT_TYPES = {
  package_arrived:      { label: 'Package arrived',     icon: 'package',          severity: 'info',     action: 'Logged delivery' },
  package_taken:        { label: 'Package taken',       icon: 'hand-grabbing',    severity: 'critical', action: 'Filed refund with Amazon' },
  package_fleeing:      { label: 'Suspect fleeing with package', icon: 'lightning', severity: 'critical', action: 'Sent security email + filed refund' },
  package_not_arrived:  { label: 'Package never arrived', icon: 'package',        severity: 'high',     action: 'Filed "never arrived" claim' },
  person_loitering:     { label: 'Person loitering',    icon: 'person',           severity: 'warning',  action: 'Sent security email' },
  multiple_loitering:   { label: 'Multiple people loitering', icon: 'users-three', severity: 'high',    action: 'Sent security email' },
  weapon_detected:      { label: 'Weapon detected',     icon: 'siren',            severity: 'critical', action: 'Sent security email · requires acknowledgment' },
  after_hours_activity: { label: 'After-hours activity', icon: 'moon',            severity: 'warning',  action: 'Sent security email' },
  animal_detected:      { label: 'Animal detected',     icon: 'paw-print',        severity: 'info',     action: 'Logged sighting' },
};

// ── User profile (editable; persisted in localStorage) ─────────────────────
window.PeepProfile = (function () {
  const KEYS = { name: 'peep.profile.name', email: 'peep.profile.email' };
  const DEFAULTS = { name: 'Jamie Mendoza', email: 'jamie@hello.com' };
  const subs = new Set();
  const read = () => ({
    name:  localStorage.getItem(KEYS.name)  || DEFAULTS.name,
    email: localStorage.getItem(KEYS.email) || DEFAULTS.email,
  });
  return {
    get: read,
    set(patch) {
      if (patch.name  != null) localStorage.setItem(KEYS.name,  patch.name);
      if (patch.email != null) localStorage.setItem(KEYS.email, patch.email);
      const cur = read();
      subs.forEach(fn => { try { fn(cur); } catch {} });
    },
    subscribe(fn) { subs.add(fn); return () => subs.delete(fn); },
  };
})();

// ── Runtime log buffer ─ vision/orch/browser/system can append at any time ─
window.PeepLiveLogs = (function () {
  const arr = [];
  const subs = new Set();
  return {
    all: () => arr.slice(),
    append({ source = 'system', text }) {
      if (!text) return;
      arr.unshift({ t: new Date(), source, text, live: true });
      if (arr.length > 200) arr.length = 200;
      subs.forEach(fn => { try { fn(arr.slice()); } catch {} });
    },
    subscribe(fn) { subs.add(fn); return () => subs.delete(fn); },
  };
})();

const SEVERITY = {
  info:     { color: '#758082', label: 'info',     bg: 'rgba(117,128,130,0.08)',  ring: 'rgba(117,128,130,0.25)' },
  warning:  { color: '#b3bd80', label: 'warning',  bg: 'rgba(179,189,128,0.10)',  ring: 'rgba(179,189,128,0.30)' },
  high:     { color: '#7ea582', label: 'high',     bg: 'rgba(126,165,130,0.10)',  ring: 'rgba(126,165,130,0.30)' },
  critical: { color: '#5d4f78', label: 'critical', bg: 'rgba(93,79,120,0.10)',    ring: 'rgba(93,79,120,0.30)' },
};

const AGENTS = [
  {
    id: 'vision',
    name: 'Vision',
    role: 'Watches every frame. Detects objects with COCO-SSD.',
    color: '#758082', // slate
    explainer: "Reads the live camera in your browser. Doesn't decide anything — just emits what it sees, with a confidence score."
  },
  {
    id: 'orchestrator',
    name: 'Orchestrator',
    role: 'Routes events to the right workflow. Drops noise below 50%.',
    color: '#7ea582', // sage
    explainer: 'The traffic cop. Decides which events are worth thinking about, and which to throw away.'
  },
  {
    id: 'reasoning',
    name: 'Reasoning',
    role: 'Verifies events as REAL or FALSE_POSITIVE.',
    color: '#b3bd80', // olive
    explainer: "Looks at the broader context — who's in frame, when, what they're doing — and decides whether this actually warrants action."
  },
  {
    id: 'executor',
    name: 'Executor',
    role: 'Takes exactly one autonomous action. Never chains.',
    color: '#706b8e', // plum accent
    explainer: 'The hands. Sends one email, files one refund, logs one alert — then stops. By design.'
  },
];

// --- Helpers to build timestamps ---
const today = new Date();
today.setHours(14, 0, 0, 0);
const dayMs = 24 * 60 * 60 * 1000;
const tMinus = (mins) => new Date(today.getTime() - mins * 60000);
const fmtTime = (d) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
const fmtTimeS = (d) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
const fmtDay = (d) => {
  const now = new Date();
  const diffDays = Math.floor((now - d) / dayMs);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

// --- Mock agent runs (orchestrator -> reasoning -> executor traces) ---
// Each event has a full trace through the four agents.
const buildEvent = (e) => ({
  id: e.id,
  type: e.type,
  timestamp: e.ts,
  confidence: e.confidence,
  vision: {
    sentence: e.vision,
    timing_ms: e.tv ?? 78,
    json: {
      class: e.cls,
      bbox: e.bbox ?? [212, 144, 388, 612],
      confidence: e.confidence,
      frame_id: 'frm_' + Math.random().toString(36).slice(2, 8),
    }
  },
  orchestrator: {
    sentence: e.orch,
    timing_ms: e.to ?? 12,
    json: {
      routed_to: 'reasoning',
      workflow: e.type,
      confidence_gate: 'passed (>= 0.50)',
    }
  },
  reasoning: {
    sentence: e.reason,
    verdict: e.verdict ?? 'REAL',
    failing_rule: e.failingRule,
    timing_ms: e.tr ?? 612,
    json: {
      verdict: e.verdict ?? 'REAL',
      rule_evaluated: e.failingRule ?? 'context_dwell_check',
      reasoning: e.reasonLong ?? e.reason,
      model: 'claude-haiku-4-5',
    }
  },
  executor: e.exec ? {
    sentence: e.exec,
    action: EVENT_TYPES[e.type].action,
    reference: e.ref,
    timing_ms: e.te ?? 1240,
    json: {
      action: EVENT_TYPES[e.type].action,
      reference_id: e.ref,
      destination: e.dest,
      status: 'success',
    }
  } : null,
});

const EVENTS = [
  buildEvent({
    id: 'evt_a1', type: 'person_loitering', ts: tMinus(2), confidence: 0.91,
    cls: 'person', vision: 'Person at the front door for 14 seconds.',
    orch: 'Routed to security workflow.',
    reason: 'Real. Movement is minimal and dwell time exceeds the 12-second threshold.',
    failingRule: 'dwell_exceeds_12s', verdict: 'REAL',
    exec: 'Security email queued to jamie@hello.com.', ref: 'MSG-7K2P9X', dest: 'jamie@hello.com',
    to: 9, tr: 587, te: 1180,
  }),
  buildEvent({
    id: 'evt_a2', type: 'package_arrived', ts: tMinus(38), confidence: 0.96,
    cls: 'package', vision: 'Cardboard box placed on porch.',
    orch: 'Routed to delivery workflow.',
    reason: 'Real. Matches the expected Amazon delivery window for order #112-8847.',
    failingRule: 'match_expected_delivery',
    exec: "Logged delivery. Marked order #112-8847 as 'Received'.", ref: 'LOG-44A1', dest: 'local',
    to: 8, tr: 410, te: 220,
  }),
  buildEvent({
    id: 'evt_a3', type: 'animal_detected', ts: tMinus(74), confidence: 0.84,
    cls: 'dog', vision: 'Dog walked past the porch.',
    orch: 'Routed to passive log workflow.',
    reason: 'Real. Domestic animal class — no escalation required.',
    failingRule: 'animal_class_check',
    exec: 'Logged sighting. No action taken.', ref: 'LOG-44A0', dest: 'local',
    to: 7, tr: 290, te: 80,
  }),
  buildEvent({
    id: 'evt_a4', type: 'multiple_loitering', ts: tMinus(180), confidence: 0.88,
    cls: 'person ×2', vision: 'Two people at the door for 22 seconds.',
    orch: 'Routed to security workflow.',
    reason: 'Real. Two persons co-present beyond the 12-second threshold.',
    failingRule: 'multi_person_dwell',
    exec: 'Security email sent to jamie@hello.com.', ref: 'MSG-7J9N1A', dest: 'jamie@hello.com',
    to: 10, tr: 720, te: 1390,
  }),
  buildEvent({
    id: 'evt_a5', type: 'package_taken', ts: tMinus(245), confidence: 0.93,
    cls: 'person + package', vision: 'Person picked up package and left frame.',
    orch: 'Routed to theft workflow.',
    reason: 'Real. Person is not in delivery uniform and order #112-8826 was already marked received yesterday.',
    failingRule: 'unauthorized_pickup',
    exec: 'Refund claim filed with Amazon.', ref: 'RFND-XQ7K9', dest: 'amazon.com',
    to: 14, tr: 912, te: 2210,
  }),
  buildEvent({
    id: 'evt_a6', type: 'person_loitering', ts: tMinus(412), confidence: 0.41,
    cls: 'person', vision: 'Brief silhouette in frame.',
    orch: 'Dropped. Confidence 0.41 < gate 0.50.',
    reason: '—',
    failingRule: 'confidence_gate', verdict: 'DROPPED',
    exec: null,
    to: 4, tr: 0,
  }),
  buildEvent({
    id: 'evt_a7', type: 'weapon_detected', ts: tMinus(620), confidence: 0.79,
    cls: 'weapon-like', vision: 'Object resembling a long tool, held by person.',
    orch: 'Routed to weapon workflow.',
    reason: 'False positive. Object classified as a garden rake based on aspect ratio and handle taper.',
    failingRule: 'weapon_shape_disambiguation', verdict: 'FALSE_POSITIVE',
    exec: null,
    to: 11, tr: 1410,
  }),
  // --- Yesterday ---
  buildEvent({
    id: 'evt_b1', type: 'after_hours_activity', ts: tMinus(1080), confidence: 0.86,
    cls: 'person', vision: 'Person at door at 02:14 local time.',
    orch: 'Routed to after-hours workflow.',
    reason: 'Real. Inside the configured quiet-hours window (22:00 – 06:00).',
    failingRule: 'within_quiet_hours',
    exec: 'Security email sent.', ref: 'MSG-6T4Q3B', dest: 'jamie@hello.com',
    to: 9, tr: 645, te: 1520,
  }),
  buildEvent({
    id: 'evt_b2', type: 'animal_detected', ts: tMinus(1340), confidence: 0.77,
    cls: 'bear', vision: 'Large quadruped on porch.',
    orch: 'Routed to high-severity animal workflow.',
    reason: 'Real. Class is bear — escalation rule applies.',
    failingRule: 'animal_class_check',
    exec: 'Security email sent. Bear sighting flagged.', ref: 'MSG-6S1K7D', dest: 'jamie@hello.com',
    to: 9, tr: 510, te: 1380,
  }),
  buildEvent({
    id: 'evt_b3', type: 'package_not_arrived', ts: tMinus(1620), confidence: 0.99,
    cls: '(rule-based)', vision: 'No package detected within delivery window.',
    orch: 'Routed to delivery dispute workflow.',
    reason: "Real. Amazon marked order #112-8800 as delivered 4 hours ago; no delivery event was seen on camera.",
    failingRule: 'expected_delivery_missing',
    exec: '"Never arrived" claim filed with Amazon.', ref: 'RFND-MQ2L4', dest: 'amazon.com',
    to: 15, tr: 1080, te: 2470,
  }),
  buildEvent({
    id: 'evt_b4', type: 'package_arrived', ts: tMinus(1740), confidence: 0.95,
    cls: 'package', vision: 'Padded mailer placed on porch.',
    orch: 'Routed to delivery workflow.',
    reason: 'Real. Matched expected order #112-8799.',
    failingRule: 'match_expected_delivery',
    exec: "Logged delivery. Marked order #112-8799 as 'Received'.", ref: 'LOG-42B7', dest: 'local',
    to: 8, tr: 380, te: 215,
  }),
];

// --- Mock inbox (today's expected deliveries) ---
const INBOX = [
  { id: '112-8847-2031', item: 'Anker USB-C charging brick, 65W', status: 'received', from: 'Amazon', eta: '11:30 AM' },
  { id: '112-8849-1148', item: 'Hario V60 paper filters (200 ct)', status: 'pending', from: 'Amazon', eta: '2:15 PM' },
  { id: '112-8851-7702', item: 'Sony WH-1000XM5 replacement earpads', status: 'pending', from: 'Amazon', eta: '4:00 PM' },
  { id: 'UPS-7Z44K1', item: '"Birds of North America" — Sibley, hardcover', status: 'pending', from: 'UPS', eta: '5:30 PM' },
];

// --- Mock logs ---
const LOG_SOURCES = ['vision', 'orchestration', 'browser', 'system'];
const LOGS = [
  { t: tMinus(0.3),  source: 'vision',        text: 'Detector running at 12.4 fps.' },
  { t: tMinus(2),    source: 'orchestration', text: 'Routed person_loitering (0.91) → reasoning.' },
  { t: tMinus(2),    source: 'system',        text: 'Security email sent to jamie@hello.com. Reference MSG-7K2P9X.' },
  { t: tMinus(8),    source: 'vision',        text: 'Person entered frame (bbox 212×144 → 388×612).' },
  { t: tMinus(38),   source: 'orchestration', text: 'Routed package_arrived (0.96) → reasoning.' },
  { t: tMinus(38),   source: 'system',        text: "Marked order #112-8847 as 'Received'." },
  { t: tMinus(45),   source: 'browser',       text: 'Gmail sweep: 1 new delivery email from Amazon.' },
  { t: tMinus(74),   source: 'vision',        text: 'Detected dog on porch (0.84).' },
  { t: tMinus(180),  source: 'orchestration', text: 'Routed multiple_loitering (0.88) → reasoning.' },
  { t: tMinus(245),  source: 'orchestration', text: 'Routed package_taken (0.93) → reasoning.' },
  { t: tMinus(245),  source: 'system',        text: 'Refund filed with Amazon. Reference RFND-XQ7K9.' },
  { t: tMinus(412),  source: 'orchestration', text: 'Dropped person_loitering (0.41) — below gate.' },
  { t: tMinus(620),  source: 'orchestration', text: 'Routed weapon_detected (0.79) → reasoning.' },
  { t: tMinus(620),  source: 'system',        text: 'Reasoning verdict: FALSE_POSITIVE. No executor action taken.' },
  { t: tMinus(1080), source: 'system',        text: 'Security email sent (after_hours_activity). MSG-6T4Q3B.' },
  { t: tMinus(1340), source: 'system',        text: 'Bear sighting flagged. Email sent. MSG-6S1K7D.' },
  { t: tMinus(1620), source: 'system',        text: '"Never arrived" claim filed at Amazon. RFND-MQ2L4.' },
];

const USAGE = {
  cost_usd: 0.0734,
  tokens: 18421,
  calls: 41,
  recent: [
    { t: tMinus(2),   workflow: 'person_loitering',   tokens: 612,  cost: 0.0021 },
    { t: tMinus(38),  workflow: 'package_arrived',    tokens: 410,  cost: 0.0014 },
    { t: tMinus(180), workflow: 'multiple_loitering', tokens: 720,  cost: 0.0025 },
    { t: tMinus(245), workflow: 'package_taken',      tokens: 912,  cost: 0.0031 },
    { t: tMinus(620), workflow: 'weapon_detected',    tokens: 1410, cost: 0.0049 },
    { t: tMinus(1080),workflow: 'after_hours_activity',tokens: 645, cost: 0.0022 },
  ],
};

// --- New events to inject every ~8s ---
const NEW_EVENT_POOL = [
  {
    type: 'person_loitering', cls: 'person', confidence: 0.83,
    vision: 'Person at the front door for 9 seconds.',
    orch: 'Routed to security workflow.',
    reason: 'Watching. Dwell time 9s — below threshold (12s).',
    failingRule: 'dwell_check', verdict: 'WATCHING',
    exec: null, to: 8, tr: 320,
  },
  {
    type: 'animal_detected', cls: 'cat', confidence: 0.71,
    vision: 'Cat crossed porch from left to right.',
    orch: 'Routed to passive log workflow.',
    reason: 'Real. Domestic animal class — no escalation.',
    failingRule: 'animal_class_check',
    exec: 'Logged sighting.', ref: 'LOG-44A2', dest: 'local',
    to: 7, tr: 240, te: 78,
  },
  {
    type: 'package_arrived', cls: 'package', confidence: 0.94,
    vision: 'Small box placed on porch by courier.',
    orch: 'Routed to delivery workflow.',
    reason: 'Real. Matches expected order #112-8849.',
    failingRule: 'match_expected_delivery',
    exec: "Marked order #112-8849 as 'Received'.", ref: 'LOG-44A3', dest: 'local',
    to: 9, tr: 380, te: 195,
  },
];

Object.assign(window, {
  EVENT_TYPES, SEVERITY, AGENTS, EVENTS, INBOX, LOGS, LOG_SOURCES, USAGE, NEW_EVENT_POOL,
  buildEvent, fmtTime, fmtTimeS, fmtDay, tMinus,
});
