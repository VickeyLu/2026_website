(() => {
  const video = document.querySelector('.space-wrap video');
  const canvas = document.createElement('canvas');
  canvas.className = 'hero-grade';
  canvas.setAttribute('aria-hidden', 'true');
  const gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false });
  if (!gl) return;
  const compile = (type, source) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
    return shader;
  };
  const program = gl.createProgram();
  gl.attachShader(program, compile(gl.VERTEX_SHADER, `
    attribute vec2 position;
    varying vec2 uv;
    void main() { uv = vec2((position.x + 1.0) * .5, (1.0 - position.y) * .5); gl_Position = vec4(position, 0.0, 1.0); }
  `));
  gl.attachShader(program, compile(gl.FRAGMENT_SHADER, `
    precision mediump float;
    varying vec2 uv;
    uniform sampler2D frame;
    uniform sampler2D matte;
    uniform vec2 texel;
    uniform vec2 tile;
    uniform float earth;
    uniform float raw;
    void main() {
      vec3 c = texture2D(frame, uv).rgb;
      vec3 neighborhood = vec3(0.0);
      for (int x = -1; x <= 1; x++) {
        for (int y = -1; y <= 1; y++) {
          float weight = (x == 0 ? 2.0 : 1.0) * (y == 0 ? 2.0 : 1.0);
          neighborhood += texture2D(frame, uv + vec2(float(x), float(y)) * texel * 1.5).rgb * weight / 16.0;
        }
      }
      float horizon = .591 - .033 * uv.x + .232 * uv.x * uv.x;
      float ground = smoothstep(horizon - .014, horizon + .026, uv.y);
      vec2 local = (uv * vec2(1920.0, 1080.0) - vec2(810.0, 500.0)) / vec2(308.0, 366.0);
      float inside = step(0.0, local.x) * step(local.x, 1.0) * step(0.0, local.y) * step(local.y, 1.0);
      vec2 sprite = (tile + clamp(local, .003, .997)) / vec2(16.0, 10.0);
      float body = texture2D(matte, sprite).a * inside;
      float upper = (1.0 - smoothstep(.085, .12, abs(uv.x - .5)))
        * smoothstep(.19, .24, uv.y) * (1.0 - smoothstep(.49, .55, uv.y));
      float person = max(body, upper);
      float sky = (1.0 - ground) * (1.0 - person);
      vec3 quiet = c - max(c - neighborhood, vec3(0.0)) * .65;
      float luminance = dot(quiet, vec3(.2126, .7152, .0722));
      quiet *= .88 / (1.0 + 2.6 * luminance);
      vec3 graded = mix(c, quiet, sky);
      graded *= 1.0 - (1.0 - earth) * ground * (1.0 - person);
      gl_FragColor = vec4(mix(graded, c, raw), 1.0);
    }
  `));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
  gl.useProgram(program);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, 'position');
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  const uniforms = Object.fromEntries(['frame', 'matte', 'texel', 'tile', 'earth', 'raw'].map(name => [name, gl.getUniformLocation(program, name)]));
  function texture(unit) {
    const result = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, result);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return result;
  }
  const frameTexture = texture(0), matteTexture = texture(1);
  gl.uniform1i(uniforms.frame, 0);
  gl.uniform1i(uniforms.matte, 1);
  const matte = new Image(), poster = new Image();
  let ready = false, time = 0, raw = false, lost = false;
  function draw() {
    if (!ready || lost) return;
    const source = video.readyState >= 2 ? video : poster;
    if (source === poster && !poster.complete) return;
    const width = source === video ? video.videoWidth : poster.naturalWidth;
    const height = source === video ? video.videoHeight : poster.naturalHeight;
    if (!width || !height) return;
    if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; gl.viewport(0, 0, width, height); }
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, frameTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, source);
    gl.uniform2f(uniforms.texel, 1 / width, 1 / height);
    const index = Math.round(time * 24) % 151;
    gl.uniform2f(uniforms.tile, index % 16, Math.floor(index / 16));
    gl.uniform1f(uniforms.earth, Number(getComputedStyle(document.documentElement).getPropertyValue('--earth-brightness')));
    gl.uniform1f(uniforms.raw, raw ? 1 : 0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    canvas.dataset.ready = '';
    video.style.opacity = '0';
  }
  matte.onload = () => {
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, matteTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, matte);
    ready = true;
    draw();
  };
  poster.onload = draw;
  matte.src = 'assets/hero/matte.webp';
  poster.src = video.poster;
  video.after(canvas);
  video.addEventListener('loadeddata', draw);
  video.addEventListener('seeked', () => { time = video.currentTime; draw(); });
  if ('requestVideoFrameCallback' in video) {
    const tick = (_, frame) => { time = frame.mediaTime; draw(); video.requestVideoFrameCallback(tick); };
    video.requestVideoFrameCallback(tick);
  } else {
    const tick = () => { if (!video.paused && !document.hidden) { time = video.currentTime; draw(); } requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }
  canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); lost = true; canvas.hidden = true; video.style.opacity = ''; });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) video.pause();
  });
  window.heroPreview = {
    setEarth(value) { document.documentElement.style.setProperty('--earth-brightness', value); draw(); },
    setRaw(value) { raw = value; draw(); },
    pause() { video.pause(); },
    play() { return video.play(); }
  };
})();
