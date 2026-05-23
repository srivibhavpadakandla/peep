// Shared primitives — Icon, Pill, SeverityStripe, Mono, Section, etc.

const Icon = ({ name, size = 16, className = '', strokeWidth = 1.75, ...rest }) => {
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (ref.current && window.lucide && window.lucide.icons) {
      const iconName = name;
      const pascal = iconName.split('-').map(s => s[0].toUpperCase() + s.slice(1)).join('');
      const iconDef = window.lucide.icons[pascal] || window.lucide.icons[iconName];
      if (iconDef) {
        ref.current.innerHTML = '';
        const svg = window.lucide.createElement(iconDef);
        svg.setAttribute('width', size);
        svg.setAttribute('height', size);
        svg.setAttribute('stroke-width', strokeWidth);
        ref.current.appendChild(svg);
      }
    }
  }, [name, size, strokeWidth]);
  return <span ref={ref} className={'inline-flex items-center justify-center shrink-0 ' + className} style={{ width: size, height: size }} {...rest} />;
};

const Pill = ({ children, color, bg, className = '', solid }) => {
  const c = color || '#6f6a61';
  const style = solid
    ? { background: c, color: '#fff' }
    : { color: c, background: bg || 'transparent', boxShadow: `inset 0 0 0 1px ${c}33` };
  return (
    <span className={'inline-flex items-center gap-1.5 px-2 py-[2px] rounded-md text-[12px] font-normal ' + className} style={style}>
      {children}
    </span>
  );
};

