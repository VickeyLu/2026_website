// Kind words: one quote at a time. Changes only on click or arrow keys, never on a timer.
(() => {
  const section = document.querySelector('.testimonials');
  if (!section) return;

  const quotes = [...section.querySelectorAll('[data-quote]')];
  const controls = section.querySelector('[data-quote-controls]');
  const current = section.querySelector('[data-quote-current]');
  const total = section.querySelector('[data-quote-total]');
  const facet = section.querySelector('[data-quote-facet]');
  const pad = n => String(n).padStart(2, '0');

  if (quotes.length < 2) {
    if (controls) controls.hidden = true;
    return;
  }

  let index = 0;
  total.textContent = pad(quotes.length);

  function show(next) {
    index = (next + quotes.length) % quotes.length;
    quotes.forEach((q, i) => {
      const on = i === index;
      q.classList.toggle('is-current', on);
      q.toggleAttribute('aria-hidden', !on);
    });
    current.textContent = pad(index + 1);
    if (facet && quotes[index].dataset.facet) facet.textContent = '· ' + quotes[index].dataset.facet;
  }

  section.querySelector('[data-quote-prev]').addEventListener('click', () => show(index - 1));
  section.querySelector('[data-quote-next]').addEventListener('click', () => show(index + 1));
  controls.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); show(index - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); show(index + 1); }
  });
})();
