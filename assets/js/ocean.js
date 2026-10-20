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
  const touchDevice = matchMedia('(any-pointer: coarse)');
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
  const companion = window.FloMotion ? new window.FloMotion.Companion({
    minY: 90, maxY: Math.max(90, innerHeight - 110), y: innerHeight * 0.56
  }) : null;
  const touch = new Core.TouchIntent();
  const wheel = new Core.WheelIntent();
  const tilt = new Core.TiltInput();
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
  let surfaceActor = { x: innerWidth * 0.66, y: innerHeight * 0.5, width: 280 };
  let readingAnchor = null;
  let visualPose = { name: 'balance', direction: 1 };
  let previousPose = visualPose, poseBlend = 1;
  let guideOpen = false, guideInitialized = false, guideSeen = false;
  let guideTimer = 0, guideFadeTimer = 0;
  let tiltEnabled = false, tiltListening = false, tiltHasReading = false;
  let tiltPending = false, tiltAwaiting = false, tiltRequest = 0, tiltWatchdog = 0;
  let lastSensorAt = 0;
  let companionReady = false, lastScrollY = 0, pointerHeight = null;
  let swimPhase = 0, companionFrame = 8, companionRotation = 0;
  let balanceReady = false, recoveryTime = 0;
  let surfTravel = 0, surfSpeed = 0.42;
  let appliedInput = 0, canStepGame = false, balanceCue = 'Keep Flo centered';
  let pendingCue = balanceCue, pendingCueSince = 0, cueWasActive = false;
  // A quick fin push followed by a longer, floating recovery; one full stroke.
  const swimFrameEnds = [0.13, 0.24, 0.32, 0.40, 0.51, 0.65, 0.82, 1];
  let companionPosition = { x: innerWidth - 56, y: innerHeight * 0.56, width: 112 };
  const pointers = new Set();
  const keys = new Set();
  const scoreEl = document.getElementById('ocean-score');
  const bestEl = document.getElementById('ocean-best');
  const meter = document.getElementById('ocean-balance');
  const marker = meter?.querySelector('.ocean-balance-marker');
  const inputMarker = meter?.querySelector('.ocean-input-marker');
  const balanceOffset = meter?.querySelector('.ocean-balance-offset');
  const balanceCueEl = document.getElementById('ocean-balance-cue');
  const status = document.getElementById('ocean-status');
  const play = document.getElementById('ocean-play');
  const progress = document.getElementById('ocean-dive-progress');
  const guide = document.getElementById('ocean-input-guide');
  const help = document.getElementById('ocean-help');
  const tiltButton = document.getElementById('ocean-enable-tilt');
  const recenter = document.getElementById('ocean-recenter');
  const useTouch = document.getElementById('ocean-use-touch');
  const tiltFeedback = document.getElementById('ocean-tilt-feedback');
  const touchInstructions = document.querySelector('.ocean-touch-instruction');
  const art = new Image();
  const correctionArt = new Image();
  const companionArt = new Image();
  const balanceArt = new Image();
  const breathArt = new Image();
  art.decoding = 'async';
  correctionArt.decoding = 'async';
  companionArt.decoding = 'async';
  balanceArt.decoding = 'async';
  breathArt.decoding = 'async';
  try { game.best = Math.max(0, Math.min(86400, Number(localStorage.getItem('prachi-ocean-best-v1')) || 0)); } catch (_) {}
  oldBest = game.best;
  try { guideSeen = sessionStorage.getItem('prachi-ocean-guide-v1') === 'seen'; } catch (_) {}

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
    // At the surface the pause control scrolls with the complete game scene.
    // A fixed viewport button would cover the HUD on short phone screens.
    const toggleParent = home && !underwater ? hero : shell;
    if (toggle.parentElement !== toggleParent) toggleParent.append(toggle);
    body.classList.toggle('ocean-paused', reasons.size > 0 || pausedByUser);
    body.classList.toggle('ocean-guiding', guideOpen);
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
    syncTiltSensor();
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
    setPaused, scrollTo,
    getCompanion: () => ({
      ...companionPosition, targetY: companion?.targetY ?? companionPosition.y,
      velocity: companion?.velocity || 0, state: companion?.state || 'resting',
      frame: companionFrame, anticipation: companion?.anticipation || 0
    }),
    getBalanceFeedback: () => ({ lean: game.lean, velocity: game.velocity,
      input: appliedInput, state: game.state, cue: balanceCue }),
    getSurfGeometry: () => surfGeometry(clock)
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
    closeGuide();
    finalize();
    armed = false;
    hero.classList.remove('is-armed');
    const now = performance.now();
    const duration = motion.matches || pausedByUser ? 0 : 600;
    dive = { from: port.scrollTop, to: targetTop(site), start: now, duration, source };
    syncTiltSensor();
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
    const scrollDelta = port.scrollTop - lastScrollY;
    lastScrollY = port.scrollTop;
    const next = !home || port.scrollTop >= heroHeight * 0.58;
    if (next !== underwater) {
      underwater = next;
      if (underwater && companion && pointerHeight !== null && effectsEnabled()) companion.point(pointerHeight);
      updateState();
    }
    if (underwater && effectsEnabled()) companion?.scroll(scrollDelta);
    if (home && port.scrollTop > 8) {
      if (guideOpen) closeGuide();
      armed = false;
      hero.classList.remove('is-armed');
      if (!dive && game.state !== 'ready') finalize();
      armAfter = now + 200;
    } else if (!armed) {
      armAfter = now + 200;
      clearTimeout(wakeTimer);
      wakeTimer = setTimeout(wake, 210);
    }
    syncTiltSensor();
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
  document.addEventListener('pointermove', event => {
    if (event.pointerType === 'touch' || !event.isPrimary) return;
    pointerHeight = event.clientY;
    if (!underwater || !effectsEnabled()) return;
    companion?.point(pointerHeight);
    wake();
  }, { passive: true });
  window.addEventListener('pagehide', () => {
    stashPosition(); finalize(); stopTiltSensor();
    tiltRequest++; tiltPending = false;
  });
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
  function markGuideSeen() {
    guideSeen = true;
    try { sessionStorage.setItem('prachi-ocean-guide-v1', 'seen'); } catch (_) {}
  }
  function feedback(text) {
    if (!tiltFeedback) return;
    tiltFeedback.hidden = !text;
    tiltFeedback.textContent = text;
  }
  function tiltUnavailable() {
    if (!window.isSecureContext) return 'Phone tilt needs a secure connection. Touch controls are ready to use.';
    if (!window.DeviceOrientationEvent) return 'Phone tilt is not available in this browser. Use touch to balance.';
    return '';
  }
  function updateInputControls() {
    if (!home) return;
    hero.dataset.input = tiltEnabled ? 'tilt' : 'touch';
    if (tiltButton) {
      tiltButton.disabled = !artReady || tiltPending || !!tiltUnavailable();
      tiltButton.hidden = tiltEnabled && !tiltAwaiting;
      tiltButton.textContent = tiltPending ? 'Waiting for permission…' :
        tiltAwaiting ? 'Finding your balance…' : 'Enable phone tilt';
    }
    if (recenter) recenter.hidden = !tiltEnabled;
    if (useTouch) useTouch.hidden = !tiltEnabled && !tiltPending;
    if (touchInstructions) touchInstructions.textContent = tiltEnabled ?
      'Tilt left / right to balance · Swipe up firmly to dive' :
      'Slide your thumb to balance · Swipe up firmly to dive';
  }
  function showGuide() {
    if (!guide || !home || port.scrollTop > 8 || dive || reasons.size) return;
    clearTimeout(guideTimer);
    clearTimeout(guideFadeTimer);
    guideOpen = true;
    guide.hidden = false;
    guide.classList.remove('is-dissolving');
    help?.setAttribute('aria-expanded', 'true');
    markGuideSeen();
    updateInputControls();
    if (touchDevice.matches) feedback(tiltUnavailable());
    updateState();
    // The hint belongs to the scene: it never takes focus or interrupts play.
    guideTimer = setTimeout(() => {
      guide.classList.add('is-dissolving');
      guideFadeTimer = setTimeout(() => closeGuide(), motion.matches ? 0 : 700);
    }, 8000);
  }
  function closeGuide() {
    clearTimeout(guideTimer);
    clearTimeout(guideFadeTimer);
    if (!guideOpen) return;
    guideOpen = false;
    guide.hidden = true;
    guide.classList.remove('is-dissolving');
    help?.setAttribute('aria-expanded', 'false');
    updateState();
  }
  function stopTiltSensor() {
    if (tiltListening) window.removeEventListener('deviceorientation', onOrientation);
    tiltListening = false;
    tiltHasReading = false;
    clearTimeout(tiltWatchdog);
    tilt.calibrate();
  }
  function disableTilt(message = '') {
    tiltRequest++;
    tiltPending = false; tiltAwaiting = false; tiltEnabled = false;
    stopTiltSensor();
    updateInputControls();
    if (message) { feedback(message); setStatus(message); }
  }
  function sensorWatchdog() {
    if (!tiltListening) return;
    if (performance.now() - lastSensorAt >= 3000) {
      disableTilt('No motion readings are arriving. You can slide your thumb to balance instead.');
      finalize();
      updateState();
      return;
    }
    tiltWatchdog = setTimeout(sensorWatchdog, 1000);
  }
  function syncTiltSensor() {
    const allowed = tiltEnabled && home && artReady && port.scrollTop <= 8 && !dive &&
      !document.hidden && !pausedByUser && !reasons.size;
    if (!allowed) {
      if (tiltListening) stopTiltSensor();
      return;
    }
    if (tiltListening) return;
    tilt.calibrate();
    tiltHasReading = false;
    tiltListening = true;
    lastSensorAt = performance.now();
    window.addEventListener('deviceorientation', onOrientation, { passive: true });
    tiltWatchdog = setTimeout(sensorWatchdog, 1000);
  }
  function screenAngle() {
    const angle = window.screen.orientation?.angle ?? window.orientation ?? 0;
    return Number.isFinite(angle) ? angle : 0;
  }
  function onOrientation(event) {
    if (!tiltListening) return;
    const now = performance.now();
    const result = tilt.sample(event.beta, event.gamma, screenAngle(), now);
    if (!result.valid) return;
    const first = !tiltHasReading;
    tiltHasReading = true;
    lastSensorAt = now;
    if (first) {
      tiltAwaiting = false;
      feedback('');
      updateInputControls();
      setStatus('Tilt gently left and right. This holding position is your center.');
    } else if (Math.abs(result.input) > 0.08 && !touch.active) {
      startGame();
    }
    wake();
  }
  async function enableTilt() {
    if (tiltPending || !artReady) return;
    const unavailable = tiltUnavailable();
    if (unavailable) { feedback(unavailable); return; }
    const request = ++tiltRequest;
    tiltPending = true;
    updateInputControls();
    feedback('Allow motion access, then hold your phone in a comfortable position.');
    try {
      // iOS requires this call directly within the button's user activation.
      const permission = typeof window.DeviceOrientationEvent.requestPermission === 'function' ?
        await window.DeviceOrientationEvent.requestPermission() : 'granted';
      if (request !== tiltRequest) return;
      tiltPending = false;
      if (permission !== 'granted') {
        disableTilt('Motion access was not allowed. Touch controls still work.');
        return;
      }
      playOptIn = true; pausedByUser = false;
      tiltEnabled = true; tiltAwaiting = true;
      input = 0; keys.clear();
      feedback('Hold your phone comfortably for a moment…');
      updateInputControls();
      updateState();
    } catch (_) {
      if (request !== tiltRequest) return;
      disableTilt('Motion access is unavailable. You can use touch controls instead.');
    }
  }
  function recenterTilt() {
    if (!tiltEnabled) return;
    tilt.calibrate();
    tiltHasReading = false;
    game.velocity = 0;
    game.overleanTime = 0;
    setStatus('Hold your phone comfortably. Finding your new center…');
    wake();
  }
  help?.addEventListener('click', showGuide);
  tiltButton?.addEventListener('click', enableTilt);
  useTouch?.addEventListener('click', () => {
    disableTilt();
    playOptIn = true; pausedByUser = false;
    updateState();
    setStatus('Slide your thumb left and right to balance.');
  });
  recenter?.addEventListener('click', recenterTilt);
  window.screen.orientation?.addEventListener('change', recenterTilt);
  window.addEventListener('orientationchange', recenterTilt);
  function startGame() {
    if (!playable() || port.scrollTop > 8 || dive) return;
    if (game.state !== 'ready') return;
    game.start();
    setStatus('Small opposite corrections, then ease off.');
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
      if (event.key === 'Escape') closeGuide();
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
  function layoutActor() {
    if (!hero) return;
    const mobile = narrow.matches;
    const landscape = mobile && viewportWidth > viewportHeight && viewportHeight <= 650;
    const heroTop = hero.getBoundingClientRect().top;
    const introBottom = hero.querySelector('.ocean-introduction').getBoundingClientRect().bottom - heroTop;
    const headerBottom = hero.querySelector('.ocean-surface-header').getBoundingClientRect().bottom - heroTop;
    const hudHeight = hero.querySelector('.ocean-hud').getBoundingClientRect().height;
    const aspect = poses.balance[2] / poses.balance[3];
    const actorTop = mobile && !landscape ? introBottom + 4 : Math.max(headerBottom + 12, heroHeight * 0.12);
    const meterGap = landscape ? 4 : 8;
    const bottomSpace = landscape ? 12 : mobile ? 88 : 56;
    const room = Math.max(90, heroHeight - actorTop - hudHeight - bottomSpace - meterGap);
    // Full scene budget: Flo plus the natural 1.6:1 wave below her tail.
    // Keep its submerged base above the meter and score, even on short phones.
    const sceneRatio = 0.78 + aspect * 1.48 / 1.6;
    const height = Math.min(room / sceneRatio, heroHeight * (mobile ? 0.62 : 0.64),
      viewportWidth * (mobile && !landscape ? 0.82 : 0.38) / aspect);
    const x = port.clientWidth * (mobile && !landscape ? 0.5 : 0.68);
    const y = actorTop + height / 2;
    surfaceActor = { x, y, width: height * aspect };
    // The scene and the HTML meter share a single layout anchor on every size.
    hero.style.setProperty('--ocean-actor-x', `${x}px`);
    hero.style.setProperty('--ocean-actor-y', `${y}px`);
    hero.style.setProperty('--ocean-actor-width', `${height * aspect}px`);
    hero.style.setProperty('--ocean-hud-y', `${actorTop + height * sceneRatio + meterGap + 8}px`);
  }
  function surfGeometry(t) {
    const riderHeight = surfaceActor.width / (360 / 510);
    const width = surfaceActor.width * 1.48;
    const bob = motion.matches ? 0 : Math.sin(t * 1.5) * 3 + Math.sin(t * 2.4 + 0.4) * 1.5;
    return {
      x: surfaceActor.x,
      crestY: surfaceActor.y + riderHeight * 0.28 + bob,
      width, height: width / 1.6, bob,
      travel: surfTravel, speed: motion.matches ? 0 : surfSpeed,
      forwardLean: motion.matches ? 0 : surfSpeed * 0.03
    };
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
    layoutActor();
    const margin = narrow.matches ? 58 : 80;
    companion?.setBounds(margin, Math.max(margin, viewportHeight - margin - 54));
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
  if (hero && window.ResizeObserver) {
    const hudObserver = new ResizeObserver(() => { layoutActor(); wake(); });
    hudObserver.observe(hero.querySelector('.ocean-hud'));
    hudObserver.observe(hero.querySelector('.ocean-introduction'));
    hudObserver.observe(hero.querySelector('.ocean-surface-header'));
  }

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
  /**
   * One natural breaking crest over a broad, submerged shoulder.
   * x/crestY is the fixed rider contact. Bounds are x + [-.64, .36] * width
   * and crestY + [-.015, 1] * height. t=0 gives a still reduced-motion frame.
   */
  function drawSurfWave(ctx, x, crestY, width, height, t) {
    if (!ctx || !(width > 0) || !(height > 0)) return;
    const time = Number.isFinite(t) ? t : 0;
    // Only the unsupported lip breathes; the rider's shoulder never slides.
    const curl = Math.sin(time * 1.13) * 0.007 + Math.sin(time * 2.37) * 0.003;
    ctx.save();
    ctx.translate(x, crestY);
    ctx.scale(width, height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    function silhouette() {
      ctx.beginPath();
      ctx.moveTo(-0.64, 0.96);
      // The low trailing base climbs in one long, tapering shoulder.
      ctx.bezierCurveTo(-0.42, 0.93, -0.29, 0.74, -0.18, 0.40);
      ctx.bezierCurveTo(-0.10, 0.14, -0.08, 0.015, 0, 0);
      // A single round lip overhangs the concave forward face.
      ctx.bezierCurveTo(0.08, -0.015, 0.17, 0.00, 0.225, 0.065 + curl);
      ctx.bezierCurveTo(0.275, 0.125 + curl, 0.25, 0.205, 0.20, 0.205);
      ctx.bezierCurveTo(0.165, 0.205, 0.158, 0.17, 0.175, 0.145);
      ctx.bezierCurveTo(0.115, 0.19, 0.095, 0.37, 0.105, 0.53);
      ctx.bezierCurveTo(0.12, 0.79, 0.225, 0.92, 0.36, 0.91);
      ctx.bezierCurveTo(0.29, 1.00, -0.35, 1.00, -0.64, 0.96);
      ctx.closePath();
    }

    // Alpha disappears below the waterline instead of outlining a cutout base.
    const body = ctx.createLinearGradient(0, 0, 0, 1);
    body.addColorStop(0, '#78d4cd');
    body.addColorStop(0.16, '#2c9cab');
    body.addColorStop(0.42, '#136e8c');
    body.addColorStop(0.70, '#165f7b');
    body.addColorStop(0.86, '#247f8bb0');
    body.addColorStop(1, '#248a9900');
    silhouette(); ctx.fillStyle = body; ctx.fill();

    ctx.save();
    silhouette(); ctx.clip();
    // Soft face ribbons follow the same sweep as the reference silhouette.
    const shoulder = ctx.createLinearGradient(-0.20, 0.12, -0.20, 0.98);
    shoulder.addColorStop(0, '#a0e2d57d');
    shoulder.addColorStop(0.55, '#72cfc647');
    shoulder.addColorStop(1, '#72cfc600');
    ctx.fillStyle = shoulder;
    ctx.beginPath();
    ctx.moveTo(-0.61, 0.96);
    ctx.bezierCurveTo(-0.36, 0.85, -0.22, 0.38, -0.065, 0.10);
    ctx.bezierCurveTo(-0.15, 0.41, -0.18, 0.80, -0.43, 0.98);
    ctx.closePath(); ctx.fill();
    const hollow = ctx.createLinearGradient(0.1, 0.16, 0.1, 0.98);
    hollow.addColorStop(0, '#073d645a');
    hollow.addColorStop(0.66, '#073d6435');
    hollow.addColorStop(1, '#073d6400');
    ctx.fillStyle = hollow;
    ctx.beginPath();
    ctx.moveTo(0.17, 0.14);
    ctx.bezierCurveTo(-0.015, 0.33, -0.09, 0.72, 0.08, 0.98);
    ctx.lineTo(0.36, 0.98);
    ctx.lineTo(0.31, 0.47);
    ctx.closePath(); ctx.fill();

    // Short ribbons travel up the face; each fades at both ends of its route.
    // Separate deterministic phases avoid moving the whole wave as one shape.
    function facePoint(p, lane) {
      const q = 1 - p;
      return {
        x: q * q * q * -0.57 + 3 * q * q * p * -0.30 +
          3 * q * p * p * -0.23 + p * p * p * 0.08 + lane,
        y: q * q * q * 0.97 + 3 * q * q * p * 0.84 +
          3 * q * p * p * 0.17 + p * p * p * 0.075
      };
    }
    for (let i = 0; i < 10; i++) {
      const phase = (time * (0.19 + i % 3 * 0.013) + i * 0.173) % 1;
      const lane = ((i * 7) % 5 - 2) * 0.024;
      const a = facePoint(Math.max(0, phase - 0.115), lane);
      const b = facePoint(Math.max(0, phase - 0.055), lane);
      const c = facePoint(phase, lane);
      const opacity = Math.sin(phase * Math.PI) * 0.45;
      ctx.strokeStyle = `rgba(172,233,218,${opacity})`;
      ctx.lineWidth = (i % 3 === 0 ? 1.6 : 0.9) / height;
      ctx.beginPath(); ctx.moveTo(a.x, a.y);
      ctx.quadraticCurveTo(b.x, b.y, c.x, c.y); ctx.stroke();
    }
    ctx.restore();

    // The broad turquoise cap rolls into one rounded hook, with no crossbar.
    ctx.strokeStyle = '#8edbd1';
    ctx.lineWidth = 0.046;
    ctx.beginPath();
    ctx.moveTo(-0.20, 0.48);
    ctx.bezierCurveTo(-0.12, 0.22, -0.09, 0.035, 0, 0.015);
    ctx.bezierCurveTo(0.11, -0.004, 0.25, 0.055 + curl, 0.24, 0.14 + curl);
    ctx.bezierCurveTo(0.235, 0.19, 0.19, 0.205, 0.18, 0.17);
    ctx.stroke();
    ctx.strokeStyle = '#e1f4df';
    ctx.lineWidth = 0.016;
    ctx.beginPath();
    ctx.moveTo(-0.16, 0.32);
    ctx.bezierCurveTo(-0.10, 0.12, -0.065, 0.013, 0, 0.008);
    ctx.bezierCurveTo(0.11, -0.007, 0.21, 0.035 + curl, 0.237, 0.10 + curl);
    ctx.stroke();
    ctx.strokeStyle = '#d5f2e4b8';
    ctx.lineWidth = 0.010;
    ctx.setLineDash([0.018, 0.028, 0.010, 0.045]);
    ctx.lineDashOffset = -time * 0.055;
    ctx.beginPath();
    ctx.moveTo(-0.22, 0.53);
    ctx.bezierCurveTo(-0.13, 0.27, -0.09, 0.035, 0.01, 0.026);
    ctx.bezierCurveTo(0.14, 0.014, 0.23, 0.08 + curl, 0.22, 0.16);
    ctx.stroke();
    ctx.setLineDash([]);

    // A few flecks peel from the lip and dissolve into its forward face.
    for (let i = 0; i < 12; i++) {
      const p = (time * (0.30 + i % 3 * 0.017) + i * 0.147) % 1;
      const px = 0.20 + p * 0.11 + Math.sin(i * 2.399) * 0.014;
      const py = 0.14 + p * p * 0.38 + curl;
      const alpha = Math.sin(p * Math.PI) * 0.60;
      const radius = 0.65 + i % 3 * 0.45;
      ctx.fillStyle = `rgba(225,244,223,${alpha})`;
      ctx.beginPath();
      ctx.ellipse(px, py, radius / width, radius / height, -0.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
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
    // A separate, continuous travel clock eases into the ride on play. Distant
    // glints move slowly; nearby foam slips down-left, behind the rightward curl.
    const travel = motion.matches ? 0 : surfTravel;
    const flow = t * 0.018 + travel * 0.12;
    const bands = [
      [0.575, 4, '#76bdc0', 0.36], [0.63, 9, '#4eacb4', 0.5],
      [0.71, 15, '#369bab', 0.68], [0.80, 21, '#57b5ba', 0.82],
      [0.89, 18, '#1c8190', 0.7]
    ];
    bands.forEach(([level, amp, color, speed], index) => {
      const y = h * level, phase = t * speed * 0.28 + travel * speed * 1.55 + index * 2.1;
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
    // Draw reflections over the opaque sea bands so their slow forward flow
    // remains visible between the faster foreground streaks.
    for (let i = 0; i < 24; i++) {
      const p = (i / 24 + t * 0.012 + travel * 0.022) % 1, y = horizon + p * p * h * 0.29;
      const length = (12 + p * 95) * (0.65 + 0.35 * Math.sin(i * 7.2));
      const x = sunX + Math.sin(i * 4.3) * (5 + p * 65) - p * p * 26;
      ctx.strokeStyle = `rgba(255,239,184,${0.28 * Math.sin(p * Math.PI)})`;
      ctx.lineWidth = 1.2 + p * 1.6;
      ctx.beginPath(); ctx.moveTo(x - length, y); ctx.lineTo(x + length, y); ctx.stroke();
    }
    const surf = surfGeometry(t);
    // Foam streams toward the lower-left as the camera travels with Flo.
    // Quadratic depth gives nearby streaks more speed and length than distant
    // ones. They fade at the loop seam instead of visibly wrapping on screen.
    for (let i = 0; i < 40; i++) {
      const p = (i * 0.61803398875 + flow * (1 + i % 3 * 0.07)) % 1;
      const depth = p * p;
      const lane = ((i * 47) % 101) / 100;
      const y = horizon + depth * (h - horizon);
      const x = lane * w * 1.65 - w * 0.06 - depth * w * 0.48;
      const length = 4 + depth * (28 + i % 5 * 9);
      const alpha = Math.sin(p * Math.PI) * (0.18 + depth * 0.28);
      ctx.strokeStyle = `rgba(205,239,224,${alpha})`;
      ctx.lineWidth = 0.7 + depth * 1.5;
      ctx.beginPath();
      ctx.moveTo(x + length * 0.55, y - length * 0.12);
      ctx.quadraticCurveTo(x, y - 1.5, x - length * 0.55, y + length * 0.12);
      ctx.stroke();
    }
    // Flo and the wave share one crest contact and the same subtle root motion.
    drawSurfWave(ctx, surf.x, surf.crestY, surf.width, surf.height, t * 0.55 + travel * 1.15);
    // A spreading wake peels off the shoulder and trails down-left into the
    // water. Its whole route remains within the wave's space above the HUD.
    for (let i = 0; i < 7; i++) {
      const p = (t * 0.06 + travel * 0.43 + i / 7) % 1;
      const y = surf.crestY + surf.height * (0.73 + p * 0.24);
      const x = surf.x - surf.width * (0.11 + p * 0.37);
      const length = surf.width * (0.035 + p * 0.11);
      ctx.strokeStyle = `rgba(202,242,225,${Math.sin(p * Math.PI) * 0.48})`;
      ctx.lineWidth = 0.8 + p * 1.3;
      ctx.beginPath();
      ctx.moveTo(x + length, y - surf.height * 0.025);
      ctx.quadraticCurveTo(x, y - surf.height * 0.012, x - length, y + surf.height * 0.014);
      ctx.stroke();
    }
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
      const x = surfaceActor.x, y = surfaceActor.y + surfaceActor.width / (360 / 510) / 2;
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
  const balanceAnchors = [[225, 343], [252, 347], [274, 350], [257.5, 347],
    [247, 327.5], [250.5, 330.5], [247, 331.5], [242.5, 331.5]];
  function breathAmount(t) {
    if (motion.matches) return 0;
    const phase = t % 3.8;
    if (phase < 1.2) return ease(phase / 1.2);
    if (phase < 1.35) return 1;
    if (phase < 3.15) return 1 - ease((phase - 1.35) / 1.8);
    return 0;
  }
  function breathingLines(x, y, width, rotation, alpha, t) {
    if (!breathArt.naturalWidth || motion.matches || alpha <= 0) return;
    const breath = breathAmount(t);
    const size = width * (1.1 + breath * 0.06);
    actorCtx.save();
    actorCtx.translate(x, y);
    actorCtx.rotate(rotation);
    actorCtx.globalAlpha = alpha * breath * 0.32;
    actorCtx.drawImage(breathArt, -size / 2, -size / 2, size, size);
    actorCtx.restore();
  }
  function sprite(pose, x, y, width, rotation, alpha, t, direction = 1) {
    if (alpha <= 0) return;
    if (balanceReady && (pose === 'balance' || pose === 'lean' || pose === 'catch')) {
      const frame = pose === 'lean' ? (Math.abs(game.lean) > 0.52 ? 2 : 1) :
        pose === 'catch' ? (Math.abs(game.lean) > 0.5 ? 4 : 3) :
        recoveryTime > 0 ? (recoveryTime > 0.24 ? 5 : recoveryTime > 0.12 ? 6 : 7) : 0;
      const cell = balanceArt.naturalWidth / 4;
      const height = width * 510 / 360, scale = height / 413;
      const [ax, ay] = balanceAnchors[frame];
      actorCtx.save();
      actorCtx.globalAlpha = alpha;
      actorCtx.translate(x, y);
      // Incline into forward travel around the tail contact, rather than
      // swinging the contact off the crest when Flo changes her balance.
      actorCtx.translate(0, height * 0.28);
      actorCtx.rotate(rotation);
      actorCtx.translate(0, -height * 0.28);
      actorCtx.scale(direction, 1);
      const breath = breathAmount(t);
      actorCtx.translate(0, height * 0.28);
      actorCtx.scale(1 + breath * 0.004, 1 + breath * 0.008);
      actorCtx.translate(0, -height * 0.28);
      // Register the narrow tail junction on the wave; changing drawings
      // must never make the character's contact slide across the crest.
      actorCtx.drawImage(balanceArt, frame % 4 * cell, Math.floor(frame / 4) * cell,
        cell, cell, -ax * scale, height * 0.28 - ay * scale, cell * scale, cell * scale);
      actorCtx.restore();
      return;
    }
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
    if (left || right) return Number(right) - Number(left);
    if (touchId !== null) return input;
    return tiltEnabled ? tilt.read(performance.now()) : input;
  }
  function anticipationWindup() {
    // First notice and hold the thought. The small counter-motion occupies
    // only the final part of the beat and releases before continuous travel.
    const progress = clamp(((companion?.anticipation || 0) - 0.52) / 0.48);
    return Math.sin(Math.PI * ease(progress));
  }
  function drawCompanion(x, y, width, alpha, t) {
    if (!alpha) return;
    const state = companion?.state || 'resting';
    if (companionReady) {
      // Visual samples run separately from continuous root movement.
      // Eight ordered swim drawings, then rest / look up / look down / blink.
      const moving = state === 'swimming' || (state === 'settling' && companion.energy > 0.12);
      companionFrame = moving ? swimFrameEnds.findIndex(end => swimPhase < end) :
        state === 'anticipating' || state === 'looking' ? (companion.direction < 0 ? 9 : 10) :
        t % 5.7 > 5.52 ? 11 : 8;
      const sw = companionArt.naturalWidth / 4, sh = companionArt.naturalHeight / 3;
      const height = width * sh / sw;
      const windup = anticipationWindup();
      y -= (companion?.direction || 1) * windup * width * 0.022;
      actorCtx.save();
      actorCtx.globalAlpha = alpha;
      actorCtx.translate(x, y);
      actorCtx.rotate(companionRotation);
      const breath = moving ? 0 : breathAmount(t);
      actorCtx.translate(0, height * 0.2);
      actorCtx.scale(1 + breath * 0.004 + windup * 0.008, 1 + breath * 0.008 - windup * 0.015);
      actorCtx.translate(0, -height * 0.2);
      actorCtx.drawImage(companionArt, companionFrame % 4 * sw,
        Math.floor(companionFrame / 4) * sh, sw, sh, -width / 2, -height / 2, width, height);
      actorCtx.restore();
      if (!moving) breathingLines(x, y - height * 0.12, width, companionRotation, alpha * 0.7, t);
    } else {
      sprite('swim', x, y, width * 0.8, companionRotation, alpha, t);
    }
  }
  function drawActor(t, dt) {
    const ctx = actorCtx, w = viewportWidth, h = viewportHeight;
    ctx.clearRect(0, 0, w, h);
    if (!artReady || reasons.size) return;
    const p = home ? clamp(port.scrollTop / Math.max(1, targetTop(site))) : 1;
    const q = motion.matches ? (underwater ? 1 : 0) : ease(p);
    const mobile = narrow.matches;
    const laneWidth = mobile ? 76 : 112;
    const destination = {
      x: w - laneWidth / 2,
      y: companion?.y ?? h * 0.56,
      width: mobile ? 78 : 114
    };
    companionPosition = destination;
    const initialWidth = surfaceActor.width;
    let x = mix(surfaceActor.x, destination.x, q);
    let y = mix(surfaceActor.y, destination.y, q);
    let width = mix(initialWidth, destination.width, q);
    const surfing = game.state === 'ready' || game.state === 'balancing';
    // Actual balance takes precedence over the small neutral surfing posture.
    const forwardLean = surfing ? surfGeometry(t).forwardLean * clamp(1 - Math.abs(game.lean) / 0.3) : 0;
    let rotation = (1 - q) * (game.lean * 0.14 + forwardLean);
    const bob = motion.matches ? 0 : mix(surfGeometry(t).bob, Math.sin(t * 1.5) * 1.5, q);
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
        const balance = Core.getBalancePose(game.lean, game.velocity, appliedInput);
        if (balance.weight > 0.2) {
          pose = balance.pose;
          direction = balance.direction;
        }
      }
    }
    // A brief dissolve connects drawings; each directional drawing is mirrored
    // around the same anchor so left/right actions retain identical anatomy.
    if (visualPose.name !== pose || visualPose.direction !== direction) {
      if (pose === 'balance' && (visualPose.name === 'lean' || visualPose.name === 'catch')) recoveryTime = 0.36;
      previousPose = visualPose;
      visualPose = { name: pose, direction };
      poseBlend = 0;
    }
    poseBlend = clamp(poseBlend + (isPaused() ? 0 : dt) / 0.12);
    if (motion.matches && !playOptIn) poseBlend = 1;
    const blend = clamp((q - 0.08) / 0.7);
    sprite(previousPose.name, x, y, width, rotation, (1 - blend) * opacity * (1 - poseBlend), t, previousPose.direction);
    sprite(visualPose.name, x, y, width, rotation, (1 - blend) * opacity * poseBlend, t, visualPose.direction);
    if (pose !== 'fall' && pose !== 'rise') {
      breathingLines(x, y - width * 0.2, width, rotation, (1 - blend) * opacity, t);
    }
    drawCompanion(x, y, width, blend, t);
  }
  function updateHud(now) {
    if (!home) return;
    const lean = clamp(game.lean, -1, 1);
    // Input must feel immediate. Neither marker waits on score/text updates
    // or uses a CSS transition that would hide the relationship to momentum.
    marker.style.left = `${50 + lean * 46}%`;
    inputMarker.style.left = `${50 + appliedInput * 46}%`;
    balanceOffset.style.left = `${50 + Math.min(lean, 0) * 46}%`;
    balanceOffset.style.width = `${Math.abs(lean) * 46}%`;
    meter.classList.toggle('is-danger', Math.abs(lean) > 0.72);
    const cueActive = canStepGame && game.state === 'balancing';
    const nextCue = cueActive ? Core.getBalanceFeedback(game.lean, game.velocity, appliedInput) :
      isPaused() ? 'Paused' : 'Keep Flo centered';
    if (nextCue !== pendingCue) { pendingCue = nextCue; pendingCueSince = now; }
    // Stabilize small changes in advice, but do not delay the first cue,
    // pause state or an urgent correction near the edge of balance.
    if (!cueActive || !cueWasActive || Math.abs(lean) > 0.72 || now - pendingCueSince >= 180) {
      if (balanceCue !== nextCue) {
        balanceCue = nextCue;
        balanceCueEl.textContent = balanceCue;
      }
    }
    cueWasActive = cueActive;
    if (now - lastHud < 100 && !isPaused()) return;
    lastHud = now;
    scoreEl.textContent = game.elapsed.toFixed(1);
    bestEl.textContent = Math.max(game.best, game.state === 'balancing' ? game.elapsed : 0).toFixed(1);
    meter.setAttribute('aria-valuenow', String(Math.round(lean * 100)));
    const leanText = Math.abs(lean) < 0.18 ? 'Flo centered' : `Flo leaning ${lean < 0 ? 'left' : 'right'} ${Math.round(Math.abs(lean) * 100)} percent`;
    const inputText = Math.abs(appliedInput) < 0.02 ? 'your correction neutral' : `your correction ${appliedInput < 0 ? 'left' : 'right'} ${Math.round(Math.abs(appliedInput) * 100)} percent`;
    meter.setAttribute('aria-valuetext', `${leanText}; ${inputText}; ${balanceCue}`);
    if (game.state !== lastState) {
      if (game.state === 'falling') setStatus('Splash! Every wave is a fresh start.');
      if (game.state === 'resurfacing') setStatus('Coming back up…');
      if (game.state === 'balancing') setStatus('Small opposite corrections, then ease off.');
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
    if (effectsEnabled()) {
      clock += dt;
      if (home && !underwater) {
        const targetSpeed = game.state === 'balancing' ? 1 : game.state === 'ready' ? 0.42 : 0.6;
        surfSpeed += (targetSpeed - surfSpeed) * (1 - Math.exp(-dt * 2.4));
        surfTravel += dt * surfSpeed;
      }
    }
    if (!isPaused()) recoveryTime = Math.max(0, recoveryTime - dt);
    if (effectsEnabled() && underwater && companion) {
      const previousState = companion.state;
      companion.step(dt);
      if (previousState === 'anticipating' && companion.state === 'swimming') swimPhase = 0;
      if (companion.state === 'swimming' || companion.state === 'settling') {
        swimPhase = (swimPhase + dt * (1.15 + companion.energy * 0.7)) % 1;
      }
      const pitch = (companion.state === 'swimming' || companion.state === 'settling') ?
        -companion.direction * companion.energy * 0.48 :
        companion.state === 'anticipating' ? companion.direction * 0.1 * anticipationWindup() : 0;
      companionRotation += (pitch - companionRotation) * (1 - Math.exp(-dt * 7));
    }
    if (home && port.scrollTop <= 8 && playable() && now >= armAfter && !dive && !wheelTail && !pointers.size) {
      armed = true; hero.classList.add('is-armed');
    }
    if (dive) {
      const p = dive.duration ? clamp((now - dive.start) / dive.duration) : 1;
      scrollTo(mix(dive.from, dive.to, ease(p)));
      if (p >= 1) completeDive();
    }
    if (wheelTail && now >= wheelTail.end && (now - wheelTail.last >= 200 || now >= wheelTail.until)) wheelTail = null;
    const sensorReady = !tiltEnabled || touch.active || keys.size ||
      (tiltHasReading && now - lastSensorAt <= 500);
    canStepGame = playable() && sensorReady && port.scrollTop <= 8 && !dive && touchPreview === 0 && !multiTouch;
    appliedInput = canStepGame && game.state === 'balancing' ? playerInput() : 0;
    if (canStepGame) game.step(dt, appliedInput);
    if (game.state !== 'balancing') appliedInput = 0;
    const activeGame = home && port.scrollTop <= 8 && playable() && game.state !== 'ready';
    const cadence = underwater && !dive ? 1000 / 30 : 0;
    if (now - lastPaint >= cadence || !effectsEnabled()) {
      drawSea(clock);
      drawAmbient(clock);
      lastPaint = now;
    }
    // Root movement is painted every display frame, independently of the
    // cheaper 30 Hz background and the authored sprite cadence.
    drawActor(clock, dt);
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
    updateInputControls();
    updateState();
    if (!guideInitialized) {
      guideInitialized = true;
      if (!guideSeen && !location.hash && !(initialPosition > 8) && port.scrollTop <= 8) showGuide();
    }
  };
  art.onerror = correctionArt.onerror = () => {
    artReady = false;
    disableTilt();
    closeGuide();
    armed = false;
    hero?.classList.remove('is-armed');
    if (play) play.hidden = true;
    setStatus('The portfolio is ready below. Dive in and explore.');
    updateState();
  };
  if (play) play.disabled = true;
  updateInputControls();
  art.src = 'assets/images/ocean/mermaid-atlas.webp?v=flo-3';
  correctionArt.src = 'assets/images/ocean/mermaid-catch-rise.webp?v=flo-3';
  companionArt.onload = () => {
    companionReady = true;
    body.classList.add('ocean-companion-art-ready');
    wake();
  };
  companionArt.onerror = () => { companionReady = false; wake(); };
  companionArt.src = 'assets/images/ocean/flo-companion.webp?v=20261020';
  balanceArt.onload = () => { balanceReady = true; body.classList.add('ocean-balance-art-ready'); wake(); };
  balanceArt.onerror = () => { balanceReady = false; wake(); };
  balanceArt.src = 'assets/images/ocean/flo-balance-atlas-v1.webp?v=20261020';
  breathArt.onload = wake;
  breathArt.src = 'assets/images/ocean/flo-breathing-lines.svg';
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
