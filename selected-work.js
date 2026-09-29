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
    item.dataset.project = project.id;
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

(() => {
  const links = [...document.querySelectorAll('.work-visual-link:has(.work-hover-cursor)')];
  if (!links.length) return;

  const canHover = matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
  const arrowSize = 28;
  const gap = 14;

  links.forEach(link => {
    const visual = link.querySelector('.work-visual');
    const cursor = link.querySelector('.work-hover-cursor');
    const label = link.querySelector('.work-hover-label');
    if (!visual || !cursor || !label) return;

    const state = {
      targetX: 0,
      targetY: 0,
      x: 0,
      y: 0,
      labelX: arrowSize + gap,
      labelY: 16,
      frame: 0,
      initialized: false
    };

    function getLabelTargetX() {
      const width = label.offsetWidth || 142;
      const right = state.targetX + arrowSize + gap;
      return right + width <= visual.clientWidth - 14
        ? right
        : Math.max(14, state.targetX - width - gap);
    }

    function paint() {
      cursor.style.setProperty('--cursor-x', `${state.x}px`);
      cursor.style.setProperty('--cursor-y', `${state.y}px`);
      cursor.style.setProperty('--label-x', `${state.labelX - state.x}px`);
      cursor.style.setProperty('--label-y', `${state.labelY - state.y}px`);
    }

    function render() {
      const labelTargetX = getLabelTargetX();
      const labelTargetY = Math.min(state.targetY + 16, visual.clientHeight - label.offsetHeight - 14);
      state.x += (state.targetX - state.x) * .34;
      state.y += (state.targetY - state.y) * .34;
      state.labelX += (labelTargetX - state.labelX) * .2;
      state.labelY += (labelTargetY - state.labelY) * .2;
      paint();

      const moving = Math.abs(state.targetX - state.x) > .08 ||
        Math.abs(state.targetY - state.y) > .08 ||
        Math.abs(labelTargetX - state.labelX) > .08 ||
        Math.abs(labelTargetY - state.labelY) > .08;
      state.frame = moving ? requestAnimationFrame(render) : 0;
    }

    function start() {
      if (!state.frame) state.frame = requestAnimationFrame(render);
    }

    function position(event) {
      const bounds = visual.getBoundingClientRect();
      state.targetX = Math.min(Math.max(0, event.clientX - bounds.left), bounds.width - arrowSize);
      state.targetY = Math.min(Math.max(0, event.clientY - bounds.top), bounds.height - arrowSize);
      if (!state.initialized) {
        state.x = state.targetX;
        state.y = state.targetY;
        state.labelX = getLabelTargetX();
        state.labelY = Math.min(state.targetY + 16, visual.clientHeight - label.offsetHeight - 14);
        state.initialized = true;
        paint();
      }
      start();
    }

    link.addEventListener('pointerenter', event => {
      if (!canHover.matches || event.pointerType === 'touch') return;
      position(event);
      link.setAttribute('data-cursor-open', '');
    });
    link.addEventListener('pointermove', event => {
      if (!canHover.matches || event.pointerType === 'touch') return;
      position(event);
    }, { passive: true });
    link.addEventListener('pointerleave', () => link.removeAttribute('data-cursor-open'));
    link.addEventListener('pointercancel', () => link.removeAttribute('data-cursor-open'));
    canHover.addEventListener('change', () => {
      link.removeAttribute('data-cursor-open');
      state.initialized = false;
      cancelAnimationFrame(state.frame);
      state.frame = 0;
    });
  });
})();
