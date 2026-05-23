// Theft + sudden-movement detector.
//
// Designed for the real product goal: catch someone running away with a
// package from the porch, not to recognize cardboard.
//
// Inputs (pushed by CameraPlaceholder once per frame via PeepTheftDetector.tick):
//   dets    — array of { x, y, w, h, label } in % of frame (label: 'person' | 'package' | ...)
//   videoEl — the live <video> element, for porch-zone pixel sampling
//   zone    — { x, y, w, h } in % of frame (the porch zone the user drew), or null
//   baseline — { r, g, b } mean RGB of the empty porch (captured at calibration), or null
//
// Outputs (published on PeepEventBus, contract-compliant):
//   { event_type: 'porch_theft' | 'sudden_movement', timestamp, confidence, evidence_clip }
//
// State machine for porch_theft:
//   IDLE          → person bbox overlaps zone (IoU ≥ 0.10) for ≥ 600ms → IN_ZONE
//   IN_ZONE       → person leaves zone with velocity ≥ 30 %/s          → CHECK_CHANGE
//   CHECK_CHANGE  → zone pixel diff from baseline ≥ 15%                → THEFT (emit, cooldown 15s)
//   THEFT         → 15s cooldown                                       → IDLE
//
// Sudden movement (independent): any person whose centroid moves ≥ MOVEMENT_SPEED for
// MOVEMENT_FRAMES consecutive samples emits sudden_movement (cooldown 8s).

