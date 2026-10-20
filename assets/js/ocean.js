/* Ocean scene: progressive enhancement of the original static portfolio. */
(() => {
  'use strict';
  const Core = window.OceanCore;
  const site = document.querySelector('.site-wrap');
  if (!Core || !site) return;
  const body = document.body;
  const hero = document.querySelector('.ocean-hero');
  const home = !!hero;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const narrow = matchMedia('(max-width:932px)');
  const clamp = (n, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, n));
  const mix = (a, b, t) => a + (b - a) * t;
  const ease = t => t * t * (3 - 2 * t);
  const node = (tag, className) => {
    const el = document.createElement(tag);
    el.className = className;
    return el;
  };
  const shell = node('div', 'ocean-shell');
  const port = node('div', 'ocean-scrollport');
  port.id = 'ocean-scrollport';
  port.tabIndex = -1;
  const dock = node('div', 'ocean-companion');
  dock.setAttribute('aria-hidden', 'true');
  const ambient = node('canvas', 'ocean-ambient');
  const actor = node('canvas', 'ocean-character-layer');
  actor.id = 'ocean-character';
  [ambient, actor].forEach(el => el.setAttribute('aria-hidden', 'true'));
  const actorCtx = actor.getContext('2d');
  const ambientCtx = ambient.getContext('2d');
  const surface = document.getElementById('ocean-surface');
  const surfaceCtx = surface?.getContext('2d');
  // If drawing is unavailable, leave the document and its ordinary scrolling intact.
  if (!actorCtx || !ambientCtx || (home && !surfaceCtx)) return;
  body.insertBefore(shell, home ? hero : site);
  if (hero) port.append(hero);
  port.append(site);
  shell.append(ambient, port, dock, actor);
  const top = node('span', 'ocean-top-anchor');
  top.id = 'ocean-top';
  port.prepend(top);
  body.classList.add('ocean-enhanced');

  const toggle = node('button', 'ocean-motion-toggle');
  toggle.type = 'button';
  toggle.setAttribute('aria-label', 'Pause ocean animation');
  toggle.innerHTML = '<span aria-hidden="true">Ⅱ</span><span>Pause motion</span>';
  shell.append(toggle);
  const game = new Core.BalanceGame();
  const touch = new Core.TouchIntent();
  const wheel = new Core.WheelIntent();
  const reasons = new Set();
  let pausedByUser = false;
  let playOptIn = false;
  let artReady = false;
  let underwater = !home;
  let heroHeight = innerHeight;
  let raf = 0, lastTime = 0, clock = 0, lastPaint = -1000, lastHud = 0;
  let input = 0, touchPreview = 0, touchId = null, touchConsumed = false;
  let multiTouch = false, armAfter = performance.now() + 200, armed = false;
  let dive = null, wheelTail = null, historyTimer = 0, wakeTimer = 0;
  let lastState = 'ready', oldBest = 0, frameAverage = 16, slowFrames = 0;
  let quality = 1, viewportWidth = innerWidth, viewportHeight = innerHeight;
  let mobileActorWidth = 180, mobileActorY = innerHeight * 0.62;
  let readingAnchor = null;
  let visualPose = { name: 'balance', direction: 1 };
  let previousPose = visualPose, poseBlend = 1;
  const pointers = new Set();
  const keys = new Set();
  const scoreEl = document.getElementById('ocean-score');
  const bestEl = document.getElementById('ocean-best');
  const meter = document.getElementById('ocean-balance');
  const marker = meter?.querySelector('.ocean-balance-marker');
  const status = document.getElementById('ocean-status');
  const play = document.getElementById('ocean-play');
  const progress = document.getElementById('ocean-dive-progress');
  const art = new Image();
  const correctionArt = new Image();
  art.decoding = 'async';
  correctionArt.decoding = 'async';
  try { game.best = Math.max(0, Math.min(86400, Number(localStorage.getItem('prachi-ocean-best-v1')) || 0)); } catch (_) {}
  oldBest = game.best;

  const isPaused = () => reasons.size > 0 || pausedByUser;
  const effectsEnabled = () => !isPaused() && !motion.matches;
  const playable = () => artReady && home && !isPaused() && (!motion.matches || playOptIn);
  const getViewport = () => {
    const r = port.getBoundingClientRect();
    return { left: r.left, top: r.top, width: port.clientWidth, height: port.clientHeight };
  };
  const emit = () => document.dispatchEvent(new CustomEvent('ocean:state'));
  const saveBest = () => {
    if (game.best <= oldBest) return;
    oldBest = game.best;
    try { localStorage.setItem('prachi-ocean-best-v1', String(game.best)); } catch (_) {}
  };
  const finalize = () => { game.finalise(); saveBest(); input = 0; keys.clear(); };
  function updateState() {
    body.classList.toggle('ocean-paused', isPaused());
    body.classList.toggle('ocean-static', motion.matches);
    body.classList.toggle('ocean-underwater', underwater);
    toggle.setAttribute('aria-pressed', String(pausedByUser));
    const still = pausedByUser;
    const activity = motion.matches ? 'game' : 'motion';
    toggle.setAttribute('aria-label', `${still ? 'Resume' : 'Pause'} ${activity}`);
    toggle.innerHTML = `<span aria-hidden="true">${still ? '▷' : 'Ⅱ'}</span> <span>${still ? 'Resume' : 'Pause'} ${activity}</span>`;
    toggle.hidden = motion.matches && !playOptIn;
    dock.hidden = !underwater || !artReady;
    actor.style.visibility = reasons.size ? 'hidden' : 'visible';
    toggle.inert = reasons.size > 0;
    armed = armed && playable() && port.scrollTop <= 8 && !dive;
    hero?.classList.toggle('is-armed', armed);
    emit();
    wake();
  }
  function setPaused(reason, value) {
    if (value) {
      reasons.add(reason);
      cancelInteraction();
    } else reasons.delete(reason);
    armAfter = performance.now() + 200;
    lastTime = 0;
    updateState();
  }
  function cancelInteraction() {
    input = 0;
    keys.clear();
    touch.cancel();
    touchId = null;
    for (const id of pointers) {
      if (hero?.hasPointerCapture(id)) hero.releasePointerCapture(id);
    }
    pointers.clear();
    multiTouch = false;
    touchConsumed = false;
    touchPreview = 0;
    wheel.reset();
    wheelTail = null;
    dive = null;
    armed = false;
    if (progress) progress.style.setProperty('--progress', 0);
  }
  function scrollTo(topValue, options = {}) {
    // The port owns scrolling on every breakpoint; no document-scroll fallback.
    port.scrollTo({ top: topValue, behavior: motion.matches ? 'auto' : options.behavior || 'auto' });
  }
  window.Ocean = {
    scrollElement: port,
    getScroll: () => ({ x: port.scrollLeft, y: port.scrollTop }),
    getViewport, isPaused, effectsEnabled,
    isUnderwater: () => underwater,
    setPaused, scrollTo
  };
  function targetTop(el) {
    return el.getBoundingClientRect().top - port.getBoundingClientRect().top + port.scrollTop;
  }
  function stashPosition() {
    try {
      history.replaceState({ ...history.state, oceanScroll: port.scrollTop }, '');
    } catch (_) {}
  }
  const initialPosition = history.state?.oceanScroll;
  try { history.scrollRestoration = 'manual'; } catch (_) {}
  function restorePosition() {
    const saved = history.state?.oceanScroll;
    if (Number.isFinite(saved)) {
      scrollTo(saved);
    } else if (location.hash) {
      let id;
      try { id = decodeURIComponent(location.hash.slice(1)); } catch (_) { return; }
      const el = document.getElementById(id);
      if (el && port.contains(el)) scrollTo(targetTop(el));
    }
    onScroll();
  }
  function navigateHash(hash, el) {
    stashPosition();
    try { history.pushState({ oceanScroll: targetTop(el) }, '', hash); } catch (_) {}
  }
  function beginDive(source, pushHash = true) {
    if (!home || dive || reasons.size) return;
    finalize();
    armed = false;
    hero.classList.remove('is-armed');
    const now = performance.now();
    const duration = motion.matches || pausedByUser ? 0 : 600;
    dive = { from: port.scrollTop, to: targetTop(site), start: now, duration, source };
    if (pushHash && location.hash !== '#underwater') navigateHash('#underwater', site);
    if (source === 'wheel') wheelTail = { last: now, until: now + duration + 600, end: now + duration };
    if (source === 'touch') touchConsumed = true;
    touchPreview = 0;
    if (progress) progress.style.setProperty('--progress', 1);
    if (!duration) { scrollTo(dive.to); completeDive(); }
    wake();
  }
  function completeDive() {
    const source = dive?.source;
    dive = null;
    if (progress) progress.style.setProperty('--progress', 0);
    if (source === 'link') {
      site.tabIndex = -1;
      site.focus({ preventScroll: true });
    }
    onScroll();
  }
  function onScroll() {
    const now = performance.now();
    const next = !home || port.scrollTop >= heroHeight * 0.58;
    if (next !== underwater) { underwater = next; updateState(); }
    if (home && port.scrollTop > 8) {
      armed = false;
      hero.classList.remove('is-armed');
      if (!dive && game.state !== 'ready') finalize();
      armAfter = now + 200;
    } else if (!armed) {
      armAfter = now + 200;
      clearTimeout(wakeTimer);
      wakeTimer = setTimeout(wake, 210);
    }
    clearTimeout(historyTimer);
    historyTimer = setTimeout(stashPosition, 180);
    if (!dive && underwater && innerWidth === viewportWidth && innerHeight === viewportHeight) {
      const bounds = getViewport();
      const candidates = site.querySelectorAll('.masthead,.page-header,.project-cover,.project-module');
      readingAnchor = null;
      for (const el of candidates) {
        const rect = el.getBoundingClientRect();
        if (rect.bottom > bounds.top + 30 && rect.top < bounds.top + bounds.height) {
          if (!readingAnchor || rect.top >= bounds.top) readingAnchor = { el, offset: rect.top - bounds.top };
          if (rect.top >= bounds.top) break;
        }
      }
    }
    wake();
  }
  port.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('pagehide', () => { stashPosition(); finalize(); });
  window.addEventListener('pageshow', event => {
    if (event.persisted) {
      reasons.delete('hidden'); reasons.delete('blur');
      restorePosition(); updateState();
    }
  });
  window.addEventListener('popstate', () => { cancelInteraction(); restorePosition(); });
  window.addEventListener('hashchange', restorePosition);
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#"]');
    if (!link || event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const hash = link.getAttribute('href');
    if (hash === '#') return; // Existing back-to-top controls are handled by local.js.
    let id;
    try { id = decodeURIComponent(hash.slice(1)); } catch (_) { return; }
    const el = document.getElementById(id);
    if (!el || !port.contains(el)) return;
    event.preventDefault();
    if (home && hash === '#underwater' && port.scrollTop < heroHeight) {
      beginDive('link');
    } else {
      cancelInteraction();
      navigateHash(hash, el);
      scrollTo(targetTop(el), { behavior: 'smooth' });
      el.tabIndex = -1;
      el.focus({ preventScroll: true });
    }
  });
  toggle.addEventListener('click', () => {
    pausedByUser = !pausedByUser;
    cancelInteraction();
    updateState();
  });
  motion.addEventListener('change', () => {
    playOptIn = false;
    finalize();
    cancelInteraction();
    updateState();
    setStatus(motion.matches ? 'Motion is reduced. Choose Play to balance, or dive into the portfolio.' : 'A little left, a little right. Find your balance.');
  });
  document.addEventListener('visibilitychange', () => setPaused('hidden', document.hidden));
  window.addEventListener('blur', () => setPaused('blur', true));
  window.addEventListener('focus', () => setPaused('blur', false));
  document.addEventListener('fullscreenchange', () => setPaused('fullscreen', !!document.fullscreenElement));
  document.addEventListener('webkitbeginfullscreen', () => setPaused('fullscreen', true), true);
  document.addEventListener('webkitendfullscreen', () => setPaused('fullscreen', false), true);

  function setStatus(text) { if (status && status.textContent !== text) status.textContent = text; }
  function startGame() {
    if (!playable() || port.scrollTop > 8 || dive) return;
    if (game.state !== 'ready') return;
    game.start();
    setStatus('Follow the waves. Keep the gold marker in the middle.');
    wake();
  }
  play?.addEventListener('click', () => {
    playOptIn = true;
    pausedByUser = false;
    updateState();
    startGame();
    hero.focus({ preventScroll: true });
  });
  const isControl = target => !!target.closest('a,button,input,textarea,select,[role="button"]');
  if (hero) {
    hero.addEventListener('pointerdown', event => {
      if (event.pointerType !== 'touch' || isControl(event.target)) return;
      pointers.add(event.pointerId);
      if (pointers.size > 1) {
        multiTouch = true;
        touch.cancel(); input = 0; touchPreview = 0;
        if (touchId !== null && hero.hasPointerCapture(touchId)) hero.releasePointerCapture(touchId);
        touchId = null;
        return;
      }
      if (!armed || multiTouch) return;
      touchId = event.pointerId;
      touchConsumed = false;
      touch.begin(event.clientX, event.clientY);
      hero.setPointerCapture(event.pointerId);
      // Pointer capture is local to the game; pinch zoom remains a native gesture.
      hero.focus({ preventScroll: true });
    });
    hero.addEventListener('pointermove', event => {
      if (event.pointerType === 'touch') {
        if (event.pointerId !== touchId || multiTouch || touchConsumed || !touch.active) return;
        const result = touch.move(event.clientX, event.clientY);
        input = result.input;
        touchPreview = result.preview;
        if (progress) progress.style.setProperty('--progress', result.preview);
        if (result.preview > 0) setStatus('Keep swiping up to dive into the portfolio.');
        else if (Math.abs(input) > 0.035) startGame();
        if (result.commit) beginDive('touch');
        wake();
      } else if (armed && !isControl(event.target) && playable()) {
        const rect = hero.getBoundingClientRect();
        input = clamp((event.clientX - rect.left) / rect.width * 2 - 1, -1, 1);
        if (Math.abs(event.movementX) > 0) startGame();
      }
    });
    const endPointer = event => {
      pointers.delete(event.pointerId);
      if (event.pointerId === touchId) {
        const previewed = touchPreview > 0;
        touch.cancel(); touchId = null; input = 0; touchPreview = 0;
        if (progress) progress.style.setProperty('--progress', 0);
        if (previewed && !touchConsumed) {
          game.lean *= 0.65;
          game.velocity *= 0.5;
          game.overleanTime = 0;
          setStatus('Back on the wave. Find your balance.');
        }
      }
      if (!pointers.size) { multiTouch = false; touchConsumed = false; }
      wake();
    };
    hero.addEventListener('pointerup', endPointer);
    hero.addEventListener('pointercancel', endPointer);
    hero.addEventListener('lostpointercapture', endPointer);
    hero.addEventListener('pointerleave', event => { if (event.pointerType !== 'touch') input = 0; });
    hero.addEventListener('keydown', event => {
      if (isControl(event.target) || !['ArrowLeft', 'ArrowRight', 'a', 'A', 'd', 'D'].includes(event.key)) return;
      if (!playable() || port.scrollTop > 8) return;
      event.preventDefault();
      keys.add(event.key.toLowerCase());
      startGame();
    });
    hero.addEventListener('keyup', event => keys.delete(event.key.toLowerCase()));
    hero.addEventListener('focusout', () => { keys.clear(); input = 0; });
  }
  document.addEventListener('keydown', event => {
    if (['Escape', 'PageDown', 'PageUp', 'Home', 'End', 'ArrowDown', 'ArrowUp', ' '].includes(event.key)) {
      cancelInteraction();
      if (event.key === 'Escape') finalize();
      wake();
    }
  });
  port.addEventListener('wheel', event => {
    if (event.ctrlKey || event.metaKey || reasons.size) return;
    const now = performance.now();
    if (wheelTail) {
      if (now < wheelTail.until && (dive || now - wheelTail.last < 200)) {
        if (event.cancelable) event.preventDefault();
        wheelTail.last = now;
        return;
      }
      wheelTail = null;
    }
    if (!armed || !hero.contains(event.target)) return;
    const result = wheel.feed(event, now, port.clientHeight);
    if (!result.qualifies) return;
    if (!event.cancelable) { armed = false; hero.classList.remove('is-armed'); return; }
    event.preventDefault();
    if (progress) progress.style.setProperty('--progress', result.progress);
    if (result.commit) beginDive('wheel');
    else {
      clearTimeout(wakeTimer);
      wakeTimer = setTimeout(() => {
        if (!dive && progress) progress.style.setProperty('--progress', 0);
        wake();
      }, 220);
    }
  }, { passive: false });

  function sizeCanvas(canvas, ctx, width, height) {
    const ratio = Math.min(devicePixelRatio || 1, 1.5) * quality;
    const dpr = Math.min(ratio, Math.sqrt(2000000 / Math.max(1, width * height)));
    const w = Math.max(1, Math.round(width * dpr)), h = Math.max(1, Math.round(height * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w; canvas.height = h;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function resize() {
    const anchor = readingAnchor;
    const oldHeight = heroHeight;
    const oldScroll = port.scrollTop;
    viewportWidth = innerWidth;
    viewportHeight = innerHeight;
    heroHeight = Math.max(320, innerHeight, hero ? parseFloat(getComputedStyle(hero).minHeight) || 0 : 0);
    if (hero) hero.style.setProperty('--hero-height', `${heroHeight}px`);
    if (!dive && anchor?.el.isConnected) {
      port.scrollTop += anchor.el.getBoundingClientRect().top - port.getBoundingClientRect().top - anchor.offset;
    } else if (home && oldScroll >= oldHeight && !dive) {
      port.scrollTop = oldScroll + heroHeight - oldHeight;
    }
    if (hero && narrow.matches) {
      const introBottom = hero.querySelector('.ocean-introduction').getBoundingClientRect().bottom + port.scrollTop;
      const hudTop = hero.querySelector('.ocean-hud').getBoundingClientRect().top + port.scrollTop;
      const room = Math.max(75, hudTop - introBottom - 32);
      const aspect = poses.balance[2] / poses.balance[3];
      mobileActorWidth = Math.min(viewportWidth * 0.54, heroHeight * 0.38, room * aspect);
      mobileActorY = Math.min(heroHeight * 0.655, hudTop - mobileActorWidth / aspect / 2 - 16);
    }
    sizeCanvas(actor, actorCtx, viewportWidth, viewportHeight);
    sizeCanvas(ambient, ambientCtx, viewportWidth, viewportHeight);
    if (surface) sizeCanvas(surface, surfaceCtx, port.clientWidth, heroHeight);
    lastPaint = -1000;
    onScroll();
    wake();
  }
  window.addEventListener('resize', resize, { passive: true });
  narrow.addEventListener('change', resize);
  if (window.ResizeObserver) new ResizeObserver(() => {
    if (surface) sizeCanvas(surface, surfaceCtx, port.clientWidth, heroHeight);
    wake();
  }).observe(port);

  // Paint the sea with layered wave bands. All shapes remain below the DOM UI.
  function cloud(ctx, x, y, scale, alpha) {
    ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
    ctx.fillStyle = `rgba(255,255,248,${alpha})`;
    ctx.beginPath();
    ctx.moveTo(-74, 9);
    ctx.bezierCurveTo(-91, -8, -62, -25, -44, -21);
    ctx.bezierCurveTo(-39, -51, 6, -57, 20, -27);
    ctx.bezierCurveTo(47, -38, 64, -14, 61, -4);
    ctx.bezierCurveTo(91, -10, 102, 15, 72, 18);
    ctx.bezierCurveTo(18, 24, -50, 21, -74, 9);
    ctx.fill(); ctx.restore();
  }
  function waveY(x, y, amplitude, phase, width) {
    return y + Math.sin(x / width * Math.PI * 3.3 + phase) * amplitude +
      Math.sin(x / width * Math.PI * 7 - phase * 0.7) * amplitude * 0.27;
  }
  function drawSea(t) {
    if (!surfaceCtx || port.scrollTop >= heroHeight) return;
    const ctx = surfaceCtx, w = port.clientWidth, h = heroHeight;
    ctx.clearRect(0, 0, w, h);
    const sky = ctx.createLinearGradient(0, 0, 0, h * 0.65);
    sky.addColorStop(0, '#9cd8e2'); sky.addColorStop(0.6, '#d3eeeb'); sky.addColorStop(1, '#fff0cf');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
    const sunX = w * (narrow.matches ? 0.82 : 0.79), sunY = h * (narrow.matches ? 0.34 : 0.25);
    const radius = Math.min(w * 0.052, 54);
    const glow = ctx.createRadialGradient(sunX, sunY, radius * 0.4, sunX, sunY, radius * 2.8);
    glow.addColorStop(0, '#fff4c9bb'); glow.addColorStop(1, '#fff4c900');
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(sunX, sunY, radius * 2.8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff3c8'; ctx.beginPath(); ctx.arc(sunX, sunY, radius, 0, Math.PI * 2); ctx.fill();
    cloud(ctx, w * 0.6 + Math.sin(t * 0.035) * 22, h * 0.15, narrow.matches ? 0.55 : 0.85, 0.68);
    cloud(ctx, w * 0.94 + Math.sin(t * 0.025 + 2) * 20, h * 0.37, 1.15, 0.65);
    cloud(ctx, w * 0.14 + Math.sin(t * 0.035 + 3) * 18, h * 0.47, 0.65, 0.48);
    const horizon = h * (narrow.matches ? 0.53 : 0.53);
    const sea = ctx.createLinearGradient(0, horizon, 0, h);
    sea.addColorStop(0, '#80bfc2'); sea.addColorStop(0.18, '#52a9b0');
    sea.addColorStop(0.65, '#248a99'); sea.addColorStop(1, '#156574');
    ctx.fillStyle = sea; ctx.fillRect(0, horizon, w, h - horizon);
    ctx.fillStyle = '#f8f0d8aa'; ctx.fillRect(0, horizon, w, 1.5);
    // Perspective glints converge on the sun near the horizon.
    for (let i = 0; i < 24; i++) {
      const p = i / 24, y = horizon + p * p * h * 0.29;
      const length = (12 + p * 95) * (0.65 + 0.35 * Math.sin(i * 7.2 + t * 0.8));
      const x = sunX + Math.sin(i * 4.3 + t * 0.12) * (5 + p * 65);
      ctx.strokeStyle = `rgba(255,239,184,${0.35 * (1 - p)})`;
      ctx.lineWidth = 1.2 + p * 1.6;
      ctx.beginPath(); ctx.moveTo(x - length, y); ctx.lineTo(x + length, y); ctx.stroke();
    }
    const bands = [
      [0.575, 4, '#76bdc0', 0.36], [0.63, 9, '#4eacb4', 0.5],
      [0.71, 15, '#369bab', 0.68], [0.80, 21, '#57b5ba', 0.82],
      [0.89, 18, '#1c8190', 0.7]
    ];
    bands.forEach(([level, amp, color, speed], index) => {
      const y = h * level, phase = t * speed + index * 2.1;
      ctx.beginPath();
      ctx.moveTo(-5, waveY(0, y, amp, phase, w));
      for (let x = 0; x <= w + 16; x += 16) ctx.lineTo(x, waveY(x, y, amp, phase, w));
      ctx.lineTo(w + 16, h); ctx.lineTo(-5, h); ctx.closePath();
      ctx.fillStyle = color; ctx.fill();
      ctx.beginPath();
      for (let x = 0; x <= w + 16; x += 12) {
        const wy = waveY(x, y, amp, phase, w);
        if (x === 0) ctx.moveTo(x, wy); else ctx.lineTo(x, wy);
      }
      ctx.strokeStyle = index === 3 ? '#d1eee0aa' : '#d1eee056';
      ctx.lineWidth = index === 3 ? 2.5 : 1.2; ctx.stroke();
    });
    // A clear front lip reveals the underwater world before the first dive.
    const bottom = ctx.createLinearGradient(0, h * 0.92, 0, h);
    bottom.addColorStop(0, '#07506400'); bottom.addColorStop(1, '#0b5366');
    ctx.fillStyle = bottom; ctx.fillRect(0, h * 0.92, w, h * 0.08);
    // Tiny bubbles below the nearest crest make the cutaway into the sea visible.
    for (let i = 0; i < 9; i++) {
      const x = (i % 2 ? w * 0.92 : w * 0.045) + Math.sin(i * 4.7 + t * 0.3) * 22;
      const y = h * 0.91 + ((i * 17 - t * 7) % 60 + 60) % 60;
      ctx.strokeStyle = '#b2e5d83b'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(x, y, 2 + i % 3, 0, Math.PI * 2); ctx.stroke();
    }
    if (game.state === 'falling' || game.state === 'resurfacing') {
      const x = w * (narrow.matches ? 0.5 : 0.66), y = h * 0.79;
      const age = game.state === 'falling' ? game.stateTime / 0.65 : 1 - game.stateTime;
      ctx.strokeStyle = `rgba(231,255,244,${0.65 * (1 - clamp(age))})`;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(x, y, 20 + age * 90, 5 + age * 15, 0, 0, Math.PI * 2); ctx.stroke();
    }
  }
  function drawAmbient(t) {
    const ctx = ambientCtx, w = viewportWidth, h = viewportHeight;
    ctx.clearRect(0, 0, w, h);
    if (!underwater) return;
    // Light shafts and plants live in the margins, never over the art.
    for (let i = 0; i < 4; i++) {
      const x = w * (0.12 + i * 0.27) + Math.sin(t * 0.08 + i) * 12;
      const ray = ctx.createLinearGradient(x, 0, x + 130, h);
      ray.addColorStop(0, '#b3eee41a'); ray.addColorStop(1, '#b3eee400');
      ctx.fillStyle = ray; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 28, 0);
      ctx.lineTo(x + 240, h); ctx.lineTo(x + 100, h); ctx.closePath(); ctx.fill();
    }
    for (let side = 0; side < 2; side++) {
      for (let i = 0; i < 7; i++) {
        const baseX = side ? w - i * 12 - 8 : i * 12 + 2;
        const plantHeight = 85 + (i * 43 % 150);
        ctx.beginPath(); ctx.moveTo(baseX, h + 12);
        const sway = Math.sin(t * 0.7 + i) * 10;
        ctx.bezierCurveTo(baseX - 32 + sway, h - plantHeight * 0.42, baseX + 35 + sway, h - plantHeight * 0.75, baseX + sway, h - plantHeight);
        ctx.strokeStyle = i % 2 ? '#287f78' : '#165f65'; ctx.lineWidth = 7 + i % 3 * 2;
        ctx.lineCap = 'round'; ctx.stroke();
      }
    }
    const count = narrow.matches ? 12 : 24;
    for (let i = 0; i < count; i++) {
      const seed = (i * 137.21) % 1;
      const edge = i % 2 ? w - 12 - (i * 19 % 70) : 12 + (i * 23 % 66);
      const y = h - ((t * (12 + i % 5 * 2) + i * 79) % (h + 30));
      const x = edge + Math.sin(t * 0.5 + i) * 8;
      const r = 2 + (i * 7 % 5) + seed;
      ctx.strokeStyle = '#c2f5ee50'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#e0fff048'; ctx.beginPath(); ctx.arc(x - r * 0.3, y - r * 0.35, r * 0.2, 0, Math.PI * 2); ctx.fill();
    }
  }
  // Source rectangles isolate Flo's drawings, preserving their transparent edges.
  // Directional poses share the same body scale and mirror around one actor anchor.
  const poses = {
    balance: [100, 20, 360, 510],
    lean: [585, 32, 390, 495],
    catch: [80, 0, 740, 887],
    fall: [20, 540, 520, 410],
    rise: [970, 0, 730, 887],
    swim: [920, 635, 605, 320]
  };
  const poseScale = {
    balance: 1, lean: 390 / 360, catch: 740 / 887 * 510 / 360,
    fall: 520 / 360, rise: 730 / 887 * 510 / 360, swim: 1
  };
  function sprite(pose, x, y, width, rotation, alpha, t, direction = 1) {
    if (alpha <= 0) return;
    const [sx, sy, sw, sh] = poses[pose];
    width *= poseScale[pose];
    const height = width * sh / sw;
    const ctx = actorCtx;
    ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, y); ctx.rotate(rotation);
    // A very small anisotropic motion adds life to the illustrated fins.
    ctx.scale(direction * (1 + Math.sin(t * 2.6) * 0.009), 1 + Math.sin(t * 2.1 + 1) * 0.008);
    const source = pose === 'catch' || pose === 'rise' ? correctionArt : art;
    ctx.drawImage(source, sx, sy, sw, sh,
      -width / 2, -height / 2, width, height);
    ctx.restore();
  }
  function playerInput() {
    const left = keys.has('arrowleft') || keys.has('a');
    const right = keys.has('arrowright') || keys.has('d');
    return left || right ? Number(right) - Number(left) : input;
  }
  function drawActor(t, dt) {
    const ctx = actorCtx, w = viewportWidth, h = viewportHeight;
    ctx.clearRect(0, 0, w, h);
    if (!artReady || reasons.size) return;
    const p = home ? clamp(port.scrollTop / Math.max(1, targetTop(site))) : 1;
    const q = motion.matches ? (underwater ? 1 : 0) : ease(p);
    const mobile = narrow.matches;
    const dockRect = dock.getBoundingClientRect();
    const destination = mobile ?
      { x: w * (w < 360 ? 0.40 : 0.5), y: dockRect.top + Math.min(36, dockRect.height / 2), width: Math.min(108, 60 * poses.swim[2] / poses.swim[3]) } :
      { x: w - 56, y: h * 0.58, width: 93 };
    const initialWidth = mobile ? mobileActorWidth : Math.min(w * 0.28, heroHeight * 0.42 * poses.balance[2] / poses.balance[3], 330);
    let x = mix(w * (mobile ? 0.5 : 0.66), destination.x, q);
    let y = mix(mobile ? mobileActorY : heroHeight * 0.655, destination.y, q);
    let width = mix(initialWidth, destination.width, q);
    let rotation = (1 - q) * game.lean * 0.14;
    const bob = effectsEnabled() ? Math.sin(t * 1.5) * mix(5, 2, q) : 0;
    y += bob;
    let pose = 'balance', direction = 1, opacity = 1;
    if (p < 0.025) {
      if (game.state === 'falling') {
        const f = clamp(game.stateTime / 0.65);
        pose = 'fall'; direction = Math.sign(game.lean || 1);
        rotation += direction * f * 0.5;
        x += direction * f * 32; y += f * 65; opacity = 1 - f;
      } else if (game.state === 'resurfacing') {
        const f = clamp(game.stateTime);
        pose = 'rise'; y += (1 - f) * 55; opacity = f;
      } else if (game.state === 'balancing') {
        const balance = Core.getBalancePose(game.lean, game.velocity, playerInput());
        if (balance.weight > 0.2) {
          pose = balance.pose;
          direction = balance.direction;
        }
      }
    }
    // A brief dissolve connects drawings; each directional drawing is mirrored
    // around the same anchor so left/right actions retain identical anatomy.
    if (visualPose.name !== pose || visualPose.direction !== direction) {
      previousPose = visualPose;
      visualPose = { name: pose, direction };
      poseBlend = 0;
    }
    poseBlend = clamp(poseBlend + (isPaused() ? 0 : dt) / 0.12);
    if (motion.matches && !playOptIn) poseBlend = 1;
    const blend = clamp((q - 0.08) / 0.7);
    sprite(previousPose.name, x, y, width, rotation, (1 - blend) * opacity * (1 - poseBlend), t, previousPose.direction);
    sprite(visualPose.name, x, y, width, rotation, (1 - blend) * opacity * poseBlend, t, visualPose.direction);
    sprite('swim', x, y, width, 0, blend, t);
  }
  function updateHud(now) {
    if (!home || now - lastHud < 100) return;
    lastHud = now;
    scoreEl.textContent = game.elapsed.toFixed(1);
    bestEl.textContent = Math.max(game.best, game.state === 'balancing' ? game.elapsed : 0).toFixed(1);
    const lean = clamp(game.lean, -1, 1);
    marker.style.left = `${50 + lean * 46}%`;
    meter.setAttribute('aria-valuenow', String(Math.round(lean * 100)));
    meter.setAttribute('aria-valuetext', Math.abs(lean) < 0.2 ? 'Centered' : `Leaning ${lean < 0 ? 'left' : 'right'}`);
    meter.classList.toggle('is-danger', Math.abs(lean) > 0.72);
    if (game.state !== lastState) {
      if (game.state === 'falling') setStatus('Splash! Every wave is a fresh start.');
      if (game.state === 'resurfacing') setStatus('Coming back up…');
      if (game.state === 'balancing') setStatus('Find your balance. The ocean is on your side.');
      lastState = game.state;
      saveBest();
    }
  }
  function frame(now) {
    raf = 0;
    const dt = lastTime ? Math.min((now - lastTime) / 1000, 0.1) : 0;
    const elapsedMs = lastTime ? now - lastTime : 16;
    lastTime = now;
    if (elapsedMs < 120) frameAverage = frameAverage * 0.97 + elapsedMs * 0.03;
    if (effectsEnabled()) clock += dt;
    if (home && port.scrollTop <= 8 && playable() && now >= armAfter && !dive && !wheelTail && !pointers.size) {
      armed = true; hero.classList.add('is-armed');
    }
    if (dive) {
      const p = dive.duration ? clamp((now - dive.start) / dive.duration) : 1;
      scrollTo(mix(dive.from, dive.to, ease(p)));
      if (p >= 1) completeDive();
    }
    if (wheelTail && now >= wheelTail.end && (now - wheelTail.last >= 200 || now >= wheelTail.until)) wheelTail = null;
    if (playable() && port.scrollTop <= 8 && !dive && touchPreview === 0 && !multiTouch) {
      game.step(dt, playerInput());
    }
    const activeGame = home && port.scrollTop <= 8 && playable() && game.state !== 'ready';
    const cadence = underwater && !dive ? 1000 / 30 : 0;
    if (now - lastPaint >= cadence || !effectsEnabled()) {
      drawSea(clock);
      drawAmbient(clock);
      drawActor(clock, dt);
      lastPaint = now;
    }
    updateHud(now);
    if (!underwater && effectsEnabled() && frameAverage > 25 && quality > 0.7) {
      if (++slowFrames > 150) { quality = 0.7; resize(); slowFrames = 0; }
    } else slowFrames = 0;
    if (!document.hidden && (dive || wheelTail || effectsEnabled() || activeGame)) raf = requestAnimationFrame(frame);
    else lastTime = 0;
  }
  function wake() {
    if (!raf && !document.hidden) raf = requestAnimationFrame(frame);
  }
  art.onload = correctionArt.onload = () => {
    if (!art.naturalWidth || !correctionArt.naturalWidth) return;
    artReady = true;
    if (play) play.disabled = false;
    body.classList.add('ocean-art-ready');
    updateState();
  };
  art.onerror = correctionArt.onerror = () => {
    artReady = false;
    armed = false;
    hero?.classList.remove('is-armed');
    if (play) play.hidden = true;
    setStatus('The portfolio is ready below. Dive in and explore.');
    updateState();
  };
  if (play) play.disabled = true;
  art.src = 'assets/images/ocean/mermaid-atlas.webp?v=flo-3';
  correctionArt.src = 'assets/images/ocean/mermaid-catch-rise.webp?v=flo-3';
  if (motion.matches) setStatus('Motion is reduced. Choose Play to balance, or dive into the portfolio.');
  resize();
  updateState();
  if (Number.isFinite(initialPosition)) scrollTo(initialPosition);
  else restorePosition();
  window.addEventListener('load', () => {
    // Restore after media sizing has settled, but never override an interaction.
    if (!armed && game.state === 'ready' && !dive) restorePosition();
  }, { once: true });
})();
