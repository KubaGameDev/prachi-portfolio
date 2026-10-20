/* Local refraction: neutral displacement outside expanding underwater ripples. */
(() => {
  const ocean = window.Ocean;
  const content = document.querySelector('.site-wrap');
  if (!content) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const coarse = matchMedia('(pointer: coarse)');
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('aria-hidden', 'true');
  svg.style.cssText = 'position:absolute;width:0;height:0;pointer-events:none';
  const defs = document.createElementNS(ns, 'defs');
  svg.append(defs);
  document.body.append(svg);
  const map = document.createElement('canvas');
  const ctx = map.getContext('2d');
  if (!ctx) return;

  const controls = 'nav,.site-header,.responsive-nav,dialog,button,input,select,textarea,' +
    '[contenteditable="true"],[role="slider"],[role="switch"],.js-hamburger,' +
    '.js-close-responsive-nav,.back-to-top,.back-to-top-fixed,[data-no-ripple]';
  // Keep artwork and its caption together; gallery tiles remain separate panels.
  const candidates = [...content.querySelectorAll(
    '.masthead,.page-header,.project-cover,.grid__item-container,.project-module'
  )].filter(el => !el.closest(controls) &&
    !el.querySelector('nav,form,button,input,select,textarea') &&
    (!el.matches('.project-module') || !el.querySelector('.grid__item-container')));
  const panels = candidates.filter(el => !candidates.some(parent => parent !== el && parent.contains(el)));
  const radial = new Float32Array(192);
  let waves = [], targets = [], frame = 0, lastFrame = 0, lastPoint = null;
  let needsCollect = false, pixels = null, neutral = null, nextFilterId = 0;
  const getScroll = () => ocean ? ocean.getScroll() : {x:scrollX,y:scrollY};
  const getViewport = () => ocean ? ocean.getViewport() : {left:0,top:0,width:innerWidth,height:innerHeight};
  const allowed = () => !reduced.matches && !document.hidden &&
    !document.body.classList.contains('local-nav-open') &&
    !document.querySelector('.local-lightbox[open]') &&
    (!ocean || (!ocean.isPaused() && ocean.effectsEnabled() && ocean.isUnderwater()));

  function reset() {
    cancelAnimationFrame(frame);
    frame = 0;
    lastFrame = 0;
    waves.length = 0;
    lastPoint = null;
    needsCollect = false;
    targets.forEach(t => {t.el.style.filter = t.original;});
    targets = [];
    defs.replaceChildren();
  }

  function collect(viewport) {
    const previous = new Map(targets.map(target => [target.el,target]));
    const next = [];
    for (const el of panels) {
      if (!el.isConnected) continue;
      const rect = el.getBoundingClientRect();
      if (!rect.width || !rect.height || rect.bottom <= viewport.top ||
          rect.top >= viewport.top + viewport.height || rect.right <= viewport.left ||
          rect.left >= viewport.left + viewport.width) continue;
      let target = previous.get(el);
      if (target) {
        previous.delete(el);
      } else {
        const filter = document.createElementNS(ns, 'filter');
        filter.id = `pond-${nextFilterId++}`;
        for (const [key,value] of Object.entries({
          filterUnits:'userSpaceOnUse',primitiveUnits:'userSpaceOnUse',
          x:0,y:0,'color-interpolation-filters':'sRGB'
        })) filter.setAttribute(key,value);
        const source = document.createElementNS(ns, 'feImage');
        source.setAttribute('preserveAspectRatio','none');
        source.setAttribute('result','ripples');
        const displacement = document.createElementNS(ns, 'feDisplacementMap');
        for (const [key,value] of Object.entries({
          in:'SourceGraphic',in2:'ripples',scale:18,xChannelSelector:'R',yChannelSelector:'G'
        })) displacement.setAttribute(key,value);
        filter.append(source,displacement);
        defs.append(filter);
        target = {el,filter,source,id:filter.id,original:el.style.filter};
      }
      target.filter.setAttribute('width',rect.width);
      target.filter.setAttribute('height',rect.height);
      for (const [key,value] of Object.entries({
        x:viewport.left-rect.left,y:viewport.top-rect.top,
        width:viewport.width,height:viewport.height
      })) target.source.setAttribute(key,value);
      next.push(target);
    }
    previous.forEach(target => {
      target.el.style.filter = target.original;
      target.filter.remove();
    });
    targets = next;
  }

  function draw(now) {
    frame = 0;
    if (!allowed()) {reset();return;}
    if (now-lastFrame < (coarse.matches ? 40 : 32)) {
      frame = requestAnimationFrame(draw);
      return;
    }
    lastFrame = now;
    let liveCount = 0;
    for (const wave of waves) if (now-wave.time < 950) waves[liveCount++] = wave;
    waves.length = liveCount;
    if (!waves.length) {reset();return;}
    const viewport = getViewport();
    if (!viewport.width || !viewport.height) {reset();return;}
    if (needsCollect) {collect(viewport);needsCollect=false;}
    if (!targets.length) {reset();return;}
    // Keep the original displacement resolution, with a ceiling for wide screens.
    const scale = Math.min(coarse.matches ? .3 : .4,
      Math.sqrt(160000/(viewport.width*viewport.height)));
    const width = Math.ceil(viewport.width*scale), height = Math.ceil(viewport.height*scale);
    if (map.width !== width || map.height !== height || !pixels) {
      map.width = width;
      map.height = height;
      pixels = ctx.createImageData(width,height);
      neutral = new Uint8ClampedArray(pixels.data.length);
      for (let i=0;i<neutral.length;i+=4) {
        neutral[i]=128;neutral[i+1]=128;neutral[i+2]=128;neutral[i+3]=255;
      }
    }
    const data = pixels.data;
    data.set(neutral);
    const scroll = getScroll();
    const inverseScale = 1/scale;
    for (const wave of waves) {
      const age = (now-wave.time)/950, radius = 8+age*90, extent = radius+22;
      const centerX = wave.x-scroll.x, centerY = wave.y-scroll.y;
      const left = Math.max(0,Math.floor((centerX-extent)*scale));
      const right = Math.min(width,Math.ceil((centerX+extent)*scale));
      const top = Math.max(0,Math.floor((centerY-extent)*scale));
      const bottom = Math.min(height,Math.ceil((centerY+extent)*scale));
      if (left >= right || top >= bottom) continue;
      // Reuse the radial force curve instead of evaluating exp/sin for every pixel.
      const fade = (1-age)*(1-age)*36;
      const radialLimit = Math.min(radial.length-1,Math.ceil(extent*Math.SQRT2)+2);
      for (let distance=0;distance<=radialLimit;distance++) {
        const offset = distance-radius;
        radial[distance] = Math.sin(offset/5)*Math.exp(-(offset*offset)/256)*fade;
      }
      for (let y=top;y<bottom;y++) {
        const dy = y*inverseScale-centerY;
        for (let x=left;x<right;x++) {
          const dx = x*inverseScale-centerX, distance = Math.sqrt(dx*dx+dy*dy);
          if (distance < 1 || distance >= radialLimit) continue;
          const lower = Math.floor(distance), fraction = distance-lower;
          const force = radial[lower]+(radial[lower+1]-radial[lower])*fraction;
          const i = (y*width+x)*4;
          data[i] += force*dx/distance;
          data[i+1] += force*dy/distance;
        }
      }
    }
    ctx.putImageData(pixels,0,0);
    const url = map.toDataURL();
    targets.forEach(target => {
      target.source.setAttribute('href',url);
      target.el.style.filter = `url(#${target.id})`;
    });
    frame = requestAnimationFrame(draw);
  }

  function acceptsTarget(target) {
    return target instanceof Element && content.contains(target) && !target.closest(controls);
  }

  function trace(samples) {
    if (!allowed()) {lastPoint=null;return;}
    const viewport = getViewport(), scroll = getScroll(), time = performance.now();
    for (const sample of samples) {
      if (sample.clientX < viewport.left || sample.clientX > viewport.left+viewport.width ||
          sample.clientY < viewport.top || sample.clientY > viewport.top+viewport.height) {
        lastPoint = null;
        continue;
      }
      // Store content coordinates so the ripple follows the artwork during scrolling.
      const point = {x:sample.clientX-viewport.left+scroll.x,y:sample.clientY-viewport.top+scroll.y};
      const distance = lastPoint ? Math.hypot(point.x-lastPoint.x,point.y-lastPoint.y) : 0;
      const count = Math.min(12,Math.max(1,Math.ceil(distance/12)));
      for (let i=1;i<=count;i++) {
        const t = i/count;
        waves.push({
          x:lastPoint ? lastPoint.x+(point.x-lastPoint.x)*t : point.x,
          y:lastPoint ? lastPoint.y+(point.y-lastPoint.y)*t : point.y,time
        });
      }
      lastPoint = point;
    }
    const limit = coarse.matches ? 24 : 40;
    if (waves.length > limit) waves.splice(0,waves.length-limit);
    if (waves.length && !frame) {
      collect(viewport);
      needsCollect = false;
      frame = requestAnimationFrame(draw);
    }
  }

  document.addEventListener('pointermove',event => {
    // Touch events continue during native scrolling, after pointercancel.
    if (event.pointerType === 'touch') return;
    if (!acceptsTarget(event.target)) {lastPoint=null;return;}
    const samples = event.getCoalescedEvents ? event.getCoalescedEvents() : [];
    trace(samples.length ? samples.slice(-8) : [event]);
  },{passive:true});
  const traceTouch = event => {
    if (event.touches.length !== 1 || !acceptsTarget(event.target)) {lastPoint=null;return;}
    const touch = event.touches[0];
    if (!acceptsTarget(document.elementFromPoint(touch.clientX,touch.clientY))) {lastPoint=null;return;}
    trace([touch]);
  };
  document.addEventListener('touchstart',event => {lastPoint=null;traceTouch(event);},{passive:true});
  document.addEventListener('touchmove',traceTouch,{passive:true});
  const endTouch = () => {lastPoint=null;};
  document.addEventListener('touchend',endTouch,{passive:true});
  document.addEventListener('touchcancel',endTouch,{passive:true});
  const onScroll = () => {if (waves.length) needsCollect=true;};
  (ocean?.scrollElement || window).addEventListener('scroll',onScroll,{passive:true});
  window.addEventListener('resize',reset,{passive:true});
  window.addEventListener('blur',reset);
  window.visualViewport?.addEventListener('resize',reset,{passive:true});
  document.documentElement.addEventListener('pointerleave',event => {
    if (event.pointerType !== 'touch') reset();
  });
  document.addEventListener('visibilitychange',reset);
  document.addEventListener('ocean:state',reset);
  reduced.addEventListener('change',reset);
  coarse.addEventListener('change',reset);
})();
