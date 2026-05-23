// Agentic Camera — shared event contract.
// All three agents (vision, orchestration, browser) coordinate through this.
// LOCKED on day zero. Do not add fields or change types without updating all agents.
//
// Event shape:
//   {
//     event_type:    string         // e.g. 'package_arrived' | 'package_taken' | 'person_loitering'
//     timestamp:     number         // ms since epoch
//     confidence:    number         // 0..1
//     evidence_clip: { kind, ref }  // { kind: 'frame'|'clip', ref: dataURL | URL }
//   }

const EVENT_TYPES = Object.freeze({
  PACKAGE_ARRIVED: 'package_arrived',
  PACKAGE_TAKEN:   'package_taken',
  PACKAGE_FLEEING: 'package_fleeing',
  PORCH_THEFT:     'porch_theft',       // person entered porch zone + zone changed + leaving fast
  SUDDEN_MOVEMENT: 'sudden_movement',   // anyone darting through the frame
  PERSON_LOITERING:'person_loitering',
});

function makeEvent({ event_type, confidence, evidence_clip }) {
  if (!event_type || typeof event_type !== 'string') {
    throw new Error('event_type required (string)');
  }
  if (typeof confidence !== 'number' || confidence < 0 || confidence > 1) {
    throw new Error('confidence must be a number 0..1');
  }
  if (!evidence_clip || typeof evidence_clip !== 'object' || !evidence_clip.ref) {
    throw new Error('evidence_clip { kind, ref } required');
  }
  return Object.freeze({
    event_type,
    timestamp: Date.now(),
    confidence,
    evidence_clip,
  });
}

// Tiny pub/sub bus the agents share. No external deps.
function makeEventBus() {
  const subs = new Set();
  return {
    publish(event) {
      // Validate every event so a bad emitter is caught immediately.
      const e = makeEvent(event);
      subs.forEach(fn => { try { fn(e); } catch (err) { console.error('subscriber threw', err); } });
      return e;
    },
    subscribe(fn) {
      subs.add(fn);
      return () => subs.delete(fn);
    },
  };
}

// Singleton bus on window so all agents (loaded as separate <script> tags) share one.
window.PeepEventContract = { EVENT_TYPES, makeEvent };
window.PeepEventBus = window.PeepEventBus || makeEventBus();
