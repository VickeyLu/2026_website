(() => {
  const header = document.querySelector('[data-nav]');
  const hero = document.querySelector('.hero');
  if (!header || !hero) return;

  let ticking = false;
  const update = () => {
    ticking = false;
    const threshold = Math.max(180, hero.offsetHeight * 0.58);
    header.toggleAttribute('data-scrolled', window.scrollY > threshold);
  };

  window.addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(update);
    }
  }, { passive: true });

  window.addEventListener('resize', update, { passive: true });
  update();
})();
