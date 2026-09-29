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
    drift: number('--cloud-drift-speed', .052)
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
    uniform float uTime;
    uniform float uAmbient;
    uniform float uDrift;

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

      vec2 sampleUv = .5 + (vUv - .5 + drift / uView) * uCover;
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
    visible: false, ready: false,
    frame: 0, lastFrame: 0, elapsed: 0
  };
  let gl;
  let uniforms;

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

    const names = ['uImage', 'uView', 'uCover', 'uTime', 'uAmbient', 'uDrift'];
    uniforms = Object.fromEntries(names.map(name => [name, gl.getUniformLocation(program, name)]));
    gl.uniform1i(uniforms.uImage, 0);
    gl.uniform1f(uniforms.uAmbient, settings.ambient);
    gl.uniform1f(uniforms.uDrift, settings.drift);
    return true;
  }

  function resize() {
    const width = field.clientWidth;
    const height = field.clientHeight;
    if (!width || !height || !state.ready) return;
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
    const cover = Math.max(width / image.naturalWidth, height / image.naturalHeight);
    gl.uniform2f(uniforms.uView, width, height);
    gl.uniform2f(uniforms.uCover,
      width / (image.naturalWidth * cover), height / (image.naturalHeight * cover));
    if (!canvas.hidden) gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  function paint(now) {
    state.frame = 0;
    if (!state.ready || !state.visible || document.hidden || reducedMotion.matches || !finePointer.matches) return;
    const dt = Math.min((now - (state.lastFrame || now)) / 1000, .05);
    state.lastFrame = now;
    state.elapsed += dt;
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
    }
    if (!active) canvas.hidden = true;
  }

  document.addEventListener('visibilitychange', sync);
  reducedMotion.addEventListener('change', sync);
  finePointer.addEventListener('change', sync);
  new ResizeObserver(resize).observe(field);
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
