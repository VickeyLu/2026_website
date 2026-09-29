(() => {
  const section = document.querySelector('.selected-work');
  if (!section) return;

  const index = section.querySelector('.work-index');
  const projects = [...section.querySelectorAll('.work-project')];
  const desktop = matchMedia('(min-width: 900px) and (min-height: 620px)');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const videoVisibility = new Map();
  const list = document.createElement('ol');
  list.className = 'work-index-list';

  const entries = projects.map((project, position) => {
    const item = document.createElement('li');
    item.className = 'work-index-item';
    const heading = document.createElement('h3');
    heading.className = 'work-index-heading';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'work-index-trigger';
    const number = document.createElement('span');
    number.className = 'work-number';
    number.textContent = project.querySelector('.work-number').textContent;
    button.append(number);
    const title = document.createElement('span');
    title.className = 'work-title';
    title.textContent = project.querySelector('.work-title').textContent;
    button.append(title);
    heading.append(button);

    const details = document.createElement('div');
    details.id = `work-index-details-${position + 1}`;
    details.className = 'work-index-details';
    const inner = document.createElement('div');
    inner.append(project.querySelector('.work-project-details').cloneNode(true));
    details.append(inner);
    button.setAttribute('aria-controls', details.id);
    button.setAttribute('aria-expanded', 'false');
    details.setAttribute('aria-hidden', 'true');
    item.append(heading, details);
    list.append(item);

    button.addEventListener('click', event => {
      const keyboard = event.detail === 0;
      section.toggleAttribute('data-keyboard', keyboard);
      project.scrollIntoView({ block: 'start', behavior: reducedMotion.matches || keyboard ? 'instant' : 'smooth' });
    });
    return { item, button, details };
  });

  index.append(list);
  section.setAttribute('data-enhanced', '');
  let current = -1;
  let scheduled = false;

  function syncVideos() {
    projects.forEach((project, position) => {
      const video = project.querySelector('[data-project-video]');
      if (!video) return;
      const isVisible = videoVisibility.get(video) === true;
      const isOpen = !desktop.matches || position === current;
      const shouldPlay = !document.hidden && !reducedMotion.matches && isVisible && isOpen;
      if (shouldPlay && video.paused) video.play().catch(() => {});
      else if (!shouldPlay && !video.paused) video.pause();
    });
  }

  function update() {
    scheduled = false;
    if (!desktop.matches) return;
    // Activate the image at the reading line, halfway between adjacent images.
    const readingLine = window.innerHeight * .42;
    let nearest = 0;
    let distance = Infinity;
    projects.forEach((project, position) => {
      const rect = project.getBoundingClientRect();
      const nextDistance = Math.abs(rect.top + rect.height / 2 - readingLine);
      if (nextDistance < distance) {
        distance = nextDistance;
        nearest = position;
      }
    });
    if (nearest === current) return;
    current = nearest;
    entries.forEach(({ item, button, details }, position) => {
      const active = position === current;
      item.classList.toggle('is-current', active);
      button.setAttribute('aria-expanded', String(active));
      details.setAttribute('aria-hidden', String(!active));
    });
    syncVideos();
  }

  function schedule() {
    if (scheduled || !desktop.matches) return;
    scheduled = true;
    requestAnimationFrame(update);
  }

  function syncLayout() {
    index.hidden = !desktop.matches;
    if (desktop.matches) update();
    syncVideos();
  }

  const videoObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      videoVisibility.set(entry.target, entry.isIntersecting && entry.intersectionRatio >= .25);
    });
    syncVideos();
  }, { threshold: [0, .25, .5], rootMargin: '0px 0px -8% 0px' });

  projects.forEach(project => {
    const video = project.querySelector('[data-project-video]');
    if (video) videoObserver.observe(video);
  });

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  window.addEventListener('pageshow', schedule);
  desktop.addEventListener('change', syncLayout);
  reducedMotion.addEventListener('change', syncVideos);
  document.addEventListener('visibilitychange', syncVideos);
  section.addEventListener('pointerdown', () => section.removeAttribute('data-keyboard'), { passive: true });
  window.addEventListener('wheel', () => section.removeAttribute('data-keyboard'), { passive: true });
  new ResizeObserver(schedule).observe(section.querySelector('.work-projects'));
  syncLayout();
})();