(function () {
  const { EVENT_TYPES } = window.PeepEventContract;
  const BUS = window.PeepEventBus;

  // ── Tunables ────────────────────────────────────────────────────────
  const IN_ZONE_IOU       = 0.10;
  const IN_ZONE_DWELL_MS  = 600;
  const LEAVE_SPEED       = 30;    // %/s — exiting the zone briskly
  const ZONE_DIFF_PCT     = 15;    // ≥ 15% RGB-distance change vs baseline
  const THEFT_COOLDOWN_MS = 15000;
  const MOVEMENT_SPEED    = 45;    // %/s for sudden_movement
  const MOVEMENT_FRAMES   = 2;
  const MOVEMENT_COOLDOWN = 8000;
  const TRAIL_MS          = 1500;

  // ── State ───────────────────────────────────────────────────────────
  let zoneState = 'IDLE';
  let inZoneSince = 0;
  let lastInZonePerson = null;     // { cx, cy }
  let theftCooldownUntil = 0;
  const personTrail = [];          // [{ t, cx, cy, w, h }]
  let movementFastFrames = 0;
  let movementCooldownUntil = 0;

  // ── Helpers ─────────────────────────────────────────────────────────
  function iou(a, b) {
    const ax2 = a.x + a.w, ay2 = a.y + a.h;
    const bx2 = b.x + b.w, by2 = b.y + b.h;
    const ix = Math.max(0, Math.min(ax2, bx2) - Math.max(a.x, b.x));
    const iy = Math.max(0, Math.min(ay2, by2) - Math.max(a.y, b.y));
    const inter = ix * iy;
    const union = a.w * a.h + b.w * b.h - inter;
    return union > 0 ? inter / union : 0;
  }
  // Mean RGB of the porch-zone pixels in the live frame.
  const _zoneCanvas = document.createElement('canvas');
  function sampleZoneColor(videoEl, zone) {
    if (!videoEl?.videoWidth || !zone) return null;
    const W = videoEl.videoWidth, H = videoEl.videoHeight;
    const sx = Math.max(0, Math.floor(zone.x / 100 * W));
    const sy = Math.max(0, Math.floor(zone.y / 100 * H));
    const sw = Math.max(1, Math.floor(zone.w / 100 * W));
    const sh = Math.max(1, Math.floor(zone.h / 100 * H));
    _zoneCanvas.width = 32; _zoneCanvas.height = 32;
    const ctx = _zoneCanvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(videoEl, sx, sy, sw, sh, 0, 0, 32, 32);
    const px = ctx.getImageData(0, 0, 32, 32).data;
    let r = 0, g = 0, b = 0, n = 0;
    for (let i = 0; i < px.length; i += 4) { r += px[i]; g += px[i+1]; b += px[i+2]; n++; }
    return { r: r / n, g: g / n, b: b / n };
  }
  function rgbDistPct(a, b) {
    const dr = a.r - b.r, dg = a.g - b.g, db = a.b - b.b;
    // Max distance is sqrt(3) * 255 = 441.7; express as %
    return (Math.sqrt(dr * dr + dg * dg + db * db) / 441.7) * 100;
  }
  function frameSnapshot(videoEl) {
    if (!videoEl?.videoWidth) return null;
    const c = document.createElement('canvas');
    c.width = 320; c.height = Math.round(320 * videoEl.videoHeight / videoEl.videoWidth);
    c.getContext('2d').drawImage(videoEl, 0, 0, c.width, c.height);
    try { return c.toDataURL('image/jpeg', 0.6); } catch { return null; }
  }

  // ── Tick ────────────────────────────────────────────────────────────
  function tick({ dets, videoEl, zone, baseline }) {
    const now = Date.now();
    const persons = (dets || []).filter(d => d.label === 'person');

    // ── Sudden-movement detector ──────────────────────────────────────
    if (now >= movementCooldownUntil && persons.length) {
      const p = persons.reduce((a, b) => (a.w * a.h >= b.w * b.h ? a : b));
      const cx = p.x + p.w / 2, cy = p.y + p.h / 2;
      personTrail.push({ t: now, cx, cy, w: p.w, h: p.h });
      while (personTrail.length && now - personTrail[0].t > TRAIL_MS) personTrail.shift();

      if (personTrail.length >= 2) {
        const prev = personTrail[personTrail.length - 2];
        const dt = (now - prev.t) / 1000;
        if (dt > 0) {
          const dx = cx - prev.cx, dy = cy - prev.cy;
          const speed = Math.hypot(dx, dy) / dt;
          if (speed >= MOVEMENT_SPEED) {
            movementFastFrames++;
            if (movementFastFrames >= MOVEMENT_FRAMES) {
              movementFastFrames = 0;
              movementCooldownUntil = now + MOVEMENT_COOLDOWN;
              const conf = Math.min(0.95, 0.6 + Math.min(speed / 120, 0.35));
              BUS.publish({
                event_type: EVENT_TYPES.SUDDEN_MOVEMENT,
                confidence: conf,
                evidence_clip: { kind: 'frame', ref: frameSnapshot(videoEl) || 'about:blank' },
              });
              window.PeepLiveLogs?.append?.({
                source: 'vision',
                text: `Sudden movement · ${speed.toFixed(0)}%/s (conf ${conf.toFixed(2)})`,
              });
            }
          } else {
            movementFastFrames = Math.max(0, movementFastFrames - 1);
          }
        }
      }
    } else if (!persons.length) {
      personTrail.length = 0;
      movementFastFrames = 0;
    }

    // ── Porch-theft state machine ─────────────────────────────────────
    if (!zone || !baseline || now < theftCooldownUntil) return;

    const inZonePerson = persons.find(p => iou(p, zone) >= IN_ZONE_IOU);

    if (zoneState === 'IDLE') {
      if (inZonePerson) {
        if (!inZoneSince) inZoneSince = now;
        if (now - inZoneSince >= IN_ZONE_DWELL_MS) {
          zoneState = 'IN_ZONE';
          lastInZonePerson = { cx: inZonePerson.x + inZonePerson.w / 2,
                               cy: inZonePerson.y + inZonePerson.h / 2 };
        }
      } else {
        inZoneSince = 0;
      }
      return;
    }

    if (zoneState === 'IN_ZONE') {
      const stillInside = inZonePerson;
      if (stillInside) {
        lastInZonePerson = { cx: stillInside.x + stillInside.w / 2,
                             cy: stillInside.y + stillInside.h / 2 };
        return;
      }
      // Person left the zone. Compute exit velocity vs the closest tracked person.
      const closest = persons.length
        ? persons.map(p => ({ p, d: Math.hypot((p.x + p.w/2) - lastInZonePerson.cx,
                                               (p.y + p.h/2) - lastInZonePerson.cy) }))
                 .sort((a, b) => a.d - b.d)[0]
        : null;
      const last = personTrail[personTrail.length - 2];
      const exitSpeed = (closest && last)
        ? Math.hypot((closest.p.x + closest.p.w/2) - last.cx,
                     (closest.p.y + closest.p.h/2) - last.cy)
              / Math.max(0.05, (now - last.t) / 1000)
        : 0;

      // Did the porch contents change?
      const sample = sampleZoneColor(videoEl, zone);
      const diff = sample ? rgbDistPct(sample, baseline) : 0;

      if (exitSpeed >= LEAVE_SPEED && diff >= ZONE_DIFF_PCT) {
        zoneState = 'IDLE';
        inZoneSince = 0;
        theftCooldownUntil = now + THEFT_COOLDOWN_MS;
        const conf = Math.min(0.97, 0.65 + Math.min(diff / 60, 0.20) + Math.min(exitSpeed / 200, 0.12));
        BUS.publish({
          event_type: EVENT_TYPES.PORCH_THEFT,
          confidence: conf,
          evidence_clip: { kind: 'frame', ref: frameSnapshot(videoEl) || 'about:blank' },
        });
        window.PeepLiveLogs?.append?.({
          source: 'vision',
          text: `Porch theft confirmed · exit ${exitSpeed.toFixed(0)}%/s · zone diff ${diff.toFixed(0)}% (conf ${conf.toFixed(2)})`,
        });
      } else {
        // False alarm — they just stepped away. Reset.
        zoneState = 'IDLE';
        inZoneSince = 0;
      }
    }
  }

  function reset() {
    zoneState = 'IDLE'; inZoneSince = 0; lastInZonePerson = null;
    theftCooldownUntil = 0;
    personTrail.length = 0; movementFastFrames = 0; movementCooldownUntil = 0;
  }

  window.PeepTheftDetector = { tick, reset };
})();