// Phosphor icon — loads SVG from Phosphor core CDN, inlines it (so it works in
// screenshots / html-to-image / PDFs too, not just real browsers with webfonts).
const _phxCache = new Map();
const Phx = ({ name, weight = 'regular', size = 16, className = '', color = 'currentColor', style = {} }) => {
  const ref = React.useRef(null);
  const key = `${weight}/${name}`;
  React.useEffect(() => {
    let cancelled = false;
    const apply = (svg) => {
      if (cancelled || !ref.current) return;
      ref.current.innerHTML = svg;
      const el = ref.current.firstChild;
      if (el && el.setAttribute) {
        el.setAttribute('width', size);
        el.setAttribute('height', size);
        el.setAttribute('fill', color);
        el.style.display = 'block';
      }
    };
    if (_phxCache.has(key)) {
      apply(_phxCache.get(key));
      return;
    }
    const suffix = weight === 'regular' ? '' : `-${weight}`;
    const url = `https://cdn.jsdelivr.net/npm/@phosphor-icons/core@2.1.1/assets/${weight}/${name}${suffix}.svg`;
    fetch(url).then(r => r.text()).then(svg => {
      _phxCache.set(key, svg);
      apply(svg);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [key, size, color]);
  return (
    <span
      ref={ref}
      className={'inline-flex items-center justify-center shrink-0 ' + className}
      style={{ width: size, height: size, color, ...style }}
    />
  );
};

const SeverityChip = ({ sev, mini }) => {
  const s = SEVERITY[sev];
  return (
    <span className={'inline-flex items-center gap-1.5 ' + (mini ? 'text-[11px]' : 'text-[12px]') + ' text-ink-300'}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />
      {s.label.toLowerCase()}
    </span>
  );
};

const Mono = ({ children, className = '', muted }) => (
  <span className={'font-mono text-[13px] ' + (muted ? 'text-ink-400 ' : 'text-ink-200 ') + className}>{children}</span>
);

const Surface = ({ children, className = '', as: As = 'div', ...rest }) => (
  <As className={'bg-ink-850 rounded-lg hairline ' + className} {...rest}>{children}</As>
);

const Btn = ({ children, variant = 'ghost', size = 'md', className = '', ...rest }) => {
  const base = 'inline-flex items-center gap-1.5 rounded-md font-normal transition-colors select-none';
  const sizes = {
    sm: 'h-7 px-2.5 text-[13px]',
    md: 'h-8 px-3 text-[14px]',
    lg: 'h-9 px-3.5 text-[14px]',
  };
  const variants = {
    primary: 'bg-em text-white hover:brightness-110',
    secondary: 'bg-ink-850 text-ink-200 hover:bg-ink-800 hairline',
    ghost: 'text-ink-300 hover:bg-ink-800',
    danger: 'bg-ink-850 text-red-700 hover:bg-red-50 hairline',
    outline: 'text-ink-200 hairline hover:bg-ink-800',
  };
  return <button className={[base, sizes[size], variants[variant], className].join(' ')} {...rest}>{children}</button>;
};

const Toggle = ({ on, onChange, label }) => (
  <button
    onClick={() => onChange(!on)}
    className="inline-flex items-center gap-2 group"
    aria-pressed={on}
  >
    <span className={'relative w-[28px] h-[16px] rounded-full transition-colors ' + (on ? 'bg-em' : 'bg-ink-700')}>
      <span className={'absolute top-[2px] w-[12px] h-[12px] rounded-full bg-white transition-all ' + (on ? 'left-[14px]' : 'left-[2px]')} />
    </span>
    {label && <span className="text-[14px] text-ink-200">{label}</span>}
  </button>
);

const hexToRgba = (hex, a = 0.55) => {
  const m = hex.replace('#','').match(/.{2}/g);
  if (!m) return `rgba(212,200,130,${a})`;
  const [r,g,b] = m.map(x => parseInt(x, 16));
  return `rgba(${r},${g},${b},${a})`;
};

const StatusDot = ({ color = '#9BB1C4', pulse }) => (
  <span className="relative inline-flex">
    <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
    {pulse && <span className="absolute inset-0 w-1.5 h-1.5 rounded-full pulse-dot" style={{ background: color, '--pc': hexToRgba(color, 0.55) }} />}
  </span>
);

const Kbd = ({ children }) => (
  <kbd className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded text-[11px] font-mono bg-ink-800 text-ink-400 hairline">{children}</kbd>
);

const SectionLabel = ({ children, className = '' }) => (
  <div className={'text-[13px] text-ink-400 ' + className}>{children}</div>
);

const Divider = ({ vertical, className = '' }) => (
  vertical
    ? <span className={'inline-block w-px h-3 bg-ink-700 ' + className} />
    : <div className={'h-px bg-ink-700 ' + className} />
);

const Slider = ({ value, onChange, min = 0, max = 100, step = 1, format }) => (
  <div className="flex items-center gap-3 w-full">
    <input type="range" min={min} max={max} step={step} value={value}
           onChange={(e) => onChange(Number(e.target.value))}
           className="flex-1" />
    <Mono className="text-[13px] tabular-nums w-[88px] text-right text-ink-300">
      {format ? format(value) : value}
    </Mono>
  </div>
);

const Chip = ({ active, onClick, children }) => (
  <button onClick={onClick}
    className={'h-7 px-2.5 rounded-md text-[13px] transition-colors ' +
      (active
        ? 'bg-em-soft text-em hairline'
        : 'bg-ink-850 text-ink-400 hover:bg-ink-800 hairline')}>
    {children}
  </button>
);

// --- Camera placeholder (kept dark — a real camera feed wouldn't be inverted) ---
// Shared: lazy-load coco-ssd once. Returns the loaded model (or null while loading).
let _cocoModelPromise = null;
function useCocoModel() {
  const [model, setModel] = React.useState(null);
  React.useEffect(() => {
    if (typeof cocoSsd === 'undefined') return;
    if (!_cocoModelPromise) _cocoModelPromise = cocoSsd.load({ base: 'lite_mobilenet_v2' });
    let cancelled = false;
    _cocoModelPromise.then(m => { if (!cancelled) setModel(m); });
    return () => { cancelled = true; };
  }, []);
  return model;
}

// Shared: run inference on a <video> element on each animation frame.
// Returns an array of {x,y,w,h (percent), label, conf, color}.
// coco-ssd doesn't have a "package" class — accept any box-shaped class
// commonly tripped by cardboard (incl. tv/microwave/oven/laptop/etc.)
// when the bbox geometry is plausible for a package.
const PEEP_PACKAGE_CLASSES = new Set([
  'backpack', 'handbag', 'suitcase', 'book',
  'tv', 'laptop', 'keyboard', 'microwave', 'oven', 'toaster',
  'refrigerator', 'dining table', 'bench',
]);
// Geometry filter: only accept rectangular, package-sized boxes.
// width%, height%, aspect = w/h
const PKG_ASPECT_MIN = 0.45;
const PKG_ASPECT_MAX = 1.85;
const PKG_AREA_MIN_PCT = 2.0;     // ≥ 2% of frame
const PKG_AREA_MAX_PCT = 55.0;    // < 55% of frame (filters whole-room "tv" hits)
function isPackageLike(pBboxPct) {
  const [, , w, h] = pBboxPct;
  if (h <= 0 || w <= 0) return false;
  const aspect = w / h;
  const area = w * h;
  return aspect >= PKG_ASPECT_MIN && aspect <= PKG_ASPECT_MAX
      && area >= PKG_AREA_MIN_PCT && area <= PKG_AREA_MAX_PCT;
}
const PEEP_LABEL_COLORS = {
  person: '#7ea582',
  package: '#706b8e',
  'cell phone': '#c8a86a',
  dog: '#c8a86a', cat: '#c8a86a', bird: '#c8a86a', bear: '#c8a86a',
  knife: '#c66', scissors: '#c66',
};
// ── Color-based package detector ───────────────────────────────────────
// Tap-to-calibrate workflow: user samples the box color from the video,
// then each frame we scan a downsampled canvas for pixels close to that
// HSV target and return the bounding box of the matching region.
function rgbToHsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r)      h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else                h = (r - g) / d + 4;
    h *= 60; if (h < 0) h += 360;
  }
  const s = max === 0 ? 0 : d / max;
  return [h, s, max];
}
function hueDist(a, b) {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}
// Sample a 21×21 area centered on (xPct,yPct of the video) and return mean
// HSV + RGB. Bigger sample = more lighting-robust than a single-pixel grab.
function sampleVideoColor(videoEl, xPct, yPct) {
  if (!videoEl?.videoWidth) return null;
  const W = videoEl.videoWidth, H = videoEl.videoHeight;
  const S = 21, HALF = 10;
  const cx = Math.max(HALF, Math.min(W - HALF - 1, Math.round((xPct / 100) * W)));
  const cy = Math.max(HALF, Math.min(H - HALF - 1, Math.round((yPct / 100) * H)));
  const c = document.createElement('canvas');
  c.width = S; c.height = S;
  const ctx = c.getContext('2d');
  ctx.drawImage(videoEl, cx - HALF, cy - HALF, S, S, 0, 0, S, S);
  const px = ctx.getImageData(0, 0, S, S).data;
  let r = 0, g = 0, b = 0, n = 0;
  for (let i = 0; i < px.length; i += 4) { r += px[i]; g += px[i+1]; b += px[i+2]; n++; }
  r /= n; g /= n; b /= n;
  const [h, s, v] = rgbToHsv(r, g, b);
  return { h, s, v, r: Math.round(r), g: Math.round(g), b: Math.round(b) };
}
// Scan a downsampled snapshot for pixels matching target color. Bucket
// matches into a coarse grid and return the bbox of the largest CONNECTED
// cluster of "hot" cells (ignores scattered noise but stays sensitive to
// genuine objects). Also exposes the hot-cell mask for the debug overlay.
const _colorCanvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;
function scanForColor(videoEl, target) {
  if (!videoEl?.videoWidth || !_colorCanvas) return null;
  const SCAN_W = 320;
  const SCAN_H = Math.round(SCAN_W * videoEl.videoHeight / videoEl.videoWidth);
  _colorCanvas.width = SCAN_W; _colorCanvas.height = SCAN_H;
  const ctx = _colorCanvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(videoEl, 0, 0, SCAN_W, SCAN_H);
  const data = ctx.getImageData(0, 0, SCAN_W, SCAN_H).data;

  // Tolerances — generous; the spatial clustering keeps noise out.
  const HUE_TOL = 22, SAT_TOL = 0.38, VAL_TOL = 0.38;
  const RGB_TOL = 70;
  const lowSatTarget = target.s < 0.22;
  function matches(r, g, b) {
    if (lowSatTarget) {
      const dr = r - target.r, dg = g - target.g, db = b - target.b;
      return Math.sqrt(dr*dr + dg*dg + db*db) < RGB_TOL;
    }
    const [h, s, v] = rgbToHsv(r, g, b);
    return hueDist(h, target.h) < HUE_TOL
        && Math.abs(s - target.s) < SAT_TOL
        && Math.abs(v - target.v) < VAL_TOL;
  }

  const GRID_W = 40, GRID_H = Math.round(GRID_W * SCAN_H / SCAN_W);
  const cellPxW = SCAN_W / GRID_W, cellPxH = SCAN_H / GRID_H;
  const cellArea = Math.max(1, Math.floor(cellPxW * cellPxH));
  const cellCounts = new Int32Array(GRID_W * GRID_H);
  let totalMatches = 0;
  for (let y = 0; y < SCAN_H; y++) {
    const gy = Math.min(GRID_H - 1, Math.floor(y / cellPxH));
    const rowBase = y * SCAN_W * 4;
    for (let x = 0; x < SCAN_W; x++) {
      const i = rowBase + x * 4;
      if (matches(data[i], data[i + 1], data[i + 2])) {
        const gx = Math.min(GRID_W - 1, Math.floor(x / cellPxW));
        cellCounts[gy * GRID_W + gx]++;
        totalMatches++;
      }
    }
  }
  // Cells with ≥ 12% of their pixels matching are "hot" (down from 25%).
  const HOT_THRESHOLD = Math.max(2, Math.floor(cellArea * 0.12));
  const hot = new Uint8Array(GRID_W * GRID_H);
  for (let i = 0; i < cellCounts.length; i++) {
    if (cellCounts[i] >= HOT_THRESHOLD) hot[i] = 1;
  }

  // Find the largest 4-connected blob via iterative flood fill.
  const visited = new Uint8Array(GRID_W * GRID_H);
  let best = null;
  for (let start = 0; start < hot.length; start++) {
    if (!hot[start] || visited[start]) continue;
    const stack = [start];
    let minGX = GRID_W, minGY = GRID_H, maxGX = -1, maxGY = -1, size = 0;
    while (stack.length) {
      const idx = stack.pop();
      if (visited[idx] || !hot[idx]) continue;
      visited[idx] = 1; size++;
      const gx = idx % GRID_W, gy = (idx - gx) / GRID_W;
      if (gx < minGX) minGX = gx; if (gy < minGY) minGY = gy;
      if (gx > maxGX) maxGX = gx; if (gy > maxGY) maxGY = gy;
      if (gx > 0)          stack.push(idx - 1);
      if (gx < GRID_W - 1) stack.push(idx + 1);
      if (gy > 0)          stack.push(idx - GRID_W);
      if (gy < GRID_H - 1) stack.push(idx + GRID_W);
    }
    if (!best || size > best.size) best = { minGX, minGY, maxGX, maxGY, size };
  }

  const debugMask = { hot, GRID_W, GRID_H, totalMatches, hotCells: best?.size || 0 };
  if (!best || best.size < 2) return { x: 0, y: 0, w: 0, h: 0, coverage: 0, _debug: debugMask, _empty: true };

  return {
    x: (best.minGX / GRID_W) * 100,
    y: (best.minGY / GRID_H) * 100,
    w: ((best.maxGX - best.minGX + 1) / GRID_W) * 100,
    h: ((best.maxGY - best.minGY + 1) / GRID_H) * 100,
    coverage: best.size / (GRID_W * GRID_H),
    _debug: debugMask,
  };
}
function useColorPackageDetector(videoRef, enabled, target) {
  const [det, setDet] = React.useState(null);
  React.useEffect(() => {
    if (!enabled || !target) { setDet(null); return; }
    let running = true;
    const id = setInterval(() => {
      if (!running) return;
      const v = videoRef.current;
      if (!v || v.readyState < 2) return;
      const r = scanForColor(v, target);
      setDet(r);
    }, 100);
    return () => { running = false; clearInterval(id); };
  }, [enabled, target, videoRef]);
  return det;
}

