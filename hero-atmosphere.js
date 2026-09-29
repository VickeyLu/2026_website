(() => {
  const hero = document.querySelector('.hero');
  const field = hero?.querySelector('.hero-atmosphere');
  if (!hero || !field) return;

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(min-width: 761px) and (hover: hover) and (pointer: fine)');
  const styles = getComputedStyle(field);
  const number = (name, fallback) => parseFloat(styles.getPropertyValue(name)) || fallback;
  const settings = {
    ambient: number('--cloud-ambient-distance', 112),
    drift: number('--cloud-drift-speed', .052),
    radius: number('--cloud-cursor-radius', 570),
    stir: number('--cloud-stir-distance', 78),
    follow: number('--cloud-follow-speed', 7),
    wake: number('--cloud-wake-speed', 3.1),
    release: number('--cloud-return-speed', 1.65)
  };

  const vertexSource = `
    attribute vec2 aPosition;
    varying vec2 vUv;
    void main() {
      vUv = aPosition * .5 + .5;
      gl_Position = vec4(aPosition, 0., 1.);
    }
  `;
  const fragmentSource = `
    precision highp float;
    varying vec2 vUv;
    uniform sampler2D uImage;
    uniform vec2 uView;
    uniform vec2 uCover;
    uniform vec2 uPointer;
    uniform vec2 uWake;
    uniform vec2 uDirection;
    uniform float uTime;
    uniform float uAmbient;
    uniform float uDrift;
    uniform float uRadius;
    uniform float uStir;
    uniform float uActivity;

    void main() {
      vec2 point = vUv * uView;
      float travel = uTime * uDrift;
      vec2 drift = vec2(-sin(travel), .27 * sin(travel * .71)) * uAmbient;
      drift += vec2(
        .20 * (sin(point.y * .0038 + travel * 1.1) - sin(point.y * .0038)),
        .13 * (cos(point.x * .0032 + travel * .82) - cos(point.x * .0032))
      ) * uAmbient;
      float edge = smoothstep(0., 135., min(point.x, uView.x - point.x))
        * smoothstep(0., 90., min(point.y, uView.y - point.y));
      drift *= edge;

      vec2 offset = point - uPointer;
      vec2 wakeOffset = point - uWake;
      vec2 shape = vec2(uRadius * 1.12, uRadius * .82);
      float front = exp(-1.45 * dot(offset / shape, offset / shape));
      float wake = exp(-1.1 * dot(wakeOffset / (shape * 1.18), wakeOffset / (shape * 1.18)));
      float fold = sin(point.y * .008 + point.x * .003 + uTime * .26);
      vec2 crossFlow = vec2(-uDirection.y, uDirection.x);
      vec2 stir = (uDirection * wake * (.64 + .16 * fold)
        + crossFlow * front * fold * .28) * uStir * uActivity;

      vec2 sampleUv = .5 + (vUv - .5 + (drift + stir) / uView) * uCover;
      vec3 color = texture2D(uImage, clamp(sampleUv, 0., 1.)).rgb;
      gl_FragColor = vec4(color, 1.);
    }
  `;

  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.hidden = true;
  field.append(canvas);

  const image = new Image();
  image.src = 'assets/hero-default-preview-v2.png';
  const state = {
    visible: false, ready: false, pointerInside: false,
    width: 0, height: 0, activity: 0,
    x: 0, y: 0, wakeX: 0, wakeY: 0, targetX: 0, targetY: 0,
    directionX: 0, directionY: 0,
    lastPointerX: 0, lastPointerY: 0, lastPointerTime: 0,
    frame: 0, lastFrame: 0, elapsed: 0
  };
  let gl;
  let uniforms;

  const follow = (current, target, speed, dt) =>
    current + (target - current) * (1 - Math.exp(-speed * dt));

  function shader(type, source) {
    const item = gl.createShader(type);
    gl.shaderSource(item, source);
    gl.compileShader(item);
    if (!gl.getShaderParameter(item, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(item));
    return item;
  }

  function prepareGL() {
    gl = canvas.getContext('webgl', {
      alpha: false, antialias: false, depth: false, stencil: false,
      powerPreference: 'low-power'
    });
    if (!gl) return false;

    const program = gl.createProgram();
    const vertex = shader(gl.VERTEX_SHADER, vertexSource);
    const fragment = shader(gl.FRAGMENT_SHADER, fragmentSource);
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
    gl.useProgram(program);

    const positions = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positions);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const attribute = gl.getAttribLocation(program, 'aPosition');
    gl.enableVertexAttribArray(attribute);
    gl.vertexAttribPointer(attribute, 2, gl.FLOAT, false, 0, 0);

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

    const names = ['uImage', 'uView', 'uCover', 'uPointer', 'uWake', 'uDirection',
      'uTime', 'uAmbient', 'uDrift', 'uRadius', 'uStir', 'uActivity'];
    uniforms = Object.fromEntries(names.map(name => [name, gl.getUniformLocation(program, name)]));
    gl.uniform1i(uniforms.uImage, 0);
    gl.uniform1f(uniforms.uAmbient, settings.ambient);
    gl.uniform1f(uniforms.uDrift, settings.drift);
    gl.uniform1f(uniforms.uRadius, settings.radius);
    gl.uniform1f(uniforms.uStir, settings.stir);
    return true;
  }

  function resize() {
    const width = hero.clientWidth;
    const height = hero.clientHeight;
    if (!width || !height || !state.ready) return;
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    state.width = width;
    state.height = height;
    gl.viewport(0, 0, canvas.width, canvas.height);
    const cover = Math.max(width / image.naturalWidth, height / image.naturalHeight);
    gl.uniform2f(uniforms.uView, width, height);
    gl.uniform2f(uniforms.uCover,
      width / (image.naturalWidth * cover), height / (image.naturalHeight * cover));
  }

  function paint(now) {
    state.frame = 0;
    if (!state.ready || !state.visible || document.hidden || reducedMotion.matches || !finePointer.matches) return;
    const dt = Math.min((now - (state.lastFrame || now)) / 1000, .05);
    state.lastFrame = now;
    state.elapsed += dt;
    state.x = follow(state.x, state.targetX, settings.follow, dt);
    state.y = follow(state.y, state.targetY, settings.follow, dt);
    state.wakeX = follow(state.wakeX, state.targetX, settings.wake, dt);
    state.wakeY = follow(state.wakeY, state.targetY, settings.wake, dt);
    state.activity *= Math.exp(-settings.release * dt);

    gl.uniform2f(uniforms.uPointer, state.x, state.height - state.y);
    gl.uniform2f(uniforms.uWake, state.wakeX, state.height - state.wakeY);
    gl.uniform2f(uniforms.uDirection, state.directionX, -state.directionY);
    gl.uniform1f(uniforms.uActivity, state.activity);
    gl.uniform1f(uniforms.uTime, state.elapsed);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    state.frame = requestAnimationFrame(paint);
  }

  function sync() {
    const active = state.ready && state.visible && !document.hidden &&
      !reducedMotion.matches && finePointer.matches;
    if (active && !state.frame) {
      state.lastFrame = 0;
      paint(performance.now());
      canvas.hidden = false;
    } else if (!active && state.frame) {
      cancelAnimationFrame(state.frame);
      state.frame = 0;
      state.lastFrame = 0;
      state.activity = 0;
    }
    if (!active) canvas.hidden = true;
  }

  function move(event) {
    if (!state.ready || !finePointer.matches || reducedMotion.matches || event.pointerType === 'touch') return;
    const rect = hero.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, event.clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, event.clientY - rect.top));
    if (!state.pointerInside) {
      state.pointerInside = true;
      state.x = state.wakeX = state.targetX = x;
      state.y = state.wakeY = state.targetY = y;
      state.lastPointerX = x;
      state.lastPointerY = y;
      state.lastPointerTime = event.timeStamp;
      return;
    }
    const dx = x - state.lastPointerX;
    const dy = y - state.lastPointerY;
    const distance = Math.hypot(dx, dy);
    const seconds = Math.max((event.timeStamp - state.lastPointerTime) / 1000, .008);
    if (hero.hasAttribute('data-cursor-open')) {
      state.activity = 0;
    } else if (distance > 1) {
      state.directionX = dx / distance;
      state.directionY = dy / distance;
      state.activity = Math.max(state.activity, Math.min(1, distance / seconds / 550));
    }
    state.targetX = x;
    state.targetY = y;
    state.lastPointerX = x;
    state.lastPointerY = y;
    state.lastPointerTime = event.timeStamp;
  }

  hero.addEventListener('pointermove', move, { passive: true });
  hero.addEventListener('pointerleave', () => { state.pointerInside = false; });
  hero.addEventListener('pointercancel', () => { state.pointerInside = false; });
  document.addEventListener('visibilitychange', sync);
  reducedMotion.addEventListener('change', sync);
  finePointer.addEventListener('change', sync);
  new ResizeObserver(resize).observe(hero);
  new IntersectionObserver(entries => {
    state.visible = Boolean(entries[0]?.isIntersecting);
    sync();
  }, { threshold: .02 }).observe(hero);
  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    state.ready = false;
    sync();
  });
  canvas.addEventListener('webglcontextrestored', () => {
    try {
      state.ready = prepareGL();
      resize();
      sync();
    } catch { state.ready = false; }
  });

  image.decode().then(() => {
    try {
      state.ready = prepareGL();
      resize();
      sync();
    } catch {
      state.ready = false;
      canvas.hidden = true;
    }
  }).catch(() => {});
})();
