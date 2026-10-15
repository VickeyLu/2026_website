// Kind words: sets of three quotes. Advances on its own every 10s while the section is on screen,
// hover, focus or touch pauses it. Arrow keys work when the section is focused.
// Reduced motion: both sets are shown without automatic changes.
(() => {
  const section = document.querySelector('.testimonials');
  if (!section) return;

  const sets = [...section.querySelectorAll('[data-quote-set]')];
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduce) {
    sets.forEach(set => {
      set.classList.add('is-current');
      set.removeAttribute('aria-hidden');
    });
    return;
  }
  if (sets.length < 2) return;

  let index = 0;

  function show(next) {
    index = (next + sets.length) % sets.length;
    sets.forEach((set, i) => {
      const on = i === index;
      set.classList.toggle('is-current', on);
      set.toggleAttribute('aria-hidden', !on);
    });
    elapsed = 0;
  }

  // ---------- auto-advance ----------
  const DWELL = 10;   // seconds per set: enough to read three quotes
  let elapsed = 0, last = 0, raf = 0, visible = false, held = false;
  const tick = now => {
    if (last) elapsed += Math.min(.1, (now - last) / 1000);
    last = now;
    if (elapsed >= DWELL) show(index + 1);
    raf = requestAnimationFrame(tick);
  };
  const run = () => { if (!reduce && visible && !held && !document.hidden && !raf) { last = 0; raf = requestAnimationFrame(tick); } };
  const stop = () => { cancelAnimationFrame(raf); raf = 0; };
  const hold = on => { held = on; on ? stop() : run(); };

  {
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible ? run() : stop(); }, { threshold: .5 }).observe(section);
    section.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') hold(true); });
    section.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') hold(false); });
    section.addEventListener('focusin', () => hold(true));
    section.addEventListener('focusout', e => { if (!section.contains(e.relatedTarget)) hold(false); });
    // a touch on the quotes pauses for a while, so a phone reader can finish
    let touchTimer = 0;
    section.addEventListener('touchstart', () => { hold(true); clearTimeout(touchTimer); touchTimer = setTimeout(() => hold(false), 8000); }, { passive: true });
    document.addEventListener('visibilitychange', () => { document.hidden ? stop() : run(); });
  }

  section.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); show(index - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); show(index + 1); }
  });
})();
