// PROTOTYPE (proto-path v2). The path below the hero, drawn as a line of words.
// It starts where "Path is not always linear." ends, swings between the chapters (left / right),
// makes one loop between Marketing and SaaS, then tightens into a solid ink ribbon that carries
// the three How I work steps across the page. Decorative only (aria-hidden); every word on it
// also lives in the page as real text. The words travel along the line as you scroll (never on
// their own); reduced motion keeps them still. Phones get the ribbon only.
(() => {
  const host = document.querySelector('[data-after-hero]');
  const svg = document.querySelector('[data-path-flow]');
  const start = document.querySelector('[data-path-start]');
  const stops = [...document.querySelectorAll('[data-path-stop]')];
  const end = document.querySelector('[data-path-end]');
  if (!host || !svg || !start || !stops.length || !end) return;

  const NS = 'http://www.w3.org/2000/svg';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const WORDS = 'Zhengzhou, China   ·   Shanghai, China   ·   St. Louis, MO   ·   Bay Area, CA   ·   ';
  const METHOD = 'See the real problem.   ·   Turn ambiguity into clarity.   ·   Move fast with judgment.   ·   ';
  const el = (tag, attrs = {}) => { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); return n; };

  // Catmull-Rom through the points, as cubic Béziers: a smooth line that passes through every stop.
  const smooth = pts => {
    let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)},${c2[0].toFixed(1)} ${c2[1].toFixed(1)},${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
    }
    return d;
  };

  let words = null, method = null, wordsUnit = 1, methodUnit = 1;

  function layout() {
    svg.textContent = '';
    const H = host.getBoundingClientRect();
    const box = e => { const r = e.getBoundingClientRect(); return { l: r.left - H.left, t: r.top - H.top, r: r.right - H.left, b: r.bottom - H.top, w: r.width, h: r.height }; };
    const phone = innerWidth <= 900;
    const list = box(stops[0].parentElement);
    const L = list.l, W = list.w;

    // where the ribbon runs: in the space under the How I work heading
    const h2 = box(end.querySelector('h2'));
    const ry = h2.b + parseFloat(getComputedStyle(end.querySelector('h2')).marginBottom) / 2;
    const J = [Math.max(16, L - 36), ry];                       // the joint: grey line becomes ribbon
    const ribbon = smooth([J, [L + W * .3, ry - 18], [L + W * .66, ry + 14], [innerWidth + 80, ry - 6]]);

    const defs = el('defs');
    defs.append(el('path', { id: 'pf-ribbon-path', d: ribbon }));
    svg.append(defs);

    if (!phone) {
      // the winding line: heading end → each chapter's empty side → (loop) → past the coda → down the gutter to the joint
      const r = document.createRange(); r.selectNodeContents(start);
      const hr = r.getBoundingClientRect();
      const pts = [[hr.right - H.left + 20, hr.top - H.top + hr.height * .62]];
      stops.forEach((s, i) => {
        const b = box(s), left = s.classList.contains('is-left');
        pts.push([L + W * (left ? .76 : .24), b.t + b.h * .5]);
        if (s.hasAttribute('data-path-loop-after') && stops[i + 1]) {
          // one loop in the gap: the path is not always linear
          const n = box(stops[i + 1]), m = [L + W * .5, (b.b + n.t) / 2 + 40];
          const k = 1.45; pts.push(...[[-70, -10], [40, -70], [-10, -140], [-90, -80], [-30, 10], [90, 30]].map(([dx, dy]) => [m[0] + dx * k, m[1] + dy * k]));
        }
      });
      const coda = box(document.querySelector('.path .chapters-coda'));
      pts.push([L + W * .7, coda.t + coda.h * .5]);
      // turn down into the left gutter above How I work, so the words run beside (not over) its heading
      pts.push([L + W * .22, (coda.b + box(end).t) / 2 - 30]);
      pts.push([J[0], box(end).t - 40]);
      pts.push([J[0], (box(end).t + J[1]) / 2]);
      pts.push(J);
      defs.append(el('path', { id: 'pf-words-path', d: smooth(pts) }));
      const t = el('text', { class: 'pf-words', dy: '.35em' });
      words = el('textPath', { href: '#pf-words-path' });
      t.append(words); svg.append(t);
      words.textContent = WORDS;
      wordsUnit = t.getComputedTextLength() || 600;
      const len = defs.lastChild.getTotalLength();
      words.textContent = WORDS.repeat(Math.ceil(len / wordsUnit) + 2);
    } else words = null;

    svg.append(el('path', { class: 'pf-ribbon', d: ribbon, 'stroke-width': phone ? 34 : 42 }));
    const rt = el('text', { class: 'pf-ribbon-words', dy: '.35em' });
    method = el('textPath', { href: '#pf-ribbon-path' });
    rt.append(method); svg.append(rt);
    method.textContent = METHOD;
    methodUnit = rt.getComputedTextLength() || 600;
    method.textContent = METHOD.repeat(Math.ceil((innerWidth + 200) / methodUnit) + 2);
    if (!phone) svg.append(el('circle', { class: 'pf-joint', cx: J[0], cy: J[1], r: 7 }));
    move();
  }

  // the words travel forward along the line as the page scrolls
  function move() {
    if (reduce) { if (words) words.setAttribute('startOffset', 0); method.setAttribute('startOffset', 0); return; }
    const y = scrollY;
    if (words) words.setAttribute('startOffset', (-wordsUnit + (y * .35) % wordsUnit).toFixed(1));
    method.setAttribute('startOffset', (-methodUnit + (y * .5) % methodUnit).toFixed(1));
  }

  let raf = 0;
  addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; move(); }); }, { passive: true });
  let t = 0; const relayout = () => { clearTimeout(t); t = setTimeout(layout, 120); };
  new ResizeObserver(relayout).observe(host);
  document.querySelectorAll('.path img').forEach(img => img.addEventListener('load', relayout));
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(layout);
  layout();
})();