function useLiveDetections(videoRef, enabled) {
  const model = useCocoModel();
  const [dets, setDets] = React.useState([]);
  React.useEffect(() => {
    if (!enabled || !model) return;
    let raf;
    let running = true;
    const tick = async () => {
      const v = videoRef.current;
      if (running && v && v.readyState >= 2 && v.videoWidth > 0) {
        try {
          // Lower threshold (0.3) so cardboard surfaces register; geometry
          // filter below rejects garbage hits.
          const preds = await model.detect(v, 12, 0.3);
          if (!running) return;
          const W = v.videoWidth, H = v.videoHeight;
          const mapped = [];
          for (const p of preds) {
            const bboxPct = [
              (p.bbox[0] / W) * 100,
              (p.bbox[1] / H) * 100,
              (p.bbox[2] / W) * 100,
              (p.bbox[3] / H) * 100,
            ];
            let label = p.class;
            if (PEEP_PACKAGE_CLASSES.has(p.class)) {
              if (!isPackageLike(bboxPct)) continue;  // wrong shape/size for a package
              label = 'package';
            } else if (label !== 'person' && label !== 'dog' && label !== 'cat'
                    && label !== 'bird' && label !== 'bear') {
              // Drop everything that isn't a relevant class for this product.
              continue;
            }
            mapped.push({
              x: bboxPct[0], y: bboxPct[1], w: bboxPct[2], h: bboxPct[3],
              label, conf: p.score.toFixed(2),
              color: PEEP_LABEL_COLORS[label] || '#9a9489',
            });
          }
          setDets(mapped);
          // The state machine is fed downstream from CameraPlaceholder once
          // we've merged in the color-calibrated package detection — so we
          // don't tick here.
        } catch {}
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { running = false; if (raf) cancelAnimationFrame(raf); };
  }, [model, enabled, videoRef]);
  return dets;
}

// Forward-ref webcam so a parent can attach the ref and run inference on it.
const ConsoleWebcam = React.forwardRef(function ConsoleWebcam(_, ref) {
  const localRef = React.useRef(null);
  const videoRef = ref || localRef;
  const [error, setError] = React.useState(null);
  React.useEffect(() => {
    let stream;
    let cancelled = false;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false,
        });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
      } catch (e) {
        setError(e.message || 'Camera unavailable');
      }
    })();
    return () => {
      cancelled = true;
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, [videoRef]);
  return (
    <div className="absolute inset-0 bg-black">
      <video ref={videoRef} autoPlay playsInline muted
             className="w-full h-full object-cover" />
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6"
             style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>
          <div>Camera access denied or unavailable</div>
          <div style={{ opacity: 0.6, marginTop: 4 }}>{error}</div>
        </div>
      )}
    </div>
  );
});

