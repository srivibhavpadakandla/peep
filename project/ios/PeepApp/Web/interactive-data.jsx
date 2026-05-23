/* Peep — shared tokens, data, helpers */

const peep = {
  // Sage + slate + plum palette
  bg:       '#f5f3ec',
  surface:  '#ffffff',
  surface2: '#edebe2',
  surface3: '#dfdcd2',
  text:     '#3d3548',     // deep plum-charcoal
  textSec:  '#71807d',     // slate green-gray
  textTer:  '#a8a89e',
  sep:      'rgba(61,53,72,0.10)',
  accent:   '#6a9971',     // sage green — actions
  accentSoft: 'rgba(106,153,113,0.12)',
  critical: '#574b6a',     // deep plum — escalation
  high:     '#6e6082',     // muted purple
  warning:  '#aebb7d',     // olive
  info:     '#71807d',     // slate
  blue:     '#6e6082',
  delivery: '#71807d',
};

const sevColor = (s) => ({ critical: peep.critical, high: peep.high, warning: peep.warning, info: peep.info }[s]);
const sevLabel = (s) => ({ critical: 'Critical', high: 'High', warning: 'Warning', info: 'Info' }[s]);

const eventMeta = {
  package_arrived:      { label: 'Package arrived',           icon: 'package',         severity: 'info',     category: 'package' },
  package_taken:        { label: 'Package taken',             icon: 'package',         severity: 'critical', category: 'package' },
  package_not_arrived:  { label: 'Package never arrived',     icon: 'package',         severity: 'high',     category: 'package' },
  person_loitering:     { label: 'Person loitering',          icon: 'person-simple',   severity: 'warning',  category: 'people' },
  multiple_loitering:   { label: 'Multiple people loitering', icon: 'users-three',     severity: 'high',     category: 'people' },
  weapon_detected:      { label: 'Weapon detected',           icon: 'warning-octagon', severity: 'critical', category: 'people' },
  after_hours_activity: { label: 'After-hours activity',      icon: 'moon-stars',      severity: 'warning',  category: 'people' },
  animal_detected:      { label: 'Animal detected',           icon: 'paw-print',       severity: 'info',     category: 'animal' },
};

const FILTERS = [
  { key: 'all',     label: 'All' },
  { key: 'package', label: 'Packages' },
  { key: 'people',  label: 'People' },
  { key: 'animal',  label: 'Animals' },
];

const TODAY_EVENTS = [
  { id: 't1', type: 'package_taken',     time: '2:32 PM',  conf: 0.94, receipt: 'RFND-XQ7K9-PJZ4',
    metadata: { carrier: 'Amazon', duration_s: 7 },
    door_address: '142 Linden St' },
  { id: 't2', type: 'package_arrived',   time: '1:58 PM',  conf: 0.97, metadata: { carrier: 'Amazon' } },
  { id: 't3', type: 'person_loitering',  time: '12:11 PM', conf: 0.81, metadata: { duration_s: 8 } },
  { id: 't4', type: 'animal_detected',   time: '10:04 AM', conf: 0.88, metadata: { species: 'dog' } },
  { id: 't5', type: 'package_arrived',   time: '9:21 AM',  conf: 0.96, metadata: { carrier: 'UPS' } },
];

const YEST_EVENTS = [
  { id: 'y1', type: 'after_hours_activity', time: '11:58 PM', conf: 0.73 },
  { id: 'y2', type: 'multiple_loitering',   time: '10:47 PM', conf: 0.79, metadata: { count: 3 } },
  { id: 'y3', type: 'weapon_detected',      time: '9:12 PM',  conf: 0.62, metadata: { object: 'unknown_metal' } },
  { id: 'y4', type: 'package_not_arrived',  time: '7:30 PM',  conf: 0.99, metadata: { order_id: '114-2238871-9920443' } },
  { id: 'y5', type: 'package_arrived',      time: '3:05 PM',  conf: 0.95, metadata: { carrier: 'FedEx' } },
  { id: 'y6', type: 'animal_detected',      time: '6:42 AM',  conf: 0.91, metadata: { species: 'bear' } },
];

// Similar-events lookup: for a given event, pick recent events of same category.
function similarTo(ev, all) {
  const cat = eventMeta[ev.type].category;
  return all.filter(e => e.id !== ev.id && eventMeta[e.type].category === cat).slice(0, 4);
}

function decisionLine(type) {
  if (type === 'package_taken')       return 'decided to file refund';
  if (type === 'package_not_arrived') return 'decided to file missing claim';
  if (type === 'weapon_detected')     return 'escalated · awaiting human review';
  return 'logged alert';
}

function browserLine(type, receipt) {
  if (type === 'package_taken')       return `receipt ${receipt}`;
  if (type === 'package_not_arrived') return `claim ${receipt}`;
  return 'no action taken';
}

function statusMessage(state) {
  const pending = state.deliveries.filter(d => !d.received).length;
  if (pending === 0) return 'All quiet.';
  if (pending === 1) return 'Watching · 1 delivery expected today';
  return `Watching · ${pending} deliveries expected today`;
}

function genReceipt() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const r = (n) => Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `RFND-${r(5)}-${r(4)}`;
}

// ───────── Human-friendly text helpers ─────────
function confidenceLabel(c) {
  if (c >= 0.9)  return 'High confidence';
  if (c >= 0.75) return 'Medium confidence';
  return 'Low confidence';
}

// Map raw metadata keys to friendly label + formatted value.
function humanizeMeta(key, raw) {
  const v = String(raw);
  switch (key) {
    case 'duration_s': return { label: 'Duration',   value: `${v} sec` };
    case 'carrier':    return { label: 'Carrier',    value: v };
    case 'species':    return { label: 'Animal',     value: v.charAt(0).toUpperCase() + v.slice(1) };
    case 'count':      return { label: 'People',     value: v };
    case 'object':     return { label: 'Object',     value: v.replace(/_/g, ' ') };
    case 'order_id':   return { label: 'Order',      value: v };
    case 'source':     return { label: 'Source',     value: v.replace(/_/g, ' ') };
    default:           return { label: key.replace(/_/g, ' ').replace(/^./, m => m.toUpperCase()), value: v };
  }
}

// Friendly agent-step labels for "What Peep did".
function friendlyStep(role) {
  return {
    vision:  'Spotted',
    claude:  'Verified',
    orchestration: 'Decided',
    browser: 'Filed action',
    done:    'Done',
  }[role] || role;
}

Object.assign(window, {
  peep, sevColor, sevLabel, eventMeta, FILTERS,
  TODAY_EVENTS, YEST_EVENTS,
  similarTo, decisionLine, browserLine, statusMessage, genReceipt,
  confidenceLabel, humanizeMeta, friendlyStep,
});
