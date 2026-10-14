// About: the straight horizon draws in step with the scroll, and each chapter lights up as the line reaches it.
// Moves only when the reader scrolls; no timers. Reduced motion: everything is shown at once.
(() => {
  // About heading: the three lines roll up one at a time, in step with the scroll (reversible, no timers)
  const roll = document.querySelector('[data-roll]');
  if (roll && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const lines = [...roll.querySelectorAll('.roll > span')];
    const ease = x => 1 - Math.pow(1 - x, 3);
    const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
    const update = () => {
      const r = roll.getBoundingClientRect(), vh = innerHeight;
      // the first line starts when the heading's top reaches 92% of the screen; the last is in place by 55%
      const p = clamp((vh * .92 - r.top) / (vh * .37), 0, 1) * lines.length;
      lines.forEach((el, i) => {
        const e = ease(clamp(p - i, 0, 1));
        el.style.transform = e >= 1 ? 'none' : `translateY(${(1 - e) * 105}%) rotateX(${(1 - e) * -55}deg)`;
        el.style.opacity = (.15 + .85 * e).toFixed(3);
      });
    };
    let tick = false;
    addEventListener('scroll', () => { if (!tick) { tick = true; requestAnimationFrame(() => { tick = false; update(); }); } }, { passive: true });
    addEventListener('resize', update, { passive: true });
    update();
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
