/* A tapered, elastic ink ribbon. Leaves the native pointer and links usable. */
(() => {
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const pointer = matchMedia('(hover: hover) and (pointer: fine)');
  const canvas = document.createElement('canvas');
  canvas.className = 'liquid-cursor-trail';
  canvas.setAttribute('aria-hidden', 'true');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  let points = [], frame = 0, lastMove = 0, previous = 0;
  let target = { x: 0, y: 0 };
  const enabled = () => !motion.matches && pointer.matches && !document.hidden;
  function resize() {
    const scale = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(innerWidth * scale);
    canvas.height = Math.round(innerHeight * scale);
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    points = [];
  }
  function clear() {
    cancelAnimationFrame(frame); frame = 0; points = []; previous = 0;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
  }
  function draw(now) {
    frame = 0;
    if (!enabled()) { clear(); return; }
    const step = Math.min((now - (previous || now - 16.67)) / 16.67, 2);
    previous = now;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    const fade = Math.max(0, 1 - Math.max(0, now - lastMove - 80) / 650);
    if (!fade || !points.length) { clear(); return; }
    points.forEach((p, i) => {
      const leader = i ? points[i - 1] : target;
      const follow = 1 - Math.pow(i ? 0.68 : 0.48, step);
      p.x += (leader.x - p.x) * follow;
      p.y += (leader.y - p.y) * follow;
    });
    // Overlapping rounded segments merge into a liquid, speed-stretched ribbon.
    ctx.lineCap = 'round';
    for (let i = points.length - 1; i > 0; i--) {
      const t = 1 - i / points.length;
      ctx.strokeStyle = `hsla(${275 + i * 3}, 68%, 65%, ${fade * t * 0.55})`;
      ctx.lineWidth = (2 + 22 * Math.sin(t * Math.PI * 0.85)) * fade;
      ctx.beginPath(); ctx.moveTo(points[i].x, points[i].y);
      ctx.lineTo(points[i - 1].x, points[i - 1].y); ctx.stroke();
    }
    frame = requestAnimationFrame(draw);
  }
  document.addEventListener('pointermove', event => {
    if (!enabled() || event.pointerType === 'touch') return;
    target = {x: event.clientX, y: event.clientY}; lastMove = performance.now();
    if (!points.length) points = Array.from({length: 28}, () => ({...target}));
    if (!frame) frame = requestAnimationFrame(draw);
  }, {passive: true});
  document.documentElement.addEventListener('pointerleave', clear);
  window.addEventListener('blur', clear);
  document.addEventListener('visibilitychange', clear);
  motion.addEventListener('change', clear); pointer.addEventListener('change', clear);
  window.addEventListener('resize', resize, {passive: true});
  document.body.append(canvas); resize();
})();
