/* Local refraction: neutral displacement outside expanding pointer ripples. */
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const coarse = matchMedia('(pointer: coarse)');
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('aria-hidden', 'true');
  svg.style.cssText = 'position:absolute;width:0;height:0;pointer-events:none';
  const defs = document.createElementNS(ns, 'defs'); svg.append(defs); document.body.append(svg);
  const map = document.createElement('canvas');
  const ctx = map.getContext('2d');
  if (!ctx) return;
  let waves = [], targets = [], frame = 0, lastFrame = 0, lastPoint = null, needsCollect = false;
  const allowed = () => !reduced.matches && !document.hidden && !document.body.classList.contains('local-nav-open');
  function reset() {
    cancelAnimationFrame(frame); frame = 0; waves = []; lastPoint = null;
    targets.forEach(t => {t.el.style.filter = t.original;}); targets = []; defs.replaceChildren();
  }
  function collect() {
    targets.forEach(t => {t.el.style.filter = t.original;}); defs.replaceChildren();
    // Refract each complete panel, including its background, image and hover layer.
    // Gallery tiles stay independent so a long gallery never becomes one huge filter.
    const candidates = [...document.querySelectorAll(
      '.site-header,.masthead,.page-header,.project-cover,.grid__item-container,.project-module'
    )].filter(el => !el.matches('.project-module') || !el.querySelector('.grid__item-container'));
    const panels = candidates.filter(el => !candidates.some(parent => parent !== el && parent.contains(el)));
    targets = panels
      .filter(el => {const r = el.getBoundingClientRect(); return r.width && r.height && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;})
      .map((el, i) => {
        const rect = el.getBoundingClientRect();
        const filter = document.createElementNS(ns, 'filter');
        filter.id = `pond-${i}`;
        for (const [key, value] of Object.entries({filterUnits:'userSpaceOnUse',primitiveUnits:'userSpaceOnUse',x:0,y:0,width:rect.width,height:rect.height,'color-interpolation-filters':'sRGB'})) filter.setAttribute(key,value);
        const source = document.createElementNS(ns,'feImage');
        for (const [key,value] of Object.entries({x:-rect.left,y:-rect.top,width:innerWidth,height:innerHeight,preserveAspectRatio:'none',result:'ripples'})) source.setAttribute(key,value);
        const displacement = document.createElementNS(ns,'feDisplacementMap');
        for (const [key,value] of Object.entries({in:'SourceGraphic',in2:'ripples',scale:18,xChannelSelector:'R',yChannelSelector:'G'})) displacement.setAttribute(key,value);
        filter.append(source,displacement); defs.append(filter);
        return {el,rect,source,id:filter.id,original:el.style.filter};
      });
  }
  function draw(now) {
    frame = 0;
    if (!allowed()) {reset();return;}
    if (now-lastFrame < (coarse.matches ? 40 : 32)) {frame=requestAnimationFrame(draw);return;}
    lastFrame=now; waves=waves.filter(w=>now-w.time<950);
    if (!waves.length) {reset();return;}
    if (needsCollect) {collect();needsCollect=false;}
    const scale=coarse.matches ? .3 : .4, width=Math.ceil(innerWidth*scale),height=Math.ceil(innerHeight*scale);
    if(map.width!==width||map.height!==height){map.width=width;map.height=height;}
    const pixels=ctx.createImageData(width,height), data=pixels.data;
    for(let i=0;i<data.length;i+=4){data[i]=128;data[i+1]=128;data[i+2]=128;data[i+3]=255;}
    for(const wave of waves){
      const age=(now-wave.time)/950, radius=8+age*90, extent=radius+22;
      const centerX=wave.x-(scrollX-wave.scrollX),centerY=wave.y-(scrollY-wave.scrollY);
      const left=Math.max(0,Math.floor((centerX-extent)*scale)),right=Math.min(width,Math.ceil((centerX+extent)*scale));
      const top=Math.max(0,Math.floor((centerY-extent)*scale)),bottom=Math.min(height,Math.ceil((centerY+extent)*scale));
      for(let y=top;y<bottom;y++) for(let x=left;x<right;x++){
        const dx=x/scale-centerX,dy=y/scale-centerY,d=Math.hypot(dx,dy);
        if(d<1)continue;
        const envelope=Math.exp(-Math.pow((d-radius)/16,2));
        const force=Math.sin((d-radius)/5)*envelope*Math.pow(1-age,2)*36;
        const i=(y*width+x)*4;
        data[i]+=force*dx/d;data[i+1]+=force*dy/d;
      }
    }
    ctx.putImageData(pixels,0,0);
    const url=map.toDataURL();
    targets.forEach(t=>{t.source.setAttribute('href',url);t.el.style.filter=`url(#${t.id})`;});
    frame=requestAnimationFrame(draw);
  }
  function trace(samples) {
    if (!allowed()) return;
    for (const p of samples) {
      const point={x:p.clientX,y:p.clientY};
      const previous=lastPoint ? {x:lastPoint.x-(scrollX-lastPoint.scrollX),y:lastPoint.y-(scrollY-lastPoint.scrollY)} : null;
      const distance=previous?Math.hypot(point.x-previous.x,point.y-previous.y):0;
      const count=Math.min(24,Math.max(1,Math.ceil(distance/12)));
      for(let i=1;i<=count;i++){
        const t=i/count;
        waves.push({x:previous?previous.x+(point.x-previous.x)*t:point.x,y:previous?previous.y+(point.y-previous.y)*t:point.y,time:performance.now(),scrollX,scrollY});
      }
      lastPoint={...point,scrollX,scrollY};
    }
    waves=waves.slice(coarse.matches ? -32 : -48);
    if(!frame){collect();needsCollect=false;frame=requestAnimationFrame(draw);}
  }
  document.addEventListener('pointermove',event=>{
    // Touch events continue during native scrolling, after pointercancel.
    if(event.pointerType==='touch')return;
    const samples=event.getCoalescedEvents ? event.getCoalescedEvents() : [];
    trace(samples.length?samples:[event]);
  },{passive:true});
  document.addEventListener('touchstart',event=>{
    lastPoint=null;
    if(event.touches.length===1)trace([event.touches[0]]);
  },{passive:true});
  document.addEventListener('touchmove',event=>{
    if(event.touches.length===1)trace([event.touches[0]]);
    else lastPoint=null;
  },{passive:true});
  const endTouch=()=>{lastPoint=null;};
  document.addEventListener('touchend',endTouch,{passive:true});
  document.addEventListener('touchcancel',endTouch,{passive:true});
  window.addEventListener('resize',reset,{passive:true});
  window.addEventListener('scroll',()=>{if(waves.length)needsCollect=true;},{passive:true});
  window.addEventListener('blur',reset);
  document.documentElement.addEventListener('pointerleave',event=>{if(event.pointerType!=='touch')reset();});
  document.addEventListener('visibilitychange',reset);
  reduced.addEventListener('change',reset);coarse.addEventListener('change',reset);
})();
