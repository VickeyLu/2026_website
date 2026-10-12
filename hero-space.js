(() => {
  const hero = document.querySelector('[data-hero]');
  const after = document.querySelector('[data-after-hero]');
  if (!hero || !after) return;

  const IW = 1672, IH = 941, FIG_X = 843;
  const wrap = hero.querySelector('[data-space-wrap]');
  const scene = hero.querySelector('[data-space-scene]');
  const copy = hero.querySelector('[data-space-copy]');
  const video = hero.querySelector('video');
  const fx = hero.querySelector('.space-fx');
  const night = hero.querySelector('[data-space-night]');
  const meteor = hero.querySelector('[data-meteor]');
  const header = document.querySelector('[data-nav]');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const seg = (p, a, b) => clamp((p - a) / (b - a), 0, 1);
  const ease = t => 1 - Math.pow(1 - t, 3);

  // Frame the 16:9 scene so it always covers the viewport, with Vickey ~74% across on desktop
  function layout() {
    const vw = innerWidth, vh = innerHeight;
    const mobile = vw < 760 && vh > vw;
    const ww = Math.max(mobile ? 0 : 1.52 * vw, vh * IW / IH * (mobile ? 1.4 : 1), vw);
    const wh = ww * IH / IW;
    let left = (mobile ? 0.66 : 0.74) * vw - FIG_X / IW * ww;
    let top = mobile ? 0.5 * vh - 260 / IH * wh : vh / 2 - 459.5 / IH * wh;
    left = Math.min(0, Math.max(vw - ww, left));
    top = Math.min(0, Math.max(vh - wh, top));
    wrap.style.cssText = `width:${ww}px;height:${wh}px;left:${left}px;top:${top}px`;
  }

  // B4: as the page rises over the hero, the scene recedes and dims; a horizon light rides the page's top edge
  let covered = false;
  function onScroll() {
    const vh = innerHeight;
    const p = clamp(window.scrollY / vh, 0, 1);
    const mobile = innerWidth < 760 && vh > innerWidth;
    if (!reduce) {
      const back = ease(seg(p, 0, .95));
      scene.style.transform = `scale(${1 - .05 * back})`;
      scene.style.filter = `brightness(${1 - .5 * back})`;
      const cf = seg(p, .05, .45);
      copy.style.opacity = 1 - cf;
      copy.style.transform = `${mobile ? '' : 'translateY(-58%) '}translateY(${-40 * cf}px)`;
      const rim = seg(p, .03, .12) * (1 - seg(p, .6, .95));
      after.style.setProperty('--rim', rim.toFixed(3));
      after.style.boxShadow = `0 -30px 90px rgba(190, 215, 255, ${(.24 * rim).toFixed(3)})`;
    }
    if (header) header.toggleAttribute('data-on-dark', p < .9);
    const nowCovered = p >= 1;
    if (nowCovered !== covered) {
      covered = nowCovered;
      if (covered) video.pause(); else play();
    }
  }

  function play() {
    if (reduce || covered) return;
    const q = video.play();
    if (q && q.catch) q.catch(() => {});
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
    if (!ticking) { ticking = true; requestAnimationFrame(() => { ticking = false; onScroll(); }); }
  }, { passive: true });
  window.addEventListener('resize', () => { layout(); onScroll(); }, { passive: true });
  layout();
  onScroll();

  if (reduce) {
    video.removeAttribute('autoplay');
    video.pause();
    night.classList.add('static');
    return;
  }
  fx.classList.add('play');
  night.classList.add('play');
  video.addEventListener('canplay', play);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) play(); });
  play();
  setTimeout(() => { shoot(); schedule(); }, 4500);
})();
