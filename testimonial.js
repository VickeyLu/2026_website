// Kind words: sets of three quotes. Changes only on click or arrow keys, never on a timer.
(() => {
  const section = document.querySelector('.testimonials');
  if (!section) return;

  const sets = [...section.querySelectorAll('[data-quote-set]')];
  const controls = section.querySelector('[data-quote-controls]');
  const current = section.querySelector('[data-quote-current]');
  const total = section.querySelector('[data-quote-total]');
  const pad = n => String(n).padStart(2, '0');

  if (sets.length < 2) {
    if (controls) controls.hidden = true;
    return;
  }

  let index = 0;
  total.textContent = pad(sets.length);

  function show(next) {
    index = (next + sets.length) % sets.length;
    sets.forEach((set, i) => {
      const on = i === index;
      set.classList.toggle('is-current', on);
      set.toggleAttribute('aria-hidden', !on);
    });
    current.textContent = pad(index + 1);
  }

  section.querySelector('[data-quote-prev]').addEventListener('click', () => show(index - 1));
  section.querySelector('[data-quote-next]').addEventListener('click', () => show(index + 1));
  controls.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); show(index - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); show(index + 1); }
  });
})();
