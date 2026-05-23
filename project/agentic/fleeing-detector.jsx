// Standalone "person fleeing with a package" detector.
//
// O(1) per frame. Runs alongside any existing package_arrived → package_taken
// state machine and is NOT gated by it, so grab-and-run scenarios where there
// was never a "package arrived" event still trigger.
//
// State footprint:
//   - one ring-buffer trail (≤ MAX_TRAIL entries)
//   - one fastFrames counter
//   - one cooldownUntil timestamp
//
// Hot path: at most one Math.hypot, one iou(), and a push/shift on the trail.
// A canvas is allocated only on fire (for the evidence frame), never per tick.

(function () {
  const BUS  = window.PeepEventBus;
  const LOGS = window.PeepLiveLogs;
  if (!BUS) return;

  // ── Tunables ────────────────────────────────────────────────────────
  const FLEE_SPEED_PCT_PER_S = 25;
  const FLEE_CONFIRM_FRAMES  = 3;
  const FLEE_OVERLAP_IOU     = 0.05;
  const FLEE_COOLDOWN_MS     = 12000;
  const HISTORY_MS           = 1500;
  const MAX_TRAIL            = 10;

  // ── State (bounded) ─────────────────────────────────────────────────
  const trail = [];          // [{ t, cx, cy }] — ring-buffer behaviour via shift
  let fastFrames = 0;
  let cooldownUntil = 0;

  // ── Helpers (inline, no deps) ───────────────────────────────────────
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
    c.width  = 320;
    c.height = Math.round(320 * videoEl.videoHeight / videoEl.videoWidth);
    const ctx = c.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(videoEl, 0, 0, c.width, c.height);
    try { return c.toDataURL('image/jpeg', 0.6); } catch { return null; }
  }

  function pushSample(t, cx, cy) {
    trail.push({ t, cx, cy });
    // Drop entries older than HISTORY_MS (trail is tiny; shift is O(n) but n ≤ MAX_TRAIL).
    while (trail.length && t - trail[0].t > HISTORY_MS) trail.shift();
    while (trail.length > MAX_TRAIL) trail.shift();
  }

  function decay() {
    if (trail.length)   trail.length = 0;
    if (fastFrames > 0) fastFrames = 0;
  }

  function fire(speed, videoEl, now) {
    fastFrames = 0;
    cooldownUntil = now + FLEE_COOLDOWN_MS;
    trail.length = 0;
    const conf = Math.min(0.95, 0.72 + Math.min(speed / 80, 0.2));
    BUS.publish({
      event_type: 'package_fleeing',
      confidence: conf,
      evidence_clip: { kind: 'frame', ref: snapshotFrame(videoEl) || 'about:blank' },
    });
    if (LOGS && typeof LOGS.append === 'function') {
      LOGS.append({
        source: 'vision',
        text: `Suspect fleeing with package · speed ${speed.toFixed(0)}%/s (conf ${conf.toFixed(2)})`,
      });
    }
  }

  // ── Hot path ────────────────────────────────────────────────────────
  function tick({ dets, videoEl }) {
    const now = Date.now();
    if (now < cooldownUntil) return;
    if (!dets || dets.length === 0) { decay(); return; }

    // Single pass: dominant person + does any package exist?
    let person = null, bestArea = 0;
    let hasPackage = false;
    for (let i = 0; i < dets.length; i++) {
      const d = dets[i];
      if (d.label === 'person') {
        const area = d.w * d.h;
        if (area > bestArea) { bestArea = area; person = d; }
      } else if (d.label === 'package') {
        hasPackage = true;
      }
    }
    if (!person) { decay(); return; }

    const cx = person.x + person.w / 2;
    const cy = person.y + person.h / 2;

    // Co-presence gate: at least one package overlaps the dominant person.
    if (!hasPackage) {
      pushSample(now, cx, cy);
      fastFrames = Math.max(0, fastFrames - 1);
      return;
    }
    let overlaps = false;
    for (let i = 0; i < dets.length; i++) {
      if (dets[i].label === 'package' && iou(person, dets[i]) >= FLEE_OVERLAP_IOU) {
        overlaps = true;
        break;
      }
    }
    if (!overlaps) {
      pushSample(now, cx, cy);
      fastFrames = Math.max(0, fastFrames - 1);
      return;
    }

    // Velocity from the last two samples (read prev BEFORE pushing this one).
    const prev = trail.length ? trail[trail.length - 1] : null;
    pushSample(now, cx, cy);
    if (!prev) return;
    const dt = (now - prev.t) / 1000;
    if (dt <= 0) return;
    const dx = cx - prev.cx, dy = cy - prev.cy;
    const speed = Math.hypot(dx, dy) / dt;   // % of frame width per second

    if (speed >= FLEE_SPEED_PCT_PER_S) {
      fastFrames++;
      if (fastFrames >= FLEE_CONFIRM_FRAMES) fire(speed, videoEl, now);
    } else {
      fastFrames = Math.max(0, fastFrames - 1);
    }
  }

  function reset() {
    trail.length = 0;
    fastFrames = 0;
    cooldownUntil = 0;
  }

  window.MyFleeingDetector = {
    tick,
    reset,
    getState() {
      return {
        fastFrames,
        cooldownActive: Date.now() < cooldownUntil,
        trailSize: trail.length,
      };
    },
  };
})();

/* ── Top three false-positive sources & cheapest mitigations ────────────
   1. Fast-moving dog / pet sprinting through frame near a "package"
      mis-detection (cardboard-shaped pet bed, coco-ssd confusing a dog
      for a backpack at low confidence, etc.).
      Mitigation: gate on person bbox height — only count a person if
      person.h >= MIN_PERSON_HEIGHT_PCT (e.g. 25). One extra inequality
      after the dominant-person selection. Pets and crouching shapes are
      filtered without adding a model.

   2. Kid running back and forth on the porch (oscillating motion produces
      spikes of high speed without net travel).
      Mitigation: require a net-displacement check before firing —
      hypot(lastSample.cx − firstSample.cx, lastSample.cy − firstSample.cy)
      >= e.g. 12. The trail is already kept; this is one hypot at fire time.
      Wiggle-in-place stops triggering.

   3. Camera shake / autofocus jitter causing detection bbox to jump frame
      to frame, spiking the computed speed for one or two frames.
      Mitigation: bump FLEE_CONFIRM_FRAMES from 3 → 4. The multi-frame
      confirmation is already the right control surface for this; nudging
      it up costs nothing and dramatically reduces flickery firings.
─────────────────────────────────────────────────────────────────────── */
