(() => {
  const hero = document.querySelector('.hero');
  const portrait = hero?.querySelector('.portrait');
  const cursor = hero?.querySelector('.hero-cursor');
  const label = cursor?.querySelector('.hero-cursor-label');
  if (!hero || !portrait || !cursor || !label) return;

  const canHover = matchMedia('(min-width: 761px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
  const arrowSize = 28;
  const gap = 16;
  const arrowSpring = { stiffness: 380, damping: 32, mass: .6 };
  const labelSpring = { stiffness: 220, damping: 26, mass: .7 };
  const state = {
    pointerX: 0, pointerY: 0,
    arrowX: 0, arrowY: 0,
    labelX: arrowSize + gap, labelY: 18,
    arrowVX: 0, arrowVY: 0,
    labelVX: 0, labelVY: 0,
    active: false, initialized: false,
    lastTime: 0, frame: 0, hideTimer: 0
  };
  let mask;

  function getLabelTargetX() {
    const labelWidth = label.offsetWidth || 270;
    const rightSide = state.pointerX + arrowSize + gap;
    if (rightSide + labelWidth <= hero.clientWidth - 18) return rightSide;
    return Math.max(18, state.pointerX - labelWidth - gap);
  }

  function setPosition() {
    cursor.style.setProperty('--cursor-x', `${state.arrowX}px`);
    cursor.style.setProperty('--cursor-y', `${state.arrowY}px`);
    cursor.style.setProperty('--label-x', `${state.labelX - state.arrowX}px`);
    cursor.style.setProperty('--label-y', `${state.labelY - state.arrowY}px`);
  }

  function spring(position, velocity, target, config, deltaTime) {
    const duration = Math.min(deltaTime, 1 / 30);
    const steps = Math.max(1, Math.ceil(duration / (1 / 120)));
    const step = duration / steps;

    for (let index = 0; index < steps; index++) {
      const force = (target - position) * config.stiffness - velocity * config.damping;
      velocity += force / config.mass * step;
      position += velocity * step;
    }

    return { position, velocity };
  }

  function render(time) {
    state.frame = requestAnimationFrame(render);
    const dt = Math.min((time - (state.lastTime || time)) / 1000, .05);
    state.lastTime = time;
    const labelTargetX = getLabelTargetX();
    const arrowX = spring(state.arrowX, state.arrowVX, state.pointerX, arrowSpring, dt);
    const arrowY = spring(state.arrowY, state.arrowVY, state.pointerY, arrowSpring, dt);
    const labelX = spring(state.labelX, state.labelVX, labelTargetX, labelSpring, dt);
    const labelY = spring(state.labelY, state.labelVY, state.pointerY + 18, labelSpring, dt);
    state.arrowX = arrowX.position;
    state.arrowY = arrowY.position;
    state.labelX = labelX.position;
    state.labelY = labelY.position;
    state.arrowVX = arrowX.velocity;
    state.arrowVY = arrowY.velocity;
    state.labelVX = labelX.velocity;
    state.labelVY = labelY.velocity;
    setPosition();

    const settled = Math.abs(state.pointerX - state.arrowX) < .08 &&
      Math.abs(state.pointerY - state.arrowY) < .08 &&
      Math.abs(labelTargetX - state.labelX) < .08 &&
      Math.abs(state.pointerY + 18 - state.labelY) < .08 &&
      Math.abs(state.arrowVX) < .2 && Math.abs(state.arrowVY) < .2 &&
      Math.abs(state.labelVX) < .2 && Math.abs(state.labelVY) < .2;
    if (settled) stop();
  }

  function start() {
    if (!state.frame) {
      cursor.style.willChange = 'transform, opacity';
      label.style.willChange = 'transform';
      state.frame = requestAnimationFrame(render);
    }
  }

  function stop() {
    cancelAnimationFrame(state.frame);
    state.frame = 0;
    state.lastTime = 0;
    cursor.style.willChange = 'auto';
    label.style.willChange = 'auto';
  }

  function show() {
    clearTimeout(state.hideTimer);
    state.hideTimer = 0;
    state.active = true;
    hero.setAttribute('data-cursor-open', '');
    start();
  }

  function hide(immediate = false) {
    clearTimeout(state.hideTimer);
    state.hideTimer = 0;
    const close = () => {
      state.active = false;
      hero.removeAttribute('data-cursor-open');
    };
    if (immediate) close();
    else state.hideTimer = window.setTimeout(close, 90);
  }

  function nearPortrait(clientX, clientY) {
    if (!mask) return false;
    const bounds = portrait.getBoundingClientRect();
    if (clientX < bounds.left - 10 || clientX > bounds.right + 10 || clientY < bounds.top - 10 || clientY > bounds.bottom + 10) return false;
    const px = (clientX - bounds.left) / bounds.width * mask.width;
    const py = (clientY - bounds.top) / bounds.height * mask.height;
    const radius = Math.max(1, Math.ceil(10 / bounds.width * mask.width));
    for (let row = Math.max(0, Math.floor(py - radius)); row <= Math.min(mask.height - 1, Math.ceil(py + radius)); row++) {
      for (let col = Math.max(0, Math.floor(px - radius)); col <= Math.min(mask.width - 1, Math.ceil(px + radius)); col++) {
        if (Math.hypot(col - px, row - py) <= radius && mask.data[(row * mask.width + col) * 4 + 3] > 40) return true;
      }
    }
    return false;
  }

  function onPointerMove(event) {
    if (!canHover.matches || event.pointerType === 'touch' || !mask) return;
    const bounds = hero.getBoundingClientRect();
    state.pointerX = event.clientX - bounds.left;
    state.pointerY = event.clientY - bounds.top;
    if (!state.initialized) {
      state.arrowX = state.pointerX;
      state.arrowY = state.pointerY;
      state.labelX = getLabelTargetX();
      state.labelY = state.pointerY + 18;
      state.arrowVX = 0;
      state.arrowVY = 0;
      state.labelVX = 0;
      state.labelVY = 0;
      state.initialized = true;
      setPosition();
    }
    if (nearPortrait(event.clientX, event.clientY)) show();
    else if (state.active) hide(true);
  }

  async function prepareMask() {
    try {
      await portrait.decode();
      const canvas = document.createElement('canvas');
      canvas.width = 160;
      canvas.height = Math.round(160 * portrait.naturalHeight / portrait.naturalWidth);
      const context = canvas.getContext('2d', { willReadFrequently: true });
      context.drawImage(portrait, 0, 0, canvas.width, canvas.height);
      mask = context.getImageData(0, 0, canvas.width, canvas.height);
    } catch {
      mask = null;
    }
  }

  hero.addEventListener('pointermove', onPointerMove, { passive: true });
  hero.addEventListener('pointerleave', () => hide(true));
  hero.addEventListener('pointercancel', () => hide(true));
  window.addEventListener('scroll', () => hide(true), { passive: true });
  window.addEventListener('blur', () => hide(true));
  canHover.addEventListener('change', () => {
    state.initialized = false;
    hide(true);
    stop();
  });
  prepareMask();
})();
