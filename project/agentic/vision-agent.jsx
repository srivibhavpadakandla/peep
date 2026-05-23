// Vision agent — watches the live detector output and emits structured events.
// Reads from window.PeepLiveDetections (set by the in-browser detector).
// Writes to window.PeepEventBus.
//
// State machine for package_taken:
//   IDLE  → see package for ≥ 1s        → PACKAGE_PRESENT (emit package_arrived)
//   PACKAGE_PRESENT → person enters AND package disappears for ≥ 1.2s → PACKAGE_TAKEN (emit)
//   PACKAGE_PRESENT → package returns within 5s                       → PACKAGE_PRESENT
//   PACKAGE_TAKEN → cool-down 10s                                     → IDLE

(function () {
  const { EVENT_TYPES } = window.PeepEventContract;
  const BUS = window.PeepEventBus;

  const PRESENCE_MS = 1000;    // package must be seen this long to count as "arrived"
  const ABSENCE_MS  = 1200;    // package gone this long (with person nearby) = taken
  const RETURN_GRACE_MS = 5000;
  const COOLDOWN_MS = 10000;

  // ── Fleeing-with-package thresholds ────────────────────────────────────
  // Velocity unit: % of frame width per second. ~25% means crossing a quarter
  // of the frame each second — typical brisk run.
  const FLEE_SPEED_PCT_PER_S = 25;
  const FLEE_CONFIRM_FRAMES  = 3;    // need this many consecutive fast frames
  const FLEE_OVERLAP_IOU     = 0.05; // person box must overlap a package box
  const FLEE_COOLDOWN_MS     = 12000;
  const HISTORY_MS           = 1500; // how far back to keep centroid samples

  let state = 'IDLE';
  let firstSeenAt = 0;
  let lastSeenAt  = 0;
  let lastFrameDataURL = null;
  let cooldownUntil = 0;

  // Per-person tracking history. Single-person heuristic: we keep one trail,
  // matched by nearest centroid frame-to-frame. Good enough for porch-cam demos.
  const personTrail = [];          // [{ t, cx, cy }]
  let fleeFastFrames = 0;
  let fleeCooldownUntil = 0;

  function iou(a, b) {
    const ax2 = a.x + a.w, ay2 = a.y + a.h;
    const bx2 = b.x + b.w, by2 = b.y + b.h;
    const ix = Math.max(0, Math.min(ax2, bx2) - Math.max(a.x, b.x));
    const iy = Math.max(0, Math.min(ay2, by2) - Math.max(a.y, b.y));
    const inter = ix * iy;
    const union = a.w * a.h + b.w * b.h - inter;
    return union > 0 ? inter / union : 0;
  }

  function snapshotFrame(videoEl) {
    if (!videoEl || !videoEl.videoWidth) return null;
    const c = document.createElement('canvas');
    c.width = 320; c.height = Math.round(320 * videoEl.videoHeight / videoEl.videoWidth);
    const ctx = c.getContext('2d');
    ctx.drawImage(videoEl, 0, 0, c.width, c.height);
    try { return c.toDataURL('image/jpeg', 0.6); } catch { return null; }
  }

  function tick({ dets, videoEl }) {
    const now = Date.now();

    const persons  = dets.filter(d => d.label === 'person');
    const packages = dets.filter(d => d.label === 'package');
    const hasPackage = packages.length > 0;
    const hasPerson  = persons.length > 0;

    // ── Fleeing-with-package: independent detector, runs every tick ─────
    // Detections from interactive-live.jsx are in % units (x,y,w,h).
    if (now >= fleeCooldownUntil && persons.length && packages.length) {
      // Pick the largest person box (closest to camera).
      const p = persons.reduce((a, b) => (a.w * a.h >= b.w * b.h ? a : b));
      const cx = p.x + p.w / 2, cy = p.y + p.h / 2;
      personTrail.push({ t: now, cx, cy });
      while (personTrail.length && now - personTrail[0].t > HISTORY_MS) {
        personTrail.shift();
      }

      // Need at least one prior sample to compute velocity.
      const overlapsPkg = packages.some(pk => iou(p, pk) >= FLEE_OVERLAP_IOU);
      if (overlapsPkg && personTrail.length >= 2) {
        const prev = personTrail[personTrail.length - 2];
        const dt = (now - prev.t) / 1000;
        if (dt > 0) {
          const dx = cx - prev.cx, dy = cy - prev.cy;
          const speed = Math.hypot(dx, dy) / dt;  // % of frame per second
          if (speed >= FLEE_SPEED_PCT_PER_S) {
            fleeFastFrames++;
            if (fleeFastFrames >= FLEE_CONFIRM_FRAMES) {
              fleeFastFrames = 0;
              fleeCooldownUntil = now + FLEE_COOLDOWN_MS;
              const frame = videoEl ? snapshotFrame(videoEl) : null;
              const conf = Math.min(0.95, 0.72 + Math.min(speed / 80, 0.2));
              window.PeepLiveLogs?.append({
                source: 'vision',
                text: `Suspect fleeing with package · speed ${speed.toFixed(0)}%/s (conf ${conf.toFixed(2)})`,
              });
              BUS.publish({
                event_type: EVENT_TYPES.PACKAGE_FLEEING,
                confidence: conf,
                evidence_clip: { kind: 'frame', ref: frame || 'about:blank' },
              });
            }
          } else {
            fleeFastFrames = Math.max(0, fleeFastFrames - 1);
          }
        }
      }
    } else if (!hasPerson) {
      // Reset trail when nobody's in frame.
      personTrail.length = 0;
      fleeFastFrames = 0;
    }

    if (now < cooldownUntil) return;

    if (hasPackage) lastSeenAt = now;
    if (hasPackage && !firstSeenAt) firstSeenAt = now;
    if (videoEl && hasPackage) lastFrameDataURL = snapshotFrame(videoEl);

    if (state === 'IDLE') {
      if (hasPackage && firstSeenAt && now - firstSeenAt >= PRESENCE_MS) {
        state = 'PACKAGE_PRESENT';
        BUS.publish({
          event_type: EVENT_TYPES.PACKAGE_ARRIVED,
          confidence: Math.min(0.98, 0.85 + Math.random() * 0.1),
          evidence_clip: { kind: 'frame', ref: lastFrameDataURL || 'about:blank' },
        });
      } else if (!hasPackage) {
        firstSeenAt = 0;
      }
      return;
    }

    if (state === 'PACKAGE_PRESENT') {
      const gone = !hasPackage && now - lastSeenAt >= ABSENCE_MS;
      if (gone && hasPerson) {
        state = 'PACKAGE_TAKEN';
        cooldownUntil = now + COOLDOWN_MS;
        BUS.publish({
          event_type: EVENT_TYPES.PACKAGE_TAKEN,
          confidence: Math.min(0.96, 0.78 + Math.random() * 0.12),
          evidence_clip: { kind: 'frame', ref: lastFrameDataURL || 'about:blank' },
        });
        // Reset for the next cycle.
        firstSeenAt = 0; lastSeenAt = 0;
      } else if (!hasPackage && now - lastSeenAt >= RETURN_GRACE_MS && !hasPerson) {
        // Package quietly disappeared without anyone — probably a detection blip.
        state = 'IDLE'; firstSeenAt = 0; lastSeenAt = 0;
      }
      return;
    }

    if (state === 'PACKAGE_TAKEN') {
      if (now >= cooldownUntil) { state = 'IDLE'; firstSeenAt = 0; lastSeenAt = 0; }
    }
  }

  window.PeepVisionAgent = {
    tick,
    reset() {
      state = 'IDLE'; firstSeenAt = 0; lastSeenAt = 0; cooldownUntil = 0;
      personTrail.length = 0; fleeFastFrames = 0; fleeCooldownUntil = 0;
    },
    getState() { return state; },
  };
})();
