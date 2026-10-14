// About: the straight horizon draws in step with the scroll, and each chapter lights up as the line reaches it.
// Moves only when the reader scrolls; no timers. Reduced motion: everything is shown at once.
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
