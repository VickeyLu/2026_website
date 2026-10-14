// About: the straight horizon draws in step with the scroll, and each chapter lights up as the line reaches it.
// Moves only when the reader scrolls; no timers. Reduced motion: everything is shown at once.
(() => {
  // About heading: a loop that builds the three lines one at a time, holds, then rolls them away and starts again.
  // Runs only while the heading is on screen; hover pauses it; reduced motion shows the three lines still.
  const roll = document.querySelector('[data-roll]');
  if (roll && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const lines = [...roll.querySelectorAll('.roll > span')];
    const IN = .6, GAP = 1.1, HOLD = 2.6, OUT = .55, REST = .35;            // seconds
    const CYCLE = lines.length * GAP + HOLD + OUT + REST;
    const ease = x => 1 - Math.pow(1 - x, 3);
    const easeIn = x => x * x * x;
    const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
    const outAt = (lines.length - 1) * GAP + IN + HOLD;
    function frame(t) {
      lines.forEach((el, i) => {
        const inP = ease(clamp((t - i * GAP) / IN, 0, 1));
        const outP = easeIn(clamp((t - outAt - i * .06) / OUT, 0, 1));
        const y = (1 - inP) * 105 - outP * 105;                             // in from below, out through the top
        const rx = (1 - inP) * -55 + outP * 55;                             // a slight drum turn
        el.style.transform = (y === 0 && rx === 0) ? 'none' : `translateY(${y.toFixed(2)}%) rotateX(${rx.toFixed(1)}deg)`;
        el.style.opacity = (inP * (1 - outP)).toFixed(3);
      });
    }
    let t = 0, last = 0, raf = 0, visible = false, paused = false;
    const tick = now => {
      if (last) t = (t + Math.min(.1, (now - last) / 1000)) % CYCLE;
      last = now; frame(t);
      raf = requestAnimationFrame(tick);
    };
    const run = () => { if (visible && !paused && !raf) { last = 0; raf = requestAnimationFrame(tick); } };
    const stop = () => { cancelAnimationFrame(raf); raf = 0; };
    frame(0);
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible ? run() : stop(); }, { threshold: .4 }).observe(roll);
    roll.addEventListener('pointerenter', () => { paused = true; stop(); });
    roll.addEventListener('pointerleave', () => { paused = false; run(); });
    document.addEventListener('visibilitychange', () => { document.hidden ? stop() : run(); });
  }
})();

(() => {
  const root = document.querySelector('[data-chapters]');
  if (!root) return;
  const line = root.querySelector('[data-chapters-line]');
  const items = [...root.querySelectorAll('[data-chapter]')];
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const light = p => items.forEach((li, i) => li.classList.toggle('is-lit', p >= (i + .15) / items.length));
  if (reduce) { line.style.setProperty('--p', 1); light(1); return; }

  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  function update() {
    const r = root.getBoundingClientRect(), vh = innerHeight;
    // starts when the chapters enter the lower part of the screen, done by the time they reach the middle
    const p = clamp((vh * .85 - r.top) / (vh * .45), 0, 1);
    line.style.setProperty('--p', p.toFixed(3));
    light(p);
  }
  let ticking = false;
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { ticking = false; update(); }); } }, { passive: true });
  addEventListener('resize', update, { passive: true });
  update();
})();
