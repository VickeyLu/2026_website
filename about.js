// About: the straight horizon draws in step with the scroll, and each chapter lights up as the line reaches it.
// Moves only when the reader scrolls; no timers. Reduced motion: everything is shown at once.
(() => {
  // About heading: one slot, one line at a time. Each line rolls up into place, holds, and rolls out the top
  // while the next one rolls in from below — like a wheel turning. Loops while on screen; hover pauses it.
  const roll = document.querySelector('[data-roll]');
  if (roll && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    roll.classList.add('is-rolling');
    const lines = [...roll.querySelectorAll('.roll > span')];
    const P = 2.4, T = .55, N = lines.length, CYCLE = N * P;           // seconds per line, roll time
    const ease = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
    function frame(t) {
      lines.forEach((el, i) => {
        const u = ((t - i * P) % CYCLE + CYCLE) % CYCLE;                  // this line's own clock
        let y = 100, o = 0;
        if (u < T) { const e = ease(u / T); y = 100 * (1 - e); o = e; }    // rolling in from below
        else if (u < P) { y = 0; o = 1; }                                   // holding
        else if (u < P + T) { const e = ease((u - P) / T); y = -100 * e; o = 1 - e; } // rolling out the top
        el.style.transform = y === 0 ? 'none' : `translateY(${y.toFixed(2)}%) rotateX(${(-y * .5).toFixed(1)}deg)`;
        el.style.opacity = o.toFixed(3);
      });
    }
    let t = T, last = 0, raf = 0, visible = false, paused = false;    // start with the first line already in place
    const tick = now => {
      if (last) t = (t + Math.min(.1, (now - last) / 1000)) % CYCLE;
      last = now; frame(t);
      raf = requestAnimationFrame(tick);
    };
    const run = () => { if (visible && !paused && !raf) { last = 0; raf = requestAnimationFrame(tick); } };
    const stop = () => { cancelAnimationFrame(raf); raf = 0; };
    frame(t);
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
