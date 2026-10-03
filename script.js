(() => {
  const root = document.querySelector('.how');
  if (!root) return;

  const ns = 'http://www.w3.org/2000/svg';
  const select = selector => root.querySelector(selector);
  const make = (tag, attrs, parent) => {
    const el = document.createElementNS(ns, tag);
    Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
    parent.appendChild(el);
    return el;
  };
  const clamp = value => Math.max(0, Math.min(1, value));
  const ease = value => {
    const x = clamp(value);
    return x * x * (3 - 2 * x);
  };

  const points = [[30,136],[65,75],[94,95],[93,136],[72,196],[129,215],[124,166],[143,134],[173,170],[202,191],[182,145],[178,112],[238,124],[198,53],[157,83],[132,32],[128,95]];
  const scatter = [[25,105],[36,37],[86,69],[66,127],[26,201],[111,220],[69,184],[137,148],[182,208],[235,196],[221,148],[193,102],[244,78],[228,27],[163,47],[116,23],[134,94]];
  const edges = [[0,1],[0,3],[0,4],[1,2],[1,15],[2,3],[2,16],[3,4],[3,6],[4,6],[4,5],[5,6],[5,8],[5,9],[6,7],[6,8],[7,16],[7,10],[8,9],[9,10],[9,12],[10,11],[10,12],[11,12],[11,13],[11,14],[12,13],[13,14],[13,15],[14,15],[14,16],[15,16]];
  const net = select('[data-network]');
  const wash = make('path', { d: 'M84 82 C112 58 158 74 177 98 C198 127 173 179 143 188 C106 205 75 163 74 132 C71 109 73 96 84 82Z', class: 'blob' }, net);
  const active = make('g', {}, net);
  const dots = make('g', {}, net);
  const curves = edges.map(([a, b], index) => {
    const p = points[a];
    const q = points[b];
    return `M${p[0]} ${p[1]} Q${(p[0] + q[0]) / 2 + (index % 3 - 1) * 3} ${(p[1] + q[1]) / 2 + 2} ${q[0]} ${q[1]}`;
  });
  const netPaths = curves.map(d => {
    const path = make('path', { d, class: 'line' }, active);
    const length = path.getTotalLength();
    path.style.strokeDasharray = length;
    path.dataset.length = length;
    return path;
  });
  const networkDots = points.map(point => make('circle', { cx: point[0], cy: point[1], r: 8, class: 'node' }, dots));

  const finalPoints = [[46,81],[87,40],[101,89],[169,94],[202,84],[238,70],[109,159],[77,190],[114,191],[152,184],[98,219],[143,216]];
  const offsets = [[-15,10],[19,5],[-10,22],[-12,-18],[9,18],[6,22],[-17,-7],[-18,12],[10,-20],[15,8],[-14,-4],[13,5]];
  const joins = [[0,1],[1,2],[2,0],[3,4],[4,5],[6,8],[7,8],[8,9],[8,10],[8,11]];
  const clusterLinks = joins.map(() => make('path', { class: 'line' }, select('[data-cluster-links]')));
  const clusterDots = finalPoints.map(() => make('circle', { r: 7.5, class: 'node' }, select('[data-cluster-nodes]')));
  const blobs = select('[data-blobs]');

  const route = select('[data-route]');
  const routeLength = route.getTotalLength();
  route.style.strokeDasharray = routeLength;
  const routeDots = Array.from(select('[data-route-nodes]').children);
  const rays = Array.from(select('[data-rays]').children);

  function paint(time) {
    const gather = ease((time - 0.3) / 0.9);
    networkDots.forEach((el, index) => {
      el.setAttribute('cx', scatter[index][0] + (points[index][0] - scatter[index][0]) * gather);
      el.setAttribute('cy', scatter[index][1] + (points[index][1] - scatter[index][1]) * gather);
    });
    wash.style.opacity = 0.65 * ease((time - 1.55) / 0.65);
    netPaths.forEach((path, index) => {
      const phase = ease((time - 1.25 - index * 0.019) / 0.38);
      path.style.strokeDashoffset = Number(path.dataset.length) * (1 - phase);
      path.style.opacity = phase > 0 ? 1 - 0.67 * ease((time - 2.3) / 0.45) : 0;
    });
    [6,8,14,16,17,21,25,30].forEach(index => {
      if (time > 1.25 + index * 0.019) netPaths[index].style.opacity = 1;
    });

    blobs.style.opacity = 0.8 * ease((time - 1.95) / 0.2);
    const formGroups = ease((time - 2.2) / 0.7);
    const moving = finalPoints.map((point, index) => [point[0] + offsets[index][0] * (1 - formGroups), point[1] + offsets[index][1] * (1 - formGroups)]);
    clusterDots.forEach((el, index) => {
      el.setAttribute('cx', moving[index][0]);
      el.setAttribute('cy', moving[index][1]);
    });
    clusterLinks.forEach((el, index) => {
      const a = moving[joins[index][0]];
      const b = moving[joins[index][1]];
      el.setAttribute('d', `M${a[0]} ${a[1]} Q${(a[0] + b[0]) / 2 + 1} ${(a[1] + b[1]) / 2 - 2} ${b[0]} ${b[1]}`);
      const phase = ease((time - 3.02 - index * 0.025) / 0.3);
      el.setAttribute('pathLength', '1');
      el.style.strokeDasharray = '1';
      el.style.strokeDashoffset = 1 - phase;
      el.style.opacity = phase > 0 ? 1 : 0;
    });

    const progress = ease((time - 3.45) / 1.7);
    select('[data-branches]').style.opacity = 0.25 + 0.65 * ease((time - 2.9) / 0.65);
    route.style.strokeDashoffset = routeLength * (1 - progress);
    routeDots.forEach((el, index) => { el.style.opacity = 0.25 + 0.75 * ease((progress - index * 0.32) * 5); });
    select('[data-arrow]').style.opacity = ease((progress - 0.88) * 9);
    const arrived = ease((time - 4.85) / 0.5);
    select('[data-goal]').style.opacity = 0.25 + 0.75 * arrived;
    rays.forEach((el, index) => { el.style.opacity = ease((time - 5.05 - index * 0.04) / 0.24); });
  }

  let current = 0;
  let last = 0;
  let frameId = 0;
  let isVisible = false;

  function frame(now) {
    if (last) current += Math.min(now - last, 100) * 0.001;
    last = now;
    paint(current);
    if (current < 6) frameId = requestAnimationFrame(frame);
    else { current = 6; paint(6); }
  }

  function play() {
    cancelAnimationFrame(frameId);
    current = 0;
    last = 0;
    paint(0);
    frameId = requestAnimationFrame(frame);
  }

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  paint(reducedMotion.matches ? 6 : 0);

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting === isVisible) return;
        isVisible = entry.isIntersecting;
        if (isVisible && !reducedMotion.matches) play();
        else {
          cancelAnimationFrame(frameId);
          paint(6);
        }
      });
    }, { rootMargin: '-15% 0px -15% 0px', threshold: 0 });
    observer.observe(root);
  } else {
    isVisible = true;
    if (!reducedMotion.matches) play();
  }

  reducedMotion.addEventListener('change', () => {
    cancelAnimationFrame(frameId);
    if (reducedMotion.matches || !isVisible) paint(6);
    else play();
  });
})();
