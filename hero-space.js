// Space hero. The motif is the horizon line: her path, left to right.
// Opening (once per session, any input skips it): the line draws while the places change underneath one fixed sentence,
// three stops light up as the line passes, the line ends under her feet, dawn rises, then the title and the corner text.
// Scroll: the scene recedes and the curved horizon straightens into the top edge of the page that rises over it.
(() => {
  const hero = document.querySelector('[data-hero]');
  const after = document.querySelector('[data-after-hero]');
  if (!hero || !after) return;

  const IW = 1672, IH = 941, FIG_X = 843;
  const STOPS = [
    { x: 180, label: ['Trained in', 'architecture'] },
    { x: 410, label: ['6+ years in', 'product design'] },
    { x: 640, label: ['Google Labs', 'NotebookLM'] },
  ];
  const FEET_X = 830; // the line ends under her feet; nothing is drawn there
  const PLACES = [[.5, 'Zhengzhou, China'], [1.1, 'Shanghai, China'], [1.7, 'St. Louis, MO'], [2.3, 'Bay Area, CA']];
  const DUR = 4.8;
  // one silhouette per video frame (151 frames, 24fps), lower body only: where the line can cross her
  const MATTE = { src: 'assets/hero/matte.webp', vw: 1920, vh: 1080, bx: 810, by: 500, bw: 308, bh: 366, fw: 154, fh: 183, cols: 16, n: 151, fps: 24 };

  const $ = s => hero.querySelector(s);
  const wrap = $('[data-space-wrap]'), scene = $('[data-space-scene]'), video = $('video'), night = $('[data-space-night]');
  const hz = $('[data-hz]'), hzg = $('[data-hz-glow]'), dotsG = $('[data-hz-dots]'), lblG = $('[data-hz-labels]'), fig = $('[data-space-figure]');
  const copy = $('[data-space-copy]'), journey = $('[data-space-journey]'), place = $('[data-space-place]'), vignette = $('[data-space-vignette]');
  const huds = [...hero.querySelectorAll('[data-space-hud]')], meteor = $('[data-meteor]');
  const morph = document.querySelector('[data-space-morph]');
  const mline = morph && morph.querySelector('[data-morph-line]'), mglow = morph && morph.querySelector('[data-morph-glow]'), mgrad = morph && morph.querySelector('[data-morph-grad]');
  const header = document.querySelector('[data-nav]');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const SVGNS = 'http://www.w3.org/2000/svg';

  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const seg = (p, a, b) => clamp((p - a) / (b - a), 0, 1);
  const ease = t => 1 - Math.pow(1 - t, 3);
  const easeIO = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  const interp = (keys, t) => {
    if (t <= keys[0][0]) return keys[0][1];
    for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) { const [t0, v0] = keys[i - 1], [t1, v1] = keys[i]; return v0 + (v1 - v0) * (t - t0) / (t1 - t0); }
    return keys[keys.length - 1][1];
  };

  // ---------- the path and its stops ----------
  const HL = hz.getTotalLength();
  const lenAtX = x => { let lo = 0, hi = HL; for (let k = 0; k < 30; k++) { const m = (lo + hi) / 2; if (hz.getPointAtLength(m).x < x) lo = m; else hi = m; } return lo; };
  const FR = [...STOPS.map(s => lenAtX(s.x) / HL), lenAtX(FEET_X) / HL];
  const stops = STOPS.map(s => {
    const p = hz.getPointAtLength(lenAtX(s.x));
    const c = document.createElementNS(SVGNS, 'circle'); c.setAttribute('cx', p.x); c.setAttribute('cy', p.y); dotsG.appendChild(c);
    const g = document.createElementNS(SVGNS, 'g');
    g.innerHTML = `<line x1="${p.x}" x2="${p.x}" vector-effect="non-scaling-stroke" stroke-width="1"/><text x="${p.x}" text-anchor="middle">${s.label.map((w, j) => `<tspan x="${p.x}" dy="${j ? 1.5 : 0}em">${w.toUpperCase()}</tspan>`).join('')}</text>`;
    lblG.appendChild(g);
    return { p, c, g };
  });

  // ---------- opening timeline: t (s) -> state ----------
  // beats: 0.5s start · 1.9s architecture · 2.5s product design · 2.85s Google Labs · 3.05s her feet
  const KEYS = [[.5, 0], [1.9, FR[0]], [2.5, FR[1]], [2.85, FR[2]], [3.05, FR[3]]];
  const lineAt = t => t < 3.05 ? interp(KEYS, t) : FR[3] + (1 - FR[3]) * ease(seg(t, 3.05, 3.6));
  const placeAt = t => { let s = PLACES[0][1]; for (const [at, name] of PLACES) if (t >= at) s = name; return s; };
  const placeDip = t => { let o = 1; for (const [at] of PLACES.slice(1)) o = Math.min(o, Math.abs(t - at) / .14); return Math.min(1, o); };
  function stateAt(t) {
    const lf = lineAt(t);
    return {
      night: 1 - easeIO(seg(t, 2.9, 4.0)),
      line: lf, lineOp: 1 - .45 * seg(t, 3.4, 4.4),
      dots: FR.slice(0, 3).map(f => ease(clamp((lf - f) / .025, 0, 1))),
      title: ease(seg(t, 3.6, 4.5)), hud: ease(seg(t, 4.0, 4.8)),
      journey: ease(seg(t, .3, .7)) * (1 - seg(t, 3.05, 3.35)), place: t < 3.35 ? placeAt(t) : '', placeOp: placeDip(t),
    };
  }
  const END = { night: 0, line: 1, lineOp: .55, dots: [1, 1, 1], title: 1, hud: 1, journey: 0, place: '', placeOp: 0 };

  // ---------- figure layer: her body is redrawn above the line every video frame ----------
  const fx = fig.getContext('2d');
  const matte = new Image(); let matteReady = false, mediaTime = 0;
  matte.onload = () => { matteReady = true; drawFigure(); };
  matte.src = MATTE.src;
  function drawFigure() {
    if (!fig.width) return;
    fx.globalCompositeOperation = 'source-over'; fx.clearRect(0, 0, fig.width, fig.height);
    if (!matteReady || video.readyState < 2) return;
    const i = Math.round(mediaTime * MATTE.fps) % MATTE.n;
    fx.drawImage(video, MATTE.bx, MATTE.by, MATTE.bw, MATTE.bh, 0, 0, fig.width, fig.height);
    fx.globalCompositeOperation = 'destination-in';
    fx.drawImage(matte, (i % MATTE.cols) * MATTE.fw, Math.floor(i / MATTE.cols) * MATTE.fh, MATTE.fw, MATTE.fh, 0, 0, fig.width, fig.height);
    if (state.night > 0) { fx.globalCompositeOperation = 'source-atop'; fx.fillStyle = `rgba(0,0,0,${state.night})`; fx.fillRect(0, 0, fig.width, fig.height); }
    fx.globalCompositeOperation = 'source-over';
    drawOver();
  }
  // while scrolling, the straightening line is drawn above the whole page, so a copy of her sits above it too
  // (clipped at the page edge, so she never shows on the paper)
  const over = document.createElement('canvas'); over.className = 'space-figure-over'; over.setAttribute('aria-hidden', 'true');
  document.body.appendChild(over);
  const ox2 = over.getContext('2d');
  function drawOver() {
    if (!morphHide) { if (over.style.display !== 'none') over.style.display = 'none'; return; }
    const r = fig.getBoundingClientRect(), cut = Math.max(0, r.bottom - after.getBoundingClientRect().top);
    over.style.display = 'block';
    Object.assign(over.style, { left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px`, filter: scene.style.filter, clipPath: `inset(0 0 ${cut}px 0)` });
    if (over.width !== fig.width || over.height !== fig.height) { over.width = fig.width; over.height = fig.height; }
    ox2.clearRect(0, 0, over.width, over.height); ox2.drawImage(fig, 0, 0);
  }
  if ('requestVideoFrameCallback' in HTMLVideoElement.prototype) {
    const onFrame = (now, meta) => { mediaTime = meta.mediaTime; drawFigure(); video.requestVideoFrameCallback(onFrame); };
    video.requestVideoFrameCallback(onFrame);
  } else {
    const loop = () => { if (!video.paused) { mediaTime = video.currentTime; drawFigure(); } requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  }
  video.addEventListener('loadeddata', drawFigure);
  video.addEventListener('seeked', () => { mediaTime = video.currentTime; drawFigure(); });

  // ---------- layout: frame the 16:9 scene so it covers the viewport, with her ~74% across on desktop ----------
  let mobile = false;
  function layout() {
    const vw = innerWidth, vh = innerHeight;
    mobile = vw < 760 && vh > vw;
    const ww = Math.max(mobile ? 0 : 1.52 * vw, vh * IW / IH * (mobile ? 1.4 : 1), vw);
    const wh = ww * IH / IW;
    let left = (mobile ? 0.66 : 0.74) * vw - FIG_X / IW * ww;
    let top = mobile ? 0.5 * vh - 260 / IH * wh : vh / 2 - 459.5 / IH * wh;
    left = Math.min(0, Math.max(vw - ww, left));
    top = Math.min(0, Math.max(vh - wh, top));
    wrap.style.cssText = `width:${ww}px;height:${wh}px;left:${left}px;top:${top}px`;
    hero.classList.toggle('is-phone', mobile);

    const px = v => v * IW / ww; // screen px -> scene units
    hz.style.strokeWidth = px(1.4); hzg.style.strokeWidth = px(6.3);
    for (const s of stops) {
      s.c.setAttribute('r', px(3.4));
      const l = s.g.querySelector('line'), t = s.g.querySelector('text');
      l.setAttribute('y1', s.p.y + px(6)); l.setAttribute('y2', s.p.y + px(22));
      t.setAttribute('y', s.p.y + px(36)); t.setAttribute('font-size', px(10.5));
    }
    // the video is object-fit: cover inside the wrap; place the canvas over the matte region of the frame
    const vs = Math.max(ww / MATTE.vw, wh / MATTE.vh), ox = (ww - MATTE.vw * vs) / 2, oy = (wh - MATTE.vh * vs) / 2;
    const cw = MATTE.bw * vs, ch = MATTE.bh * vs, dpr = Math.min(2, devicePixelRatio || 1);
    Object.assign(fig.style, { left: `${ox + MATTE.bx * vs}px`, top: `${oy + MATTE.by * vs}px`, width: `${cw}px`, height: `${ch}px` });
    fig.width = Math.round(Math.min(MATTE.bw, cw * dpr)); fig.height = Math.round(Math.min(MATTE.bh, ch * dpr));
    // desktop: the three lines sit a little above center, but always clear of the horizon and its stops
    if (!mobile) {
      const h = copy.offsetHeight, gx = copy.offsetLeft;
      const hzY = top + hz.getPointAtLength(lenAtX((gx - left) * IW / ww)).y * wh / IH;
      copy.style.top = `${Math.max(88, Math.min(vh / 2 - .58 * h, hzY - 56 - h))}px`;
    } else copy.style.top = '';
    render(state);
  }

  // ---------- render ----------
  let state = END, copyFade = 0, dotFade = 1, morphHide = false;
  function render(st) {
    state = st;
    night.style.opacity = st.night;
    hz.style.strokeDasharray = hzg.style.strokeDasharray = `${HL} ${HL}`;
    hz.style.strokeDashoffset = hzg.style.strokeDashoffset = HL * (1 - st.line);
    hz.style.opacity = morphHide ? 0 : st.lineOp; hzg.style.opacity = morphHide ? 0 : .8 * st.lineOp;
    stops.forEach((s, i) => { const o = st.dots[i] * dotFade; s.c.style.opacity = o; s.g.style.opacity = o; });
    copy.style.opacity = st.title * (1 - copyFade);
    copy.style.transform = `translateY(${(1 - st.title) * 18 - 40 * copyFade}px)`;
    journey.style.opacity = st.journey;
    if (place.textContent !== st.place) place.textContent = st.place;
    place.style.opacity = st.placeOp;
    huds.forEach(h => { h.style.opacity = st.hud * dotFade; });
    vignette.style.opacity = 1 - st.night;
    drawFigure();
  }

  // ---------- scroll: recede, and straighten the horizon into the page edge ----------
  const N = 64;
  let covered = false;
  function onScroll() {
    const vh = innerHeight, vw = innerWidth;
    const p = clamp(window.scrollY / vh, 0, 1);
    if (!reduce) {
      const back = ease(seg(p, 0, .95));
      scene.style.transform = `scale(${1 - .05 * back})`;
      scene.style.filter = `brightness(${1 - .5 * back})`;
    }
    copyFade = seg(p, .05, .45);
    dotFade = 1 - seg(p, 0, .18);
    const useMorph = !!morph && !reduce && p > .002 && p < 1;
    morphHide = useMorph;
    if (useMorph) {
      const m = easeIO(seg(p, 0, .5)), top = after.getBoundingClientRect().top, ctm = hz.getScreenCTM();
      mgrad.setAttribute('x2', vw);
      const pts = [];
      for (let i = 0; i < N; i++) {
        const f = i / (N - 1), sp = hz.getPointAtLength(f * HL);
        const sx = ctm.a * sp.x + ctm.c * sp.y + ctm.e, sy = ctm.b * sp.x + ctm.d * sp.y + ctm.f;
        pts.push(`${(sx + (f * vw - sx) * m).toFixed(1)},${(sy + (top - sy) * m).toFixed(1)}`);
      }
      const s = pts.join(' ');
      mline.setAttribute('points', s); mglow.setAttribute('points', s);
      const op = state.lineOp / .55 * (1 - seg(p, .62, .95));
      mline.setAttribute('opacity', clamp(.6 + .4 * m, 0, 1) * op); mglow.setAttribute('opacity', .8 * op);
    } else if (morph) { mline.setAttribute('opacity', 0); mglow.setAttribute('opacity', 0); }
    render(state);
    if (header) header.toggleAttribute('data-on-dark', p < .9);
    const nowCovered = p >= 1;
    if (nowCovered !== covered) { covered = nowCovered; if (covered) video.pause(); else play(); }
  }

  function play() {
    if (reduce || covered) return;
    const q = video.play();
    if (q && q.catch) q.catch(() => {});
  }

  // ---------- opening ----------
  let raf = 0, opening = false;
  function finishOpening() {
    if (!opening) return;
    opening = false; cancelAnimationFrame(raf); render(END);
    for (const ev of SKIP) removeEventListener(ev, finishOpening);
  }
  const SKIP = ['wheel', 'touchstart', 'keydown', 'pointerdown'];
  function runOpening() {
    opening = true;
    try { video.currentTime = 0; } catch (e) {}
    const t0 = performance.now();
    const tick = now => { if (!opening) return; const t = (now - t0) / 1000; if (t >= DUR) { finishOpening(); return; } render(stateAt(t)); raf = requestAnimationFrame(tick); };
    render(stateAt(0));
    raf = requestAnimationFrame(tick);
    for (const ev of SKIP) addEventListener(ev, finishOpening, { passive: true });
  }

  // Occasional meteor, passing behind her toward the left horizon
  function shoot() {
    if (covered || document.hidden) return;
    const x = 1170 + Math.random() * 30, y = 266 + Math.random() * 16, dur = 1400, dist = 740;
    const deg = 161 + Math.random() * 2, a = deg * Math.PI / 180, dx = Math.cos(a), dy = Math.sin(a), s = performance.now();
    (function frame(t) {
      const p = Math.min((t - s) / dur, 1);
      const e = p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      meteor.setAttribute('transform', `translate(${(x + dx * dist * e).toFixed(1)} ${(y + dy * dist * e).toFixed(1)}) rotate(${deg.toFixed(1)}) scale(.38)`);
      meteor.style.opacity = .7 * (p < .15 ? p / .15 : p > .6 ? Math.max(0, (1 - p) / .4) : 1);
      if (p < 1) requestAnimationFrame(frame); else meteor.style.opacity = 0;
    })(s);
  }
  function schedule() { setTimeout(() => { shoot(); schedule(); }, 12000 + Math.random() * 8000); }

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (opening) finishOpening();
    if (!ticking) { ticking = true; requestAnimationFrame(() => { ticking = false; onScroll(); }); }
  }, { passive: true });
  window.addEventListener('resize', () => { layout(); onScroll(); }, { passive: true });

  // the opening plays once per browser session (add ?intro to the URL to see it again)
  const wantsOpening = document.documentElement.classList.contains('opening');
  layout();
  onScroll();
  if (wantsOpening && !reduce && window.scrollY < 10) {
    try { sessionStorage.setItem('vl-opening', '1'); } catch (e) {}
    runOpening();
  } else render(END);
  document.documentElement.classList.remove('opening');

  if (reduce) { video.removeAttribute('autoplay'); video.pause(); return; }
  video.addEventListener('canplay', play);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) play(); });
  play();
  setTimeout(() => { shoot(); schedule(); }, 6000);
})();
