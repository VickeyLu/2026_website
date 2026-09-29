(() => {
  const stage = document.querySelector('[data-testimonial-stage]');
  if (!stage) return;

  const viewport = stage.querySelector('[data-testimonial-viewport]');
  const track = stage.querySelector('[data-testimonial-track]');
  const sourceCards = [...track.querySelectorAll('[data-testimonial-card]')];
  const currentLabel = stage.querySelector('[data-testimonial-current]');
  const totalLabel = stage.querySelector('[data-testimonial-total]');
  const controls = stage.querySelector('[data-testimonial-controls]');
  const previous = stage.querySelector('[data-testimonial-prev]');
  const next = stage.querySelector('[data-testimonial-next]');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  const AUTOPLAY_DELAY = 3800;
  const pad = value => String(value).padStart(2, '0');
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  if (sourceCards.length > 1) {
    const before = sourceCards.at(-1).cloneNode(true);
    const after = sourceCards[0].cloneNode(true);
    [before, after].forEach(card => {
      card.dataset.testimonialClone = '';
      card.setAttribute('aria-hidden', 'true');
      card.removeAttribute('aria-current');
    });
    track.prepend(before);
    track.append(after);
  }

  const cards = [...track.querySelectorAll('[data-testimonial-card]')];
  const swings = cards.map(card => card.querySelector('[data-testimonial-swing]'));
  const states = cards.map(() => ({
    angle: 0,
    velocity: 0,
    target: 0,
    scale: 1,
    scaleVelocity: 0
  }));

  let active = 0;
  let activeSlot = sourceCards.length > 1 ? 1 : 0;
  let trackX = 0;
  let trackTarget = 0;
  let trackVelocity = 0;
  let frameId = 0;
  let autoTimer = 0;
  let lastTime = 0;
  let hasPlayed = false;
  let initialized = false;
  let isInView = false;
  let isPointerInside = false;
  let isFocusInside = false;

  totalLabel.textContent = pad(sourceCards.length);
  controls.hidden = sourceCards.length < 2;

  function setMotionHint(enabled) {
    track.style.willChange = enabled ? 'transform' : 'auto';
    swings.forEach(element => {
      element.style.willChange = enabled ? 'transform' : 'auto';
    });
  }

  function updateCurrentState() {
    sourceCards.forEach((card, position) => {
      const isCurrent = position === active;
      card.classList.toggle('is-current', isCurrent);
      card.setAttribute('aria-current', String(isCurrent));
    });

    cards.forEach((card, position) => {
      card.classList.toggle('is-current', position === activeSlot);
    });

    currentLabel.textContent = pad(active + 1);
  }

  function measure({ snap = false } = {}) {
    const card = cards[activeSlot];
    trackTarget = viewport.clientWidth / 2 - (card.offsetLeft + card.offsetWidth / 2);
    if (snap || reducedMotion.matches || !initialized) {
      trackX = trackTarget;
      trackVelocity = 0;
      track.style.setProperty('--testimonial-track-x', `${trackX}px`);
      initialized = true;
    } else {
      start();
    }
  }

  function snapLoopClone() {
    if (sourceCards.length < 2) return false;

    if (activeSlot === 0) activeSlot = sourceCards.length;
    else if (activeSlot === sourceCards.length + 1) activeSlot = 1;
    else return false;

    updateCurrentState();
    const card = cards[activeSlot];
    trackTarget = viewport.clientWidth / 2 - (card.offsetLeft + card.offsetWidth / 2);
    trackX = trackTarget;
    trackVelocity = 0;
    states.forEach((state, index) => {
      state.scale = index === activeSlot ? 1 : .84;
      state.scaleVelocity = 0;
    });
    return true;
  }

  function settleImmediately() {
    cancelAnimationFrame(frameId);
    frameId = 0;
    lastTime = 0;
    snapLoopClone();
    trackX = trackTarget;
    trackVelocity = 0;
    track.style.setProperty('--testimonial-track-x', `${trackX}px`);
    states.forEach((state, index) => {
      state.angle = 0;
      state.velocity = 0;
      state.target = 0;
      state.scale = index === activeSlot ? 1 : .84;
      state.scaleVelocity = 0;
      swings[index].style.transform = `rotate(0deg) scale(${state.scale})`;
    });
    setMotionHint(false);
  }

  function render() {
    track.style.setProperty('--testimonial-track-x', `${trackX.toFixed(3)}px`);
    states.forEach((state, index) => {
      const velocityLean = clamp(trackVelocity * -.018, -9, 9);
      const lean = index === activeSlot ? velocityLean : velocityLean * .62;
      swings[index].style.transform = `rotate(${(state.angle + lean).toFixed(3)}deg) scale(${state.scale.toFixed(4)})`;
    });
  }

  function tick(now) {
    const dt = Math.min((now - (lastTime || now)) / 1000, 1 / 30);
    lastTime = now;

    trackVelocity += (trackTarget - trackX) * 82 * dt;
    trackVelocity *= Math.pow(.82, dt * 60);
    trackX += trackVelocity * dt;

    let unsettled = Math.abs(trackTarget - trackX) > .08 || Math.abs(trackVelocity) > .08;

    states.forEach((state, index) => {
      state.velocity += (-92 * (state.angle - state.target) - 13.5 * state.velocity) * dt;
      state.angle += state.velocity * dt;

      const scaleTarget = index === activeSlot ? 1 : .84;
      state.scaleVelocity += (-135 * (state.scale - scaleTarget) - 20 * state.scaleVelocity) * dt;
      state.scale += state.scaleVelocity * dt;

      if (
        Math.abs(state.angle - state.target) > .015 ||
        Math.abs(state.velocity) > .02 ||
        Math.abs(state.scale - scaleTarget) > .0005 ||
        Math.abs(state.scaleVelocity) > .001
      ) {
        unsettled = true;
      }
    });

    render();

    if (unsettled) {
      frameId = requestAnimationFrame(tick);
      return;
    }

    frameId = 0;
    lastTime = 0;
    trackX = trackTarget;
    trackVelocity = 0;
    states.forEach((state, index) => {
      state.angle = state.target;
      state.velocity = 0;
      state.scale = index === activeSlot ? 1 : .84;
      state.scaleVelocity = 0;
    });
    snapLoopClone();
    render();
    setMotionHint(false);
  }

  function start() {
    if (reducedMotion.matches) {
      settleImmediately();
      return;
    }
    setMotionHint(true);
    if (!frameId) frameId = requestAnimationFrame(tick);
  }

  function kick(direction = 1) {
    if (reducedMotion.matches) return;
    const state = states[activeSlot];
    state.angle = direction * -7.5;
    state.velocity = direction * 34;
    state.scale = .965;
    state.scaleVelocity = 0;
    start();
  }

  function clearAutoplay() {
    clearTimeout(autoTimer);
    autoTimer = 0;
  }

  function shouldAutoplay() {
    return sourceCards.length > 1 &&
      isInView &&
      !isPointerInside &&
      !isFocusInside &&
      !document.hidden &&
      !reducedMotion.matches;
  }

  function scheduleAutoplay() {
    clearAutoplay();
    if (!shouldAutoplay()) return;
    autoTimer = window.setTimeout(() => {
      select(active + 1, 1, { automatic: true });
    }, AUTOPLAY_DELAY);
  }

  function select(index, direction = 1, { automatic = false } = {}) {
    if (sourceCards.length < 2) return;

    const nextIndex = (index + sourceCards.length) % sourceCards.length;
    const wrapsForward = direction > 0 && active === sourceCards.length - 1 && nextIndex === 0;
    const wrapsBackward = direction < 0 && active === 0 && nextIndex === sourceCards.length - 1;

    active = nextIndex;
    if (wrapsForward) activeSlot = sourceCards.length + 1;
    else if (wrapsBackward) activeSlot = 0;
    else activeSlot = active + 1;

    updateCurrentState();
    measure();
    kick(direction);
    if (!automatic) clearAutoplay();
    scheduleAutoplay();
  }

  previous.addEventListener('click', () => select(active - 1, -1));
  next.addEventListener('click', () => select(active + 1, 1));

  cards.forEach((card, index) => {
    card.addEventListener('pointermove', event => {
      if (reducedMotion.matches || event.pointerType === 'touch') return;
      const rect = card.getBoundingClientRect();
      states[index].target = clamp(((event.clientX - rect.left) / rect.width - .5) * 5, -2.5, 2.5);
      start();
    }, { passive: true });

    card.addEventListener('pointerleave', () => {
      states[index].target = 0;
      start();
    }, { passive: true });
  });

  stage.addEventListener('pointerenter', () => {
    isPointerInside = true;
    clearAutoplay();
  }, { passive: true });

  stage.addEventListener('pointerleave', () => {
    isPointerInside = false;
    scheduleAutoplay();
  }, { passive: true });

  stage.addEventListener('focusin', () => {
    isFocusInside = true;
    clearAutoplay();
  });

  stage.addEventListener('focusout', event => {
    if (stage.contains(event.relatedTarget)) return;
    isFocusInside = false;
    scheduleAutoplay();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) clearAutoplay();
    else scheduleAutoplay();
  });

  const observer = new IntersectionObserver(entries => {
    const entry = entries[0];
    isInView = Boolean(entry?.isIntersecting);

    if (isInView && !hasPlayed) {
      hasPlayed = true;
      kick(1);
    }

    if (isInView) scheduleAutoplay();
    else clearAutoplay();
  }, { threshold: .28 });

  new ResizeObserver(() => measure({ snap: true })).observe(viewport);
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) {
      clearAutoplay();
      settleImmediately();
    } else {
      kick(1);
      scheduleAutoplay();
    }
  });

  stage.setAttribute('data-enhanced', '');
  updateCurrentState();
  measure({ snap: true });
  settleImmediately();
  observer.observe(stage);

  window.__testimonial = {
    replay: () => kick(1),
    next: () => select(active + 1, 1),
    previous: () => select(active - 1, -1),
    state: () => ({
      active,
      activeSlot,
      count: sourceCards.length,
      autoplay: Boolean(autoTimer),
      trackError: Math.abs(trackTarget - trackX),
      angle: states[activeSlot].angle,
      moving: Boolean(frameId)
    })
  };
})();