const CameraPlaceholder = ({ source, detections = [] }) => {
  const [now, setNow] = React.useState(new Date());
  React.useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const timeStr = now.toLocaleTimeString([], { hour12: false });
  const videoRef = React.useRef(null);
  const wrapperRef = React.useRef(null);
  const liveDets = useLiveDetections(videoRef, source === 'live');

  // Color-calibrated package detection (sampled with a tap on the video).
  const [calibrating, setCalibrating] = React.useState(false);
  const [pkgColor, setPkgColor] = React.useState(() => {
    try {
      const s = localStorage.getItem('peep.pkgColor');
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  });
  React.useEffect(() => {
    if (pkgColor) localStorage.setItem('peep.pkgColor', JSON.stringify(pkgColor));
    else          localStorage.removeItem('peep.pkgColor');
  }, [pkgColor]);

  const colorDet = useColorPackageDetector(videoRef, source === 'live' && !!pkgColor, pkgColor);

  // ── Porch zone (user-drawn rectangle) + baseline RGB ───────────────
  const [porchZone, setPorchZone] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem('peep.porchZone') || 'null'); }
    catch { return null; }
  });
  const [porchBaseline, setPorchBaseline] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem('peep.porchBaseline') || 'null'); }
    catch { return null; }
  });
  const [drawingZone, setDrawingZone] = React.useState(false);
  const [drawStart, setDrawStart] = React.useState(null);
  const [drawCurrent, setDrawCurrent] = React.useState(null);

  React.useEffect(() => {
    if (porchZone) localStorage.setItem('peep.porchZone', JSON.stringify(porchZone));
    else           localStorage.removeItem('peep.porchZone');
  }, [porchZone]);
  React.useEffect(() => {
    if (porchBaseline) localStorage.setItem('peep.porchBaseline', JSON.stringify(porchBaseline));
    else               localStorage.removeItem('peep.porchBaseline');
  }, [porchBaseline]);

  function captureBaselineFor(zone) {
    const v = videoRef.current;
    if (!v?.videoWidth || !zone) return;
    const W = v.videoWidth, H = v.videoHeight;
    const sx = Math.max(0, Math.floor(zone.x / 100 * W));
    const sy = Math.max(0, Math.floor(zone.y / 100 * H));
    const sw = Math.max(1, Math.floor(zone.w / 100 * W));
    const sh = Math.max(1, Math.floor(zone.h / 100 * H));
    const c = document.createElement('canvas');
    c.width = 32; c.height = 32;
    c.getContext('2d').drawImage(v, sx, sy, sw, sh, 0, 0, 32, 32);
    const px = c.getContext('2d').getImageData(0, 0, 32, 32).data;
    let r = 0, g = 0, b = 0, n = 0;
    for (let i = 0; i < px.length; i += 4) { r += px[i]; g += px[i+1]; b += px[i+2]; n++; }
    setPorchBaseline({ r: r / n, g: g / n, b: b / n });
  }

  // Merge color hit into the displayed detections so the state machine sees it.
  const displayDets = React.useMemo(() => {
    if (source !== 'live') return detections;
    const base = liveDets || [];
    if (!colorDet || colorDet._empty) return base;
    const filtered = base.filter(d => d.label !== 'package');
    return [...filtered, {
      x: colorDet.x, y: colorDet.y, w: colorDet.w, h: colorDet.h,
      label: 'package',
      conf: Math.min(0.98, 0.7 + colorDet.coverage * 30).toFixed(2),
      color: '#706b8e',
    }];
  }, [source, detections, liveDets, colorDet]);

  // Debug overlay toggle
  const [showDebug, setShowDebug] = React.useState(false);

  // Push to vision-agent + the new theft detector + standalone fleeing
  // detector each frame. The fleeing detector runs in parallel, not gated
  // by any state machine, so grab-and-run scenarios trigger.
  React.useEffect(() => {
    if (source !== 'live') return;
    if (window.PeepVisionAgent) {
      window.PeepVisionAgent.tick({ dets: displayDets, videoEl: videoRef.current });
    }
    if (window.PeepTheftDetector) {
      window.PeepTheftDetector.tick({
        dets: displayDets,
        videoEl: videoRef.current,
        zone: porchZone,
        baseline: porchBaseline,
      });
    }
    if (window.MyFleeingDetector) {
      window.MyFleeingDetector.tick({ dets: displayDets, videoEl: videoRef.current });
    }
  }, [source, displayDets, porchZone, porchBaseline]);

  // ── Mouse handling: color tap OR zone drag, depending on mode ──────
  function pointPct(e) {
    const r = wrapperRef.current?.getBoundingClientRect();
    if (!r) return { x: 0, y: 0 };
    return {
      x: Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width)  * 100)),
      y: Math.max(0, Math.min(100, ((e.clientY - r.top)  / r.height) * 100)),
    };
  }
  const handleMouseDown = (e) => {
    if (drawingZone) {
      const p = pointPct(e);
      setDrawStart(p);
      setDrawCurrent(p);
    }
  };
  const handleMouseMove = (e) => {
    if (drawingZone && drawStart) setDrawCurrent(pointPct(e));
  };
  const handleMouseUp = (e) => {
    if (drawingZone && drawStart) {
      const end = pointPct(e);
      const zone = {
        x: Math.min(drawStart.x, end.x),
        y: Math.min(drawStart.y, end.y),
        w: Math.abs(end.x - drawStart.x),
        h: Math.abs(end.y - drawStart.y),
      };
      setDrawStart(null); setDrawCurrent(null); setDrawingZone(false);
      if (zone.w >= 4 && zone.h >= 4) {
        setPorchZone(zone);
        // Capture the baseline a beat later so the most recent frame is on the canvas.
        setTimeout(() => captureBaselineFor(zone), 50);
      }
    }
  };
  const handleVideoTap = (e) => {
    if (drawingZone) return;
    if (!calibrating) return;
    const p = pointPct(e);
    const sample = sampleVideoColor(videoRef.current, p.x, p.y);
    if (sample) setPkgColor(sample);
    setCalibrating(false);
  };
  const recaptureBaseline = () => porchZone && captureBaselineFor(porchZone);
  const liveZoneRect = drawStart && drawCurrent ? {
    x: Math.min(drawStart.x, drawCurrent.x),
    y: Math.min(drawStart.y, drawCurrent.y),
    w: Math.abs(drawCurrent.x - drawStart.x),
    h: Math.abs(drawCurrent.y - drawStart.y),
  } : null;

  return (
    <div ref={wrapperRef}
         onClick={handleVideoTap}
         onMouseDown={handleMouseDown}
         onMouseMove={handleMouseMove}
         onMouseUp={handleMouseUp}
         className="relative w-full aspect-[16/9] rounded-lg overflow-hidden hairline"
         style={{ background: 'linear-gradient(180deg, #1f1c18 0%, #161412 100%)',
                  cursor: (calibrating || drawingZone) ? 'crosshair' : 'default' }}>
      {source === 'live' ? (
        <ConsoleWebcam ref={videoRef} />
      ) : (
      /* House silhouette — porch view (import / fallback) */
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 450" preserveAspectRatio="xMidYMid slice" fill="none">
        <rect x="0" y="0" width="800" height="78" fill="#181613" />
        <rect x="60" y="78" width="14" height="282" fill="#1f1c18" />
        <rect x="726" y="78" width="14" height="282" fill="#1f1c18" />
        <rect x="80" y="78" width="640" height="282" fill="#1c1a17" />
        <g stroke="#161412" strokeWidth="1">
          <line x1="80" y1="130" x2="720" y2="130" />
          <line x1="80" y1="180" x2="720" y2="180" />
          <line x1="80" y1="230" x2="720" y2="230" />
          <line x1="80" y1="280" x2="720" y2="280" />
          <line x1="80" y1="330" x2="720" y2="330" />
        </g>
        <rect x="296" y="110" width="208" height="250" fill="#16140f" />
        <rect x="306" y="120" width="188" height="240" fill="#22201c" />
        <rect x="320" y="138" width="74" height="62" fill="none" stroke="#2a2823" />
        <rect x="406" y="138" width="74" height="62" fill="none" stroke="#2a2823" />
        <rect x="320" y="216" width="74" height="62" fill="none" stroke="#2a2823" />
        <rect x="406" y="216" width="74" height="62" fill="none" stroke="#2a2823" />
        <circle cx="476" cy="248" r="3" fill="#3a3a37" />
        <rect x="0" y="360" width="800" height="90" fill="#13110e" />
        <rect x="320" y="364" width="160" height="16" fill="#1a1813" />
        <rect x="546" y="322" width="62" height="40" fill="#23211d" stroke="#2c2a25" />
        <line x1="546" y1="338" x2="608" y2="338" stroke="#2c2a25" />
        <line x1="577" y1="322" x2="577" y2="362" stroke="#2c2a25" />
      </svg>
      )}

      {/* Scanline — kept, very subtle */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute left-0 right-0 h-px scanline" style={{
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.10), transparent)'
        }} />
      </div>

      {/* Detection overlays */}
      {displayDets.map((d, i) => (
        <div key={i} className="absolute" style={{
          left: d.x + '%', top: d.y + '%', width: d.w + '%', height: d.h + '%',
          border: `1px solid ${d.color}`,
        }}>
          <div className="absolute -top-[18px] left-0 px-1.5 h-[16px] flex items-center text-[11px] font-mono"
               style={{ background: d.color, color: '#17140f' }}>
            {d.label} <span className="ml-1 opacity-70">{d.conf}</span>
          </div>
        </div>
      ))}

      {/* Top-left source label */}
      <div className="absolute top-3 left-3">
        <span className="inline-flex items-center gap-1.5 px-2 py-[2px] rounded text-[12px] text-white/90 whitespace-nowrap"
              style={{ background: 'rgba(0,0,0,0.5)' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-white pulse-dot" style={{ '--pc': 'rgba(255,255,255,0.5)' }} />
          {source === 'live' ? 'Live · 1080p · 12 fps' : 'Imported video · 00:23 / 02:14'}
        </span>
      </div>

      {/* Color-match debug overlay (hot cells) */}
      {showDebug && source === 'live' && colorDet?._debug && (() => {
        const { hot, GRID_W, GRID_H, totalMatches, hotCells } = colorDet._debug;
        const cellW = 100 / GRID_W, cellH = 100 / GRID_H;
        const cells = [];
        for (let i = 0; i < hot.length; i++) {
          if (!hot[i]) continue;
          const gx = i % GRID_W, gy = (i - gx) / GRID_W;
          cells.push(
            <div key={i} className="absolute pointer-events-none" style={{
              left:  (gx * cellW) + '%',
              top:   (gy * cellH) + '%',
              width: cellW + '%',
              height: cellH + '%',
              background: 'rgba(255,150,80,0.55)',
            }} />
          );
        }
        return (
          <>
            {cells}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 font-mono"
                 style={{ background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '3px 8px',
                          borderRadius: 4, fontSize: 10, zIndex: 6 }}>
              matches:{totalMatches}  hot:{hotCells} cells  thresh:lower if too few
            </div>
          </>
        );
      })()}

      {/* Porch zone overlay + live drag rectangle */}
      {source === 'live' && (porchZone || liveZoneRect) && (() => {
        const z = liveZoneRect || porchZone;
        return (
          <div className="absolute pointer-events-none"
               style={{
                 left: z.x + '%', top: z.y + '%',
                 width: z.w + '%', height: z.h + '%',
                 border: liveZoneRect ? '1.5px dashed #c2b87a' : '1.5px dashed #7ea582',
                 background: liveZoneRect ? 'rgba(194,184,122,0.10)' : 'rgba(126,165,130,0.06)',
                 boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.25)',
                 zIndex: 3,
               }}>
            {!liveZoneRect && (
              <div style={{
                position: 'absolute', top: -16, left: 0, padding: '0 4px', height: 14,
                background: '#7ea582', color: '#0a0a0a', fontSize: 10,
                fontFamily: 'JetBrains Mono, ui-monospace, monospace', lineHeight: '14px',
              }}>porch zone</div>
            )}
          </div>
        );
      })()}

      {/* Top-right cluster: clock + zone + color-calibration controls */}
      <div className="absolute top-3 right-3 flex items-center gap-2 flex-wrap justify-end" style={{ maxWidth: '70%' }}>
        {source === 'live' && (
          <>
            {/* Porch zone */}
            {porchZone && !drawingZone && (
              <span className="inline-flex items-center gap-1.5 px-2 py-[3px] rounded text-[11px] text-white/90"
                    style={{ background: 'rgba(0,0,0,0.5)' }}>
                <span className="w-2.5 h-2.5 rounded-sm" style={{ background: '#7ea582' }} />
                porch zone
                <button onClick={(e) => { e.stopPropagation(); recaptureBaseline(); }}
                        className="ml-1 opacity-80 hover:opacity-100"
                        title="Re-capture baseline of the empty porch">↻</button>
                <button onClick={(e) => { e.stopPropagation(); setPorchZone(null); setPorchBaseline(null); }}
                        className="ml-1 opacity-70 hover:opacity-100"
                        title="Clear porch zone">×</button>
              </span>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); setDrawingZone(d => !d); setCalibrating(false); }}
              className="px-2 py-[3px] rounded text-[11px] text-white/90"
              style={{ background: drawingZone ? 'rgba(126,165,130,0.85)' : 'rgba(0,0,0,0.5)' }}
              title="Drag a rectangle on the feed to mark the porch area">
              {drawingZone ? 'Drag the porch area…' : (porchZone ? 'Re-draw zone' : 'Set porch zone')}
            </button>

            {/* Package color (existing) */}
            {pkgColor && !calibrating && (
              <span className="inline-flex items-center gap-1.5 px-2 py-[3px] rounded text-[11px] text-white/90"
                    style={{ background: 'rgba(0,0,0,0.5)' }}>
                <span className="w-2.5 h-2.5 rounded-sm hairline"
                      style={{ background: `rgb(${pkgColor.r},${pkgColor.g},${pkgColor.b})` }} />
                package color
                <button
                  onClick={(e) => { e.stopPropagation(); setPkgColor(null); }}
                  className="ml-1 opacity-70 hover:opacity-100"
                  title="Clear calibration">×</button>
              </span>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); setCalibrating(c => !c); setDrawingZone(false); }}
              className="px-2 py-[3px] rounded text-[11px] text-white/90"
              style={{ background: calibrating ? 'rgba(112,107,142,0.85)' : 'rgba(0,0,0,0.5)' }}
              title="Tap the box in the feed to calibrate package color">
              {calibrating ? 'Tap the box…' : (pkgColor ? 'Re-calibrate' : 'Calibrate package color')}
            </button>
            {pkgColor && (
              <button
                onClick={(e) => { e.stopPropagation(); setShowDebug(d => !d); }}
                className="px-2 py-[3px] rounded text-[11px] text-white/90"
                style={{ background: showDebug ? 'rgba(200,170,120,0.85)' : 'rgba(0,0,0,0.5)' }}
                title="Show which pixels match your calibrated color">
                {showDebug ? 'Mask on' : 'Mask off'}
              </button>
            )}
          </>
        )}
        <div className="font-mono text-[13px] text-white/85 tabular-nums"
             style={{ textShadow: '0 0 4px rgba(0,0,0,0.8)' }}>
          {timeStr}
        </div>
      </div>

      {/* In-feed detection legend (bottom-left) */}
      <div className="absolute bottom-3 left-3 flex items-center gap-3">
        {[
          ['person','#7ea582'], ['package','#706b8e'], ['weapon','#b3bd80'], ['animal','#758082']
        ].map(([l, c]) => (
          <span key={l} className="inline-flex items-center gap-1.5 text-[12px] text-white/75">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: c }} />{l}
          </span>
        ))}
      </div>

      {/* Bottom-right camera id */}
      <div className="absolute bottom-3 right-3 font-mono text-[12px] text-white/55 tabular-nums">
        cam_01
      </div>
    </div>
  );
};

Object.assign(window, {
  Icon, Phx, Pill, SeverityChip, Mono, Surface, Btn, Toggle, StatusDot, Kbd, SectionLabel, Divider, Slider, Chip, CameraPlaceholder, hexToRgba,
});
